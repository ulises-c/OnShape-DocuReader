# Onshape REST API Reference

This document consolidates the technical reference for the Onshape REST API, optimized for concise consumption by LLMs and Agents.

## I. Core Concepts & Architecture

### API Access
| Environment | Base URL Pattern |
| :--- | :--- |
| Standard | `https://cad.onshape.com/api/v{version}/...` |
| Enterprise | `https://{companyName}.onshape.com/api/v{version}/...` |
| API Explorer | `https://cad.onshape.com/glassworks/explorer/` |

### Onshape Data Model & Identifiers
Onshape is a version-controlled, fileless platform. All data resides in Documents and Elements (tabs).

| ID Type | Description | Length | Persistence | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Document ID** (`did`) | Unique identifier for a Document. | 24 char | Permanent | - |
| **Element ID** (`eid`) | Unique identifier for a specific tab (Part Studio, Assembly, Drawing, etc.). | 24 char | Permanent | - |
| **Workspace ID** (`wid`) | Identifies a mutable branch (Workspace). | 24 char | Permanent | Used in `POST` requests. |
| **Version ID** (`vid`) | Identifies an immutable named snapshot (Version). | 24 char | Permanent | Used in `GET` requests (`v/{vid}`). |
| **Microversion ID** (`mid`) | Identifies an immutable internal revision (Commit). | 24 char | Permanent | Used in `GET` requests (`m/{mid}`). |
| **Part ID** (`pid`) | Geometric entity identifier. | Variable | Transient | Short-lived. Use Associativity API for persistence. |
| **WVM Context** | Path component indicating context type: `w` (Workspace), `v` (Version), or `m` (Microversion). | 1 char | - | Required in many endpoints: `/{wvm}/{wvmid}`. |

**Key Constraint:** `POST` and `DELETE` operations are restricted to **Workspaces** (`w/{wid}`).

