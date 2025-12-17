# onshape-docureader

Generated: 2025-12-16 16:00

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
├── tsconfig.json
└── vite.config.js
```

## Stats

Files: 60 | Lines: 14,120 | Routes: 44 | TODOs: 6

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
- GET /thumbnail-proxy
- GET /usage/stats

## TODOs

- [bomToCSV.js] TODO: Check for edge cases, e.g. commas, quotes in values
- [airtable-upload-view.js] TODO: Implement actual cancellation if using streaming upload
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
- `isAirtableConfigured() -> boolean` - Check if Airtable is configured
- `isAirtableDatabaseConfigured() -> boolean` - Check if Airtable database configuration is complete

Imports: dotenv

```typescript
/**
 * Airtable OAuth & API Configuration
 * 
 * Configuration for Airtable OAuth 2.0 integration and API access.
 * Requires environment variables to be set for credentials and database IDs.
 */
import dotenv from 'dotenv';
dotenv.config();
export interface AirtableConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  contentBaseUrl: string;
  baseId: string;
  tableId: string;
  partNumberField: string;
  thumbnailField: string;
}
export const airtableConfig: AirtableConfig = {
  clientId: process.env.AIRTABLE_CLIENT_ID || '',
  clientSecret: process.env.AIRTABLE_CLIENT_SECRET || '',
  redirectUri: process.env.AIRTABLE_REDIRECT_URI || 'http://localhost:3000/auth/airtable/callback',
  scopes: [
    'data.records:read',
    'data.records:write',
    'schema.bases:read',
    'user.email:read'  // Optional: for displaying user info
  ],
  authorizationUrl: 'https://airtable.com/oauth2/v1/authorize',
  tokenUrl: 'https://airtable.com/oauth2/v1/token',
  apiBaseUrl: 'https://api.airtable.com/v0',
  contentBaseUrl: 'https://content.airtable.com/v0',
  baseId: process.env.AIRTABLE_BASE_ID || '',
  tableId: process.env.AIRTABLE_TABLE_ID || '',
  partNumberField: process.env.AIRTABLE_PART_NUMBER_FIELD || 'Part number',
  thumbnailField: process.env.AIRTABLE_THUMBNAIL_FIELD || 'CAD_Thumbnail',
```

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

```typescript
dotenv.config();
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseApiUrl: string;
  oauthBaseUrl: string;
  scope: string;
}
function getRedirectUri(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ONSHAPE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
  }
  return 'http://localhost:3000/auth/callback';
}
export const oauthConfig: OAuthConfig = {
  clientId: process.env.ONSHAPE_CLIENT_ID || '',
  clientSecret: process.env.ONSHAPE_CLIENT_SECRET || '',
  redirectUri: getRedirectUri(),
  baseApiUrl: process.env.ONSHAPE_API_BASE_URL || 'https://cad.onshape.com/api/v12',
  oauthBaseUrl: process.env.ONSHAPE_OAUTH_BASE_URL || 'https://oauth.onshape.com',
  scope: 'OAuth2Read OAuth2ReadPII'
};
export function validateConfig(): void {
  const required = ['ONSHAPE_CLIENT_ID', 'ONSHAPE_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Routes

#### src/routes/airtable-api.ts

Airtable API Routes Proxy routes for Airtable API operations. Requires Airtable authentication (separate from OnShape auth).

Routes: GET /config, GET /bases, GET /bases/:baseId/tables, GET /bases/:baseId/tables/:tableId/schema, GET /bases/:baseId/tables/:tableId/records

Imports: express

```typescript
/**
 * Airtable API Routes
 * 
 * Proxy routes for Airtable API operations.
 * Requires Airtable authentication (separate from OnShape auth).
 */
import { Router } from 'express';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AirtableApiClient } from '../services/airtable-api-client.ts';
import { AirtableThumbnailService } from '../services/airtable-thumbnail-service.ts';
import { isAirtableConfigured, isAirtableDatabaseConfigured, airtableConfig } from '../config/airtable.ts';
const router = Router();
/**
 * Middleware to require Airtable authentication
 */
const requireAirtableAuth = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (!isAirtableConfigured()) {
    return res.status(503).json({ error: 'Airtable not configured' });
  }
  if (!req.session?.airtable?.accessToken) {
    return res.status(401).json({ error: 'Airtable authentication required' });
  }
  next();
};
/**
 * GET /api/airtable/config
 * Get Airtable configuration status (without secrets)
 */
router.get('/config', (req: Request, res: Response): Response => {
  return res.json({
    configured: isAirtableConfigured(),
    databaseConfigured: isAirtableDatabaseConfigured(),
    baseId: airtableConfig.baseId ? '***configured***' : null,
    tableId: airtableConfig.tableId ? '***configured***' : null,
    partNumberField: airtableConfig.partNumberField,
    thumbnailField: airtableConfig.thumbnailField,
  });
});
router.use(requireAirtableAuth);
```

#### src/routes/airtable-auth.ts

Airtable Authentication Routes Handles OAuth 2.0 flow for Airtable authentication. Separate from OnShape auth to allow independent login/logout.

Routes: GET /login, GET /callback, GET /status, POST /logout, POST /refresh

Imports: express

```typescript
/**
 * Airtable Authentication Routes
 * 
 * Handles OAuth 2.0 flow for Airtable authentication.
 * Separate from OnShape auth to allow independent login/logout.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { airtableOAuthService } from '../services/airtable-oauth-service.ts';
import { isAirtableConfigured } from '../config/airtable.ts';
const router = Router();
/**
 * GET /auth/airtable/login
 * Initiate Airtable OAuth flow
 */
router.get('/login', (req: Request, res: Response): void => {
  if (!isAirtableConfigured()) {
    res.status(503).json({ error: 'Airtable OAuth not configured' });
    return;
  }
  try {
    const codeVerifier = airtableOAuthService.generateCodeVerifier();
    const codeChallenge = airtableOAuthService.generateCodeChallenge(codeVerifier);
    const state = airtableOAuthService.generateRandomString(16);
    req.session.airtableCodeVerifier = codeVerifier;
    req.session.airtableOauthState = state;
    const returnTo = (req.query.returnTo as string) || '/#/documents';
    req.session.airtableReturnTo = returnTo;
    const authUrl = airtableOAuthService.generateAuthUrl(state, codeChallenge);
    console.log('[Airtable Auth] Initiating OAuth flow');
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('[Airtable Auth] Login error:', error);
    res.status(500).json({ error: 'Failed to initiate Airtable login' });
  }
});
/**
 * GET /auth/airtable/callback
 * Handle OAuth callback from Airtable
 */
```

#### src/routes/api.ts

Routes: GET /user, GET /documents, GET /documents/:id, GET /documents/:id/versions, GET /documents/:id/branches

Imports: express

```typescript
const router = Router();
const exportPreparedData = new Map<string, {
  assemblies: AssemblyReference[];
  createdAt: number;
  scope?: { scope: 'full' | 'partial'; documentIds?: string[]; folderIds?: string[] };
  prefixFilter?: string;
}>();
setInterval(() => {
  const now = Date.now();
  const TTL = 30 * 60 * 1000; // 30 minutes
  for (const [id, data] of exportPreparedData.entries()) {
    if (now - data.createdAt > TTL) {
      exportPreparedData.delete(id);
      console.log(`[Export] Cleaned up expired export data: ${id}`);
    }
  }
}, 5 * 60 * 1000);
const usageTracker = new ApiUsageTracker();
const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
router.use(requireAuth);
router.get("/user", async (req: Request, res: Response): Promise<Response> => {
  try {
    process.stdout.write("[API] GET /api/user\n");
    const client = new OnShapeApiClient(
      req.session.accessToken!,
      req.session.userId,
      usageTracker
    );
    const user = await client.getCurrentUser();
    return res.json(user);
  } catch (error) {
```

#### src/routes/auth.ts

Routes: GET /login, GET /callback, GET /status, POST /logout

Imports: express

```typescript
const router = Router();
const oauthService = OAuthService.getInstance();
router.get("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const returnTo = (req.query.returnTo as string) || "/";
    req.session.returnTo = returnTo;
    const { url } = await oauthService.generateAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error("Auth URL generation error:", error);
    res.status(500).send("Failed to generate authentication URL");
  }
});
router.get(
  "/callback",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { code, state, error } = req.query;
      if (error) {
        return res.status(401).send(`Auth error: ${error}`);
      }
      if (!code || typeof code !== "string") {
        return res.status(400).send("No authorization code provided");
      }
      if (!state || typeof state !== "string") {
        return res.status(400).send("No state parameter provided");
      }
      const tokens = await oauthService.exchangeCodeForToken(code, state);
      req.session.accessToken = tokens.access_token;
      req.session.refreshToken = tokens.refresh_token;
      req.session.authenticated = true;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully, ID:", req.sessionID);
            resolve();
          }
```

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

```typescript
/**
 * AirtableController - handles Airtable authentication and thumbnail upload workflows
 */
import { AirtableUploadView } from '../views/airtable-upload-view.js';
import { ROUTES } from '../router/routes.js';
import { showToast } from '../utils/toast-notification.js';
export class AirtableController {
  constructor(state, services, navigation) {
    this.state = state;
    this.airtableService = services.airtableService;
    this.navigation = navigation;
    this.router = null; // Set by app.js after router initialization
    this.uploadView = new AirtableUploadView(
      '#airtableUploadContainer',
      this,
      this.airtableService
    );
    this._authStatusCache = null;
    this._authStatusCacheTime = 0;
    this._AUTH_CACHE_TTL = 30000; // 30 seconds
    this._bindDashboardEvents();
  }
  _bindDashboardEvents() {
    const airtableBtn = document.getElementById('airtableUploadBtn');
    if (airtableBtn) {
      airtableBtn.addEventListener('click', () => this._handleAirtableButtonClick());
    }
    const backBtn = document.getElementById('backFromAirtableBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._navigateBack());
    }
    document.addEventListener('keydown', this._escapeHandler.bind(this));
    this.refreshAuthStatus();
  }
  _escapeHandler(e) {
    if (e.key === 'Escape') {
      const currentPage = this.navigation.getCurrentPage();
      if (currentPage === 'airtableUpload') {
        this._navigateBack();
      }
```

#### public/js/controllers/app-controller.js

**class AppController**
  constructor(state, services, navigation, controllers)
  Methods:
    - async init()
    - bindGlobalEvents()
    - updateAuthUI(state)

```typescript
export class AppController {
  constructor(state, services, navigation, controllers) {
    this.state = state;
    this.authService = services.authService;
    this.navigation = navigation;
    this.documentController = controllers.documentController;
    this._logoutInProgress = false;
  }
  async init() {
    console.log('AppController.init() - Starting initialization');
    this.bindGlobalEvents();
    try {
      const status = await this.authService.checkStatus();
      console.log('Auth status result:', status);
      this.state.setState({
        isAuthenticated: !!status.authenticated,
      });
      if (status.authenticated) {
        console.log('User is authenticated, loading documents...');
        try {
          const user = await this.authService.getUser();
          console.log('User info loaded:', user);
          this.state.setState({ user });
        } catch (userError) {
          console.warn('Failed to fetch user info:', userError);
        }
        await this.documentController.loadDocuments();
        const currentHash = window.location.hash;
        if (!currentHash || currentHash === '#/' || currentHash === '#/landing') {
          console.log('No active route, router will set default to documents list');
        } else {
          console.log('Active route detected, staying on current page:', currentHash);
        }
      } else {
        console.log('User is not authenticated, showing landing page');
        const currentHash = window.location.hash;
        if (currentHash && currentHash !== '#/' && currentHash !== '#/landing') {
          console.log('Not authenticated but on protected route, redirecting to landing');
          window.location.hash = '#/';
        }
```

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

```typescript
/**
 * DocumentController - orchestrates document flows
 */
import { DocumentListView } from "../views/document-list-view.js";
import { DocumentDetailView } from "../views/document-detail-view.js";
import { ElementDetailView } from "../views/element-detail-view.js";
import { PartDetailView } from "../views/part-detail-view.js";
import { WorkspaceView } from "../views/workspace-view.js";
import { formatDateWithUser } from "../utils/format-helpers.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { escapeHtml } from "../utils/dom-helpers.js";
import { ROUTES, pathTo } from "../router/routes.js";
import { exportStatsModal } from "../views/export-stats-modal.js";
import { exportProgressModal } from "../views/export-progress-modal.js";
import { exportFilterModal } from "../views/export-filter-modal.js";
import { aggregateBomToCSV } from "../utils/aggregateBomToCSV.js";
import { showToast } from "../utils/toast-notification.js";
import { downloadJson, downloadCsv } from "../utils/file-download.js";
export class DocumentController {
  constructor(
    state,
    services,
    navigation,
    thumbnailService,
    router,
    historyState
  ) {
    this.state = state;
    this.documentService = services.documentService;
    this.navigation = navigation;
    this.router = router || null;
    this.historyState = historyState || null;
    this.listView = new DocumentListView("#documentsGrid", this);
    this.workspaceView = new WorkspaceView("#workspaceContainer", this);
    this.detailView = new DocumentDetailView(
      "#documentInfo",
      this,
      thumbnailService
    );
    this.elementView = new ElementDetailView("#elementInfo", this);
```

#### public/js/controllers/export-controller.js

ExportController - orchestrates export workflow

**class ExportController**
  constructor(state, services, modalManager)
  Methods:
    - showExportModal(selectedDocuments = null)
    - async startExport(options)
    - cancelExport()

```typescript
/**
 * ExportController - orchestrates export workflow
 */
import { downloadJson } from '../utils/download.js';
export class ExportController {
  constructor(state, services, modalManager) {
    this.state = state;
    this.exportService = services.exportService;
    this.modal = modalManager;
    this.modal.setHandlers({
      onStartExport: (options) => this.startExport(options),
      onCancelExport: () => this.cancelExport()
    });
  }
  showExportModal(selectedDocuments = null) {
    const docs = selectedDocuments ?? this.state.getState().documents;
    this._lastDocsCount = docs.length;
    this.modal.showExport();
    this.modal.updateEstimates(this._lastDocsCount);
  }
  async startExport(options) {
    console.log('Starting advanced export...');
    this.modal.showProgress();
    this.modal.setCurrentTask('Processing all documents...');
    this.modal.appendLog('📊 Processing documents...');
    let prog = 0;
    const total = 100;
    const timer = setInterval(() => {
      prog = Math.min(prog + 10, 90);
      this.modal.updateProgress(prog, total);
    }, 1000);
    try {
      const data = await this.exportService.execute(options);
      clearInterval(timer);
      this.modal.updateProgress(data.exportInfo.processedDocuments, data.exportInfo.totalDocuments);
      this.modal.appendLog('✅ Export completed successfully!');
      this.modal.appendLog(
        `📊 Processed ${data.exportInfo.processedDocuments}/${data.exportInfo.totalDocuments} documents`
      );
      downloadJson(data, 'onshape-export');
```

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
    - async getDocuments(limit = 20, offset = 0)
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
    - async getAll(limit = 20, offset = 0)
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

**interface AirtableRecord** {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

**interface AirtableListResponse** {
  records: AirtableRecord[]
  offset?: string
}

**interface TableField** {
  id: string
  name: string
  type: string
  description?: string
  options?: Record<string, unknown>
}

**interface TableSchema** {
  id: string
  name: string
  primaryFieldId: string
  fields: TableField[]
  views: Array<{...}>
}

**interface AttachmentResult** {
  id: string
  url: string
  filename: string
  size: number
  type: string
  width?: number
  height?: number
  thumbnails?: {...}
}

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

**interface AirtableTokens** {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

**interface AirtableTokenResponse** {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  scope: string
  expiresAt: number
}

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

**interface ParsedFilename** {
  bomItem: string
  partNumber: string
  itemName: string
  fullMatch: string
}

**interface ThumbnailUploadResult** {
  partNumber: string
  filename: string
  status: 'uploaded' | 'skipped' | 'error' | 'no_match'
  recordId?: string
  error?: string
}

**interface UploadProgress** {
  total: number
  processed: number
  uploaded: number
  skipped: number
  errors: number
  noMatch: number
  currentFile?: string
  phase: 'extracting' | 'matching' | 'uploading' | 'comp...
}

**interface ThumbnailServiceConfig** {
  baseId: string
  tableId: string
  partNumberField: string
  thumbnailField: string
}

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

**interface OAuthTokens** {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

**interface OAuthState** {
  state: string
  codeVerifier: string
}

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
    - async getDocuments(limit: number = 20, offset: number = 0) -> Promise<
    - async getDocument(documentId: string) -> Promise<OnShapeDocumentInfo>
    - async getDocumentVersions(documentId: string) -> Promise<any[]>
    - async getDocumentBranches(documentId: string) -> Promise<any[]>
    - async getDocumentHistory(documentId: string) -> Promise<any[]>
    - async getCombinedDocumentHistory(documentId: string) -> Promise<
    - async getComprehensiveDocument(documentId: string, params: any) -> Promise<any>

**interface OnShapeUser** {
  id: string
  name: string
  email: string
  company: string
  image: string
  firstName?: string
  lastName?: string
}

**interface OnShapeDocument** {
  id: string
  name: string
  isPublic: boolean
  owner: {...}
  createdBy?: {...}
  createdAt: string
  modifiedAt: string
  href: string
}

**interface OnShapeDocumentElement** {
  id: string
  name: string
  type: string
  elementType: string
  lengthUnits: string
  angleUnits: string
  massUnits: string
}

**interface OnShapeDocumentInfo** {
  id: string
  name: string
  description: string
  owner: {...}
  createdAt: string
  modifiedAt: string
  isPublic: boolean
  defaultWorkspace: {...}
  workspaces: Array<{...}>
}

**interface AxiosRequestConfig** {
  metadata?: {...}
}

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
    - _renderHistorySelector(docData)
    - _bindHistorySelector(docData)
    - async _handleLoadHistory(documentId)
    - _renderHistoryDropdown(history, documentId)
    - _bindHistoryDropdown(documentId)
    - _displayHistoryDetails(documentId, item)

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
- `showModal(assemblyName)` - Show the progress modal.
- `hideModal()` - Hide the progress modal.
- `isModalVisible()` - Check if modal is visible.
- `updateProgress(progress)` - Update modal with progress data.

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
- `renderPaginationControls(pagination) -> string` - Render pagination controls HTML
- `renderDocumentRows(documents) -> string` - Render document table rows Columns: Name, Date Modified, Location

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
- `aggregateBomToCSV(aggregateResult, options) -> string` - Convert aggregate BOM export result to flattened CSV. Adds source metadata columns and handles multi-assembly header merging.

#### public/js/utils/bomToCSV.js

Convert Onshape BOM JSON to CSV.

Functions:
- `bomToCSV(bomJson)`

#### public/js/utils/clipboard.js

Clipboard utilities

Functions:
- `async copyToClipboard(text)` - Clipboard utilities

#### public/js/utils/dom-helpers.js

DOM helpers and safe HTML utilities

Functions:
- `qs(selector, root)` - DOM helpers and safe HTML utilities
- `qsa(selector, root)` - DOM helpers and safe HTML utilities
- `on(el, event, handler, options)` - DOM helpers and safe HTML utilities
- `delegate(root, selector, eventName, handler)` - DOM helpers and safe HTML utilities
- `escapeHtml(text)` - DOM helpers and safe HTML utilities

#### public/js/utils/download.js

Download helpers

Functions:
- `downloadJson(data, filenamePrefix)` - Download helpers

#### public/js/utils/file-download.js

Generic file download utilities

Functions:
- `downloadJson(data, filename)` - Generic file download utilities
- `downloadCsv(csvString, filename)` - Generic file download utilities
- `createDownloadLink(blob, filename)` - Generic file download utilities

#### public/js/utils/format-helpers.js

Formatting helpers (pure functions)

Functions:
- `formatDateWithUser(dateStr, userObj)` - Formatting helpers (pure functions)

#### public/js/utils/fullAssemblyExporter.js

Full Assembly Exporter Exports a complete assembly package including: - Flattened BOM as JSON - Flattened BOM as CSV - Thumbnails for each BOM item - All packaged in a ZIP file

Functions:
- `sanitizeForFilename(str, maxLength) -> string` - Sanitize a string for use in filenames. Replaces invalid characters with underscores and truncates if needed.
- `buildThumbnailFilename(rowData) -> string` - Build a thumbnail filename from BOM row data. Format: {itemNumber}_{partNumber}_{name}.png
- `parseBomRow(row, headerMap, index) -> Object` - Parse a BOM row to extract thumbnail-relevant data. Matches the Python script approach: uses thumbnailInfo from BOM response when available.
- `buildThumbnailUrl(info, size) -> string|null` - Build the OnShape thumbnail URL for a part/element. This is the fallback method when directThumbnailUrl is not available. Supports both workspace (w) and version (v) references.
- `async fullAssemblyExtract(options)` - Perform full assembly extraction.

Imports: jszip

#### public/js/utils/getCSV.js

Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX,...

Functions:
- `getCSV(parts) -> string` - Generate CSV from parts data, filtering for ASM/PRT part numbers. Filters parts whose "Part number" property contains ASM or PRT patterns. Supports various formats: ASM-XXXXXX, PRT-XXXXXX,...

#### public/js/utils/massCSVExporter.js

Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails. Provides two export modes: 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe) 2.

Functions:
- `async exportAllDocumentsAsZip(apiClient, documentService)` - Export all documents as a single ZIP file with CSVs and thumbnails. This is the recommended approach as it triggers only one download.
- `async exportAllDocuments(apiClient, documentService)` - Export all documents as individual CSV and PNG files. This is a fallback approach that may be blocked by browsers for multiple downloads.

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
- `configureRoutes(router, controllers)` - Configure router with application routes.
- `pathTo(pattern, params, query) -> string` - Build a concrete path from a route pattern and params.

#### src/index.ts [entry]

Routes: USE /auth, USE /auth/airtable, USE /api, USE /api/airtable, GET /

Imports: express, cors, helmet, morgan, cookie-parser, express-session, path, url

```typescript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='",
              ],
              scriptSrcAttr: ["'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "http://localhost:3000"
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(
  morgan("dev", {
```

## Dependencies

axios, better-sqlite3, cookie-parser, cors, crypto-js, dotenv, express, express-session, helmet, jszip, morgan, p-limit, uuid
