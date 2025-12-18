# OnShape-DocuReader - Project Specification

Generated: 2025-12-17

A TypeScript/Express.js web application for browsing and exporting OnShape documents via OAuth 2.0, with Airtable integration for thumbnail uploads.

## Architecture Overview

```
Frontend (Vanilla JS ES6 Modules)
├── Controllers: app, document, export, airtable
├── Services: api-client, auth, document, export, airtable, thumbnail
├── Views: document-list, document-detail, element-detail, part-detail, workspace, airtable-upload
├── State: AppState, HistoryState
└── Router: Hash-based SPA routing

Backend (TypeScript/Node.js/Express)
├── Routes: /auth, /auth/airtable, /api, /api/airtable
├── Services: oauth, onshape-api-client, airtable-api-client, session-storage
└── Config: oauth, airtable
```

## Key File Paths

| Category | Path | Purpose |
|----------|------|---------|
| Entry | `src/index.ts` | Express server setup |
| Frontend | `public/js/app.js` | App bootstrap |
| Routes | `src/routes/*.ts` | API endpoints |
| Services | `src/services/*.ts` | Business logic |
| Controllers | `public/js/controllers/*.js` | UI orchestration |
| Views | `public/js/views/*.js` | DOM rendering |

## API Routes Summary

### Authentication
- `GET /auth/login` - Initiate OnShape OAuth
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status` - Check auth status
- `POST /auth/logout` - End session

### Airtable Auth
- `GET /auth/airtable/login` - Initiate Airtable OAuth
- `GET /auth/airtable/callback` - Airtable callback
- `GET /auth/airtable/status` - Check Airtable auth
- `POST /auth/airtable/logout` - End Airtable session

### OnShape API
- `GET /api/user` - Current user info
- `GET /api/documents` - List documents (paginated)
- `GET /api/documents/:id` - Document details
- `GET /api/documents/:id/comprehensive` - Full document data
- `GET /api/documents/:id/workspaces/:wid/elements` - Document elements
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/bom` - BOM data
- `GET /api/onshape/folders` - Root folders via globaltreenodes
- `GET /api/onshape/folders/:id` - Folder contents
- `GET /api/thumbnail-metadata` - Thumbnail sizes/URLs fallback

### Export
- `GET /api/export/all` - Export all documents
- `GET /api/export/stream` - SSE progress stream
- `GET /api/export/directory-stats` - Pre-scan statistics
- `POST /api/export/prepare-assemblies` - Prepare assembly export
- `GET /api/export/aggregate-bom` - Aggregate BOM export

### Airtable API
- `GET /api/airtable/config` - Configuration status
- `GET /api/airtable/bases` - List bases
- `POST /api/airtable/upload-thumbnails` - Upload thumbnails to records

## Button Action UI (Progress + Preview Modals)

The UI provides modal popups for common element/document actions so the app never feels unresponsive, and the user can inspect and copy the exact data being acted upon without triggering extra API calls.

Key behaviors:
- **Copy Raw JSON** (document and element):
  - Opens a modal that shows the JSON preview.
  - Copy button copies the preview content only (no additional API request).
  - Close button dismisses the modal.
- **Download BOM JSON/CSV**:
  - Opens a modal that shows a progress state with elapsed time while the BOM is fetched and CSV is generated.
  - After completion, shows the content preview (JSON or CSV).
  - Copy button copies the preview content only (no additional API request).
  - Download button triggers the file download using already-fetched/generated data.
- **Full Extract**:
  - Uses existing `FullExtractModal` for detailed progress (should be visible immediately on click).
  - After completion, the modal shows a Close button so the user can dismiss it.
  - After completion, opens a preview modal with a copyable summary of results (no additional API request). The ZIP download is triggered by the exporter.

Key files:
| File | Purpose |
|------|---------|
| `public/js/views/action-preview-modal.js` | Generic progress+preview modal with copy/download actions |
| `public/js/views/actions/document-actions.js` | Uses modal for Copy Raw JSON and Get Document flows |
| `public/js/views/actions/element-actions.js` | Uses modal for BOM JSON/CSV downloads and Full Extract post-summary |

## Thumbnail Extraction System

### Overview
Full Assembly Extraction exports BOM + thumbnails as ZIP. Enhanced to match Python `thumbnail_extractor.py` implementation for reliability.

### Key Files
| File | Purpose |
|------|---------|
| `public/js/utils/fullAssemblyExporter.js` | Main extraction logic with hybrid URL resolution |
| `public/js/services/document-service.js` | BOM fetching with thumbnail=true parameter |
| `public/js/views/full-extract-modal.js` | Progress modal UI |
| `src/routes/api.ts` | `/api/thumbnail-metadata` endpoint |
| `src/services/onshape-api-client.ts` | `getThumbnailMetadata()` method |

### BOM Request Parameters
```javascript
// document-service.js getBillOfMaterials always includes:
{
  indented: "true",
  multiLevel: "true", 
  generateIfAbsent: "false",
  includeExcluded: "false",
  ignoreSubassemblyBomBehavior: "false",
  includeItemMicroversions: "true",
  includeTopLevelAssemblyRow: "true",
  thumbnail: "true"  // CRITICAL: Always request pre-generated URLs
}
```

### Thumbnail URL Resolution (Hybrid Strategy)
Implemented in `resolveThumbnailUrl()`:
1. **Primary**: `thumbnailInfo.sizes[].href` from BOM response (pre-generated by OnShape)
2. **Secondary**: Fetch `/api/thumbnail-metadata` to discover available sizes
3. **Tertiary**: Construct URL from `itemSource` IDs (legacy fallback)

Preferred sizes (in order): `300x300` → `600x340` → `300x170` → `70x40`

