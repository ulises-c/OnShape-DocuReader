# OnShape DocuReader – Efficient SPEC file for LLMs & AI Agents

> Last Updated: 2025-12-12 15:00:00 PST

## Overview

OnShape DocuReader is a secure web application that authenticates against the OnShape API v12 using OAuth 2.0 PKCE to let users browse their documents, inspect elements and metadata, and execute comprehensive exports (JSON, ZIP, CSV) with progress tracking. The project deliberately avoids heavy frontend frameworks, instead using modular vanilla JavaScript paired with a TypeScript/Express backend.

## Core Capabilities

- OAuth 2.0 PKCE login, session management, and logout.
- Document listing with pagination, search, selection, and thumbnail previews.
- Detail views for documents, elements, assemblies, parts, metadata, and raw JSON.
- Aggregate export workflows: single document, selected documents, “Get All,” CSV/BOM conversion, ZIP packaging, and mass exporters.
- Progress tracking via modals, logs, and SSE streaming.
- API usage tracking groundwork (usage DB, cost calculator, usage tracker service).
- Notes directory containing architecture, instructions, API reference, prompts, TODO, and response logs.

## Architecture

```
Browser (public/)
├── Controllers (app, document, export)
├── Services (api-client, auth, document, export, thumbnail)
├── Views (list/detail/element/part/modal/navigation)
├── State (HistoryState)
├── Router (hash-based)
└── Utils (clipboard, DOM helpers, downloaders, CSV/BOM helpers)

Express Server (src/)
├── index.ts (app bootstrap, middleware, routes)
├── config/ (OAuth configuration & validation)
├── routes/
│   ├── auth.ts (login/callback/status/logout)
│   └── api.ts (documents, elements, hierarchy, exports, thumbnails)
├── services/
│   ├── oauth-service.ts (PKCE helper, token exchange)
│   ├── onshape-api-client.ts (typed OnShape client & exports)
│   ├── api-usage-tracker.ts & api-call-cost.ts (usage instrumentation)
│   ├── usage-db.ts (SQLite persistence for usage data)
│   └── session-storage.ts (file-backed session store)
└── types/
    ├── onshape.ts (shared interfaces: documents, export metadata, SSE progress)
    ├── session.d.ts (express-session augmentation)
    └── usage.d.ts (usage tracking types)
```

### Backend Highlights

- TypeScript, Express 5, NodeNext modules.
- Middleware: Helmet, CORS, morgan, cookie-parser, express-session (file-backed).
- OnShape API integration through `OnShapeApiClient`, covering documents, elements, assemblies, metadata, mass properties, thumbnails, directory stats, aggregate BOM exports (sequential and parallel with `p-limit`), and SSE-ready progress callbacks.
- Export endpoints: `/api/export/aggregate-bom` (JSON result) and planned `/api/export/aggregate-bom-stream` with SSE emitter.
- Support services for OAuth PKCE flow, session persistence, and planned API usage logging.

### Frontend Highlights

- Vanilla ES modules loaded via Vite dev server; no frameworks.
- Controllers orchestrate services and views, maintain pagination state, and drive exports.
- Services encapsulate all `fetch` logic; `ApiClient` exposes typed calls with optional parameters (delay, workers, pagination).
- Views render HTML via helper modules, capture/restore UI state (HistoryState), and rely on delegation for events.
- Utilities include CSV/BOM conversion, download helpers, DOM helpers, and clipboard support.
- Dashboard includes pagination, selection indicators, export buttons, and detail pane navigation.

## Data Flow

1. **Authentication**

   ```
   User → /auth/login → OnShape OAuth (PKCE) → /auth/callback → session cookies → dashboard
   ```

2. **Document Retrieval**

   ```
   Frontend Controller → DocumentService/ApiClient → /api/documents?limit&offset → OnShape API → response rendered in DocumentListView
   ```

3. **Detail Navigation**

   ```
   Router hash change → controller fetches document/elements → views render metadata, elements, mass properties
   ```

4. **Exports**

   - **Aggregate BOM:**
     ```
     Controller → DocumentService.getAggregateBom(delay, workers) → /api/export/aggregate-bom → OnShapeApiClient BFS + parallel BOM fetch → JSON download
     ```
   - **Streaming:**
     ```
     Frontend EventSource → /api/export/aggregate-bom-stream → SSEEmitter(progress events) → UI progress bar
     ```
   - **CSV Utilities:**
     ```
     BOM JSON → bomToCSV/getFilteredCSV/massCSVExporter → download helper
     ```

5. **API Usage Tracking**

   - Services `api-usage-tracker.ts`, `api-call-cost.ts`, and `usage-db.ts` collect and store per-call metrics (infrastructure present, UI integration pending per TODO).

## Security Considerations

