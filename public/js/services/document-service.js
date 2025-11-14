/**
 * DocumentService - document-related operations
 */

export class DocumentService {
  constructor(api) {
    this.api = api;
  }

  async getAll(limit = 20, offset = 0) {
    return this.api.getDocuments(limit, offset);
  }

  async getById(documentId) {
    return this.api.getDocument(documentId);
  }

  async getElements(documentId, workspaceId) {
    return this.api.getElements(documentId, workspaceId);
  }

  async getParts(documentId, workspaceId, elementId) {
    return this.api.getParts(documentId, workspaceId, elementId);
  }

  async getAssemblies(documentId, workspaceId, elementId) {
    return this.api.getAssemblies(documentId, workspaceId, elementId);
  }

  async getElementMetadata(documentId, workspaceId, elementId) {
    return this.api.getElementMetadata(documentId, workspaceId, elementId);
  }

  async getParentInfo(documentId) {
    return this.api.getParentInfo(documentId);
  }

  async getPartMassProperties(documentId, workspaceId, elementId, partId) {
    return this.api.getPartMassProperties(
      documentId,
      workspaceId,
      elementId,
      partId
    );
  }

  async getBillOfMaterials(documentId, workspaceId, elementId, flatten = true) {
    const params = {
      indented: String(!flatten), // false for flattened, true for structured
      generateIfAbsent: "false",
    };

    return this.api.getBillOfMaterials(
      documentId,
      workspaceId,
      elementId,
      params
    );
  }

  async getComprehensiveDocument(documentId, params) {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(
      `/api/documents/${documentId}/comprehensive?${queryString}`
    );
    if (!res.ok)
      throw new Error(`Get comprehensive document failed (${res.status})`);
    return res.json();
  }
}
