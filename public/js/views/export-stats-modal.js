/**
 * Modal view for displaying pre-scan export statistics.
 * Shows before starting full aggregate BOM export.
 */

import { escapeHtml } from '../utils/dom-helpers.js';

export class ExportStatsModal {
  constructor() {
    this.modalElement = null;
    this.onConfirm = null;
    this.onCancel = null;
    this._boundKeyHandler = null;
  }

  /**
   * Show the export stats modal.
   * @param {Object} stats - Directory stats from API
   * @param {Object} options - Callbacks for confirm/cancel
   * @param {boolean} options.isPartial - Whether this is a partial export (Phase 4.7)
   * @param {number} options.selectionCount - Number of selected items (Phase 4.7)
   * @param {string} options.prefixFilter - Active prefix filter (if any)
   */
  show(stats, { onConfirm, onCancel, isPartial = false, selectionCount = 0, prefixFilter = null }) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    // Remove existing modal if present
    this.hide();

    // Create modal element
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-stats-modal-overlay';
    this.modalElement.setAttribute('role', 'dialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-labelledby', 'export-stats-title');
    this.modalElement.innerHTML = this.renderModalContent(stats, { isPartial, selectionCount, prefixFilter });

    // Add event listeners
    this.modalElement.querySelector('.export-stats-cancel-btn')
      ?.addEventListener('click', () => this.handleCancel());
    this.modalElement.querySelector('.export-stats-confirm-btn')
      ?.addEventListener('click', () => this.handleConfirm());

