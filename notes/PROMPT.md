# Refactor Document Detail View

## Objective

Refactor `public/js/views/document-detail-view.js` into a cleaner, more maintainable architecture following the View SPEC principles: views should focus on DOM rendering and event binding, with no API calls or complex business logic.

## Current Problems

The `DocumentDetailView` class is bloated (~400 lines) with multiple responsibilities:

- Mixing rendering, event handling, business logic, and UI feedback
- Inline event handlers for 8+ different button types
- Direct toast notification implementation
- Element JSON handling mixed with view logic
- BOM download logic embedded in view
- Multiple download utilities (JSON, CSV) duplicated

## Refactoring Strategy

Extract responsibilities into separate, focused modules while maintaining the inheritance from `BaseView` and following the established patterns in the codebase.

## New Files to Generate

Create these new files with the following responsibilities:

### 1. `public/js/views/helpers/document-info-renderer.js`

**Purpose**: Pure rendering functions for document metadata sections

- `renderDocumentInfo(docData)` - generates info HTML
- `renderThumbnailSection(docData)` - generates thumbnail HTML
- `renderTagsAndLabels(docData)` - generates tags/labels HTML
- No event binding, no state, just pure HTML generation
- Export individual renderer functions

### 2. `public/js/views/helpers/element-list-renderer.js`

**Purpose**: Pure rendering for elements list

- `renderElementsList(elements)` - generates elements HTML
- `renderElementItem(element)` - single element HTML
- `renderElementActions(element)` - action buttons for element type
- No event binding, just HTML generation

### 3. `public/js/views/actions/document-actions.js`

**Purpose**: Action handlers for document-level operations

- `DocumentActions` class with methods:
  - `handleGetDocument(docId)`
  - `handleGetJson(docData)`
  - `handleCopyJson(docData)`
  - `handleLoadHierarchy(docId, controller)`
  - `handleExportCsv(docData, elements)`
- Each method is self-contained and returns success/failure
- Uses controller and services passed in constructor

### 4. `public/js/views/actions/element-actions.js`

**Purpose**: Action handlers for element-level operations

- `ElementActions` class with methods:
  - `handleCopyElementJson(element, controller)`
  - `handleFetchBomJson(element, documentId, workspaceId, service)`
  - `handleDownloadBomCsv(element, documentId, workspaceId, service)`
- Handles both ASSEMBLY and PART specific actions
- Self-contained, testable methods

### 5. `public/js/utils/toast-notification.js`

**Purpose**: Centralized toast notification system

- `showToast(message, duration = 2500)` function
- `ensureToastContainer()` - lazy container creation
- Handles all toast styling and animation
- Can be used across all views (singleton pattern)
- Simple, focused utility

### 6. `public/js/utils/file-download.js`

**Purpose**: Generic file download utilities

- `downloadJson(data, filename)` - download JSON blob
- `downloadCsv(csvString, filename)` - download CSV blob
- `createDownloadLink(blob, filename)` - core download logic
- Removes duplication across views

### 7. `public/js/views/document-detail-view.js` (REFACTORED)

**Purpose**: Slim orchestration layer

- Import all helpers, renderers, and actions
- Coordinate rendering using helper functions
- Delegate all button actions to action classes
- Use event delegation for all element actions
- Maintain state capture/restore
- ~150 lines max (down from 400+)

## Implementation Requirements

1. **Maintain existing functionality**: All current features must work identically
2. **Follow BaseView pattern**: Keep inheritance, maintain `render()`, `captureState()`, `restoreState()`
3. **Use event delegation**: Single listener per container for element actions
4. **No API calls in views**: All API calls through controller or services
5. **Pure functions where possible**: Renderers should be stateless
6. **Consistent error handling**: Try/catch in actions, log errors, show user feedback
7. **ES6 modules**: Proper imports/exports for all new files
8. **Preserve styling**: Keep all inline styles and CSS classes intact

## Success Criteria

- `document-detail-view.js` reduced to ~150 lines
- Each new module has single, clear responsibility
- All existing features work without regression
- Toast notifications can be reused in other views
- Action handlers are testable in isolation
- No duplicate code between files
- Follows SPEC principles: views render, controllers orchestrate, services fetch

## Implementation Order

1. Create utility modules first (toast, file-download)
2. Create renderer helpers (no dependencies)
3. Create action classes (depend on utils)
4. Refactor main view to use all new modules
5. Test each button/action to verify functionality

## Notes

- The `_elementsMap` pattern should remain in the main view for quick lookups
- Thumbnail service setup should remain deferred in main view
- State capture/restore stays in main view (per SPEC)
- Keep all escapeHtml calls for security
- Maintain all data attributes for action binding

====

Generate the 7 files listed above with complete, production-ready implementations. Ensure the refactored `document-detail-view.js` is significantly shorter and cleaner while maintaining all existing functionality.
