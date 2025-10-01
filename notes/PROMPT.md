# TASK: Integrate Router into Controllers and Views (Phase 4-6)

## CONTEXT
You have completed Phases 1-3:
- ✅ Phase 1: Created `public/router/Router.js`
- ✅ Phase 2: Created `public/state/HistoryState.js`
- ✅ Phase 3: Created `public/router/routes.js`

NOW execute Phases 4-6 to integrate routing into existing controllers and views.

## ⚠️ CRITICAL REQUIREMENTS
1. **All files are in `public/` directory** - This is frontend code, NOT backend
2. **Maintain modular architecture** - Each file modification should add 50-150 lines MAX
3. **Use dependency injection** - Pass router and historyState through constructors
4. **Preserve existing functionality** - Only ADD navigation features, don't break existing code
5. **Follow observer pattern** - Subscribe to router changes, don't poll
6. **Test incrementally** - Each controller should work after modification

---

## PHASE 4: CONTROLLER INTEGRATION

### OBJECTIVE
Modify existing controllers to use Router for navigation instead of direct DOM manipulation. Controllers should capture state before navigation and restore state when returning.

### FILES TO MODIFY
1. `public/controllers/DocumentController.js`
2. `public/controllers/AssemblyController.js`
3. `public/controllers/ExportController.js` (if exists)
4. Any other controllers that handle navigation

### INTEGRATION PATTERN

**For EACH controller, follow this pattern:**

```javascript
// 1. ADD IMPORTS at top of file
import { ROUTES } from '../router/routes.js';

// 2. UPDATE CONSTRUCTOR to accept router and historyState
class DocumentController {
  constructor(documentService, documentView, stateManager, router, historyState) {
    this.documentService = documentService;
    this.documentView = documentView;
    this.stateManager = stateManager;
    this.router = router;              // NEW
    this.historyState = historyState;  // NEW
    
    // Existing subscriptions
    this.setupEventListeners();
  }

  // 3. ADD STATE CAPTURE before navigation
  navigateToDocument(documentId) {
    // Capture current view state before navigating away
    const currentState = this.historyState.captureState('documentList');
    
    // Use router to navigate (creates history entry)
    this.router.navigate(
      ROUTES.DOCUMENT_DETAIL.replace(':id', documentId),
      currentState
    );
  }

  // 4. ADD STATE RESTORATION in view methods
  async showDocument(documentId, restoredState = null) {
    // If we have restored state, apply it
    if (restoredState) {
      this.historyState.restoreState(restoredState);
    }
    
    // Continue with existing document loading logic
    const document = await this.documentService.getDocument(documentId);
    this.documentView.render(document);
    
    // If no restored state, this is a fresh navigation
    if (!restoredState) {
      // Scroll to top for new views
      window.scrollTo(0, 0);
    }
  }

  // 5. REPLACE manual navigation with router.back()
  returnToList() {
    // OLD: this.documentView.hide(); this.documentListView.show();
    // NEW:
    this.router.back();
  }
}
```

### SPECIFIC CONTROLLER MODIFICATIONS

#### A. DocumentController.js

**LOCATE these methods and UPDATE them:**

1. **Methods that navigate TO document detail:**
   - Any method like `showDocument()`, `viewDocument()`, `openDocument()`
   - Pattern: `this.router.navigate(ROUTES.DOCUMENT_DETAIL.replace(':id', id), state)`

2. **Methods that return FROM document detail:**
   - Any method like `returnToList()`, `closeDocument()`, `backToList()`
   - Pattern: `this.router.back()`

3. **Methods that navigate with filters:**
   - Any method that applies filters and shows results
   - Pattern: Capture filter state, include in navigation state

**EXAMPLE TRANSFORMATION:**

