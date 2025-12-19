# onshape-docureader

Generated: 2025-12-18 16:37

Using OnShape API to gather information about documents

## Scripts

- `build`: tsc && vite build
- `start`: node dist/index.js
- `dev`: concurrently "nodemon src/index.ts" "vite" "npm run open-bro...
- `open-browser`: sh -c 'sleep 3 && wslview http://localhost:5173'
- `clean`: rimraf dist
- `prebuild`: npm run clean && npm run spec
- `test`: echo "Error: no test specified" && exit 1
- `spec`: python project_tools/generate_spec.py . -o docs/AUTO_SPEC.md...

## Structure

```
onshape-docureader/
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
│   │   │   └── export-controller.js
│   │   ├── router/
│   │   │   ├── Router.js
│   │   │   └── routes.js
│   │   ├── services/
│   │   │   ├── airtable-service.js
│   │   │   ├── api-client.js
│   │   │   ├── auth-service.js
│   │   │   ├── document-service.js
│   │   │   ├── export-service.js
│   │   │   └── thumbnail-service.js
│   │   ├── state/
│   │   │   ├── app-state.js
│   │   │   └── HistoryState.js
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
│   │   │   └── toast-notification.js
│   │   ├── views/
│   │   │   ├── actions/
│   │   │   │   ├── document-actions.js
│   │   │   │   └── element-actions.js
│   │   │   ├── helpers/
│   │   │   │   ├── document-info-renderer.js
│   │   │   │   ├── element-list-renderer.js
│   │   │   │   └── pagination-renderer.js
│   │   │   ├── action-preview-modal.js
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
│   │   │   └── workspace-view.js
│   │   └── app.js
│   ├── dashboard.html
│   └── index.html
├── src/
│   ├── config/
│   │   ├── airtable.ts
│   │   └── oauth.ts
│   ├── routes/
│   │   ├── airtable-api.ts
│   │   ├── airtable-auth.ts
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── services/
│   │   ├── airtable-api-client.ts
│   │   ├── airtable-oauth-service.ts
│   │   ├── airtable-thumbnail-service.ts
│   │   ├── api-call-cost.ts
│   │   ├── api-usage-tracker.ts
│   │   ├── oauth-service.ts
│   │   ├── onshape-api-client.ts
│   │   ├── session-storage.ts
│   │   └── usage-db.ts
│   ├── types/
│   │   ├── airtable.d.ts
│   │   ├── onshape.ts
│   │   ├── session.d.ts
│   │   └── usage.d.ts
│   └── index.ts
├── LICENSE
├── nodemon.json
├── package-lock.json
├── package.json
├── README.md
├── test.csv
├── tsconfig.json
└── vite.config.js
```

## Stats

Files: 61 | Lines: 15,408 | Routes: 45 | TODOs: 9

## Routes

- USE /auth
- USE /auth/airtable
- USE /api
- USE /api/airtable
- GET /
- GET /dashboard
- GET /config
- GET /bases
- GET /bases/:baseId/tables
- GET /bases/:baseId/tables/:tableId/schema
- GET /bases/:baseId/tables/:tableId/records
- POST /upload-thumbnails
- POST /find-record
- GET /login
- GET /callback
- GET /status
- POST /logout
- POST /refresh
- GET /user
- GET /documents
- GET /documents/:id
- GET /documents/:id/versions
- GET /documents/:id/branches
- GET /documents/:id/combined-history
- GET /documents/:id/history
- GET /documents/:id/comprehensive
- GET /documents/:id/parent
- GET /documents/:id/workspaces/:wid/elements
- GET /documents/:id/versions/:vid/elements
- GET /documents/:id/workspaces/:wid/elements/:eid/parts
- GET /documents/:id/workspaces/:wid/elements/:eid/assemblies
- GET /documents/:id/workspaces/:wid/elements/:eid/bom
- GET /documents/:id/workspaces/:wid/elements/:eid/metadata
- GET /documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties
- GET /onshape/folders
- GET /onshape/folders/:id
- GET /export/all
- GET /export/stream
- GET /export/directory-stats
- POST /export/prepare-assemblies
- GET /export/aggregate-bom-stream
- GET /export/aggregate-bom
- GET /thumbnail-metadata
- GET /thumbnail-proxy
- GET /usage/stats

## TODOs

