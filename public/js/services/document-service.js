/**
 * DocumentService - document-related operations
 */

export class DocumentService {
  constructor(api) {
    this.api = api;
  }

  async getAll(limit = 50, offset = 0) {
    return this.api.getDocuments(limit, offset);
  }

  async getById(documentId) {
    return this.api.getDocument(documentId);
  }

  async getVersions(documentId) {
    return this.api.getDocumentVersions(documentId);
  }

  async getBranches(documentId) {
    return this.api.getDocumentBranches(documentId);
  }

  async getCombinedHistory(documentId) {
    return this.api.getCombinedDocumentHistory(documentId);
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
   * Always includes thumbnail=true to get pre-generated thumbnail URLs (matches Python implementation).
   * 
   * @param {string} documentId - Document ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} elementId - Element ID (assembly)
   * @param {boolean} flatten - If true, returns flattened BOM (indented=false)
   * @param {boolean} includeThumbnails - DEPRECATED: Thumbnails are now always included
   * @returns {Promise<Object>} BOM data with headers, rows, and thumbnailInfo
   */
  async getBillOfMaterials(documentId, workspaceId, elementId, flatten = true, includeThumbnails = false) {
    // Parameters aligned with Python thumbnail_extractor.py for complete BOM retrieval
    // ALWAYS include thumbnail=true to get pre-generated URLs from OnShape (most reliable method)
    const params = {
      indented: "true",                         // Always true for multi-level hierarchy
      multiLevel: "true",                       // Include nested assemblies
      generateIfAbsent: "false",                // Don't auto-generate if missing
      includeExcluded: "false",                 // Don't include excluded items
      ignoreSubassemblyBomBehavior: "false",    // Respect subassembly BOM behavior
      includeItemMicroversions: "true",         // Include microversion for each item
      includeTopLevelAssemblyRow: "true",       // Include top-level assembly as row
      thumbnail: "true",                        // CRITICAL: Always request thumbnails
    };

    return this.api.getBillOfMaterials(
      documentId,
      workspaceId,
      elementId,
      params
    );
  }

  /**
   * Fetch thumbnail metadata to discover available sizes.
   * Used as fallback when direct thumbnail URL is unavailable.
   * 
   * @param {string} documentId - Document ID
   * @param {string} workspaceId - Workspace ID  
   * @param {string} elementId - Element ID
   * @param {string} [partId] - Optional part ID for part-specific thumbnail
   * @returns {Promise<Object>} Thumbnail metadata with available sizes
   */
  async getThumbnailMetadata(documentId, workspaceId, elementId, partId = null) {
    return this.api.getThumbnailMetadata(documentId, workspaceId, elementId, partId);
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
