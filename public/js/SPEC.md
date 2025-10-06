# Frontend JavaScript Specification `public/js/SPEC.md`

## Purpose

Modular client-side application architecture providing document browsing, detailed views, export operations, and history-aware navigation for the OnShape DocuReader web application.

## Directory Structure

```
public/js/
├── app.js                    # Application entry point and bootstrap
├── controllers/              # UI orchestration layer
│   ├── app-controller.js     # Global app initialization and auth
│   ├── document-controller.js# Document operations and navigation
│   └── export-controller.js  # Export workflow management
├── services/                 # API integration and business logic
│   ├── api-client.js         # Backend HTTP wrapper
│   ├── auth-service.js       # Authentication flow
│   ├── document-service.js   # Document operations
│   ├── export-service.js     # Export execution
│   └── thumbnail-service.js  # Image loading with fallbacks
├── views/                    # UI rendering components
│   ├── base-view.js          # Abstract base class
│   ├── document-list-view.js # Document grid/table
│   ├── document-detail-view.js # Document details
│   ├── element-detail-view.js # Element tabs (parts/assemblies/metadata)
│   ├── part-detail-view.js   # Part details and mass properties
│   ├── modal-manager.js      # Export modal control
│   └── navigation.js         # Page transitions
├── state/                    # State management
│   ├── app-state.js          # Global app state with observers
│   └── HistoryState.js       # Navigation state capture/restore
├── router/                   # Client-side routing
│   ├── Router.js             # Hash-based router with history API
│   └── routes.js             # Route patterns and configuration
├── utils/                    # Pure utility functions
│   ├── clipboard.js          # Copy-to-clipboard with fallback
│   ├── dom-helpers.js        # Query selectors, event delegation
│   ├── download.js           # File download helpers
│   └── format-helpers.js     # Date and data formatting
└── SPEC.md                   # This file
```

## Core Responsibilities

### Application Bootstrap (app.js)
- **Entry Point**: Initialize all services, controllers, and views
- **Authentication Check**: Verify user authentication status on load
- **Router Integration**: Configure routes and start router after app initialization
- **History State Setup**: Register per-view capture/restore strategies
- **Dependency Wiring**: Connect controllers with services, views, and router
- **Default Route Handling**: Set authenticated default route to `/documents`

### Architecture Layers
```
User Interaction
    ↓
Controllers (UI orchestration)
    ↓
Services (API calls, business logic)
    ↓
Views (DOM rendering)
    ↓
State (centralized app state + navigation state)
    ↓
Router (URL and browser history management)
```

## Architecture Patterns

### MVC-like Structure
- **Models**: AppState (global app state)
- **Views**: UI components in views/
- **Controllers**: Orchestration in controllers/

### Service Layer Abstraction
- Controllers delegate HTTP calls to services
- Services delegate to ApiClient for backend communication
- No direct fetch() in controllers or views

### Observer Pattern
- **AppState**: Emits state changes to subscribers
- **Router**: Notifies subscribers on route changes
- **HistoryState**: Pluggable per-view capture/restore strategies

### Event Delegation
- Views use event delegation for dynamic content
- Single listener for multiple elements (document rows, tiles)
- Memory-efficient for large lists

### Router Integration Flow
```
1. App initializes (auth check, load data)
    ↓
2. Router configured with routes
    ↓
3. HistoryState strategies registered
    ↓
4. Router started (resolve initial route)
    ↓
5. User navigates (router updates URL + history)
    ↓
6. Controller captures state before navigation
    ↓
7. Route handler renders view
    ↓
8. Controller restores state after render
```

## Application Bootstrap Workflow

### Initialization Sequence (app.js)
1. **Auth Status Check**: Immediately verify authentication
   - Redirect to login if unauthenticated and not on landing page
2. **Core Instances**: Create AppState and ApiClient
3. **Services Bundle**: Instantiate AuthService, DocumentService, ExportService, ThumbnailService
4. **Views**: Create Navigation and ModalManager instances
5. **Controllers**: Initialize DocumentController and ExportController with dependencies
6. **Modal Handlers**: Wire export modal callbacks to ExportController
7. **App Boot**: Call AppController.init() for authentication and initial data load
8. **Router Setup**: 
   - Create Router instance
   - Register HistoryState strategies for document list and element detail views
   - Inject router and historyState into DocumentController
   - Configure routes with controller handlers
   - Start router and set authenticated default route

### Per-View State Strategies
- **documentList**: Captures search query, selected checkboxes, select-all state
- **elementDetail**: Captures active tab (parts/assemblies/metadata)
- Strategies restore UI state on back/forward navigation

### Default Route Logic
- Authenticated users: Default to `/documents` if no hash present
- Unauthenticated users: Default to `/` (landing page)
- Preserves deep-link URLs if hash present on load

## Component Interaction

### Controller → Service → API Client
```javascript
// DocumentController
async loadDocuments() {
  const docs = await this.documentService.getAll();
  this.listView.render(docs);
}

// DocumentService
async getAll() {
  return this.apiClient.getDocuments();
}

// ApiClient
async getDocuments() {
  const res = await fetch('/api/documents');
  return res.json();
}
```

