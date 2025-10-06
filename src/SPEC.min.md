# Backend – SPEC (Compressed)

## Purpose
Express API for OnShape auth, docs, export.

## Dir
```
src/
├── config/ (oauth.ts)
├── routes/ (auth.ts, api.ts)
├── services/ (oauth-service, onshape-api-client, session-storage)
├── types/ (session.d.ts)
└── index.ts
```

## Responsibilities
- OAuth PKCE; login/logout; token exchange/refresh
- Proxy OnShape API v12 (docs/elements/parts/assemblies/export)
- Export JSON/ZIP with SSE progress
- File-based session storage (.sessions.json)
- Security: Helmet; CORS; HTTP-only cookies; requireAuth middleware

## Interfaces
**Auth**: GET /auth/login|callback|status; POST /auth/logout
**API**: GET /api/user|documents|documents/:id|documents/:id/comprehensive|documents/:id/parent
**Elements**: GET /api/documents/:id/workspaces/:wid/elements|elements/:eid/parts|assemblies|metadata|parts/:pid/mass-properties
**Export**: GET /api/export/all|stream
**Utils**: GET /api/thumbnail-proxy

## Security/Perf
- OAuth PKCE; session-based auth; tokens in session only
- Helmet headers; CORS; HTTP-only cookies; requireAuth middleware
- Central error handling; request logging (Morgan)
- Axios client reuse; streaming SSE for exports; rate limiting

## Dependencies
express, axios, helmet, morgan, cookie-parser, express-session, typescript

## Future
Remove duplicate router/state dirs; Redis sessions; response caching; token rotation; rate limiting; WebSocket; job queue; request validation; CSRF; timeout config
