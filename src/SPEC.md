# Backend Specification `src/SPEC.md`

## Purpose

Express.js backend server providing OAuth authentication, OnShape API integration, and document processing capabilities.

## Directory Structure

```

src/
├── config/ # Configuration modules
│ └── oauth.ts # OAuth configuration and validation
├── routes/ # Express route handlers
│ ├── auth.ts # Authentication endpoints
│ └── api.ts # OnShape API proxy endpoints
├── services/ # Business logic and external integrations
│ ├── oauth-service.ts # OAuth 2.0 flow management
│ ├── onshape-api-client.ts # OnShape API wrapper
│ └── session-storage.ts # File-based session persistence
├── router/ # [DUPLICATE - Consider removing]
│ ├── Router.js # Server-side router (unused?)
│ └── routes.js # Route definitions (unused?)
├── state/ # [DUPLICATE - Consider removing]
│ └── HistoryState.js # Server-side state (unused?)
└── index.ts # Application entry point

```

## Core Responsibilities

### Routes (`/routes`)

- **auth.ts**: OAuth login, callback, status, logout
- **api.ts**: Document CRUD, elements, parts, assemblies, export operations

### Services (`/services`)

- **OAuthService**: PKCE code generation, token exchange, refresh
- **OnShapeApiClient**: Typed API wrapper, request interceptors
- **SessionStorage**: Persistent file-based session management

### Configuration (`/config`)

- Environment variable management
- OAuth credentials validation
- API endpoint configuration

## API Endpoints

### Authentication

- `GET /auth/login` - Initiate OAuth
- `GET /auth/callback` - OAuth callback
- `GET /auth/status` - Check authentication
- `POST /auth/logout` - Clear session

### Documents

- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/comprehensive` - Get full document data
- `GET /api/documents/:id/parent` - Get hierarchy info

### Elements & Parts

- `GET /api/documents/:id/workspaces/:wid/elements` - List elements
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/parts` - Get parts
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/assemblies` - Get assemblies
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/metadata` - Element metadata

### Export

- `GET /api/export/all` - Bulk export (JSON/ZIP)
- `GET /api/export/stream` - SSE progress stream

## Security

- OAuth 2.0 with PKCE
- Session-based authentication
- HTTP-only cookies
- Helmet.js security headers
- CORS configuration

## Error Handling

- Centralized error middleware
- Structured error responses
- Request logging with Morgan
- OnShape API error interception

## Dependencies

- express, cors, helmet, morgan
- axios (HTTP client)
- cookie-parser, express-session
- TypeScript type definitions

## Future Improvements

- [ ] Remove duplicate router/ and state/ directories
- [ ] Implement Redis for session storage
- [ ] Add request caching layer
- [ ] Implement refresh token rotation
- [ ] Add API rate limiting middleware
