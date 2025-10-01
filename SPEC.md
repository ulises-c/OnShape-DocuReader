## 1. Root Directory `SPEC.md`

```markdown
# OnShape DocuReader - Project Specification

## Overview

OnShape DocuReader is a web application that provides secure OAuth 2.0 authenticated access to OnShape documents, enabling users to browse, view details, and export document data with comprehensive metadata.

## Project Structure
```

.
├── src/ # Backend TypeScript/Express server
├── public/ # Frontend static files and client-side JavaScript
├── notes/ # Development documentation and history
├── examples/ # Usage examples and sample data
├── dist/ # Compiled backend JavaScript (generated)
└── .sessions.json # Session storage (runtime generated)

```

## Architecture Pattern
- **Backend**: Express.js with TypeScript, RESTful API design
- **Frontend**: Modular vanilla JavaScript with ES6 modules
- **State Management**: Centralized state with observer pattern
- **Routing**: Hash-based client-side routing with history support
- **Authentication**: OAuth 2.0 PKCE flow with OnShape

## Key Technologies
- Node.js/Express (backend)
- TypeScript (backend type safety)
- Vanilla JavaScript ES6 modules (frontend)
- OnShape API v12
- OAuth 2.0 with PKCE

## Development Workflow
- AI-assisted development using AIPACK & PRO CODER
- Structured documentation in notes/
- Git-based version control with detailed history tracking
- Modular architecture with ~23+ separate modules

## Build & Runtime
- `npm run build` - Compile TypeScript
- `npm run dev` - Development server with hot reload
- `npm start` - Production server
- Port 3000 (default)
```
