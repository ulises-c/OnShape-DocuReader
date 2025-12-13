/**
 * AirtableController - handles Airtable authentication and thumbnail upload workflows
 */

import { AirtableUploadView } from '../views/airtable-upload-view.js';
import { ROUTES } from '../router/routes.js';
import { showToast } from '../utils/toast-notification.js';

export class AirtableController {
  constructor(state, services, navigation) {
    this.state = state;
    this.airtableService = services.airtableService;
    this.navigation = navigation;
    this.router = null; // Set by app.js after router initialization

    // Initialize view
    this.uploadView = new AirtableUploadView(
      '#airtableUploadContainer',
      this,
      this.airtableService
    );

    // Cache auth status to avoid repeated checks
    this._authStatusCache = null;
    this._authStatusCacheTime = 0;
    this._AUTH_CACHE_TTL = 30000; // 30 seconds

    this._bindDashboardEvents();
  }

  _bindDashboardEvents() {
    // Airtable button in dashboard header
    const airtableBtn = document.getElementById('airtableUploadBtn');
    if (airtableBtn) {
      airtableBtn.addEventListener('click', () => this._handleAirtableButtonClick());
    }

    // Back button from Airtable upload page
    const backBtn = document.getElementById('backFromAirtableBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._navigateBack());
    }

    // Listen for escape key to close upload page
    document.addEventListener('keydown', this._escapeHandler.bind(this));

    // Initialize auth indicator on page load
    this.refreshAuthStatus();
  }

  _escapeHandler(e) {
    if (e.key === 'Escape') {
      const currentPage = this.navigation.getCurrentPage();
      if (currentPage === 'airtableUpload') {
        this._navigateBack();
      }
    }
  }

  /**
   * Handle Airtable button click in dashboard
   * If authenticated, go to upload page; otherwise, initiate login
   */
  async _handleAirtableButtonClick() {
    const status = await this.getAuthStatus();

    if (!status.configured) {
      showToast('Airtable is not configured on this server');
      return;
    }

    if (status.authenticated) {
      // Navigate to upload page
      if (this.router) {
        this.router.navigate(ROUTES.AIRTABLE_UPLOAD);
      } else {
        this.showUploadPage();
      }
    } else {
      // Initiate login
      this.login();
    }
  }

  /**
   * Show the Airtable upload page
   * @param {Object} restoredState - Optional state to restore
   */
  async showUploadPage(restoredState = null) {
    // Check auth status first
    const status = await this.getAuthStatus();

    if (!status.configured) {
      showToast('Airtable is not configured on this server');
      this._navigateBack();
      return;
    }

    // Navigate to upload page
    this.navigation.navigateTo('airtableUpload');

    // Render view with auth status
    await this.uploadView.render(status.authenticated);

    // Restore state if provided
    if (restoredState && typeof this.uploadView.restoreState === 'function') {
      this.uploadView.restoreState(restoredState);
    }
  }

  /**
   * Alias for showUploadPage for router compatibility
   */
  async show(restoredState = null) {
    return this.showUploadPage(restoredState);
  }

  _navigateBack() {
    if (this.router) {
      this.router.navigate(ROUTES.DOCUMENT_LIST);
    } else {
      this.navigation.navigateTo('dashboard');
    }
  }

  /**
   * Initiate Airtable OAuth login
   */
  login() {
    // Store current route to return after auth
    const returnTo = window.location.hash || '/#/airtable/upload';
    this.airtableService.login(returnTo);
  }

  /**
   * Logout from Airtable
   */
  async logout() {
    try {
      await this.airtableService.logout();
      this._authStatusCache = null;
      this.updateAuthIndicator(false);
      showToast('Logged out from Airtable');

      // Re-render upload view if on that page
      const currentPage = this.navigation.getCurrentPage();
      if (currentPage === 'airtableUpload') {
        await this.uploadView.render(false);
      }
    } catch (error) {
      console.error('[AirtableController] Logout error:', error);
      showToast('Failed to logout from Airtable');
    }
  }

  /**
   * Get cached auth status or fetch fresh
   * @returns {Promise<{configured: boolean, authenticated: boolean}>}
   */
  async getAuthStatus() {
    const now = Date.now();
    if (this._authStatusCache && (now - this._authStatusCacheTime) < this._AUTH_CACHE_TTL) {
      return this._authStatusCache;
    }

    try {
      const status = await this.airtableService.getAuthStatus();
      this._authStatusCache = status;
      this._authStatusCacheTime = now;
      return status;
    } catch (error) {
      console.error('[AirtableController] Error getting auth status:', error);
      return { configured: false, authenticated: false };
    }
  }

  /**
   * Refresh auth status and update UI
   */
  async refreshAuthStatus() {
    this._authStatusCache = null; // Force fresh fetch
    const status = await this.getAuthStatus();
    this.updateAuthIndicator(status.authenticated);
    return status;
  }

  /**
   * Update the auth indicator in the dashboard header
   * @param {boolean} isAuthenticated
   */
  updateAuthIndicator(isAuthenticated) {
    const indicator = document.getElementById('airtableAuthIndicator');
    if (!indicator) return;

    if (isAuthenticated) {
      indicator.classList.remove('unauthenticated');
      indicator.classList.add('authenticated');
      indicator.title = 'Connected to Airtable';
    } else {
      indicator.classList.remove('authenticated');
      indicator.classList.add('unauthenticated');
      indicator.title = 'Not connected to Airtable';
    }
  }
}
