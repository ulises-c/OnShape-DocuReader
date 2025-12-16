/**
 * Pure rendering functions for pagination controls
 */

import { escapeHtml } from '../../utils/dom-helpers.js';

/**
 * Render pagination controls HTML
 * @param {object} pagination - Pagination state object
 * @returns {string} HTML string
 */
export function renderPaginationControls(pagination) {
  const { currentPage, pageSize, totalCount, totalPages } = pagination;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const firstDisabled = currentPage === 1 || totalPages === 0;
  const lastDisabled = currentPage === totalPages || totalPages === 0;

  return `
    <div class="pagination-controls">
      <div class="pagination-info">
        <span class="pagination-summary">Showing ${startItem}-${endItem} of ${totalCount} documents</span>
        <label class="page-size-label">
          <span>Items per page:</span>
          <select class="page-size-selector">
            ${renderPageSizeOptions(pageSize)}
          </select>
        </label>
      </div>
      <div class="pagination-nav">
        <button class="btn btn-sm pagination-btn" data-action="first" ${firstDisabled ? 'disabled' : ''} title="First page">
          &laquo;&laquo;
        </button>
        <button class="btn btn-sm pagination-btn" data-action="prev" ${firstDisabled ? 'disabled' : ''} title="Previous page">
          &lsaquo;
        </button>
        <span class="page-indicator">
          <span>Page</span>
          <input type="number" class="page-jump" value="${currentPage}" min="1" max="${totalPages}" ${totalPages === 0 ? 'disabled' : ''}>
          <span>of ${totalPages}</span>
        </span>
        <button class="btn btn-sm pagination-btn" data-action="next" ${lastDisabled ? 'disabled' : ''} title="Next page">
          &rsaquo;
        </button>
        <button class="btn btn-sm pagination-btn" data-action="last" ${lastDisabled ? 'disabled' : ''} title="Last page">
          &raquo;&raquo;
        </button>
      </div>
    </div>
  `;
}

/**
 * Render page size dropdown options
 * @param {number} currentSize - Currently selected page size
 * @returns {string} HTML string
 */
function renderPageSizeOptions(currentSize) {
  const sizes = [10, 20, 50, 100];
  return sizes
    .map(size => `<option value="${size}" ${size === currentSize ? 'selected' : ''}>${size}</option>`)
    .join('');
}

/**
 * Insert zero-width space BEFORE natural word separators to allow line breaks
 * This prevents breaks in the middle of words like "PCBAs" becoming "PCB" + "As"
 * The break opportunity is placed BEFORE the separator, so the separator stays with the following text
 */
function wrapAtSeparators(text) {
  if (!text) return '';
  // Insert zero-width space BEFORE separators (not after) to keep separator with following word
  // This prevents "600_D01_PCBAs" from breaking as "600_D01_PCB" + "As"
  return String(text).replace(/([_\-./])/g, '\u200B$1');
}

/**
 * Render document table rows
 * @param {Array} documents - Array of document objects
 * @returns {string} HTML string
 */
export function renderDocumentRows(documents) {
  if (!documents || documents.length === 0) {
    return '';
  }

  return documents.map((doc) => {
    const creator = doc.creator?.name || 'Unknown Creator';
    const created = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-';
    const modified = doc.modifiedAt ? new Date(doc.modifiedAt).toLocaleString() : '-';
    const lastModifiedBy = doc.modifiedBy?.name || doc.modifiedBy || '-';
    const parent = doc.parentName || doc.parent?.name || '-';
    const type = doc.type || 'Document';

    // Escape first, then wrap at separators for proper line breaking
    const escapedName = escapeHtml(doc.name);
    const wrappedName = wrapAtSeparators(escapedName);

    return `
      <tr class="document-card" data-id="${escapeHtml(doc.id)}">
        <td class="doc-file-title">${wrappedName}</td>
        <td>${escapeHtml(creator)}</td>
        <td>${escapeHtml(created)}</td>
        <td>${escapeHtml(modified)}</td>
        <td>${escapeHtml(lastModifiedBy)}</td>
        <td>${escapeHtml(parent)}</td>
        <td>${escapeHtml(type)}</td>
      </tr>
    `;
  }).join('');
}
