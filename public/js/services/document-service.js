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

  async getAggregateBom(delayMs = 100) {
    return this.api.getAggregateBom(delayMs);
  }

  /**
   * Get workspace directory statistics for pre-export preview.
   * @param {number} delayMs - Delay between API calls in ms
   * @param {Object} scope - Optional scope for partial export
   * @param {Object} filterOptions - Optional filter options (e.g., { prefixFilter: "600" })
   * @returns {Promise<Object>} Directory stats with folder/document/element counts
   */
  async getDirectoryStats(delayMs = 100, scope = null, filterOptions = null) {
    return this.api.getDirectoryStats(delayMs, scope, filterOptions);
  }

  /**
   * Start aggregate BOM export with progress streaming.
   * @param {Object} options - Export options and callbacks
   * @param {Object} options.scope - Optional scope for partial export
   * @param {string} options.prefixFilter - Optional prefix to filter root folders
   * @param {Object} options.formats - Format selection { json: boolean, csv: boolean }
   * @param {Object} options.rowFilters - Row filter options { prtAsmOnly: boolean }
   * @returns {function} Cleanup function to cancel export
   */
  startAggregateBomExport(options) {
    return this.api.startAggregateBomStream(options);
  }

  async getGlobalTreeRootNodes(limit, offset) {
    return this.api.getGlobalTreeNodes(limit, offset);
  }

  async getGlobalTreeFolderContents(folderId, limit, offset) {
    return this.api.getFolderContents(folderId, limit, offset);
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