- [bomToCSV.js] TODO: Check for edge cases, e.g. commas, quotes in values
- [element-actions.js] NOTE: The UI uses `.full-extract-btn` (see element-list-renderer.js). Keep selector in
- [airtable-upload-view.js] TODO: Implement actual cancellation if using streaming upload
- [document-detail-view.js] NOTE: avoid any inline styles here so layout remains controlled by CSS and responds to
- [document-detail-view.js] NOTE: Currently does 2 checks, if it is a BLOB or not any of the main types, which is 
- [document-detail-view.js] NOTE: We fetch elements via the version endpoint
- [pagination-renderer.js] NOTE: OnShape's /documents endpoint doesn't include folder names directly
- [airtable.ts] NOTE: Attachment uploads require data.records:write scope
- [api-call-cost.ts] NOTE: These are estimates and may not reflect actual costs incurred by Onshape

## Modules

### Configs

#### src/config/airtable.ts

Airtable OAuth & API Configuration Configuration for Airtable OAuth 2.0 integration and API access. Requires environment variables to be set for credentials and database IDs.

**interface AirtableConfig** {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authorizationUrl: string
  tokenUrl: string
  apiBaseUrl: string
  contentBaseUrl: string
  baseId: string
  tableId: string
}

Functions:
- `isAirtableConfigured() -> boolean`
- `isAirtableDatabaseConfigured() -> boolean`

Imports: dotenv

#### src/config/oauth.ts

**interface OAuthConfig** {
  clientId: string
  clientSecret: string
  redirectUri: string
  baseApiUrl: string
  oauthBaseUrl: string
  scope: string
}

Functions:
- `validateConfig() -> void`

Imports: dotenv

### Routes

#### src/routes/airtable-api.ts

Airtable API Routes Proxy routes for Airtable API operations. Requires Airtable authentication (separate from OnShape auth).

Routes: GET /config, GET /bases, GET /bases/:baseId/tables, GET /bases/:baseId/tables/:tableId/schema, GET /bases/:baseId/tables/:tableId/records

Imports: express

#### src/routes/airtable-auth.ts

Airtable Authentication Routes Handles OAuth 2.0 flow for Airtable authentication. Separate from OnShape auth to allow independent login/logout.

Routes: GET /login, GET /callback, GET /status, POST /logout, POST /refresh

Imports: express

#### src/routes/api.ts

Routes: GET /user, GET /documents, GET /documents/:id, GET /documents/:id/versions, GET /documents/:id/branches

Imports: express

#### src/routes/auth.ts

Routes: GET /login, GET /callback, GET /status, POST /logout

Imports: express

### Controllers

#### public/js/controllers/airtable-controller.js

AirtableController - handles Airtable authentication and thumbnail upload workflows

**class AirtableController**
  constructor(state, services, navigation)
  Methods:
    - _bindDashboardEvents()
    - _escapeHandler(e)
    - async _handleAirtableButtonClick()
    - async showUploadPage(restoredState = null)
    - async show(restoredState = null)
    - _navigateBack()
    - login()
    - async logout()

#### public/js/controllers/app-controller.js

**class AppController**
  constructor(state, services, navigation, controllers)
  Methods:
    - async init()
    - bindGlobalEvents()
    - updateAuthUI(state)

#### public/js/controllers/document-controller.js

DocumentController - orchestrates document flows

**class DocumentController**
  constructor(
    state,
    services,
    navigation,
    thumbnailService,
    router,
    historyState
  )
  Methods:
    - _bindDashboardEvents()
    - async refreshDashboard()
    - navigateToDocument(documentId)
    - async showDocument(documentId, restoredState)
    - async showList(restoredState)
    - async _initializeWorkspace(restoredState)
    - async loadWorkspaceRoot()
    - async loadFolder(folderId, updateBreadcrumbs = true, folderName = null)

#### public/js/controllers/export-controller.js

ExportController - orchestrates export workflow

**class ExportController**
  constructor(state, services, modalManager)
  Methods:
    - showExportModal(selectedDocuments = null)
    - async startExport(options)
    - cancelExport()

### Services

#### public/js/services/airtable-service.js

AirtableService - handles Airtable API interactions from frontend

**class AirtableService**
  Methods:
    - async getAuthStatus()
    - async getConfiguration()
    - login(returnTo = '/#/airtable/upload')
    - async logout()
    - async getBases()
    - async getTables(baseId)
    - async getTableSchema(baseId, tableId)
    - async uploadThumbnails(zipFile, config = {}, onProgress = null)

#### public/js/services/api-client.js

