```markdown
# Task: Refactor OnShape DocuReader Frontend Architecture

## Context
You are refactoring a monolithic JavaScript application (`public/app.js`, ~1800 lines) into a modular, maintainable architecture. The current code is a single God Object handling all responsibilities.

## Current Code Location
- **Main file**: `public/app.js` (provided in documents)
- **Backend**: `src/` directory (TypeScript - reference only, do not modify)

## Target Architecture

### Module Structure
```
public/js/
├── app.js                          # Thin entry point (~50 lines)
├── controllers/
│   ├── app-controller.js           # Main orchestration
│   ├── document-controller.js      # Document operations
│   └── export-controller.js        # Export workflow
├── services/
│   ├── api-client.js               # All HTTP requests
│   ├── auth-service.js             # Authentication
│   ├── document-service.js         # Document business logic
│   ├── export-service.js           # Export logic
│   └── thumbnail-service.js        # Image handling
├── views/
│   ├── base-view.js                # Abstract base class
│   ├── document-list-view.js       # Document grid/table
│   ├── document-detail-view.js     # Document details
│   ├── element-detail-view.js      # Element details
│   ├── part-detail-view.js         # Part details
│   ├── modal-manager.js            # All modals
│   └── navigation.js               # Page transitions
├── state/
│   └── app-state.js                # Centralized state (Observer pattern)
└── utils/
    ├── dom-helpers.js              # escapeHtml, DOM utils
    ├── format-helpers.js           # formatDateWithUser, etc
    ├── clipboard.js                # Copy functionality
    └── download.js                 # File downloads
```

## Refactoring Rules

### 1. Services Layer
- **Extract all `fetch()` calls** to `services/api-client.js`
- **One service per domain**: auth, documents, export, thumbnails
- **No DOM manipulation** in services
- **Return promises**, handle errors consistently

### 2. State Management
- **Single source of truth**: `app-state.js`
- **Observer pattern**: Views subscribe to state changes
- **Immutable updates**: Always return new state objects
- **State shape**:
```javascript
{
  user: null,
  isAuthenticated: false,
  currentPage: 'landing',
  documents: [],
  currentDocument: null,
  currentElement: null,
  currentPart: null,
  selectedDocuments: []
}
```

### 3. Views Layer
- **Extend `BaseView`** abstract class
- **Responsibilities**: Render HTML, bind local events, trigger controller actions
- **No business logic**: Views only display data
- **No direct API calls**: Views call controllers
- **Example structure**:
```javascript
class DocumentListView extends BaseView {
  constructor(container, controller) {
    super(container);
    this.controller = controller;
  }
  
  render(documents) { /* create HTML */ }
  bindEvents() { /* attach listeners */ }
  onDocumentClick(docId) { this.controller.viewDocument(docId); }
}
```

### 4. Controllers Layer
- **Orchestrate** between services and views
- **Handle user actions**
- **Update state** via AppState
- **No DOM manipulation**: Delegate to views

### 5. Utilities Layer
- **Pure functions** only
- **No side effects**
- **Testable independently**

## Specific Extraction Map

### From OnShapeApp class to:

| Current Method | New Location | New Module |
|----------------|--------------|------------|
| `checkAuthStatus()` | `AuthService.checkStatus()` | `services/auth-service.js` |
| `loadDocuments()` | `DocumentService.getAll()` | `services/document-service.js` |
| `renderDocuments()` | `DocumentListView.render()` | `views/document-list-view.js` |
| `viewDocument()` | `DocumentController.view()` | `controllers/document-controller.js` |
| `renderDocumentDetails()` | `DocumentDetailView.render()` | `views/document-detail-view.js` |
| `viewElement()` | `DocumentController.viewElement()` | `controllers/document-controller.js` |
| `renderElementDetails()` | `ElementDetailView.render()` | `views/element-detail-view.js` |
| `viewPart()` | `DocumentController.viewPart()` | `controllers/document-controller.js` |
| `renderPartDetails()` | `PartDetailView.render()` | `views/part-detail-view.js` |
| `showExportModal()` | `ModalManager.showExport()` | `views/modal-manager.js` |
| `performAdvancedExport()` | `ExportService.execute()` | `services/export-service.js` |
| `escapeHtml()` | `escapeHtml()` | `utils/dom-helpers.js` |
| `formatDateWithUser()` | `formatDateWithUser()` | `utils/format-helpers.js` |
| `copyRawJson()` | `copyToClipboard()` | `utils/clipboard.js` |
| `downloadExportFile()` | `downloadFile()` | `utils/download.js` |
| `setupThumbnailEventListeners()` | `ThumbnailService.setup()` | `services/thumbnail-service.js` |
| `showPage()` | `Navigation.navigateTo()` | `views/navigation.js` |

## Implementation Steps

### Phase 1: Create Infrastructure (Do First)
1. Create `utils/` folder and extract pure functions
2. Create `state/app-state.js` with Observer pattern
3. Create `services/api-client.js` with all fetch calls
4. Create `views/base-view.js` abstract class

### Phase 2: Extract Services (No Dependencies)
5. Create `services/auth-service.js`
6. Create `services/document-service.js`
7. Create `services/export-service.js`
8. Create `services/thumbnail-service.js`

### Phase 3: Create Views (Depend on Utils + State)
9. Create `views/navigation.js`
10. Create `views/modal-manager.js`
11. Create `views/document-list-view.js`
12. Create `views/document-detail-view.js`
13. Create `views/element-detail-view.js`
14. Create `views/part-detail-view.js`

### Phase 4: Create Controllers (Orchestrate Everything)
15. Create `controllers/document-controller.js`
16. Create `controllers/export-controller.js`
17. Create `controllers/app-controller.js`

### Phase 5: Update Entry Point
18. Refactor `app.js` to be thin orchestrator (~50 lines)
19. Update `index.html` to load modules

## Critical Requirements

### ✅ Must Have
- [ ] All modules use ES6 `import`/`export`
- [ ] No circular dependencies
- [ ] Each file is 100-400 lines max
- [ ] All existing functionality preserved
- [ ] Console.log debugging statements preserved
- [ ] Error handling maintained
- [ ] Event listeners properly bound with `this` context

### ⚠️ Do NOT Change
- Backend code (`src/` directory)
- API endpoints or request formats
- HTML structure in `index.html`
- CSS classes or IDs referenced in code
- Session/cookie handling
- OAuth flow

### 🎯 Success Criteria
- Application runs without errors
- All features work identically
- Code is modular and maintainable
- Each module has single responsibility
- State management is centralized
- Views are decoupled from business logic

## Example: New app.js Entry Point
```javascript
import { AppState } from './state/app-state.js';
import { ApiClient } from './services/api-client.js';
import { AppController } from './controllers/app-controller.js';

// Handle OAuth redirect
if (window.location.pathname === '/dashboard') {
  window.history.replaceState({}, '', '/');
}

// Initialize application
const state = new AppState();
const apiClient = new ApiClient();
const appController = new AppController(state, apiClient);

// Start
appController.init();
```

## Verification Steps
After refactoring, verify:
1. Login/logout works
2. Document list loads and displays
3. Can click document to view details
4. Can navigate to elements and parts
5. Export modal works with all options
6. Thumbnails load correctly
7. Copy to clipboard functions work
8. Search and filter work
9. All console logs still appear
10. No console errors

## Output Format
Create each file as a separate artifact with:
- Filename as title
- Complete, runnable code
- All imports at top
- JSDoc comments for public methods
- Preserved functionality from original

Begin with Phase 1, then proceed sequentially through Phase 5.
```