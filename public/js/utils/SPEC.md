# Utilities Specification `public/js/utils/SPEC.md`

## Purpose

Pure utility functions providing reusable helpers for clipboard operations, DOM manipulation, file downloads, and data formatting across the frontend application.

## Directory Structure

```
public/js/utils/
├── clipboard.js          # Clipboard API wrapper with fallback
├── dom-helpers.js        # DOM query and event delegation utilities
├── download.js           # File download helpers
└── format-helpers.js     # Date and data formatting functions
```

## Core Responsibilities

### clipboard.js
**Clipboard Operations**
- Cross-browser clipboard write functionality
- Modern Clipboard API with legacy fallback
- Secure context detection
- Promise-based interface

**Key Function:**
- `copyToClipboard(text)` - Copy text to clipboard with browser compatibility handling

### dom-helpers.js
**DOM Manipulation and Querying**
- Safe HTML escaping to prevent XSS
- Convenient query selector shortcuts
- Event delegation for dynamic content
- Event listener cleanup helpers

**Key Functions:**
- `qs(selector, root)` - Single element query
- `qsa(selector, root)` - Multiple elements query
- `on(el, event, handler, options)` - Event binding with cleanup
- `delegate(root, selector, eventName, handler)` - Event delegation
- `escapeHtml(text)` - XSS-safe HTML escaping

### download.js
**File Download Operations**
- JSON file generation and download
- Blob creation with proper MIME types
- Automatic timestamped filenames
- Memory cleanup after download

**Key Function:**
- `downloadJson(data, filenamePrefix)` - Export JSON data as downloadable file

### format-helpers.js
**Data Formatting**
- Date formatting with user attribution
- Locale-aware timestamp formatting
- Graceful error handling for invalid dates
- Consistent display format across application

**Key Function:**
- `formatDateWithUser(dateStr, userObj)` - Format ISO date with user context

## Architecture Patterns

### Pure Functions
All utilities are pure functions with no side effects (except I/O):
- Deterministic output for given input
- No global state mutation
- Easily testable
- Composable

### Progressive Enhancement
```javascript
// Clipboard: Modern API with graceful degradation
if (navigator.clipboard && window.isSecureContext) {
  await navigator.clipboard.writeText(text);
} else {
  // Fallback to execCommand for older browsers
}
```

### Memory Management
```javascript
// Download: Automatic resource cleanup
const url = window.URL.createObjectURL(blob);
// ... use url ...
window.URL.revokeObjectURL(url); // Prevent memory leak
```

## API Reference

### Clipboard Operations

#### copyToClipboard(text)
```javascript
await copyToClipboard('Hello World');
```
- **Parameters**: `text` (string) - Text to copy
- **Returns**: `Promise<boolean>` - Success status
- **Browser Support**: Modern browsers + fallback

### DOM Helpers

#### qs(selector, root)
```javascript
const element = qs('.my-class', containerEl);
```
- **Parameters**: 
  - `selector` (string) - CSS selector
  - `root` (Element) - Search root (default: document)
- **Returns**: `Element | null`

#### qsa(selector, root)
```javascript
const elements = qsa('.item', containerEl);
```
- **Returns**: `Element[]` - Array of matching elements

#### on(el, event, handler, options)
```javascript
const cleanup = on(button, 'click', handleClick);
cleanup(); // Remove listener
```
- **Returns**: Function to remove event listener

#### delegate(root, selector, eventName, handler)
```javascript
delegate(document, '.btn', 'click', (e, target) => {
  console.log('Clicked:', target);
});
```
- **Parameters**:
  - `root` (Element) - Container element
  - `selector` (string) - Target selector
  - `eventName` (string) - Event name
  - `handler` (Function) - Event handler receives (event, matchedElement)

#### escapeHtml(text)
```javascript
const safe = escapeHtml(userInput); // Prevents XSS
```
- **Returns**: `string` - HTML-escaped text

### Download Operations

#### downloadJson(data, filenamePrefix)
```javascript
downloadJson(documentData, 'onshape-document');
// Downloads: onshape-document-1733527485000.json
```
- **Parameters**:
  - `data` (any) - JavaScript object to serialize
  - `filenamePrefix` (string) - Filename prefix (default: 'onshape-export')
- **Side Effect**: Triggers browser download

### Formatting Operations

#### formatDateWithUser(dateStr, userObj)
```javascript
formatDateWithUser('2024-09-16T15:59:08.000Z', { name: 'John' });
// Returns: "Sep 16, 2024, 3:59:08 PM [John]"
```
- **Parameters**:
  - `dateStr` (string) - ISO 8601 date string
  - `userObj` (Object) - User object with `name` property
- **Returns**: `string` - Formatted date with user attribution
- **Format**: `Month Day, Year, Hour:Minute:Second AM/PM [Username]`

## Integration Examples

### Clipboard in Views
```javascript
import { copyToClipboard } from '../utils/clipboard.js';

async handleCopyJson() {
  const ok = await copyToClipboard(JSON.stringify(data, null, 2));
  if (ok) {
    this.showSuccess('Copied to clipboard!');
  }
}
```

