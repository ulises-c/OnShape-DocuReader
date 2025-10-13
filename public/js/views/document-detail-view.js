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

    const infoContainer = document.getElementById("documentInfo");
    if (infoContainer) {
      const topBarHtml = this._renderTopBar(docData);
      const thumbnailHtml = renderThumbnailSection(docData);
      const infoHtml = renderDocumentInfo(docData);
      infoContainer.innerHTML = topBarHtml + thumbnailHtml + infoHtml;
      this._setupThumbnail(docData);
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
      }
    });
  }

  async _handleBomAction(btn, docData, format) {
    const elementId = btn.getAttribute("data-element-id");
    const el = this._elementsMap.get(String(elementId));

    if (!el || (el.elementType || el.type) !== "ASSEMBLY") return;

    const doc = this.controller.state.getState().currentDocument;
    if (!doc?.defaultWorkspace?.id) {
      const { showToast } = await import("../utils/toast-notification.js");
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
      console.warn("[DocumentDetailView] Back button (#backBtn) not found in DOM");
      return;
    }

    // Remove any existing listener to avoid duplicates
    const newBtn = backBtn.cloneNode(true);
    backBtn.parentNode?.replaceChild(newBtn, backBtn);

    newBtn.addEventListener("click", async () => {
      console.log("[DocumentDetailView] Back button clicked");

      try {
        // Capture current state before navigating
        const currentState = typeof this.captureState === "function" 
          ? this.captureState() 
          : null;

        // Navigate back to document list
        if (this.controller?.router) {
          const { ROUTES } = await import("../router/routes.js");
          this.controller.router.navigate(ROUTES.DOCUMENT_LIST, currentState);
        } else {
          console.warn("[DocumentDetailView] Router not available, falling back to direct navigation");
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
