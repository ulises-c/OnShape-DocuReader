### PARTIALLY COMPLETE

The thin entry point `public/js/app.js` exists but is **not properly wired up**.

Current `app.js` only passes 2 arguments:

```javascript
const appController = new AppController(state, apiClient);
```

But `AppController` expects 4 arguments:

```javascript
constructor(state, services, navigation, controllers);
```

The same issue exists for other controllers - they need proper service objects, not individual instances.

## What Needs to Be Updated

### 1. Update `CURRENT-PROMPT.md`

Change the task description to be more specific:

````markdown
# Task: Complete Phase 5 - Wire Up Entry Point

## Context

Phases 1-4 are complete. All modules exist but the entry point `public/js/app.js`
is not properly instantiating and connecting the dependencies.

## Current Issue

`public/js/app.js` (18 lines) exists but doesn't properly wire up:

- Service instances into a services object
- Navigation instance
- ModalManager instance
- Controller instances with correct dependencies

## Goal

Complete the dependency injection in `public/js/app.js` so that:

1. All services are instantiated and bundled into a services object
2. Navigation is instantiated
3. ModalManager is instantiated with proper dependencies
4. All controllers are instantiated with proper dependencies
5. AppController receives all 4 required arguments
6. Application boots successfully

## Expected Final Structure

```javascript
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
```
````

## Verification

After completion, verify:

- No console errors on load
- Login/logout works
- Document list displays
- Can view document details
- Can view elements and parts
- Export modal opens and functions
- All existing functionality preserved

```

```
