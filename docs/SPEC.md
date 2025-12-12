# OnShape-DocuReader - Project Specification

> Auto-generated: 2025-12-12 14:11:02

## Directory Structure

```
OnShape-DocuReader/
├── docs/
│   └── SPEC.md
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
├── FULL_SPEC.md
├── LICENSE
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── SPEC.md
├── tsconfig.json
└── vite.config.js

```

## Module Overview

Total files: 66
Total lines: 14,491

### Root

#### `vite.config.js` (36 lines)
- **Exports:** `defineConfig`
- **Dependencies:** `vite, path, url`

### public/js

#### `app.js` (208 lines)

### public/js/controllers

#### `airtable-controller.js` (250 lines)

_* AirtableController - handles Airtable authentication and thumbnail upload workflows_

- **Exports:** `AirtableController`
- **Classes:** `AirtableController`
- **Functions:** `escapeHandler`

#### `app-controller.js` (118 lines)
- **Exports:** `AppController`
- **Classes:** `AppController`

#### `document-controller.js` (974 lines)

_* DocumentController - orchestrates document flows_

- **Exports:** `DocumentController`
- **Classes:** `DocumentController`
- **Functions:** `restore`

#### `export-controller.js` (65 lines)

_* ExportController - orchestrates export workflow_

- **Exports:** `ExportController`
- **Classes:** `ExportController`

### public/js/router

#### `Router.js` (374 lines)

_* Lightweight hash-based Router. * Responsibilities: - Register route patterns with handlers - Parse hash-based URLs and extract params and query - Manage browser history with pushState/replaceState +..._

- **Exports:** `Router`
- **Classes:** `Router`
- **Functions:** `return`

#### `routes.js` (139 lines)

