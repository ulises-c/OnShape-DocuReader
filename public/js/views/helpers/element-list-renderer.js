/**
 * Pure rendering for elements list
 */

import { escapeHtml } from '../../utils/dom-helpers.js';

export function renderElementsList(elements) {
  if (!elements?.length) {
    return '<p style="color:#666; font-style:italic;">No elements found or unable to load elements.</p>';
  }

  return elements.map((el) => renderElementItem(el)).join('');
}

export function renderElementItem(element) {
  return `
    <div class="element-container" style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1rem; padding:1rem; border:1px solid #ddd; border-radius:8px; background:#f8f9fa; gap: 0.75rem; min-width: 0;">
      <div class="element-item" data-element-id="${escapeHtml(
        element.id
      )}" style="flex: 1 1 auto; min-width: 0; cursor:pointer;">
        <div class="element-name">${escapeHtml(element.name)}</div>
        <div class="element-type">Type: ${escapeHtml(
          element.type || 'Unknown'
        )}</div>
        ${
          element.elementType
            ? `<div class="element-type">Element Type: ${escapeHtml(
                element.elementType
              )}</div>`
            : ''
        }
      </div>
      ${renderElementActions(element)}
    </div>
  `;
}

export function renderElementActions(element) {
  const copyBtn = `
    <button class="btn copy-element-json-btn" data-element-id="${escapeHtml(
      element.id
    )}"
      style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer;">
      📋 Copy Raw JSON
    </button>
  `;

  const bomButtons =
    element.elementType === 'ASSEMBLY'
      ? `
    <button class="btn fetch-bom-btn" data-element-id="${escapeHtml(
      element.id
    )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#28a745; color:white; border:1px solid #1e7e34; border-radius:4px; cursor:pointer;">Download BOM JSON</button>
    <button class="btn download-bom-csv-btn" data-element-id="${escapeHtml(
      element.id
    )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#ffc107; color:#333; border:1px solid #e0a800; border-radius:4px; cursor:pointer;">Download BOM CSV</button>
    <button class="btn full-extract-btn" data-element-id="${escapeHtml(
      element.id
    )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#6f42c1; color:white; border:1px solid #5a32a3; border-radius:4px; cursor:pointer;" title="Download BOM JSON, CSV, and all part thumbnails as ZIP">📦 Full Extract</button>
  `
      : '';

  return `
    <div class="element-actions" style="margin-left:1rem; flex: 0 1 auto; min-width: 0; display:flex; flex-wrap: wrap; gap:6px; align-items:center; justify-content:flex-end;">
      ${copyBtn}
      ${bomButtons}
    </div>
  `;
}
