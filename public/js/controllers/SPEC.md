# Controllers Specification `public/js/controllers/SPEC.md`

## Purpose

Orchestrate interactions between views, services, and state. Handle user actions and coordinate UI updates.

## Controller Responsibilities

### AppController

**Purpose**: Application bootstrap and global orchestration

**Responsibilities**:

- Initialize authentication state
- Bind global UI events (login, logout, navigation)
- Coordinate initial page routing
- Manage cross-controller communication

**Dependencies**:

- State: AppState
- Services: AuthService
- Views: Navigation
- Controllers: DocumentController, ExportController

### DocumentController

**Purpose**: Document-related operations and view coordination

**Responsibilities**:

- Load and display document lists
- Handle document selection and navigation
- Manage document detail views
- Coordinate element and part views
- Handle comprehensive document export
- Integrate with router for navigation

**Key Methods**:

- `loadDocuments()` - Fetch and render document list
- `viewDocument(id)` - Display document details
- `viewElement(id)` - Show element details
- `viewPart(id)` - Display part information
- `navigateToDocument(id)` - Router-aware navigation
- `showDocument(id, state)` - Route handler
- `getComprehensiveDocument()` - Single document export

**Dependencies**:

- Services: DocumentService, ThumbnailService
- Views: DocumentListView, DocumentDetailView, ElementDetailView, PartDetailView
- State: AppState
- Router: Router, HistoryState

### ExportController

**Purpose**: Manage export workflows and progress tracking

**Responsibilities**:

- Display export configuration modal
- Handle export option selection
- Execute export operations
- Track and display progress
- Manage download operations

**Key Methods**:

- `showExportModal(documents)` - Display export options
- `startExport(options)` - Execute export with selected options
- `cancelExport()` - Cancel in-progress export

**Dependencies**:

- Services: ExportService
- Views: ModalManager
- State: AppState

## Controller Patterns

### Router Integration

```js
// Navigation with state capture
navigateToDocument(documentId) {
  const state = this.historyState.captureState('documentList');
  this.router.navigate(path, state);
}
```

### Service Delegation

```js
// Controllers don't make HTTP calls directly
async loadDocuments() {
  const docs = await this.documentService.getAll();
  this.state.setState({ documents: docs });
  this.listView.render(docs);
}
```

### State Management

```js
// State updates trigger view updates
onSelectionChanged(documentIds) {
  const selected = docs.filter(d => documentIds.includes(d.id));
  this.state.setState({ selectedDocuments: selected });
  this.updateButtonState(selected);
}
```

## Event Handling

### Delegation Pattern

- Controllers bind to container elements
- Use event delegation for dynamic content
- Unbind on view transitions

### Error Handling

- Try-catch for async operations
- User-friendly error messages
- Fallback behaviors

## Future Enhancements

- [ ] Implement controller lifecycle hooks
- [ ] Add controller-level error boundaries
- [ ] Improve cross-controller communication
- [ ] Add controller testing utilities
