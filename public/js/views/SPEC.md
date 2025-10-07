# Views Specification `public/js/views/SPEC.md`

## Purpose

UI rendering layer providing modular, reusable view components for document browsing, detailed views, and export operations. Views handle DOM manipulation, template rendering, and user interaction bindings while delegating business logic to controllers.

## Directory Structure

```
public/js/views/
├── base-view.js              # Abstract base class with common helpers
├── document-list-view.js     # Document grid/table rendering
├── document-detail-view.js   # Document details and elements display
├── element-detail-view.js    # Element details with parts/assemblies/metadata tabs
├── part-detail-view.js       # Part details and mass properties
├── modal-manager.js          # Export and progress modal control
├── navigation.js             # Page transition management
├── actions/                  # Action handler modules
│   ├── document-actions.js   # Document-level operations
│   └── element-actions.js    # Element-level operations
└── helpers/                  # Pure rendering functions
    ├── document-info-renderer.js  # Document metadata rendering
    └── element-list-renderer.js   # Element list rendering
```

## Core Responsibilities

### BaseView (Abstract Base Class)
**Foundation for all view components**
- Container element management and validation
- Common rendering utilities (clear, renderHtml)
- Lifecycle hooks (bind, unbind) for subclass implementation
- Error handling for missing containers

**Key Methods:**
- `constructor(containerSelector)` - Initialize with DOM container
- `ensureContainer()` - Validate container exists
- `clear()` - Clear container HTML
- `renderHtml(html)` - Render template to container
- `bind()`, `unbind()` - Lifecycle hooks (overridden by subclasses)

### DocumentListView
**Document Table/Grid Rendering**
- Render document list with comprehensive metadata
- Multi-column table with sortable headers
- Checkbox selection system (individual + select-all)
- Event delegation for row clicks and selections
- State capture/restore for scroll and selections

**Key Features:**
- Row click → Navigate to document detail
- Checkbox selection tracking
- Select-all indeterminate state
- Search query state preservation
- Scroll position restoration

### DocumentDetailView (Refactored)
**Document Details and Element Browser - Slim Orchestration Layer**
- Display document metadata using helper renderers
- Render document thumbnail with proxy fallback
- List clickable element tiles (parts, assemblies, etc.)
- Coordinate action handlers for all button interactions
- Element JSON copy functionality via action handlers

**Architecture:**
- ~150 lines (down from 400+)
- Uses helper modules for pure rendering
- Delegates all actions to action handler classes
- Maintains state capture/restore
- Single event delegation listener for element actions

**Key Features:**
- Thumbnail loading via ThumbnailService (deferred setup)
- Formatted dates with user attribution
- Element click → Navigate to element detail
- Action delegation pattern for all operations
- Maintains `_elementsMap` for quick element lookups

**Integration Points:**
- `helpers/document-info-renderer.js` - Pure HTML generation
- `helpers/element-list-renderer.js` - Element list HTML
- `actions/document-actions.js` - Document-level operations
- `actions/element-actions.js` - Element-level operations

### Action Handlers

#### DocumentActions
**Document-level operation handlers**
- `handleGetDocument(docId)` - Single document comprehensive export
- `handleGetJson(docData)` - Download document as JSON
- `handleCopyJson(docData)` - Copy document JSON to clipboard
- `handleLoadHierarchy(docId, controller)` - Load parent hierarchy
- `handleExportCsv(docData, elements)` - Export filtered CSV (legacy)

**Responsibilities:**
- Self-contained action logic
- Uses controller and services passed in constructor
- Returns success/failure for feedback
- Handles all document-level button actions

#### ElementActions
**Element-level operation handlers**
- `handleCopyElementJson(element, controller)` - Copy element JSON with metadata
- `handleFetchBomJson(element, documentId, workspaceId, service)` - Fetch BOM JSON
- `handleDownloadBomCsv(element, documentId, workspaceId, service)` - Download BOM CSV

**Responsibilities:**
- Handles ASSEMBLY-specific actions (BOM)
- Handles PART-specific actions (mass properties)
- Self-contained, testable methods
- Uses services for API calls