_* Route definitions and configuration. * Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers - pathTo(pattern, params?,..._

- **Exports:** `configureRoutes, pathTo, ROUTES`

### public/js/services

#### `airtable-service.js` (207 lines)

_* AirtableService - handles Airtable API interactions from frontend_

- **Exports:** `airtableService, AirtableService`
- **Classes:** `AirtableService`

#### `api-client.js` (373 lines)
- **Exports:** `ApiClient`
- **Classes:** `ApiClient`
- **Functions:** `return`

#### `auth-service.js` (41 lines)
- **Exports:** `AuthService`
- **Classes:** `AuthService`

#### `document-service.js` (169 lines)

_* DocumentService - document-related operations_

- **Exports:** `DocumentService`
- **Classes:** `DocumentService`

#### `export-service.js` (60 lines)

_* ExportService - executes export workflows_

- **Exports:** `ExportService`
- **Classes:** `ExportService`

#### `thumbnail-service.js` (43 lines)

_* ThumbnailService - image handling and fallbacks_

- **Exports:** `ThumbnailService`
- **Classes:** `ThumbnailService`

### public/js/state

#### `HistoryState.js` (355 lines)

_* HistoryState - manages capture/restore of view/application state for navigation. * Design: - Works with browser history.state to persist lightweight, serializable view state. - Captures scroll posit..._

- **Exports:** `HistoryState`
- **Classes:** `HistoryState`
- **Functions:** `doRestoreScroll`

#### `app-state.js` (115 lines)
- **Exports:** `AppState`
- **Classes:** `AppState`

### public/js/utils

#### `aggregateBomToCSV.js` (116 lines)

_* Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging. * @param {Object} aggregateResult - Result from aggregate BOM export @pa..._

- **Exports:** `aggregateBomToCSV`
- **Functions:** `escapeCsvField`

#### `bomToCSV.js` (54 lines)

_* Convert Onshape BOM JSON to CSV. * @param {Object} bomJson - BOM JSON object from Onshape API @returns {string} CSV string_

- **Exports:** `bomToCSV, allHeaders`
- **Functions:** `escapeCsvField`

#### `clipboard.js` (25 lines)

_* Clipboard utilities_

- **Exports:** `copyToClipboard`

#### `dom-helpers.js` (34 lines)

_* DOM helpers and safe HTML utilities_

- **Exports:** `qs, qsa, on, delegate, escapeHtml`
- **Functions:** `listener`

#### `download.js` (16 lines)

_* Download helpers_

- **Exports:** `downloadJson`

#### `file-download.js` (33 lines)

_* Generic file download utilities_

- **Exports:** `downloadJson, downloadCsv, createDownloadLink`
- **Functions:** `downloadBlob`

#### `format-helpers.js` (24 lines)

_* Formatting helpers (pure functions)_

- **Exports:** `formatDateWithUser`

#### `fullAssemblyExporter.js` (699 lines)

_* Full Assembly Exporter * Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file * @module utils/ful..._

- **Exports:** `sanitizeForFilename, buildThumbnailFilename, parseBomRow, buildThumbnailUrl, fullAssemblyExtract, ExportPhase`
- **Functions:** `delay, buildHeaderMap, findRowValue, fetchThumbnailBlob, fetchThumbnailsWithLimit, +4 more`
- **Dependencies:** `jszip`

#### `getCSV.js` (51 lines)

_* Generate CSV from parts data, filtering for ASM/PRT part numbers. * Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX, with/wi..._

- **Exports:** `getCSV`
- **Functions:** `escapeCsvField`

#### `getFilteredCSV.js` (8 lines)

#### `massCSVExporter.js` (324 lines)

_* Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. * Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2. exportAl..._

- **Exports:** `exportAllDocumentsAsZip, exportAllDocuments`
- **Functions:** `sanitizeFilename, basename, downloadFile, downloadBlob, getThumbnailUrl, +1 more`
- **Dependencies:** `jszip`

#### `toast-notification.js` (39 lines)

_* Centralized toast notification system_

- **Exports:** `showToast`
- **Functions:** `ensureToastContainer`

### public/js/views

#### `airtable-upload-view.js` (462 lines)

_* AirtableUploadView - UI for uploading thumbnails to Airtable_

- **Exports:** `AirtableUploadView`
- **Classes:** `AirtableUploadView`

#### `base-view.js` (33 lines)

_* BaseView - abstract base with common helpers_

- **Exports:** `BaseView`
- **Classes:** `BaseView`

#### `document-detail-view.js` (647 lines)

_* DocumentDetailView - slim orchestration layer_

- **Exports:** `DocumentDetailView`
- **Classes:** `DocumentDetailView extends BaseView`
- **Functions:** `applyScroll`

#### `document-list-view.js` (275 lines)

_* DocumentListView - renders document grid/table_

- **Exports:** `DocumentListView`
- **Classes:** `DocumentListView extends BaseView`
- **Functions:** `listener, applyScroll`

#### `element-detail-view.js` (227 lines)
- **Exports:** `ElementDetailView`
- **Classes:** `ElementDetailView extends BaseView`
- **Functions:** `applyScroll`

#### `export-filter-modal.js` (244 lines)

_* Modal for configuring export filters before pre-scan. Allows filtering by folder prefix to limit scope of export._

- **Exports:** `exportFilterModal, ExportFilterModal`
- **Classes:** `ExportFilterModal`

#### `export-progress-modal.js` (468 lines)

_* Modal view for displaying real-time export progress. Connects to SSE endpoint and shows progress bar, ETA, status._

- **Exports:** `exportProgressModal, ExportProgressModal`
- **Classes:** `ExportProgressModal`

#### `export-stats-modal.js` (639 lines)

_* Modal view for displaying pre-scan export statistics. Shows before starting full aggregate BOM export. Enhanced with live stats, root folder visualization, and cancel/resume capability._

- **Exports:** `exportStatsModal, ExportStatsModal`
- **Classes:** `ExportStatsModal`

#### `full-extract-modal.js` (360 lines)

_* Full Extract Progress Modal * Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages. * @module views/full-extract-modal_

- **Exports:** `showModal, hideModal, isModalVisible, updateProgress`
- **Functions:** `getModalHTML, ensureModal, calculateProgress, showCompletionStats, showError, +5 more`

#### `modal-manager.js` (164 lines)

_* ModalManager - controls export and progress modals_

- **Exports:** `ModalManager`
- **Classes:** `ModalManager`
- **Functions:** `getChecked, getRadio`

#### `navigation.js` (20 lines)

_* Navigation - page transitions_

- **Exports:** `Navigation`
- **Classes:** `Navigation`

#### `part-detail-view.js` (211 lines)

_* PartDetailView - renders part details and mass properties_

- **Exports:** `PartDetailView`
- **Classes:** `PartDetailView`
- **Functions:** `applyScroll`

#### `workspace-view.js` (205 lines)
- **Exports:** `isSelected, WorkspaceView`
- **Classes:** `WorkspaceView extends BaseView`

### public/js/views/actions

#### `document-actions.js` (97 lines)

_* Action handlers for document-level operations_

- **Exports:** `DocumentActions`
- **Classes:** `DocumentActions`

#### `element-actions.js` (124 lines)

_* Action handlers for element-level operations_

- **Exports:** `ElementActions`
- **Classes:** `ElementActions`

### public/js/views/helpers

#### `document-info-renderer.js` (157 lines)

_* Pure rendering functions for document metadata sections_

- **Exports:** `renderDocumentInfo, renderThumbnailSection, renderTagsAndLabels`

#### `element-list-renderer.js` (69 lines)

_* Pure rendering for elements list_

- **Exports:** `renderElementsList, renderElementItem, renderElementActions`

#### `pagination-renderer.js` (96 lines)

_* Pure rendering functions for pagination controls_

- **Exports:** `renderPaginationControls, renderDocumentRows`
- **Functions:** `renderPageSizeOptions`

### src

#### `index.ts` (146 lines)
- **Dependencies:** `express, cors, helmet, morgan, cookie-parser, express-session, path, url`

### src/config

#### `airtable.ts` (69 lines)

_* Airtable OAuth & API Configuration * Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs._

- **Exports:** `isAirtableConfigured, isAirtableDatabaseConfigured, AirtableConfig`
- **Dependencies:** `dotenv`

#### `oauth.ts` (40 lines)
- **Exports:** `validateConfig, OAuthConfig`
- **Functions:** `getRedirectUri`
- **Dependencies:** `dotenv`

### src/routes

#### `airtable-api.ts` (227 lines)

_* Airtable API Routes * Proxy routes for Airtable API operations. Requires Airtable authentication (separate from OnShape auth)._

- **Exports:** `router`
- **Dependencies:** `express`

#### `airtable-auth.ts` (223 lines)

_* Airtable Authentication Routes * Handles OAuth 2.0 flow for Airtable authentication. Separate from OnShape auth to allow independent login/logout._

- **Exports:** `router`
- **Dependencies:** `express`

#### `api.ts` (927 lines)
- **Exports:** `router`
- **Functions:** `sendEvent`
- **Dependencies:** `express`

#### `auth.ts` (103 lines)
- **Exports:** `router`
- **Dependencies:** `express`

### src/services

#### `airtable-api-client.ts` (304 lines)

_* Airtable API Client * Provides methods for interacting with Airtable's REST API. Handles record operations, schema retrieval, and attachment uploads._

- **Exports:** `AirtableApiClient, AirtableRecord, AirtableListResponse, TableField, TableSchema, AttachmentResult, AirtableBase, AirtableBasesResponse`
- **Classes:** `AirtableApiClient`

#### `airtable-oauth-service.ts` (179 lines)

_* Airtable OAuth 2.0 Service * Handles OAuth 2.0 Authorization Code flow with PKCE for Airtable. Similar pattern to OnShape OAuth service but adapted for Airtable's OAuth implementation._

- **Exports:** `airtableOAuthService, AirtableOAuthService, AirtableTokens, AirtableTokenResponse`
- **Classes:** `AirtableOAuthService`
- **Dependencies:** `axios, crypto`

#### `airtable-thumbnail-service.ts` (295 lines)

_* Airtable Thumbnail Upload Service * Handles processing ZIP files containing thumbnails and uploading them to matching Airtable records based on part number._

- **Exports:** `AirtableThumbnailService, ParsedFilename, ThumbnailUploadResult, UploadProgress, ThumbnailServiceConfig`
- **Classes:** `AirtableThumbnailService`
- **Dependencies:** `jszip`

#### `api-call-cost.ts` (18 lines)
- **Exports:** `estimateCost`

#### `api-usage-tracker.ts` (242 lines)
- **Exports:** `ApiUsageTracker`
- **Classes:** `ApiUsageTracker`
- **Dependencies:** `fs/promises, path`

#### `oauth-service.ts` (160 lines)
- **Exports:** `OAuthService, OAuthTokens, OAuthState`
- **Classes:** `OAuthService`
- **Dependencies:** `axios, uuid`

#### `onshape-api-client.ts` (1597 lines)
- **Exports:** `isPartialExport, OnShapeApiClient, OnShapeUser, OnShapeDocument, OnShapeDocumentElement, OnShapeDocumentInfo, AxiosRequestConfig`
- **Classes:** `OnShapeApiClient`
- **Functions:** `checkAborted, emitProgress, emitFetchProgress`
- **Dependencies:** `axios, p-limit, events`

#### `session-storage.ts` (136 lines)
- **Exports:** `SessionStorage`
- **Classes:** `SessionStorage extends Store`
- **Dependencies:** `fs, path, express-session`

#### `usage-db.ts` (77 lines)
- **Exports:** `UsageDatabase`
- **Classes:** `UsageDatabase`
- **Dependencies:** `better-sqlite3`

### src/types

#### `airtable.d.ts` (19 lines)

_* Airtable Type Definitions * Type definitions for Airtable session data and API structures._

- **Exports:** `AirtableSessionData, AirtableOAuthState`

#### `onshape.ts` (205 lines)

_* OnShape API Types Shared type definitions for OnShape API responses and internal data structures_

- **Exports:** `OnShapeElementType, OnShapeUser, AssemblyReference, AssemblyBomFetchResult, DirectoryStats, ExportScopeParams, ExportMetadata, AggregateBomResult, ExportPhase, RootFolderStatus, ExportProgressEvent, ExportCompleteEvent`

#### `session.d.ts` (21 lines)

#### `usage.d.ts` (55 lines)
- **Exports:** `UsageEntry, UsageStats, EndpointStats, UserStats, CostEstimate, UsageQueryOptions`

## External Dependencies

axios, better-sqlite3, cookie-parser, cors, crypto, dotenv, events, express, express-session, fs, fs/promises, helmet, jszip, morgan, p-limit, path, url, uuid, vite
