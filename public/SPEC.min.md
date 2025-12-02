# Frontend – SPEC (Compressed)

## Purpose
Client UI for OnShape docs browsing, detail views, export with history-aware navigation.

## Dir
```
public/
├── js/
│   ├── controllers/ (app, document, export)
│   ├── services/ (api-client, auth, document, export, thumbnail)
│   ├── views/ (base, list, detail, element, part, modal, nav)
│   ├── state/ (app-state, HistoryState)
│   ├── router/ (Router, routes)
│   └── utils/ (clipboard, dom, download, format)
├── index.html
├── dashboard.html
└── css/main.css
```

## Responsibilities
- MVC pattern: controllers orchestrate; views render; services fetch
- OAuth flow; session-based auth
- Document CRUD; elements/parts/assemblies display
- Export with SSE progress; JSON/ZIP download
- Hash routing; browser history state capture/restore
- Event delegation; observer pattern state updates

## Interfaces
**Controllers**: AppController.init(); DocumentController.loadDocuments()|navigateToDocument(id); ExportController.startExport(options)
**Services**: ApiClient.getDocuments()|exportStreamSSE(); AuthService.login()|logout(); DocumentService.getById(id)|getComprehensiveDocument(id)
**Views**: BaseView; DocumentListView.render(docs)|captureState(); DocumentDetailView; ElementDetailView; PartDetailView; ModalManager; Navigation
**Router**: Router.register(pattern, handler)|navigate(path, state)|back(); ROUTES constant; pathTo(pattern, params)
**State**: AppState.setState()|subscribe(); HistoryState.captureState(view)|restoreState(state)

## Security/Perf
- XSS prevention via escapeHtml(); no innerHTML with unescaped data
- Event delegation for dynamic content; single listeners
- Deferred scroll restoration (double rAF); lazy thumbnail loading
- Session cookies only; tokens never exposed client-side

## Dependencies
None (pure JS); Fetch API; EventSource (SSE); Clipboard API; History API

## Future
Virtual scroll; caching; WebSocket; service worker; ARIA; PWA; testing utils