### Rendering Helpers

#### document-info-renderer.js
**Pure rendering functions for document metadata**
- `renderDocumentInfo(docData)` - Generates info section HTML
- `renderThumbnailSection(docData)` - Generates thumbnail HTML with placeholder
- `renderTagsAndLabels(docData)` - Generates tags/labels HTML with badges

**Characteristics:**
- No state, no side effects
- Pure HTML string generation
- Uses `escapeHtml()` for all dynamic content
- Exported as individual functions

#### element-list-renderer.js
**Pure rendering for elements list**
- `renderElementsList(elements)` - Generates full elements list HTML
- `renderElementItem(element)` - Single element tile HTML
- `renderElementActions(element)` - Action buttons based on element type

**Characteristics:**
- No event binding, just HTML generation
- Type-specific action buttons (BOM for assemblies)
- Exports individual renderer functions

### ElementDetailView
**Element Details with Tabbed Content**
- Display element information (name, type, ID)
- Parts list with click-to-detail navigation
- Assemblies list with metadata
- Element metadata display (key-value pairs)
- Tab-based content organization

**Key Features:**
- Part click → Navigate to part detail
- Empty state messages for missing data
- Metadata object/array formatting
- Active tab state preservation

### PartDetailView
**Part Details and Physical Properties**
- Render part identification (name, ID, body type)
- Display mass properties (mass, volume, centroid, inertia)
- Formatted property values with units
- Empty states for missing data

**Key Features:**
- Unit-aware property display
- Decimal precision formatting
- Graceful degradation for incomplete data

### ModalManager
**Export and Progress Modal Control**
- Export configuration modal display/hide
- Progress tracking modal with live updates
- Export option reading (format, includes, rate limiting)
- Estimate calculation (documents, time, API calls)
- Progress bar and log updates

**Key Features:**
- Export options: format (JSON/ZIP), includes (elements, parts, assemblies, metadata, mass properties)
- Rate limiting configuration (requests per minute)
- Real-time progress tracking (percentage, current/total)
- Scrollable export log with timestamps
- Cancel operation support

### Navigation
**Page Transition Management**
- Show/hide page sections via CSS classes
- Multi-page application structure
- Page activation state management

**Key Features:**
- Page visibility toggling (`.active` class)
- Support for multiple page sections
- Fallback for missing pages

## Architecture Patterns

### Inheritance Hierarchy
```
BaseView (abstract)
    ├── DocumentListView
    ├── DocumentDetailView
    └── ElementDetailView
```

**Rationale:**
- Shared container management and rendering utilities
- Consistent lifecycle hooks across views
- Reduced code duplication

### Refactored DocumentDetailView Architecture
```
DocumentDetailView (orchestrator)
    ├── Helpers (pure rendering)
    │   ├── document-info-renderer.js
    │   └── element-list-renderer.js
    ├── Actions (business logic)
    │   ├── DocumentActions
    │   └── ElementActions
    └── Utilities (shared)
        ├── toast-notification.js
        └── file-download.js
```

**Benefits:**
- Single responsibility principle
- Testable action handlers
- Reusable rendering functions
- Clean separation of concerns
- ~150 line main view (down from 400+)

### MVC Separation
```
Controller → View → DOM
   ↑          ↓
State    User Events
```

**Views:**
- Never make HTTP requests (delegate to services)
- Don't manage state (notify controllers of changes)
- Focus on rendering and event binding

**Controllers:**
- Orchestrate view updates
- Handle user actions
- Coordinate services and state

### Event Delegation Pattern
```javascript
// DocumentListView: Single listener for all rows
_delegate('.document-card', 'click', (e, row) => {
  const id = row.getAttribute('data-id');
  this.controller.navigateToDocument(id);
});

// DocumentDetailView: Single listener for all element actions
elementsContainer.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.copy-element-json-btn');
  if (copyBtn) {
    await this.elementActions.handleCopyElementJson(element, this.controller);
  }
});
```

**Benefits:**
- Efficient for dynamic content
- No memory leaks from orphaned listeners
- Simplified unbind logic

