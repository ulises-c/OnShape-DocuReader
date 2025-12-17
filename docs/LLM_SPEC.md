# OnShape-DocuReader - Project Specification

Generated: 2025-12-16

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
- ZIP output with organized structure

## Airtable Integration

### Thumbnail Upload Flow
1. User uploads ZIP with thumbnails
2. Parse filenames: `{bomItem}_{partNumber}_{name}.png`
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
- Lines: ~14,120
- Routes: 44
- Active TODOs: 6 (see `notes/TODO.md`)
