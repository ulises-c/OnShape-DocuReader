# Views – SPEC (Compressed)

## Purpose

DOM rendering; event binding; state capture/restore; inherit BaseView; no API calls; refactored for modularity.

## Dir

```
public/js/views/
├── base-view.js (abstract base)
├── document-list-view.js (table/grid)
├── document-detail-view.js (doc metadata, elements)
├── element-detail-view.js (tabs: parts/assemblies/metadata)
├── modal-manager.js (export/progress modals)
├── navigation.js (page transitions)
├── part-detail-view.js (part details, mass props)
├── actions/ (business logic handlers)
│   ├── document-actions.js (doc-level ops)
│   └── element-actions.js (element-level ops)
└── helpers/ (pure rendering)
    ├── document-info-renderer.js (metadata HTML)
    └── element-list-renderer.js (element list HTML)
```

## Responsibilities

**BaseView**: ensureContainer(); clear(); renderHtml(html); bind()/unbind() hooks
**DocumentListView**: render(docs); checkbox selection; select-all; event delegation; captureState/restoreState
**DocumentDetailView**: render(doc, elements); thumbnail via ThumbnailService; orchestrates helpers/actions; event delegation; captureState/restoreState
**ElementDetailView**: render(element); tabs (parts/assemblies/metadata); captureState/restoreState
**PartDetailView**: render(part); mass properties; captureState/restoreState
**ModalManager**: showExport/hideExport; showProgress/hideProgress; readExportOptions(); updateEstimates/Progress; appendLog()
**Navigation**: showPage(pageId); hide others; .active class

**DocumentActions**: handleGetDocument(docId); handleGetJson(docData); handleCopyJson(docData); handleLoadHierarchy(docId, controller); handleExportCsv(docData, elements)
**ElementActions**: handleCopyElementJson(element, controller); handleFetchBomJson(element, docId, wid, service); handleDownloadBomCsv(element, docId, wid, service)

**document-info-renderer.js**: renderDocumentInfo(docData); renderThumbnailSection(docData); renderTagsAndLabels(docData) - pure functions
**element-list-renderer.js**: renderElementsList(elements); renderElementItem(element); renderElementActions(element) - pure functions

## Interfaces

**BaseView**: constructor(selector); ensureContainer(); clear(); renderHtml(html); bind(); unbind()
**DocumentListView**: render(docs); captureState(); restoreState(state)
**DocumentDetailView**: render(doc, elements); updateHierarchy(docId, html); captureState(); restoreState(state)
**ElementDetailView**: render(element); captureState(); restoreState(state)
**PartDetailView**: render(part); captureState(); restoreState(state)
**ModalManager**: setHandlers(handlers); showExport/hideExport; showProgress/hideProgress; readExportOptions(); updateEstimates(count); updateProgress(cur, tot); setCurrentTask(text); appendLog(msg)

**DocumentActions**: handleGetDocument(docId) → Promise<void>; handleGetJson(docData) → void; handleCopyJson(docData) → Promise<boolean>; handleLoadHierarchy(docId, controller) → Promise<void>
**ElementActions**: handleCopyElementJson(element, controller) → Promise<boolean>; handleFetchBomJson/DownloadBomCsv(element, docId, wid, service) → Promise<void>

**Renderers**: All return HTML strings; no side effects; use escapeHtml()

## Patterns

- Inheritance: BaseView → List/Detail/Element/Part views
- Event delegation: single listener per container
- State capture: scroll (window + containers); selections; search; tabs
- State restore: inputs → view state → scroll (double rAF)
- Refactored architecture: view orchestrates; helpers render; actions handle logic
- Action handlers: self-contained; return success/failure; use services
- Pure renderers: no state; no side effects; HTML string output

## Refactor Benefits

- DocumentDetailView: 400+ lines → ~150 lines
- Single responsibility: rendering (helpers), actions (handlers), orchestration (view)
- Testable action handlers
- Reusable rendering functions
- No duplicate utilities (toast, file-download)
- Cleaner event delegation (single listener for all element actions)

## Security/Perf

- escapeHtml() for all user content; no innerHTML with unescaped data
- Event delegation; lazy rendering; deferred scroll; minimal reflows
- Action handlers isolated; no global state mutations
- Pure renderers prevent side effect bugs

## Dependencies

**Core**: dom-helpers, format-helpers, clipboard, download, toast-notification, file-download
**View-specific**: DocumentDetailView → helpers/document-info-renderer, helpers/element-list-renderer, actions/*

## Future

Virtual scroll; infinite scroll; skeletons; caching; ARIA; tagged templates; error boundaries; testing utils; responsive; Intersection Observer; animations; search highlight; column sort; action handler composition; renderer caching
