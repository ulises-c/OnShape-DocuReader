# OnShape DocuReader

A web application built with TypeScript and Express.js that uses OAuth 2.0 to securely access and browse OnShape documents through the OnShape API.

## ✨ Features

- 🔐 **Secure OAuth 2.0 Authentication** - Safely authenticate with OnShape using industry-standard OAuth flow
- 📄 **Document Browser** - View and browse your OnShape documents with a clean, intuitive interface
- ☑️ **Document Selection** - Select individual documents with checkboxes and "Select All" functionality
- 📋 **Selective Export** - Export only selected documents with the "Get Selected" button
- 🔍 **Document Details** - Access detailed information about documents, including metadata and elements
- ⚙️ **Element Exploration** - Browse parts, assemblies, and other elements within your documents
- 📦 **Single Document Export** - Get comprehensive data for individual documents with the "Get Document" button
- 📊 **API Integration** - Full TypeScript client for OnShape API with comprehensive error handling
- 🖼️ **Thumbnails** - View document thumbnails with secure proxy loading
- 👨‍👦 **Parent/Hierarchy** - Load and display parent/hierarchy information for documents
- 🗃️ **Element Metadata** - Access and export element metadata including complete element properties
- 📝 **Raw JSON View** - Inspect raw document JSON in the UI with one-click copy functionality
- 📋 **Element JSON Copy** - Copy raw JSON data for individual elements (parts, assemblies, etc.)
- 🏷️ **Enhanced Document Info** - View document notes, tags, and labels in detailed view
- 📅 **Formatted Timestamps** - Clear date formatting with creator/modifier information
- 📤 **Export All/ZIP** - Export all documents as JSON or ZIP with flexible options
- ⚙️ **Export Options** - Choose what to include (elements, parts, assemblies, metadata, etc.)
- 🚦 **Rate Limiting Controls** - Configure API request rate for exports
- 📈 **Progress Modal & Log** - Visual progress and logs for export operations
- 🛡️ **Frontend Error Handling** - User-friendly error messages and robust error handling
- 🔒 **Logout & Session Management** - Secure logout and session handling

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- An OnShape account
- An OnShape OAuth application (see setup instructions below)

### 1. Clone and Install

```bash
git clone https://github.com/ulises-c/OnShape-DocuReader.git
cd OnShape-DocuReader
npm install
```

### 2. OnShape OAuth App Setup

