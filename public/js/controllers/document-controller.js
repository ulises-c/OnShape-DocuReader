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

    // Phase 4.7: Subscribe to state changes for export selection
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
  }

  navigateToDocument(documentId) {
    try {
      const listSnap =
        (typeof this.listView?.captureState === "function" &&
          this.listView.captureState()) ||
        (this.historyState?.captureState?.("documentList") ?? null);

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
    if (restoredState && typeof this.detailView?.restoreState === "function") {
      this.detailView.restoreState(restoredState.viewSnapshot || restoredState);
    }
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
    // Check if we have restored workspace state
    const restoredWorkspace =
      restoredState?.viewSnapshot?.workspace || restoredState?.workspace;
    if (restoredWorkspace) {
      // Restore path if possible, for now just load what was last
      if (restoredWorkspace.currentFolderId) {
        this.workspaceState.breadcrumbs = restoredWorkspace.breadcrumbs || [];
        await this.loadFolder(restoredWorkspace.currentFolderId, false); // don't push breadcrumb
      } else {
        await this.loadWorkspaceRoot();
      }
    } else {
      // Default load root if no state
      if (!this.workspaceState.currentFolderId) {
        await this.loadWorkspaceRoot();
      } else {
        // Refresh current folder
        await this.loadFolder(this.workspaceState.currentFolderId, false);
      }
    }

    // Restore state after render completes
    if (restoredState && typeof this.listView?.restoreState === "function") {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() =>
          this.listView.restoreState(
            restoredState.viewSnapshot || restoredState
          )
        );
      } else {
        setTimeout(
          () =>
            this.listView.restoreState(
              restoredState.viewSnapshot || restoredState
            ),
          0
        );
      }
    }
  }

  async loadWorkspaceRoot() {
    this.workspaceView.showLoading();
    try {
      this.workspaceState.currentFolderId = null;
      this.workspaceState.breadcrumbs = [];
      const result = await this.documentService.getGlobalTreeRootNodes();
      const items = result.items || [];
      this.workspaceView.render(items, this.workspaceState.breadcrumbs);
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

      if (updateBreadcrumbs) {
        // If we're navigating down, add to breadcrumbs
        // Note: ideally the API returns path info. For now we push manual name if provided.
        // If not navigating down (e.g. refresh), we assume breadcrumbs are set.
        if (folderName) {
          this.workspaceState.breadcrumbs.push({
            id: folderId,
            name: folderName,
          });
        }
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
      let totalCount;
      if (typeof result?.totalCount === "number" && result.totalCount >= 0) {
        totalCount = result.totalCount;
      } else {
        const hasMore = items.length === pageSize;
        totalCount = offset + items.length + (hasMore ? 1 : 0);
      }

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
      if (errorEl) {
        errorEl.textContent = "Failed to load documents: " + error.message;
        errorEl.style.display = "block";
      }
    }
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

    const btn = document.getElementById("getSelectedBtn");
    if (btn) {
      btn.disabled = selected.length === 0;
      btn.textContent =
        selected.length > 0
          ? `📋 Get Selected (${selected.length})`
          : "📋 Get Selected";
    }
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
              const snap =
                (typeof this.detailView?.captureState === "function" &&
                  this.detailView.captureState()) ||
                (this.historyState?.captureState?.("documentDetail") ?? null);
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
    } catch (e) {
      console.error("Error viewing document:", e);
      const errEl = document.getElementById("error");
      if (errEl) {
        errEl.textContent = "Failed to load document details: " + e.message;
        errEl.style.display = "block";
      }
    }
  }

  async loadHierarchy(documentId) {
    const containerId = `parent-hierarchy-${documentId}`;
    const hierarchyEl = document.getElementById(containerId);
    if (!hierarchyEl) return;
    hierarchyEl.innerHTML =
      '<div style="color:#666; font-style:italic;">Loading parent hierarchy...</div>';

    try {
      const info = await this.documentService.getParentInfo(documentId);
      let html = "";
      if (info?.items?.length) {
        html =
          '<div style="margin-bottom: 0.5rem;"><strong>Document Hierarchy:</strong></div>';
        info.items.forEach((item, index) => {
          const indent = "&nbsp;".repeat(index * 4);
          html += `<div style="font-family: monospace; font-size: 0.9rem; margin: 0.25rem 0;">
            ${indent}${index > 0 ? "↳ " : ""}${escapeHtml(item.name || item.id)}
            <span style="color: #666; font-size: 0.8rem;">(${
              item.resourceType || "unknown"
            })</span>
          </div>`;
        });
      } else {
        html = '<div style="color:#666;">No parent hierarchy available</div>';
      }
      this.detailView.updateHierarchy(documentId, html);
    } catch (e) {
      console.error("Error loading parent hierarchy:", e);
      this.detailView.updateHierarchy(
        documentId,
        '<div style="color:#e74c3c;">Failed to load parent hierarchy</div>'
      );
    }
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

  async viewElement(elementId) {
    const doc = this.state.getState().currentDocument;
    if (!doc?.defaultWorkspace?.id) {
      const err = document.getElementById("error");
      if (err) {
        err.textContent = "No document or workspace available";
        err.style.display = "block";
      }
      return;
    }

    try {
      const elements = await this.documentService.getElements(
        doc.id,
        doc.defaultWorkspace.id
      );
      const currentElement = elements.find((el) => el.id === elementId);
      if (!currentElement) {
        const err = document.getElementById("error");
        if (err) {
          err.textContent = "Element not found";
          err.style.display = "block";
        }
        return;
      }

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

      this.state.setState({ currentElement, currentPart: null });
      const title = document.getElementById("elementTitle");
      if (title) title.textContent = currentElement.name;

      this.elementView.render(currentElement);
      this.navigation.navigateTo("elementDetail");
    } catch (e) {
      console.error("Error viewing element:", e);
      const err = document.getElementById("error");
      if (err) {
        err.textContent = "Failed to load element details: " + e.message;
        err.style.display = "block";
      }
    }
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

    if (restoredState && typeof this.elementView?.restoreState === "function") {
      this.elementView.restoreState(
        restoredState.viewSnapshot || restoredState
      );
    }
  }

  async viewPart(partId) {
    const st = this.state.getState();
    const doc = st.currentDocument;
    const el = st.currentElement;
    if (!doc || !el) {
      const err = document.getElementById("error");
      if (err) {
        err.textContent = "No document or element available";
        err.style.display = "block";
      }
      return;
    }

    try {
      const part = el.parts.find((p) => p.partId === partId);
      if (!part) {
        const err = document.getElementById("error");
        if (err) {
          err.textContent = "Part not found";
          err.style.display = "block";
        }
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
        const snap =
          (typeof this.elementView?.captureState === "function" &&
            this.elementView.captureState()) ||
          (this.historyState?.captureState?.("elementDetail") ?? null);
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
      const err = document.getElementById("error");
      if (err) {
        err.textContent = "Failed to load part details: " + e.message;
        err.style.display = "block";
      }
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

    if (restoredState && typeof this.partView?.restoreState === "function") {
      this.partView.restoreState(restoredState.viewSnapshot || restoredState);
    }
  }

  async getComprehensiveDocument() {
    console.log("Get Document button clicked");
    const doc = this.state.getState().currentDocument;
    if (!doc) {
      const err = document.getElementById("error");
      if (err) {
        err.textContent = "No document selected";
        err.style.display = "block";
      }
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

      const a = document.createElement("a");
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${doc.name.replace(/[^a-z0-9]/gi, "_")}_comprehensive.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this._toast(
        `Successfully downloaded comprehensive data for "${doc.name}"`
      );
    } catch (e) {
      console.error("Error getting comprehensive document:", e);
      const err = document.getElementById("error");
      if (err) {
        err.textContent =
          "Failed to get comprehensive document data: " + e.message;
        err.style.display = "block";
      }
    } finally {
      if (button) {
        button.textContent = originalText || "📦 Get Document";
        button.disabled = false;
      }
    }
  }

  /**
   * Phase 4.7: Update export button text based on selection state
   */
  _updateExportButtonState(state) {
    const btn = document.getElementById("getAllBtn");
    if (!btn) return;

    const selectionCount = this.state.getExportSelectionCount();

    if (selectionCount > 0) {
      btn.textContent = `📦 Export Selected (${selectionCount})`;
      btn.classList.add("has-selection");
    } else {
      btn.textContent = "📦 Get All";
      btn.classList.remove("has-selection");
    }
  }

  /**
   * Phase 4.7: Handle document selection for export
   */
  handleDocumentExportSelect(documentId) {
    this.state.toggleDocumentSelection(documentId);
  }

  /**
   * Phase 4.7: Handle folder selection for export
   */
  handleFolderExportSelect(folderId) {
    this.state.toggleFolderSelection(folderId);
  }

  /**
   * Phase 4.7: Clear export selection
   */
  clearExportSelection() {
    this.state.clearExportSelection();
  }

  /**
   * Export aggregate BOM from all folders and documents.
   * Shows pre-scan stats modal before starting full export (Phase 4.5).
   * Supports partial export with selection (Phase 4.7).
   */
  async exportAggregateBom() {
    const btn = document.getElementById("getAllBtn");
    const originalText = btn?.textContent || "📦 Get All";

    // Phase 4.7: Get export scope based on selection
    const scope = this.state.getExportScope();
    const isPartial = scope !== null;

    try {
      // Dynamically import the modal to avoid circular dependencies
      // const { exportStatsModal } = await import("../views/export-stats-modal.js");

      // Show loading state
      exportStatsModal.showLoading();

      console.log(
        isPartial
          ? `[DocumentController] Starting partial pre-scan: ${
              scope.documentIds?.length || 0
            } docs, ${scope.folderIds?.length || 0} folders`
          : "[DocumentController] Starting full pre-scan for aggregate BOM export..."
      );

      // Fetch directory stats (pre-scan) with scope
      const stats = await this.documentService.getDirectoryStats(100, scope);

      console.log("[DocumentController] Pre-scan complete:", stats.summary);

      // Show stats modal with confirm/cancel
      exportStatsModal.show(stats, {
        isPartial,
        selectionCount: this.state.getExportSelectionCount(),
        onConfirm: () =>
          this._startAggregateBomExport(stats, btn, originalText, scope),
        onCancel: () => {
          console.log("[DocumentController] Export cancelled by user");
        },
      });
    } catch (error) {
      console.error("[DocumentController] Pre-scan failed:", error);
      // Show error in modal
      try {
        // const { exportStatsModal } = await import("../views/export-stats-modal.js");
        exportStatsModal.showError(error.message || "Failed to scan workspace");
      } catch (importError) {
        // Fallback if modal import fails
        this._toast(`❌ Scan failed: ${error.message}`);
      }
    }
  }

  /**
   * Start the full aggregate BOM export after user confirms in pre-scan modal.
   * Uses SSE streaming for real-time progress updates (Phase 4.6).
   * @param {Object} stats - Pre-scan stats (for reference)
   * @param {HTMLElement} btn - The export button element
   * @param {string} originalText - Original button text to restore
   * @param {Object} scope - Export scope (null for full, object for partial) (Phase 4.7)
   */
  async _startAggregateBomExport(stats, btn, originalText, scope = null) {
    const workers = 4; // Could make this configurable in UI
    const delay = 100;
    const isPartial = scope?.scope === "partial";

    console.log(
      `[DocumentController] Starting ${
        isPartial ? "partial" : "full"
      } export of ${stats.estimates?.assembliesFound || 0} assemblies`
    );
    console.log(
      `[DocumentController] Config: workers=${workers}, delay=${delay}ms`
    );

    // Import progress modal dynamically
    // const { exportProgressModal } = await import("../views/export-progress-modal.js");

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
        });
      },

      // Handle completion
      onComplete: (result) => {
        // Restore button state
        if (btn) {
          btn.textContent = originalText;
          btn.disabled = false;
        }

        // Phase 4.7: Clear selection after successful partial export
        if (isPartial) {
          this.state.clearExportSelection();
        }

        // Download result as JSON
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19);
        const scopeLabel = isPartial ? "partial" : "full";
        const filename = `aggregate-bom-${scopeLabel}-${timestamp}.json`;
        this._downloadJson(result, filename);

        // Show success toast
        this._toast(
          `✅ Exported ${
            result.summary?.assembliesSucceeded || 0
          } assemblies from ${result.summary?.documentsScanned || 0} documents`
        );
      },

      // Handle cancellation
      onCancel: () => {
        // Restore button state
        if (btn) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
        this._toast("Export cancelled");
      },

      // Handle error
      onError: (error) => {
        // Restore button state
        if (btn) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
        this._toast(`❌ Export failed: ${error.message}`);
      },
    });
  }

  /**
   * Download data as JSON file.
   * @param {Object} data - Data to download
   * @param {string} filename - Filename for download
   */
  _downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  _toast(message) {
    const div = document.createElement("div");
    div.className = "success-message";
    div.textContent = message;
    div.style.cssText = `
      background-color:#d4edda;border:1px solid #c3e6cb;color:#155724;
      padding:12px 20px;border-radius:5px;margin:10px 0;position:fixed;top:20px;right:20px;z-index:1000;
      box-shadow:0 2px 10px rgba(0,0,0,0.1);animation:slideIn 0.3s ease-out;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}
