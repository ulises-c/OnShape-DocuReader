import { AppState } from "./state/app-state.js";
import { ApiClient } from "./services/api-client.js";
import { AuthService } from "./services/auth-service.js";
import { DocumentService } from "./services/document-service.js";
import { ExportService } from "./services/export-service.js";
import { ThumbnailService } from "./services/thumbnail-service.js";
import { Navigation } from "./views/navigation.js";
import { ModalManager } from "./views/modal-manager.js";
import { AppController } from "./controllers/app-controller.js";
import { DocumentController } from "./controllers/document-controller.js";
import { ExportController } from "./controllers/export-controller.js";

// Handle OAuth redirect
if (window.location.pathname === "/dashboard") {
  window.history.replaceState({}, "", "/");
}

// Core instances
const state = new AppState();
const apiClient = new ApiClient();

// Services bundle
const services = {
  authService: new AuthService(apiClient),
  documentService: new DocumentService(apiClient),
  exportService: new ExportService(apiClient),
  thumbnailService: new ThumbnailService(),
};

// Views
const navigation = new Navigation();
const modalManager = new ModalManager();

// Controllers
const documentController = new DocumentController(
  state,
  services,
  navigation,
  services.thumbnailService
);
const exportController = new ExportController(state, services, modalManager);

const controllers = {
  documentController,
  exportController,
};

// Wire up modal manager handlers after export controller exists
modalManager.setHandlers({
  onStartExport: (options) => exportController.startExport(options),
  onCancelExport: () => exportController.cancelExport(),
});

// Boot application
const appController = new AppController(
  state,
  services,
  navigation,
  controllers
);
appController.init();