### OnShape Field IDs (Part Number Extraction)
```javascript
// Known OnShape field IDs for reliable BOM data extraction
const DEFAULT_FIELD_IDS = {
  partNumber: "57f3fb8efa3416c06701d60f",
  name: "57f3fb8efa3416c06701d60d",
  description: "57f3fb8efa3416c06701d610"
};
```

Uses `buildHeaderMap()` for field ID resolution with validation against known defaults.
Falls back to legacy name-based search via `findRowValueLegacy()` if field IDs unavailable.

### Folder Organization
- `thumbnails/` - PRT-* and ASM-* prefixed parts (custom parts/assemblies)
- `thumbnails_ignored/` - Hardware, references, other items (non-PRT/ASM prefixes)

Determined by `getThumbnailFolder(partNumber)` function.

### Thumbnail Report (`thumbnail_report.json`)
Generated by `ThumbnailReport` class:
```json
{
  "metadata": { "assemblyName": "...", "bomRowCount": 150, "generatedAt": "..." },
  "summary": {
    "total": 150,
    "succeeded": 142,
    "failed": {
      "total_failed": 8,
      "fail_by_403": 2,
      "fail_by_404": 6,
      "fail_by_other": 0
    },
    "skipped": 0,
    "successRate": "94.7%"
  },
  "byFolder": { "thumbnails": { "count": 120, "succeeded": 118, "failed": 2 }, "thumbnails_ignored": {...} },
  "bySource": { "bom-direct": 95, "metadata": 30, "constructed": 17 },
  "errors": [{ "partNumber": "...", "itemSource": {...}, "error": "...", "errorStatus": 404, "attemptedUrls": [...] }],
  "items": [{ "partNumber": "...", "folder": "...", "filename": "...", "source": "...", "success": true }]
}
```

Notes:
- `errorStatus` is sourced from `/api/thumbnail-proxy` HTTP status.
- The backend proxy preserves upstream HTTP status codes (e.g. 403, 404, 429) instead of always returning 500, so the report breakdown `fail_by_403`, `fail_by_404`, `fail_by_other` is accurate.

### ZIP Output Structure
```
{assemblyName}_FullExtract_{timestamp}.zip
├── {assemblyName}-BOM.json
├── {assemblyName}-BOM.csv
├── thumbnail_report.json
├── thumbnails/
│   ├── PRT-12345_PartName.png
│   └── ASM-67890_AssemblyName.png
└── thumbnails_ignored/
    ├── HW-SCREW-M4_Screw.png
    └── REF-GASKET_Gasket.png
```

### Rate Limiting
- `CONCURRENT_THUMBNAIL_LIMIT = 3` parallel fetches
- `DEFAULT_THUMBNAIL_DELAY_MS = 100` between fetches
- `THUMBNAIL_RETRY_COUNT = 2` retries with exponential backoff
- `THUMBNAIL_RETRY_DELAY_MS = 300` base delay for exponential backoff (300, 600, 1200ms)

## Data Types

### Core Interfaces (TypeScript)

```typescript
interface OnShapeDocument {
  id: string;
  name: string;
  owner: { id: string; name: string };
  createdAt: string;
  modifiedAt: string;
  defaultWorkspace: { id: string; name: string };
}

interface AssemblyReference {
  documentId: string;
  documentName: string;
  workspaceId: string;
  elementId: string;
  elementName: string;
  folderPath: string[];
}

interface DirectoryStats {
  scanDate: string;
  scanDurationMs: number;
  summary: { totalFolders: number; totalDocuments: number; };
  assemblies: AssemblyReference[];
}
```

### Session Data

```typescript
interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  authenticated?: boolean;
  userId?: string;
  airtable?: {
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number;
  };
}
```

## Frontend Patterns

### State Management
- `AppState`: Central state with subscriber pattern
- `HistoryState`: Browser history state preservation
- Per-view capture/restore strategies for tabs, selections, scroll

### Routing
- Hash-based SPA router (`#/documents`, `#/documents/:id`, etc.)
- Route patterns in `public/js/router/routes.js`
- Controllers handle route resolution

### Views
- Extend `BaseView` for common patterns
- Render methods return HTML strings
- Event binding via delegation

## Export Features

### Aggregate BOM Export
1. Pre-scan via `/api/export/directory-stats`
2. User confirms via `ExportStatsModal`
3. Stream progress via SSE `/api/export/aggregate-bom-stream`
4. Download as JSON or ZIP with thumbnails

### Full Assembly Extract
- Per-assembly export with BOM + thumbnails
- Progress via `FullExtractModal`
- ZIP output: `{name}-BOM.json`, `{name}-BOM.csv`, `thumbnails/`, `thumbnails_ignored/`, `thumbnail_report.json`

## Airtable Integration

### Thumbnail Upload Flow
1. User uploads ZIP with thumbnails
2. Parse filenames: `{partNumber}_{name}.png`
3. Match part numbers to Airtable records
4. Upload via Content API attachment endpoint

### Configuration (env)
```
AIRTABLE_CLIENT_ID
AIRTABLE_CLIENT_SECRET
AIRTABLE_BASE_ID
AIRTABLE_TABLE_ID
AIRTABLE_PART_NUMBER_FIELD
AIRTABLE_THUMBNAIL_FIELD
```

## Development

### Scripts
- `npm run dev` - Concurrent backend + Vite frontend
- `npm run build` - TypeScript + Vite build
- `npm run spec` - Generate AUTO_SPEC.md

### Key Dependencies
- Backend: express, axios, better-sqlite3, jszip, p-limit
- Dev: typescript, vite, nodemon, concurrently

## File Stats

- Files: 60
- Lines: ~14,500
- Routes: 45
- Active TODOs: 6 (see `notes/TODO.md`)
