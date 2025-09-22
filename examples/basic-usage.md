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
    "creator": {
      "name": "Creator Name",
      "id": "creator_id"
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

#### Get Comprehensive Document Data

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
     "http://localhost:3000/api/documents/DOCUMENT_ID/comprehensive?includeElements=true&includeParts=true&includeAssemblies=true&includeMetadata=true"
```

Response:

```json
{
  "exportInfo": {
    "timestamp": "2025-09-22T23:45:00.000Z",
    "documentId": "DOCUMENT_ID",
    "options": {
      "includeBasicInfo": true,
      "includeElements": true,
      "includeParts": true,
      "includeAssemblies": true,
      "includeMassProperties": false,
      "includeMetadata": true
    }
  },
  "document": {
    "id": "DOCUMENT_ID",
    "name": "My Document",
    "creator": {...},
    "elements": [...],
    "parts": [...],
    "assemblies": [...],
    "metadata": {...}
  }
}
```

Query Parameters:

- `includeBasicInfo` (default: true) - Include document metadata
- `includeElements` (default: true) - Include document elements
- `includeParts` (default: false) - Include parts data
- `includeAssemblies` (default: false) - Include assemblies data
- `includeMassProperties` (default: false) - Include mass properties
- `includeMetadata` (default: false) - Include element metadata

#### Get Parent/Hierarchy Information

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  http://localhost:3000/api/documents/DOCUMENT_ID/parent
```

#### Get Document Thumbnail (Proxy)

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  "http://localhost:3000/api/documents/DOCUMENT_ID/thumbnail-proxy?url=THUMBNAIL_URL"
```

#### Get Assemblies for an Element

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  http://localhost:3000/api/documents/DOCUMENT_ID/workspaces/WORKSPACE_ID/elements/ELEMENT_ID/assemblies
```

#### Get Mass Properties for a Part

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  http://localhost:3000/api/documents/DOCUMENT_ID/workspaces/WORKSPACE_ID/elements/ELEMENT_ID/parts/PART_ID/mass-properties
```

#### Get Element Metadata

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  http://localhost:3000/api/documents/DOCUMENT_ID/workspaces/WORKSPACE_ID/elements/ELEMENT_ID/metadata
```

#### Export All Documents as ZIP

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  "http://localhost:3000/api/export/all?format=zip&includeElements=true&includeParts=true"
```

#### Stream Export Progress

```bash
curl -H "Cookie: session_id=YOUR_SESSION" \
  http://localhost:3000/api/export/stream
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

### Load Document Thumbnail (Proxy)

```javascript
const thumbnailUrl = encodeURIComponent(DOCUMENT_THUMBNAIL_URL);
fetch(`/api/documents/${documentId}/thumbnail-proxy?url=${thumbnailUrl}`)
  .then((res) => res.blob())
  .then((blob) => {
    const imgUrl = URL.createObjectURL(blob);
    // Use imgUrl as the src for an <img>
  });
```

### Search Documents (Client-side filtering)

```javascript
function searchDocuments(documents, query) {
  return documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.creator.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

### Load Parent/Hierarchy Information

```javascript
fetch(`/api/documents/${documentId}/parent`)
  .then((res) => res.json())
  .then((data) => {
    console.log("Parent/Hierarchy:", data);
  });
```

### Load Assemblies for an Element

```javascript
fetch(
  `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/assemblies`
)
  .then((res) => res.json())
  .then((data) => {
    console.log("Assemblies:", data);
  });
```

### Load Mass Properties for a Part

```javascript
fetch(
  `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts/${partId}/mass-properties`
)
  .then((res) => res.json())
  .then((data) => {
    console.log("Mass Properties:", data);
  });
```

### Load Element Metadata

```javascript
fetch(
  `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/metadata`
)
  .then((res) => res.json())
  .then((data) => {
    console.log("Element Metadata:", data);
  });
```

### Export All Documents as ZIP (with options)

```javascript
fetch("/api/export/all?format=zip&includeElements=true&includeParts=true")
  .then((res) => res.blob())
  .then((blob) => {
    // Download ZIP file
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "onshape-export.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
```

### Progress Modal & Rate Limiting (UI)

- When exporting, a modal shows progress and logs.
- You can set API request rate (requests per minute) in the export options.

### Raw JSON View (UI)

- In the document detail view, scroll to the "Raw JSON" section to inspect the full document data.

### Logout

```javascript
fetch("/auth/logout", { method: "POST" }).then(() =>
  console.log("Logged out!")
);
```

### Error Handling (UI)

- All API and export errors are shown in the UI as user-friendly messages.
- Session expiration and authentication errors are handled gracefully.

### Export Single Document Data

Use the "📦 Get Document" button in the document detail view, or call the API directly:

```javascript
async function getComprehensiveDocument(documentId) {
  try {
    const response = await fetch(
      `/api/documents/${documentId}/comprehensive?includeElements=true&includeParts=true&includeAssemblies=true&includeMetadata=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const comprehensiveData = await response.json();

    // Download as JSON file
    const filename = `document_${documentId}_comprehensive.json`;
    const jsonString = JSON.stringify(comprehensiveData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return comprehensiveData;
  } catch (error) {
    console.error("Error getting comprehensive document:", error);
    throw error;
  }
}
```

**UI Usage:**

1. Navigate to a document by clicking on it from the documents list
2. In the document detail view, click the "📦 Get Document" button
3. The system will download comprehensive data as a JSON file
4. The file includes document metadata, elements, parts, assemblies, and metadata

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

### Using the Comprehensive Document API

The comprehensive document endpoint (`/api/documents/:id/comprehensive`) provides a pattern for getting detailed information about a single document. Here's how it works:

**Backend Implementation** (already available):

- Uses the same data processing as the bulk export feature
- Supports configurable data inclusion options
- Implements proper rate limiting and error handling
- Returns structured JSON with export metadata

**Example Custom Usage**:

```javascript
// Custom function to get specific document data
async function getDocumentWithCustomOptions(documentId, options = {}) {
  const params = new URLSearchParams({
    includeBasicInfo: options.includeBasicInfo ?? "true",
    includeElements: options.includeElements ?? "true",
    includeParts: options.includeParts ?? "false",
    includeAssemblies: options.includeAssemblies ?? "false",
    includeMassProperties: options.includeMassProperties ?? "false",
    includeMetadata: options.includeMetadata ?? "false",
  });

  const response = await fetch(
    `/api/documents/${documentId}/comprehensive?${params}`
  );
  return response.json();
}

// Usage examples
const documentWithElementsOnly = await getDocumentWithCustomOptions("doc123", {
  includeElements: true,
  includeParts: false,
});

const documentWithEverything = await getDocumentWithCustomOptions("doc123", {
  includeElements: true,
  includeParts: true,
  includeAssemblies: true,
  includeMassProperties: true,
  includeMetadata: true,
});
```

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
