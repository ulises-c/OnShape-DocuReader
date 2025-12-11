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

  async getVersions(documentId) {
    return this.api.getDocumentVersions(documentId);
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
   * Supports hybrid two-request approach: if assemblies are provided,
   * prepares them first then starts stream with exportId (skips scan).
   * @param {Object} options - Export options and callbacks
   * @param {Object} options.scope - Optional scope for partial export
   * @param {string} options.prefixFilter - Optional prefix to filter root folders
   * @param {Array} options.assemblies - Pre-scanned assemblies (skips scan phase)
   * @param {Object} options.formats - Format selection { json: boolean, csv: boolean }
   * @param {Object} options.rowFilters - Row filter options { prtAsmOnly: boolean }
   * @returns {function} Cleanup function to cancel export
   */
  async startAggregateBomExport(options) {
    const { assemblies, scope, prefixFilter, ...streamOptions } = options;
    
    try {
      let exportId = null;
      
      // If assemblies provided, prepare them first (skip scan phase)
      if (assemblies?.length) {
        console.log(`[DocumentService] Preparing ${assemblies.length} pre-scanned assemblies`);
        const prepared = await this.api.prepareAssembliesForExport({
          assemblies,
          scope,
          prefixFilter
        });
        exportId = prepared.exportId;
        console.log(`[DocumentService] Prepared export: ${exportId}`);
      }
      
      // Start SSE stream (with or without exportId)
      return this.api.startAggregateBomStream({
        ...streamOptions,
        scope,
        prefixFilter,
        exportId  // Will skip scan if provided
      });
    } catch (error) {
      console.error('[DocumentService] Error starting aggregate BOM export:', error);
      if (options.onError) options.onError(error);
      return () => {}; // Return no-op cleanup
    }
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

  /**
   * Get Bill of Materials for an assembly element.
   * @param {string} documentId - Document ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} elementId - Element ID (assembly)
   * @param {boolean} flatten - If true, returns flattened BOM (indented=false)
   * @param {boolean} includeThumbnails - If true, includes thumbnail URLs in response
   * @returns {Promise<Object>} BOM data with headers and rows
   */
  async getBillOfMaterials(documentId, workspaceId, elementId, flatten = true, includeThumbnails = false) {
    // Parameters aligned with Python bom_to_csv.py script for complete BOM retrieval
    const params = {
      indented: String(!flatten), // false for flattened, true for structured
      generateIfAbsent: "false",
      onlyVisibleColumns: "false",  // Include all columns, not just visible ones
      ignoreSubassemblyBomBehavior: "false",  // Respect subassembly BOM behavior settings
      includeItemMicroversions: "true",  // Include microversion info for each item
      includeTopLevelAssemblyRow: "false",  // Don't include the top-level assembly as a row
    };
    
    // Add thumbnail parameter to get pre-generated thumbnail URLs
    // This adds thumbnailInfo.sizes[].href to each row's itemSource
    if (includeThumbnails) {
      params.thumbnail = "true";
    }

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
