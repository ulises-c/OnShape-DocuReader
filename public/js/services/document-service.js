/**
 * DocumentService - document-related operations
 */

export class DocumentService {
  constructor(api) {
    this.api = api;
  }

  async getAll() {
    return this.api.getDocuments();
  }

  async getById(documentId) {
    return this.api.getDocument(documentId);
  }

  async getElements(documentId, workspaceId) {
    return this.api.getDocumentElements(documentId, workspaceId);
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

  async getComprehensive(documentId, params) {
    return this.api.getComprehensiveDocument(documentId, params);
  }
}