**class ApiClient**
  Methods:
    - async getAuthStatus()
    - async logout()
    - async getUser()
    - async getDocuments(limit = 50, offset = 0)
    - async getDocument(documentId)
    - async getDocumentVersions(documentId)
    - async getDocumentBranches(documentId)
    - async getCombinedDocumentHistory(documentId)

#### public/js/services/auth-service.js

**class AuthService**
  constructor(api)
  Methods:
    - async checkStatus()
    - login()
    - async logout()
    - async getUser()

#### public/js/services/document-service.js

DocumentService - document-related operations

**class DocumentService**
  constructor(api)
  Methods:
    - async getAll(limit = 50, offset = 0)
    - async getById(documentId)
    - async getVersions(documentId)
    - async getBranches(documentId)
    - async getCombinedHistory(documentId)
    - async getElements(documentId, workspaceId)
    - async getParts(documentId, workspaceId, elementId)
    - async getAssemblies(documentId, workspaceId, elementId)

#### public/js/services/export-service.js

ExportService - executes export workflows

**class ExportService**
  constructor(api)
  Methods:
    - async execute(options)
    - stream(options, handlers)

#### public/js/services/thumbnail-service.js

ThumbnailService - image handling and fallbacks

**class ThumbnailService**
  Methods:
    - setup(docId, originalUrl, proxyUrl)

#### src/services/airtable-api-client.ts

Airtable API Client Provides methods for interacting with Airtable's REST API. Handles record operations, schema retrieval, and attachment uploads.

**class AirtableApiClient**
  constructor(accessToken: string)
  Properties: axiosInstance: AxiosInstance, accessToken: string
  Methods:
    - async listBases() -> Promise<AirtableBasesResponse>
    - async listTables(baseId: string) -> Promise<
    - async getTables(baseId: string) -> Promise<
    - async listRecords(baseId: string, tableId: string, options?: {
      filterByFormula?: string;
      fields?: string[];
      maxRecords?: number;
      pageSize?: number;
      offset?: string;
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    }) -> Promise<AirtableListResponse>
    - async getRecord(baseId: string, tableId: string, recordId: string) -> Promise<AirtableRecord>
    - async updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, unknown>) -> Promise<AirtableRecord>
    - async getTableSchema(baseId: string, tableId: string) -> Promise<TableSchema>
    - async getFieldId(baseId: string, tableId: string, fieldName: string) -> Promise<string | null>

Imports: axios

#### src/services/airtable-oauth-service.ts

Airtable OAuth 2.0 Service Handles OAuth 2.0 Authorization Code flow with PKCE for Airtable. Similar pattern to OnShape OAuth service but adapted for Airtable's OAuth implementation.

**class AirtableOAuthService**
  Properties: clientId: string, clientSecret: string, redirectUri: string, scopes: string[], authorizationUrl: string, tokenUrl: string
  Methods:
    - generateRandomString(length: number = 32) -> string
    - generateCodeVerifier() -> string
    - generateCodeChallenge(verifier: string) -> string
    - generateAuthUrl(state: string, codeChallenge: string) -> string
    - async exchangeCodeForTokens(code: string, codeVerifier: string) -> Promise<AirtableTokenResponse>
    - async refreshAccessToken(refreshToken: string) -> Promise<AirtableTokenResponse>
    - isTokenExpired(expiresAt: number) -> boolean

Imports: axios, crypto

#### src/services/airtable-thumbnail-service.ts

Airtable Thumbnail Upload Service Handles processing ZIP files containing thumbnails and uploading them to matching Airtable records based on part number.

**class AirtableThumbnailService**
  constructor(apiClient: AirtableApiClient, config?: Partial<ThumbnailServiceConfig>)
  Properties: apiClient: AirtableApiClient, config: ThumbnailServiceConfig
  Methods:
    - parseFilename(filename: string) -> ParsedFilename | null
    - async findRecordByPartNumber(partNumber: string) -> Promise<AirtableRecord | null>
    - async uploadThumbnail(recordId: string, imageBuffer: Buffer, filename: string) -> Promise<void>

Imports: jszip, p-limit

#### src/services/api-call-cost.ts

Functions:
- `estimateCost(endpoint: string) -> number`

#### src/services/api-usage-tracker.ts

**class ApiUsageTracker**
  constructor(logFile = ".data/api-usage.jsonl")
  Properties: logFile: string, dataDir: string
  Methods:
    - async log(entry: UsageEntry) -> Promise<void>
    - async getStats(hours: number = 24) -> Promise<UsageStats>
    - async getEndpointBreakdown() -> Promise<EndpointStats[]>
    - async estimateCosts(costMap: Record<string, number> = {}) -> Promise<CostEstimate>

