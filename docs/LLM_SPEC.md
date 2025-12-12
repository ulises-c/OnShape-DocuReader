# OnShape DocuReader – Efficient SPEC file for LLMs & AI Agents

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

## Active Initiatives & TODO Highlights

1. **Enhanced BOM to CSV workflow** (filtering, replacing deprecated helpers, automated exporters, user-driven filtering UI).
2. **Download indicators and detailed API usage tracking** across sessions with visualization.
3. **Bug fixes & UI improvements** for child element interactions, detail layouts, and hierarchy loading.
4. **Document list enhancements**: pagination backed by API (implemented), folder-based navigation via `globaltreenodes`, caching, and database storage.
5. **Export UX updates**: standardized download locations/structures, thumbnail downloads, image handling.
6. **Caching/database layer** considerations (Redis/SQL) for scalability.

## Future Roadmap (from architecture notes & prompts)

- Complete SSE streaming for aggregate BOM progress (progress events, ETA, abort handling).
- Improve caching, rate limiting, and real-time progress monitoring on backend.
- Frontend enhancements: navigation system, hierarchy visualization, progressive loading, better document tiles.
- Developer experience upgrades: debugging tools, documentation, testing infrastructure.
- Potential adoption of service workers, WebSocket updates, and progressive web app capabilities.