- PKCE ensures secure OAuth without embedding client secrets on the frontend.
- Tokens stay server-side in HTTP-only sessions; frontend sees only session cookie.
- Helmet-provided headers, CORS configuration, and CSRF-safe flows.
- Thumbnail proxy prevents direct credential exposure.
- Input validation and careful error handling, especially when relaying OnShape errors.
- Planned API usage tracking enforces rate-awareness.

## Documentation & Workflow

- `notes/` directory anchors project knowledge: architecture, instructions, API reference, prompts, TODO, output logs, quick reference, and archived history.
- Strict documentation standards: all files start with “What is this file?”, PST timestamps in history, consistent headings/lists.
- Development phases captured in `notes/PROMPT.md`; responses summarized in `notes/RESPONSE.md`; TODO backlog maintained in `notes/TODO.md`.
- Build commands: `npm run dev` (nodemon + Vite), `npm run build`, `npm start`.
- TypeScript configuration targets ES2020, NodeNext modules, strict mode, no emit during dev (`noEmit: true`).

## Airtable Integration

The application supports optional Airtable integration for uploading CAD thumbnails to matching Airtable records.

### Architecture

```
Frontend (Browser)
├── AirtableController - Orchestrates auth flow and upload UI
│   ├── showUploadPage() - Render upload view with auth status
│   ├── navigateToUpload() - Router-based navigation
│   └── Router integration for ROUTES.AIRTABLE_UPLOAD
├── AirtableService - API calls to backend Airtable routes
│   ├── getAuthStatus() - Check authentication
│   ├── getConfiguration() - Check server config
│   ├── login() / logout() - Auth flow
│   ├── getBases() / getTables() - List resources
│   └── uploadThumbnails() - ZIP upload with progress
└── AirtableUploadView - ZIP upload UI with progress tracking
    ├── Drag-and-drop ZIP upload
    ├── Dry run mode toggle
    ├── Progress bar and status log
    └── Auth status display

Backend (Express)
├── /auth/airtable/* - OAuth 2.0 routes
│   ├── GET /login - Initiate OAuth with PKCE
│   ├── GET /callback - Handle OAuth callback
│   ├── GET /status - Check auth status
│   └── POST /logout - Clear Airtable session
├── /api/airtable/* - API proxy routes
│   ├── GET /config - Check server configuration (no auth)
│   ├── GET /bases - List accessible bases
│   ├── GET /bases/:baseId/tables - List tables
│   ├── GET /bases/:baseId/tables/:tableId/schema - Get field schema
│   └── POST /upload-thumbnails - Process ZIP and upload
├── AirtableOAuthService - PKCE OAuth flow
│   ├── generateAuthUrl() - Build OAuth URL with code challenge
│   ├── exchangeCodeForTokens() - Exchange code for tokens
│   └── refreshAccessToken() - Token refresh
├── AirtableApiClient - REST API client
│   ├── listBases() / listTables() - Resource listing
│   ├── listRecords() - Query with filterByFormula
│   ├── getTableSchema() - Get field IDs for uploads
│   └── uploadAttachment() - Direct attachment upload
└── AirtableThumbnailService - ZIP processing
    ├── parseFilename() - Extract part number from filename
    ├── processZipFile() - Extract and process thumbnails
    ├── findRecordByPartNumber() - Match to Airtable records
    └── uploadThumbnail() - Upload single attachment
```

### Key Features

- **Separate OAuth Flow**: Airtable auth is independent from OnShape auth
- **PKCE Security**: Uses OAuth 2.0 Authorization Code flow with PKCE (S256)
- **ZIP Processing**: Server-side extraction of thumbnail ZIP files via JSZip
- **Part Number Matching**: Filenames parsed as `{bomItem}_{partNumber}_{name}.png`
- **Direct Upload**: Uses Airtable's content upload API (requires field ID from schema)
- **Dry Run Mode**: Preview matches without uploading
- **Progress Tracking**: Real-time upload progress via callbacks with phase indicators
- **Parallel Processing**: Matching phase uses p-limit for concurrent API calls (configurable workers)
- **Rate Limiting**: 5 requests/second per base (Airtable limit), uploads sequential

### Import Notes

When importing from `airtable-api-client.ts`, use type-only imports for interfaces:
```typescript
import { AirtableApiClient } from './airtable-api-client.ts';
import type { AirtableRecord } from './airtable-api-client.ts';
```

This ensures proper ESM compatibility with TypeScript's NodeNext module resolution.

### Frontend Components

**AirtableController** (`public/js/controllers/airtable-controller.js`)
- Orchestrates Airtable authentication and upload workflows
- Manages auth status cache and header indicator updates
- Handles navigation to/from upload page
- Methods: `showUploadPage()`, `login()`, `logout()`, `refreshAuthStatus()`

