# Frontend Specification `public/SPEC.md`

## Purpose

Client-side application providing UI for document browsing, detailed views, and export functionality with history-aware navigation.

## Directory Structure

```

public/
├── js/ # Main JavaScript modules
│ ├── controllers/ # UI orchestration logic
│ ├── services/ # API and business logic
│ ├── views/ # UI rendering components
│ ├── state/ # State management
│ ├── utils/ # Helper utilities
│ └── app.js # Application entry point
├── router/ # Client-side routing [INCONSISTENT LOCATION]
│ ├── Router.js # Hash-based router implementation
│ └── routes.js # Route configuration
├── state/ # State management [INCONSISTENT LOCATION]
│ └── HistoryState.js # Navigation state capture/restore
├── index.html # Main application page
├── dashboard.html # OAuth success redirect page
└── styles.css # Application styles

```

## Architecture Patterns

### MVC-like Structure

- **Models**: State management (AppState)
- **Views**: UI components (views/)
- **Controllers**: Orchestration (controllers/)

### Service Layer

- ApiClient: HTTP communication
- DocumentService: Document operations
- ExportService: Export workflows
- AuthService: Authentication state

### Observer Pattern

- AppState with subscribers
- Event-driven UI updates
- Decoupled components

## Component Responsibilities

### Controllers (`/js/controllers`)

- **AppController**: Global initialization, auth flow, event binding
- **DocumentController**: Document operations, navigation, view coordination
- **ExportController**: Export modal, progress tracking, download handling

### Services (`/js/services`)

- **ApiClient**: Backend API calls, no DOM manipulation
- **AuthService**: Login/logout, status checking
- **DocumentService**: Document CRUD operations
- **ExportService**: Export execution and streaming
- **ThumbnailService**: Image loading with fallbacks

### Views (`/js/views`)

- **Navigation**: Page transitions
- **DocumentListView**: Table/grid rendering, selection
- **DocumentDetailView**: Document info, elements display
- **ElementDetailView**: Parts, assemblies, metadata tabs
- **PartDetailView**: Part details, mass properties
- **ModalManager**: Export modal control

### State Management

- **AppState**: Centralized state with observer pattern
- **HistoryState**: Browser navigation state capture/restore

### Routing

- **Router**: Hash-based routing with history API
- **Routes**: Route patterns and configuration

## Navigation Flow

```

Landing → OAuth Login → Dashboard → Document List
↓
Document Detail → Element Detail
↓
Part Detail

```

## State Management

- Centralized AppState with freeze/emit pattern
- Component-level state for UI elements
- History state for navigation persistence

## Event Flow

1. User interaction → Controller method
2. Controller → Service call
3. Service → API request
4. Response → State update
5. State change → View re-render

## File Structure Issues

- [ ] router/ and state/ should be in public/js/
- [ ] Inconsistent module organization
- [ ] Consider consolidating under js/

## Browser Compatibility

- ES6 modules (modern browsers)
- Fallback clipboard API
- RequestAnimationFrame usage
- No localStorage/sessionStorage in artifacts

## Performance Optimizations

- Lazy loading for document details
- Rate limiting for API calls
- Virtual scrolling considerations
- Debounced search input
