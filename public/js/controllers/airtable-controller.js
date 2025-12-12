/**
 * AirtableController - handles Airtable authentication and thumbnail upload workflows
 */

import { AirtableUploadView } from '../views/airtable-upload-view.js';
import { showToast } from '../utils/toast-notification.js';
import { ROUTES } from '../router/routes.js';

export class AirtableController {
  constructor(state, services, navigation) {
    this.state = state;
    this.airtableService = services.airtableService;
    this.navigation = navigation;
    this.router = null; // Set by app.js after initialization
    
    this.uploadView = null; // Lazy initialized
    this._isAuthenticated = false;
    this._previousPage = null;
    
    this._bindDashboardEvents();
  }

  /**
   * Bind event listeners for dashboard elements
   */
  _bindDashboardEvents() {
    // Airtable button in dashboard
    const airtableBtn = document.getElementById('airtableUploadBtn');
    if (airtableBtn) {
      airtableBtn.addEventListener('click', () => this._handleAirtableButtonClick());
    }
    
    // Back button from Airtable page
    const backBtn = document.getElementById('backFromAirtableBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._navigateBack());
    }
    
    // Listen for escape key to close modal/navigate back
    document.addEventListener('keydown', (e) => this._escapeHandler(e));
  }

  /**
   * Escape key handler
   */
  _escapeHandler(e) {
    if (e.key === 'Escape') {
      const currentPage = this.navigation.getCurrentPage?.();
      if (currentPage === 'airtableUpload') {
        this._navigateBack();
      }
    }
  }

  /**
   * Handle Airtable button click - check auth status and show appropriate UI
   */
  async _handleAirtableButtonClick() {
    try {
      // Store current page for back navigation
      this._previousPage = this.navigation.getCurrentPage?.() || 'dashboard';
      
      // Check Airtable auth status
      const status = await this.airtableService.getAuthStatus();
      this._isAuthenticated = status.authenticated;
      
      if (this._isAuthenticated) {
        // Navigate to Airtable upload page
        this.show();
      } else {
        // Show login prompt or redirect to Airtable OAuth
        const shouldLogin = confirm(
          'You need to sign in to Airtable to upload thumbnails.\n\n' +
          'Click OK to sign in with Airtable.'
        );
        
        if (shouldLogin) {
          this.airtableService.login();
        }
      }
    } catch (error) {
      console.error('[AirtableController] Error checking auth status:', error);
      showToast('Failed to check Airtable connection status');
    }
  }

  /**
   * Show the Airtable upload page
   * @param {Object} restoredState - Optional restored state from router
   */
  async show(restoredState = null) {
    // Navigate to airtable page
    this.navigation.navigateTo('airtableUpload');
    
    // Initialize view if needed
    if (!this.uploadView) {
      this.uploadView = new AirtableUploadView(
        '#airtableUploadContainer',
        this,
        this.airtableService
      );
    }
    
    // Render the upload view
    await this.uploadView.render(this._isAuthenticated);
    
    // Restore state if provided
    if (restoredState && typeof this.uploadView.restoreState === 'function') {
      this.uploadView.restoreState(restoredState);
    }
  }

  /**
   * Navigate back to previous page
   */
  _navigateBack() {
    if (this.router) {
      this.router.navigate(ROUTES.DOCUMENT_LIST);
    } else {
      this.navigation.navigateTo(this._previousPage || 'dashboard');
    }
  }

  /**
   * Handle Airtable login
   */
  login() {
    this.airtableService.login();
  }

  /**
   * Handle Airtable logout
   */
  async logout() {
    try {
      await this.airtableService.logout();
      this._isAuthenticated = false;
      showToast('Signed out of Airtable');
      
      // Re-render if on airtable page
      if (this.uploadView && this.navigation.getCurrentPage?.() === 'airtableUpload') {
        await this.uploadView.render(false);
      }
    } catch (error) {
      console.error('[AirtableController] Logout error:', error);
      showToast('Failed to sign out of Airtable');
    }
  }

  /**
   * Refresh auth status and update UI
   */
  async refreshAuthStatus() {
    try {
      const status = await this.airtableService.getAuthStatus();
      this._isAuthenticated = status.authenticated;
      return status;
    } catch (error) {
      console.error('[AirtableController] Error refreshing auth status:', error);
      this._isAuthenticated = false;
      return { authenticated: false };
    }
  }

  /**
   * Get list of accessible Airtable bases
   */
  async getBases() {
    return this.airtableService.getBases();
  }

  /**
   * Get tables in a base
   */
  async getTables(baseId) {
    return this.airtableService.getTables(baseId);
  }

  /**
   * Get table schema (fields)
   */
  async getTableSchema(baseId, tableId) {
    return this.airtableService.getTableSchema(baseId, tableId);
  }

  /**
   * Upload thumbnails from ZIP file
   * @param {File} zipFile - The ZIP file containing thumbnails
   * @param {Object} config - Upload configuration
   * @param {boolean} config.dryRun - Preview matches without uploading
   * @param {string} config.baseId - Airtable base ID
   * @param {string} config.tableId - Airtable table ID
   * @param {string} config.partNumberField - Field name for part number matching
   * @param {string} config.thumbnailField - Field name for thumbnail attachment
   * @param {function} config.onProgress - Progress callback
   * @returns {Promise<Object>} Upload results
   */
  async uploadThumbnails(zipFile, config) {
    return this.airtableService.uploadThumbnails(zipFile, config);
  }

  /**
   * Capture current state for history
   */
  captureState() {
    if (this.uploadView && typeof this.uploadView.captureState === 'function') {
      return this.uploadView.captureState();
    }
    return null;
  }
}
