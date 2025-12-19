/**
 * DocumentDetailView - slim orchestration layer
 */

import { BaseView } from "./base-view.js";
import {
  renderDocumentInfo,
  renderThumbnailSection,
} from "./helpers/document-info-renderer.js";
import { renderElementsList } from "./helpers/element-list-renderer.js";
import { DocumentActions } from "./actions/document-actions.js";
import { ElementActions } from "./actions/element-actions.js";
import { showToast } from "../utils/toast-notification.js";
import { ROUTES } from "../router/routes.js";
import { escapeHtml } from "../utils/dom-helpers.js";

export class DocumentDetailView extends BaseView {
  constructor(containerSelector, controller, thumbnailService) {
    super(containerSelector);
    this.controller = controller;
    this.thumbnailService = thumbnailService;
    this._elementsMap = new Map();
    this.documentActions = new DocumentActions(controller);
    this.elementActions = new ElementActions(
      controller,
      controller.documentService
    );

    // Elements view tabs state (Document Detail right-side panel)
    this._elementsTab = "assembly";
  }

  render(docData, elements) {
    this.clear();
    this._currentDocData = docData;
    this._loadedHistory = null;
    this._selectedHistoryItem = null; // Track currently selected version/branch
    this._currentWorkspaceId = docData.defaultWorkspace?.id || null; // Track active workspace for element operations
    this._currentContextType = "w"; // Default to workspace context
    this._currentContextId = docData.defaultWorkspace?.id || null; // Track current context ID (workspace or version)

    const infoContainer = document.getElementById("documentInfo");
    if (infoContainer) {
      const topBarHtml = this._renderTopBar(docData);
      const thumbnailHtml = renderThumbnailSection(docData);
      const historyHtml = this._renderHistorySelector(docData);
      const infoHtml = renderDocumentInfo(docData);
      infoContainer.innerHTML =
        topBarHtml + thumbnailHtml + historyHtml + infoHtml;
      this._setupThumbnail(docData);
      this._bindHistorySelector(docData);
    }

    const elementsContainer = document.getElementById("documentElements");
    if (elementsContainer) {
      this._elementsMap.clear();
      if (elements?.length) {
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));
      }

      // Render Elements tabs + filtered list
      elementsContainer.innerHTML = this._renderElementsPanel(elements);