```javascript
// BEFORE (OLD CODE):
async handleDocumentClick(documentId) {
  const document = await this.documentService.getDocument(documentId);
  this.documentListView.hide();
  this.documentDetailView.render(document);
}

// AFTER (NEW CODE WITH ROUTER):
async handleDocumentClick(documentId) {
  // Capture current list state
  const currentState = this.historyState.captureState('documentList');
  
  // Navigate using router
  this.router.navigate(
    ROUTES.DOCUMENT_DETAIL.replace(':id', documentId),
    currentState
  );
}

// ADD NEW METHOD (called by route handler):
async showDocumentFromRoute(params, restoredState = null) {
  const documentId = params.id;
  
  // Load document
  const document = await this.documentService.getDocument(documentId);
  
  // Update views
  this.documentListView.hide();
  this.documentDetailView.render(document);
  
  // Restore state if coming back via browser navigation
  if (restoredState) {
    this.historyState.restoreState(restoredState);
  } else {
    window.scrollTo(0, 0);
  }
}
```

#### B. AssemblyController.js

**LOCATE these methods and UPDATE them:**

1. **Methods that show assembly detail:**
   - Pattern: `this.router.navigate(ROUTES.ASSEMBLY_DETAIL.replace(':id', id), state)`

2. **Methods that switch between basic/detailed assembly views:**
   - Pattern: `this.router.replace(ROUTES.ASSEMBLY_DETAILED_VIEW.replace(':id', id), state)`
   - Use `replace()` not `navigate()` to avoid adding extra history entries

3. **Methods that return from assembly:**
   - Pattern: `this.router.back()`

**EXAMPLE TRANSFORMATION:**

```javascript
// BEFORE:
showDetailedView(assemblyId) {
  this.assemblyView.renderDetailed(assemblyId);
}

// AFTER:
showDetailedView(assemblyId) {
  // Use replace() to change view mode without new history entry
  this.router.replace(
    ROUTES.ASSEMBLY_DETAILED_VIEW.replace(':id', assemblyId),
    this.historyState.captureState('assembly')
  );
}

// ADD NEW METHOD:
async showAssemblyFromRoute(params, restoredState = null) {
  const assemblyId = params.id;
  const isDetailed = params.detailed === 'true'; // From route params
  
  // Load and render
  const assembly = await this.documentService.getAssembly(assemblyId);
  if (isDetailed) {
    this.assemblyView.renderDetailed(assembly);
  } else {
    this.assemblyView.render(assembly);
  }
  
  // Restore state if needed
  if (restoredState) {
    this.historyState.restoreState(restoredState);
  }
}
```

#### C. ExportController.js (if exists)

**LOCATE these methods and UPDATE them:**

1. **Methods that navigate to export view:**
   - Pattern: `this.router.navigate(ROUTES.EXPORT_VIEW.replace(':documentId', id), state)`

2. **Methods that return from export:**
   - Pattern: `this.router.back()`

### EXECUTION STEPS FOR PHASE 4

**Execute in this exact order:**

1. **OPEN `public/controllers/DocumentController.js`**
2. **ADD import:** `import { ROUTES } from '../router/routes.js';`
3. **UPDATE constructor** to accept `router` and `historyState` parameters
4. **IDENTIFY all navigation methods** (methods that change views)
5. **REPLACE direct view manipulation** with router calls
6. **ADD route handler methods** (e.g., `showDocumentFromRoute`)
7. **SAVE file** and verify no syntax errors

8. **REPEAT steps 1-7** for `public/controllers/AssemblyController.js`
9. **REPEAT steps 1-7** for any other controllers with navigation

10. **VERIFY:** Each controller should:
    - Import ROUTES
    - Accept router and historyState in constructor
    - Use router.navigate() for forward navigation
    - Use router.back() for back navigation
    - Have route handler methods for each route they manage

---

## PHASE 5: VIEW STATE CAPTURE

### OBJECTIVE
Add state capture and restoration methods to views so they can preserve scroll position, filters, expanded sections, etc.

### FILES TO MODIFY
1. `public/views/DocumentListView.js`
2. `public/views/DocumentDetailView.js`
3. `public/views/AssemblyView.js`
4. Any other views with stateful UI

### VIEW STATE PATTERN

**For EACH view, ADD these two methods:**