Imports: fs/promises, path

#### src/services/oauth-service.ts

**class OAuthService**
  Properties: instance: OAuthService

Imports: axios, uuid

#### src/services/onshape-api-client.ts

**class OnShapeApiClient**
  constructor(
    accessToken: string,
    userId?: string,
    tracker?: ApiUsageTracker
  )
  Properties: axiosInstance: AxiosInstance, accessToken: string, usageTracker?: ApiUsageTracker, userId?: string, baseApiRoot: string
  Methods:
    - async getCurrentUser() -> Promise<OnShapeUser>
    - async getDocuments(limit: number = 50, offset: number = 0) -> Promise<
    - async getDocument(documentId: string) -> Promise<OnShapeDocumentInfo>
    - async getDocumentVersions(documentId: string) -> Promise<any[]>
    - async getDocumentBranches(documentId: string) -> Promise<any[]>
    - async getDocumentHistory(documentId: string) -> Promise<any[]>
    - async getCombinedDocumentHistory(documentId: string) -> Promise<
    - async getComprehensiveDocument(documentId: string, params: any) -> Promise<any>

Imports: axios, p-limit, events

#### src/services/session-storage.ts

**class SessionStorage extends Store**
  Properties: instance: SessionStorage, sessionsFilePath: string, sessions: Record<string, any>

Imports: fs, path, express-session

#### src/services/usage-db.ts

**class UsageDatabase**
  constructor(dbPath = ".data/api-usage.db")
  Properties: db: Database.Database
  Methods:
    - logRequest(entry: UsageEntry)
    - getStats(hours = 24)

Imports: better-sqlite3

### States

#### public/js/state/app-state.js

**class AppState**
  Methods:
    - subscribe(listener)
    - getState()
    - setState(patch)
    - replaceState(newState)
    - toggleDocumentSelection(documentId)
    - toggleFolderSelection(folderId)
    - clearExportSelection()
    - getExportSelectionCount()

### Views

#### public/js/views/action-preview-modal.js

Action Preview Modal A reusable modal for showing progress and previewing content for copy/download actions. This is used to provide UX feedback so the app does not appear unresponsive.

Functions:
- `showProgress({ title, statusText })`
- `showPreview({
  title, statusText, contentText, ...)`
- `showError({ title, statusText, errorMessage })`
- `hide()`
- `isModalVisible()`

#### public/js/views/actions/document-actions.js

Action handlers for document-level operations

**class DocumentActions**
  constructor(controller)
  Methods:
    - async handleGetDocument(docId)
    - async handleGetJson(docData)
    - async handleCopyJson(docData)
    - async handleLoadHierarchy(docId, controller)
    - async handleExportCsv(docData, elements)

#### public/js/views/actions/element-actions.js

Action handlers for element-level operations

**class ElementActions**
  constructor(controller, documentService)
  Methods:
    - _getInFlightSet(action)
    - _isDuplicateClick(action, key, windowMs = 750)
    - async _runSingleFlight(action, key, fn)
    - async handleCopyElementJson(element, controller)
    - async handleFetchBomJson(element, documentId, workspaceId, service)
    - async handleDownloadBomCsv(element, documentId, workspaceId, service)
    - async handleFullExtract(element, documentId, workspaceId, service)

#### public/js/views/airtable-upload-view.js

AirtableUploadView - UI for uploading thumbnails to Airtable

**class AirtableUploadView extends BaseView**
  constructor(containerSelector, controller, airtableService)
  Methods:
    - async render(isAuthenticated)
    - _renderUnauthenticated()
    - async _renderAuthenticated()
    - _bindLoginButton()
    - _bindEvents()
    - _bindDropzone()
    - _handleFileSelect(file)
    - _clearFile()

#### public/js/views/base-view.js

BaseView - abstract base with common helpers

**class BaseView**
  constructor(containerSelector)
  Methods:
    - ensureContainer()
    - clear()
    - renderHtml(html)
    - bind()
    - unbind()

#### public/js/views/document-detail-view.js

DocumentDetailView - slim orchestration layer

