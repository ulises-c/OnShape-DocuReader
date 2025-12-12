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
  }

  render(docData, elements) {
    this.clear();
    this._currentDocData = docData;
    this._loadedHistory = null;
    this._selectedHistoryItem = null; // Track currently selected version/branch
    this._currentWorkspaceId = docData.defaultWorkspace?.id || null; // Track active workspace for element operations

    const infoContainer = document.getElementById("documentInfo");
    if (infoContainer) {
      const topBarHtml = this._renderTopBar(docData);
      const thumbnailHtml = renderThumbnailSection(docData);
      const historyHtml = this._renderHistorySelector(docData);
      const infoHtml = renderDocumentInfo(docData);
      infoContainer.innerHTML = topBarHtml + thumbnailHtml + historyHtml + infoHtml;
      this._setupThumbnail(docData);
      this._bindHistorySelector(docData);
    }

    const elementsContainer = document.getElementById("documentElements");
    if (elementsContainer) {
      this._elementsMap.clear();
      if (elements?.length) {
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));
      }
      elementsContainer.innerHTML = renderElementsList(elements);
    }

    this._bindDocumentActions(docData);
    this._bindElementActions(elementsContainer, docData);
    this._bindBackButton();
  }

  _renderTopBar(docData) {
    return ``;
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
      loadBtn.addEventListener("click", () => this._handleLoadHistory(docData.id));
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
    contentEl.innerHTML = '<p class="history-loading">Fetching versions and branches...</p>';

    try {
      const history = await this.controller.documentService.getCombinedHistory(documentId);
      this._loadedHistory = history;

      if (!history?.items || history.items.length === 0) {
        contentEl.innerHTML = '<p class="history-empty">No versions or branches found for this document.</p>';
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
      contentEl.innerHTML = `<p class="history-error">Failed to load history: ${escapeHtml(error.message)}</p>`;
      if (loadBtn) {
        loadBtn.textContent = "Retry";
        loadBtn.disabled = false;
      }
    }
  }

  _renderHistoryDropdown(history, documentId) {
    // Build options with type badges (version vs branch)
    const optionsHtml = history.items.map((item, idx) => {
      const name = escapeHtml(item.name || 'Unnamed');
      const dateStr = item.modifiedAt || item.createdAt;
      const date = dateStr ? new Date(dateStr).toLocaleDateString() : "";
      const time = dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      const typeLabel = item.type === 'branch' ? '🌿' : '📌';
      const mainBadge = item.isMainWorkspace ? ' (Main)' : '';
      const modifier = item.modifier?.name || item.creator?.name || '';
      
      return `<option value="${idx}" data-item-id="${escapeHtml(item.id)}" data-item-type="${item.type}">${typeLabel} ${name}${mainBadge} - ${modifier} ${date} ${time}</option>`;
    }).join("");

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
          
          // Update workspace context and reload elements for branches
          if (item.type === 'branch') {
            this._currentWorkspaceId = item.id;
            await this._reloadElementsForWorkspace(documentId, item.id);
          } else {
            // Versions: show note that element operations will use version context
            // For now, keep current workspace but note the version selection
            this._displayVersionNote(documentId, item);
          }
        }
      });
    }
  }

  _displayHistoryDetails(documentId, item) {
    const detailsEl = document.getElementById(`history-details-${documentId}`);
    if (!detailsEl) return;

    const name = escapeHtml(item.name || "Unnamed");
    const description = item.description ? escapeHtml(item.description) : "<em>No description</em>";
    const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown";
    const modifiedAt = item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : createdAt;
    const creatorName = item.creator?.name ? escapeHtml(item.creator.name) : "Unknown";
    const modifierName = item.modifier?.name ? escapeHtml(item.modifier.name) : creatorName;
    const itemId = escapeHtml(item.id || "");
    const typeLabel = item.type === 'branch' ? 'Branch (Workspace)' : 'Version';
    const typeBadgeClass = item.type === 'branch' ? 'history-type-branch' : 'history-type-version';
    const mainBadge = item.isMainWorkspace ? '<span class="history-main-badge">Main</span>' : "";
    const microversionRow = item.microversion 
      ? `<div class="history-detail-row">
          <span class="history-label">Microversion:</span>
          <span class="history-value">${escapeHtml(item.microversion)}</span>
        </div>` 
      : '';
    
    // Show context note for workspace selection
    const contextNote = item.type === 'branch' 
      ? `<div class="history-context-note history-context-active">
          ✅ Elements below now show content from this workspace. Element actions will use this context.
        </div>`
      : `<div class="history-context-note history-context-version">
          ℹ️ Version selected. Element actions require workspace context; using default workspace for operations.
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
          <span class="history-label">${item.type === 'branch' ? 'Workspace' : 'Version'} ID:</span>
          <span class="history-value history-id">${itemId}</span>
        </div>
        ${microversionRow}
        ${contextNote}
      </div>
    `;
  }

  /**
   * Reload elements list for a specific workspace (branch selection)
   */
  async _reloadElementsForWorkspace(documentId, workspaceId) {
    const elementsContainer = document.getElementById("documentElements");
    if (!elementsContainer) return;

    // Show loading state
    elementsContainer.innerHTML = `<div class="elements-loading">Loading elements for selected workspace...</div>`;

    try {
      const elements = await this.controller.documentService.getElements(documentId, workspaceId);
      
      // Update elements map
      this._elementsMap.clear();
      if (elements?.length) {
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));
      }
      
      // Re-render elements list
      elementsContainer.innerHTML = renderElementsList(elements);
      
      // Re-bind element actions with new workspace context
      this._bindElementActions(elementsContainer, this._currentDocData);
      
      showToast(`Loaded ${elements?.length || 0} elements from workspace`);
    } catch (error) {
      console.error("Error loading elements for workspace:", error);
      elementsContainer.innerHTML = `<div class="elements-error">Failed to load elements: ${escapeHtml(error.message)}</div>`;
    }
  }

  /**
   * Display note when a version is selected (not a branch)
   */
  _displayVersionNote(documentId, item) {
    // Versions don't have editable workspace context, so we just note this
    // Element actions will still work using the default workspace
    console.log(`[DocumentDetailView] Version selected: ${item.name} (${item.id})`);
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

    // Use current workspace context (updated when branch is selected)
    const workspaceId = this._currentWorkspaceId;
    if (!workspaceId) {
      showToast("No workspace available");
      return;
    }

    const doc = this.controller.state.getState().currentDocument;

    if (format === "json") {
      await this.elementActions.handleFetchBomJson(
        el,
        doc.id,
        workspaceId,
        this.controller.documentService
      );
    } else {
      await this.elementActions.handleDownloadBomCsv(
        el,
        doc.id,
        workspaceId,
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
