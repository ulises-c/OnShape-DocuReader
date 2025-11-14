/**
 * DocumentController - orchestrates document flows
 */

import { DocumentListView } from "../views/document-list-view.js";
import { DocumentDetailView } from "../views/document-detail-view.js";
import { ElementDetailView } from "../views/element-detail-view.js";
import { PartDetailView } from "../views/part-detail-view.js";
import { formatDateWithUser } from "../utils/format-helpers.js";
import { copyToClipboard } from "../utils/clipboard.js";
import { escapeHtml } from "../utils/dom-helpers.js";
import { ROUTES, pathTo } from "../router/routes.js";

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
      totalPages: 0
    };
    // Track whether more documents are available server-side for "Fetch more" UX
    this.hasMore = true;
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
    const targetPage = restoredState?.viewSnapshot?.pagination?.currentPage || 
                      restoredState?.pagination?.currentPage ||
                      this.pagination.currentPage;
    const targetPageSize = restoredState?.viewSnapshot?.pagination?.pageSize ||
                          restoredState?.pagination?.pageSize ||
                          this.pagination.pageSize;

    // Load documents if not present or if page/size changed
    const needsLoad = !docs.length || 
                     targetPage !== this.pagination.currentPage ||
                     targetPageSize !== this.pagination.pageSize;

    if (needsLoad) {
      await this.loadDocuments(targetPage, targetPageSize);
    } else {
      // Re-render with current pagination state
      this.listView.render(docs, pagination || this.pagination);
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
        offset
      });

      const result = await this.documentService.getAll(pageSize, offset);

      const items = Array.isArray(result?.items)
        ? result.items
        : (Array.isArray(result) ? result : []);

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
        hasMoreAssumed: items.length === pageSize
      });

      this.hasMore = items.length === pageSize;

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
      console.log("[DocumentController.loadDocuments] pagination computed", this.pagination);
      console.log("[DocumentController.loadDocuments] render count", transformed.length);

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

  async fetchMore() {
    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";

    try {
      const pageSize = this.pagination.pageSize;
      const nextPage = this.pagination.currentPage + 1;
      const offset = (nextPage - 1) * pageSize;

      const result = await this.documentService.getAll(pageSize, offset);
      const newItems = Array.isArray(result?.items) ? result.items : [];

      this.hasMore = newItems.length === pageSize;

      // Merge documents into a deduped array keyed by id
      const prevDocs = Array.isArray(this.state.getState().documents)
        ? this.state.getState().documents
        : [];
      const mergedDocsMap = new Map(prevDocs.map((d) => [d.id, d]));
      for (const d of newItems) {
        mergedDocsMap.set(d.id, { ...d, creator: d.createdBy || d.owner });
      }
      const mergedDocs = Array.from(mergedDocsMap.values());

      // Merge folder groups: update existing folder entries or add new ones
      const prevGroups = Array.isArray(this.state.getState().folderGroups)
        ? this.state.getState().folderGroups
        : [];
      const groupMap = new Map(
        prevGroups.map((g) => [
          String(g.folder?.id || "root"),
          { ...g, documents: [...(g.documents || [])], folder: g.folder, groupModifiedAt: g.groupModifiedAt || null },
        ])
      );

      const incomingGroups = Array.isArray(result?.groups) ? result.groups : [];
      for (const g of incomingGroups) {
        const fid = String(g.folder?.id || "root");
        const existing = groupMap.get(fid) || {
          folder: g.folder,
          documents: [],
          groupModifiedAt: null,
        };

        const docMap = new Map(existing.documents.map((doc) => [doc.id, doc]));
        for (const doc of g.documents || []) {
          const updated = { ...doc, creator: doc.createdBy || doc.owner };
          docMap.set(updated.id, updated);
        }
        // Maintain reverse-chronological order by modifiedAt within each folder
        const docsSorted = Array.from(docMap.values()).sort((a, b) => {
          const am = new Date(a.modifiedAt || a.modified_at || 0).getTime();
          const bm = new Date(b.modifiedAt || b.modified_at || 0).getTime();
          return bm - am;
        });

        groupMap.set(fid, {
          folder: existing.folder || g.folder,
          documents: docsSorted,
          groupModifiedAt: docsSorted.length
            ? docsSorted[0].modifiedAt || docsSorted[0].modified_at || null
            : null,
        });
      }

      // Sort groups with Root first, then by latest activity
      const groups = Array.from(groupMap.values()).sort((a, b) => {
        if (a.folder?.id === "root") return -1;
        if (b.folder?.id === "root") return 1;
        const am = new Date(a.groupModifiedAt || 0).getTime();
        const bm = new Date(b.groupModifiedAt || 0).getTime();
        return bm - am;
      });

      // Build hierarchical tree from updated groups
      const folderTree = this._buildFolderTreeFromGroups(groups);

      // Advance pagination counters with a safe total estimation
      this.pagination.currentPage = nextPage;

      const prevTotal = this.pagination.totalCount || 0;
      const inferredTotal = mergedDocs.length + (this.hasMore ? 1 : 0);
      const newTotal =
        typeof result?.totalCount === "number"
          ? result.totalCount
          : inferredTotal;

      this.pagination.totalCount = Math.max(prevTotal, newTotal);
      this.pagination.totalPages = Math.max(
        1,
        Math.ceil(this.pagination.totalCount / pageSize)
      );

      this.state.setState({
        documents: mergedDocs,
        folderGroups: groups,
        folderTree,
        pagination: this.pagination,
      });

      if (loadingEl) loadingEl.style.display = "none";
      if (this.listView.renderHierarchicalList) {
        this.listView.renderHierarchicalList(folderTree, this.pagination);
      } else {
        this.listView.renderFolderGrid(folderTree, this.pagination);
      }
    } catch (error) {
      console.error("fetchMore failed:", error);
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.textContent =
          "Failed to fetch more documents: " + error.message;
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

  /**
   * Build folder tree locally from groups when service did not provide one.
   * Uses folder.parentId if available, otherwise attaches to root.
   */
  _buildFolderTreeFromGroups(groups) {
    const nodesById = new Map();
    for (const g of groups) {
      nodesById.set(String(g.folder.id), {
        folder: g.folder,
        documents: Array.isArray(g.documents) ? g.documents.slice() : [],
        groupModifiedAt: g.groupModifiedAt || null,
        children: [],
      });
    }
    if (!nodesById.has("root")) {
      nodesById.set("root", {
        folder: { id: "root", name: "Root", description: null, owner: null, modifiedAt: null, parentId: null },
        documents: [],
        groupModifiedAt: null,
        children: [],
      });
    }
    for (const [id, node] of nodesById.entries()) {
      if (id === "root") continue;
      const parentId = node.folder?.parentId || null;
      const parentNode =
        (parentId && nodesById.get(String(parentId))) || nodesById.get("root");
      parentNode.children.push(node);
    }
    for (const [_id, node] of nodesById.entries()) {
      if (Array.isArray(node.children) && node.children.length) {
        node.children.sort((a, b) => {
          const am = new Date(a.groupModifiedAt || 0).getTime();
          const bm = new Date(b.groupModifiedAt || 0).getTime();
          return bm - am;
        });
      }
    }
    return nodesById.get("root");
  }
}
