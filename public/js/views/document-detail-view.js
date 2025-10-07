/**
 * DocumentDetailView - renders document details and elements
 */

import { BaseView } from "./base-view.js";
import { escapeHtml, qs } from "../utils/dom-helpers.js";
import { formatDateWithUser } from "../utils/format-helpers.js";
import { copyToClipboard } from "../utils/clipboard.js";

export class DocumentDetailView extends BaseView {
  constructor(containerSelector, controller, thumbnailService) {
    super(containerSelector);
    this.controller = controller;
    this.thumbnailService = thumbnailService;
    // Map of elementId -> element object for quick lookup when copying JSON
    this._elementsMap = new Map();
  }

  render(docData, elements) {
    this.clear();

    const createdDate = formatDateWithUser(
      docData.createdAt,
      docData.createdBy || docData.creator
    );
    const modifiedDate = formatDateWithUser(
      docData.modifiedAt,
      docData.modifiedBy
    );

    let thumbnailHtml = "";
    if (docData.thumbnail && Array.isArray(docData.thumbnail.sizes)) {
      const preferred = ["300x300", "600x340", "300x170", "70x40"];
      let selected = null;
      for (const size of preferred) {
        selected = docData.thumbnail.sizes.find((s) => s.size === size);
        if (selected) break;
      }
      if (!selected && docData.thumbnail.sizes.length > 0)
        selected = docData.thumbnail.sizes[0];

      if (selected?.href) {
        const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
          selected.href
        )}`;
        thumbnailHtml = `
          <div class="info-item">
            <div class="info-label">Thumbnail</div>
            <div class="info-value thumbnail-container">
              <div id="thumbnail-placeholder-${docData.id}" style="width: 300px; height: 200px; background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #666; font-style: italic;">
                <div>📷</div>
                <div style="margin-top: 0.5rem;">Loading thumbnail...</div>
              </div>
              <img id="document-thumbnail-img-${docData.id}"
                   src="${proxyUrl}"
                   alt="Document thumbnail"
                   class="document-thumbnail"
                   data-original-url="${selected.href}"
                   data-proxy-url="${proxyUrl}"
                   data-doc-id="${docData.id}"
                   style="max-width:300px; max-height:200px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:none;" />
              <div class="thumbnail-info" style="margin-top:0.5rem; font-size:0.9rem; color:#666;">Size: ${selected.size} | Click to view original</div>
            </div>
          </div>
        `;

        // Defer setup
        setTimeout(
          () =>
            this.thumbnailService.setup(docData.id, selected.href, proxyUrl),
          0
        );
      }
    }

    const tagsHtml = docData.tags?.length
      ? docData.tags
          .map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`)
          .join(" ")
      : "No tags";

    const labelsHtml = docData.documentLabels?.length
      ? docData.documentLabels
          .map(
            (l) =>
              `<span class="label-badge">${escapeHtml(
                typeof l === "string" ? l : l.name || JSON.stringify(l)
              )}</span>`
          )
          .join(" ")
      : "No document labels";

