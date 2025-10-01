/**
 * AppController - main orchestration
 */

import { qs } from '../utils/dom-helpers.js';
import { ROUTES } from '../../router/routes.js';

export class AppController {
  constructor(state, services, navigation, controllers) {
    this.state = state;
    this.authService = services.authService;
    this.documentController = controllers.documentController;
    this.exportController = controllers.exportController;
    this.navigation = navigation;
    this.bound = false;
  }

  async init() {
    if (window.location.pathname === '/dashboard') {
      window.history.replaceState({}, '', '/');
    }

    this.bindGlobalEvents();

    try {
      const status = await this.authService.checkStatus();
      const isAuthenticated = !!status.authenticated;
      this.state.setState({ isAuthenticated });

      if (isAuthenticated) {
        const user = await this.authService.getUser().catch(() => null);
        if (user) {
          this.state.setState({ user });
          const userName = document.getElementById('userName');
          if (userName) userName.textContent = user.name || 'Unknown User';
        }

        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
          authStatus.textContent = 'Authenticated ✓';
          authStatus.style.color = '#28a745';
        }
        this.navigation.navigateTo('dashboard');
        await this.documentController.loadDocuments();
      } else {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
          authStatus.textContent = 'Not authenticated';
          authStatus.style.color = '#dc3545';
        }
        this.navigation.navigateTo('landing');
      }
    } catch (e) {
      console.error('Error checking auth status:', e);
      this.navigation.navigateTo('landing');
    }
  }

  bindGlobalEvents() {
    if (this.bound) return;

    qs('#loginBtn')?.addEventListener('click', () => this.authService.login());
    qs('#logoutBtn')?.addEventListener('click', async () => {
      await this.authService.logout().catch(() => {});
      this.state.replaceState({
        user: null,
        isAuthenticated: false,
        currentPage: 'landing',
        documents: [],
        currentDocument: null,
        currentElement: null,
        currentPart: null,
        selectedDocuments: []
      });
      this.navigation.navigateTo('landing');
      if (this.documentController?.router) {
        try {
          this.documentController.router.replace(ROUTES.HOME);
        } catch {}
      }
      await this.init();
    });

    // Use router.back() to keep browser history coherent; fall back to Navigation if router is unavailable
    qs('#backBtn')?.addEventListener('click', () => {
      if (this.documentController?.router) {
        this.documentController.router.back();
      } else {
        this.navigation.navigateTo('dashboard');
      }
    });
    qs('#backToDocBtn')?.addEventListener('click', () => {
      if (this.documentController?.router) {
        this.documentController.router.back();
      } else {
        this.navigation.navigateTo('documentDetail');
      }
    });
    qs('#backToElementBtn')?.addEventListener('click', () => {
      if (this.documentController?.router) {
        this.documentController.router.back();
      } else {
        this.navigation.navigateTo('elementDetail');
      }
    });

    qs('#refreshBtn')?.addEventListener('click', () => this.documentController.loadDocuments());
    qs('#searchBtn')?.addEventListener('click', () => {
      const q = (qs('#searchInput')?.value || '').trim();
      this.documentController.search(q);
    });
    qs('#searchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const q = (qs('#searchInput')?.value || '').trim();
        this.documentController.search(q);
      }
    });

    qs('#getAllBtn')?.addEventListener('click', () => {
      console.log('Get All button clicked');
      this.exportController.showExportModal(this.state.getState().documents);
    });

    qs('#getSelectedBtn')?.addEventListener('click', () => {
      console.log('Get Selected button clicked');
      const selected = this.state.getState().selectedDocuments || [];
      if (selected.length === 0) {
        const err = document.getElementById('error');
        if (err) {
          err.textContent = 'No documents selected. Please select at least one document.';
          err.style.display = 'block';
        }
        return;
      }
      this.exportController.showExportModal(selected);
    });

    qs('#getDocumentBtn')?.addEventListener('click', () => this.documentController.getComprehensiveDocument());

    this.bound = true;
  }
}
