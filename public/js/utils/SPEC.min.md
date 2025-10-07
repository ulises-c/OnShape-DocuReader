# Utils – SPEC (Compressed)

## Purpose

Pure functions: clipboard, DOM, download, format, CSV generation, mass export; no side effects (except I/O).

## Dir

```
public/js/utils/
├── clipboard.js (copyToClipboard)
├── dom-helpers.js (qs, qsa, on, delegate, escapeHtml)
├── download.js (downloadJson)
├── format-helpers.js (formatDateWithUser)
├── getCSV.js (getCSV - filter ASM/PRT parts, generate CSV)
└── massCSVExporter.js (exportAllDocuments - fetch all docs, generate CSVs, download thumbnails)
```

## Responsibilities

**clipboard.js**: copyToClipboard(text); modern Clipboard API + fallback
**dom-helpers.js**: qs(selector, root); qsa(selector, root); on(el, event, handler); delegate(root, selector, event, handler); escapeHtml(text)
**download.js**: downloadJson(data, prefix); Blob + timestamped filename
**format-helpers.js**: formatDateWithUser(dateStr, userObj); "Month Day, Year, Time [User]"
**getCSV.js**: getCSV(parts); filter parts by ASM/PRT pattern; return CSV string with headers
**massCSVExporter.js**: exportAllDocuments(apiClient, documentService); fetch all docs → elements → parts; generate filtered CSVs; download thumbnails

## Interfaces

**clipboard**: copyToClipboard(text) → Promise<boolean>
**dom-helpers**: qs/qsa → Element(s); on → cleanup fn; delegate → void; escapeHtml → string
**download**: downloadJson(data, prefix) → void (triggers download)
**format-helpers**: formatDateWithUser(dateStr, user) → string
**getCSV**: getCSV(parts) → string (CSV content or empty if no ASM/PRT matches)
**massCSVExporter**: exportAllDocuments(apiClient, documentService) → Promise<void>

## Security/Perf

- escapeHtml prevents XSS; no innerHTML with unescaped data
- Event delegation; single listeners for dynamic content
- Blob URL revoke after download; cleanup fns for listeners
- CSV escaping for special characters (comma, quote, newline)

## Dependencies

None; native browser APIs (Clipboard, DOM, Blob, URL, Intl, Fetch)

## Future

createElement helper; debounce/throttle; formatFileSize; pluralize; deepClone; isValidDate; truncate; formatRelativeTime; groupBy; progress tracking for mass export
