# What is this file?

Contains an ordered list of bugs and features that have been be added or fixed.
Not sorted in any particular order.
The numbering is just show that it's easier to keep track.

# ✅ DONE

1. Fix CSP and MIME type errors in Express server
   1. Configure Express static middleware to set correct MIME type (`application/javascript`) for all `.js` files
   2. Update Content-Security-Policy headers to allow inline scripts using hash-based approach
   3. Verify ES6 module imports work without errors

1. Refactor `public/app.js`
   1. Remove/archive the old monolithic `public/app.js` in favor of the modular entry `public/js/app.js` (index.html already loads it via `<script type="module" src="js/app.js"></script>`)

   2. Fix method name mismatches between DocumentService and ApiClient
      1. Update `DocumentService.getElements(documentId, workspaceId)` to call `api.getElements(documentId, workspaceId)` instead of `api.getDocumentElements(...)`

   3. Add missing method to ApiClient
      1. Implement `getComprehensiveDocument(documentId, params)` to request `/api/documents/:documentId/comprehensive` with query params and return JSON

   4. Add `getPartMassProperties` to DocumentService
      1. Implement `getPartMassProperties(documentId, workspaceId, elementId, partId)` delegating to `ApiClient.getPartMassProperties(...)`

   5. Fix invalid API access in DocumentController
      1. Replace direct `this.documentService.api.request(...)` usage with `this.documentService.getPartMassProperties(...)` to keep API access within the services layer

   6. Add missing `replaceState` to AppState
      1. Implement `replaceState(newState)` that freezes and emits the new state; used by `AppController`

1. Update the list view (default view)
   1. Add selection boxes
   2. Add a "get selected" button to complement the "get all" button
2. Update detailed view
   1. Add a "copy raw json" button
   2. Remove the `Creator` field, will be merged with `Created`
   3. Adjust the following fields:
      1. `Created` (currently unknown, but list view shows creator) and add in `creator`, example:
         1. 2024-Sep-16, 3:59:08 PM [John Smith]
      2. `Modified` should also have a similar output
         1. 2025-Jun-02, 3:59:08 PM [John Smith]
   4. Add the following fields:
      1. `notes`, `tags`, `documentLabels`
   5. Add a copy raw json to child documents within detailed view (e.g. the clickable tiles for types like: partstudio, blob, assembly, billofmaterials)
   6. Update the `copy raw json` button for child documents to copy everything from that child document including metadata.
3. Update project documentation
   1. Create comprehensive ONSHAPE_API.md reference document
   2. Update README.md with new features and current project state
   3. Update ARCHITECTURE.md with detailed architecture overview
   4. Refresh basic-usage.md with latest features and examples
4. Update what `get all`, `get selected` `get document` does
   2. Change default selections to all selected
   5. Fix `get selected`
      1. Ensure exporting only processes selected documents (frontend passes ids; backend scopes by ids)
5. Update navigation so that going "forward" and "back" recalls where you were
   1. Avoid monolithic code files (e.g. avoid create a massive file and split code up)
   2. Potentially means adding new pages such as: `detailed`, `document`, `assembly`, etc., but I am unsure. So think about different ways to navigating and recalling navigation
   3. Implement history-aware navigation (e.g., /document/:id routes, preserve filters and scroll position)
6. Fix file structure in `public/`
   1. I think I see an issue with my directory as well. I have `public/js/`​ which has all my `js` files, but within `public/` I have `router/` and `state/`​ which contain `js` files.
   2. Continue with the creation of SPEC files in directories.
      1. What is a `SPEC.md` file? Serves as a summary for cheap context instead of feeding entire files.
   3. Fix broken import paths in `public/js/app.js` that prevented router initialization and broke login functionality
7. CSV/thumbnail export with ZIP functionality
   1. Implement ZIP-based export for ASM/PRT filtered CSVs and thumbnails
   2. Add utility functions for safe filename handling (basename, sanitizeFilename)
   3. Update massCSVExporter.js with both ZIP and multi-file export modes
   4. Ensure export runs synchronously in click handler (gesture-safe)
   5. Fix folder path issues in download filenames (basename-only)

---

_For older completed items, see notes/archives/DONE-XXX.md_