### API Conventions
*   **Methods:** Primarily `GET` (Read), `POST` (Write/Update/Create), and `DELETE`.
*   **Versioning:** API versions (`v{version}`) are included in the path (`/api/v10/...`). Clients should target the latest documented version.
*   **Units:** Length units: `meter`, `inch`, `mm`, etc. Angular units: `degree`, `radian`, `deg`, `rad`.
*   **API Response Codes:** `200 OK`, `204 No Content`, `307 Temporary Redirect`. Client errors include `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (permission denied), `404 Not Found`, `409 Conflict`, and `429 Too Many Requests`.

## II. Authentication & Limits

### A. Authentication Methods

| Method | Use Case | Header Format | Security | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **OAuth2** | App Store / Delegated Access (Required) | `Authorization: Bearer {token}` | Highest | Tokens expire; requires refresh token flow (POST to `/oauth/token`). |
| **Basic Auth** | Internal Scripts / Testing | `Authorization: Basic {base64(ACCESS_KEY:SECRET_KEY)}` | Lowest | Convenient for local use; exposes secret key. |
| **Request Signature** | Internal Scripts / Production | `Authorization: On {ACCESS_KEY}:HmacSHA256:{SIGNATURE}` | Medium | Signature generated via HMAC-SHA256 of request data (Method, Nonce, Date, Path, Query String, Secret Key). |

### B. Rate & Annual Limits

*   **Rate Limits:** Enforced per endpoint. Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header indicating delay in seconds.
*   **Annual Call Limits (Examples):**
    *   Enterprise: 10,000 / Full User
    *   Professional: 5,000 / User
*   **Exclusions:** Calls from public App Store apps and Onshape Webhooks generally **do not** count toward annual limits.

## III. Document & Core Utility APIs (V10)

### A. Document Management (`/documents`)

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `createDocument` | `POST` | `/documents` | `(body: { name: string, ... }) => BTDocumentInfo` | |
| `getDocument` | `GET` | `/documents/{did}` | `() => BTDocumentInfo` | |
| `updateDocumentAttributes` | `POST` | `/documents/{did}` | `(body: { name?: string, description?: string, ... }) => BTDocumentInfo` | |
| `getElementsInDocument` | `GET` | `/documents/d/{did}/{wvm}/{wvmid}/elements` | `() => BTElementInfo[]` | Lists all tabs/elements. |
| `createVersion` | `POST` | `/documents/d/{did}/versions` | `(body: { documentId: string, name: string, workspaceId: string }) => BTVersionInfo` | Creates a named snapshot of the current workspace. |
| `deleteDocument` | `DELETE`| `/documents/{did}` | `(params: { forever?: boolean }) => 204 No Content` | |

### B. Metadata Management (`/metadata`)

Metadata updates require specifying the `propertyId` for the field being modified.

**Update Request Body Type:**
```typescript
type BTMetadataUpdate = {
  properties: Array<{
    value: string | number | boolean;
    propertyId: string;
  }>;
  jsonType?: "metadata-element" | "metadata-part"; 
  partId?: string; // Required for part metadata updates
}
```

| Endpoint | Method | Path | Context |
| :--- | :--- | :--- | :--- |
| `getWMVEMetadata` | `GET` | `/metadata/d/{did}/{wvm}/{wvmid}/e/{eid}` | Element (Tab) |
| `updateWVEMetadata` | `POST` | `/metadata/d/{did}/w/{wid}/e/{eid}` | Element (Tab) |
| `getWMVEPMetadata` | `GET` | `/metadata/d/{did}/{wvm}/{wvmid}/e/{eid}/p/{pid}` | Part |
| `updateWVEPMetadata` | `POST` | `/metadata/d/{did}/w/{wid}/e/{eid}/p/{pid}` | Part |
| `updateVEOPStandardContentPartMetadata`| `POST` | `/metadata/standardcontent/d/{did}` | Standard Content (Global/Company) |

### C. Release Management (V10)

| Endpoint | Method | Path | Signature (Input/Output) |
| :--- | :--- | :--- | :--- |
| `updateNextNumbers` | `POST` | `/partnumber/nextnumbers` | `(params: { cid?: string, did?: string }, body: { itemPartNumbers: BTItemPartNumberInfo[] }) => BTNextPartNumberResponse` |
| `getLatestInDocumentOrCompany` | `GET` | `/revisions/{cd}/{cdid}/p/{pnum}/latest` | `(params: { et: number }) => BTRevisionInfo` |
| `getRevisionHistoryInCompanyByPartNumber` | `GET` | `/revisions/companies/{cid}/partnumber/{pnum}` | `(params: { elementType: number }) => BTRevisionInfo[]` |

## IV. CAD Modeling & Geometry APIs (V9)

### A. Part Studios (`/partstudios`)

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `createPartStudio` | `POST` | `/partstudios/d/{did}/w/{wid}` | `(body: { name: string }) => BTElementInfo` | |
| `getPartStudioBodyDetails` | `GET` | `/partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/bodydetails`| `() => BTBodyDetailsResponse` | Topological info (faces, edges). |
| `getPartStudioMassProperties` | `GET` | `/partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/massproperties`| `() => BTMassPropertiesInfo` | |
| `updateRollback` | `POST` | `/partstudios/d/{did}/w/{wid}/e/{eid}/features/rollback` | `(body: { rollbackIndex: number }) => BTUpdateFeaturesResponse` | Moves the Feature List rollback bar. |

### B. Feature Access & FeatureScript

Features are defined by structured JSON using internal types (e.g., `BTMSketch-151`, `BTMFeature-134`).

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `getPartStudioFeatures` | `GET` | `/partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/features` | `() => BTFeatureListResponse` | Retrieves the entire Feature List structure. |
| `addPartStudioFeature` | `POST` | `/partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/features` | `(body: BTFeatureDefinitionCall) => BTFeatureDefinitionResponse` | |
| `updatePartStudioFeature` | `POST` | `/partstudios/d/{did}/w/{wid}/e/{eid}/features/featureid/{fid}` | `(body: BTFeatureDefinitionCall) => BTFeatureDefinitionResponse` | |
| `evalFeatureScript` | `POST` | `/partstudios/d/{did}/w/{wid}/e/{eid}/featurescript` | `(body: { script: string, ... }) => BTFeatureScriptEvalResponse` | Executes lambda FeatureScript expressions. |

### C. Assemblies (`/assemblies`)

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `createAssembly` | `POST` | `/assemblies/d/{did}/w/{wid}` | `(body: { name: string }) => BTElementInfo` | |
| `getAssemblyDefinition` | `GET` | `/assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}` | `() => BTAssemblyDefinitionInfo` | Returns component instances and mate features. |
| `createInstance` | `POST` | `/assemblies/d/{targetDid}/w/{targetWid}/e/{targetEid}/instances` | `(body: { documentId: string, elementId: string, partId?: string, ... }) => BTAssemblyInstanceInfo` | Inserts an instance of a part, subassembly, etc. |
| `modify` | `POST` | `/assemblies/d/{did}/w/{wid}/e/{eid}/modify` | `(body: { deleteInstances?: string[], transformDefinitions?: BTTransformDefinition[], ... }) => BTAssemblyDefinitionInfo` | Bulk modification (transforms, suppression, deletion). |

### D. Configurations (V6)

Configuration settings are often passed via an encoded string.

| Endpoint | Method | Path | Notes |
| :--- | :--- | :--- | :--- |
| `getConfiguration` | `GET` | `/elements/d/{did}/wvm/{wvmid}/e/{eid}/configuration` | Get input parameters and options. |
| `encodeConfigurationMap` | `POST` | `/elements/d/{did}/e/{eid}/configurationencodings` | Converts `{parameters: [{parameterId, parameterValue}]}` to URL component (`queryParam`) and encoded ID (`encodedId`). |

### E. Associativity (ID Translation)

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `idtranslations` | `POST` | `/partstudios/d/{did}/w/{wid}/e/{eid}/idtranslations` | `(body: { sourceDocumentMicroversion: string, ids: string[] }) => BTIdTranslationResponse` | Maps transient geometric IDs from an old microversion to the current one. |

## V. Data Translation (Import & Export)

The Translation process (export/import) is often asynchronous, requiring polling or webhooks for status (`Translation/getTranslation`).

### A. Asynchronous Exports

| Endpoint Category | Method | Target Type | Endpoint Pattern | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Format Specific** | `POST` | PS, Assembly (V11) | `/{type}/d/.../e/{eid}/export/{format}` | Specific endpoints for glTF, OBJ, SOLIDWORKS, STEP (Faster, format-optimized). |
| **Generic Translation** | `POST` | PS, Assembly, Blob | `/{type}/d/.../e/{eid}/translations` | Generic translation. Requires `"formatName": string` in body (e.g., `"ACIS"`). |
| **Drawing Export** | `POST` | Drawing (V6) | `/drawings/d/.../e/{eid}/translations` | Exports to formats like `DRAWING_JSON`. |

**Retrieval after completion:**
1. Poll `Translation/getTranslation` on `translationId` until `requestState="DONE"`.
2. Retrieve file:
    *   If `storeInDocument=true`: Use `BlobElement/downloadFileWorkspace` on `resultElementIds`.
    *   If `storeInDocument=false` (External): Use `Documents/downloadExternalData` on `resultExternalDataIds`.

### B. Synchronous Exports (Fast, Limited Formats)

These endpoints return a `307 Temporary Redirect` to the file resource.

| Endpoint | Method | Path Pattern | Formats |
| :--- | :--- | :--- | :--- |
| `exportPartStudio...` | `GET` | `/partstudios/d/.../e/{eid}/{format}` | glTF, Parasolid, STL |
| `exportPart...` | `GET` | `/parts/d/.../e/{eid}/partid/{pid}/{format}` | glTF, Parasolid, STL |

### C. Imports

Imports convert external files into Onshape format (default) or specified formats, creating a Blob Element.

| Endpoint | Method | Path Pattern | Notes |
| :--- | :--- | :--- | :--- |
| `createTranslation` | `POST` | `/translations/d/{did}/w/{wid}` | `Content-Type: multipart/form-data`. Use `-F 'file=@/path/filename.ext'`. |
| `uploadFileCreateElement` | `POST` | `/blobelements/d/{did}/w/{wid}` | Upload file and create new blob element. |

## VI. Drawings API (V6)

Drawings modifications are asynchronous and structured via nested JSON commands inside `modifyDrawing`.

| Endpoint | Method | Path | Signature (Input/Output) |
| :--- | :--- | :--- | :--- |
| `createDrawingAppElement` | `POST` | `/drawings/d/{did}/w/{wid}/create` | `(body: { drawingName: string, ... }) => BTElementInfo` |
| `modifyDrawing` | `POST` | `/drawings/d/{did}/w/{wid}/e/{eid}/modify` | `(body: { description: string, jsonRequests: BTDrawingRequest[] }) => BTModificationResponse` |
| `getModificationStatus` | `GET` | `/drawings/modify/status/{mrid}` | `() => BTModificationStatus` | Poll for modification completion (`requestState: "DONE"`). |

### Drawing Modification (`BTDrawingRequest` types)

The `jsonRequests` array contains specific operations, often targeting geometric entities via `BTReferencePoint`.

```typescript
type BTDrawingRequest = { 
  messageName: "onshapeCreateAnnotations" | "onshapeEditAnnotations" | "onshapeCreateViews" | "onshapeEditViews";
  formatVersion: "2021-01-01";
  annotations?: BTAnnotation[];
  views?: BTView[]; 
}
type BTReferencePoint = { 
  coordinate: [number, number, number];
  type: "Onshape::Reference::Point";
  snapPointType?: "ModeCenter" | "ModeEnd" | ...;
  uniqueId?: string; // geometric entity ID
  viewId?: string; // drawing view ID
}
```
**Supported Annotation Types (Examples):** `Onshape::Note`, `Onshape::Callout`, `Onshape::GeometricTolerance`, `Onshape::Centerline::PointToPoint`, `Onshape::Dimension::Radial`, `Onshape::InspectionSymbol`, `Onshape::Circle`, `Onshape::Line`, `Onshape::Table::GeneralTable`.

## VII. App Development & Extensibility

### A. Webhooks (`/webhooks`)

Webhooks send event notifications (HTTP POST with JSON body) to a registered URL.

| Endpoint | Method | Path | Signature (Input/Output) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `createWebhook` | `POST` | `/webhooks` | `(body: { events: string[], url: string, ... }) => BTWebhookInfo` | Requires `documentId` or `companyId` based on event group. Set `isTransient=false` to prevent cleanup. |
| `unregisterWebhook` | `DELETE`| `/webhooks/{webhookId}` | `() => 204 No Content` | Deregisters the webhook. |

**Key Event Types:**
*   **Document Group:** `onshape.model.lifecycle.changed`, `onshape.model.translation.complete`, `onshape.model.lifecycle.createversion`, `onshape.model.lifecycle.metadata`.
*   **Workflow Group:** `onshape.workflow.transition`.

### B. Structured Storage (App Elements)

Apps can store structured data in App Elements. JSON Tree storage enables robust merging and differencing.

**JSON Tree Edit Types (BTJEdit):**
Edits target nodes using a `BTJPath` object.

```typescript
// Path structure to a node in the JSON tree
type BTJPath = { 
  btType: "BTJPath-3073"; 
  startNode: string; // root node or nodeId
  path: Array<{ btType: "BTJPathKey-3221", key: string } | { btType: "BTJPathIndex-1871", index: number }>;
}