**class DocumentDetailView extends BaseView**
  constructor(containerSelector, controller, thumbnailService)
  Methods:
    - render(docData, elements)
    - _renderTopBar(docData)
    - _renderElementsPanel(elements)
    - _renderElementsTabs()
    - _bindElementsTabs(elementsContainer, elements)
    - _filterElementsByTab(elements, tabId)
    - _isAssemblyElement(el)
    - _isBillOfMaterialsElement(el)

#### public/js/views/document-list-view.js

DocumentListView - renders document grid/table

**class DocumentListView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - render(documents, pagination = null)
    - bind()
    - _bindPaginationControls()
    - _notifySelectionChanged()
    - _delegate(selector, eventName, handler)
    - unbind()
    - captureState()
    - restoreState(state)

#### public/js/views/element-detail-view.js

**class ElementDetailView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - render(element)
    - _bindBackButton()
    - captureState()
    - restoreState(state)

#### public/js/views/export-filter-modal.js

Modal for configuring export filters before pre-scan. Allows filtering by folder prefix to limit scope of export.

**class ExportFilterModal**
  Methods:
    - prompt()
    - _show()
    - hide()
    - _handleKeyDown(e)
    - _renderContent()
    - _handleConfirm()
    - _handleCancel()

#### public/js/views/export-progress-modal.js

Modal view for displaying real-time export progress. Connects to SSE endpoint and shows progress bar, ETA, status.

**class ExportProgressModal**
  Methods:
    - show({ stats, workers = 4, delay = 100, onComplete, onCancel, onError, startExport })
    - renderInitialContent(stats)
    - handleProgress(event)
    - logProgress(event)
    - updatePhase(phase, fetch)
    - updateProgressBar(percent)
    - updateCount(type, value)
    - updateCurrentItem(text)

#### public/js/views/export-stats-modal.js

Modal view for displaying pre-scan export statistics. Shows before starting full aggregate BOM export. Enhanced with live stats, root folder visualization, and cancel/resume capability.

**class ExportStatsModal**
  Methods:
    - show(stats, { onConfirm, onCancel, isPartial = false, selectionCount = 0, prefixFilter = null })
    - hide()
    - clearCheckpointOnSuccess()
    - _handleKeyDown(e)
    - renderModalContent(stats, { isPartial = false, selectionCount = 0, prefixFilter = null } = {})
    - handleConfirm()
    - handleCancel()
    - showLoading()

#### public/js/views/full-extract-modal.js

Full Extract Progress Modal Displays progress for the Full Assembly Extraction feature. Shows phases, progress bar, and status messages.

Functions:
- `showModal(assemblyName)`
- `hideModal()`
- `isModalVisible()`
- `updateProgress(progress)`

#### public/js/views/helpers/document-info-renderer.js

Pure rendering functions for document metadata sections

Functions:
- `renderDocumentInfo(docData)`
- `renderThumbnailSection(docData)`
- `renderTagsAndLabels(docData)`

#### public/js/views/helpers/element-list-renderer.js

Pure rendering for elements list

Functions:
- `renderElementsList(elements)`
- `renderElementItem(element)`
- `renderElementActions(element)`

#### public/js/views/helpers/pagination-renderer.js

Pure rendering functions for pagination controls

Functions:
- `renderPaginationControls(pagination) -> string`
- `renderDocumentRows(documents) -> string`

#### public/js/views/modal-manager.js

ModalManager - controls export and progress modals

**class ModalManager**
  Methods:
    - setHandlers(handlers)
    - showExport()
    - hideExport()
    - showProgress()
    - hideProgress()
    - bindExportModalEvents()
    - bindProgressModalEvents()
    - readExportOptions()

#### public/js/views/navigation.js

Navigation - page transitions

**class Navigation**
  Methods:
    - navigateTo(pageId)
    - getCurrentPage()

#### public/js/views/part-detail-view.js

PartDetailView - renders part details and mass properties

**class PartDetailView**
  Methods:
    - render(part)
    - _bindBackButton()
    - captureState()
    - restoreState(state)

#### public/js/views/workspace-view.js

Insert zero-width space BEFORE natural word separators to allow line breaks This prevents breaks in the middle of words like "PCBAs" becoming "PCB" + "As" The break opportunity is placed BEFORE the...

**class WorkspaceView extends BaseView**
  constructor(containerSelector, controller)
  Methods:
    - bind()
    - showLoading()
    - hideLoading()
    - showError(msg)
    - hideError()
    - render(items, breadcrumbs, workspaceName = null)
    - _updateWorkspaceName(name)
    - _renderBreadcrumbs(path)

### Utils

