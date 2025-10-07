# Views – SPEC (Compressed)

## Purpose

DOM rendering; event binding; state capture/restore; inherit BaseView; no API calls.

## Dir

```
public/js/views/
├── base-view.js (abstract base)
├── document-list-view.js (table/grid)
├── document-detail-view.js (doc metadata, elements)
├── element-detail-view.js (tabs: parts/assemblies/metadata)
├── modal-manager.js (export/progress modals)
├── navigation.js (page transitions)
└── part-detail-view.js (part details, mass props)
```

## Responsibilities

**BaseView**: ensureContainer(); clear(); renderHtml(html); bind()/unbind() hooks
**DocumentListView**: render(docs); checkbox selection; select-all; event delegation; captureState/restoreState
**DocumentDetailView**: render(doc, elements); thumbnail via ThumbnailService; hierarchy; JSON copy; captureState/restoreState
**ElementDetailView**: render(element); tabs (parts/assemblies/metadata); captureState/restoreState
**PartDetailView**: render(part); mass properties; captureState/restoreState
**ModalManager**: showExport/hideExport; showProgress/hideProgress; readExportOptions(); updateEstimates/Progress; appendLog()
**Navigation**: showPage(pageId); hide others; .active class

## Interfaces

**BaseView**: constructor(selector); ensureContainer(); clear(); renderHtml(html); bind(); unbind()
**DocumentListView**: render(docs); captureState(); restoreState(state)
**DocumentDetailView**: render(doc, elements); updateHierarchy(docId, html); captureState(); restoreState(state)
**ElementDetailView**: render(element); captureState(); restoreState(state)
**PartDetailView**: render(part); captureState(); restoreState(state)
**ModalManager**: setHandlers(handlers); showExport/hideExport; showProgress/hideProgress; readExportOptions(); updateEstimates(count); updateProgress(cur, tot); setCurrentTask(text); appendLog(msg)

## Patterns

- Inheritance: BaseView → List/Detail/Element/Part views
- Event delegation: single listener per container
- State capture: scroll (window + containers); selections; search; tabs
- State restore: inputs → view state → scroll (double rAF)

## Security/Perf

- escapeHtml() for all user content; no innerHTML with unescaped data
- Event delegation; lazy rendering; deferred scroll; minimal reflows

## Future

Virtual scroll; infinite scroll; skeletons; caching; ARIA; tagged templates; error boundaries; testing utils; responsive; Intersection Observer; animations; search highlight; column sort
