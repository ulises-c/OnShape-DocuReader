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
import { Router } from "./router/Router.js";
import { HistoryState } from "./state/HistoryState.js";
import { configureRoutes, ROUTES } from "./router/routes.js";

if (window.location.pathname === "/dashboard") {
  window.history.replaceState({}, "", "/");
}

// Core instances
const state = new AppState();
const apiClient = new ApiClient();

// Check auth status immediately
async function checkAuthStatus() {
  try {
    const { authenticated } = await apiClient.getAuthStatus();
    if (!authenticated && window.location.pathname !== "/") {
      const auth = new AuthService(apiClient);
      auth.login();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }
}
checkAuthStatus();

// Services bundle
const services = {
  authService: new AuthService(apiClient),
  documentService: new DocumentService(apiClient),
  exportService: new ExportService(apiClient),
  thumbnailService: new ThumbnailService(),
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

// Initialize app first to perform auth check and initial data load,
// then wire the router so it can take over hash-based navigation safely.
(async () => {
  try {
    await appController.init();

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

    // Inject routing dependencies into controllers post-init (keeps existing boot flow intact)
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

      // Export entry is optional in current UI; keep a no-op to satisfy route table
      export: {
        show: () => {},
      },
    });

    // Start router after routes are configured
    router.start();

    // Optionally set an authenticated default route for deep-link consistency
    // If there is no hash, default to /documents for authenticated users, else to home
    try {
      const isAuthenticated = !!state.getState().isAuthenticated;
      if (!window.location.hash) {
        router.replace(isAuthenticated ? ROUTES.DOCUMENT_LIST : ROUTES.HOME);
      }
    } catch (_) {
      // ignore
    }
  } catch (err) {
    console.error("App initialization failed:", err);
  }
})();
