# Basic Usage Examples

## Getting Started

1. **Setup OAuth App in OnShape**

   - Go to https://dev-portal.onshape.com/
   - Create new OAuth application
   - Set redirect URI: `http://localhost:3000/auth/callback`
   - Copy Client ID and Client Secret

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

## Example API Usage

### Authentication Flow

```javascript
// User visits: http://localhost:3000
// Clicks "Login with OnShape"
// Gets redirected to OnShape OAuth
// After authorization, returns to: http://localhost:3000/auth/callback
// Finally redirected to dashboard
```

### API Endpoints

#### Get User Information

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
     http://localhost:3000/api/user
```

Response:

```json
{
  "id": "user_id",
  "name": "Your Name",
  "email": "your@email.com",
  "company": "Your Company"
}
```

#### List Documents

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
     http://localhost:3000/api/documents
```

Response:

```json
[
  {
    "id": "doc_id",
    "name": "My Document",
    "owner": {
      "name": "Owner Name",
      "id": "owner_id"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "modifiedAt": "2025-01-01T00:00:00.000Z",
    "isPublic": false
  }
]
```

#### Get Document Details

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
     http://localhost:3000/api/documents/DOCUMENT_ID
```

#### Get Document Elements

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
     http://localhost:3000/api/documents/DOCUMENT_ID/workspaces/WORKSPACE_ID/elements
```

## Client-Side Usage

### Check Authentication Status

```javascript
fetch("/auth/status")
  .then((response) => response.json())
  .then((data) => {
    if (data.authenticated) {
      console.log("User is authenticated");
    } else {
      console.log("User needs to login");
    }
  });
```

### Load Documents

```javascript
fetch("/api/documents")
  .then((response) => response.json())
  .then((documents) => {
    console.log("User documents:", documents);
  })
  .catch((error) => {
    console.error("Error loading documents:", error);
  });
```

### Search Documents (Client-side filtering)

```javascript
function searchDocuments(documents, query) {
  return documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.owner.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

## Error Handling

### Common Error Responses

**401 Unauthorized**

```json
{
  "error": "Not authenticated"
}
```

**500 Server Error**

```json
{
  "error": "Failed to load documents: API request failed"
}
```

### Frontend Error Handling

```javascript
async function loadDocumentsSafely() {
  try {
    const response = await fetch("/api/documents");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const documents = await response.json();
    return documents;
  } catch (error) {
    console.error("Error loading documents:", error);
    // Show user-friendly error message
    showError("Unable to load documents. Please try again.");
    return [];
  }
}
```

## Customization

### Adding New API Endpoints

1. **Add to OnShape API Client** (`src/services/onshape-api-client.ts`)

```typescript
async getPartDetails(documentId: string, workspaceId: string, elementId: string, partId: string) {
  const response = await this.axiosInstance.get(
    `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts/${partId}`
  );
  return response.data;
}
```

2. **Add Express Route** (`src/routes/api.ts`)

```typescript
router.get(
  "/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts/:partId",
  requireAuth,
  async (req, res) => {
    try {
      const { documentId, workspaceId, elementId, partId } = req.params;
      const tokens = (req as any).tokens;
      const apiClient = new OnShapeApiClient(tokens.access_token);

      const part = await apiClient.getPartDetails(
        documentId,
        workspaceId,
        elementId,
        partId
      );
      res.json(part);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

3. **Use in Frontend**

```javascript
async function loadPartDetails(documentId, workspaceId, elementId, partId) {
  const response = await fetch(
    `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts/${partId}`
  );
  return response.json();
}
```

## Troubleshooting

### OAuth Issues

- Verify redirect URI matches exactly in OnShape app settings
- Check Client ID and Secret are correct
- Ensure OnShape app has required scopes

### API Errors

- Check network connectivity
- Verify OnShape API is accessible
- Check access token hasn't expired
- Review OnShape API rate limits

### Build Issues

- Run `npm run clean` then `npm run build`
- Check TypeScript compilation errors
- Verify all dependencies are installed