```javascript
class DocumentListView {
  
  // EXISTING METHODS...
  
  /**
   * Capture current view state for restoration
   * @returns {Object} State object with all relevant UI state
   */
  captureState() {
    return {
      scrollPosition: window.scrollY,
      filters: this.getActiveFilters ? this.getActiveFilters() : {},
      searchQuery: this.searchInput?.value || '',
      selectedDocumentId: this.selectedDocumentId || null,
      expandedSections: this.getExpandedSections ? this.getExpandedSections() : [],
      sortBy: this.currentSortBy || null,
      viewMode: this.currentViewMode || 'list' // grid/list
    };
  }

  /**
   * Restore previously captured state
   * @param {Object} state - State object to restore
   */
  restoreState(state) {
    if (!state) return;
    
    // Restore filters first (affects what's rendered)
    if (state.filters && this.applyFilters) {
      this.applyFilters(state.filters, false); // false = don't trigger events
    }
    
    // Restore search query
    if (state.searchQuery && this.searchInput) {
      this.searchInput.value = state.searchQuery;
    }
    
    // Restore sort
    if (state.sortBy && this.setSortBy) {
      this.setSortBy(state.sortBy, false);
    }
    
    // Restore view mode
    if (state.viewMode && this.setViewMode) {
      this.setViewMode(state.viewMode);
    }
    
    // Restore expanded sections
    if (state.expandedSections && this.expandSections) {
      this.expandSections(state.expandedSections);
    }
    
    // Restore selection highlight
    if (state.selectedDocumentId && this.highlightDocument) {
      this.highlightDocument(state.selectedDocumentId);
    }
    
    // Restore scroll position (do this last, after DOM updates)
    if (state.scrollPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, state.scrollPosition);
      });
    }
  }
}
```

### SPECIFIC VIEW MODIFICATIONS

#### A. DocumentListView.js

**STATE TO CAPTURE:**
- Active filter selections (type, date, creator, etc.)
- Search query text
- Current sort order
- Scroll position
- Selected/highlighted document
- Expanded filter sections
- List vs grid view mode

**ADD helper methods if needed:**
```javascript
getActiveFilters() {
  // Return object with all active filter values
  return {
    type: this.typeFilter?.value || null,
    creator: this.creatorFilter?.value || null,
    dateFrom: this.dateFromInput?.value || null,
    dateTo: this.dateToInput?.value || null,
    // ... etc
  };
}

applyFilters(filters, triggerEvent = true) {
  // Apply each filter value to UI
  if (filters.type && this.typeFilter) {
    this.typeFilter.value = filters.type;
  }
  // ... etc
  
  if (triggerEvent) {
    this.notifyFiltersChanged();
  }
}

getExpandedSections() {
  // Return array of expanded section IDs
  return Array.from(
    this.container.querySelectorAll('.filter-section.expanded')
  ).map(el => el.dataset.sectionId);
}

expandSections(sectionIds) {
  sectionIds.forEach(id => {
    const section = this.container.querySelector(`[data-section-id="${id}"]`);
    if (section) {
      section.classList.add('expanded');
    }
  });
}
```

#### B. DocumentDetailView.js

**STATE TO CAPTURE:**
- Active tab selection
- Scroll position within tabs
- Expanded metadata sections
- Selected element/part (if showing parts list)

```javascript
captureState() {
  return {
    scrollPosition: window.scrollY,
    activeTab: this.getActiveTab ? this.getActiveTab() : null,
    expandedSections: this.getExpandedMetadataSections ? this.getExpandedMetadataSections() : [],
    selectedElementId: this.selectedElementId || null
  };
}

restoreState(state) {
  if (!state) return;
  
  if (state.activeTab && this.setActiveTab) {
    this.setActiveTab(state.activeTab, false); // false = don't trigger events
  }
  
  if (state.expandedSections && this.expandMetadataSections) {
    this.expandMetadataSections(state.expandedSections);
  }
  
  if (state.selectedElementId && this.highlightElement) {
    this.highlightElement(state.selectedElementId);
  }
  
  if (state.scrollPosition !== undefined) {
    requestAnimationFrame(() => {
      window.scrollTo(0, state.scrollPosition);
    });
  }
}
```

#### C. AssemblyView.js

**STATE TO CAPTURE:**
- View mode (basic/detailed)
- Expanded hierarchy nodes
- Scroll position
- Selected assembly component

