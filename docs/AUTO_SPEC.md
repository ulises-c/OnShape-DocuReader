# OnShape-DocuReader - Project Specification

> Generated: 2025-12-12 15:31:24

**Using OnShape API to gather information about documents**

## Scripts

| Command | Action |
|---------|--------|
| `npm run build` | `tsc && vite build` |
| `npm run start` | `node dist/index.js` |
| `npm run dev` | `concurrently "nodemon src/index.ts" "vite" "npm ru...` |
| `npm run open-browser` | `sh -c 'sleep 3 && wslview http://localhost:5173'` |
| `npm run clean` | `rimraf dist` |
| `npm run prebuild` | `npm run clean && npm run spec` |
| `npm run test` | `echo "Error: no test specified" && exit 1` |
| `npm run spec` | `python project_tools/generate_spec.py . -o docs/AU...` |
| `npm run spec:preview` | `python project_tools/generate_spec.py . --stdout -...` |

## Directory Structure

```
OnShape-DocuReader/
├── public/
│   ├── css/
│   │   ├── base/
│   │   │   ├── reset.css
│   │   │   ├── typography.css
│   │   │   └── variables.css
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── cards.css
│   │   │   ├── forms.css
│   │   │   ├── modals.css
│   │   │   ├── pagination.css
│   │   │   ├── tables.css
│   │   │   └── tabs.css
│   │   ├── layout/
│   │   │   ├── container.css
│   │   │   └── header.css
│   │   ├── views/
│   │   │   ├── airtable-upload.css
│   │   │   ├── document-detail.css
│   │   │   ├── documents.css
│   │   │   ├── element-detail.css
│   │   │   ├── export-filter-modal.css
│   │   │   ├── export.css
│   │   │   ├── landing.css
│   │   │   └── part-detail.css
│   │   └── main.css
│   ├── js/
│   │   ├── controllers/
│   │   │   ├── airtable-controller.js
│   │   │   ├── app-controller.js
│   │   │   ├── document-controller.js
│   │   │   ├── export-controller.js
│   │   │   └── SPEC.min.md
│   │   ├── router/
│   │   │   ├── Router.js
│   │   │   ├── routes.js
│   │   │   └── SPEC.min.md
│   │   ├── services/
│   │   │   ├── airtable-service.js
│   │   │   ├── api-client.js
│   │   │   ├── auth-service.js
│   │   │   ├── document-service.js
│   │   │   ├── export-service.js
│   │   │   ├── SPEC.min.md
│   │   │   └── thumbnail-service.js
│   │   ├── state/
│   │   │   ├── app-state.js
│   │   │   ├── HistoryState.js
│   │   │   └── SPEC.min.md
│   │   ├── utils/
│   │   │   ├── aggregateBomToCSV.js
│   │   │   ├── bomToCSV.js
│   │   │   ├── clipboard.js
│   │   │   ├── dom-helpers.js
│   │   │   ├── download.js
│   │   │   ├── file-download.js
│   │   │   ├── format-helpers.js
│   │   │   ├── fullAssemblyExporter.js
│   │   │   ├── getCSV.js
│   │   │   ├── getFilteredCSV.js
│   │   │   ├── massCSVExporter.js
│   │   │   ├── SPEC.min.md
│   │   │   └── toast-notification.js
│   │   ├── views/
│   │   │   ├── actions/
│   │   │   │   ├── document-actions.js
│   │   │   │   ├── element-actions.js
│   │   │   │   └── SPEC.min.md
│   │   │   ├── helpers/
│   │   │   │   ├── document-info-renderer.js
│   │   │   │   ├── element-list-renderer.js
│   │   │   │   ├── pagination-renderer.js
│   │   │   │   └── SPEC.min.md
│   │   │   ├── airtable-upload-view.js
│   │   │   ├── base-view.js
│   │   │   ├── document-detail-view.js
│   │   │   ├── document-list-view.js
│   │   │   ├── element-detail-view.js
│   │   │   ├── export-filter-modal.js
│   │   │   ├── export-progress-modal.js
│   │   │   ├── export-stats-modal.js
│   │   │   ├── full-extract-modal.js
│   │   │   ├── modal-manager.js
│   │   │   ├── navigation.js
│   │   │   ├── part-detail-view.js
│   │   │   ├── SPEC.min.md
│   │   │   └── workspace-view.js
│   │   ├── app.js
│   │   └── SPEC.min.md
│   ├── dashboard.html
│   ├── index.html
│   └── SPEC.min.md
├── src/
│   ├── config/
│   │   ├── airtable.ts
│   │   ├── oauth.ts
│   │   └── SPEC.min.md
│   ├── routes/
│   │   ├── airtable-api.ts
│   │   ├── airtable-auth.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── SPEC.min.md
│   ├── services/
│   │   ├── airtable-api-client.ts
│   │   ├── airtable-oauth-service.ts
│   │   ├── airtable-thumbnail-service.ts
│   │   ├── api-call-cost.ts
│   │   ├── api-usage-tracker.ts
│   │   ├── oauth-service.ts
│   │   ├── onshape-api-client.ts
│   │   ├── session-storage.ts
│   │   ├── SPEC.min.md
│   │   └── usage-db.ts
│   ├── types/
│   │   ├── airtable.d.ts
│   │   ├── onshape.ts
│   │   ├── session.d.ts
│   │   ├── SPEC.min.md
│   │   └── usage.d.ts
│   ├── index.ts
│   └── SPEC.min.md
├── LICENSE
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.js

```

