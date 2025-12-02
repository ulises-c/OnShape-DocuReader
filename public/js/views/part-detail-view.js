/**
 * PartDetailView - renders part details and mass properties
 */

import { escapeHtml } from "../utils/dom-helpers.js";
import { ROUTES, pathTo } from "../router/routes.js";

export class PartDetailView {
  render(part) {
    if (!part) return;

    // Title
    const title = document.getElementById("partTitle");
    if (title) {
      title.textContent = part.name || "Unnamed Part";
    }

    // Info
    const infoEl = document.getElementById("partInfo");
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${escapeHtml(
            part.name || "Unnamed Part"
          )}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Part ID</div>
          <div class="info-value" style="font-family: monospace;">${escapeHtml(
            part.partId
          )}</div>
        </div>
        ${
          part.bodyType
            ? `
        <div class="info-item">
          <div class="info-label">Body Type</div>
          <div class="info-value">${escapeHtml(part.bodyType)}</div>
        </div>`
            : ""
        }
        ${
          part.state
            ? `
        <div class="info-item">
          <div class="info-label">State</div>
          <div class="info-value">${escapeHtml(part.state)}</div>
        </div>`
            : ""
        }
      `;
    }

    // Mass properties
    const massPropsEl = document.getElementById("partMassProperties");
    if (massPropsEl) {
      const props = part.massProperties;
      if (props?.bodies?.length) {
        const body = props.bodies[0];
        const items = [];

        if (body.mass !== undefined) {
          items.push({
            label: "Mass",
            value: `${body.mass[0]} ${props.units?.mass || "kg"}`,
          });
        }
        if (body.volume !== undefined) {
          items.push({
            label: "Volume",
            value: `${body.volume[0]} ${props.units?.volume || "m³"}`,
          });
        }
        if (body.centroid) {
          items.push({
            label: "Centroid (X, Y, Z)",
            value: `(${body.centroid[0].toFixed(6)}, ${body.centroid[1].toFixed(
              6
            )}, ${body.centroid[2].toFixed(6)})`,
          });
        }
        if (body.inertia) {
          items.push({
            label: "Moment of Inertia",
            value: `[${body.inertia.map((v) => v.toFixed(6)).join(", ")}]`,
          });
        }

        if (items.length) {
          massPropsEl.innerHTML = items
            .map(
              (it) => `
            <div class="mass-property-item">
              <div class="mass-property-label">${escapeHtml(it.label)}</div>
              <div class="mass-property-value">${escapeHtml(it.value)}</div>
            </div>
          `
            )
            .join("");
        } else {
          massPropsEl.innerHTML =
            '<div class="empty-state"><h3>No Mass Properties</h3><p>No mass properties data available for this part.</p></div>';
        }
      } else {
        massPropsEl.innerHTML =
          '<div class="empty-state"><h3>Loading Mass Properties...</h3><p>Mass properties could not be loaded for this part.</p></div>';
      }
    }

    this._bindBackButton();
  }

  _bindBackButton() {
    const backBtn = document.getElementById("backToElementBtn");
    if (!backBtn) {
      console.warn(
        "[PartDetailView] Back button (#backToElementBtn) not found in DOM"
      );
      return;
    }

    // Remove any existing listener to avoid duplicates
    const newBtn = backBtn.cloneNode(true);
    backBtn.parentNode?.replaceChild(newBtn, backBtn);

    newBtn.addEventListener("click", async () => {
      console.log("[PartDetailView] Back button clicked");

      try {
        // Import controller from somewhere accessible
        // Since PartDetailView doesn't store controller, we'll need to access it via a global or pass it in constructor
        // For now, we'll use window to access the app's documentController
        const controller = window.__documentController;
        if (!controller) {
          console.warn("[PartDetailView] Controller not available");
          return;
        }

        const currentState =
          typeof this.captureState === "function" ? this.captureState() : null;

        const state = controller.state?.getState?.();
        const doc = state?.currentDocument;
        const element = state?.currentElement;

        if (!doc?.id || !element?.id) {
          console.warn("[PartDetailView] No current document or element found");
          return;
        }

        if (controller.router) {
          // const { ROUTES, pathTo } = await import("../router/routes.js");
          const path = pathTo(ROUTES.ELEMENT_DETAIL, {
            docId: doc.id,
            elementId: element.id,
          });
          controller.router.navigate(path, currentState);
        } else {
          console.warn("[PartDetailView] Router not available, falling back");
          controller.viewElement?.(element.id);
        }
      } catch (err) {
        console.error("[PartDetailView] Error navigating back:", err);
      }
    });

    console.log("[PartDetailView] Back button listener attached");
  }

  captureState() {
    try {
      const container = document.querySelector(".part-info");
      return {
        scroll: {
          windowY: typeof window !== "undefined" ? window.scrollY || 0 : 0,
          containerTop: container ? container.scrollTop || 0 : 0,
          containerKey: container?.getAttribute?.("data-scroll-key") || null,
        },
      };
    } catch (e) {
      console.error("captureState (PartDetailView) failed:", e);
      return { scroll: { windowY: 0, containerTop: 0, containerKey: null } };
    }
  }

  restoreState(state) {
    if (!state || typeof state !== "object") return;

    const applyScroll = () => {
      try {
        const container = document.querySelector(".part-info");
        const scroll = state.scroll || {};
        if (container && typeof scroll.containerTop === "number") {
          container.scrollTop = scroll.containerTop;
        }
        if (typeof scroll.windowY === "number") {
          window.scrollTo(0, scroll.windowY);
        }
      } catch (e) {
        console.warn("restoreState (PartDetailView) scroll failed:", e);
      }
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(applyScroll));
    } else {
      setTimeout(applyScroll, 0);
    }
  }
}
