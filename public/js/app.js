import { AppState } from "./state/app-state.js";
import { ApiClient } from "./services/api-client.js";
import { AuthService } from "./services/auth-service.js";
import { DocumentService } from "./services/document-service.js";
import { ExportService } from "./services/export-service.js";
import { ThumbnailService } from "./services/thumbnail-service.js";
import { FolderService } from "./services/folder-service.js";
import { Navigation } from "./views/navigation.js";
import { ModalManager } from "./views/modal-manager.js";
import { AppController } from "./controllers/app-controller.js";
import { DocumentController } from "./controllers/document-controller.js";
import { ExportController } from "./controllers/export-controller.js";
import { Router } from "./router/Router.js";
import { HistoryState } from "./state/HistoryState.js";
import { configureRoutes, ROUTES } from "./router/routes.js";

// Core instances
const state = new AppState();
const apiClient = new ApiClient();

// Services bundle
const folderService = new FolderService();
const services = {
  authService: new AuthService(apiClient),
  documentService: new DocumentService(apiClient, folderService),
  exportService: new ExportService(apiClient),
  thumbnailService: new ThumbnailService(),
  folderService,
  apiClient: apiClient,
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

// Wire up modal manager handlers
modalManager.setHandlers({
  onStartExport: (options) => exportController.startExport(options),
  onCancelExport: () => exportController.cancelExport(),
});

// Expose documentController globally for PartDetailView back button access
window.__documentController = documentController;

// Boot application
const appController = new AppController(
  state,
  services,
  navigation,
  controllers
);

(async () => {
  try {
    // Initialize router first before auth check
    const router = new Router();
    
    // Register per-view strategies to preserve UI state (tabs, selections) across navigation
    const historyState = new HistoryState(state, {
      scrollSelectors: ["[data-scroll-preserve]"],
      strategies: {
        documentList: {
          capture: () => {
            try {
              const selectedIds = Array.from(
                document.querySelectorAll(".doc-checkbox:checked")
              ).map((cb) => cb.value);
              const selectAll = !!document.querySelector("#selectAll")?.checked;
              const searchQuery =
                document.querySelector("#searchInput")?.value || "";
              return { selectedIds, selectAll, searchQuery };
            } catch {
              return { selectedIds: [], selectAll: false, searchQuery: "" };
            }
          },
          restore: (snap) => {
            try {
              if (!snap || typeof snap !== "object") return;
              const searchInput = document.querySelector("#searchInput");
              if (searchInput && typeof snap.searchQuery === "string") {
                searchInput.value = snap.searchQuery;
              }
              const boxes = Array.from(
                document.querySelectorAll(".doc-checkbox")
              );
              const set = new Set(
                Array.isArray(snap.selectedIds) ? snap.selectedIds : []
              );
              boxes.forEach((cb) => {
                cb.checked = set.has(cb.value);
              });
              const selectAllEl = document.querySelector("#selectAll");
              if (selectAllEl) {
                const checkedCount = boxes.filter((b) => b.checked).length;
                selectAllEl.checked =
                  checkedCount === boxes.length && boxes.length > 0;
                selectAllEl.indeterminate =
                  checkedCount > 0 && checkedCount < boxes.length;
              }
            } catch {
              // no-op
            }
          },
        },
        elementDetail: {
          capture: () => {
            try {
              const activeBtn = document.querySelector(".tab-btn.active");
              const activeTab = activeBtn?.getAttribute("data-tab") || "parts";
              return { activeTab };
            } catch {
              return { activeTab: "parts" };
            }
          },
          restore: (snap) => {
            try {
              const wanted = snap?.activeTab || "parts";
              const btns = Array.from(document.querySelectorAll(".tab-btn"));
              const panels = Array.from(
                document.querySelectorAll(".tab-panel")
              );
              btns.forEach((b) => {
                const t = b.getAttribute("data-tab");
                if (t === wanted) b.classList.add("active");
                else b.classList.remove("active");
              });
              panels.forEach((p) => {
                const id = p.id || "";
                const tab = id.endsWith("-tab") ? id.slice(0, -4) : id;
                if (tab === wanted) p.classList.add("active");
                else p.classList.remove("active");
              });
            } catch {
              // no-op
            }
          },
        },
      },
    });

    // Expose router and historyState to documentController for link generation
    documentController.router = router;
    documentController.historyState = historyState;

    // Configure routes with controller instance so restored state flows through correctly
    configureRoutes(router, {
      app: {
        showHome: () => {
          const s = state.getState();
          navigation.navigateTo(s.isAuthenticated ? "dashboard" : "landing");
        },
        showDashboard: () => navigation.navigateTo("dashboard"),
        showNotFound: (path) => console.warn("Route not found:", path),
      },
      document: documentController,
      export: {
        show: () => {},
      },
    });

    // Start router first
    router.start();

    // Initialize app with delayed auth check to allow session to settle after OAuth callback
    await new Promise(resolve => setTimeout(resolve, 300));
    await appController.init();

    // Set default route based on current hash after auth check completes
    const currentHash = window.location.hash;
    const currentState = state.getState();
    
    // Only set default route if no hash or on home/landing
    if (!currentHash || currentHash === '#/' || currentHash === '#/landing') {
      if (currentState.isAuthenticated) {
        // Authenticated users default to document list
        console.log('Setting default route to documents list');
        router.replace(ROUTES.DOCUMENT_LIST);
      } else {
        // Unauthenticated users stay on landing
        console.log('Setting default route to landing/home');
        router.replace(ROUTES.HOME);
      }
    } else {
      console.log('Preserving existing route:', currentHash);
    }
  } catch (err) {
    console.error("App initialization failed:", err);
  }
})();
