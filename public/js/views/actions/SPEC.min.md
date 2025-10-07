# Actions – SPEC (Compressed)

## Purpose
Business logic handlers for document and element operations; self-contained; testable; use services for API calls.

## Dir
```
public/js/views/actions/
├── document-actions.js (doc-level ops)
└── element-actions.js (element-level ops)
```

## Responsibilities
**DocumentActions**: handleGetDocument(docId); handleGetJson(docData); handleCopyJson(docData); handleLoadHierarchy(docId, controller); handleExportCsv(docData, elements) - Document-level button actions
**ElementActions**: handleCopyElementJson(element, controller); handleFetchBomJson(element, docId, wid, service); handleDownloadBomCsv(element, docId, wid, service) - Element-level button actions; ASSEMBLY/PART specific

## Interfaces
**DocumentActions**: constructor(controller); all methods return Promise<void> or Promise<boolean>; self-contained; uses controller/services
**ElementActions**: constructor(controller, service); methods return Promise<boolean> or Promise<void>; handles BOM for ASSEMBLY; mass props for PART

## Patterns
- Constructor injection of dependencies (controller, services)
- Try/catch error handling in all methods
- Return success/failure for feedback
- No DOM manipulation; delegate to utils (toast, download)
- Uses controller for state/navigation access

## Security
- No direct DOM manipulation; relies on safe utils
- Error logging without exposing sensitive data
- API calls through services only

## Future
Action composition; middleware pattern; action history; undo/redo; testing utils; validation layer
```
