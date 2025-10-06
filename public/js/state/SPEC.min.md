# State – SPEC (Compressed)

## Purpose
Navigation state persistence; scroll/UI restoration across browser nav.

## Dir
```
public/js/state/
└── HistoryState.js (state capture/restore)
```

## Responsibilities
- Capture: window/container scroll; view state (filters, selections, tabs); app state
- Restore: app state → view state → scroll (via rAF)
- Pluggable strategies per view (documentList, elementDetail)
- Duck-typed integration with AppState (getSnapshot/replace)

## Interfaces
**HistoryState**: captureState(viewType, extra); restoreState(historyState)
**Strategies**: { viewType: { capture: () => state, restore: (state) => void } }
**State Format**: { version, view, timestamp, scroll: { x, y, containers: [] }, viewSnapshot, appState }

## Flow
```
captureState(view) → Strategy capture() → Scroll capture → App state → Return snapshot
restoreState(state) → App state restore → Strategy restore() → Scroll restore (double rAF)
```

## Scroll
- Containers: `[data-scroll-preserve]` with optional `data-scroll-key`
- Restoration: window first, then containers by key/selector
- Deferred via double rAF for layout stability

## Future
State compression; incremental restore; strategy composition; version migration; debugger