// Example operations
type BTJEditDelete = { btType: "BTJEditDelete-1992"; path: BTJPath; }
type BTJEditInsert = { btType: "BTJEditInsert-2523"; path: BTJPath; value: any; }
type BTJEditChange = { btType: "BTJEditChange-2636"; path: BTJPath; value: any; }
type BTJEditList = { btType: "BTJEditList-2707"; edits: BTJEdit[]; }
```

### C. Client Messaging

Used for inter-iframe communication between the Application Extension (AE) and the Onshape Client (OSC). Messages must validate origin URL against the original `server` query parameter.

**AE to OSC Messages (Examples):**
*   `applicationInit`: Required startup message.
*   `keepAlive`: Maintain session.
*   `openSelectItemDialog`: Request standard Onshape dialogs.

**OSC to AE Messages (Examples):**
*   `show`/`hide`: Element tab activated/deactivated.
*   `SELECTION`: Notifies selection changes (Element Right Panel context).
*   `saveChanges`: Request for app to persist edits before OSC commits a major action (e.g., saving a version).

### D. Billing

| Endpoint | Method | Path | Purpose |
| :--- | :--- | :--- | :--- |
| `getPurchases` | `GET` | `/accounts/purchases` | Check user entitlement/purchases. |
| `cancelRecurringPurchase`| `DELETE`| `/accounts/purchases/{pid}` | Cancel subscription. |
| `consumePurchase` | `POST` | `/accounts/purchases/{pid}/consume` | Indicate use of consumable unit (WIP). |
| `getPlansForClient` | `GET` | `/billing/plans/client/{cid}` | List client's defined billing plans. |

**In-App Purchase Flow:** Redirect user to `https://cad.onshape.com/billing/purchase?redirectUri=RRRR&clientId=CCCC&sku=SSSS&userId=UUUU`.
