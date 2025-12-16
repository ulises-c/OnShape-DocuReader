/**
 * DocumentController - orchestrates document flows
 */

import { DocumentListView } from "../views/document-list-view.js";
import { DocumentDetailView } from "../views/document-detail-view.js";
import { ElementDetailView } from "../views/element-detail-view.js";
import { PartDetailView } from "../views/part-detail-view.js";
import { WorkspaceView } from "../views/workspace-view.js";
import { formatDateWithUser } from "../utils/format-helpers.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { escapeHtml } from "../utils/dom-helpers.js";
import { ROUTES, pathTo } from "../router/routes.js";
import { exportStatsModal } from "../views/export-stats-modal.js";
import { exportProgressModal } from "../views/export-progress-modal.js";
import { exportFilterModal } from "../views/export-filter-modal.js";
import { aggregateBomToCSV } from "../utils/aggregateBomToCSV.js";
import { showToast } from "../utils/toast-notification.js";
import { downloadJson, downloadCsv } from "../utils/file-download.js";

export class DocumentController {
  constructor(
    state,
    services,
    navigation,
    thumbnailService,
    router,
    historyState
  ) {
    this.state = state;
    this.documentService = services.documentService;
    this.navigation = navigation;
    this.router = router || null;
    this.historyState = historyState || null;

    this.listView = new DocumentListView("#documentsGrid", this);
    this.workspaceView = new WorkspaceView("#workspaceContainer", this);
    this.detailView = new DocumentDetailView(
      "#documentInfo",
      this,
      thumbnailService
    );
    this.elementView = new ElementDetailView("#elementInfo", this);
    this.partView = new PartDetailView();
    // Whitelist of element types that are known to support the metadata endpoint
    // Values match Onshape elementType strings (e.g. PARTSTUDIO, ASSEMBLY)
    this._metadataWhitelist = new Set(["PARTSTUDIO", "ASSEMBLY", "BLOB"]);

    // Pagination state
    this.pagination = {
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    };

    // Workspace state
    this.workspaceState = {
      currentFolderId: null,
      breadcrumbs: [], // Array of {id, name}
    };

    this._bindDashboardEvents();

    // Subscribe to state changes for export selection
    this.state.subscribe((state) => this._updateExportButtonState(state));
  }

  _bindDashboardEvents() {
    // We can bind directly because the elements are static in index.html
    // Even if called before app init, the DOM nodes exist.
    const header = document.getElementById("recentSectionHeader");
    if (header) {
      header.addEventListener("click", () => {
        const section = document.getElementById("recentSection");
        if (section) {
          section.classList.toggle("collapsed");
        }
      });
    }

    // Aggregate BOM export button
    const getAllBtn = document.getElementById("getAllBtn");
    if (getAllBtn) {
      getAllBtn.addEventListener("click", () => {
        this.exportAggregateBom();
      });
    }

    // Workspace section header click to refresh workspace
    const workspaceHeader = document.querySelector(".section-workspace .section-header");
    if (workspaceHeader) {
      workspaceHeader.style.cursor = "pointer";
      workspaceHeader.addEventListener("click", () => {
        this.refreshDashboard();
      });
    }
  }

