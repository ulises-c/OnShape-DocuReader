# OnShape API v12 Reference

## What is this file?

This document provides a general overview of the OnShape API v12 that is used in this project for reference and understanding of the document structure and capabilities.

## API Base Information

- **Base URL**: `https://cad.onshape.com/api/v12`
- **Authentication**: OAuth 2.0 with PKCE flow
- **Required Scopes**: `OAuth2Read`, `OAuth2ReadPII`
- **Response Format**: JSON
- **Rate Limiting**: API requests are rate-limited (configurable in export operations)

## Document Structure Overview

### Document Hierarchy

OnShape organizes content in a hierarchical structure:

```
Document
├── Workspaces (branches/versions of the document)
│   ├── Elements (individual components within the document)
│   │   ├── Parts (individual parts within Part Studios)
│   │   ├── Assemblies (collections of parts and sub-assemblies)
│   │   ├── Drawings (2D technical drawings)
│   │   └── Other element types (Blobs, Bill of Materials, etc.)
│   └── Metadata (properties, tags, notes)
└── Versions/Branches (version control for the document)
```

### Document Types

Documents can contain various element types:

1. **PARTSTUDIO** - 3D modeling environment for creating parts
2. **ASSEMBLY** - Environment for assembling parts and sub-assemblies
3. **DRAWING** - 2D technical drawings and documentation
4. **BLOB** - Imported files (CAD files, images, etc.)
5. **BILLOFMATERIALS** - Structured lists of parts and quantities
6. **APPLICATION** - Custom applications and features

## Key API Endpoints Used

### Authentication & User

- `GET /users/sessioninfo` - Get current user information
- OAuth flow endpoints (handled by OnShape OAuth service)

### Documents

- `GET /documents` - List user's documents (with filtering, sorting, pagination)
- `GET /documents/{documentId}` - Get detailed document information
- `GET /documents/d/{documentId}/w/{workspaceId}/elements` - Get elements within a document workspace

### Elements & Parts

- `GET /documents/d/{documentId}/w/{workspaceId}/e/{elementId}/parts` - Get parts from an element
- `GET /documents/d/{documentId}/w/{workspaceId}/e/{elementId}/assemblies` - Get assemblies from an element
- `GET /documents/d/{documentId}/w/{workspaceId}/e/{elementId}/parts/{partId}/massProperties` - Get part mass properties

### Metadata & Properties

- `GET /metadata/d/{documentId}` - Get document metadata
- `GET /metadata/d/{documentId}/w/{workspaceId}/e/{elementId}` - Get element metadata

### Thumbnails

- `GET /thumbnails/d/{documentId}/w/{workspaceId}/s/{size}` - Get document thumbnails
- Multiple size options: 70x40, 300x300, 600x340

## Document Data Structure

### Core Document Properties

```json
{
  "id": "document_identifier",
  "name": "Document Name",
  "owner": { "id": "user_id", "name": "Owner Name", "type": 0 },
  "createdBy": { "id": "user_id", "name": "Creator Name" },
  "createdAt": "2024-09-16T15:59:08.000Z",
  "modifiedAt": "2025-06-02T15:59:08.000Z",
  "isPublic": false,
  "permission": "WRITE",
  "notes": "Document notes",
  "tags": ["tag1", "tag2"],
  "documentLabels": ["label1", "label2"],
  "defaultWorkspace": { "id": "workspace_id", "name": "Main" },
  "workspaces": [...]
}
```

### Element Structure

```json
{
  "id": "element_identifier",
  "name": "Element Name",
  "type": "Part Studio",
  "elementType": "PARTSTUDIO",
  "dataType": "onshape/partstudio",
  "lengthUnits": "millimeter",
  "angleUnits": "degree",
  "massUnits": "pound",
  "microversionId": "version_identifier"
}
```

### Thumbnail Structure

```json
{
  "thumbnail": {
    "sizes": [
      {
        "size": "300x300",
        "href": "https://cad.onshape.com/api/thumbnails/d/{docId}/w/{workspaceId}/s/300x300?t={timestamp}",
        "mediaType": "image/png"
      }
    ]
  }
}
```

## Units and Measurements

OnShape supports various unit systems:

### Length Units

- millimeter, centimeter, meter, inch, foot, yard

### Angle Units

- degree, radian

### Mass Units

- kilogram, gram, pound, ounce

### Other Units

- Time: second, minute, hour
- Force: newton, poundForce
- Pressure: pascal, poundPerSquareInch
- Energy: joule, footPoundForce
- Volume: cubicMeter, cubicMillimeter, cubicInch

## API Features Used in Project

### Implemented Features

1. **Document Listing** - Browse user's documents with search and filtering
2. **Document Details** - View comprehensive document information
3. **Element Browsing** - Explore parts, assemblies, and other elements
4. **Thumbnail Display** - Show document thumbnails via secure proxy
5. **Metadata Access** - View document and element metadata
6. **Mass Properties** - Access part mass properties and calculations
7. **Export Operations** - Bulk export with progress tracking
8. **Parent/Hierarchy** - Navigate document relationships

### Export Capabilities

- **Formats**: JSON, ZIP archives
- **Scope**: All documents or selected documents
- **Includes**: Elements, parts, assemblies, metadata, thumbnails
- **Progress Tracking**: Real-time export progress and logging
- **Rate Limiting**: Configurable API request timing

## Error Handling

The API client implements comprehensive error handling:

- **Authentication Errors** - Redirect to login on token expiration
- **Rate Limiting** - Respect API rate limits with configurable delays
- **Network Errors** - Graceful degradation and user feedback
- **Permission Errors** - Handle insufficient permissions gracefully
- **Data Validation** - Validate API responses before processing

## Version Compatibility

This project targets OnShape API **v12**, which includes:

- Enhanced metadata support
- Improved thumbnail handling
- Extended element type support
- Better error responses
- Performance optimizations

## Security Considerations

1. **OAuth 2.0 PKCE Flow** - Secure authentication without client secrets
2. **Token Management** - Secure storage and refresh of access tokens
3. **CORS Protection** - Configured for secure cross-origin requests
4. **Proxy Endpoints** - Secure thumbnail loading via backend proxy
5. **Input Validation** - All API inputs validated and sanitized

## Rate Limiting Guidelines

- **Default Rate**: ~10 requests per second (configurable)
- **Bulk Operations**: Use progressive delays for large exports
- **Thumbnail Loading**: Cached and rate-limited via proxy
- **Error Handling**: Exponential backoff on rate limit errors

## Future API Considerations

Potential enhancements for future versions:

- WebSocket support for real-time updates
- Enhanced search capabilities
- Additional metadata fields
- Improved thumbnail resolutions
- Extended element type support