### State Capture/Restore Protocol
All views implement optional methods for history-aware navigation:

```javascript
captureState() {
  return {
    scroll: { windowY, containerTop, containerKey },
    // View-specific state
  };
}

restoreState(state) {
  // Restore inputs/selections first
  // Restore view-specific state
  // Restore scroll via requestAnimationFrame
}
```

**Restoration Order:**
1. Inputs and selections (search query, checkboxes)
2. View-specific state (active tabs, expanded sections)
3. Scroll positions (deferred via rAF for layout stability)

### Template Rendering
- String concatenation for HTML generation
- `escapeHtml()` for all user-provided content
- No templating library (lightweight approach)

**Example:**
```javascript
const html = `
  <div class="info-item">
    <div class="info-label">Name</div>
    <div class="info-value">${escapeHtml(doc.name)}</div>
  </div>
`;
this.renderHtml(html);
```

## View Components Reference

### DocumentListView API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `render(documents)` | `Document[]` | `void` | Render document table |
| `bind()` | None | `void` | Bind event listeners |
| `unbind()` | None | `void` | Clean up listeners |
| `captureState()` | None | `State` | Capture scroll/selections |
| `restoreState(state)` | `State` | `void` | Restore scroll/selections |

### DocumentDetailView API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `render(doc, elements)` | `Document, Element[]` | `void` | Render document details |
| `updateHierarchy(docId, html)` | `string, string` | `void` | Update hierarchy section |
| `captureState()` | None | `State` | Capture scroll position |
| `restoreState(state)` | `State` | `void` | Restore scroll position |

### ElementDetailView API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `render(element)` | `Element` | `void` | Render element details |
| `captureState()` | None | `State` | Capture scroll/tabs |
| `restoreState(state)` | `State` | `void` | Restore scroll/tabs |

### PartDetailView API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `render(part)` | `Part` | `void` | Render part details |
| `captureState()` | None | `State` | Capture scroll position |
| `restoreState(state)` | `State` | `void` | Restore scroll position |

### ModalManager API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `setHandlers(handlers)` | `Object` | `void` | Register callbacks |
| `showExport()` | None | `void` | Display export modal |
| `hideExport()` | None | `void` | Hide export modal |
| `showProgress()` | None | `void` | Display progress modal |
| `hideProgress()` | None | `void` | Hide progress modal |
| `readExportOptions()` | None | `Options` | Read export form data |
| `updateEstimates(count)` | `number?` | `void` | Recalculate estimates |
| `updateProgress(cur, tot)` | `number, number` | `void` | Update progress bar |
| `setCurrentTask(text)` | `string` | `void` | Update current task text |
| `appendLog(message)` | `string` | `void` | Add log entry |

### DocumentActions API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `handleGetDocument(docId)` | `string` | `Promise<void>` | Single doc export |
| `handleGetJson(docData)` | `Document` | `void` | Download doc JSON |
| `handleCopyJson(docData)` | `Document` | `Promise<boolean>` | Copy JSON to clipboard |
| `handleLoadHierarchy(docId, controller)` | `string, Controller` | `Promise<void>` | Load hierarchy |
| `handleExportCsv(docData, elements)` | `Document, Element[]` | `void` | Export CSV (legacy) |

### ElementActions API
| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `handleCopyElementJson(element, controller)` | `Element, Controller` | `Promise<boolean>` | Copy element JSON |
| `handleFetchBomJson(element, docId, wid, service)` | `Element, string, string, Service` | `Promise<void>` | Fetch BOM JSON |
| `handleDownloadBomCsv(element, docId, wid, service)` | `Element, string, string, Service` | `Promise<void>` | Download BOM CSV |

## Event Flow

### Document List Interaction
```
User clicks document row
    ↓
Event delegation catches click
    ↓
Exclude checkbox column clicks
    ↓
Extract document ID from row
    ↓
controller.navigateToDocument(id)
    ↓
Router navigation with state capture
```

### Selection State Management
```
Checkbox change event
    ↓
Update select-all visual state
    ↓
Query selected checkboxes
    ↓
controller.onSelectionChanged(ids)
    ↓
Controller updates button state
```