### Router → Controller → View
```javascript
// Route configured in app.js
router.register(ROUTES.DOCUMENT_DETAIL, (params, state) => {
  documentController.showDocument(params.id, state);
});

// DocumentController
async showDocument(id, state) {
  const doc = await this.documentService.getById(id);
  this.detailView.render(doc);
  if (state) this.detailView.restoreState(state);
}
```

### State Capture/Restore Flow
```javascript
// Before navigation (in controller)
const state = this.historyState.captureState('documentList');
this.router.navigate('/document/123', state);

// After navigation (in route handler)
this.listView.render(documents);
this.listView.restoreState(state);
```

## Security Considerations

### XSS Prevention
- All user-provided content escaped via `escapeHtml()`
- No `innerHTML` with unescaped data
- Attribute values sanitized in templates

### Authentication Flow
- Session-based authentication (HTTP-only cookies)
- Auth check on app load redirects unauthenticated users
- API calls fail gracefully on expired sessions

### Token Management
- Access tokens never exposed to client JavaScript
- Backend handles token storage and refresh
- Frontend uses session cookies only

## Performance Optimizations

### Lazy Loading
- Views render only when needed
- Deferred thumbnail loading via ThumbnailService
- Progressive element rendering for large documents

### Event Delegation
- Single listener for all document rows and element tiles
- Reduced memory footprint for large lists
- No orphaned listeners on re-render

### Router Efficiency
- Minimal regex overhead (precompiled patterns)
- Event listener cleanup on destroy()
- No DOM manipulation in router (pure routing logic)

### State Management
- Frozen state snapshots prevent accidental mutations
- Observer notifications isolated (errors don't cascade)
- Deferred scroll restoration via requestAnimationFrame

## Development Workflow

### Adding a New View
1. Create view class extending BaseView in `views/`
2. Implement `render()` and optional `captureState()/restoreState()`
3. Add view instance to app.js and wire to controller
4. Update SPEC.md with new view documentation

### Adding a New Route
1. Add route pattern to `router/routes.js` ROUTES constant
2. Register route in app.js `configureRoutes()` call
3. Implement controller method to handle route
4. Add route to router/SPEC.md documentation

### Adding a Service Method
1. Add method to appropriate service in `services/`
2. Update service SPEC.md with API documentation
3. Use method in controller
4. Add error handling and logging

## Future Enhancements

- [ ] Add request/response caching in ApiClient
- [ ] Implement virtual scrolling for large document lists
- [ ] Add WebSocket support for real-time updates
- [ ] Enhance error boundaries at component level
- [ ] Add accessibility improvements (ARIA, keyboard nav)
- [ ] Implement view-level testing utilities
- [ ] Add service worker for offline support
- [ ] Enhance mobile responsive layouts
- [ ] Add request cancellation (AbortController)
- [ ] Implement progressive web app (PWA) features

## Dependencies

### External Libraries
- **None**: Pure JavaScript with modern browser APIs
- Uses Fetch API, EventSource (SSE), Clipboard API, History API

### Browser Requirements
- ES6 modules support (modern browsers)
- Hash-based routing (universal support)
- RequestAnimationFrame (animation and scroll)
- Web Crypto API (crypto.subtle for PKCE - backend only)

## Related Components

- `public/index.html`: View container elements and page structure
- `public/styles.css`: Application styling and layout
- `public/dashboard.html`: OAuth success redirect page
- `src/routes/api.ts`: Backend endpoints called by services
- `src/routes/auth.ts`: Authentication endpoints
- `src/services/onshape-api-client.ts`: Backend OnShape integration

## Best Practices

### Module Imports
```javascript
// Good: Explicit imports with .js extension
import { AppState } from "./state/app-state.js";

// Bad: Missing extension (breaks in browser)
import { AppState } from "./state/app-state";
```

### Controller Instantiation
```javascript
// Good: Inject dependencies
const controller = new DocumentController(state, services, navigation);

// Bad: Hardcode dependencies in constructor
class DocumentController {
  constructor() {
    this.state = new AppState(); // Tight coupling
  }
}
```

### Error Handling
```javascript
// Good: Try-catch with user-friendly messages
try {
  await loadDocuments();
} catch (error) {
  console.error('Load failed:', error);
  showError('Failed to load documents. Please try again.');
}

// Bad: Silent failures
try {
  await loadDocuments();
} catch {}
```

### State Updates
```javascript
// Good: Use setState for centralized updates
state.setState({ documents: docs });

// Bad: Direct mutation
state.documents = docs; // Doesn't trigger observers
```

## Maintenance Notes

### SPEC File Updates
- Update this file when adding new directories or major components
- Keep directory structure section synchronized with actual file layout
- Document architectural changes in appropriate sections

### Code Organization
- Keep files modular and under 500 lines where possible
- Use clear, descriptive naming conventions
- Separate concerns (no HTTP calls in views, no DOM in services)
- Follow existing patterns for consistency
