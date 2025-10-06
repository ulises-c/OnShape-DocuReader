# Routes Specification `src/routes/SPEC.md`

## Purpose

Express route handlers providing RESTful API endpoints for authentication flows and OnShape document operations with session-based security.

## Directory Structure

```
src/routes/
├── auth.ts              # OAuth 2.0 authentication endpoints
└── api.ts               # OnShape API proxy endpoints
```

## Core Responsibilities

### auth.ts
**Authentication Flow Management**
- OAuth 2.0 login initiation with return URL preservation
- OAuth callback handling and token exchange
- Session lifecycle management (create, check, destroy)
- Authentication status verification

**Key Endpoints:**
- `GET /auth/login` - Initiate OAuth flow with optional returnTo parameter
- `GET /auth/callback` - Process OAuth authorization code and establish session
- `GET /auth/status` - Check current authentication state
- `POST /auth/logout` - Destroy session and clear cookies

### api.ts
**OnShape API Proxy Layer**
- Document CRUD operations
- Element and part data retrieval
- Assembly information access
- Metadata and mass properties queries
- Bulk export with streaming support
- Secure thumbnail proxying

**Key Endpoint Categories:**
- **User**: `/api/user` - Current user information
- **Documents**: `/api/documents/*` - Document listing and details
- **Elements**: `/api/documents/:id/workspaces/:wid/elements/*` - Element data
- **Parts**: `.../elements/:eid/parts/*` - Part information and properties
- **Export**: `/api/export/*` - Bulk export with progress streaming
- **Thumbnails**: `/api/thumbnail-proxy` - Authenticated image proxying

## Architecture Patterns

### Middleware Chain
```
Request → requireAuth → Route Handler → OnShapeApiClient → Response
```

### Authentication Guard
- `requireAuth` middleware validates session before API access
- Returns 401 Unauthorized if session missing or unauthenticated
- Applied to all `/api/*` routes via `router.use(requireAuth)`

### Service Delegation
- Routes delegate business logic to service layer
- OnShapeApiClient instantiated per-request with session access token
- OAuthService singleton manages authentication flows
- No direct HTTP logic in route handlers

### Error Handling
- Try-catch blocks for all async operations
- Descriptive error messages in responses
- Console logging for debugging
- Appropriate HTTP status codes (401, 400, 500)

## API Workflows

### Authentication Flow
```
1. User clicks "Login with OnShape"
   ↓
2. GET /auth/login → Generate OAuth URL → Redirect to OnShape
   ↓
3. User authorizes → OnShape redirects to /auth/callback
   ↓
4. Code exchange → Store tokens in session → Redirect to returnTo or dashboard
```

### Document Access Flow
```
1. Frontend requests document list
   ↓
2. requireAuth checks session
   ↓
3. OnShapeApiClient created with access token
   ↓
4. API call to OnShape → Transform response → Return JSON
```

### Export Streaming Flow
```
1. GET /api/export/stream with SSE headers
   ↓
2. OnShapeApiClient.exportStream() creates EventEmitter
   ↓
3. Progress events sent as SSE data chunks
   ↓
4. Stream ends → Close connection
```

## Session Management

### Session Data Structure
```typescript
{
  accessToken: string;      // OnShape API access token
  refreshToken: string;     // Token refresh credential
  authenticated: boolean;   // Auth state flag
  returnTo?: string;        // Post-login redirect URL
}
```

### Session Security
- HTTP-only cookies prevent XSS access
- Session stored in file-backed storage (.sessions.json)
- Session validation via requireAuth middleware
- Automatic session save after token exchange

## API Endpoint Reference

### Authentication Endpoints
| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| GET | `/auth/login` | Initiate OAuth flow | No |
| GET | `/auth/callback` | Process OAuth response | No |
| GET | `/auth/status` | Check auth state | No |
| POST | `/auth/logout` | Destroy session | No |