### Element Navigation
```
User clicks element tile
    ↓
Event listener extracts element ID
    ↓
controller.viewElement(elementId)
    ↓
Load element data from service
    ↓
ElementDetailView.render(element)
```

### Refactored Action Flow (DocumentDetailView)
```
User clicks action button
    ↓
Event delegation in main view
    ↓
Identify button type (copy, BOM, etc.)
    ↓
Delegate to appropriate action handler
    ↓
Action handler executes (uses services)
    ↓
Return success/failure
    ↓
View provides feedback (flash button, toast)
```

## State Capture/Restore Flow

### Capture (Before Navigation)
```
Router initiates navigation
    ↓
Controller calls view.captureState()
    ↓
View captures:
  - Scroll positions (window + containers)
  - Selections (checkboxes, search query)
  - UI state (active tabs, expanded sections)
    ↓
State returned to controller
    ↓
Passed to router.navigate(path, state)
```

### Restore (After Navigation)
```
Router invokes route handler
    ↓
Controller renders view
    ↓
Controller calls view.restoreState(state)
    ↓
View restores (in order):
  1. Inputs/selections (search, checkboxes)
  2. View-specific state (tabs)
  3. Scroll positions (via rAF for layout stability)
    ↓
UI reflects previous state
```

## Security Considerations

### XSS Prevention
- All user-provided content escaped via `escapeHtml()`
- No `innerHTML` with unescaped data
- Attribute values properly escaped in templates

**Example:**
```javascript
// Safe HTML rendering
const html = `
  <div class="name">${escapeHtml(doc.name)}</div>
  <div data-id="${escapeHtml(doc.id)}">...</div>
`;
```

### Event Listener Cleanup
- Views track bound listeners for cleanup
- `unbind()` removes all listeners before re-render
- Prevents memory leaks in single-page app

### JSON Serialization Safety
- State capture/restore uses safe JSON serialization
- Error handling for non-serializable values
- Fallback to empty state on parse errors

## Performance Optimizations

### Event Delegation
- Single listener for all dynamic elements (rows, tiles)
- Reduced memory footprint for large lists
- No orphaned listeners on re-render

### Deferred Scroll Restoration
```javascript
// Restore scroll after layout is stable
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
    container.scrollTop = containerTop;
  });
});
```

**Rationale:**
- Ensures DOM layout complete before scrolling
- Prevents scroll jump issues
- Double rAF for paint cycle completion

### Lazy Rendering
- Views render only visible sections
- Deferred thumbnail loading via ThumbnailService
- Progressive element rendering for large documents

### Minimal Reflows
- Batch DOM updates where possible
- Use `innerHTML` for bulk rendering (fewer reflows)
- Avoid layout thrashing in loops

### Refactored View Benefits
- Smaller main view class (~150 lines)
- No duplicate utilities (centralized)
- Action handlers can be tested in isolation
- Pure rendering functions have no side effects
- Better code organization for maintenance

## Integration Examples

### Controller Using View
```javascript
class DocumentController {
  constructor() {
    this.listView = new DocumentListView('#documentsSection', this);
  }

  async loadDocuments() {
    const docs = await this.documentService.getAll();
    this.listView.render(docs);
  }

  onSelectionChanged(ids) {
    this.updateExportButtonState(ids);
  }
}
```

### Refactored DocumentDetailView Usage
```javascript
// In controller
const detailView = new DocumentDetailView(
  '#documentDetail',
  controller,
  thumbnailService
);

// Render uses helpers internally
detailView.render(documentData, elements);

// Actions are handled by dedicated classes
// No inline event handlers in view
```

### View Capturing State
```javascript
// In controller before navigation
const state = this.listView.captureState();
this.router.navigate('/document/123', state);

// After navigation back, in route handler
this.listView.render(documents);
this.listView.restoreState(state);
```

### Modal Workflow
```javascript
const modalManager = new ModalManager();
modalManager.setHandlers({
  onStartExport: (options) => exportController.start(options),
  onCancelExport: () => exportController.cancel()
});
modalManager.showExport();
```

