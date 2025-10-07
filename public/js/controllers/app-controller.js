/**
 * AppController - main orchestration
 */

import { qs } from '../utils/dom-helpers.js';
import { ROUTES } from '../router/routes.js';
import { exportAllDocumentsAsZip } from '../utils/massCSVExporter.js';

export class AppController {
  constructor(state, services, navigation, controllers) {
    this.state = state;
    this.authService = services.authService;
    this.documentService = services.documentService;
    this.apiClient = services.apiClient || services.documentService.api;
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

    qs('#exportCSVBtn')?.addEventListener('click', async () => {
      console.log('Export ASM/PRT CSVs button clicked');
      const btn = qs('#exportCSVBtn');
      const originalText = btn?.textContent;
      
      if (btn) {
        btn.textContent = '⏳ Exporting...';
        btn.disabled = true;
      }

      try {
        await exportAllDocumentsAsZip(this.apiClient, this.documentService);
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = '✅ ZIP export completed successfully!';
        successDiv.style.cssText = `
          background-color:#d4edda;border:1px solid #c3e6cb;color:#155724;
          padding:12px 20px;border-radius:5px;margin:10px 0;position:fixed;top:20px;right:20px;z-index:1000;
          box-shadow:0 2px 10px rgba(0,0,0,0.1);animation:slideIn 0.3s ease-out;
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 4000);
      } catch (err) {
        console.error('CSV export failed:', err);
        const errDiv = document.createElement('div');
        errDiv.className = 'error-message';
        errDiv.textContent = `❌ Export failed: ${err.message}`;
        errDiv.style.cssText = `
          background-color:#f8d7da;border:1px solid #f5c6cb;color:#721c24;
          padding:12px 20px;border-radius:5px;margin:10px 0;position:fixed;top:20px;right:20px;z-index:1000;
          box-shadow:0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(errDiv);
        setTimeout(() => errDiv.remove(), 4000);
      } finally {
        if (btn) {
          btn.textContent = originalText || '📊 Export ASM/PRT CSVs';
          btn.disabled = false;
        }
      }
    });

    this.bound = true;
  }
}
