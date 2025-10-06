# Services Specification `src/services/SPEC.md`

## Purpose

Business logic layer providing OAuth 2.0 authentication flows, OnShape API integration, and persistent session management for the application backend.

## Directory Structure

```
src/services/
├── oauth-service.ts          # OAuth 2.0 PKCE flow implementation
├── onshape-api-client.ts     # OnShape API v12 wrapper
└── session-storage.ts        # File-backed session persistence
```

## Core Responsibilities

### oauth-service.ts
**OAuth 2.0 Authentication Management**
- PKCE (Proof Key for Code Exchange) flow implementation
- Authorization URL generation with state and code challenge
- Authorization code to access token exchange
- Token refresh and lifecycle management
- Singleton pattern for application-wide instance

**Key Methods:**
- `generateAuthUrl()` - Create OAuth authorization URL with PKCE
- `exchangeCodeForToken(code, state)` - Exchange auth code for tokens
- `refreshAccessToken(refreshToken)` - Renew expired access tokens
- `generateCodeChallenge(verifier)` - Create PKCE code challenge (SHA-256)

### onshape-api-client.ts
**OnShape API v12 Integration Layer**
- Typed API wrapper for OnShape REST endpoints
- Automatic authentication header injection
- Request/response transformation
- Error handling and retries
- Export operations with progress tracking

**Key Operations:**
- **User**: `getCurrentUser()` - Fetch authenticated user info
- **Documents**: `getDocuments()`, `getDocument(id)`, `getComprehensiveDocument(id)`
- **Elements**: `getElements(docId, wid)`, `getElementMetadata(docId, wid, eid)`
- **Parts**: `getParts(docId, wid, eid)`, `getPartMassProperties(...)`
- **Assemblies**: `getAssemblies(docId, wid, eid)`
- **Export**: `exportAll(options, ids)`, `exportStream(options, ids)`
- **Thumbnails**: `fetchThumbnail(url)` - Authenticated image retrieval
- **Hierarchy**: `getParentInfo(id)` - Document parent relationships

### session-storage.ts
**Persistent Session Storage**
- File-backed session store (.sessions.json)
- Automatic session serialization/deserialization
- Session lifecycle management (create, read, update, delete)
- Error recovery for corrupted session data

## Architecture Patterns

### Singleton Pattern (OAuthService)
```typescript
class OAuthService {
  private static instance: OAuthService;
  private constructor() { /* ... */ }
  
  static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }
}
```

**Rationale:**
- Single OAuth state manager across application
- Shared code verifier/challenge mapping
- Consistent token refresh logic

### Client Per-Request Pattern (OnShapeApiClient)
```typescript
// Each request creates a new client with user's token
const client = new OnShapeApiClient(req.session.accessToken);
```

**Rationale:**
- User-specific authentication per request
- No shared state between users
- Thread-safe operation

### Event-Driven Export (OnShapeApiClient)
```typescript
exportStream(options, ids): EventEmitter {
  const emitter = new EventEmitter();
  // Process documents, emit progress events
  emitter.emit('data', { progress, log });
  emitter.emit('end');
  return emitter;
}
```

**Rationale:**
- Non-blocking export for large datasets
- Real-time progress feedback
- Stream-compatible with SSE endpoints

## OAuth 2.0 PKCE Flow

### Flow Diagram
```
1. Generate code verifier (random string)
   ↓
2. Create code challenge (SHA-256 hash of verifier)
   ↓
3. Build authorization URL with challenge → Redirect user
   ↓
4. User authorizes → OnShape redirects with auth code
   ↓
5. Exchange code + verifier for access/refresh tokens
   ↓
6. Store tokens in session → User authenticated
```

### State Management
- `oauthState` Map: Tracks code verifier by state parameter
- State parameter prevents CSRF attacks
- Code verifier proves original authorization request

### PKCE Implementation
```typescript
generateCodeChallenge(verifier: string): string {
  // 1. Encode verifier as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  
  // 2. Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 3. Base64-url encode hash
  return base64UrlEncode(hashBuffer);
}
```

## OnShape API Integration

### Request Flow
```
Client Method Call
    ↓
Build Request (URL, params, headers)
    ↓
Inject Authorization: Bearer {accessToken}
    ↓
Axios Request → OnShape API v12
    ↓
Transform Response → Return Data
```

### Base Configuration
- **API Base URL**: `https://cad.onshape.com/api/v12`
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`

### Error Handling
- Network errors: Logged and propagated to caller
- API errors: HTTP status codes mapped to error responses
- Token expiration: Should trigger refresh flow (future enhancement)

### Export Architecture
```typescript
// Synchronous export (small datasets)
exportAll(options, ids) {
  const documents = await this.filterDocuments(ids);
  for (const doc of documents) {
    // Process document, elements, parts
  }
  return exportData;
}