    const infoHtml = `
      <div class="top-bar-actions" style="display:flex; gap:0.5rem; margin-bottom:1rem; align-items:center;">
        <button id="get-document-${
          docData.id
        }" class="btn get-document-btn" data-doc-id="${
      docData.id
    }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer;">Get Document</button>
        <button id="get-json-${
          docData.id
        }" class="btn get-json-btn" data-doc-id="${
      docData.id
    }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#17a2b8; color:white; border:1px solid #117a8b; border-radius:4px; cursor:pointer;">Get JSON</button>
      </div>
      ${thumbnailHtml}
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${escapeHtml(docData.name)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Description</div>
        <div class="info-value">${escapeHtml(
          docData.description || "No description"
        )}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Notes</div>
        <div class="info-value">${escapeHtml(docData.notes || "No notes")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tags</div>
        <div class="info-value">${tagsHtml}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Document Labels</div>
        <div class="info-value">${labelsHtml}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Created</div>
        <div class="info-value">${escapeHtml(createdDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Modified</div>
        <div class="info-value">${escapeHtml(modifiedDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Visibility</div>
        <div class="info-value">${docData.isPublic ? "Public" : "Private"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Parent/Hierarchy</div>
        <div class="info-value" id="parent-hierarchy-${docData.id}">
          ${
            docData.parentId
              ? `Parent ID: ${escapeHtml(docData.parentId)}`
              : "No parent information"
          }
          <div style="margin-top: 0.5rem;">
            <button id="load-hierarchy-${
              docData.id
            }" class="btn load-hierarchy-btn" data-doc-id="${
      docData.id
    }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#f0f0f0; border:1px solid #ddd;">
              🔍 Load Hierarchy Details
            </button>
          </div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Raw JSON</div>
        <div style="margin-bottom:0.5rem; display:flex; gap:0.5rem; align-items:center;">
          <button id="copy-json-${
            docData.id
          }" class="btn copy-json-btn" data-doc-id="${
      docData.id
    }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer;">
            📋 Copy Raw JSON
          </button>
        </div>
        <pre id="raw-json-${
          docData.id
        }" class="info-value" style="background:#f8f9fa; border-radius:6px; padding:1em; font-size:0.95em; max-height:400px; overflow:auto;">${escapeHtml(
      JSON.stringify(docData, null, 2)
    )}</pre>
      </div>
    `;

    // Info
    const infoContainer = document.getElementById("documentInfo");
    if (infoContainer) {
      infoContainer.innerHTML = infoHtml;
    }