**AirtableUploadView** (`public/js/views/airtable-upload-view.js`)
- Renders upload UI with drag-drop zone for ZIP files
- Shows auth-required state when not authenticated
- Displays progress during upload and results table on completion
- Supports dry-run mode to preview matches without uploading

**AirtableService** (`public/js/services/airtable-service.js`)
- Frontend API client for Airtable routes
- Methods: `getAuthStatus()`, `getConfiguration()`, `login()`, `logout()`, `uploadThumbnails()`

### AirtableApiClient Methods

| Method | Description |
|--------|-------------|
| `listBases()` | List all accessible bases |
| `listTables(baseId)` / `getTables(baseId)` | List tables in a base |
| `listRecords(baseId, tableId, options?)` | Query records with filtering, pagination |
| `getRecord(baseId, tableId, recordId)` | Get single record by ID |
| `updateRecord(baseId, tableId, recordId, fields)` | Update record fields |
| `getTableSchema(baseId, tableId)` | Get table schema with field IDs |
| `getFieldId(baseId, tableId, fieldName)` | Find field ID by name |
| `uploadAttachment(baseId, recordId, fieldId, buffer, filename, contentType)` | Direct file upload |
| `findRecordsByField(baseId, tableId, fieldName, value, options?)` | Find records by field value |
| `findRecordByField(baseId, tableId, fieldName, value)` | Find single record by field |
| `findRecordByPartNumber(baseId, tableId, partNumber, partNumberField?)` | Find record by part number |

### Rate Limiting

- Airtable API limit: 5 requests/second per base
- Matching phase: Max 2 concurrent workers with 250ms staggered delays (~4 req/sec)
- Upload phase: Sequential with 300ms delay between uploads (content API is stricter)
- 429 errors are caught and reported with user-friendly messages

### Routes

| Method | Endpoint                                             | Auth | Description                |
| ------ | ---------------------------------------------------- | ---- | -------------------------- |
| GET    | `/auth/airtable/login`                               | No   | Initiate OAuth flow        |
| GET    | `/auth/airtable/callback`                            | No   | OAuth callback handler     |
| GET    | `/auth/airtable/status`                              | No   | Check auth status          |
| POST   | `/auth/airtable/logout`                              | Yes  | Clear Airtable session     |
| GET    | `/api/airtable/config`                               | No   | Check server configuration |
| GET    | `/api/airtable/bases`                                | Yes  | List accessible bases      |
| GET    | `/api/airtable/bases/:baseId/tables`                 | Yes  | List tables in base        |
| GET    | `/api/airtable/bases/:baseId/tables/:tableId/schema` | Yes  | Get table field schema     |
| POST   | `/api/airtable/upload-thumbnails`                    | Yes  | Upload thumbnails from ZIP |

### Environment Variables

```bash
# Airtable OAuth Configuration
AIRTABLE_CLIENT_ID=...
AIRTABLE_CLIENT_SECRET=...
AIRTABLE_REDIRECT_URI=http://localhost:3000/auth/airtable/callback

# Airtable Database Configuration (optional defaults)
AIRTABLE_BASE_ID=appXXXXXXXX
AIRTABLE_TABLE_ID=tblXXXXXXXX
AIRTABLE_PART_NUMBER_FIELD=Part number
AIRTABLE_THUMBNAIL_FIELD=CAD_Thumbnail
```

### CSS Styles

Airtable upload styles in `public/css/views/airtable-upload.css`:
- Auth-required state with login prompt
- Dropzone with drag-drop support  
- Progress bar and status indicators
- Results table with status badges
- Summary grid with upload statistics
- Status badges for uploaded/skipped/no_match/error
- Responsive layout for mobile

### Auth Indicator

The dashboard header includes an Airtable auth indicator:
- Green dot when authenticated (`authenticated` class)
- Gray dot when not authenticated (`unauthenticated` class)
- Located in `#airtableAuthIndicator` element within `#airtableUploadBtn`

### Data Flow

1. **Configuration Check**: Frontend calls `/api/airtable/config` to verify server setup
2. **Authentication**: User clicks Airtable button → OAuth flow with PKCE → tokens stored in session
   - In development, OAuth callback redirects to Vite dev server (port 5173)
   - In production, redirects to Express server origin
   - Return path stored in session to restore navigation after auth
3. **Upload Flow**:
   - User uploads ZIP file containing thumbnails
   - **Phase 1 (Extracting)**: Server extracts ZIP, parses filenames for part numbers
   - **Phase 2 (Matching)**: Parallel queries to Airtable for matching records (max 2 workers, 250ms delays)
   - **Phase 3 (Uploading)**: Sequential uploads using direct upload API (300ms delays)
   - Progress reported back to frontend with phase indicators
4. **Report Download**:
   - After processing completes, results stored in view state
   - User can download JSON or CSV report with full results
   - CSV includes metadata header with timestamp, file name, mode, and summary