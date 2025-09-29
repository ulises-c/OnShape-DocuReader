/**
 * ElementDetailView - renders element details, parts, assemblies, metadata
 */

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
}
