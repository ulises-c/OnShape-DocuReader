/**
 * Thin entry point for OnShape DocuReader (modular)
 */

import { AppState } from './state/app-state.js';
import { ApiClient } from './services/api-client.js';
import { AuthService } from './services/auth-service.js';
import { DocumentService } from './services/document-service.js';
import { ExportService } from './services/export-service.js';
import { ThumbnailService } from './services/thumbnail-service.js';

import { Navigation } from './views/navigation.js';
import { ModalManager } from './views/modal-manager.js';

import { DocumentController } from './controllers/document-controller.js';
import { ExportController } from './controllers/export-controller.js';
import { AppController } from './controllers/app-controller.js';

// Initialize core services
const state = new AppState();
const apiClient = new ApiClient();

const services = {
  authService: new AuthService(apiClient),
  documentService: new DocumentService(apiClient),
  exportService: new ExportService(apiClient)
};

const navigation = new Navigation();
const thumbnailService = new ThumbnailService();
const modalManager = new ModalManager();

// Controllers
const documentController = new DocumentController(state, services, navigation, thumbnailService);
const exportController = new ExportController(state, services, modalManager);

// App controller
const appController = new AppController(
  state,
  services,
  navigation,
  {
    documentController,
    exportController
  }
);

// Start app
appController.init();
