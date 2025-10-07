# Utilities Specification `public/js/utils/SPEC.md`

## Purpose

Pure utility functions providing reusable helpers for clipboard operations, DOM manipulation, file downloads, data formatting, and CSV generation/export across the frontend application.

## Directory Structure

```
public/js/utils/
├── clipboard.js          # Clipboard API wrapper with fallback
├── dom-helpers.js        # DOM query and event delegation utilities
├── download.js           # File download helpers
├── format-helpers.js     # Date and data formatting functions
├── getCSV.js            # CSV generation with ASM/PRT filtering [DEPRECATED]
├── getFilteredCSV.js    # CSV generation with custom column filtering (WIP)
├── bomToCSV.js          # Bill of Materials to CSV conversion
└── massCSVExporter.js   # Bulk document export with CSVs and thumbnails
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

### getCSV.js [DEPRECATED]

**Filtered CSV Generation**

- Generate CSV from parts data
- Filter for ASM/PRT part numbers only
- Support various part number formats (ASM-XXXXXX, PRT-XXXXXX)
- Case-insensitive pattern matching
- CSV field escaping for special characters

**Key Function:**

- `getCSV(parts)` - Generate CSV string with ASM/PRT filtered parts

### getFilteredCSV.js

**Custom Column CSV Filtering (Work in Progress)**

- Extends bomToCSV functionality
- Multi-selection UI for header filtering
- Two-phase generation (identify headers, then filter)
- Currently in development

### bomToCSV.js

**Bill of Materials Conversion**

- Convert OnShape BOM JSON to CSV format
- Process all BOM headers (not just visible)
- Handle array and object values in cells
- Proper CSV escaping for complex data
- Matches OnShape export format

**Key Function:**

- `bomToCSV(bomJson)` - Convert BOM JSON to CSV string

### massCSVExporter.js

**Bulk Document Export**

- Two export modes: ZIP (recommended) and multi-file
- Fetch all documents, elements, and parts
- Generate filtered CSVs (ASM/PRT only)
- Download document thumbnails
- Organized folder structure in ZIP mode
- Gesture-safe single download

**Key Functions:**

- `exportAllDocumentsAsZip(apiClient, documentService)` - Single ZIP export
- `exportAllDocuments(apiClient, documentService)` - Multi-file export (fallback)

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

### Filename Safety

```javascript
// massCSVExporter: Sanitize and extract basename only
function sanitizeFilename(name) {
  return String(name || "document")
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 200);
}

function basename(filename) {
  const normalized = filename.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}
```

## API Reference

### CSV Generation

#### getCSV(parts)

```javascript
const csv = getCSV(parts);
// Returns CSV with only ASM/PRT filtered parts
```

- **Parameters**: `parts` (Array) - Array of part objects
- **Returns**: `string` - CSV content or empty string if no matches
- **Pattern**: Matches `/\b(ASM|PRT)[-_]?\w{4,}\b/i`

#### bomToCSV(bomJson)

```javascript
const csv = bomToCSV(bomData);
```

- **Parameters**: `bomJson` (Object) - BOM JSON from OnShape API
- **Returns**: `string` - CSV formatted string
- **Features**:
  - Processes all headers (not just visible)
  - Handles array values (semicolon-joined)
  - Handles object values (JSON stringified)
  - Proper CSV escaping

### Bulk Export

#### exportAllDocumentsAsZip(apiClient, documentService)

```javascript
await exportAllDocumentsAsZip(apiClient, documentService);
// Single ZIP download with organized folders
```

- **Parameters**:
  - `apiClient` (Object) - API client instance
  - `documentService` (Object) - Document service instance
- **Returns**: `Promise<void>`
- **Features**:
  - Single download (gesture-safe)
  - Organized folder per document
  - Filtered CSVs (ASM/PRT only)
  - Thumbnails included
  - Progress logging

#### exportAllDocuments(apiClient, documentService)

```javascript
await exportAllDocuments(apiClient, documentService);
// Multiple file downloads (may be blocked)
```

- **Parameters**: Same as ZIP version
- **Returns**: `Promise<void>`
- **Note**: Fallback method; multiple downloads may be blocked by browser

## Integration Examples

### CSV Export in Controllers

```javascript
import { getCSV } from '../utils/getCSV.js';
import { exportAllDocumentsAsZip } from '../utils/massCSVExporter.js';

// Export filtered CSV for single document
async exportDocument(doc) {
  const parts = await this.service.getParts(doc.id);
  const csv = getCSV(parts);
  if (csv) {
    downloadFile(csv, `${doc.name}_parts.csv`, 'text/csv');
  }
}

