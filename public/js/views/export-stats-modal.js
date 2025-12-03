/**
 * Modal view for displaying pre-scan export statistics.
 * Shows before starting full aggregate BOM export.
 * Enhanced with live stats, root folder visualization, and cancel/resume capability.
 */

import { escapeHtml } from '../utils/dom-helpers.js';

export class ExportStatsModal {
  constructor() {
    this.modalElement = null;
    this.onConfirm = null;
    this.onCancel = null;
    this._boundKeyHandler = null;
    this._onCancelScan = null;
    
    // Scan state tracking for live updates
    this.scanState = {
      startTime: null,
      elapsedInterval: null,
      rootFolders: [],
      checkpoint: null
    };
  }

  /**
   * Show the export stats modal.
   * @param {Object} stats - Directory stats from API
   * @param {Object} options - Callbacks for confirm/cancel
   * @param {boolean} options.isPartial - Whether this is a partial export
   * @param {number} options.selectionCount - Number of selected items
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
    // Stop elapsed timer if running
    if (this.scanState.elapsedInterval) {
      clearInterval(this.scanState.elapsedInterval);
      this.scanState.elapsedInterval = null;
    }
    
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    
    // Clear checkpoint on successful completion (when hide is called without cancel)
    // Only clear if we completed normally (not cancelled)
  }

  /**
   * Clear checkpoint after successful export completion.
   */
  clearCheckpointOnSuccess() {
    this._clearCheckpoint();
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
   * @param {Object} context - Context for partial export
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

    // Title and icon based on scope
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
   * Enhanced with live stats display.
   */
  showLoading() {
    // Remove existing modal if present
    this.hide();
    
    // Check for existing checkpoint
    const checkpoint = this._loadCheckpoint();
    
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-stats-modal-overlay';
    this.modalElement.setAttribute('role', 'dialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-label', 'Scanning workspace');
    this.modalElement.innerHTML = this._renderScanningContent(checkpoint);
    
    // Bind cancel button
    this.modalElement.querySelector('.export-stats-cancel-btn')
      ?.addEventListener('click', () => this._handleScanCancel());
    
    // Bind clear checkpoint button if present
    this.modalElement.querySelector('.scan-resume-clear-btn')
      ?.addEventListener('click', () => {
        this._clearCheckpoint();
        const notice = this.modalElement?.querySelector('.scan-resume-notice');
        if (notice) notice.style.display = 'none';
      });
    
    // Start elapsed timer
    this.scanState.startTime = Date.now();
    this.scanState.elapsedInterval = setInterval(() => this._updateElapsed(), 1000);
    
    document.body.appendChild(this.modalElement);
  }

  /**
   * Render scanning modal content with live stats.
   * @param {Object|null} checkpoint - Existing checkpoint if resuming
   * @returns {string} HTML string
   */
  _renderScanningContent(checkpoint) {
    const resumeNotice = checkpoint ? `
      <div class="scan-resume-notice">
        <span>📌 Resuming from checkpoint: ${checkpoint.partialStats?.foldersScanned || 0} folders scanned</span>
        <button class="scan-resume-clear-btn" type="button">Start Fresh</button>
      </div>
    ` : '';
    
    return `
      <div class="export-stats-modal export-stats-modal-scanning">
        <div class="export-stats-modal-header">
          <span class="export-stats-modal-icon">🔍</span>
          <h2>Scanning Workspace</h2>
        </div>
        
        <div class="export-stats-modal-body">
          ${resumeNotice}
          
          <div class="scan-live-stats">
            <div class="scan-stat-row">
              <span class="scan-stat-icon">📁</span>
              <span class="scan-stat-label">Folders Scanned:</span>
              <span class="scan-stat-value" data-stat="folders">0</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">📄</span>
              <span class="scan-stat-label">Documents Found:</span>
              <span class="scan-stat-value" data-stat="documents">0</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">🏗️</span>
              <span class="scan-stat-label">Assemblies:</span>
              <span class="scan-stat-value" data-stat="assemblies">0</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">🔧</span>
              <span class="scan-stat-label">Part Studios:</span>
              <span class="scan-stat-value" data-stat="partstudios">0</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">📐</span>
              <span class="scan-stat-label">Drawings:</span>
              <span class="scan-stat-value" data-stat="drawings">0</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">📦</span>
              <span class="scan-stat-label">Blobs:</span>
              <span class="scan-stat-value" data-stat="blobs">0</span>
            </div>
            <div class="scan-stat-row scan-stat-path">
              <span class="scan-stat-icon">📍</span>
              <span class="scan-stat-label">Current Path:</span>
              <span class="scan-stat-value" data-stat="currentPath">/</span>
            </div>
            <div class="scan-stat-row">
              <span class="scan-stat-icon">⏱️</span>
              <span class="scan-stat-label">Elapsed:</span>
              <span class="scan-stat-value" data-stat="elapsed">0:00</span>
            </div>
          </div>
          
          <div class="scan-root-folders">
            <h4>Root Folders</h4>
            <div class="scan-root-folders-list" data-container="rootFolders">
              <div class="scan-root-folder-placeholder">Loading folders...</div>
            </div>
          </div>
        </div>
        
        <div class="export-stats-modal-footer">
          <button class="export-stats-cancel-btn" type="button">Cancel Scan</button>
        </div>
      </div>
    `;
  }

  /**
   * Update a scan statistic value.
   * @param {string} stat - Stat key (folders, documents, assemblies, etc.)
   * @param {string|number} value - New value
   */
  updateScanStat(stat, value) {
    const el = this.modalElement?.querySelector(`[data-stat="${stat}"]`);
    if (el) el.textContent = String(value);
  }

  /**
   * Update root folders display.
   * @param {Array} folders - Array of folder objects with id, name, status, documentCount
   */
  updateRootFolders(folders) {
    this.scanState.rootFolders = folders;
    const container = this.modalElement?.querySelector('[data-container="rootFolders"]');
    if (!container) return;
    
    if (!folders || folders.length === 0) {
      container.innerHTML = '<div class="scan-root-folder-placeholder">No root folders found</div>';
      return;
    }
    
    container.innerHTML = folders.map(folder => `
      <div class="scan-root-folder ${escapeHtml(folder.status || 'upcoming')}">
        <span class="scan-root-folder-icon">${this._getStatusIcon(folder.status)}</span>
        <span class="scan-root-folder-name">${escapeHtml(folder.name || 'Unknown')}</span>
        <span class="scan-root-folder-info">${escapeHtml(this._getStatusText(folder))}</span>
      </div>
    `).join('');
  }

  /**
   * Get status icon for root folder.
   * @param {string} status - Folder status
   * @returns {string} Emoji icon
   */
  _getStatusIcon(status) {
    switch (status) {
      case 'scanned': return '✅';
      case 'scanning': return '🔄';
      case 'upcoming': return '⏳';
      case 'ignored': return '🚫';
      default: return '❓';
    }
  }

  /**
   * Get status text for root folder.
   * @param {Object} folder - Folder object
   * @returns {string} Status description
   */
  _getStatusText(folder) {
    switch (folder.status) {
      case 'scanned': return `${folder.documentCount || 0} docs`;
      case 'scanning': return 'scanning...';
      case 'upcoming': return 'queued';
      case 'ignored': return 'filtered out';
      default: return '';
    }
  }

  /**
   * Update elapsed time display.
   */
  _updateElapsed() {
    if (!this.scanState.startTime) return;
    const elapsed = Math.floor((Date.now() - this.scanState.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.updateScanStat('elapsed', `${mins}:${secs.toString().padStart(2, '0')}`);
  }

  /**
   * Handle scan cancel button click.
   */
  _handleScanCancel() {
    // Stop elapsed timer
    if (this.scanState.elapsedInterval) {
      clearInterval(this.scanState.elapsedInterval);
      this.scanState.elapsedInterval = null;
    }
    
    // Signal cancellation to controller
    if (this._onCancelScan) {
      this._onCancelScan();
    }
    
    // Prompt for checkpoint save if we have progress
    const foldersScanned = parseInt(this.modalElement?.querySelector('[data-stat="folders"]')?.textContent || '0');
    if (foldersScanned > 0 && this.scanState.rootFolders.length > 0) {
      const saveCheckpoint = confirm('Save progress to resume later?');
      if (saveCheckpoint) {
        this._saveCheckpoint();
      }
    }
    
    this.hide();
    
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * Save scan checkpoint to sessionStorage.
   */
  _saveCheckpoint() {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      rootFolders: this.scanState.rootFolders,
      partialStats: {
        foldersScanned: parseInt(this.modalElement?.querySelector('[data-stat="folders"]')?.textContent || '0'),
        documentsScanned: parseInt(this.modalElement?.querySelector('[data-stat="documents"]')?.textContent || '0')
      }
    };
    try {
      sessionStorage.setItem('exportScanCheckpoint', JSON.stringify(checkpoint));
    } catch (e) {
      console.warn('Failed to save scan checkpoint:', e);
    }
  }

  /**
   * Load scan checkpoint from sessionStorage.
   * @returns {Object|null} Checkpoint data or null
   */
  _loadCheckpoint() {
    try {
      const data = sessionStorage.getItem('exportScanCheckpoint');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear scan checkpoint from sessionStorage.
   */
  _clearCheckpoint() {
    try {
      sessionStorage.removeItem('exportScanCheckpoint');
    } catch (e) {
      console.warn('Failed to clear scan checkpoint:', e);
    }
  }

  /**
   * Set cancel callback for scan phase.
   * @param {function} callback - Called when user cancels scan
   */
  setOnCancelScan(callback) {
    this._onCancelScan = callback;
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
