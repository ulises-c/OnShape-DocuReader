```md
# Task: Fix Remaining Issues in Refactored Frontend

## Context
The refactoring from monolithic `public/app.js` to modular architecture is 95% complete. All modules have been created and the new entry point is wired up. However, there are critical bugs that need to be fixed before the application will run.

## Remaining Issues

### 1. Remove Old Monolithic File
- [ ] Delete or archive `public/app.js` (the old 1800-line monolithic file)
- [ ] Confirm `public/index.html` loads `<script type="module" src="js/app.js"></script>` (the new modular version)

### 2. Fix Method Name Mismatches in DocumentService
**File:** `public/js/services/document-service.js`

**Current (broken):**
```js
async getElements(documentId, workspaceId) {
  return this.api.getDocumentElements(documentId, workspaceId);  // Wrong method name
}
```

**Fix to:**
```js
async getElements(documentId, workspaceId) {
  return this.api.getElements(documentId, workspaceId);
}
```

### 3. Add Missing Method to ApiClient
**File:** `public/js/services/api-client.js`

**Add this method:**
```js
async getComprehensiveDocument(documentId, params) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`/api/documents/${documentId}/comprehensive?${queryString}`);
  if (!res.ok) throw new Error(`Get comprehensive document failed (${res.status})`);
  return res.json();
}
```

### 4. Fix Invalid API Access in DocumentController
**File:** `public/js/controllers/document-controller.js`

**Problem:** Line attempts to access `this.documentService.api.request()` which doesn't exist.

**Current (broken):**
```js
const massProps = await this.documentService.api.request(
  `/api/documents/${doc.id}/workspaces/${doc.defaultWorkspace.id}/elements/${el.id}/parts/${partId}/mass-properties`
);
```

**Fix Option 1 - Add method to DocumentService:**
```js
// In document-service.js, add:
async getPartMassProperties(documentId, workspaceId, elementId, partId) {
  return this.api.getPartMassProperties(documentId, workspaceId, elementId, partId);
}

// Then in document-controller.js use:
const massProps = await this.documentService.getPartMassProperties(
  doc.id, doc.defaultWorkspace.id, el.id, partId
);
```

**Fix Option 2 - Pass ApiClient separately to DocumentController:**
```js
// In app.js, modify DocumentController instantiation:
const documentController = new DocumentController(
  state, 
  services, 
  navigation, 
  services.thumbnailService,
  apiClient  // Add this parameter
);

// Then in document-controller.js constructor, accept and store it:
constructor(state, services, navigation, thumbnailService, apiClient) {
  // ... existing code ...
  this.apiClient = apiClient;
}

// Then use it:
const massProps = await this.apiClient.getPartMassProperties(
  doc.id, doc.defaultWorkspace.id, el.id, partId
);
```

**Choose Fix Option 1** (cleaner - keeps API access through services layer)

### 5. Fix Missing replaceState Method in AppState
**File:** `public/js/state/app-state.js`

**Add this method:**
```js
replaceState(newState) {
  this._state = Object.freeze({ ...newState });
  this._emit();
}
```

**Used in:** `public/js/controllers/app-controller.js` line 28

## Success Criteria
After fixes:
- [ ] No console errors on page load
- [ ] Login/logout works
- [ ] Document list displays
- [ ] Can click document to view details
- [ ] Can navigate to elements
- [ ] Can navigate to parts and see mass properties
- [ ] Export modal opens and functions
- [ ] All existing functionality preserved

## Files to Modify
1. `public/app.js` - DELETE or move to `public/app.js.old`
2. `public/js/services/document-service.js` - Fix method name
3. `public/js/services/api-client.js` - Add getComprehensiveDocument method
4. `public/js/services/document-service.js` - Add getPartMassProperties method
5. `public/js/controllers/document-controller.js` - Fix mass properties access
6. `public/js/state/app-state.js` - Add replaceState method
```