```javascript
captureState() {
  return {
    scrollPosition: window.scrollY,
    viewMode: this.currentViewMode || 'basic',
    expandedNodes: this.getExpandedNodes ? this.getExpandedNodes() : [],
    selectedComponentId: this.selectedComponentId || null
  };
}

restoreState(state) {
  if (!state) return;
  
  if (state.viewMode && this.setViewMode) {
    this.setViewMode(state.viewMode);
  }
  
  if (state.expandedNodes && this.expandNodes) {
    this.expandNodes(state.expandedNodes);
  }
  
  if (state.selectedComponentId && this.highlightComponent) {
    this.highlightComponent(state.selectedComponentId);
  }
  
  if (state.scrollPosition !== undefined) {
    requestAnimationFrame(() => {
      window.scrollTo(0, state.scrollPosition);
    });
  }
}
```

### EXECUTION STEPS FOR PHASE 5

**Execute in this exact order:**

1. **OPEN `public/views/DocumentListView.js`**
2. **ADD `captureState()` method** at end of class
3. **ADD `restoreState(state)` method** at end of class
4. **ADD helper methods** (`getActiveFilters()`, `applyFilters()`, etc.) if needed
5. **SAVE file** and verify no syntax errors

6. **REPEAT steps 1-5** for `public/views/DocumentDetailView.js`
7. **REPEAT steps 1-5** for `public/views/AssemblyView.js`
8. **REPEAT steps 1-5** for any other stateful views

9. **VERIFY:** Each view should have:
   - `captureState()` method returning object
   - `restoreState(state)` method accepting object
   - Helper methods for granular state capture/restore

---

## PHASE 6: ENTRY POINT INTEGRATION

### OBJECTIVE
Wire everything together in `public/app.js` - initialize router, create HistoryState, inject into controllers, configure routes, and start the router.

### FILE TO MODIFY
`public/app.js`

### INTEGRATION STEPS

**LOCATE the initialization section in app.js and UPDATE as follows:**

```javascript
// EXISTING IMPORTS...
import { StateManager } from './state/StateManager.js';
import { DocumentController } from './controllers/DocumentController.js';
// ... other imports

// ADD NEW IMPORTS
import { Router } from './router/Router.js';
import { HistoryState } from './state/HistoryState.js';
import { configureRoutes } from './router/routes.js';

async function initializeApp() {
  try {
    console.log('Initializing OnShape DocuReader...');
    
    // EXISTING: Check authentication
    const authStatus = await checkAuthStatus();
    if (!authStatus.authenticated) {
      showLoginPrompt();
      return;
    }
    
    // EXISTING: Create services
    const apiService = new ApiService();
    const documentService = new DocumentService(apiService);
    
    // EXISTING: Create state manager
    const stateManager = new StateManager();
    
    // NEW: Create router and history state
    const router = new Router();
    const historyState = new HistoryState(stateManager);
    
    // EXISTING: Create views
    const documentListView = new DocumentListView(document.getElementById('app'));
    const documentDetailView = new DocumentDetailView(document.getElementById('app'));
    const assemblyView = new AssemblyView(document.getElementById('app'));
    // ... other views
    
    // UPDATED: Create controllers WITH router and historyState
    const documentController = new DocumentController(
      documentService,
      documentListView,
      stateManager,
      router,           // NEW
      historyState      // NEW
    );
    
    const assemblyController = new AssemblyController(
      documentService,
      assemblyView,
      stateManager,
      router,           // NEW
      historyState      // NEW
    );
    
    // ... other controllers
    
    // NEW: Configure routes
    console.log('Configuring routes...');
    configureRoutes(router, {
      document: documentController,
      assembly: assemblyController,
      // ... other controllers
    });
    
    // NEW: Start the router
    console.log('Starting router...');
    router.start();
    
    // EXISTING: Initial load or let router handle it
    // If router handles initial route, don't manually load
    // Otherwise keep existing initialization
    
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showErrorMessage('Failed to initialize application. Please refresh the page.');
  }
}

// Start the app
initializeApp();
```

### CRITICAL DECISIONS

**Decision 1: Initial Route Handling**

Choose ONE approach:

