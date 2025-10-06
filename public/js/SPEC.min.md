# Frontend JS – SPEC (Compressed)

## Purpose
Modular client architecture: controllers, services, views, state, routing, utils.

## Dir
```
public/js/
├── app.js (bootstrap)
├── controllers/ (app, document, export)
├── services/ (api-client, auth, document, export, thumbnail)
├── views/ (base, list, detail, element, part, modal, nav)
├── state/ (app-state, HistoryState)
├── router/ (Router, routes)
└── utils/ (clipboard, dom, download, format)
```

## Responsibilities
**app.js**: Auth check; init services/views/controllers; configure router; register HistoryState strategies; start router; set default route
**Controllers**: Orchestrate views/services; handle user actions; integrate router
**Services**: API calls via fetch; no DOM manipulation
**Views**: Render DOM; bind events; capture/restore state; inherit BaseView
**State**: AppState (observer); HistoryState (browser history + view state)
**Router**: Hash routing; param extraction; history API; subscriber pattern
**Utils**: clipboard, DOM helpers, download, format

## Bootstrap Flow
```
Auth check → Create services → Create views → Init controllers → Wire modal → AppController.init() → Router setup → Register strategies → Start router → Default route
```

## Interfaces
**Bootstrap**: app.js exports nothing; side-effects only
**Controllers**: loadDocuments(); navigateToDocument(id); onSelectionChanged(ids); startExport(options)
**Services**: API methods return Promises; exportStreamSSE returns EventSource
**Views**: render(data); captureState(); restoreState(state); bind(); unbind()
**State**: setState(partial); subscribe(fn); captureState(view); restoreState(state)
**Router**: register(pattern, handler); navigate(path, state); back(); forward()

## Security/Perf
- escapeHtml() for all user content; type-only imports; session cookies
- Event delegation; lazy loading; deferred scroll; minimal reflows

## Dependencies
None; ES6 modules; modern browser APIs

## Future
Caching; virtual scroll; WebSocket; testing; ARIA; PWA