## Overview

- **Files:** 66
- **Lines:** 14,697
- **Routes:** 53
- **TODOs:** 1

## API Routes

- `USE /auth (src/index.ts)`
- `USE /auth/airtable (src/index.ts)`
- `USE /api (src/index.ts)`
- `USE /api/airtable (src/index.ts)`
- `GET / (src/index.ts)`
- `GET /dashboard (src/index.ts)`
- `GET /config (src/routes/airtable-api.ts)`
- `GET /bases (src/routes/airtable-api.ts)`
- `GET /bases/:baseId/tables (src/routes/airtable-api.ts)`
- `GET /bases/:baseId/tables/:tableId/schema (src/routes/airtable-api.ts)`
- `GET /bases/:baseId/tables/:tableId/records (src/routes/airtable-api.ts)`
- `POST /upload-thumbnails (src/routes/airtable-api.ts)`
- `POST /find-record (src/routes/airtable-api.ts)`
- `GET /login (src/routes/airtable-auth.ts)`
- `GET /callback (src/routes/airtable-auth.ts)`
- `GET /status (src/routes/airtable-auth.ts)`
- `POST /logout (src/routes/airtable-auth.ts)`
- `POST /refresh (src/routes/airtable-auth.ts)`
- `GET /user (src/routes/api.ts)`
- `GET /documents (src/routes/api.ts)`
- `GET /documents/:id (src/routes/api.ts)`
- `GET /documents/:id/versions (src/routes/api.ts)`
- `GET /documents/:id/branches (src/routes/api.ts)`
- `GET /documents/:id/branches (src/routes/api.ts)`
- `GET /documents/:id/combined-history (src/routes/api.ts)`
- `GET /documents/:id/history (src/routes/api.ts)`
- `GET /documents/:id/comprehensive (src/routes/api.ts)`
- `GET /documents/:id/parent (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements (src/routes/api.ts)`
- `GET /documents/:id/versions/:vid/elements (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements/:eid/parts (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements/:eid/assemblies (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements/:eid/bom (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements/:eid/metadata (src/routes/api.ts)`
- `GET /documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties (src/routes/api.ts)`
- `GET /onshape/folders (src/routes/api.ts)`
- `GET /onshape/folders/:id (src/routes/api.ts)`
- `GET /export/all (src/routes/api.ts)`
- `GET /export/stream (src/routes/api.ts)`
- `GET /export/directory-stats (src/routes/api.ts)`
- `POST /export/prepare-assemblies (src/routes/api.ts)`
- `GET /export/aggregate-bom-stream (src/routes/api.ts)`
- `GET /export/aggregate-bom (src/routes/api.ts)`
- `GET /thumbnail-proxy (src/routes/api.ts)`
- `GET /usage/stats (src/routes/api.ts)`
- `GET /login (src/routes/auth.ts)`
- `GET /callback (src/routes/auth.ts)`
- `GET /status (src/routes/auth.ts)`
- `POST /logout (src/routes/auth.ts)`
- `GET /meta/bases (src/services/airtable-api-client.ts)`
- ... and 3 more

## Active TODOs

- TODO: Check for edge cases, e.g. commas, quotes in values (bomToCSV.js)

## Modules

### 📁 Root

#### 📄 `vite.config.js` (36 lines)

**Dependencies:** `vite, url, path`

### 📁 public/js

#### ⭐ `app.js` (213 lines)

### 📁 public/js/controllers

#### 📄 `airtable-controller.js` (211 lines)

_AirtableController - handles Airtable authentication and thumbnail upload workflows_

**class AirtableController**
Methods:
  - `_bindDashboardEvents()`
  - `_escapeHandler(e)`
  - `_handleAirtableButtonClick()`
  - `show(restoredState = null)`
  - `_navigateBack()`
  - `login()`
  - `logout()`
  - `refreshAuthStatus()`

#### 📄 `app-controller.js` (118 lines)

**class AppController**
Properties: `isAuthenticated: !!status.authenticated,`, `isAuthenticated: false,`, `user: null,`, `documents: [],`, `selectedDocuments: [],`
Methods:
  - `init()`
  - `bindGlobalEvents()`
  - `updateAuthUI(state)`

#### 📄 `document-controller.js` (974 lines)

_DocumentController - orchestrates document flows_