### DOM Helpers in Controllers
```javascript
import { delegate, escapeHtml } from '../utils/dom-helpers.js';

bindEvents() {
  this.cleanup = delegate(
    document.body,
    '.document-tile',
    'click',
    (e, tile) => this.handleDocumentClick(tile.dataset.id)
  );
}
```

### Download in Export
```javascript
import { downloadJson } from '../utils/download.js';

async exportDocument(doc) {
  const data = await this.service.getComprehensiveDocument(doc.id);
  downloadJson(data, `document-${doc.name}`);
}
```

### Formatting in Views
```javascript
import { formatDateWithUser } from '../utils/format-helpers.js';

renderMetadata(doc) {
  return `
    <div class="metadata">
      <div>Created: ${formatDateWithUser(doc.createdAt, doc.createdBy)}</div>
      <div>Modified: ${formatDateWithUser(doc.modifiedAt, doc.modifiedBy)}</div>
    </div>
  `;
}
```

## Security Considerations

### XSS Prevention
- `escapeHtml()` prevents script injection in dynamic content
- All user-provided text should be escaped before DOM insertion
- No `innerHTML` usage without escaping

### Clipboard Security
- Modern Clipboard API requires secure context (HTTPS)
- Fallback method uses temporary DOM element (cleaned up)
- No persistent clipboard access

### Download Safety
- Blob URLs revoked after use to prevent memory leaks
- JSON serialization with error handling
- No external data sources in download operations

## Performance Optimizations

### Event Delegation
- Single event listener for multiple dynamic elements
- Reduces memory footprint
- Improves performance for large lists

### Query Optimization
```javascript
// Good: Cache root element
const container = qs('#container');
const items = qsa('.item', container);

// Bad: Query document repeatedly
const items = qsa('#container .item');
```

### Memory Management
- Blob URLs properly revoked
- Event listener cleanup functions returned
- Temporary DOM elements removed

## Browser Compatibility

### Clipboard API
- Modern: `navigator.clipboard` (Chrome 66+, Firefox 63+, Safari 13.1+)
- Fallback: `document.execCommand('copy')` (legacy support)
- Both methods tested and functional

### DOM APIs
- `querySelector/querySelectorAll`: All modern browsers
- `addEventListener`: Universal support
- `closest()`: IE11+ (polyfill if needed)

### Date Formatting
- `Intl.DateTimeFormat`: Modern browsers
- Fallback to `toLocaleString()` with options
- Graceful error handling for invalid dates

## Best Practices

### Pure Function Usage
```javascript
// Good: Pure function, testable
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

// Bad: Side effect, hard to test
export function formatDateInDOM(dateStr, elementId) {
  document.getElementById(elementId).textContent = formatDate(dateStr);
}
```

### Error Handling
```javascript
// Good: Graceful degradation
try {
  return formatComplexDate(dateStr);
} catch {
  return 'Invalid Date';
}

// Bad: Silent failure
try {
  return formatComplexDate(dateStr);
} catch {
  return; // Returns undefined!
}
```

### Import Paths
```javascript
// Good: Explicit imports
import { copyToClipboard } from '../utils/clipboard.js';
import { escapeHtml } from '../utils/dom-helpers.js';

// Bad: Default imports for named exports
import clipboard from '../utils/clipboard.js';
```

## Future Enhancements

- [ ] Add `createElement` helper with attribute support
- [ ] Implement `debounce` and `throttle` utilities
- [ ] Add CSV export helper alongside JSON
- [ ] Implement `formatFileSize` for document sizes
- [ ] Add `pluralize` helper for dynamic text
- [ ] Create `deepClone` utility for state management
- [ ] Add `isValidDate` validation helper
- [ ] Implement `truncate` for long text display
- [ ] Add `formatRelativeTime` (e.g., "2 days ago")
- [ ] Create `groupBy` helper for data organization

## Dependencies

**None** - All utilities use native browser APIs:
- Clipboard API / document.execCommand
- DOM APIs (querySelector, createElement)
- Blob and URL APIs
- Intl.DateTimeFormat

## Related Components

- `public/js/views/*` - Primary consumers of utilities
- `public/js/controllers/*` - Use DOM helpers and formatting
- `public/js/services/*` - May use download helpers
- All components use `escapeHtml` for XSS protection

## Testing Considerations

### Unit Testing
All utilities are pure functions (except I/O), easily testable:
```javascript
// Example test
assert.equal(
  escapeHtml('<script>alert("xss")</script>'),
  '&lt;script&gt;alert("xss")&lt;/script&gt;'
);
```

### Browser Compatibility Testing
- Test clipboard in secure and non-secure contexts
- Verify event delegation with dynamic content
- Validate date formatting across locales

### Edge Cases
- Clipboard: Secure context detection
- DOM: Null/undefined inputs
- Download: Large JSON objects
- Formatting: Invalid dates, missing user objects
