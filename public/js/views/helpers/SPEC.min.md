# Helpers – SPEC (Compressed)

## Purpose
Pure rendering functions; no state; no side effects; HTML string generation only.

## Dir
```
public/js/views/helpers/
├── document-info-renderer.js (metadata HTML)
└── element-list-renderer.js (element list HTML)
```

## Responsibilities
**document-info-renderer.js**: renderDocumentInfo(docData); renderThumbnailSection(docData); renderTagsAndLabels(docData) - Pure functions for document metadata HTML
**element-list-renderer.js**: renderElementsList(elements); renderElementItem(element); renderElementActions(element) - Pure functions for element list HTML; type-specific action buttons

## Interfaces
**document-info-renderer.js**: All functions take data objects; return HTML strings; use escapeHtml()
**element-list-renderer.js**: All functions take element data; return HTML strings; renderElementActions() generates type-specific buttons (BOM for ASSEMBLY)

## Patterns
- Pure functions: no side effects; no state mutations
- String concatenation for HTML generation
- escapeHtml() for all dynamic content
- Exported as individual functions
- Type-specific rendering (element type → action buttons)

## Security
- All user content escaped via escapeHtml()
- No innerHTML usage; return strings only
- No eval or dynamic code execution

## Future
Template caching; tagged templates; component composition; HTML fragments; schema validation
```
