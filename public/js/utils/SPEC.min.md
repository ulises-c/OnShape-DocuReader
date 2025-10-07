# Utils – SPEC (Compressed)

## Purpose
Pure functions: clipboard, DOM, download, format, CSV generation, BOM conversion, mass export; no side effects except I/O.

## Dir
```
public/js/utils/
├── clipboard.js (copyToClipboard)
├── dom-helpers.js (qs, qsa, on, delegate, escapeHtml)
├── download.js (downloadJson)
├── format-helpers.js (formatDateWithUser)
├── getCSV.js (getCSV - filter ASM/PRT parts, generate CSV) [DEPRECATED]
├── getFilteredCSV.js (custom column filtering - WIP)
├── bomToCSV.js (convert OnShape BOM JSON to CSV)
└── massCSVExporter.js (exportAllDocumentsAsZip, exportAllDocuments)
```

## Responsibilities
**clipboard.js**: copyToClipboard(text); modern API + fallback
**dom-helpers.js**: qs/qsa/on/delegate/escapeHtml for safe DOM ops
**download.js**: downloadJson(data, prefix); Blob + timestamped filename
**format-helpers.js**: formatDateWithUser(dateStr, userObj); locale-aware
**getCSV.js**: getCSV(parts); filter ASM/PRT pattern; return CSV or empty [DEPRECATED]
**getFilteredCSV.js**: bomToCSV + custom header filtering UI (WIP)
**bomToCSV.js**: bomToCSV(bomJson); OnShape BOM → CSV; handle arrays/objects
**massCSVExporter.js**: exportAllDocumentsAsZip() for single ZIP; exportAllDocuments() for multi-file fallback

## Interfaces
**clipboard**: copyToClipboard(text) → Promise<boolean>
**dom-helpers**: qs/qsa → Element(s); on → cleanup fn; delegate → void; escapeHtml → safe string
**download**: downloadJson(data, prefix) → void (triggers download)
**format-helpers**: formatDateWithUser(dateStr, user) → formatted string
**getCSV**: getCSV(parts) → CSV string or empty if no ASM/PRT [DEPRECATED]
**bomToCSV**: bomToCSV(bomJson) → CSV string from BOM JSON
**massCSVExporter**: exportAllDocumentsAsZip(apiClient, documentService) → Promise<void> (single ZIP); exportAllDocuments(...) → Promise<void> (multi-file)

## Key Features
**CSV Filtering**: ASM/PRT pattern `/\b(ASM|PRT)[-_]?\w{4,}\b/i`; case-insensitive
**BOM Conversion**: All headers; array → semicolon-join; object → JSON.stringify
**Mass Export**: ZIP mode (gesture-safe, single download); multi-file fallback; thumbnails; organized folders; progress logs
**Filename Safety**: sanitizeFilename() + basename(); prevent directory traversal; length limits
**JSZip Integration**: Local copy preferred (`/js/lib/jszip.esm.min.js`); CDN fallback (CSP may block)

## Security/Perf
- escapeHtml prevents XSS; CSV field escaping
- Blob URL revoke; event cleanup
- basename-only downloads; sanitized filenames
- Sequential batch processing with error isolation

## Dependencies
**External**: JSZip (dynamic import; local preferred)
**Native**: Clipboard API, DOM APIs, Blob/URL APIs, Intl, Fetch

## Future
Complete getFilteredCSV UI; progress callbacks; incremental export; templates; compression options; export resumption; history tracking; custom filename patterns; validation
