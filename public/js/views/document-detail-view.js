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
    this._loadedVersions = null;

    const infoContainer = document.getElementById("documentInfo");
    if (infoContainer) {
      const topBarHtml = this._renderTopBar(docData);
      const thumbnailHtml = renderThumbnailSection(docData);
      const versionSelectorHtml = this._renderVersionSelector(docData);
      const infoHtml = renderDocumentInfo(docData);
      infoContainer.innerHTML = topBarHtml + thumbnailHtml + versionSelectorHtml + infoHtml;
      this._setupThumbnail(docData);
      this._bindVersionSelector(docData);
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

  _renderVersionSelector(docData) {
    return `
      <div class="version-selector-section" id="version-selector-${docData.id}">
        <div class="version-selector-header">
          <h4>Document Versions</h4>
          <button class="btn btn-secondary btn-sm load-versions-btn" id="load-versions-${docData.id}">
            Load Versions
          </button>
        </div>
        <div class="version-selector-content" id="version-content-${docData.id}">
          <p class="version-hint">Click "Load Versions" to see all available versions of this document.</p>
        </div>
      </div>
    `;
  }

  _bindVersionSelector(docData) {
    const loadBtn = document.getElementById(`load-versions-${docData.id}`);
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this._handleLoadVersions(docData.id));
    }
  }

  async _handleLoadVersions(documentId) {
    const loadBtn = document.getElementById(`load-versions-${documentId}`);
    const contentEl = document.getElementById(`version-content-${documentId}`);

    if (!contentEl) return;

    // Show loading state
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "Loading...";
    }
    contentEl.innerHTML = '<p class="version-loading">Fetching versions...</p>';

    try {
      const versions = await this.controller.documentService.getVersions(documentId);
      this._loadedVersions = versions;

      if (!versions || versions.length === 0) {
        contentEl.innerHTML = '<p class="version-empty">No versions found for this document.</p>';
        if (loadBtn) {
          loadBtn.textContent = "Reload Versions";
          loadBtn.disabled = false;
        }
        return;
      }

      // Render version dropdown
      contentEl.innerHTML = this._renderVersionDropdown(versions, documentId);
      this._bindVersionDropdown(documentId);

      if (loadBtn) {
        loadBtn.textContent = "Reload Versions";
        loadBtn.disabled = false;
      }
    } catch (error) {
      console.error("Error loading versions:", error);
      contentEl.innerHTML = `<p class="version-error">Failed to load versions: ${escapeHtml(error.message)}</p>`;
      if (loadBtn) {
        loadBtn.textContent = "Retry";
        loadBtn.disabled = false;
      }
    }
  }

  _renderVersionDropdown(versions, documentId) {
    const optionsHtml = versions.map((v, idx) => {
      const name = escapeHtml(v.name || `Version ${idx + 1}`);
      const date = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "";
      return `<option value="${idx}" data-version-id="${escapeHtml(v.id)}">${name} ${date ? `(${date})` : ""}</option>`;
    }).join("");

    return `
      <div class="version-dropdown-container">
        <label for="version-select-${documentId}">Select Version:</label>
        <select id="version-select-${documentId}" class="version-select">
          <option value="" disabled selected>-- Choose a version --</option>
          ${optionsHtml}
        </select>
      </div>
      <div class="version-details" id="version-details-${documentId}">
        <p class="version-hint">Select a version to view its details.</p>
      </div>
    `;
  }

  _bindVersionDropdown(documentId) {
    const selectEl = document.getElementById(`version-select-${documentId}`);
    if (selectEl) {
      selectEl.addEventListener("change", (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && this._loadedVersions && this._loadedVersions[idx]) {
          this._displayVersionDetails(documentId, this._loadedVersions[idx]);
        }
      });
    }
  }

  _displayVersionDetails(documentId, version) {
    const detailsEl = document.getElementById(`version-details-${documentId}`);
    if (!detailsEl) return;

    const name = escapeHtml(version.name || "Unnamed Version");
    const description = version.description ? escapeHtml(version.description) : "<em>No description</em>";
    const createdAt = version.createdAt ? new Date(version.createdAt).toLocaleString() : "Unknown";
    const creatorName = version.creator?.name ? escapeHtml(version.creator.name) : "Unknown";
    const versionId = escapeHtml(version.id || "");
    const microversionId = version.microversion ? escapeHtml(version.microversion) : "N/A";

    detailsEl.innerHTML = `
      <div class="version-detail-card">
        <h5>${name}</h5>
        <div class="version-detail-row">
          <span class="version-label">Description:</span>
          <span class="version-value">${description}</span>
        </div>
        <div class="version-detail-row">
          <span class="version-label">Created:</span>
          <span class="version-value">${createdAt}</span>
        </div>
        <div class="version-detail-row">
          <span class="version-label">Creator:</span>
          <span class="version-value">${creatorName}</span>
        </div>
        <div class="version-detail-row">
          <span class="version-label">Version ID:</span>
          <span class="version-value version-id">${versionId}</span>
        </div>
        <div class="version-detail-row">
          <span class="version-label">Microversion:</span>
          <span class="version-value">${microversionId}</span>
        </div>
      </div>
    `;
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

    const doc = this.controller.state.getState().currentDocument;
    if (!doc?.defaultWorkspace?.id) {
      // const { showToast } = await import("../utils/toast-notification.js");
      showToast("No workspace available");
      return;
    }

    if (format === "json") {
      await this.elementActions.handleFetchBomJson(
        el,
        doc.id,
        doc.defaultWorkspace.id,
        this.controller.documentService
      );
    } else {
      await this.elementActions.handleDownloadBomCsv(
        el,
        doc.id,
        doc.defaultWorkspace.id,
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