## Future Enhancements

- [ ] Virtual scrolling for large document lists
- [ ] Infinite scroll pagination for document table
- [ ] Skeleton loaders for async content
- [ ] View-level caching for previously rendered content
- [ ] Accessibility improvements (ARIA attributes, keyboard navigation)
- [ ] Template literals with tagged templates for safer HTML
- [ ] Component-level error boundaries
- [ ] View state persistence beyond browser history
- [ ] Responsive mobile layouts for all views
- [ ] Progressive enhancement for no-JS scenarios
- [ ] View testing utilities (render, query, simulate events)
- [ ] Thumbnail lazy loading via Intersection Observer
- [ ] Expand/collapse animations for element details
- [ ] Search highlighting in document list view
- [ ] Column sorting for document table
- [ ] Action handler composition for complex workflows
- [ ] Renderer function caching for repeated renders

## Dependencies

### Core Dependencies
- **dom-helpers.js**: Query selectors, event delegation, HTML escaping
- **format-helpers.js**: Date formatting with user attribution
- **clipboard.js**: Copy-to-clipboard functionality
- **download.js**: JSON file download helpers
- **toast-notification.js**: User feedback notifications (refactored out)
- **file-download.js**: Generic file download utilities (refactored out)

### View-Specific Dependencies
- **DocumentDetailView**: helpers/document-info-renderer.js, helpers/element-list-renderer.js, actions/*
- **ModalManager**: download.js (for export)

## Related Components

- `public/js/controllers/*` - View orchestration and state management
- `public/js/services/thumbnail-service.js` - Thumbnail loading in DocumentDetailView
- `public/js/state/app-state.js` - Global state updates from view events
- `public/js/router/*` - Navigation integration with state capture/restore
- `public/js/utils/*` - Shared utilities (clipboard, download, toast, DOM helpers)
- `public/index.html` - View container elements and page structure
- `public/styles.css` - View styling and layout

## Best Practices

### View Instantiation
```javascript
// Good: Inject dependencies (controller, services)
const listView = new DocumentListView('#container', controller);
const detailView = new DocumentDetailView('#detail', controller, thumbnailService);

// Bad: Hardcode dependencies in view
class DocumentListView {
  constructor() {
    this.controller = window.documentController; // Tight coupling
  }
}
```

### Event Cleanup
```javascript
// Good: Track listeners and clean up
bind() {
  this._unsub.push(
    this._delegate('.item', 'click', handler)
  );
}

unbind() {
  this._unsub.forEach(off => off());
  this._unsub = [];
}

// Bad: No cleanup (memory leak)
bind() {
  this.container.addEventListener('click', handler);
  // Never removed!
}
```

### State Capture Safety
```javascript
// Good: Defensive capture with error handling
captureState() {
  try {
    return { selectedIds: [...], scroll: { ... } };
  } catch (e) {
    console.error('Capture failed:', e);
    return { selectedIds: [], scroll: {} };
  }
}

// Bad: Unguarded capture (throws on missing DOM)
captureState() {
  return { selectedIds: this.getCheckedIds() }; // Throws if DOM gone
}
```

### Template Safety
```javascript
// Good: Escape all dynamic content
const html = `<div>${escapeHtml(userInput)}</div>`;

// Bad: Unescaped user input (XSS risk)
const html = `<div>${userInput}</div>`;
```

### Action Handler Pattern (Refactored)
```javascript
// Good: Separate action handlers
class DocumentActions {
  async handleGetDocument(docId) {
    try {
      // Action logic
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// Bad: Inline handlers in view
render() {
  button.onclick = async () => {
    // Complex logic here
  };
}
```

### Pure Rendering Functions (Refactored)
```javascript
// Good: Pure function, no side effects
export function renderDocumentInfo(docData) {
  return `<div>${escapeHtml(docData.name)}</div>`;
}

// Bad: Renderer with side effects
function renderDocumentInfo(docData) {
  updateGlobalState(docData);
  return `<div>${docData.name}</div>`;
}
```