// Streaming export (large datasets, progress tracking)
exportStream(options, ids): EventEmitter {
  const emitter = new EventEmitter();
  setImmediate(async () => {
    for (const doc of documents) {
      // Process and emit progress
      emitter.emit('data', { progress, log });
    }
    emitter.emit('end');
  });
  return emitter;
}
```

## Session Storage

### File Structure
```json
{
  "sessionId": {
    "cookie": { /* ... */ },
    "authenticated": true,
    "accessToken": "...",
    "refreshToken": "...",
    "returnTo": "/dashboard"
  }
}
```

### Storage Operations
- **Load**: Read from `.sessions.json` on startup
- **Save**: Write to `.sessions.json` on session update
- **Cleanup**: Remove expired sessions automatically
- **Recovery**: Reinitialize if file corrupted

### Error Handling
```typescript
try {
  const data = JSON.parse(fs.readFileSync('.sessions.json'));
  this.sessions = data;
} catch (error) {
  console.error('Session load error:', error);
  this.sessions = {}; // Fresh start
}
```

## API Method Reference

### OAuthService Methods
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `getInstance()` | None | `OAuthService` | Get singleton instance |
| `generateAuthUrl()` | None | `{ url, state }` | Create OAuth URL |
| `exchangeCodeForToken(code, state)` | `string, string` | `TokenResponse` | Get access tokens |
| `refreshAccessToken(refreshToken)` | `string` | `TokenResponse` | Refresh expired token |
| `generateCodeChallenge(verifier)` | `string` | `Promise<string>` | Create PKCE challenge |

### OnShapeApiClient Methods
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `getCurrentUser()` | None | `User` | Get user info |
| `getDocuments()` | None | `Document[]` | List documents |
| `getDocument(id)` | `string` | `Document` | Get document details |
| `getElements(docId, wid)` | `string, string` | `Element[]` | List elements |
| `getParts(docId, wid, eid)` | `string, string, string` | `Part[]` | Get parts |
| `getPartMassProperties(...)` | `string × 4` | `MassProperties` | Part mass props |
| `exportAll(options, ids?)` | `any, string[]?` | `ExportData` | Bulk export |
| `exportStream(options, ids?)` | `any, string[]?` | `EventEmitter` | Stream export |
| `fetchThumbnail(url)` | `string` | `Buffer` | Get image data |

### SessionStorage Methods (Internal)
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `load()` | None | `void` | Load sessions from file |
| `save()` | None | `void` | Persist sessions to file |
| `get(sessionId)` | `string` | `Session` | Retrieve session |
| `set(sessionId, data)` | `string, any` | `void` | Update session |
| `destroy(sessionId)` | `string` | `void` | Delete session |

## Security Considerations

### Token Protection
- Access tokens never exposed to client
- Tokens stored in server-side session only
- No tokens in logs or error messages

### PKCE Flow
- Code verifier generated with crypto.randomUUID
- Code challenge computed with SHA-256
- Prevents authorization code interception attacks

### Session Security
- Session IDs are cryptographically random
- HTTP-only cookies prevent XSS access
- File permissions restrict session file access

### API Authentication
- Bearer token authentication for all requests
- Per-user token isolation (no shared clients)
- Token refresh capability for long-lived sessions

## Performance Optimizations

### Axios Client Reuse
- Single Axios instance per OnShapeApiClient
- Connection pooling via Axios defaults
- Keep-alive connections to OnShape API

### Export Optimization
- Stream-based export for large datasets
- Rate limiting to respect API constraints
- Filtered document processing (by IDs)

### Session Storage
- In-memory session cache (write-through)
- Asynchronous file I/O for persistence
- Lazy session loading on startup

## Error Handling Strategy

### OAuth Errors
```typescript
try {
  const tokens = await exchangeCodeForToken(code, state);
} catch (error) {
  console.error('Token exchange failed:', error);
  throw new Error('Authentication failed');
}
```

### API Errors
```typescript
try {
  const response = await axios.get(url);
  return response.data;
} catch (error) {
  console.error('API request failed:', error);
  throw error; // Propagate to route handler
}
```

### Session Errors
```typescript
try {
  fs.writeFileSync('.sessions.json', JSON.stringify(sessions));
} catch (error) {
  console.error('Session save failed:', error);
  // Continue with in-memory session (degrade gracefully)
}
```

## Future Enhancements

- [ ] Implement token refresh flow in OnShapeApiClient
- [ ] Add request retry logic with exponential backoff
- [ ] Cache API responses (Redis or memory)
- [ ] Add request timeout configuration
- [ ] Implement rate limiting per user
- [ ] Add WebSocket support for real-time updates
- [ ] Migrate session storage to Redis for scalability
- [ ] Add request/response interceptors for logging
- [ ] Implement request batching for bulk operations
- [ ] Add API response validation with schemas

## Dependencies

- **axios**: HTTP client for API requests
- **crypto**: Web Crypto API for PKCE
- **fs**: File system for session persistence
- **events**: EventEmitter for streaming exports

## Related Components

- `src/routes/auth.ts`: Consumes OAuthService for authentication
- `src/routes/api.ts`: Uses OnShapeApiClient for API operations
- `src/config/oauth.ts`: OAuth configuration consumed by services
- `src/index.ts`: Registers session storage middleware

## Best Practices

### Service Instantiation
```typescript
// Good: OAuthService singleton
const oauthService = OAuthService.getInstance();

// Good: OnShapeApiClient per-request with user token
const client = new OnShapeApiClient(userAccessToken);
```

### Error Propagation
```typescript
// Good: Let errors propagate to route handlers
async getDocument(id: string) {
  return this.request(`/documents/${id}`);
}

// Bad: Swallow errors silently
async getDocument(id: string) {
  try {
    return this.request(`/documents/${id}`);
  } catch {
    return null; // Silent failure!
  }
}
```

### Async/Await Usage
```typescript
// Good: Async methods with explicit Promise types
async getCurrentUser(): Promise<User> {
  return this.request('/users/sessioninfo');
}

// Bad: Untyped promises
getCurrentUser() {
  return this.request('/users/sessioninfo');
}
```