  /**
   * Refresh the entire dashboard: reload workspace root and recent documents
   */
  async refreshDashboard() {
    console.log("[DocumentController] Refreshing dashboard...");
    
    // Reset workspace state
    this.workspaceState = {
      currentFolderId: null,
      breadcrumbs: [],
    };
    
    // Reload workspace root and documents in parallel
    await Promise.all([
      this.loadWorkspaceRoot(),
      this.loadDocuments(1, this.pagination.pageSize)
    ]);
    
    console.log("[DocumentController] Dashboard refreshed");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Navigation Methods
  // ─────────────────────────────────────────────────────────────────────────────

  navigateToDocument(documentId) {
    try {
      const listSnap = this._captureViewState(this.listView, "documentList");
      if (this.router) {
        const path = pathTo(ROUTES.DOCUMENT_DETAIL, { id: documentId });
        this.router.navigate(path, listSnap);
        return;
      }
    } catch (e) {
      console.warn(
        "navigateToDocument: failed to capture state for navigation",
        e
      );
    }
    this.viewDocument(documentId);
  }

  async showDocument(documentId, restoredState) {
    await this.viewDocument(documentId);
    this._restoreViewState(this.detailView, restoredState);
  }

  async showList(restoredState) {
    this.navigation.navigateTo("dashboard");

    const currentState = this.state.getState();
    const docs = currentState.documents || [];
    const pagination = currentState.pagination || null;

    // Check if we need to restore a specific page
    const targetPage =
      restoredState?.viewSnapshot?.pagination?.currentPage ||
      restoredState?.pagination?.currentPage ||
      this.pagination.currentPage;
    const targetPageSize =
      restoredState?.viewSnapshot?.pagination?.pageSize ||
      restoredState?.pagination?.pageSize ||
      this.pagination.pageSize;

    // Load documents if not present or if page/size changed
    const needsLoad =
      !docs.length ||
      targetPage !== this.pagination.currentPage ||
      targetPageSize !== this.pagination.pageSize;

    if (needsLoad) {
      await this.loadDocuments(targetPage, targetPageSize);
    } else {
      // Re-render with current pagination state
      this.listView.render(docs, pagination || this.pagination);
    }

    // Initialize workspace (loads root folder)
    await this._initializeWorkspace(restoredState);

    // Restore state after render completes
    this._restoreViewStateDeferred(this.listView, restoredState);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Workspace Methods
  // ─────────────────────────────────────────────────────────────────────────────

  async _initializeWorkspace(restoredState) {
    const restoredWorkspace =
      restoredState?.viewSnapshot?.workspace || restoredState?.workspace;
    
    if (restoredWorkspace?.currentFolderId) {
      this.workspaceState.breadcrumbs = restoredWorkspace.breadcrumbs || [];
      await this.loadFolder(restoredWorkspace.currentFolderId, false);
    } else if (!this.workspaceState.currentFolderId) {
      await this.loadWorkspaceRoot();
    } else {
      await this.loadFolder(this.workspaceState.currentFolderId, false);
    }
  }

  async loadWorkspaceRoot() {
    this.workspaceView.showLoading();
    try {
      this.workspaceState.currentFolderId = null;
      this.workspaceState.breadcrumbs = [];
      const result = await this.documentService.getGlobalTreeRootNodes();
      const items = result.items || [];
      // Extract workspace/company name from the result if available
      // pathToRoot typically contains the company/team name at the root level
      let workspaceName = null;
      if (result.pathToRoot && Array.isArray(result.pathToRoot) && result.pathToRoot.length > 0) {
        // The root of pathToRoot is typically the company/team name
        workspaceName = result.pathToRoot[0].name;
      } else if (result.name) {
        workspaceName = result.name;
      }
      
      // If no workspace name found from pathToRoot, try to get it from user's company info
      if (!workspaceName) {
        const user = this.state.getState()?.user;
        if (user?.companyName) {
          workspaceName = user.companyName;
        }
      }
      
      console.log('[DocumentController] Workspace name:', workspaceName, 'from result:', result);
      this.workspaceView.render(items, this.workspaceState.breadcrumbs, workspaceName);
    } catch (error) {
      console.error("Error loading workspace root:", error);
      this.workspaceView.showError("Failed to load workspace");
    }
  }

  async loadFolder(folderId, updateBreadcrumbs = true, folderName = null) {
    this.workspaceView.showLoading();
    try {
      const result = await this.documentService.getGlobalTreeFolderContents(
        folderId
      );
      const items = result.items || [];

      if (updateBreadcrumbs && folderName) {
        this.workspaceState.breadcrumbs.push({
          id: folderId,
          name: folderName,
        });
      }

      this.workspaceState.currentFolderId = folderId;
      this.workspaceView.render(items, this.workspaceState.breadcrumbs);
    } catch (error) {
      console.error(`Error loading folder ${folderId}:`, error);
      this.workspaceView.showError("Failed to load folder contents");
    }
  }

  navigateToFolder(folderId, folderName) {
    this.loadFolder(folderId, true, folderName);
  }

  navigateToRootFolder() {
    this.loadWorkspaceRoot();
  }

  navigateToFolderBreadcrumb(folderId) {
    // Find index of folder in breadcrumbs
    const index = this.workspaceState.breadcrumbs.findIndex(
      (b) => b.id === folderId
    );
    if (index !== -1) {
      // Slice breadcrumbs up to that index (inclusive)
      this.workspaceState.breadcrumbs = this.workspaceState.breadcrumbs.slice(
        0,
        index + 1
      );
      this.loadFolder(folderId, false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Document Loading & Pagination
  // ─────────────────────────────────────────────────────────────────────────────

  async loadDocuments(page = 1, pageSize = this.pagination.pageSize) {
    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error");
    const gridEl = document.getElementById("documentsGrid");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";
    if (gridEl) gridEl.innerHTML = "";

    try {
      const offset = (page - 1) * pageSize;

      // Diagnostics for pagination flow
      console.log("[DocumentController.loadDocuments] input", {
        page,
        pageSize,
        offset,
      });

      const result = await this.documentService.getAll(pageSize, offset);

      const items = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result)
        ? result
        : [];

      // If backend does not provide a reliable totalCount, compute a heuristic total so that Next can stay enabled
      const totalCount = this._computeTotalCount(result, items, offset, pageSize);

      // More diagnostics
      console.log("[DocumentController.loadDocuments] api result", {
        itemsLength: items.length,
        totalCount,
        hasMoreAssumed: items.length === pageSize,
      });

      const transformed = items.map((d) => ({
        ...d,
        creator: d.createdBy || d.owner,
      }));

      this.pagination = {
        currentPage: page,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      };

      // Diagnostics for computed pagination state
      console.log(
        "[DocumentController.loadDocuments] pagination computed",
        this.pagination
      );
      console.log(
        "[DocumentController.loadDocuments] render count",
        transformed.length
      );

      this.state.setState({
        documents: transformed,
        pagination: this.pagination,
      });

      if (loadingEl) loadingEl.style.display = "none";
      this.listView.render(transformed, this.pagination);
    } catch (error) {
      console.error("Error loading documents:", error);
      if (loadingEl) loadingEl.style.display = "none";
      this._showError(`Failed to load documents: ${error.message}`);
    }
  }

  _computeTotalCount(result, items, offset, pageSize) {
    if (typeof result?.totalCount === "number" && result.totalCount >= 0) {
      return result.totalCount;
    }
    const hasMore = items.length === pageSize;
    return offset + items.length + (hasMore ? 1 : 0);
  }

  async changePage(page) {
    const newPage = parseInt(page, 10);
    if (isNaN(newPage) || newPage < 1 || newPage > this.pagination.totalPages) {
      console.warn(`Invalid page number: ${page}`);
      return;
    }
    await this.loadDocuments(newPage, this.pagination.pageSize);
  }

  async changePageSize(newSize) {
    const size = parseInt(newSize, 10);
    if (isNaN(size) || size < 1) {
      console.warn(`Invalid page size: ${newSize}`);
      return;
    }
    await this.loadDocuments(1, size);
  }

  onSelectionChanged(documentIds) {
    const docs = this.state.getState().documents;
    const selected = docs.filter((d) => documentIds.includes(d.id));
    this.state.setState({ selectedDocuments: selected });
  }

  async search(query) {
    if (!query) {
      return this.listView.render(this.state.getState().documents);
    }
    const docs = this.state.getState().documents;
    const filtered = docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        (doc.creator?.name || "").toLowerCase().includes(query.toLowerCase())
    );
    this.listView.render(filtered);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Document Detail View Methods
  // ─────────────────────────────────────────────────────────────────────────────

  async viewDocument(documentId) {
    console.log("viewDocument called with documentId:", documentId);
    try {
      const doc = await this.documentService.getById(documentId);
      let elements = [];
      if (doc.defaultWorkspace?.id) {
        try {
          elements = await this.documentService.getElements(
            documentId,
            doc.defaultWorkspace.id
          );
        } catch (e) {
          console.warn("Could not load document elements:", e);
        }
      }
      this.state.setState({
        currentDocument: doc,
        currentElement: null,
        currentPart: null,
      });
      const title = document.getElementById("documentTitle");
      if (title) title.textContent = doc.name;

      this.detailView.render(doc, elements);
      this.navigation.navigateTo("documentDetail");

      this._bindElementClickHandler(doc);
    } catch (e) {
      console.error("Error viewing document:", e);
      this._showError(`Failed to load document details: ${e.message}`);
    }
  }

  _bindElementClickHandler(doc) {
    const container = document.getElementById("documentElements");
    container?.addEventListener(
      "click",
      (e) => {
        const elNode = e.target.closest(".element-item");
        if (!elNode) return;
        const elementId = elNode.getAttribute("data-element-id");
        if (elementId) {
          console.log("Element clicked:", elementId);
          if (this.router) {
            const snap = this._captureViewState(this.detailView, "documentDetail");
            const path = pathTo(ROUTES.ELEMENT_DETAIL, {
              docId: doc.id,
              elementId,
            });
            this.router.navigate(path, snap);
          } else {
            this.viewElement(elementId);
          }
        }
      },
      { once: true }
    );
  }

  async loadHierarchy(documentId) {
    const containerId = `parent-hierarchy-${documentId}`;
    const hierarchyEl = document.getElementById(containerId);
    if (!hierarchyEl) return;
    hierarchyEl.innerHTML =
      '<div style="color:#666; font-style:italic;">Loading parent hierarchy...</div>';

    try {
      const info = await this.documentService.getParentInfo(documentId);
      const html = this._renderHierarchyHtml(info);
      this.detailView.updateHierarchy(documentId, html);
    } catch (e) {
      console.error("Error loading parent hierarchy:", e);
      this.detailView.updateHierarchy(
        documentId,
        '<div style="color:#e74c3c;">Failed to load parent hierarchy</div>'
      );
    }
  }

  _renderHierarchyHtml(info) {
    if (!info?.items?.length) {
      return '<div style="color:#666;">No parent hierarchy available</div>';
    }
    
    let html = '<div style="margin-bottom: 0.5rem;"><strong>Document Hierarchy:</strong></div>';
    info.items.forEach((item, index) => {
      const indent = "&nbsp;".repeat(index * 4);
      html += `<div style="font-family: monospace; font-size: 0.9rem; margin: 0.25rem 0;">
        ${indent}${index > 0 ? "↳ " : ""}${escapeHtml(item.name || item.id)}
        <span style="color: #666; font-size: 0.8rem;">(${
          item.resourceType || "unknown"
        })</span>
      </div>`;
    });
    return html;
  }

  async copyElementJson(element) {
    try {
      const doc = this.state.getState().currentDocument;
      let enriched = { ...element };
      // For certain element types (e.g. BILLOFMATERIALS) the Onshape metadata
      // endpoint returns 400/404 because metadata isn't supported. Avoid calling
      // the metadata endpoint for those types and copy the element as-is.
      const elementType =
        (element && (element.elementType || element.type)) || "";
      const shouldFetchMetadata = this._metadataWhitelist.has(
        String(elementType).toUpperCase()
      );
      if (doc?.defaultWorkspace?.id && shouldFetchMetadata) {
        try {
          const metadata = await this.documentService.getElementMetadata(
            doc.id,
            doc.defaultWorkspace.id,
            element.id
          );
          enriched.metadata = metadata;
        } catch (e) {
          console.warn("Could not fetch metadata for element:", e);
        }
      } else {
        // Ensure metadata key exists for consistency
        enriched.metadata = enriched.metadata || {};
      }
      await copyToClipboard(JSON.stringify(enriched, null, 2));
    } catch (e) {
      console.error("Failed to copy element JSON:", e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Element Detail View Methods
  // ─────────────────────────────────────────────────────────────────────────────

  async viewElement(elementId) {
    const doc = this.state.getState().currentDocument;
    if (!doc?.defaultWorkspace?.id) {
      this._showError("No document or workspace available");
      return;
    }

    try {
      const elements = await this.documentService.getElements(
        doc.id,
        doc.defaultWorkspace.id
      );
      const currentElement = elements.find((el) => el.id === elementId);
      if (!currentElement) {
        this._showError("Element not found");
        return;
      }

      await this._loadElementDetails(doc, currentElement, elementId);

      this.state.setState({ currentElement, currentPart: null });
      const title = document.getElementById("elementTitle");
      if (title) title.textContent = currentElement.name;

      this.elementView.render(currentElement);
      this.navigation.navigateTo("elementDetail");
    } catch (e) {
      console.error("Error viewing element:", e);
      this._showError(`Failed to load element details: ${e.message}`);
    }
  }

  async _loadElementDetails(doc, currentElement, elementId) {
    const shouldFetchMetadataForView = this._metadataWhitelist.has(
      String(currentElement.elementType || currentElement.type).toUpperCase()
    );
    const [parts, assemblies, metadata] = await Promise.allSettled([
      this.documentService.getParts(
        doc.id,
        doc.defaultWorkspace.id,
        elementId
      ),
      this.documentService.getAssemblies(
        doc.id,
        doc.defaultWorkspace.id,
        elementId
      ),
      // Only fetch metadata when the element type is in the whitelist
      shouldFetchMetadataForView
        ? this.documentService.getElementMetadata(
            doc.id,
            doc.defaultWorkspace.id,
            elementId
          )
        : Promise.resolve({}),
    ]);

    currentElement.parts = parts.status === "fulfilled" ? parts.value : [];
    currentElement.assemblies =
      assemblies.status === "fulfilled" ? assemblies.value : [];
    currentElement.metadata =
      metadata.status === "fulfilled" ? metadata.value : {};
  }

  async showElement(params, restoredState) {
    const docId = params?.docId;
    const elementId = params?.elementId;
    if (!docId || !elementId) return;

    const st = this.state.getState();
    if (!st.currentDocument || st.currentDocument.id !== docId) {
      await this.viewDocument(docId);
    }

    await this.viewElement(elementId);
    this._restoreViewState(this.elementView, restoredState);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Part Detail View Methods
  // ─────────────────────────────────────────────────────────────────────────────

  async viewPart(partId) {
    const st = this.state.getState();
    const doc = st.currentDocument;
    const el = st.currentElement;
    if (!doc || !el) {
      this._showError("No document or element available");
      return;
    }

    try {
      const part = el.parts.find((p) => p.partId === partId);
      if (!part) {
        this._showError("Part not found");
        return;
      }

      const massProps = await this.documentService.getPartMassProperties(
        doc.id,
        doc.defaultWorkspace.id,
        el.id,
        partId
      );
      part.massProperties = massProps;

      this.state.setState({ currentPart: part });

      if (this.router) {
        const snap = this._captureViewState(this.elementView, "elementDetail");
        const path = pathTo(ROUTES.PART_DETAIL, {
          docId: doc.id,
          elementId: el.id,
          partId,
        });
        this.router.navigate(path, snap);
      } else {
        this.navigation.navigateTo("partDetail");
      }

      this.partView.render(part);
    } catch (e) {
      console.error("Error viewing part:", e);
      this._showError(`Failed to load part details: ${e.message}`);
    }
  }

  async showPart(params, restoredState) {
    const docId = params?.docId;
    const elementId = params?.elementId;
    const partId = params?.partId;
    if (!docId || !elementId || !partId) return;

    const st = this.state.getState();
    if (!st.currentDocument || st.currentDocument.id !== docId) {
      await this.viewDocument(docId);
    }

    const st2 = this.state.getState();
    if (!st2.currentElement || st2.currentElement.id !== elementId) {
      await this.viewElement(elementId);
    }

    await this.viewPart(partId);
    this._restoreViewState(this.partView, restoredState);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Comprehensive Document Export
  // ─────────────────────────────────────────────────────────────────────────────

  async getComprehensiveDocument() {
    console.log("Get Document button clicked");
    const doc = this.state.getState().currentDocument;
    if (!doc) {
      this._showError("No document selected");
      return;
    }

    const button = document.getElementById("getDocumentBtn");
    const originalText = button?.textContent;
    if (button) {
      button.textContent = "⏳ Processing...";
      button.disabled = true;
    }

    try {
      const data = await this.documentService.getComprehensiveDocument(doc.id, {
        includeBasicInfo: "true",
        includeElements: "true",
        includeParts: "true",
        includeAssemblies: "true",
        includeMetadata: "true",
      });

      const filename = `${doc.name.replace(/[^a-z0-9]/gi, "_")}_comprehensive.json`;
      downloadJson(data, filename);

      showToast(`Successfully downloaded comprehensive data for "${doc.name}"`);
    } catch (e) {
      console.error("Error getting comprehensive document:", e);
      this._showError(`Failed to get comprehensive document data: ${e.message}`);
    } finally {
      if (button) {
        button.textContent = originalText || "📦 Get Document";
        button.disabled = false;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Export Selection State
  // ─────────────────────────────────────────────────────────────────────────────

  // Update export button text based on selection state
  _updateExportButtonState(state) {
    const btn = document.getElementById("getAllBtn");
    if (!btn) return;

    const selectionCount = this.state.getExportSelectionCount();

    if (selectionCount > 0) {
      btn.textContent = `Export Selected (${selectionCount})`;
      btn.classList.add("has-selection");
    } else {
      btn.textContent = "Get All";
      btn.classList.remove("has-selection");
    }
  }

  // Handle document selection for export
  handleDocumentExportSelect(documentId) {
    this.state.toggleDocumentSelection(documentId);
  }

  // Handle folder selection for export
  handleFolderExportSelect(folderId) {
    this.state.toggleFolderSelection(folderId);
  }

  // Clear export selection
  clearExportSelection() {
    this.state.clearExportSelection();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Aggregate BOM Export
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Export aggregate BOM from all folders and documents.
   * Shows filter modal, then pre-scan stats modal before starting full export.
   * Supports partial export with selection
   */
  async exportAggregateBom() {
    const btn = document.getElementById("getAllBtn");
    const originalText = btn?.textContent || "Get All";

    // Get export scope based on selection
    const scope = this.state.getExportScope();
    const isPartial = scope !== null;

    // If not a partial export, show filter modal first
    let filterOptions = null;
    if (!isPartial) {
      filterOptions = await exportFilterModal.prompt();

      // User cancelled the filter modal
      if (filterOptions === null) {
        console.log("[DocumentController] Export cancelled at filter stage");
        return;
      }
    }

    try {
      // Show loading state
      exportStatsModal.showLoading();

      console.log(
        isPartial
          ? `[DocumentController] Starting partial pre-scan: ${
              scope.documentIds?.length || 0
            } docs, ${scope.folderIds?.length || 0} folders`
          : `[DocumentController] Starting full pre-scan${
              filterOptions?.prefixFilter
                ? ` with prefix filter: "${filterOptions.prefixFilter}"`
                : ""
            }...`
      );

      // Fetch directory stats (pre-scan) with scope and filter
      const stats = await this.documentService.getDirectoryStats(
        100,
        scope,
        filterOptions
      );

      console.log("[DocumentController] Pre-scan complete:", stats.summary);

      // Show stats modal with confirm/cancel
      exportStatsModal.show(stats, {
        isPartial,
        selectionCount: this.state.getExportSelectionCount(),
        prefixFilter: filterOptions?.prefixFilter,
        onConfirm: () =>
          this._startAggregateBomExport(
            stats,
            btn,
            originalText,
            scope,
            filterOptions
          ),
        onCancel: () => {
          console.log("[DocumentController] Export cancelled by user");
        },
      });
    } catch (error) {
      console.error("[DocumentController] Pre-scan failed:", error);
      exportStatsModal.showError(error.message || "Failed to scan workspace");
    }
  }

  /**
   * Start the full aggregate BOM export after user confirms in pre-scan modal.
   * Uses SSE streaming for real-time progress updates.
   * @param {Object} stats - Pre-scan stats (for reference)
   * @param {HTMLElement} btn - The export button element
   * @param {string} originalText - Original button text to restore
   * @param {Object} scope - Export scope (null for full, object for partial)
   * @param {Object} filterOptions - Filter options including prefixFilter
   */
  async _startAggregateBomExport(
    stats,
    btn,
    originalText,
    scope = null,
    filterOptions = null
  ) {
    const workers = 4; // Could make this configurable in UI
    const delay = 100;
    const isPartial = scope?.scope === "partial";

    console.log(
      `[DocumentController] Starting ${isPartial ? "partial" : "full"} export: ` +
      `${stats.estimates?.assembliesFound || 0} assemblies, ${workers} workers, ${delay}ms delay` +
      (filterOptions?.prefixFilter ? `, filter="${filterOptions.prefixFilter}"` : "")
    );

    // Show progress modal and start export
    exportProgressModal.show({
      stats,
      workers,
      delay,

      // Start export function - called by modal
      startExport: (options) => {
        return this.documentService.startAggregateBomExport({
          ...options,
          scope,
          prefixFilter: filterOptions?.prefixFilter,
          assemblies: stats.assemblies,  // Pass pre-scanned assemblies (hybrid approach)
        });
      },

      // Handle completion
      onComplete: (result) => {
        this._handleExportComplete(result, btn, originalText, isPartial, filterOptions);
      },

      // Handle cancellation
      onCancel: () => {
        this._restoreExportButton(btn, originalText);
        showToast("Export cancelled");
      },

      // Handle error
      onError: (error) => {
        this._restoreExportButton(btn, originalText);
        showToast(`❌ Export failed: ${error.message}`);
      },
    });
  }

  _handleExportComplete(result, btn, originalText, isPartial, filterOptions) {
    // Restore button state
    this._restoreExportButton(btn, originalText);

    // Clear selection after successful partial export
    if (isPartial) {
      this.state.clearExportSelection();
    }

    // Clear checkpoint on successful completion
    exportStatsModal.clearCheckpointOnSuccess();

    // Download result based on format selection
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const scopeLabel = isPartial
      ? "partial"
      : filterOptions?.prefixFilter
      ? `filtered-${filterOptions.prefixFilter}`
      : "full";

    // Get format preferences (default to both JSON and CSV for full exports, JSON only for partial)
    const formats = filterOptions?.formats || (isPartial ? { json: true, csv: false } : { json: true, csv: true });
    const rowFilters = filterOptions?.rowFilters || {};

    const downloadedFormats = this._downloadExportResults(result, scopeLabel, timestamp, formats, rowFilters);

    // Build success message
    const rowFilterNote = rowFilters.prtAsmOnly ? " (PRT/ASM filtered)" : "";
    const formatText = downloadedFormats.length > 0 ? ` as ${downloadedFormats.join(" + ")}` : "";

    // Show success toast
    showToast(
      `✅ Exported ${
        result.summary?.assembliesSucceeded || 0
      } assemblies from ${result.summary?.documentsScanned || 0} documents${formatText}${rowFilterNote}`
    );
  }

  _downloadExportResults(result, scopeLabel, timestamp, formats, rowFilters) {
    const downloadedFormats = [];

    // Download JSON if selected
    if (formats.json) {
      const jsonFilename = `aggregate-bom-${scopeLabel}-${timestamp}.json`;
      downloadJson(result, jsonFilename);
      downloadedFormats.push("JSON");
    }

    // Download CSV if selected
    if (formats.csv) {
      const csv = aggregateBomToCSV(result, {
        filterPrtAsm: rowFilters.prtAsmOnly || false,
      });

      if (csv) {
        const csvFilename = `aggregate-bom-${scopeLabel}-${timestamp}.csv`;
        downloadCsv(csv, csvFilename);
        downloadedFormats.push("CSV");
      } else {
        console.warn('[DocumentController] CSV conversion returned empty result');
      }
    }

    return downloadedFormats;
  }

  _restoreExportButton(btn, originalText) {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────────

  _showError(message) {
    const err = document.getElementById("error");
    if (err) {
      err.textContent = message;
      err.style.display = "block";
    }
  }

  _captureViewState(view, viewType) {
    return (typeof view?.captureState === "function" && view.captureState()) ||
      (this.historyState?.captureState?.(viewType) ?? null);
  }

  _restoreViewState(view, restoredState) {
    if (restoredState && typeof view?.restoreState === "function") {
      view.restoreState(restoredState.viewSnapshot || restoredState);
    }
  }

  _restoreViewStateDeferred(view, restoredState) {
    if (!restoredState || typeof view?.restoreState !== "function") return;
    
    const restore = () => view.restoreState(restoredState.viewSnapshot || restoredState);
    
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(restore);
    } else {
      setTimeout(restore, 0);
    }
  }
}
