# Routes – SPEC (Compressed)

## Purpose
Express handlers for auth, OnShape API proxy, export.

## Dir
```
src/routes/
├── auth.ts (OAuth endpoints)
└── api.ts (OnShape proxy)
```

## Responsibilities
**auth.ts**: login (OAuth URL gen); callback (token exchange); status (auth check); logout (session destroy)
**api.ts**: requireAuth middleware; user info; docs CRUD; elements/parts/assemblies; export (JSON/ZIP/SSE); thumbnail proxy

## Interfaces
**Auth**: GET /auth/login|callback|status; POST /auth/logout
**API**: GET /api/user|documents|documents/:id|documents/:id/comprehensive|documents/:id/parent|thumbnail-proxy
**Elements**: GET /documents/:id/workspaces/:wid/elements|elements/:eid/parts|assemblies|metadata|parts/:pid/mass-properties
**Export**: GET /api/export/all|stream

## Patterns
- requireAuth middleware: checks session; 401 if missing
- Service delegation: routes → OAuthService/OnShapeApiClient
- Error handling: try-catch; descriptive errors; console logging
- SSE: EventSource for export progress

## Session
**Structure**: { accessToken, refreshToken, authenticated, returnTo }
**Security**: HTTP-only cookies; file-backed storage; validation via middleware

## Future
Token refresh; rate limiting; response caching; logging middleware; API versioning; WebSocket; job queue; validation; CSRF; timeout
