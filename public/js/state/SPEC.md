# State Module Specification `public/js/state/SPEC.md`

## Purpose
Navigation state persistence and restoration system for maintaining UI continuity across browser navigation events.

## Components

### HistoryState.js
**State management for navigation with:**
- **Scroll Position Capture**: Window and container scroll preservation
- **View State Strategies**: Pluggable per-view state capture/restore logic
- **App State Integration**: Duck-typed interface for external state managers
- **Safe Serialization**: JSON-safe state snapshots for history.state
- **Restoration Lifecycle**: Coordinated restore order (app state → view state → scroll)

## Architecture

### State Layers
1. **App State** (optional): Global application state via state manager
2. **View State**: Per-view UI state (filters, selections, tabs, etc.)
3. **Scroll State**: Window and container scroll positions

### Strategy Pattern
View-specific capture/restore logic injected via strategies:
```js
strategies: {
  documentList: {
    capture: () => ({ selectedIds: [...], searchQuery: '...' }),
    restore: (snap) => { /* restore checkboxes, search input */ }
  },
  elementDetail: {
    capture: () => ({ activeTab: 'parts' }),
    restore: (snap) => { /* restore active tab */ }
  }
}
```

## Integration Points

### With Router
HistoryState is invoked during navigation:
1. **Before navigation**: `captureState(viewType)` called by controller
2. **State passed to router**: `router.navigate(path, capturedState)`
3. **On route change**: Handler receives `state` parameter
4. **After render**: `restoreState(state)` rehydrates UI

### With State Managers
Duck-typed integration with AppState or similar:

**Capture APIs** (probed in order):
- `getSnapshot()`
- `getState()`
- `toJSON()`

**Restore APIs** (probed in order):
- `replace(state)`
- `replaceState(state)`

### With Views
Views implement optional methods for tight integration:
- `captureState()`: Return serializable view state
- `restoreState(state)`: Rehydrate UI from state

## State Capture Process
```
captureState(viewType, extra)
    ↓
1. Create base metadata (version, timestamp, view)
    ↓
2. Call view strategy capture() if available
    ↓
3. Capture scroll positions (window + containers)
    ↓
4. Capture app state via state manager
    ↓
5. Safe clone and return serializable snapshot
```

## State Restoration Process
```
restoreState(historyState)
    ↓
1. Restore app state first (affects rendering)
    ↓
2. Restore view state via strategy
    ↓
3. Schedule scroll restoration (after paint)
    ↓
4. Apply scroll via requestAnimationFrame
```

## Scroll Management

### Container Selection
Containers marked with `[data-scroll-preserve]` attribute:
- `data-scroll-key`: Optional unique identifier
- Falls back to element ID or generated key

### Scroll Capture
Records for each container:
- `key`: Container identifier
- `selector`: CSS selector used
- `top`: scrollTop value
- `left`: scrollLeft value

### Scroll Restoration
- Window scroll restored first
- Container scroll restored via key/selector matching
- Deferred to next paint cycle for layout stability

## State Format
Captured state is JSON-serializable:
```js
{
  version: 1,
  view: 'documentList',
  timestamp: '2025-10-01T14:08:52.000Z',
  scroll: {
    x: 0, y: 120,
    containers: [
      { key: 'documents-section', selector: '[data-scroll-preserve]', top: 350, left: 0 }
    ]
  },
  viewSnapshot: {
    selectedIds: ['doc1', 'doc2'],
    searchQuery: 'assembly'
  },
  appState: { /* global app state if available */ }
}
```

## Error Handling
- Graceful fallback when strategies throw
- Safe defaults for missing state
- No-op when state invalid or missing
- Isolated error logging per operation

## Performance Optimizations
- Double requestAnimationFrame for scroll stability
- Safe JSON serialization with error handling
- Minimal DOM queries during capture
- Deferred restoration for non-critical state

## Future Enhancements
- [ ] State compression for large datasets
- [ ] Incremental restoration for large views
- [ ] Strategy composition/inheritance
- [ ] State migration for version changes
- [ ] Debugger/inspector integration