#### public/js/utils/aggregateBomToCSV.js

Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging.

Functions:
- `aggregateBomToCSV(aggregateResult, options) -> string`

#### public/js/utils/bomToCSV.js

Convert Onshape BOM JSON to CSV.

Functions:
- `bomToCSV(bomJson)`

#### public/js/utils/clipboard.js

Clipboard utilities

Functions:
- `async copyToClipboard(text)`

#### public/js/utils/dom-helpers.js

DOM helpers and safe HTML utilities

Functions:
- `qs(selector, root)`
- `qsa(selector, root)`
- `on(el, event, handler, options)`
- `delegate(root, selector, eventName, handler)`
- `escapeHtml(text)`

#### public/js/utils/download.js

Download helpers

Functions:
- `downloadJson(data, filenamePrefix)`

#### public/js/utils/file-download.js

Generic file download utilities

Functions:
- `downloadJson(data, filename)`
- `downloadCsv(csvString, filename)`
- `createDownloadLink(blob, filename)`

#### public/js/utils/format-helpers.js

Formatting helpers (pure functions)

Functions:
- `formatDateWithUser(dateStr, userObj)`

#### public/js/utils/fullAssemblyExporter.js

Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item (organized by part number prefix)

Functions:
- `sanitizeForFilename(str, maxLength) -> string`
- `buildThumbnailFilename(rowData) -> string`
- `buildThumbnailUrl(info, size) -> string|null`
- `parseBomRow(row, headerMap, legacyHeaderMap, index) -> Object`
- `async fullAssemblyExtract(options)`

Imports: jszip

#### public/js/utils/getCSV.js

Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX,...

Functions:
- `getCSV(parts) -> string`

#### public/js/utils/massCSVExporter.js

Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2.

Functions:
- `async exportAllDocumentsAsZip(apiClient, documentService)`
- `async exportAllDocuments(apiClient, documentService)`

Imports: jszip

#### public/js/utils/toast-notification.js

Centralized toast notification system

Functions:
- `showToast(message, duration)`

### Types

#### src/types/airtable.d.ts

Airtable Type Definitions Type definitions for Airtable session data and API structures.

**interface AirtableSessionData** {
  accessToken: string
  refreshToken: string
  tokenExpiry: number
  scope: string
}

**interface AirtableOAuthState** {
  codeVerifier: string
  state: string
}

#### src/types/onshape.ts

OnShape API Types Shared type definitions for OnShape API responses and internal data structures

**type OnShapeElementType**

**interface OnShapeUser** {
  id: string
  name: string
  email: string
  firstName?: string
  lastName?: string
}

**interface AssemblyReference** {
  documentId: string
  documentName: string
  workspaceId: string
  elementId: string
  elementName: string
  folderPath: string[]
}

**interface AssemblyBomFetchResult** {
  source: {...}
  assembly: {...}
  bom: {...}
  error?: string
  fetchDurationMs?: number
}

**interface DirectoryStats** {
  scanDate: string
  scanDurationMs: number
  summary: {...}
  elementTypes: {...}
  estimates: {...}
  assemblies: AssemblyReference[]
}

#### src/types/usage.d.ts

**interface UsageEntry** {
  timestamp: string
  endpoint: string
  method: string
  userId?: string
  responseTime: number
  status: number
  cached?: boolean
}

**interface UsageStats** {
  timeWindow: string
  summary: {...}
  byEndpoint: EndpointStats[]
  byUser: UserStats[]
  responseTimePercentiles: {...}
}

**interface EndpointStats** {
  endpoint: string
  count: number
  avgResponseTime: number
  errorRate: number
}

**interface UserStats** {
  userId: string
  count: number
  avgResponseTime: number
}

**interface CostEstimate** {
  totalEstimatedCost: number
  costByEndpoint: Array<{...}>
}

### Modules

#### public/js/router/routes.js

Route definitions and configuration. Provides: - ROUTES map with normalized route patterns - configureRoutes(router, controllers) to bind patterns to controller handlers

Functions:
- `configureRoutes(router, controllers)`
- `pathTo(pattern, params, query) -> string`

#### src/index.ts [entry]

Routes: USE /auth, USE /auth/airtable, USE /api, USE /api/airtable, GET /

Imports: express, cors, helmet, morgan, cookie-parser, express-session, path, url

## Dependencies

axios, better-sqlite3, cookie-parser, cors, crypto-js, dotenv, express, express-session, helmet, jszip, morgan, p-limit, uuid
