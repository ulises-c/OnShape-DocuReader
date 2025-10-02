# Router Module Specification `public/js/router/SPEC.md`

## Purpose
Lightweight hash-based routing system for client-side navigation with history management and deep-linking support.

## Components

### Router.js
**Core routing engine implementing:**
- **Route Registration**: Pattern-based route definitions with parameter extraction
- **Navigation API**: navigate(), replace(), back(), forward() methods
- **Event Handling**: hashchange and popstate listeners with duplicate suppression
- **Pattern Matching**: Regex-based URL pattern matching with named parameters
- **Query Parsing**: URLSearchParams-based query string parsing
- **State Management**: Integration with browser history.state for persistence
- **Subscriber Pattern**: Notification system for route change observers

**Key Features:**
- Optional trailing slash support
- Case-insensitive matching
- Safe parameter encoding/decoding
- Error isolation in handlers
- Lifecycle hooks (started/stopped)

### routes.js
**Application route configuration providing:**
- **ROUTES Constant**: Canonical route patterns for the application
  - HOME: `/`
  - DOCUMENT_LIST: `/documents`
  - DOCUMENT_DETAIL: `/document/:id`
  - ELEMENT_DETAIL: `/document/:docId/element/:elementId`
  - PART_DETAIL: `/document/:docId/element/:elementId/part/:partId`
- **configureRoutes()**: Binds route patterns to controller handlers with optional chaining
- **pathTo()**: Helper to build concrete paths from patterns with params and query strings

**Design Philosophy:**
- Framework-agnostic
- No hard dependencies on controllers
- Graceful degradation when handlers missing

## Integration Points

### With Controllers
Controllers receive route events via registered handlers:
```js
router.register(ROUTES.DOCUMENT_DETAIL, (params, state, context) => {
  documentController.showDocument(params.id, state, context);
});
```

**Handler Signature:**
- `params`: Extracted route parameters (e.g., `{ id: '123' }`)
- `state`: Browser history.state (arbitrary serializable data)
- `context`: Route context with path, query, and hash

### With HistoryState
Router works with HistoryState module to:
- Preserve view state across navigation
- Restore scroll positions on back/forward
- Capture/restore UI state (selections, filters, tabs)

### With App Bootstrap
Router lifecycle managed in `app.js`:
1. Application initializes and checks authentication
2. Router instantiated after controllers ready
3. Routes configured with controller references
4. Router started with initial route resolution

## Route Flow
```
User Action
    ↓
URL Hash Change (#/document/123)
    ↓
Router Parses Hash
    ↓
Pattern Match (DOCUMENT_DETAIL)
    ↓
Handler Invoked (params, state, context)
    ↓
Controller Renders View
    ↓
HistoryState Captures State
    ↓
Navigation Complete
```

## Browser History Integration
- **navigate()**: Uses history.pushState + hash update
- **replace()**: Uses history.replaceState + hash update
- **back/forward()**: Delegates to browser history API
- **Suppression Flag**: Prevents double-handling programmatic hash changes

## Error Handling
- Handler errors logged but don't crash router
- 404 handler for unmatched routes
- Safe fallbacks for missing methods
- Error isolation in subscriber notifications

## Performance Considerations
- Minimal regex overhead (precompiled patterns)
- Event listener cleanup on destroy()
- No DOM manipulation (pure routing logic)
- Efficient parameter extraction

## Future Enhancements
- [ ] Wildcard route support
- [ ] Route guards/middleware
- [ ] Nested route definitions
- [ ] Programmatic route introspection
- [ ] Route parameter validation
