# Services Specification `public/js/services/SPEC.md`

## Purpose

Client-side service layer providing HTTP communication, business logic orchestration, and data transformation between backend API and frontend views. Services encapsulate all external communication and maintain separation between network operations and UI rendering.

## Directory Structure

```
public/js/services/
├── api-client.js           # HTTP request wrapper for backend endpoints
├── auth-service.js         # Authentication flow management
├── document-service.js     # Document operations and data retrieval
├── export-service.js       # Export workflow execution and streaming
└── thumbnail-service.js    # Image loading and fallback handling
```

## Core Responsibilities

### api-client.js
**Low-level HTTP Communication Layer**
- Raw fetch API wrapper for all backend endpoints
- Request construction with proper headers and query parameters
- Response parsing and error handling
- No business logic or state management

**Key Methods:**
- Authentication: `getAuthStatus()`, `logout()`
- User: `getUser()`
- Documents: `getDocuments()`, `getDocument(id)`
- Elements: `getElements(docId, wid)`, `getElementMetadata(...)`
- Parts: `getParts(...)`, `getPartMassProperties(...)`
- Assemblies: `getAssemblies(...)`
- Hierarchy: `getParentInfo(id)`
- Export: `exportAll(options, ids)`, `exportStreamSSE(options, ids)`

### auth-service.js
**Authentication Flow Orchestration**
- Delegates HTTP calls to ApiClient
- Manages login/logout workflows
- Handles OAuth redirect with return URL preservation
- User information retrieval

**Key Methods:**
- `checkStatus()` - Verify authentication state
- `login()` - Initiate OAuth flow with returnTo parameter
- `logout()` - Clear session and redirect
- `getUser()` - Fetch current user information

### document-service.js
**Document Business Logic**
- Higher-level document operations abstraction
- Coordinates multiple API calls for comprehensive data
- Provides clean interface for controllers
- Handles document-specific error scenarios

**Key Methods:**
- `getAll()` - List all documents
- `getById(id)` - Fetch document details
- `getElements(docId, wid)` - Element listing
- `getParts(...)`, `getAssemblies(...)` - Component retrieval
- `getElementMetadata(...)` - Element properties
- `getPartMassProperties(...)` - Part physical properties
- `getParentInfo(id)` - Document hierarchy
- `getComprehensiveDocument(id, params)` - Full document export

### export-service.js
**Export Workflow Management**
- Configurable export option composition
- Both synchronous and streaming export modes
- Progress tracking via Server-Sent Events (SSE)
- Event handler registration for export lifecycle

**Key Methods:**
- `execute(options)` - Synchronous export (returns JSON)
- `stream(options, handlers)` - SSE-based export with progress events

**Supported Events:**
- `start`, `documents-found`, `progress`, `document-status`
- `document-complete`, `document-error`, `complete`, `error`

### thumbnail-service.js
**Image Loading and Fallback Management**
- Proxy and direct URL fallback strategy
- Error handling with user-friendly placeholders
- Click-to-open original image functionality
- Automatic retry logic

**Key Method:**
- `setup(docId, originalUrl, proxyUrl)` - Configure thumbnail loading

## Architecture Patterns

### Service Layer Hierarchy
```
Controllers
    ↓
AuthService / DocumentService / ExportService / ThumbnailService
    ↓
ApiClient
    ↓
Backend API
```

### Dependency Injection
- Services receive ApiClient instance at construction
- Allows for testing with mock API clients
- Decouples service logic from HTTP implementation

```javascript
const api = new ApiClient();
const authService = new AuthService(api);
const documentService = new DocumentService(api);
const exportService = new ExportService(api);
```

### Event-Driven Export
- EventSource for SSE streaming
- Pluggable handlers for export lifecycle
- Non-blocking operation for long-running exports

```javascript
const es = exportService.stream(options, {
  onStart: (data) => console.log('Starting...'),
  onProgress: (data) => updateProgressBar(data),
  onComplete: (data) => downloadFile(data),
  onError: (err) => showError(err)
});
```

### Thumbnail Fallback Strategy
```
1. Try proxy URL
   ↓ (on error)
2. Try direct OnShape URL
   ↓ (on error)
3. Show placeholder with error message
```

## API Request Workflows

### Authentication Flow
```
User Action → AuthService.login()
    ↓
Preserve current URL
    ↓
Redirect to /auth/login?returnTo=...
    ↓
OAuth flow → Callback
    ↓
Return to original URL
```

### Document Retrieval Flow
```
Controller → DocumentService.getById(id)
    ↓
ApiClient.getDocument(id)
    ↓
fetch(`/api/documents/${id}`)
    ↓
Parse JSON → Return to Controller
```

