 // Full file content with added state capture/restore methods
import { BaseView } from './base-view.js';
import { escapeHtml } from '../utils/dom-helpers.js';
export class ElementDetailView extends BaseView {
  constructor(containerSelector, controller) {
    super(containerSelector);
    this.controller = controller;
  }

  render(element) {
    if (!element) return;

    const infoEl = document.getElementById('elementInfo');
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${escapeHtml(element.name)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Type</div>
          <div class="info-value">${escapeHtml(element.type || 'Unknown')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Element Type</div>
          <div class="info-value">${escapeHtml(element.elementType || 'Unknown')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">ID</div>
          <div class="info-value" style="font-family: monospace;">${escapeHtml(element.id)}</div>
        </div>
      `;
    }

    // Parts
    const partsEl = document.getElementById('elementParts');
    if (partsEl) {
      if (element.parts?.length) {
        partsEl.innerHTML = element.parts
          .map(
            (part) => `
          <div class="part-item" data-part-id="${escapeHtml(part.partId)}">
            <div class="part-name">${escapeHtml(part.name || 'Unnamed Part')}</div>
            <div class="part-id">ID: ${escapeHtml(part.partId)}</div>
            ${part.bodyType ? `<div class="element-type">Body Type: ${escapeHtml(part.bodyType)}</div>` : ''}
          </div>`
          )
          .join('');

        partsEl.addEventListener(
          'click',
          (e) => {
            const item = e.target.closest('.part-item');
            if (!item) return;
            const partId = item.getAttribute('data-part-id');
            if (partId) {
              console.log('Part clicked:', partId);
              this.controller.viewPart(partId);
            }
          },
          { once: true }
        );
      } else {
        partsEl.innerHTML =
          '<div class="empty-state"><h3>No Parts Found</h3><p>This element contains no parts or they could not be loaded.</p></div>';
      }
    }

    // Assemblies
    const assembliesEl = document.getElementById('elementAssemblies');
    if (assembliesEl) {
      if (element.assemblies?.length) {
        assembliesEl.innerHTML = element.assemblies
          .map(
            (assembly) => `
          <div class="assembly-item">
            <div class="assembly-name">${escapeHtml(assembly.name || 'Unnamed Assembly')}</div>
            <div class="assembly-id">ID: ${escapeHtml(assembly.id)}</div>
            ${assembly.type ? `<div class="element-type">Type: ${escapeHtml(assembly.type)}</div>` : ''}
          </div>`
          )
          .join('');
      } else {
        assembliesEl.innerHTML =
          '<div class="empty-state"><h3>No Assemblies Found</h3><p>This element contains no assemblies or they could not be loaded.</p></div>';
      }
    }

    // Metadata
    const metadataEl = document.getElementById('elementMetadata');
    if (metadataEl) {
      if (element.metadata && Object.keys(element.metadata).length > 0) {
        metadataEl.innerHTML = Object.entries(element.metadata)
          .map(([key, value]) => {
            const display =
              typeof value === 'object' ? escapeHtml(JSON.stringify(value, null, 2)) : escapeHtml(String(value));
            return `
              <div class="info-item">
                <div class="info-label">${escapeHtml(key)}</div>
                <div class="info-value">${display}</div>
              </div>
            `;
          })
          .join('');
      } else {
        metadataEl.innerHTML =
          '<div class="empty-state"><h3>No Metadata Available</h3><p>No metadata found for this element.</p></div>';
      }
    }
  }

  /**
   * Capture scroll position for element detail containers
   */
  captureState() {
    try {
      const container = document.querySelector('.element-info');
      return {
        scroll: {
          windowY: typeof window !== 'undefined' ? (window.scrollY || 0) : 0,
          containerTop: container ? (container.scrollTop || 0) : 0,
          containerKey: container?.getAttribute?.('data-scroll-key') || null
        }
      };
    } catch (e) {
      console.error('captureState (ElementDetailView) failed:', e);
      return { scroll: { windowY: 0, containerTop: 0, containerKey: null } };
    }
  }

  /**
   * Restore scroll position after the view has rendered
   */
  restoreState(state) {
    if (!state || typeof state !== 'object') return;

    const applyScroll = () => {
      try {
        const container = document.querySelector('.element-info');
        const scroll = state.scroll || {};
        if (container && typeof scroll.containerTop === 'number') {
          container.scrollTop = scroll.containerTop;
        }
        if (typeof scroll.windowY === 'number') {
          window.scrollTo(0, scroll.windowY);
        }
      } catch (e) {
        console.warn('restoreState (ElementDetailView) scroll failed:', e);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(applyScroll));
    } else {
      setTimeout(applyScroll, 0);
    }
  }
}
