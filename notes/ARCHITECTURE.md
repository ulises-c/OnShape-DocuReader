# What is this file?

Summarizes the current architecture of the project, including its component structure, data flow, and architectural decisions. Also outlines planned architectural improvements and notes anti-patterns to avoid.

## Current Architecture

### Component Overview

```
Frontend (Browser)
├── Web Interface (HTML/CSS)
│   ├── Document List View
│   │   ├── Selection System
│   │   └── Export Controls
│   └── Document Detail View
│       ├── Metadata Display
│       ├── Element Browser
│       └── Raw JSON Views
└── Client-side Logic (JavaScript)
    ├── Document Management
    ├── UI State Management
    └── API Integration

Backend (Node.js/Express)
├── Server Core
│   ├── Express Application
│   └── Middleware Stack
├── Authentication
│   ├── OAuth 2.0 Flow
│   └── Session Management
├── API Integration
│   ├── OnShape API Client
│   └── Response Transformation
└── Data Services
    ├── Document Processing
    ├── Export Management
    └── Caching Layer
```

### Key Components

1. **Frontend Layer**

   - Pure HTML/CSS/JavaScript implementation
   - No frontend frameworks for simplicity
   - Responsive design with CSS Grid/Flexbox
   - Event-driven UI updates
   - Client-side state management

2. **Backend Services**

   - Express.js server with TypeScript
   - RESTful API endpoints
   - OAuth 2.0 authentication flow
   - Session management
   - Rate limiting and caching

3. **OnShape Integration**

   - Typed API client
   - Document/element data models
   - Request/response transformation
   - Error handling
   - Progress tracking

4. **Data Management**
   - In-memory session storage
   - Document caching
   - Bulk export handling
   - Progress monitoring

### Data Flow

1. **Authentication Flow**

   ```
   Browser -> /auth/login -> OnShape OAuth -> /auth/callback -> Dashboard
   ```

2. **Document Retrieval**

   ```
   Browser -> API Request -> Backend -> OnShape API -> Transform -> Response
   ```

3. **Export Process**
   ```
   Selection -> Export Request -> Queue -> Process -> Stream -> Download
   ```

## Architectural Decisions

### 1. Frontend Architecture

- **No Framework Approach**: Deliberately avoiding frontend frameworks for simplicity
- **Plain JavaScript**: Using vanilla JS with modern features
- **Event Delegation**: Efficient event handling for dynamic content
- **Progressive Enhancement**: Core functionality works without JS

### 2. Backend Architecture

- **TypeScript**: Strong typing for better maintainability
- **Express.js**: Lightweight and flexible web framework
- **Modular Design**: Separate routes, services, and configuration
- **Stateless**: Session data stored separately from application logic

### 3. Security Architecture

- **OAuth 2.0 PKCE**: Secure authentication without client secrets
- **Session Management**: Secure cookie-based sessions
- **API Security**: Rate limiting, CORS, and input validation
- **Error Handling**: Safe error responses without sensitive data

### 4. Performance Architecture

- **Caching**: Document and thumbnail caching
- **Rate Limiting**: Configurable API request rates
- **Streaming**: Large data export streaming
- **Progressive Loading**: Load data as needed

## Anti-Patterns to Avoid

1. **Frontend**

   - Tight coupling between UI and data logic
   - Direct DOM manipulation without delegation
   - Complex state management without structure
   - Blocking UI during operations

2. **Backend**

   - Mixing business logic with routes
   - Synchronous API calls without streaming
   - Hard-coded configuration values
   - Insufficient error handling

3. **Data Management**
   - Storing sensitive data client-side
   - Excessive API calls without caching
   - Large in-memory data storage
   - Blocking operations in request handlers

## Planned Improvements

1. **Frontend Enhancement**

   - [ ] Enhanced navigation system with history
   - [ ] Improved document tile layouts
   - [ ] Better hierarchy visualization
   - [ ] Progressive image loading

2. **Backend Optimization**

   - [ ] Enhanced caching strategies
   - [ ] Improved rate limiting
   - [ ] Better error reporting
   - [ ] Performance monitoring

3. **Data Management**

   - [ ] Structured document storage
   - [ ] Enhanced export options
   - [ ] Better progress tracking
   - [ ] Smarter caching

4. **Developer Experience**
   - [ ] Enhanced debugging tools
   - [ ] Better documentation
   - [ ] Development utilities
   - [ ] Testing infrastructure

## Architectural Guidelines

1. **Code Organization**

   - Clear separation of concerns
   - Modular and reusable components
   - Consistent naming conventions
   - Comprehensive documentation

2. **Error Handling**

   - Graceful degradation
   - User-friendly error messages
   - Detailed error logging
   - Recovery mechanisms

3. **Performance**

   - Minimal API requests
   - Efficient data structures
   - Resource optimization
   - Progressive loading

4. **Security**
   - Input validation
   - Output sanitization
   - Secure configurations
   - Regular updates