    // Close on overlay click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) this.handleCancel();
    });

    // Keyboard navigation
    this._boundKeyHandler = (e) => this._handleKeyDown(e);
    document.addEventListener('keydown', this._boundKeyHandler);

    // Add to DOM
    document.body.appendChild(this.modalElement);

    // Focus the confirm button for accessibility
    const confirmBtn = this.modalElement.querySelector('.export-stats-confirm-btn');
    if (confirmBtn) {
      requestAnimationFrame(() => confirmBtn.focus());
    }
  }

  /**
   * Hide and remove the modal.
   */
  hide() {
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  /**
   * Handle keyboard events for accessibility.
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.handleCancel();
    } else if (e.key === 'Tab' && this.modalElement) {
      // Trap focus within modal
      const focusable = this.modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  /**
   * Render modal HTML content.
   * @param {Object} stats - Directory stats
   * @param {Object} context - Context for partial export (Phase 4.7)
   * @returns {string} HTML string
   */
  renderModalContent(stats, { isPartial = false, selectionCount = 0, prefixFilter = null } = {}) {
    const { summary, elementTypes, estimates } = stats;

    // Format estimated time
    const estMinutes = estimates?.estimatedTimeMinutes || 0;
    const timeDisplay = estMinutes < 1
      ? 'Less than 1 minute'
      : estMinutes === 1
        ? '~1 minute'
        : `~${estMinutes} minutes`;

    // Format scan duration
    const scanDurationSec = stats.scanDurationMs 
      ? (stats.scanDurationMs / 1000).toFixed(1) 
      : '?';

    // Phase 4.7: Title and icon based on scope
    const title = isPartial
      ? `Selected Items Scan (${selectionCount} items)`
      : 'Workspace Scan Complete';
    const icon = isPartial ? '📋' : '📊';
    const confirmText = isPartial ? 'Export Selected' : 'Start Export';

    // Filter badge for display
    const filterBadgeHtml = prefixFilter
      ? `<div class="export-stats-filter-badge">
           <span class="export-stats-filter-icon">🔍</span>
           Filtered: <code>${escapeHtml(prefixFilter)}*</code>
         </div>`
      : '';

    return `
      <div class="export-stats-modal">
        <div class="export-stats-modal-header">
          <span class="export-stats-modal-icon">${icon}</span>
          <h2 id="export-stats-title">${escapeHtml(title)}</h2>
          ${filterBadgeHtml}
        </div>

        <div class="export-stats-modal-body">
          <div class="export-stats-section">
            <h3>Structure</h3>
            <p class="export-stats-scan-info">Scanned in ${escapeHtml(scanDurationSec)}s</p>
            <div class="export-stats-grid">
              <div class="export-stats-item">
                <span class="export-stats-value">${escapeHtml(String(summary?.totalFolders || 0))}</span>
                <span class="export-stats-label">Folders</span>
              </div>
              <div class="export-stats-item">
                <span class="export-stats-value">${escapeHtml(String(summary?.totalDocuments || 0))}</span>
                <span class="export-stats-label">Documents</span>
              </div>
              <div class="export-stats-item">
                <span class="export-stats-value">${escapeHtml(String(summary?.maxDepth || 0))}</span>
                <span class="export-stats-label">Max Depth</span>
              </div>
            </div>
          </div>

          <div class="export-stats-section">
            <h3>Element Types</h3>
            <div class="export-stats-elements">
              <div class="export-stats-element-row">
                <span class="export-stats-element-icon">🏗️</span>
                <span class="export-stats-element-name">Assemblies</span>
                <span class="export-stats-element-count">${escapeHtml(String(elementTypes?.ASSEMBLY || 0))}</span>
                <span class="export-stats-element-note">← will export BOM</span>
              </div>
              <div class="export-stats-element-row">
                <span class="export-stats-element-icon">🔧</span>
                <span class="export-stats-element-name">Part Studios</span>
                <span class="export-stats-element-count">${escapeHtml(String(elementTypes?.PARTSTUDIO || 0))}</span>
              </div>
              <div class="export-stats-element-row">
                <span class="export-stats-element-icon">📐</span>
                <span class="export-stats-element-name">Drawings</span>
                <span class="export-stats-element-count">${escapeHtml(String(elementTypes?.DRAWING || 0))}</span>
              </div>
              ${(elementTypes?.BLOB || 0) > 0 ? `
              <div class="export-stats-element-row">
                <span class="export-stats-element-icon">📁</span>
                <span class="export-stats-element-name">Blobs</span>
                <span class="export-stats-element-count">${escapeHtml(String(elementTypes.BLOB))}</span>
              </div>
              ` : ''}
              ${(elementTypes?.OTHER || 0) > 0 ? `
              <div class="export-stats-element-row">
                <span class="export-stats-element-icon">📄</span>
                <span class="export-stats-element-name">Other</span>
                <span class="export-stats-element-count">${escapeHtml(String(elementTypes.OTHER))}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="export-stats-section export-stats-estimate">
            <div class="export-stats-estimate-box">
              <span class="export-stats-estimate-icon">⏱️</span>
              <div class="export-stats-estimate-text">
                <span class="export-stats-estimate-time">${escapeHtml(timeDisplay)}</span>
                <span class="export-stats-estimate-detail">
                  (${escapeHtml(String(estimates?.assembliesFound || 0))} assemblies × ~5 sec average)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="export-stats-modal-footer">
          <button class="export-stats-cancel-btn" type="button">Cancel</button>
          <button class="export-stats-confirm-btn" type="button">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
  }

  /**
   * Handle confirm button click.
   */
  handleConfirm() {
    this.hide();
    if (this.onConfirm) {
      this.onConfirm();
    }
  }

  /**
   * Handle cancel button click.
   */
  handleCancel() {
    this.hide();
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * Show loading state while pre-scan is running.
   */
  showLoading() {
    // Remove existing modal if present
    this.hide();

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-stats-modal-overlay';
    this.modalElement.setAttribute('role', 'dialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-label', 'Scanning workspace');
    this.modalElement.innerHTML = `
      <div class="export-stats-modal export-stats-modal-loading">
        <div class="export-stats-loading-content">
          <div class="export-stats-spinner"></div>
          <p>Scanning workspace...</p>
          <p class="export-stats-loading-detail">This may take a minute for large workspaces</p>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);
  }

  /**
   * Show error state.
   * @param {string} message - Error message
   */
  showError(message) {
    this.hide();

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-stats-modal-overlay';
    this.modalElement.setAttribute('role', 'alertdialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-label', 'Scan failed');
    this.modalElement.innerHTML = `
      <div class="export-stats-modal export-stats-modal-error">
        <div class="export-stats-error-content">
          <span class="export-stats-error-icon">❌</span>
          <h2>Scan Failed</h2>
          <p>${escapeHtml(message)}</p>
          <button class="export-stats-cancel-btn" type="button">Close</button>
        </div>
      </div>
    `;

    this.modalElement.querySelector('.export-stats-cancel-btn')
      ?.addEventListener('click', () => this.hide());

    // Keyboard handler for escape
    this._boundKeyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      }
    };
    document.addEventListener('keydown', this._boundKeyHandler);

    document.body.appendChild(this.modalElement);

    // Focus the close button
    const closeBtn = this.modalElement.querySelector('.export-stats-cancel-btn');
    if (closeBtn) {
      requestAnimationFrame(() => closeBtn.focus());
    }
  }
}

// Export singleton instance
export const exportStatsModal = new ExportStatsModal();
