# Controllers – SPEC (Compressed)

## Purpose
Orchestrate views, services, state; handle user actions; integrate router.

## Dir
```
public/js/controllers/
├── app-controller.js (auth, global events)
├── document-controller.js (docs, elements, parts)
└── export-controller.js (export modal, progress)
```

## Responsibilities
**AppController**: Init auth; bind global events (login/logout/nav); cross-controller coord
**DocumentController**: Load/display docs; selection; navigate; view docs/elements/parts; single doc export; router integration
**ExportController**: Export modal; option selection; execute export; track progress; download

## Interfaces
**AppController**: init(); bindGlobalEvents()
**DocumentController**: loadDocuments(); viewDocument(id); viewElement(id); viewPart(id); navigateToDocument(id); showDocument(id, state); getComprehensiveDocument()
**ExportController**: showExportModal(docs); startExport(options); cancelExport()

## Patterns
- Router integration: `navigateToDocument(id) { router.navigate(path, state) }`
- Service delegation: `loadDocuments() { docs = await service.getAll(); view.render(docs) }`
- State management: `onSelectionChanged(ids) { state.setState({ selected: ids }) }`

## Future
Lifecycle hooks; error boundaries; cross-controller comm; testing