      // Bind tab UI
      this._bindElementsTabs(elementsContainer, elements);
    }

    this._bindDocumentActions(docData);
    this._bindElementActions(elementsContainer, docData);
    this._bindBackButton();
  }

  _renderTopBar(docData) {
    return ``;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Elements Tabs (Document Detail)
  // ─────────────────────────────────────────────────────────────────────────────

  _renderElementsPanel(elements) {
    const tabsHtml = this._renderElementsTabs();
    const filtered = this._filterElementsByTab(elements, this._elementsTab);

    // Note: avoid any inline styles here so layout remains controlled by CSS and responds to breakpoints.
    return `
      <div class="tabs" data-elements-tabs>
        ${tabsHtml}
      </div>
      <div data-elements-tab-panel>
        ${renderElementsList(filtered)}
      </div>
    `;
  }

  _renderElementsTabs() {
    const tabs = [
      { id: "assembly", label: "Assembly" },
      { id: "billofmaterials", label: "Bill of Materials" },
      { id: "partstudio", label: "Part Studio" },
      { id: "blob", label: "Other" },
    ];

    return tabs
      .map((t) => {
        const active = t.id === this._elementsTab ? "active" : "";
        return `<button class="tab-btn ${active}" data-elements-tab="${
          t.id
        }">${escapeHtml(t.label)}</button>`;
      })
      .join("");
  }

  _bindElementsTabs(elementsContainer, elements) {
    const tabsRoot = elementsContainer.querySelector("[data-elements-tabs]");
    if (!tabsRoot) return;

    // Event delegation for tab switching
    tabsRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-elements-tab]");
      if (!btn) return;

      const nextTab = btn.getAttribute("data-elements-tab");
      if (!nextTab || nextTab === this._elementsTab) return;

      this._elementsTab = nextTab;

      // Update tab button active states
      const allBtns = Array.from(
        tabsRoot.querySelectorAll("[data-elements-tab]")
      );
      allBtns.forEach((b) => {
        if (b.getAttribute("data-elements-tab") === this._elementsTab) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });

      // Re-render the list only, keep the outer element container listeners intact
      const panel = elementsContainer.querySelector(
        "[data-elements-tab-panel]"
      );
      if (!panel) return;

      const filtered = this._filterElementsByTab(elements, this._elementsTab);
      panel.innerHTML = renderElementsList(filtered);

      // Ensure element map is in sync for click handlers
      this._elementsMap.clear();
      if (filtered?.length) {
        filtered.forEach((el) => this._elementsMap.set(String(el.id), el));
      }
    });
  }

  _filterElementsByTab(elements, tabId) {
    const list = Array.isArray(elements) ? elements : [];

    if (tabId === "assembly") {
      return list.filter((el) => this._isAssemblyElement(el));
    }

    if (tabId === "billofmaterials") {
      return list.filter((el) => this._isBillOfMaterialsElement(el));
    }

    if (tabId === "partstudio") {
      return list.filter((el) => this._isPartStudioElement(el));
    }

    // Other
    // NOTE: Currently does 2 checks, if it is a BLOB or not any of the main types, which is redundant.
    // It should be sufficient to have a list that pops when it's added to a main type, and this just displays the rest
    return list.filter(
      (el) =>
        this._isBlobElement(el) ||
        (!this._isAssemblyElement(el) &&
          !this._isBillOfMaterialsElement(el) &&
          !this._isPartStudioElement(el))
    );
  }

  _isAssemblyElement(el) {
    const t = String(el?.elementType || el?.type || "").toUpperCase();
    return t === "ASSEMBLY";
  }

  _isBillOfMaterialsElement(el) {
    const t = String(el?.elementType || el?.type || "").toUpperCase();
    return t === "BILLOFMATERIALS";
  }

  _isPartStudioElement(el) {
    const t = String(el?.elementType || el?.type || "").toUpperCase();
    return t === "PARTSTUDIO";
  }

  // Check for Blob/Other element types
  _isBlobElement(el) {
    const t = String(el?.elementType || el?.type || "").toUpperCase();
    return t === "BLOB";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Unified History Selector (Versions + Branches combined)
  // ─────────────────────────────────────────────────────────────────────────────

  _renderHistorySelector(docData) {
    return `
      <div class="history-selector-section" id="history-selector-${docData.id}">
        <div class="history-selector-header">
          <h4>Versions and History</h4>
          <button class="btn btn-secondary btn-sm load-history-btn" id="load-history-${docData.id}">
            Load History
          </button>
        </div>
        <div class="history-selector-content" id="history-content-${docData.id}">
          <p class="history-hint">Click "Load History" to see all versions and branches of this document.</p>
        </div>
      </div>
    `;
  }

  _bindHistorySelector(docData) {
    const loadBtn = document.getElementById(`load-history-${docData.id}`);
    if (loadBtn) {
      loadBtn.addEventListener("click", () =>
        this._handleLoadHistory(docData.id)
      );
    }
  }

  async _handleLoadHistory(documentId) {
    const loadBtn = document.getElementById(`load-history-${documentId}`);
    const contentEl = document.getElementById(`history-content-${documentId}`);

    if (!contentEl) return;

    // Show loading state
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "Loading...";
    }
    contentEl.innerHTML =
      '<p class="history-loading">Fetching versions and branches...</p>';

    try {
      const history = await this.controller.documentService.getCombinedHistory(
        documentId
      );
      this._loadedHistory = history;

      if (!history?.items || history.items.length === 0) {
        contentEl.innerHTML =
          '<p class="history-empty">No versions or branches found for this document.</p>';
        if (loadBtn) {
          loadBtn.textContent = "Reload History";
          loadBtn.disabled = false;
        }
        return;
      }

      // Render history dropdown and action buttons
      contentEl.innerHTML = this._renderHistoryDropdown(history, documentId);
      this._bindHistoryDropdown(documentId);

      if (loadBtn) {
        loadBtn.textContent = "Reload History";
        loadBtn.disabled = false;
      }
    } catch (error) {
      console.error("Error loading history:", error);
      contentEl.innerHTML = `<p class="history-error">Failed to load history: ${escapeHtml(
        error.message
      )}</p>`;
      if (loadBtn) {
        loadBtn.textContent = "Retry";
        loadBtn.disabled = false;
      }
    }
  }

  _renderHistoryDropdown(history, documentId) {
    // Build options with type badges (version vs branch)
    const optionsHtml = history.items
      .map((item, idx) => {
        const name = escapeHtml(item.name || "Unnamed");
        const dateStr = item.modifiedAt || item.createdAt;
        const date = dateStr ? new Date(dateStr).toLocaleDateString() : "";
        const time = dateStr
          ? new Date(dateStr).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const typeLabel = item.type === "branch" ? "🌿" : "📌";
        const mainBadge = item.isMainWorkspace ? " (Main)" : "";
        const modifier = item.modifier?.name || item.creator?.name || "";

        return `<option value="${idx}" data-item-id="${escapeHtml(
          item.id
        )}" data-item-type="${
          item.type
        }">${typeLabel} ${name}${mainBadge} - ${modifier} ${date} ${time}</option>`;
      })
      .join("");

    return `
      <div class="history-dropdown-container">
        <label for="history-select-${documentId}">Select Version or Branch:</label>
        <select id="history-select-${documentId}" class="history-select">
          <option value="" disabled selected>-- Choose from history --</option>
          ${optionsHtml}
        </select>
      </div>
      <div class="history-details" id="history-details-${documentId}">
        <p class="history-hint">Select an item to view details. Elements will reload for the selected workspace.</p>
      </div>
    `;
  }

  _bindHistoryDropdown(documentId) {
    const selectEl = document.getElementById(`history-select-${documentId}`);
    if (selectEl) {
      selectEl.addEventListener("change", async (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && this._loadedHistory?.items?.[idx]) {
          const item = this._loadedHistory.items[idx];
          this._selectedHistoryItem = item;
          this._displayHistoryDetails(documentId, item);

          console.log(
            `[DocumentDetailView] History selection changed: type=${item.type}, id=${item.id}, name=${item.name}`
          );

          // Update context and reload elements based on type
          if (item.type === "branch") {
            // Branch (workspace) selected - update workspace context
            this._currentWorkspaceId = item.id;
            this._currentContextType = "w";
            this._currentContextId = item.id;
            await this._reloadElementsForWorkspace(documentId, item.id, "w");
          } else {
            // Version selected - update version context
            // Keep the workspace ID for BOM operations (versions are read-only snapshots)
            this._currentContextType = "v";
            this._currentContextId = item.id;
            await this._reloadElementsForVersion(documentId, item.id);
          }
        }
      });
    }
  }

  _displayHistoryDetails(documentId, item) {
    const detailsEl = document.getElementById(`history-details-${documentId}`);
    if (!detailsEl) return;

    const name = escapeHtml(item.name || "Unnamed");
    const description = item.description
      ? escapeHtml(item.description)
      : "<em>No description</em>";
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : "Unknown";
    const modifiedAt = item.modifiedAt
      ? new Date(item.modifiedAt).toLocaleString()
      : createdAt;
    const creatorName = item.creator?.name
      ? escapeHtml(item.creator.name)
      : "Unknown";
    const modifierName = item.modifier?.name
      ? escapeHtml(item.modifier.name)
      : creatorName;
    const itemId = escapeHtml(item.id || "");
    const typeLabel = item.type === "branch" ? "Branch (Workspace)" : "Version";
    const typeBadgeClass =
      item.type === "branch" ? "history-type-branch" : "history-type-version";
    const mainBadge = item.isMainWorkspace
      ? '<span class="history-main-badge">Main</span>'
      : "";
    const microversionRow = item.microversion
      ? `<div class="history-detail-row">
          <span class="history-label">Microversion:</span>
          <span class="history-value">${escapeHtml(item.microversion)}</span>
        </div>`
      : "";

    // Show context note for workspace selection
    const contextNote =
      item.type === "branch"
        ? `<div class="history-context-note history-context-active">
          ✅ Elements and thumbnail now show content from this workspace. Element actions will use this context.
        </div>`
        : `<div class="history-context-note history-context-version">
          ℹ️ Version selected. Thumbnail updated. Element actions require workspace context; using default workspace for operations.
        </div>`;

    detailsEl.innerHTML = `
      <div class="history-detail-card">
        <h5>
          ${name} 
          <span class="history-type-badge ${typeBadgeClass}">${typeLabel}</span>
          ${mainBadge}
        </h5>
        <div class="history-detail-row">
          <span class="history-label">Description:</span>
          <span class="history-value">${description}</span>
        </div>
        <div class="history-detail-row">
          <span class="history-label">Modified:</span>
          <span class="history-value">${modifiedAt} by ${modifierName}</span>
        </div>
        <div class="history-detail-row">
          <span class="history-label">Created:</span>
          <span class="history-value">${createdAt} by ${creatorName}</span>
        </div>
        <div class="history-detail-row">
          <span class="history-label">${
            item.type === "branch" ? "Workspace" : "Version"
          } ID:</span>
          <span class="history-value history-id">${itemId}</span>
        </div>
        ${microversionRow}
        ${contextNote}
      </div>
    `;
  }

  /**
   * Reload elements list for a specific workspace (branch selection)
   * @param {string} documentId - Document ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} contextType - Context type ('w' for workspace)
   */
  async _reloadElementsForWorkspace(
    documentId,
    workspaceId,
    contextType = "w"
  ) {
    const elementsContainer = document.getElementById("documentElements");
    if (!elementsContainer) return;

    // Show loading state
    elementsContainer.innerHTML = `<div class="elements-loading">Loading elements for selected workspace...</div>`;

    try {
      const elements = await this.controller.documentService.getElements(
        documentId,
        workspaceId
      );

      // Update elements map
      this._elementsMap.clear();
      if (elements?.length) {
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));
      }

      // Re-render elements list (with tabs)
      elementsContainer.innerHTML = this._renderElementsPanel(elements);
      this._bindElementsTabs(elementsContainer, elements);

      // Re-bind element actions with new workspace context
      // Store context type and ID for element actions to use correct endpoints
      this._currentContextType = "w";
      this._currentContextId = workspaceId;
      this._bindElementActions(elementsContainer, this._currentDocData);

      // Reload thumbnail for the new workspace context
      this._reloadThumbnailForContext(documentId, workspaceId, contextType);

      showToast(`Loaded ${elements?.length || 0} elements from workspace`);
    } catch (error) {
      console.error("Error loading elements for workspace:", error);
      elementsContainer.innerHTML = `<div class="elements-error">Failed to load elements: ${escapeHtml(
        error.message
      )}</div>`;
    }
  }

  /**
   * Reload elements list for a specific version (version selection)
   * Note: Version context is read-only, some element actions may have limited functionality
   * @param {string} documentId - Document ID
   * @param {string} versionId - Version ID
   */
  async _reloadElementsForVersion(documentId, versionId) {
    const elementsContainer = document.getElementById("documentElements");
    if (!elementsContainer) return;

    // Show loading state
    elementsContainer.innerHTML = `<div class="elements-loading">Loading elements for selected version...</div>`;

    try {
      // Use version context for API call - need to use 'v' type endpoint
      // Note: We fetch elements via the version endpoint
      const response = await fetch(
        `/api/documents/${documentId}/versions/${versionId}/elements`
      );

      let elements = [];
      if (response.ok) {
        elements = await response.json();
      } else if (response.status === 404) {
        // Version elements endpoint may not exist; fall back to showing a message
        console.warn(
          `[DocumentDetailView] Version elements endpoint not available, using default workspace`
        );
        // Fall back to default workspace elements but note the version context
        const doc = this._currentDocData;
        if (doc?.defaultWorkspace?.id) {
          elements = await this.controller.documentService.getElements(
            documentId,
            doc.defaultWorkspace.id
          );
        }
      } else {
        throw new Error(`Failed to load elements (${response.status})`);
      }

      // Update elements map
      this._elementsMap.clear();
      if (elements?.length) {
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));
      }

      // Re-render elements list (with tabs)
      elementsContainer.innerHTML = this._renderElementsPanel(elements);
      this._bindElementsTabs(elementsContainer, elements);

      // Re-bind element actions
      // For versions, we store the version ID and context type so element actions can use version-specific endpoints
      this._currentContextType = "v";
      this._currentContextId = versionId;
      this._bindElementActions(elementsContainer, this._currentDocData);

      // Reload thumbnail for the version context
      this._reloadThumbnailForContext(documentId, versionId, "v");

      showToast(`Loaded ${elements?.length || 0} elements from version`);
    } catch (error) {
      console.error("Error loading elements for version:", error);
      elementsContainer.innerHTML = `<div class="elements-error">Failed to load elements: ${escapeHtml(
        error.message
      )}</div>`;
    }
  }

  /**
   * Reload thumbnail for a specific workspace or version context
   * @param {string} documentId - Document ID
   * @param {string} contextId - Workspace ID or Version ID
   * @param {string} contextType - 'w' for workspace, 'v' for version
   */
  _reloadThumbnailForContext(documentId, contextId, contextType) {
    // The thumbnail image element ID matches the pattern in document-info-renderer.js
    const thumbnailImg = document.getElementById(
      `document-thumbnail-img-${documentId}`
    );
    if (!thumbnailImg) {
      console.log(
        `[DocumentDetailView] No thumbnail element found for document ${documentId} (looking for document-thumbnail-img-${documentId})`
      );
      return;
    }

    // Build the OnShape thumbnail URL with the new context
    // OnShape thumbnail URL pattern: /api/thumbnails/d/{did}/{wvm}/{wvmid}/s/{size}
    const size = "300x300"; // Default size, matches preferred size in _setupThumbnail
    const thumbnailUrl = `https://cad.onshape.com/api/thumbnails/d/${documentId}/${contextType}/${contextId}/s/${size}`;

    // Add cache-busting parameter to force reload
    const cacheBuster = Date.now();
    const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
      thumbnailUrl
    )}&_cb=${cacheBuster}`;

    console.log(
      `[DocumentDetailView] Reloading thumbnail for ${
        contextType === "w" ? "workspace" : "version"
      }: ${contextId}`
    );
    console.log(`[DocumentDetailView] Thumbnail URL: ${thumbnailUrl}`);
    console.log(`[DocumentDetailView] Proxy URL: ${proxyUrl}`);

    // Show loading state
    thumbnailImg.style.opacity = "0.5";

    // Directly update the src to trigger reload (simpler approach that works better with proxy)
    thumbnailImg.onload = () => {
      thumbnailImg.style.opacity = "1";
      thumbnailImg.style.display = "block"; // Ensure visible after load
      console.log(
        `[DocumentDetailView] Thumbnail loaded successfully for ${contextType}/${contextId}`
      );

      // Hide placeholder if present
      const placeholder = document.getElementById(
        `thumbnail-placeholder-${documentId}`
      );
      if (placeholder) {
        placeholder.style.display = "none";
      }
    };
    thumbnailImg.onerror = (err) => {
      console.warn(
        `[DocumentDetailView] Failed to load thumbnail for ${contextType}/${contextId}:`,
        err
      );
      thumbnailImg.style.opacity = "1";
      // Keep the existing thumbnail on error
    };

    // Update src directly - the cache buster ensures fresh fetch
    thumbnailImg.src = proxyUrl;
  }

  _setupThumbnail(docData) {
    if (!docData.thumbnail?.sizes?.length) return;

    const preferred = ["300x300", "600x340", "300x170", "70x40"];
    let selected = null;
    for (const size of preferred) {
      selected = docData.thumbnail.sizes.find((s) => s.size === size);
      if (selected) break;
    }
    if (!selected && docData.thumbnail.sizes.length > 0) {
      selected = docData.thumbnail.sizes[0];
    }

    if (selected?.href) {
      const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
        selected.href
      )}`;
      setTimeout(
        () => this.thumbnailService.setup(docData.id, selected.href, proxyUrl),
        0
      );
    }
  }

  _bindDocumentActions(docData) {
    const getDocBtn = document.getElementById(`get-document-${docData.id}`);
    getDocBtn?.addEventListener("click", () =>
      this.documentActions.handleGetDocument(docData.id)
    );

    const getJsonBtn = document.getElementById(`get-json-${docData.id}`);
    getJsonBtn?.addEventListener("click", () =>
      this.documentActions.handleGetJson(docData)
    );

    const copyBtn = document.getElementById(`copy-json-${docData.id}`);
    copyBtn?.addEventListener("click", async () => {
      const success = await this.documentActions.handleCopyJson(docData);
      if (success && copyBtn) this._flashButton(copyBtn);
    });

    const hierarchyBtn = document.getElementById(
      `load-hierarchy-${docData.id}`
    );
    hierarchyBtn?.addEventListener("click", () =>
      this.documentActions.handleLoadHierarchy(docData.id, this.controller)
    );
  }

  _bindElementActions(elementsContainer, docData) {
    if (!elementsContainer) return;

    elementsContainer.addEventListener("click", async (e) => {
      const copyBtn = e.target.closest(".copy-element-json-btn");
      if (copyBtn) {
        const elementId = copyBtn.getAttribute("data-element-id");
        const el = this._elementsMap.get(String(elementId));
        if (el) {
          const success = await this.elementActions.handleCopyElementJson(
            el,
            this.controller
          );
          if (success) this._flashButton(copyBtn);
        }
        return;
      }

      const bomJsonBtn = e.target.closest(".fetch-bom-btn");
      if (bomJsonBtn) {
        await this._handleBomAction(bomJsonBtn, docData, "json");
        return;
      }

      const bomCsvBtn = e.target.closest(".download-bom-csv-btn");
      if (bomCsvBtn) {
        await this._handleBomAction(bomCsvBtn, docData, "csv");
        return;
      }

      // Full Extract button handler
      const fullExtractBtn = e.target.closest(".full-extract-btn");
      if (fullExtractBtn) {
        const elementId = fullExtractBtn.getAttribute("data-element-id");
        const el = this._elementsMap.get(String(elementId));
        if (el) {
          await this.elementActions.handleFullExtract(
            el,
            docData.id,
            docData.defaultWorkspace?.id,
            this.controller.documentService
          );
        }
      }
    });
  }

  async _handleBomAction(btn, docData, format) {
    const elementId = btn.getAttribute("data-element-id");
    const el = this._elementsMap.get(String(elementId));

    if (!el || (el.elementType || el.type) !== "ASSEMBLY") return;

    // Use current context (workspace or version) - updated when branch/version is selected
    const contextId = this._currentContextId || this._currentWorkspaceId;
    const contextType = this._currentContextType || "w";

    if (!contextId) {
      showToast("No workspace or version context available");
      return;
    }

    // For versions, BOM API requires workspace context - use the selected version's workspace if available
    // or fall back to default workspace for version snapshots
    let workspaceIdForBom = contextId;
    if (contextType === "v") {
      // Versions don't have direct BOM access; we need to use the workspace context
      // For now, use the default workspace - the BOM will reflect the current state
      workspaceIdForBom =
        this._currentWorkspaceId || this._currentDocData?.defaultWorkspace?.id;
      if (!workspaceIdForBom) {
        showToast(
          "BOM requires workspace context; no workspace available for this version"
        );
        return;
      }
      showToast(
        "Note: BOM fetched from workspace context (versions are snapshots)"
      );
    }

    const doc = this.controller.state.getState().currentDocument;

    if (format === "json") {
      await this.elementActions.handleFetchBomJson(
        el,
        doc.id,
        workspaceIdForBom,
        this.controller.documentService
      );
    } else {
      await this.elementActions.handleDownloadBomCsv(
        el,
        doc.id,
        workspaceIdForBom,
        this.controller.documentService
      );
    }
  }

  _bindBackButton() {
    const backBtn = document.getElementById("backBtn");
    if (!backBtn) {
      console.warn(
        "[DocumentDetailView] Back button (#backBtn) not found in DOM"
      );
      return;
    }

    // Remove any existing listener to avoid duplicates
    const newBtn = backBtn.cloneNode(true);
    backBtn.parentNode?.replaceChild(newBtn, backBtn);

    newBtn.addEventListener("click", async () => {
      console.log("[DocumentDetailView] Back button clicked");

      try {
        // Capture current state before navigating
        const currentState =
          typeof this.captureState === "function" ? this.captureState() : null;

        // Navigate back to document list
        if (this.controller?.router) {
          // const { ROUTES } = await import("../router/routes.js");
          this.controller.router.navigate(ROUTES.DOCUMENT_LIST, currentState);
        } else {
          console.warn(
            "[DocumentDetailView] Router not available, falling back to direct navigation"
          );
          this.controller?.showList?.(currentState);
        }
      } catch (err) {
        console.error("[DocumentDetailView] Error navigating back:", err);
      }
    });

    console.log("[DocumentDetailView] Back button listener attached");
  }

  updateHierarchy(documentId, html) {
    const container = document.getElementById(`parent-hierarchy-${documentId}`);
    if (container) container.innerHTML = html;
  }

  _flashButton(btn) {
    const original = btn.textContent;
    btn.textContent = "✅ Copied!";
    const prevBg = btn.style.background;
    btn.style.background = "#28a745";
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = prevBg || "#007bff";
    }, 2000);
  }

  captureState() {
    try {
      const container = document.querySelector(".document-info");
      return {
        scroll: {
          windowY: typeof window !== "undefined" ? window.scrollY || 0 : 0,
          containerTop: container ? container.scrollTop || 0 : 0,
          containerKey: container?.getAttribute?.("data-scroll-key") || null,
        },
      };
    } catch (e) {
      console.error("captureState (DocumentDetailView) failed:", e);
      return { scroll: { windowY: 0, containerTop: 0, containerKey: null } };
    }
  }

  restoreState(state) {
    if (!state || typeof state !== "object") return;

    const applyScroll = () => {
      try {
        const container = document.querySelector(".document-info");
        const scroll = state.scroll || {};
        if (container && typeof scroll.containerTop === "number") {
          container.scrollTop = scroll.containerTop;
        }
        if (typeof scroll.windowY === "number") {
          window.scrollTo(0, scroll.windowY);
        }
      } catch (e) {
        console.warn("restoreState (DocumentDetailView) scroll failed:", e);
      }
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(applyScroll));
    } else {
      setTimeout(applyScroll, 0);
    }
  }
}