1. Visit the [OnShape Developer Portal](https://dev-portal.onshape.com/)
2. Sign in with your OnShape account
3. Create a new OAuth application:
   - **Name**: OnShape DocuReader
   - **Summary**: Document reader application
   - **Redirect URIs**: `http://localhost:3000/auth/callback`
   - **OAuth URL**: `http://localhost:3000`
   - **Scopes**: Select `OAuth2Read` and `OAuth2ReadPII`
4. Note down your **Client ID** and **Client Secret**
5. [Application Permissions](https://cad.onshape.com/appstore/dev-portal/oauthApps)
   1. ✅ Application can read your profile information
   2. ✅ Application can read your documents
   3. ❌ Application can write to your documents
   4. ❌ Application can delete your documents and workspaces
   5. ❌ Application can request purchases on your behalf
   6. ❌ Application can share and unshare documents on your behalf

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your OnShape OAuth credentials
# ONSHAPE_CLIENT_ID=your_client_id_here
# ONSHAPE_CLIENT_SECRET=your_client_secret_here
```

### 4. Run the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Or build and run production
npm run build
npm start
```

Visit `http://localhost:3000` to start using the application!

## 📁 Project Structure

```
OnShape-DocuReader/
├── src/
│   ├── config/
│   │   ├── airtable.ts           # Airtable OAuth & API configuration
│   │   └── oauth.ts              # OnShape OAuth configuration
│   ├── routes/
│   │   ├── airtable-api.ts       # Airtable API proxy routes
│   │   ├── airtable-auth.ts      # Airtable OAuth routes
│   │   ├── api.ts                # OnShape API routes
│   │   └── auth.ts               # OnShape authentication routes
│   ├── services/
│   │   ├── airtable-api-client.ts      # Airtable REST API client
│   │   ├── airtable-oauth-service.ts   # Airtable OAuth 2.0 service
│   │   ├── airtable-thumbnail-service.ts # Thumbnail upload to Airtable
│   │   ├── api-call-cost.ts      # API cost estimation
│   │   ├── api-usage-tracker.ts  # Usage tracking
│   │   ├── oauth-service.ts      # OnShape OAuth 2.0 service
│   │   ├── onshape-api-client.ts # OnShape API client
│   │   ├── session-storage.ts    # Session management service
│   │   └── usage-db.ts           # SQLite usage database
│   ├── types/
│   │   ├── airtable.d.ts         # Airtable type definitions
│   │   ├── onshape.ts            # OnShape type definitions
│   │   ├── session.d.ts          # Session type definitions
│   │   └── usage.d.ts            # Usage tracking types
│   └── index.ts                  # Express server entry point
├── public/
│   ├── css/
│   │   ├── base/                 # Reset, typography, variables
│   │   ├── components/           # Buttons, cards, forms, modals, tables, tabs
│   │   ├── layout/               # Header, container
│   │   ├── views/                # Page-specific styles
│   │   └── main.css              # CSS entry point
│   ├── js/
│   │   ├── controllers/          # App, document, export, airtable controllers
│   │   ├── router/               # Hash-based SPA router
│   │   ├── services/             # API client, auth, document, export services
│   │   ├── state/                # AppState, HistoryState
│   │   ├── utils/                # Helpers, CSV export, clipboard, download
│   │   ├── views/                # UI views and modals
│   │   └── app.js                # Frontend entry point
│   ├── dashboard.html            # OAuth success redirect page
│   └── index.html                # Main SPA interface
├── docs/
│   ├── AUTO_SPEC.md              # Auto-generated project specification
│   └── LLM_SPEC.md               # LLM-optimized specification
├── examples/
│   ├── basic-usage.md            # Usage examples and API documentation
│   ├── example_onshape_docs/     # Example OnShape document structures
│   └── real_onshape_docs/        # Real OnShape document examples
├── notes/
│   ├── ARCHITECTURE.md           # Project architecture documentation
│   ├── GOALS.md                  # Project goals and objectives
│   ├── LLM-INSTRUCTIONS.md       # Instructions for LLM agents
│   ├── ONSHAPE_API.md            # OnShape API reference
│   └── TODO.md                   # Current tasks and completed features
├── .env.example                  # Environment template
├── nodemon.json                  # Development server configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.js                # Vite frontend build configuration
└── package.json                  # Dependencies and scripts
```

## 🔧 API Endpoints

### OnShape Authentication

- `GET /auth/login` - Initiate OnShape OAuth flow
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

### Airtable Authentication

- `GET /auth/airtable/login` - Initiate Airtable OAuth flow
- `GET /auth/airtable/callback` - Handle Airtable OAuth callback
- `GET /auth/airtable/status` - Check Airtable authentication status
- `POST /auth/airtable/logout` - Logout from Airtable
- `POST /auth/airtable/refresh` - Refresh Airtable access token

### OnShape API

- `GET /api/user` - Get current user info
- `GET /api/documents` - List user documents (paginated)
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/versions` - Get document versions
- `GET /api/documents/:id/branches` - Get document branches
- `GET /api/documents/:id/combined-history` - Get combined version/branch history
- `GET /api/documents/:id/comprehensive` - Get comprehensive document data
- `GET /api/documents/:id/parent` - Get parent/hierarchy information
- `GET /api/documents/:id/workspaces/:wid/elements` - Get document elements
- `GET /api/documents/:id/versions/:vid/elements` - Get elements from version
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/parts` - Get parts
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/assemblies` - Get assemblies
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/bom` - Get BOM data
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/metadata` - Get metadata
- `GET /api/documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties` - Get mass properties
- `GET /api/onshape/folders` - Get root folders via globaltreenodes
- `GET /api/onshape/folders/:id` - Get folder contents

### Export API

- `GET /api/export/all` - Export all documents (JSON or ZIP)
- `GET /api/export/stream` - Stream export progress via SSE
- `GET /api/export/directory-stats` - Pre-scan directory statistics
- `POST /api/export/prepare-assemblies` - Prepare assembly export
- `GET /api/export/aggregate-bom-stream` - Stream aggregate BOM export
- `GET /api/export/aggregate-bom` - Download aggregate BOM

### Airtable API

- `GET /api/airtable/config` - Get Airtable configuration status
- `GET /api/airtable/bases` - List available bases
- `GET /api/airtable/bases/:baseId/tables` - List tables in a base
- `GET /api/airtable/bases/:baseId/tables/:tableId/schema` - Get table schema
- `GET /api/airtable/bases/:baseId/tables/:tableId/records` - List records
- `POST /api/airtable/upload-thumbnails` - Upload thumbnails to Airtable
- `POST /api/airtable/find-record` - Find record by field value

### Utility

- `GET /api/thumbnail-proxy` - Proxy thumbnail images securely
- `GET /api/usage/stats` - Get API usage statistics

## 🛠️ Development

### Available Scripts

```bash
npm run dev         # Start dev server (concurrent backend + Vite frontend)
npm run build       # Build TypeScript + Vite frontend
npm run start       # Start production server
npm run clean       # Clean build directory
npm run spec        # Generate AUTO_SPEC.md documentation
npm run spec:preview # Preview first 150 lines of spec
npm run spec:minimal # Generate minimal spec
npm run spec:full   # Generate full verbosity spec
```

### Code Structure

- **TypeScript** - Fully typed codebase with strict type checking
- **Express.js** - Web server with middleware for security and CORS
- **OAuth 2.0** - PKCE flow implementation for secure authentication
- **Modern Frontend** - Vanilla JavaScript with ES6+ features

## 🔒 Security Features

- **PKCE OAuth Flow** - Enhanced security for OAuth 2.0
- **Helmet.js** - Security headers and CSP
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Request validation and sanitization
- **Secure Cookies** - HttpOnly session cookies

## 🌐 Environment Variables

| Variable                       | Description                            | Required   |
| ------------------------------ | -------------------------------------- | ---------- |
| `ONSHAPE_CLIENT_ID`            | OAuth Client ID from OnShape           | ✅         |
| `ONSHAPE_CLIENT_SECRET`        | OAuth Client Secret from OnShape       | ✅         |
| `ONSHAPE_REDIRECT_URI`         | OAuth redirect URI                     | Optional\* |
| `AIRTABLE_CLIENT_ID`           | Airtable OAuth Client ID               | Optional   |
| `AIRTABLE_CLIENT_SECRET`       | Airtable OAuth Client Secret           | Optional   |
| `AIRTABLE_REDIRECT_URI`        | Airtable OAuth redirect URI            | Optional   |
| `AIRTABLE_BASE_ID`             | Default Airtable base ID               | Optional   |
| `AIRTABLE_TABLE_ID`            | Default Airtable table ID              | Optional   |
| `AIRTABLE_PART_NUMBER_FIELD`   | Field name for part number matching    | Optional   |
| `AIRTABLE_THUMBNAIL_FIELD`     | Field name for thumbnail attachments   | Optional   |
| `PORT`                         | Server port number                     | Optional   |
| `NODE_ENV`                     | Environment (development/production)   | Optional   |
| `SESSION_SECRET`               | Session encryption secret              | Optional   |

\*Default: `http://localhost:3000/auth/callback`

## 📝 Usage Examples

### Basic Document Listing

After authentication, the application automatically loads your OnShape documents and displays them in a responsive grid layout.

### Document Selection and Management

The main document list includes:

- **Document Selection** - Use checkboxes to select individual documents
- **Select All** - Toggle all documents with the header checkbox
- **Get Selected** - Export only the documents you've selected
- **Dynamic Button States** - Selection count displayed in real-time

### Document Details

Click on any document to view:

- Document metadata (name, creator, modified dates with user information)
- Document notes, tags, and labels
- Workspace information
- Document elements (parts, assemblies, etc.)
- Element properties and details
- Comprehensive raw JSON data with copy functionality

### Thumbnails

Document detail view displays a thumbnail image, loaded securely via a backend proxy endpoint.

### Parent/Hierarchy

Click the "Load Hierarchy Details" button in the document detail view to fetch and display parent/hierarchy information for the document.

### Raw JSON View

The document detail view includes a "Raw JSON" section to inspect the full document data structure.

### Export All/ZIP & Export Options

Use the "Get All" button to export all documents. Choose what to include (elements, parts, assemblies, metadata, etc.), select JSON or ZIP format, and set rate limiting options. Progress and logs are shown in a modal.

### Assemblies, Mass Properties, and Metadata

Element and part detail views allow you to browse assemblies, part mass properties, and element metadata.

### Error Handling

User-friendly error messages are shown for failed API calls or export operations. Session expiration and authentication errors are handled gracefully.

### Logout

Click the "Logout" button in the dashboard to securely end your session.

### Single Document Export

Use the "📦 Get Document" button in the document detail view to:

- Export comprehensive data for the currently selected document
- Include elements, parts, assemblies, and metadata
- Download data as a JSON file for offline analysis
- Process individual documents without bulk export overhead

### Search and Filter

Use the search functionality to filter documents by name or creator.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is current not under a license. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check that your OnShape OAuth app is configured correctly
2. Verify your environment variables are set properly
3. Ensure you have the required OnShape API permissions
4. Check the console for any error messages

For additional help, please open an issue on GitHub.

## 🙏 Acknowledgments

- OnShape for providing comprehensive API documentation
- The TypeScript and Express.js communities
- All contributors who help improve this project