### Document Endpoints
| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| GET | `/api/user` | Current user info | Yes |
| GET | `/api/documents` | List all documents | Yes |
| GET | `/api/documents/:id` | Document details | Yes |
| GET | `/api/documents/:id/comprehensive` | Full document data | Yes |
| GET | `/api/documents/:id/parent` | Parent hierarchy | Yes |

### Element/Part Endpoints
| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| GET | `/api/documents/:id/workspaces/:wid/elements` | Element list | Yes |
| GET | `.../elements/:eid/parts` | Part list | Yes |
| GET | `.../elements/:eid/assemblies` | Assembly data | Yes |
| GET | `.../elements/:eid/metadata` | Element metadata | Yes |
| GET | `.../parts/:pid/mass-properties` | Part mass props | Yes |

### Export/Utility Endpoints
| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| GET | `/api/export/all` | Bulk JSON export | Yes |
| GET | `/api/export/stream` | SSE export stream | Yes |
| GET | `/api/thumbnail-proxy` | Secure image proxy | Yes |

## Security Considerations

### Authentication Protection
- All `/api/*` routes protected by requireAuth middleware
- Session validation before any OnShape API access
- Token-based API authentication (no credentials in routes)

### Token Management
- Access tokens stored in session, never exposed to client
- Refresh tokens for token renewal (handled by service layer)
- Session destruction clears all authentication data

### Input Validation
- Type checking for query parameters
- Required parameter validation (e.g., `url` for thumbnail proxy)
- State parameter validation in OAuth callback

### Error Response Sanitization
- Generic error messages to prevent information leakage
- Detailed errors logged server-side only
- No sensitive data in error responses

## Performance Optimizations

### Session Efficiency
- File-backed session storage for persistence
- Session lazy-loading per request
- Automatic session cleanup on logout

### API Client Reuse Pattern
- OnShapeApiClient instantiated per request with user token
- Axios client reused within request lifecycle
- Connection pooling via Axios defaults

### Streaming for Large Data
- SSE streaming for export progress (prevents timeout)
- Buffered thumbnail proxying (not held in memory)
- Query parameter filtering for scoped exports

## Error Handling Strategy

### Route-Level Handling
```javascript
try {
  const data = await client.someMethod();
  return res.json(data);
} catch (error) {
  console.error('Operation error:', error);
  return res.status(500).json({ error: 'Operation failed' });
}
```

### Error Response Format
```json
{
  "error": "User-friendly error message"
}
```

## Future Enhancements

- [ ] Implement refresh token rotation for enhanced security
- [ ] Add request rate limiting per user session
- [ ] Cache OnShape API responses (Redis or memory)
- [ ] Add request/response logging middleware
- [ ] Implement API versioning (e.g., /api/v1/*)
- [ ] Add WebSocket support for real-time document updates
- [ ] Implement bulk operations with job queuing
- [ ] Add request validation middleware (Zod, Joi)
- [ ] Implement CSRF protection for state-changing operations
- [ ] Add request timeout configuration

## Dependencies

- **express**: Web framework for routing
- **OnShapeApiClient**: Service layer for OnShape API integration
- **OAuthService**: OAuth 2.0 flow management
- **express-session**: Session middleware

## Related Components

- `src/services/onshape-api-client.ts`: API client implementation
- `src/services/oauth-service.ts`: OAuth flow and token management
- `src/services/session-storage.ts`: Persistent session storage
- `src/config/oauth.ts`: OAuth configuration
- `src/index.ts`: Route registration and middleware setup

## Best Practices

### Route Handler Pattern
```typescript
// Good: Explicit return types, error handling, service delegation
router.get('/path', async (req: Request, res: Response): Promise<Response> => {
  try {
    const data = await service.method();
    return res.json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed' });
  }
});
```

### Middleware Usage
```typescript
// Good: Apply authentication once for all protected routes
router.use(requireAuth);

// Bad: Repeat auth check in each handler
router.get('/path', requireAuth, handler);
```

### Service Instantiation
```typescript
// Good: Create service per request with user token
const client = new OnShapeApiClient(req.session.accessToken!);

// Bad: Reuse client across requests (security risk)
const client = new OnShapeApiClient(globalToken);
```