**Option A: Router handles initial load (RECOMMENDED)**
```javascript
// In Router.js, the start() method should:
start() {
  this.initializeListeners();
  
  // Handle initial route
  if (window.location.hash) {
    this.handleRouteChange(); // Parse and execute current hash
  } else {
    // Navigate to default route
    this.navigate(ROUTES.HOME);
  }
}
```

**Option B: App.js handles initial load**
```javascript
// After router.start()
if (!window.location.hash) {
  // Load default view manually
  await documentController.loadDocumentList();
} else {
  // Let router handle the existing hash
  router.handleRouteChange();
}
```

**Decision 2: View Management**

Determine if views should auto-hide when navigating:

**Option A: Controllers manage view visibility (RECOMMENDED)**
```javascript
// In DocumentController.showDocumentFromRoute()
this.documentListView.hide();
this.documentDetailView.show();
```

**Option B: Router manages view visibility**
```javascript
// Less recommended - adds complexity to router
// Keep view management in controllers
```

### EXECUTION STEPS FOR PHASE 6

**Execute in this exact order:**

1. **OPEN `public/app.js`**
2. **ADD imports** for Router, HistoryState, configureRoutes
3. **LOCATE initializeApp() function**
4. **ADD router creation:** `const router = new Router();`
5. **ADD history state creation:** `const historyState = new HistoryState(stateManager);`
6. **UPDATE all controller instantiations** to include router and historyState parameters
7. **ADD route configuration:** `configureRoutes(router, { ... });`
8. **ADD router start:** `router.start();`
9. **DECIDE on initial route handling** (Option A or B above)
10. **SAVE file** and verify no syntax errors

---

## TESTING CHECKLIST

After completing all phases, test these scenarios:

### Basic Navigation
- [ ] Click document → detail view loads → URL changes to `#/document/:id`
- [ ] Click back button → returns to list → URL changes back
- [ ] Click forward button → returns to detail → URL changes forward
- [ ] Direct URL with hash → loads correct view on page load

### State Persistence
- [ ] Apply filters → navigate to document → back button → filters still applied
- [ ] Scroll halfway down list → navigate to document → back → scroll position restored
- [ ] Search for documents → navigate to document → back → search query still there
- [ ] Expand filter sections → navigate away → back → sections still expanded

### Multiple Navigations
- [ ] Navigate through multiple documents → back/forward through history → each loads correctly
- [ ] Document → assembly → back → back → reaches correct states
- [ ] Apply filters at each step → back/forward → filters restored at each step

### Edge Cases
- [ ] Refresh page on document detail → document reloads from URL
- [ ] Copy URL from detail view → paste in new tab → loads correctly
- [ ] Navigate with invalid ID in URL → shows error gracefully
- [ ] Back button from first page → doesn't break app

### UI State
- [ ] Tab selection persists on detail view during back/forward
- [ ] Assembly expanded nodes persist during navigation
- [ ] Sort order persists on list view during navigation
- [ ] Grid/list view mode persists during navigation

---

## SUCCESS CRITERIA

✅ **Phase 4 Complete When:**
- All controllers accept router and historyState in constructor
- Controllers use router.navigate() instead of direct view manipulation
- Controllers use router.back() for return navigation
- Route handler methods exist for each route

✅ **Phase 5 Complete When:**
- All views have captureState() method
- All views have restoreState() method
- State capture includes all relevant UI elements
- State restoration properly applies captured state

✅ **Phase 6 Complete When:**
- app.js imports router modules
- Router and HistoryState are instantiated
- All controllers receive router dependencies
- Routes are configured correctly
- Router starts successfully
- Initial route loads correctly

✅ **Overall Success When:**
- Browser back/forward buttons work correctly
- No console errors during navigation
- State persists across navigation events
- URLs are bookmarkable and shareable
- All existing functionality still works

---

## OUTPUT REQUIREMENTS

For EACH file modification:
1. **Show complete modified sections** (not entire file if unchanged)
2. **Use clear comments** to mark NEW vs UPDATED code
3. **Preserve existing functionality** - only add routing features
4. **Include error handling** for navigation failures
5. **Test each change** before moving to next file

BEGIN EXECUTION NOW. Start with Phase 4, Controller Integration.