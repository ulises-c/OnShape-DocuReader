# Utils – SPEC (Compressed)

## Purpose
Pure functions: clipboard, DOM, download, format; no side effects (except I/O).

## Dir
```
public/js/utils/
├── clipboard.js (copyToClipboard)
├── dom-helpers.js (qs, qsa, on, delegate, escapeHtml)
├── download.js (downloadJson)
└── format-helpers.js (formatDateWithUser)
```

## Responsibilities
**clipboard.js**: copyToClipboard(text); modern Clipboard API + fallback
**dom-helpers.js**: qs(selector, root); qsa(selector, root); on(el, event, handler); delegate(root, selector, event, handler); escapeHtml(text)
**download.js**: downloadJson(data, prefix); Blob + timestamped filename
**format-helpers.js**: formatDateWithUser(dateStr, userObj); "Month Day, Year, Time [User]"

## Interfaces
**clipboard**: copyToClipboard(text) → Promise<boolean>
**dom-helpers**: qs/qsa → Element(s); on → cleanup fn; delegate → void; escapeHtml → string
**download**: downloadJson(data, prefix) → void (triggers download)
**format-helpers**: formatDateWithUser(dateStr, user) → string

## Security/Perf
- escapeHtml prevents XSS; no innerHTML with unescaped data
- Event delegation; single listeners for dynamic content
- Blob URL revoke after download; cleanup fns for listeners

## Dependencies
None; native browser APIs (Clipboard, DOM, Blob, URL, Intl)

## Future
createElement helper; debounce/throttle; CSV export; formatFileSize; pluralize; deepClone; isValidDate; truncate; formatRelativeTime; groupBy