### Comprehensive Export Flow
```
DocumentService.getComprehensiveDocument(id, params)
    ↓
Build query string with options
    ↓
fetch(`/api/documents/${id}/comprehensive?...`)
    ↓
Backend aggregates: document + elements + parts + metadata
    ↓
Return complete document structure
```

### Streaming Export Flow
```
ExportService.stream(options, handlers)
    ↓
ApiClient.exportStreamSSE(options, ids)
    ↓
EventSource connects to /api/export/stream
    ↓
Backend emits progress events
    ↓
Handlers process events in real-time
    ↓
Stream completes → Download file
```

## Error Handling Strategy

### HTTP Error Handling
```javascript
const res = await fetch(url);
if (!res.ok) throw new Error(`Operation failed (${res.status})`);
return res.json();
```

### Service-Level Error Propagation
- Services throw errors for controllers to handle
- Controllers display user-friendly messages
- Console logging for debugging
- No silent failures

### Thumbnail Error Recovery
```javascript
img.addEventListener('error', () => {
  if (!hasTriedDirect) {
    img.src = originalUrl; // Fallback to direct
    hasTriedDirect = true;
  } else {
    showPlaceholder(); // Final fallback
  }
});
```

## Performance Considerations

### Request Optimization
- Batch API calls where possible (comprehensive document)
- Rate limiting configuration for exports (requests per minute)
- SSE streaming prevents timeout for long exports

### Thumbnail Loading
- Lazy loading via proxy
- Fallback to direct URL if proxy fails
- Caching via browser cache headers

### Export Streaming
- Non-blocking SSE for real-time progress
- Prevents UI freeze during large exports
- Server-driven rate limiting

## Security Features

### Authentication Token Handling
- Tokens never exposed in service layer
- Backend manages session and credentials
- Services use session cookies automatically

### URL Construction
- Safe parameter encoding via URLSearchParams
- Query string sanitization
- No direct DOM manipulation in services

### CORS and Redirects
- OAuth redirect with return URL preservation
- Same-origin requests for API calls
- Proxy endpoint for cross-origin thumbnails

## Service Integration Examples

### Controller Using DocumentService
```javascript
class DocumentController {
  constructor(documentService) {
    this.documentService = documentService;
  }

  async loadDocuments() {
    try {
      const docs = await this.documentService.getAll();
      this.listView.render(docs);
    } catch (error) {
      console.error('Load failed:', error);
      this.showError('Failed to load documents');
    }
  }
}
```

### Export with Progress Tracking
```javascript
exportController.startExport(options, (progress) => {
  const es = exportService.stream(options, {
    onProgress: (data) => {
      progressBar.update(data.percentage);
      logView.append(data.message);
    },
    onComplete: (data) => {
      downloadFile(data.filename, data.content);
      es.close();
    }
  });
});
```

## Future Enhancements

- [ ] Implement request caching with Cache API
- [ ] Add request retry with exponential backoff
- [ ] Token refresh detection and automatic retry
- [ ] WebSocket support for real-time document updates
- [ ] Request batching for multiple document operations
- [ ] Progress estimation for non-streaming exports
- [ ] Thumbnail preloading and prefetching
- [ ] Request queue management for rate limiting
- [ ] Service worker for offline document access
- [ ] Request cancellation support (AbortController)

## Dependencies

- **Fetch API**: HTTP requests (no external library)
- **EventSource**: Server-Sent Events for streaming
- **URLSearchParams**: Safe query string construction

## Related Components

- `public/js/controllers/*` - Service consumers
- `public/js/views/*` - Data rendering from service results
- `public/js/state/app-state.js` - State management from service data
- `src/routes/api.ts` - Backend endpoints called by services
- `src/routes/auth.ts` - Authentication endpoints

## Best Practices

### Service Instantiation
```javascript
// Good: Inject dependencies
const api = new ApiClient();
const authService = new AuthService(api);

// Bad: Hardcode dependencies
class AuthService {
  constructor() {
    this.api = new ApiClient(); // Tight coupling
  }
}
```

### Error Handling
```javascript
// Good: Let errors propagate to controllers
async getDocuments() {
  return this.api.getDocuments();
}

// Bad: Swallow errors silently
async getDocuments() {
  try {
    return this.api.getDocuments();
  } catch {
    return []; // Silent failure!
  }
}
```

### Async/Await
```javascript
// Good: Explicit async methods
async getDocument(id) {
  return this.api.getDocument(id);
}

// Bad: Mixed promise handling
getDocument(id) {
  return this.api.getDocument(id).then(doc => doc);
}
```