// Export all documents as ZIP
async exportAllDocuments() {
  await exportAllDocumentsAsZip(this.apiClient, this.documentService);
}
```

### BOM Export

```javascript
import { bomToCSV } from '../utils/bomToCSV.js';

async exportBOM(docId, elementId) {
  const bomData = await this.service.getBOM(docId, elementId);
  const csv = bomToCSV(bomData);
  downloadFile(csv, 'bom.csv', 'text/csv');
}
```

## Security Considerations

### XSS Prevention

- `escapeHtml()` prevents script injection in dynamic content
- All user-provided text should be escaped before DOM insertion
- No `innerHTML` usage without escaping
- CSV fields properly escaped for special characters

### Filename Safety

- `sanitizeFilename()` removes dangerous characters
- `basename()` prevents directory traversal
- Length limits prevent extremely long filenames
- All downloads use safe basenames only

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

### Memory Management

- Blob URLs properly revoked
- Event listener cleanup functions returned
- Temporary DOM elements removed
- ZIP generation uses streaming when possible

### Batch Processing

```javascript
// Mass export processes documents sequentially
for (const doc of documents) {
  await processDocument(doc);
  // Allow browser to breathe between operations
}
```

## Browser Compatibility

### Clipboard API

- Modern: `navigator.clipboard` (Chrome 66+, Firefox 63+, Safari 13.1+)
- Fallback: `document.execCommand('copy')` (legacy support)
- Both methods tested and functional

### JSZip Integration

- Dynamic import from local copy (`/js/lib/jszip.esm.min.js`)
- CDN fallback if local copy unavailable (may be blocked by CSP)
- Requires ES6 module support

### CSV Export

- Native Blob API
- No external dependencies
- Universal browser support for download triggers

## Error Handling

### Graceful Degradation

```javascript
// CSV export: Handle missing/invalid data
export function getCSV(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return "";
  }
  // ... filter and generate CSV
}

// Mass export: Continue on individual document failures
for (const doc of documents) {
  try {
    await processDocument(doc);
  } catch (err) {
    console.error(`Failed to process ${doc.name}:`, err.message);
    continue; // Don't fail entire export
  }
}
```

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
  return "Invalid Date";
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
import { copyToClipboard } from "../utils/clipboard.js";
import { escapeHtml } from "../utils/dom-helpers.js";
import { getCSV } from "../utils/getCSV.js";

// Bad: Default imports for named exports
import clipboard from "../utils/clipboard.js";
```

## Future Enhancements

- [ ] Complete getFilteredCSV.js implementation with UI
- [ ] Add progress callbacks to mass export functions
- [ ] Implement incremental export (only new/changed documents)
- [ ] Add export templates/presets
- [ ] Support additional CSV formats (parts, assemblies, metadata)
- [ ] Add ZIP compression level options
- [ ] Implement export resumption after interruption
- [ ] Add export history/tracking
- [ ] Support custom filename patterns
- [ ] Add export validation/verification

## Dependencies

### External Libraries

- **JSZip** (dynamically imported) - ZIP file generation
  - Local: `/js/lib/jszip.esm.min.js` (preferred)
  - Fallback: CDN (may be blocked by CSP)

### Native APIs

- Clipboard API / document.execCommand
- DOM APIs (querySelector, createElement)
- Blob and URL APIs
- Intl.DateTimeFormat
- Fetch API (for thumbnail downloads)

## Related Components

- `public/js/controllers/app-controller.js` - Wires mass export button
- `public/js/views/*` - Primary consumers of utilities
- `public/js/services/api-client.js` - Provides data for exports
- `public/js/services/document-service.js` - Document data fetching
- All components use `escapeHtml` for XSS protection

## Testing Considerations

### Unit Testing

All utilities are pure functions (except I/O), easily testable:

```javascript
// Example tests
assert.equal(
  escapeHtml('<script>alert("xss")</script>'),
  '&lt;script&gt;alert("xss")&lt;/script&gt;'
);

const parts = [{ partNumber: "ASM-12345", name: "Test" }];
const csv = getCSV(parts);
assert(csv.includes("ASM-12345"));
```

### Integration Testing

- Test mass export with sample documents
- Verify ZIP structure and contents
- Validate CSV format matches OnShape exports
- Test thumbnail download and embedding

### Edge Cases

- Empty/missing parts arrays
- Invalid BOM JSON structures
- Missing thumbnails
- Very large documents (memory constraints)
- Network failures during batch operations
- CSP blocking external JSZip
