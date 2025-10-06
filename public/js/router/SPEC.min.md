# Router – SPEC (Compressed)

## Purpose
Hash-based routing; history management; deep-linking; pattern matching.

## Dir
```
public/js/router/
├── Router.js (core routing engine)
└── routes.js (patterns, config, pathTo helper)
```

## Responsibilities
**Router.js**: Register routes; navigate/replace/back/forward; hashchange/popstate listeners; param extraction; query parsing; subscriber pattern
**routes.js**: ROUTES constant; configureRoutes(router, controllers); pathTo(pattern, params, query)

## Interfaces
**Router**: register(pattern, handler); navigate(path, state); replace(path, state); back(); forward(); subscribe(fn); start(); destroy()
**routes.js**: ROUTES = { HOME, DOCUMENT_LIST, DOCUMENT_DETAIL, ELEMENT_DETAIL, PART_DETAIL }; configureRoutes(); pathTo()

## Flow
```
User action → URL hash change → Router parses → Pattern match → Handler(params, state, context) → Controller renders → HistoryState captures → Nav complete
```

## Features
- Pattern: `/document/:id`, `/document/:docId/element/:elementId/part/:partId`
- Query parsing via URLSearchParams
- State via history.state
- Duplicate event suppression
- Error isolation in handlers

## Future
Wildcards; guards/middleware; nested routes; validation; route introspection
