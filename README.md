# 🔧 OnShape DocuReader

A web application built with TypeScript and Express.js that uses OAuth 2.0 to securely access and browse OnShape documents through the OnShape API.

## ✨ Features

- 🔐 **Secure OAuth 2.0 Authentication** - Safely authenticate with OnShape using industry-standard OAuth flow
- 📄 **Document Browser** - View and browse your OnShape documents with a clean, intuitive interface
- 🔍 **Document Details** - Access detailed information about documents, including metadata and elements
- ⚙️ **Element Exploration** - Browse parts, assemblies, and other elements within your documents
- 📊 **API Integration** - Full TypeScript client for OnShape API with comprehensive error handling
- 🎨 **Modern UI** - Responsive web interface built with modern CSS and JavaScript

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
5. App permissions
   1.  ✅ Application can read your profile information
   2.  ✅ Application can read your documents
   3.  ❌ Application can write to your documents
   4.  ❌ Application can delete your documents and workspaces
   5.  ❌ Application can request purchases on your behalf
   6.  ❌ Application can share and unshare documents on your behalf 

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
│   │   └── oauth.ts              # OAuth configuration
│   ├── routes/
│   │   ├── auth.ts               # Authentication routes
│   │   └── api.ts                # OnShape API routes
│   ├── services/
│   │   ├── oauth-service.ts      # OAuth 2.0 service
│   │   └── onshape-api-client.ts # OnShape API client
│   └── index.ts                  # Express server
├── public/
│   ├── index.html                # Main web interface
│   ├── dashboard.html            # OAuth success page
│   ├── styles.css                # Styling
│   └── app.js                    # Frontend JavaScript
├── .env.example                  # Environment template
└── package.json                  # Dependencies and scripts
```

## 🔧 API Endpoints

### Authentication

- `GET /auth/login` - Initiate OAuth flow
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

### OnShape API

- `GET /api/user` - Get current user info
- `GET /api/documents` - List user documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/workspaces/:wid/elements` - Get document elements

## 🛠️ Development

### Available Scripts

```bash
npm run dev         # Start development server with auto-reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run clean       # Clean build directory
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

| Variable                | Description                          | Required   |
| ----------------------- | ------------------------------------ | ---------- |
| `ONSHAPE_CLIENT_ID`     | OAuth Client ID from OnShape         | ✅         |
| `ONSHAPE_CLIENT_SECRET` | OAuth Client Secret from OnShape     | ✅         |
| `ONSHAPE_REDIRECT_URI`  | OAuth redirect URI                   | Optional\* |
| `PORT`                  | Server port number                   | Optional   |
| `NODE_ENV`              | Environment (development/production) | Optional   |

\*Default: `http://localhost:3000/auth/callback`

## 📝 Usage Examples

### Basic Document Listing

After authentication, the application automatically loads your OnShape documents and displays them in a responsive grid layout.

### Document Details

Click on any document to view:

- Document metadata (name, owner, dates)
- Workspace information
- Document elements (parts, assemblies, etc.)
- Element properties and details

### Search and Filter

Use the search functionality to filter documents by name or owner.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

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