**class DocumentController**
Properties: `currentPage: 1,`, `pageSize: 20,`, `totalCount: 0,`, `totalPages: 0,`, `currentFolderId: null,`
Methods:
  - `_bindDashboardEvents()`
  - `navigateToDocument(documentId)`
  - `showDocument(documentId, restoredState)`
  - `showList(restoredState)`
  - `_initializeWorkspace(restoredState)`
  - `loadWorkspaceRoot()`
  - `loadFolder(folderId, updateBreadcrumbs = true, folderName = null)`
  - `navigateToFolder(folderId, folderName)`

#### 📄 `export-controller.js` (65 lines)

_ExportController - orchestrates export workflow_

**class ExportController**
Properties: `onStartExport: (options)`, `onCancelExport: ()`
Methods:
  - `showExportModal(selectedDocuments = null)`
  - `startExport(options)`
  - `cancelExport()`

### 📁 public/js/router

#### 📄 `Router.js` (374 lines)

_Lightweight hash-based Router. Responsibilities: - Register route patterns with handlers - Parse hash-based URLs and extract params and query - Manage browser history with pushState/replaceState + hashchange/popstate - Notify subscribers on route changes Notes: - Handlers receive (params, state, con_

#### 📄 `routes.js` (145 lines)

_Route definitions and configuration. Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers - pathTo(pattern, params?, query?) helper to build paths with params and query This module is framework-agnostic and uses optional_

**Functions:**
- `configureRoutes(router, controllers = {})`
  _Route definitions and configuration. Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers - pathTo(pattern, params?, query?) helper to build paths with params and query This module is framework-agnostic and uses optional_
- `pathTo(pattern, params = {}, query = undefined)`
  _Route definitions and configuration. Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers - pathTo(pattern, params?, query?) helper to build paths with params and query This module is framework-agnostic and uses optional_

### 📁 public/js/services

#### 📄 `airtable-service.js` (136 lines)

_AirtableService - handles Airtable API interactions from frontend_

**class AirtableService**
_AirtableService - handles Airtable API interactions from frontend_
Properties: `method: 'POST',`, `body: formData`
Methods:
  - `getAuthStatus()`
  - `login()`
  - `logout()`
  - `getBases()`
  - `getTables(baseId)`
  - `getTableSchema(baseId, tableId)`
  - `uploadThumbnails(zipFile, config)`
  - `startStreamingUpload(zipFile, config, onProgress)`

#### 📄 `api-client.js` (373 lines)

_Get directory statistics (pre-scan without fetching BOMs)._

**class ApiClient**
Properties: `limit: String(limit),`, `offset: String(offset)`, `delay: String(delayMs)`, `method: 'POST',`, `headers: { 'Content-Type': 'application/json' },`
Methods:
  - `getAuthStatus()`
  - `logout()`
  - `getUser()`
  - `getDocuments(limit = 20, offset = 0)`
  - `getDocument(documentId)`
  - `getDocumentVersions(documentId)`
  - `getDocumentBranches(documentId)`
  - `getCombinedDocumentHistory(documentId)`

#### 📄 `auth-service.js` (41 lines)

**class AuthService**
Methods:
  - `checkStatus()`
  - `login()`
  - `logout()`
  - `getUser()`

#### 📄 `document-service.js` (169 lines)

_DocumentService - document-related operations_

**class DocumentService**
_DocumentService - document-related operations_
Properties: `indented: String(!flatten), // false for flattened, true for structured`, `generateIfAbsent: "false",`, `onlyVisibleColumns: "false",  // Include all columns, not just visible ones`, `ignoreSubassemblyBomBehavior: "false",  // Respect subassembly BOM behavior settings`, `includeItemMicroversions: "true",  // Include microversion info for each item`
Methods:
  - `getAll(limit = 20, offset = 0)`
  - `getById(documentId)`
  - `getVersions(documentId)`
  - `getBranches(documentId)`
  - `getCombinedHistory(documentId)`
  - `getElements(documentId, workspaceId)`
  - `getParts(documentId, workspaceId, elementId)`
  - `getAssemblies(documentId, workspaceId, elementId)`

#### 📄 `export-service.js` (60 lines)

_ExportService - executes export workflows_

**class ExportService**
_ExportService - executes export workflows_
Properties: `format: options.format ?? 'json',`, `includeBasicInfo: String(!!options.includeBasicInfo),`, `includeElements: String(!!options.includeElements),`, `includeParts: String(!!options.includeParts),`, `includeAssemblies: String(!!options.includeAssemblies),`
Methods:
  - `execute(options)`
  - `stream(options, handlers)`

#### 📄 `thumbnail-service.js` (43 lines)

_ThumbnailService - image handling and fallbacks_

**class ThumbnailService**
_ThumbnailService - image handling and fallbacks_
Methods:
  - `setup(docId, originalUrl, proxyUrl)`

### 📁 public/js/state

#### 📄 `HistoryState.js` (355 lines)

_HistoryState - manages capture/restore of view/application state for navigation. Design: - Works with browser history.state to persist lightweight, serializable view state. - Captures scroll positions and optionally view-specific state via injected strategies. - Integrates with an external state man_

#### 📄 `app-state.js` (115 lines)

**class AppState**
Properties: `exportSelection: {`, `documentIds: newIds`, `exportSelection: {`, `folderIds: newIds`, `exportSelection: {`
Methods:
  - `subscribe(listener)`
  - `getState()`
  - `setState(patch)`
  - `replaceState(newState)`
  - `toggleDocumentSelection(documentId)`
  - `toggleFolderSelection(folderId)`
  - `clearExportSelection()`
  - `getExportSelectionCount()`

### 📁 public/js/utils

#### 📄 `aggregateBomToCSV.js` (116 lines)

_Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging._

**Functions:**
- `aggregateBomToCSV(aggregateResult, options = {})`
  _Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging._

#### 📄 `bomToCSV.js` (54 lines)

_Convert Onshape BOM JSON to CSV._

**Functions:**
- `bomToCSV(bomJson)`

#### 📄 `clipboard.js` (25 lines)

_Clipboard utilities_

**Functions:**
- `async copyToClipboard(text)`
  _Clipboard utilities_

#### 📄 `dom-helpers.js` (34 lines)

_DOM helpers and safe HTML utilities_

**Functions:**
- `qs(selector, root = document)`
  _DOM helpers and safe HTML utilities_
- `qsa(selector, root = document)`
- `on(el, event, handler, options)`
- `delegate(root, selector, eventName, handler)`
- `escapeHtml(text)`

#### 📄 `download.js` (16 lines)

_Download helpers_

**Functions:**
- `downloadJson(data, filenamePrefix = 'onshape-export')`
  _Download helpers_

#### 📄 `file-download.js` (33 lines)

_Generic file download utilities_

**Functions:**
- `downloadJson(data, filename)`
  _Generic file download utilities_
- `downloadCsv(csvString, filename)`
- `createDownloadLink(blob, filename)`

#### 📄 `format-helpers.js` (24 lines)

_Formatting helpers (pure functions)_

**Functions:**
- `formatDateWithUser(dateStr, userObj)`
  _Formatting helpers (pure functions)_

#### 📄 `fullAssemblyExporter.js` (699 lines)

_Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file_

**Functions:**
- `sanitizeForFilename(str, maxLength = MAX_FILENAME_LENGTH)`
  _Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file / import { bomToCSV } from "./bomToCSV.js"; import JSZip from "jszip"; // =================================================_
- `buildThumbnailFilename(rowData)`
  _Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file / import { bomToCSV } from "./bomToCSV.js"; import JSZip from "jszip"; // =================================================_
- `parseBomRow(row, headerMap, index)`
  _Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file / import { bomToCSV } from "./bomToCSV.js"; import JSZip from "jszip"; // =================================================_
- `buildThumbnailUrl(info, size = THUMBNAIL_SIZE)`
  _Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file / import { bomToCSV } from "./bomToCSV.js"; import JSZip from "jszip"; // =================================================_
- `async fullAssemblyExtract(options)`
  _Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file / import { bomToCSV } from "./bomToCSV.js"; import JSZip from "jszip"; // =================================================_

**Dependencies:** `jszip`

#### 📄 `getCSV.js` (51 lines)

_Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX, with/without dash/underscore._

**Functions:**
- `getCSV(parts)`
  _Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX, with/without dash/underscore._

#### 📄 `getFilteredCSV.js` (8 lines)

#### 📄 `massCSVExporter.js` (324 lines)

_Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2. exportAllDocuments - Multiple files (fallback, may be blocked by browser)_

**Functions:**
- `async exportAllDocumentsAsZip(apiClient, documentService)`
  _Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2. exportAllDocuments - Multiple files (fallback, may be blocked by browser) / import { getCSV } from "./getCSV.js"_
- `async exportAllDocuments(apiClient, documentService)`
  _Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2. exportAllDocuments - Multiple files (fallback, may be blocked by browser) / import { getCSV } from "./getCSV.js"_

**Dependencies:** `jszip`

#### 📄 `toast-notification.js` (39 lines)

_Centralized toast notification system_

**Functions:**
- `showToast(message, duration = 2500)`

### 📁 public/js/views

#### 📄 `airtable-upload-view.js` (691 lines)

_AirtableUploadView - UI for uploading thumbnails to Airtable_

**class AirtableUploadView** extends `BaseView`
Properties: `dryRun: true,`, `baseId: '',`, `tableId: '',`, `partNumberField: 'Part number',`, `thumbnailField: 'CAD_Thumbnail'`
Methods:
  - `render(isAuthenticated)`
  - `_renderUnauthenticated()`
  - `_renderAuthenticated()`
  - `_bindEvents()`
  - `_bindDropzone()`
  - `_handleFileSelect(file)`
  - `_clearFile()`
  - `_formatFileSize(bytes)`

#### 📄 `base-view.js` (33 lines)

_BaseView - abstract base with common helpers_

**class BaseView**
Methods:
  - `ensureContainer()`
  - `clear()`
  - `renderHtml(html)`
  - `bind()`
  - `unbind()`

#### 📄 `document-detail-view.js` (647 lines)

_DocumentDetailView - slim orchestration layer_

**class DocumentDetailView** extends `BaseView`
Properties: `scroll: {`, `windowY: typeof window !`, `containerTop: container ? container.scrollTop || 0 : 0,`, `containerKey: container?.getAttribute?.("data-scroll-key") || null,`
Methods:
  - `render(docData, elements)`
  - `_renderTopBar(docData)`
  - `_renderHistorySelector(docData)`
  - `_bindHistorySelector(docData)`
  - `_handleLoadHistory(documentId)`
  - `_renderHistoryDropdown(history, documentId)`
  - `_bindHistoryDropdown(documentId)`
  - `_displayHistoryDetails(documentId, item)`

#### 📄 `document-list-view.js` (275 lines)

_DocumentListView - renders document grid/table_

**class DocumentListView** extends `BaseView`
Properties: `scroll: {`, `windowY: typeof window !`, `containerTop: scrollContainer ? (scrollContainer.scrollTop || 0) : 0,`, `containerKey: scrollContainer?.getAttribute?.('data-scroll-key') || null`, `selectAll: !!(selectAllEl && selectAllEl.checked),`
Methods:
  - `render(documents, pagination = null)`
  - `bind()`
  - `_bindPaginationControls()`
  - `_notifySelectionChanged()`
  - `_delegate(selector, eventName, handler)`
  - `unbind()`
  - `captureState()`
  - `restoreState(state)`

#### 📄 `element-detail-view.js` (227 lines)

**class ElementDetailView** extends `BaseView`
Properties: `scroll: {`, `windowY: typeof window !`, `containerTop: container ? (container.scrollTop || 0) : 0,`, `containerKey: container?.getAttribute?.('data-scroll-key') || null`, `scroll: { windowY: 0, containerTop: 0, containerKey: null },`
Methods:
  - `render(element)`
  - `_bindBackButton()`
  - `captureState()`
  - `restoreState(state)`

#### 📄 `export-filter-modal.js` (244 lines)

_Modal for configuring export filters before pre-scan. Allows filtering by folder prefix to limit scope of export._

**class ExportFilterModal**
Properties: `json: formatJsonCheck?.checked ?? true,`, `csv: formatCsvCheck?.checked ?? true`, `prtAsmOnly: filterPrtAsmCheck?.checked ?? false`
Methods:
  - `prompt()`
  - `_show()`
  - `hide()`
  - `_handleKeyDown(e)`
  - `_renderContent()`
  - `_handleConfirm()`
  - `_handleCancel()`

#### 📄 `export-progress-modal.js` (468 lines)

_Modal view for displaying real-time export progress. Connects to SSE endpoint and shows progress bar, ETA, status._

**class ExportProgressModal**
Properties: `onProgress: (event)`, `onComplete: (result)`, `onError: (error)`
Methods:
  - `show({ stats, workers = 4, delay = 100, onComplete, onCancel, onError, startExport })`
  - `renderInitialContent(stats)`
  - `handleProgress(event)`
  - `logProgress(event)`
  - `updatePhase(phase, fetch)`
  - `updateProgressBar(percent)`
  - `updateCount(type, value)`
  - `updateCurrentItem(text)`

#### 📄 `export-stats-modal.js` (639 lines)

_Modal view for displaying pre-scan export statistics. Shows before starting full aggregate BOM export. Enhanced with live stats, root folder visualization, and cancel/resume capability._

**class ExportStatsModal**
Properties: `startTime: null,`, `elapsedInterval: null,`, `rootFolders: [],`, `checkpoint: null,`, `elementCounts: {`
Methods:
  - `show(stats, { onConfirm, onCancel, isPartial = false, selectionCount = 0, prefixFilter = null })`
  - `hide()`
  - `clearCheckpointOnSuccess()`
  - `_handleKeyDown(e)`
  - `renderModalContent(stats, { isPartial = false, selectionCount = 0, prefixFilter = null } = {})`
  - `handleConfirm()`
  - `handleCancel()`
  - `showLoading()`

#### 📄 `full-extract-modal.js` (360 lines)

_Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages._

**Functions:**
- `showModal(assemblyName)`
  _Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages. / import { ExportPhase } from '../utils/fullAssemblyExporter.js'; // ============================================================================ // Modal State //_
- `hideModal()`
  _Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages. / import { ExportPhase } from '../utils/fullAssemblyExporter.js'; // ============================================================================ // Modal State //_
- `isModalVisible()`
  _Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages. / import { ExportPhase } from '../utils/fullAssemblyExporter.js'; // ============================================================================ // Modal State //_
- `updateProgress(progress)`
  _Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages. / import { ExportPhase } from '../utils/fullAssemblyExporter.js'; // ============================================================================ // Modal State //_

#### 📄 `modal-manager.js` (164 lines)

_ModalManager - controls export and progress modals_

**class ModalManager**
Properties: `onStartExport: null,`, `onCancelExport: null`, `includeBasicInfo: getChecked('exportBasicInfo', true),`, `includeElements: getChecked('exportElements', true),`, `includeParts: getChecked('exportParts', false),`
Methods:
  - `setHandlers(handlers)`
  - `showExport()`
  - `hideExport()`
  - `showProgress()`
  - `hideProgress()`
  - `bindExportModalEvents()`
  - `bindProgressModalEvents()`
  - `readExportOptions()`

#### 📄 `navigation.js` (29 lines)

_Navigation - page transitions_

**class Navigation**
_Navigation - page transitions_
Methods:
  - `navigateTo(pageId)`
  - `getCurrentPage()`

#### 📄 `part-detail-view.js` (211 lines)

_PartDetailView - renders part details and mass properties_

**class PartDetailView**
Properties: `label: "Mass",`, `value: `${body.mass[0]} ${props.units?.mass || "kg"}`,`, `label: "Volume",`, `value: `${body.volume[0]} ${props.units?.volume || "m³"}`,`, `label: "Centroid (X, Y, Z)",`
Methods:
  - `render(part)`
  - `_bindBackButton()`
  - `captureState()`
  - `restoreState(state)`

#### 📄 `workspace-view.js` (205 lines)

_WorkspaceView - renders folder tree and document exploration_

**class WorkspaceView** extends `BaseView`
_WorkspaceView - renders folder tree and document exploration_
Methods:
  - `bind()`
  - `showLoading()`
  - `hideLoading()`
  - `showError(msg)`
  - `hideError()`
  - `render(items, breadcrumbs)`
  - `_renderBreadcrumbs(path)`
  - `_renderGrid(items)`

### 📁 public/js/views/actions

#### 📄 `document-actions.js` (97 lines)

_Action handlers for document-level operations_

**class DocumentActions**
Methods:
  - `handleGetDocument(docId)`
  - `handleGetJson(docData)`
  - `handleCopyJson(docData)`
  - `handleLoadHierarchy(docId, controller)`
  - `handleExportCsv(docData, elements)`

#### 📄 `element-actions.js` (124 lines)

_Action handlers for element-level operations_

**class ElementActions**
Properties: `documentService: service,`, `onProgress: (progress)`, `assembly: progress.assemblyName,`, `bomRows: progress.bomRows,`, `thumbnails: progress.thumbnailsDownloaded,`
Methods:
  - `handleCopyElementJson(element, controller)`
  - `handleFetchBomJson(element, documentId, workspaceId, service)`
  - `handleDownloadBomCsv(element, documentId, workspaceId, service)`
  - `handleFullExtract(element, documentId, workspaceId, service)`

### 📁 public/js/views/helpers

#### 📄 `document-info-renderer.js` (157 lines)

_Pure rendering functions for document metadata sections_

**Functions:**
- `renderDocumentInfo(docData)`
- `renderThumbnailSection(docData)`
- `renderTagsAndLabels(docData)`

#### 📄 `element-list-renderer.js` (69 lines)

_Pure rendering for elements list_

**Functions:**
- `renderElementsList(elements)`
- `renderElementItem(element)`
- `renderElementActions(element)`

#### 📄 `pagination-renderer.js` (96 lines)

_Pure rendering functions for pagination controls_

**Functions:**
- `renderPaginationControls(pagination)`
  _Pure rendering functions for pagination controls / import { escapeHtml } from '../../utils/dom-helpers.js'; /** Render pagination controls HTML_
- `renderDocumentRows(documents)`
  _Pure rendering functions for pagination controls / import { escapeHtml } from '../../utils/dom-helpers.js'; /** Render pagination controls HTML / export function renderPaginationControls(pagination) { const { currentPage, pageSize, totalCount, totalPages } = pagination; const startItem = totalCount _

### 📁 src

#### ⭐ `index.ts` (146 lines)

**Dependencies:** `url, express, cors, helmet, morgan, cookie-parser, express-session, path`

**Routes:** `USE /auth, USE /auth/airtable, USE /api, USE /api/airtable, GET /`

### 📁 src/config

#### 📄 `airtable.ts` (69 lines)

_Airtable OAuth & API Configuration Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs._

**Functions:**
- `isAirtableConfigured() → boolean`
  _Airtable OAuth & API Configuration Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs. / import dotenv from 'dotenv'; dotenv.config(); export interface AirtableConfig { // OAuth settings clientId: string; clientS_
- `isAirtableDatabaseConfigured() → boolean`
  _Airtable OAuth & API Configuration Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs. / import dotenv from 'dotenv'; dotenv.config(); export interface AirtableConfig { // OAuth settings clientId: string; clientS_

**Types:** `AirtableConfig`

**Dependencies:** `dotenv`

#### 📄 `oauth.ts` (40 lines)

**Functions:**
- `validateConfig() → void`

**Types:** `OAuthConfig`

**Dependencies:** `dotenv`

### 📁 src/routes

#### 📄 `airtable-api.ts` (227 lines)

_Airtable API Routes Proxy routes for Airtable API operations. Requires Airtable authentication (separate from OnShape auth)._

**Dependencies:** `express, express`

**Routes:** `GET /config, GET /bases, GET /bases/:baseId/tables, GET /bases/:baseId/tables/:tableId/schema, GET /bases/:baseId/tables/:tableId/records`

#### 📄 `airtable-auth.ts` (223 lines)

_Airtable Authentication Routes Handles OAuth 2.0 flow for Airtable authentication. Separate from OnShape auth to allow independent login/logout._

**Dependencies:** `express`

**Routes:** `GET /login, GET /callback, GET /status, POST /logout, POST /refresh`

#### 📄 `api.ts` (927 lines)

_GET /api/export/directory-stats Pre-scan the workspace tree to gather statistics. Fast alternative to full export - doesn't fetch BOMs. Returns assembly list for subsequent parallel BOM fetching. Query params: - delay: Delay between API calls in ms (default: 100) - scope: 'full' | 'partial' (default_

**Dependencies:** `express, express`

**Routes:** `GET /user, GET /documents, GET /documents/:id, GET /documents/:id/versions, GET /documents/:id/branches`

#### 📄 `auth.ts` (103 lines)

**Dependencies:** `express`

**Routes:** `GET /login, GET /callback, GET /status, POST /logout`

### 📁 src/services

#### 📄 `airtable-api-client.ts` (364 lines)

_Airtable API Client Provides methods for interacting with Airtable's REST API. Handles record operations, schema retrieval, and attachment uploads._

**class AirtableApiClient**
Properties: `axiosInstance: AxiosInstance`, `accessToken: string`, `baseURL: 'https://api.airtable.com/v0',`, `timeout: 30000,`, `headers: {`
Methods:
  - `listBases() → Promise<AirtableBasesResponse>`
  - `listTables(baseId: string) → Promise<`
  - `getTables(baseId: string) → Promise<`
  - `listRecords(
    baseId: string,
    tableId: string,
    options?: {
      filterByFormula?: string;
      fields?: string[];
      maxRecords?: number;
      pageSize?: number;
      offset?: string;
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    }
  ) → Promise<AirtableListResponse>`
  - `getRecord(baseId: string, tableId: string, recordId: string) → Promise<AirtableRecord>`
  - `updateRecord(
    baseId: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ) → Promise<AirtableRecord>`
  - `getTableSchema(baseId: string, tableId: string) → Promise<TableSchema>`
  - `getFieldId(baseId: string, tableId: string, fieldName: string) → Promise<string | null>`

**Types:** `AirtableRecord, AirtableListResponse, TableField, TableSchema, AttachmentResult, AirtableBase, AirtableBasesResponse`

**Dependencies:** `axios`

**Routes:** `GET /meta/bases`

#### 📄 `airtable-oauth-service.ts` (179 lines)

_Airtable OAuth 2.0 Service Handles OAuth 2.0 Authorization Code flow with PKCE for Airtable. Similar pattern to OnShape OAuth service but adapted for Airtable's OAuth implementation._

**class AirtableOAuthService**
Properties: `clientId: string`, `clientSecret: string`, `redirectUri: string`, `scopes: string[]`, `authorizationUrl: string`
Methods:
  - `generateRandomString(length: number = 32) → string`
  - `generateCodeVerifier() → string`
  - `generateCodeChallenge(verifier: string) → string`
  - `generateAuthUrl(state: string, codeChallenge: string) → string`
  - `exchangeCodeForTokens(code: string, codeVerifier: string) → Promise<AirtableTokenResponse>`
  - `refreshAccessToken(refreshToken: string) → Promise<AirtableTokenResponse>`
  - `isTokenExpired(expiresAt: number) → boolean`

**Types:** `AirtableTokens, AirtableTokenResponse`

**Dependencies:** `axios, crypto`

#### 📄 `airtable-thumbnail-service.ts` (302 lines)

_Airtable Thumbnail Upload Service Handles processing ZIP files containing thumbnails and uploading them to matching Airtable records based on part number._

**class AirtableThumbnailService**
Properties: `apiClient: AirtableApiClient`, `config: ThumbnailServiceConfig`, `thumbnailFieldId: string | null`, `baseId: config?.baseId || airtableConfig.baseId,`, `tableId: config?.tableId || airtableConfig.tableId,`
Methods:
  - `parseFilename(filename: string) → ParsedFilename | null`
  - `findRecordByPartNumber(partNumber: string) → Promise<AirtableRecord | null>`
  - `uploadThumbnail(
    recordId: string,
    imageBuffer: Buffer,
    filename: string
  ) → Promise<void>`

**Types:** `ParsedFilename, ThumbnailUploadResult, UploadProgress, ThumbnailServiceConfig`

**Dependencies:** `jszip`

#### 📄 `api-call-cost.ts` (18 lines)

**Functions:**
- `estimateCost(endpoint: string) → number`

#### 📄 `api-usage-tracker.ts` (242 lines)

**class ApiUsageTracker**
Properties: `logFile: string`, `dataDir: string`, `timeWindow: `${hours} hours`,`, `summary: {`, `totalRequests: entries.length,`
Methods:
  - `log(entry: UsageEntry) → Promise<void>`
  - `getStats(hours: number = 24) → Promise<UsageStats>`
  - `getEndpointBreakdown() → Promise<EndpointStats[]>`
  - `estimateCosts(
    costMap: Record<string, number> = {}
  ) → Promise<CostEstimate>`

**Dependencies:** `fs/promises, path`

#### 📄 `oauth-service.ts` (160 lines)

_Generate OAuth authorization URL for OnShape_

**class OAuthService**
Properties: `response_type: "code",`, `client_id: oauthConfig.clientId,`, `redirect_uri: oauthConfig.redirectUri,`, `scope: oauthConfig.scope,`, `state: state,`

**Types:** `OAuthTokens, OAuthState`

**Dependencies:** `uuid, axios`

#### 📄 `onshape-api-client.ts` (1597 lines)

_Get document history (alias for getDocumentVersions for backward compatibility). For combined versions + branches, use getCombinedDocumentHistory instead._

**class OnShapeApiClient**
Properties: `axiosInstance: AxiosInstance`, `accessToken: string`, `usageTracker: ApiUsageTracker`, `userId: string`, `baseApiRoot: string`
Methods:
  - `getCurrentUser() → Promise<OnShapeUser>`
  - `getDocuments(
    limit: number = 20,
    offset: number = 0
  ) → Promise<`
  - `getDocument(documentId: string) → Promise<OnShapeDocumentInfo>`
  - `getDocumentVersions(documentId: string) → Promise<any[]>`
  - `getDocumentBranches(documentId: string) → Promise<any[]>`
  - `getDocumentHistory(documentId: string) → Promise<any[]>`
  - `getCombinedDocumentHistory(documentId: string) → Promise<`
  - `getComprehensiveDocument(
    documentId: string,
    params: any
  ) → Promise<any>`

**Types:** `OnShapeUser, OnShapeDocument, OnShapeDocumentElement, OnShapeDocumentInfo, AxiosRequestConfig`

**Dependencies:** `events, axios, p-limit`

**Routes:** `GET /users/sessioninfo, GET /documents, GET /documents`

#### 📄 `session-storage.ts` (136 lines)

**class SessionStorage** extends `Store`
Properties: `sessionsFilePath: string`, `sessions: Record<string, any>`, `lastAccess: new Date().toISOString(),`

**Dependencies:** `express-session, fs, path`

#### 📄 `usage-db.ts` (77 lines)

**class UsageDatabase**
Properties: `db: Database.Database`, `total: this.db`, `byEndpoint: this.db`, `byUser: this.db`, `avgResponseTime: this.db`
Methods:
  - `logRequest(entry: UsageEntry)`
  - `getStats(hours = 24)`

**Dependencies:** `better-sqlite3`

### 📁 src/types

#### 📄 `airtable.d.ts` (19 lines)

_Airtable Type Definitions Type definitions for Airtable session data and API structures._

**Types:** `AirtableSessionData, AirtableOAuthState`

#### 📄 `onshape.ts` (205 lines)

_OnShape API Types Shared type definitions for OnShape API responses and internal data structures_

**Types:** `OnShapeElementType, OnShapeUser, AssemblyReference, AssemblyBomFetchResult, DirectoryStats, ExportScopeParams, ExportMetadata, AggregateBomResult, ExportPhase, RootFolderStatus`

#### 📄 `session.d.ts` (21 lines)

#### 📄 `usage.d.ts` (55 lines)

**Types:** `UsageEntry, UsageStats, EndpointStats, UserStats, CostEstimate, UsageQueryOptions`

## External Dependencies

axios, better-sqlite3, cookie-parser, cors, crypto-js, dotenv, express, express-session, helmet, jszip, morgan, p-limit, uuid

## Internal Dependencies

Files and what imports them:

- `public/js/controllers/airtable-controller.js` ← `public/js/app.js`
- `public/js/controllers/app-controller.js` ← `public/js/app.js`
- `public/js/controllers/document-controller.js` ← `public/js/app.js`
- `public/js/controllers/export-controller.js` ← `public/js/app.js`
- `public/js/router/Router.js` ← `public/js/app.js`
- `public/js/router/routes.js` ← `public/js/app.js`, `public/js/controllers/airtable-controller.js`, `public/js/controllers/document-controller.js`
- `public/js/services/airtable-service.js` ← `public/js/app.js`
- `public/js/services/api-client.js` ← `public/js/app.js`, `src/routes/airtable-api.ts`, `src/routes/api.ts`
- `public/js/services/auth-service.js` ← `public/js/app.js`, `src/routes/airtable-auth.ts`, `src/routes/auth.ts`
- `public/js/services/document-service.js` ← `public/js/app.js`
- `public/js/services/export-service.js` ← `public/js/app.js`
- `public/js/services/thumbnail-service.js` ← `public/js/app.js`, `src/routes/airtable-api.ts`
- `public/js/state/HistoryState.js` ← `public/js/app.js`
- `public/js/state/app-state.js` ← `public/js/app.js`
- `public/js/utils/aggregateBomToCSV.js` ← `public/js/controllers/document-controller.js`
