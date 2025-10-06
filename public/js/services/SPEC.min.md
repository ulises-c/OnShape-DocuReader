# Services – SPEC (Compressed)

## Purpose
API calls; business logic; no DOM manipulation; delegate to ApiClient.

## Dir
```
public/js/services/
├── api-client.js (HTTP wrapper)
├── auth-service.js (OAuth flow)
├── document-service.js (doc ops)
├── export-service.js (export workflow)
└── thumbnail-service.js (image loading)
```

## Responsibilities
**ApiClient**: fetch() wrapper; all backend endpoints; request/response handling
**AuthService**: checkStatus(); login(); logout(); getUser(); delegates to ApiClient
**DocumentService**: getAll(); getById(id); getElements(); getParts(); getAssemblies(); getElementMetadata(); getPartMassProperties(); getParentInfo(); getComprehensiveDocument()
**ExportService**: execute(options); stream(options, handlers); SSE lifecycle events
**ThumbnailService**: setup(docId, originalUrl, proxyUrl); proxy/direct fallback

## Interfaces
**ApiClient**: getDocuments(); getDocument(id); getElements(docId, wid); exportAll(options, ids); exportStreamSSE(options, ids); logout()
**AuthService**: checkStatus(); login(); logout(); getUser()
**DocumentService**: All methods return Promises; delegate to ApiClient
**ExportService**: execute() returns JSON; stream() returns EventSource; events: start|progress|document-*|complete|error
**ThumbnailService**: setup() binds img listeners; auto-fallback; placeholder on fail

## Hierarchy
```
Controllers → Auth/Document/Export/ThumbnailService → ApiClient → Backend API
```

## Security/Perf
- Tokens in session cookies; never exposed
- SSE for export progress; streaming prevents timeout
- Thumbnail proxy fallback; browser caching

## Future
Response caching; retry logic; token refresh; WebSocket; bulk ops; job queue
