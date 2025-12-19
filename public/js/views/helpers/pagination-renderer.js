/**
 * Pure rendering functions for pagination controls
 */

import { escapeHtml } from "../../utils/dom-helpers.js";

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
        <button class="btn btn-sm pagination-btn" data-action="first" ${
          firstDisabled ? "disabled" : ""
        } title="First page">
          &laquo;&laquo;
        </button>
        <button class="btn btn-sm pagination-btn" data-action="prev" ${
          firstDisabled ? "disabled" : ""
        } title="Previous page">
          &lsaquo;
        </button>
        <span class="page-indicator">
          <span>Page</span>
          <input type="number" class="page-jump" value="${currentPage}" min="1" max="${totalPages}" ${
    totalPages === 0 ? "disabled" : ""
  }>
          <span>of ${totalPages}</span>
        </span>
        <button class="btn btn-sm pagination-btn" data-action="next" ${
          lastDisabled ? "disabled" : ""
        } title="Next page">
          &rsaquo;
        </button>
        <button class="btn btn-sm pagination-btn" data-action="last" ${
          lastDisabled ? "disabled" : ""
        } title="Last page">
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
    .map(
      (size) =>
        `<option value="${size}" ${
          size === currentSize ? "selected" : ""
        }>${size}</option>`
    )
    .join("");
}

/**
 * Insert zero-width space BEFORE natural word separators to allow line breaks
 * This prevents breaks in the middle of words like "PCBAs" becoming "PCB" + "As"
 * The break opportunity is placed BEFORE the separator, so the separator stays with the following text
 */
function wrapAtSeparators(text) {
  if (!text) return "";
  // Insert zero-width space BEFORE separators (not after) to keep separator with following word
  // This prevents "600_D01_PCBAs" from breaking as "600_D01_PCB" + "As"
  return String(text).replace(/([_\-./])/g, "\u200B$1");
}

/**
 * Build the location/folder path string from document data
 * @param {object} doc - Document object
 * @returns {string} Location path string
 */
function buildLocationPath(doc) {
  // Try to get path from various possible sources in the document data
  // Priority order based on what OnShape API returns:

  // 1. Check for parentPath array (if backend provides full path)
  if (
    doc.parentPath &&
    Array.isArray(doc.parentPath) &&
    doc.parentPath.length > 0
  ) {
    return doc.parentPath.join(" / ");
  }

  // 2. Check for pathToRoot array (OnShape API structure - from globaltreenodes)
  if (
    doc.pathToRoot &&
    Array.isArray(doc.pathToRoot) &&
    doc.pathToRoot.length > 0
  ) {
    // pathToRoot is typically ordered from root to immediate parent
    const names = doc.pathToRoot
      .map((item) => item.name || item.id)
      .filter(Boolean);
    return names.join(" / ");
  }

  // 3. Check for treeHref and extract folder info from URL pattern
  // treeHref format: "https://cad.onshape.com/api/globaltreenodes/folder/{folderId}"
  if (doc.treeHref && typeof doc.treeHref === "string") {
    // For documents, treeHref points to their containing folder
    // We can show the parentName if available, or indicate folder exists
    if (doc.parentName) {
      return doc.parentName;
    }
  }

  // 4. Check for parentFolderName (custom field)
  if (doc.parentFolderName) {
    return doc.parentFolderName;
  }

  // 5. Check for parent object with name
  if (doc.parent?.name) {
    return doc.parent.name;
  }

  // 6. Fall back to parentName if available
  if (doc.parentName) {
    return doc.parentName;
  }

  // 7. Check owner name as workspace indicator (for root-level documents)
  if (doc.owner?.name && !doc.parentId) {
    return `${doc.owner.name} (Root)`;
  }

  // 8. Check resourceType for root-level documents
  if (doc.resourceType === "magic" || !doc.parentId) {
    return "Root";
  }

  // 9. If parentId exists but no name resolved, indicate folder exists
  // Note: OnShape's /documents endpoint doesn't include folder names directly
  // Full path would require additional API calls per document
  if (doc.parentId) {
    return doc.parentId;
  }

  return "Root";
}

/**
 * Render document table rows
 * Columns: Name, Date Modified, Location
 * @param {Array} documents - Array of document objects
 * @returns {string} HTML string
 */
export function renderDocumentRows(documents) {
  if (!documents || documents.length === 0) {
    return "";
  }

  return documents
    .map((doc) => {
      const modified = doc.modifiedAt
        ? new Date(doc.modifiedAt).toLocaleString()
        : "-";
      const location = buildLocationPath(doc);

      // Escape first, then wrap at separators for proper line breaking
      const escapedName = escapeHtml(doc.name);
      const wrappedName = wrapAtSeparators(escapedName);

      // Wrap location at separators for better display of paths
      const escapedLocation = escapeHtml(location);
      const wrappedLocation = wrapAtSeparators(escapedLocation);

      return `
      <tr class="document-card" data-id="${escapeHtml(doc.id)}">
        <td class="doc-file-title">${wrappedName}</td>
        <td class="doc-date-modified">${escapeHtml(modified)}</td>
        <td class="doc-modified-by">${escapeHtml(
          doc.modifiedBy?.name || "-"
        )}</td>
        <td class="doc-location">${wrappedLocation}</td>
      </tr>
    `;
    })
    .join("");
}
