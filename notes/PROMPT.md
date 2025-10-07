You’re fixing the **CSV/thumbnail export** flow in a browser-based OnShape client. Current issues:

- Filenames passed to `a.download` include folder paths (`exports/...`) that browsers ignore; only the **basename** is honored.
- Many separate automatic downloads get **blocked** if not triggered by a **user gesture**.
- The export action may be invoked **asynchronously** after a click, causing the browser to treat downloads as non-gesture and block them.

## Objectives

1. **Minimal fix path (baseline)**

- Ensure **basename-only** filenames for all downloads (CSV and PNG).
- Make the export function run **directly in the click handler** (or synchronously chained promise from it) so it’s treated as a user gesture.
- Log concise progress; handle empty/failed docs gracefully.

2. **Recommended path (primary) — Single ZIP**

- Add `exportAllDocumentsAsZip(apiClient, documentService)` that:

  - Dynamically imports **JSZip** ESM from a CDN.
  - Adds `docName_parts.csv` and `docName.png` (if available) into a folder per document inside the ZIP.
  - Generates one Blob and triggers **one** download using a safe basename (e.g., `onshape-docs-export-YYYY-MM-DD-HH-MM-SS.zip`).

- Keep `exportAllDocuments(...)` (multi-file) as a fallback, but prefer ZIP in UI.

3. **Filtering**

- Keep using the existing `getCSV(parts)` behavior to include only parts with **ASM/PRT** in the part number (case-insensitive, tolerant of dashes/underscores).

4. **UI wiring**

- Bind the **“Export CSV [ASM/PRT]”** button so clicking it calls the export (prefer ZIP path) in the same task as the user gesture. The page already includes a button with id `exportCSVBtn`.

5. **Security/arch**

- Never embed tokens client-side; use the existing backend proxy/services.
- Use defensive checks for missing workspaces/elements/parts/thumbnail refs.

## Implementation details

- **Filename safety utils**

  - `sanitizeFilename(name): string` → `[A-Za-z0-9_-]` only; replace others with `_`.
  - `basename(name): string` → last path segment only (for safety).

- **Download helpers**

  - `downloadFile(contentStr, filename, mime)` → Blob → `a.download = basename(filename)`.
  - `downloadBlob(blob, filename)` → same basename rule.

- **Gesture safety**

  - The click handler should call **exactly one** exported function (ZIP recommended) and await it; avoid setTimeout/queued events that break gesture context.

- **JSZip import**

  - `const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.esm.min.js')).default;`

- **Thumbnails**

  - Fetch via your existing **thumbnail proxy** endpoint; add `docName.png` to the doc’s folder in the ZIP.

## Acceptance criteria

- [ ] CSV exports only include parts with ASM/PRT in the part number.
- [ ] **No folder paths** in `download` filenames; only basenames.
- [ ] Single-ZIP export works and downloads **one** file reliably after button click.
- [ ] Multi-file export (fallback) still works when explicitly chosen and initiated via the click.
- [ ] No uncaught errors; progress logs are readable.

## Test plan (manual)

1. Click **Export CSV [ASM/PRT]**:

   - Expect a single ZIP to download. Open ZIP: each document has `docName_parts.csv` (filtered) and optional `docName.png`.

2. Temporarily switch to multi-file path:

   - Expect multiple downloads to appear; filenames have **no** folder segments.

3. Remove ASM/PRT parts in one doc:

   - CSV for that doc is omitted (or empty file not created).

4. Invoke export from console without a click:

   - Multi-file path may be blocked; ZIP path should still work if allowed, but default UI remains click-driven.