    // Elements
    const elementsContainer = document.getElementById("documentElements");
    if (elementsContainer) {
      if (elements?.length) {
        // Populate internal map and render elements with only the id attribute
        this._elementsMap.clear();
        elements.forEach((el) => this._elementsMap.set(String(el.id), el));

        elementsContainer.innerHTML = elements
          .map(
            (el) => `
              <div class="element-container" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; padding:1rem; border:1px solid #ddd; border-radius:8px; background:#f8f9fa;">
                <div class="element-item" data-element-id="${escapeHtml(
                  el.id
                )}" style="flex-grow:1; cursor:pointer;">
                  <div class="element-name">${escapeHtml(el.name)}</div>
                  <div class="element-type">Type: ${escapeHtml(
                    el.type || "Unknown"
                  )}</div>
                  ${
                    el.elementType
                      ? `<div class="element-type">Element Type: ${escapeHtml(
                          el.elementType
                        )}</div>`
                      : ""
                  }
                </div>
                <div class="element-actions" style="margin-left:1rem; flex-shrink:0; display:flex; gap:6px; align-items:center;">
                  <button class="btn copy-element-json-btn" data-element-id="${escapeHtml(
                    el.id
                  )}"
                    style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer;">
                    📋 Copy Raw JSON
                  </button>
                  ${
                    el.elementType === "ASSEMBLY"
                      ? `
                    <button class="btn fetch-bom-btn" data-element-id="${escapeHtml(
                      el.id
                    )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#28a745; color:white; border:1px solid #1e7e34; border-radius:4px; cursor:pointer;">Download BOM JSON</button>
                    <button class="btn download-bom-csv-btn" data-element-id="${escapeHtml(
                      el.id
                    )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#ffc107; color:#333; border:1px solid #e0a800; border-radius:4px; cursor:pointer;">Download BOM CSV</button>
                  `
                      : ""
                  }
                </div>
              </div>
            `
          )
          .join("");
      } else {
        elementsContainer.innerHTML =
          '<p style="color:#666; font-style:italic;">No elements found or unable to load elements.</p>';
      }
    }

    // Bind actions in details
    const copyBtn = document.getElementById(`copy-json-${docData.id}`);
    copyBtn?.addEventListener("click", async () => {
      try {
        await copyToClipboard(JSON.stringify(docData, null, 2));
        this._flashButton(copyBtn);
      } catch (e) {
        console.error("Failed to copy raw JSON:", e);
      }
    });

    // Get JSON button handler (top bar)
    const getJsonBtn = document.getElementById(`get-json-${docData.id}`);
    getJsonBtn?.addEventListener("click", () => {
      try {
        const blob = new Blob([JSON.stringify(docData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docData.name || docData.id}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        this._showToast("Document JSON downloaded");
      } catch (err) {
        console.error("Failed to download JSON:", err);
        this._showToast("Failed to download JSON");
      }
    });

    // Download BOM CSV button handler (only for ASSEMBLY type)
    const downloadBomCsvBtn = document.getElementById(
      `download-bom-csv-${docData.id}`
    );
    downloadBomCsvBtn?.addEventListener("click", async () => {
      try {
        // Only allow if current document is ASSEMBLY type
        const isAssemblyDoc = elements.some(
          (el) => (el.elementType || el.type) === "ASSEMBLY"
        );
        if (!isAssemblyDoc) {
          this._showToast(
            "BOM CSV export only available for ASSEMBLY documents"
          );
          return;
        }
        const assemblyEl = elements.find(
          (el) => (el.elementType || el.type) === "ASSEMBLY"
        );
        if (!assemblyEl) {
          this._showToast("No ASSEMBLY element found for BOM export");
          return;
        }
        const doc = this.controller.state.getState().currentDocument;
        if (!doc?.defaultWorkspace?.id) {
          this._showToast("No workspace available");
          return;
        }
        const bom = await this.controller.documentService.getBillOfMaterials(
          doc.id,
          doc.defaultWorkspace.id,
          assemblyEl.id
        );
        // Use BOM to CSV util
        import("../utils/bomToCSV.js").then(({ bomToCSV }) => {
          const csv = bomToCSV(bom);
          if (!csv) {
            this._showToast("No BOM data available for CSV export");
            return;
          }
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${docData.name || docData.id}-BOM.csv`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          this._showToast("BOM CSV downloaded");
        });
      } catch (err) {
        console.error("Failed to export BOM CSV:", err);
        this._showToast("Failed to export BOM CSV");
      }
    });

    // Export CSV button handler
    const exportCsvBtn = document.getElementById(`export-csv-${docData.id}`);
    exportCsvBtn?.addEventListener("click", () => {
      try {
        // Only export ASM/PRT elements from the current document
        const csvRows = [];
        const header = ["ID", "Name", "Type", "ElementType"];
        csvRows.push(header.join(","));
        for (const el of elements) {
          const type = el.elementType || el.type || "";
          if (type === "ASSEMBLY" || type === "PART") {
            const row = [
              `"${el.id}"`,
              `"${el.name || ""}"`,
              `"${el.type || ""}"`,
              `"${el.elementType || ""}"`,
            ];
            csvRows.push(row.join(","));
          }
        }
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docData.name || docData.id}-ASM-PRT.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        this._showToast("CSV exported for current document");
      } catch (err) {
        console.error("Failed to export CSV:", err);
        this._showToast("Failed to export CSV");
      }
    });

    const hierarchyBtn = document.getElementById(
      `load-hierarchy-${docData.id}`
    );
    hierarchyBtn?.addEventListener("click", () =>
      this.controller.loadHierarchy(docData.id)
    );

    // Delegate copy-element-json clicks to the elements container so the handler
    // works for every element and every time (not just once). We attach the
    // listener to `elementsContainer` so the scope is limited and easier to
    // reason about.
    if (elementsContainer) {
      elementsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".copy-element-json-btn");
        if (!btn) return;
        const elementId = btn.getAttribute("data-element-id");
        if (!elementId) return;
        try {
          const el = this._elementsMap.get(String(elementId));
          if (!el) {
            console.warn("Element not found in view map for id", elementId);
            return;
          }
          // Use controller method which will enrich with metadata and copy
          this.controller
            .copyElementJson(el)
            .then(() => this._showToast(`${el.name || elementId} JSON copied`));
          this._flashButton(btn);
        } catch (err) {
          console.error("Error copying element JSON:", err);
        }
      });

      // Fetch BOM JSON and BOM CSV button handling for ASSEMBLY elements
      elementsContainer.addEventListener("click", async (e) => {
        const bomJsonBtn = e.target.closest(".fetch-bom-btn");
        const bomCsvBtn = e.target.closest(".download-bom-csv-btn");
        if (bomJsonBtn) {
          const elementId = bomJsonBtn.getAttribute("data-element-id");
          if (!elementId) return;
          const el = this._elementsMap.get(String(elementId));
          if (!el || (el.elementType || el.type) !== "ASSEMBLY") return;
          try {
            const doc = this.controller.state.getState().currentDocument;
            if (!doc?.defaultWorkspace?.id) {
              this._showToast("No workspace available");
              return;
            }
            const bom =
              await this.controller.documentService.getBillOfMaterials(
                doc.id,
                doc.defaultWorkspace.id,
                elementId
              );
            // Download BOM JSON as a file
            const blob = new Blob([JSON.stringify(bom, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${el.name || elementId}-BOM.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
            this._showToast("BOM JSON downloaded");
          } catch (apiErr) {
            console.error("Failed to fetch BOM from server:", apiErr);
            this._showToast("Failed to fetch BOM from server");
          }
        }
        if (bomCsvBtn) {
          const elementId = bomCsvBtn.getAttribute("data-element-id");
          if (!elementId) return;
          const el = this._elementsMap.get(String(elementId));
          if (!el || (el.elementType || el.type) !== "ASSEMBLY") return;
          try {
            const doc = this.controller.state.getState().currentDocument;
            if (!doc?.defaultWorkspace?.id) {
              this._showToast("No workspace available");
              return;
            }
            const bom =
              await this.controller.documentService.getBillOfMaterials(
                doc.id,
                doc.defaultWorkspace.id,
                elementId
              );
            import("../utils/bomToCSV.js").then(({ bomToCSV }) => {
              const csv = bomToCSV(bom);
              if (!csv) {
                this._showToast("No BOM data available for CSV export");
                return;
              }
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${el.name || elementId}-BOM.csv`;
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 100);
              this._showToast("BOM CSV downloaded");
            });
          } catch (err) {
            console.error("Failed to export BOM CSV:", err);
            this._showToast("Failed to export BOM CSV");
          }
        }
      });
    }

    // Toast container (created lazily)
    if (!document.getElementById("docu-toast-container")) {
      const toastContainer = document.createElement("div");
      toastContainer.id = "docu-toast-container";
      toastContainer.style.cssText =
        "position:fixed;top:20px;right:20px;z-index:1200;pointer-events:none;";
      document.body.appendChild(toastContainer);
    }
  }

  _showToast(message, duration = 2500) {
    try {
      const container = document.getElementById("docu-toast-container");
      if (!container) return;
      const toast = document.createElement("div");
      toast.textContent = message;
      toast.style.cssText =
        "background:#333;color:#fff;padding:10px 14px;border-radius:6px;margin-top:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:auto;opacity:0;transform:translateY(-6px);transition:opacity 200ms ease,transform 200ms ease;font-family:system-ui,Segoe UI,Roboto,-apple-system,Arial,sans-serif;font-size:0.95rem;";
      container.appendChild(toast);
      // animate in
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });
      setTimeout(() => {
        // animate out
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-6px)";
        setTimeout(() => toast.remove(), 220);
      }, duration);
    } catch (e) {
      console.warn("Failed to show toast:", e);
    }
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

  /**
   * Capture scroll position for detail view containers
   */
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

  /**
   * Restore scroll position after the view has rendered
   */
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
