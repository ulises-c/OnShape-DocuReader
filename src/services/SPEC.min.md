# Services – SPEC (Compressed)

## Purpose
OAuth flow; OnShape API wrapper; session persistence.

## Dir
```
src/services/
├── oauth-service.ts (OAuth PKCE; singleton)
├── onshape-api-client.ts (OnShape API v12)
└── session-storage.ts (file-backed)
```

## Responsibilities
**OAuthService**: generateAuthUrl() (PKCE); exchangeCodeForToken(code, state); refreshAccessToken(refreshToken); generateCodeChallenge(verifier)
**OnShapeApiClient**: getCurrentUser(); getDocuments(); getDocument(id); getElements(docId, wid); getParts(); getPartMassProperties(); exportAll(options, ids); exportStream(options, ids); fetchThumbnail(url)
**SessionStorage**: load/save .sessions.json; get/set/destroy session; error recovery

## Interfaces
**OAuthService**: getInstance(); generateAuthUrl(); exchangeCodeForToken(code, state); refreshAccessToken(refreshToken); generateCodeChallenge(verifier)
**OnShapeApiClient**: All methods return Promises; exportStream returns EventEmitter
**SessionStorage**: load(); save(); get(id); set(id, data); destroy(id)

## Patterns
- Singleton: OAuthService.getInstance()
- Per-request client: new OnShapeApiClient(userToken)
- Event-driven export: exportStream() emits progress; compatible with SSE

## OAuth PKCE Flow
```
1. Generate verifier (random UUID)
2. Compute challenge (SHA-256 hash)
3. Build auth URL → Redirect user
4. OnShape callback with code
5. Exchange code + verifier → tokens
6. Store in session
```

## Security/Perf
- Tokens in session; never exposed
- PKCE prevents interception
- Axios client reuse; connection pooling
- Streaming SSE for large exports; rate limiting

## Future
Token refresh in client; retry with backoff; response caching; timeout config; rate limiting; WebSocket; Redis sessions; request logging; batching; validation
