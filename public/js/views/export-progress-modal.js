/**
 * Modal view for displaying real-time export progress.
 * Connects to SSE endpoint and shows progress bar, ETA, status.
 */

import { escapeHtml } from '../utils/dom-helpers.js';

export class ExportProgressModal {
  constructor() {
    this.modalElement = null;
    this.cancelCallback = null;
    this.closeSSE = null;
    this._boundKeyHandler = null;
  }
  
  /**
   * Show the progress modal and start export.
   * @param {Object} options
   * @param {Object} options.stats - Pre-scan stats (for total counts)
   * @param {number} options.workers - Number of workers
   * @param {number} options.delay - Delay between calls
   * @param {function} options.onComplete - Called with result when done
   * @param {function} options.onCancel - Called when user cancels
   * @param {function} options.onError - Called on error
   * @param {function} options.startExport - Function that starts the SSE export
   */
  show({ stats, workers = 4, delay = 100, onComplete, onCancel, onError, startExport }) {
    // Remove existing modal
    this.hide();
    
    // Create modal
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-progress-modal-overlay';
    this.modalElement.setAttribute('role', 'dialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-label', 'Export progress');
    this.modalElement.innerHTML = this.renderInitialContent(stats);
    
    // Bind cancel button
    this.modalElement.querySelector('.export-progress-cancel-btn')
      ?.addEventListener('click', () => this.handleCancel(onCancel));
    
    // Keyboard handler for escape
    this._boundKeyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleCancel(onCancel);
      }
    };
    document.addEventListener('keydown', this._boundKeyHandler);
    
    // Add to DOM
    document.body.appendChild(this.modalElement);
    
    // Start the export with SSE
    this.closeSSE = startExport({
      workers,
      delay,
      onProgress: (event) => this.handleProgress(event),
      onComplete: (result) => this.handleComplete(result, onComplete),
      onError: (error) => this.handleError(error, onError)
    });
  }
  
  /**
   * Render initial modal content.
   */
  renderInitialContent(stats) {
    const totalAssemblies = stats?.estimates?.assembliesFound || 0;
    
    return `
      <div class="export-progress-modal">
        <div class="export-progress-modal-header">
          <h2>Exporting BOMs</h2>
        </div>
        
        <div class="export-progress-modal-body">
          <!-- Progress Bar -->
          <div class="export-progress-bar-container">
            <div class="export-progress-bar" style="width: 0%"></div>
            <span class="export-progress-bar-text">0%</span>
          </div>
          
          <!-- Phase Status -->
          <div class="export-progress-status">
            <div class="export-progress-phase">
              <span class="export-progress-phase-icon">🔍</span>
              <span class="export-progress-phase-text">Initializing...</span>
            </div>
          </div>
          
          <!-- Counts -->
          <div class="export-progress-counts">
            <div class="export-progress-count-item">
              <span class="export-progress-count-icon">📁</span>
              <span class="export-progress-count-label">Folders</span>
              <span class="export-progress-count-value" data-count="folders">-</span>
            </div>
            <div class="export-progress-count-item">
              <span class="export-progress-count-icon">📄</span>
              <span class="export-progress-count-label">Documents</span>
              <span class="export-progress-count-value" data-count="documents">-</span>
            </div>
            <div class="export-progress-count-item">
              <span class="export-progress-count-icon">🏗️</span>
              <span class="export-progress-count-label">Assemblies</span>
              <span class="export-progress-count-value" data-count="assemblies">
                0 / ${escapeHtml(String(totalAssemblies))}
              </span>
            </div>
          </div>
          
          <!-- Current Item -->
          <div class="export-progress-current">
            <span class="export-progress-current-label">Current:</span>
            <span class="export-progress-current-value">-</span>
          </div>
          
          <!-- ETA -->
          <div class="export-progress-eta">
            <span class="export-progress-eta-icon">⏱️</span>
            <span class="export-progress-eta-value">Calculating...</span>
          </div>
          
          <!-- Error/Warning Messages -->
          <div class="export-progress-messages" style="display: none;">
            <div class="export-progress-messages-header">
              <span>⚠️ Warnings</span>
              <span class="export-progress-messages-count">0</span>
            </div>
            <div class="export-progress-messages-list"></div>
          </div>
        </div>
        
        <div class="export-progress-modal-footer">
          <button class="export-progress-cancel-btn">Cancel Export</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Handle progress event from SSE.
   */
  handleProgress(event) {
    if (!this.modalElement) return;
    
    const { phase, scan, fetch, timing, error } = event;
    
    // Log to console
    this.logProgress(event);
    
    // Update phase indicator
    this.updatePhase(phase, fetch);
    
    // Update counts based on phase
    if (phase === 'scanning' && scan) {
      this.updateCount('folders', scan.foldersScanned);
      this.updateCount('documents', scan.documentsScanned);
    }
    
    if (phase === 'fetching' && fetch) {
      // Update progress bar
      const percent = fetch.total > 0 ? Math.round((fetch.current / fetch.total) * 100) : 0;
      this.updateProgressBar(percent);
      
      // Update assembly count
      this.updateCount('assemblies', `${fetch.current} / ${fetch.total}`);
      
      // Update current item
      const path = fetch.currentPath?.length > 0 
        ? fetch.currentPath.join(' / ') + ' / '
        : '';
      this.updateCurrentItem(`${path}${fetch.currentAssembly || ''}`);
      
      // Update ETA
      if (timing?.estimatedRemainingMs != null) {
        this.updateETA(timing.estimatedRemainingMs);
      }
    }
    
    // Handle per-assembly errors (warnings)
    if (error) {
      this.addWarning(`${error.assembly || 'Unknown'}: ${error.message}`);
    }
  }
  
  /**
   * Log progress to browser console with detailed information.
   */
  logProgress(event) {
    const { phase, scan, fetch, timing, error } = event;
    const prefix = '[AggregateBOM]';
    
    switch (phase) {
      case 'initializing':
        console.log(`${prefix} ════════════════════════════════════════`);
        console.log(`${prefix} 🚀 Starting export...`);
        console.log(`${prefix} ════════════════════════════════════════`);
        break;
        
      case 'scanning':
        if (scan) {
          // Log current path if available
          const pathStr = scan.currentPath?.length > 0 
            ? scan.currentPath.join(' / ') 
            : '/';
          
          console.log(
            `${prefix} 📁 Scanning: ${scan.foldersScanned} folders, ` +
            `${scan.documentsScanned} documents | Path: ${pathStr}`
          );
          
          // Log element counts if available
          if (scan.elementCounts) {
            const { ASSEMBLY, PARTSTUDIO, DRAWING, BLOB, OTHER } = scan.elementCounts;
            console.log(
              `${prefix}    Elements: 🏗️ ${ASSEMBLY} assemblies, ` +
              `🔧 ${PARTSTUDIO} part studios, 📐 ${DRAWING} drawings, ` +
              `📦 ${BLOB} blobs, 📄 ${OTHER} other`
            );
          }
          
          // Log root folder status changes
          if (scan.rootFolders) {
            const scanning = scan.rootFolders.filter(f => f.status === 'scanning');
            const scanned = scan.rootFolders.filter(f => f.status === 'scanned');
            if (scanning.length > 0) {
              console.log(
                `${prefix}    Root folders: ${scanned.length} scanned, ` +
                `${scanning.length} scanning (${scanning.map(f => f.name).join(', ')})`
              );
            }
          }
        }
        break;
        
      case 'fetching':
        if (fetch) {
          const pct = fetch.total > 0 ? Math.round((fetch.current / fetch.total) * 100) : 0;
          const path = fetch.currentPath?.length > 0 
            ? fetch.currentPath.join('/') + '/'
            : '';
          
          // Use different log levels based on success/failure
          const status = fetch.failed > 0 
            ? `✓${fetch.succeeded} ✗${fetch.failed}` 
            : `✓${fetch.succeeded}`;
          
          console.log(
            `${prefix} 🏗️ [${pct}%] ${fetch.current}/${fetch.total} (${status}): ` +
            `${path}${fetch.currentAssembly || ''}`
          );
          
          if (timing && timing.avgFetchMs > 0) {
            const etaSec = Math.ceil(timing.estimatedRemainingMs / 1000);
            const etaStr = etaSec >= 60 
              ? `${Math.floor(etaSec / 60)}m ${etaSec % 60}s`
              : `${etaSec}s`;
            console.log(
              `${prefix}    ⏱️ Elapsed: ${Math.floor(timing.elapsedMs / 1000)}s | ` +
              `Avg: ${timing.avgFetchMs}ms | ETA: ~${etaStr}`
            );
          }
        }
        break;
        
      case 'complete':
        console.log(`${prefix} ════════════════════════════════════════`);
        console.log(`${prefix} ✅ Export Complete`);
        console.log(`${prefix} ════════════════════════════════════════`);
        break;
        
      case 'error':
        console.error(`${prefix} ════════════════════════════════════════`);
        console.error(`${prefix} ❌ Export Failed`);
        console.error(`${prefix} ════════════════════════════════════════`);
        break;
    }
    
    if (error) {
      console.warn(
        `${prefix} ⚠️ Error on "${error.assembly || 'unknown'}": ${error.message}`
      );
    }
  }
  
  /**
   * Update phase indicator.
   */
  updatePhase(phase, fetch) {
    const phaseEl = this.modalElement?.querySelector('.export-progress-phase');
    if (!phaseEl) return;
    
    const iconEl = phaseEl.querySelector('.export-progress-phase-icon');
    const textEl = phaseEl.querySelector('.export-progress-phase-text');
    
    switch (phase) {
      case 'initializing':
        if (iconEl) iconEl.textContent = '🔍';
        if (textEl) textEl.textContent = 'Initializing...';
        break;
      case 'scanning':
        if (iconEl) iconEl.textContent = '📁';
        if (textEl) textEl.textContent = 'Scanning folders...';
        break;
      case 'fetching':
        if (iconEl) iconEl.textContent = '🏗️';
        const status = fetch 
          ? `Fetching BOMs (${fetch.succeeded} succeeded, ${fetch.failed} failed)`
          : 'Fetching BOMs...';
        if (textEl) textEl.textContent = status;
        break;
    }
  }
  
  /**
   * Update progress bar.
   */
  updateProgressBar(percent) {
    const bar = this.modalElement?.querySelector('.export-progress-bar');
    const text = this.modalElement?.querySelector('.export-progress-bar-text');
    
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  }
  
  /**
   * Update a count display.
   */
  updateCount(type, value) {
    const el = this.modalElement?.querySelector(`[data-count="${type}"]`);
    if (el) el.textContent = String(value);
  }
  
  /**
   * Update current item display.
   */
  updateCurrentItem(text) {
    const el = this.modalElement?.querySelector('.export-progress-current-value');
    if (el) el.textContent = text || '-';
  }
  
  /**
   * Update ETA display.
   */
  updateETA(remainingMs) {
    const el = this.modalElement?.querySelector('.export-progress-eta-value');
    if (!el) return;
    
    if (remainingMs <= 0) {
      el.textContent = 'Almost done...';
      return;
    }
    
    const seconds = Math.ceil(remainingMs / 1000);
    if (seconds < 60) {
      el.textContent = `~${seconds} seconds remaining`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      el.textContent = `~${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
  }
  
  /**
   * Add a warning message.
   */
  addWarning(message) {
    const container = this.modalElement?.querySelector('.export-progress-messages');
    const list = this.modalElement?.querySelector('.export-progress-messages-list');
    const countEl = this.modalElement?.querySelector('.export-progress-messages-count');
    
    if (!container || !list) return;
    
    // Show container
    container.style.display = 'block';
    
    // Add message
    const msgEl = document.createElement('div');
    msgEl.className = 'export-progress-message-item';
    msgEl.textContent = message;
    list.appendChild(msgEl);
    
    // Update count
    const count = list.children.length;
    if (countEl) countEl.textContent = String(count);
    
    // Scroll to bottom
    list.scrollTop = list.scrollHeight;
  }
  
  /**
   * Handle export completion.
   */
  handleComplete(result, callback) {
    console.log('[AggregateBOM] ════════════════════════════════════════');
    console.log('[AggregateBOM] ✅ Export Complete');
    console.log(`[AggregateBOM]    Duration: ${(result.metadata?.exportDurationMs / 1000).toFixed(1)}s`);
    console.log(`[AggregateBOM]    Assemblies: ${result.summary?.assembliesSucceeded}/${result.summary?.assembliesFound}`);
    console.log(`[AggregateBOM]    BOM Rows: ${result.summary?.totalBomRows}`);
    console.log('[AggregateBOM] ════════════════════════════════════════');
    
    // Update UI to complete state
    this.updateProgressBar(100);
    
    const phaseEl = this.modalElement?.querySelector('.export-progress-phase');
    if (phaseEl) {
      const iconEl = phaseEl.querySelector('.export-progress-phase-icon');
      const textEl = phaseEl.querySelector('.export-progress-phase-text');
      if (iconEl) iconEl.textContent = '✅';
      if (textEl) textEl.textContent = 'Export complete!';
    }
    
    // Update ETA
    const etaEl = this.modalElement?.querySelector('.export-progress-eta-value');
    if (etaEl && result.metadata?.exportDurationMs) {
      etaEl.textContent = `Completed in ${(result.metadata.exportDurationMs / 1000).toFixed(1)}s`;
    }
    
    // Change cancel button to close
    const cancelBtn = this.modalElement?.querySelector('.export-progress-cancel-btn');
    if (cancelBtn) {
      cancelBtn.textContent = 'Close';
      cancelBtn.onclick = () => this.hide();
    }
    
    // Call completion callback
    if (callback) callback(result);
  }
  
  /**
   * Handle export error.
   */
  handleError(error, callback) {
    console.error('[AggregateBOM] ❌ Export failed:', error.message);
    
    // Update UI to error state
    const phaseEl = this.modalElement?.querySelector('.export-progress-phase');
    if (phaseEl) {
      const iconEl = phaseEl.querySelector('.export-progress-phase-icon');
      const textEl = phaseEl.querySelector('.export-progress-phase-text');
      if (iconEl) iconEl.textContent = '❌';
      if (textEl) textEl.textContent = `Error: ${error.message}`;
      phaseEl.classList.add('export-progress-phase-error');
    }
    
    // Update ETA
    const etaEl = this.modalElement?.querySelector('.export-progress-eta-value');
    if (etaEl) etaEl.textContent = 'Export failed';
    
    // Change cancel button to close
    const cancelBtn = this.modalElement?.querySelector('.export-progress-cancel-btn');
    if (cancelBtn) {
      cancelBtn.textContent = 'Close';
      cancelBtn.onclick = () => this.hide();
    }
    
    // Call error callback
    if (callback) callback(error);
  }
  
  /**
   * Handle cancel button click.
   */
  handleCancel(callback) {
    console.log('[AggregateBOM] 🚫 Export cancelled by user');
    
    // Close SSE connection
    if (this.closeSSE) {
      this.closeSSE();
      this.closeSSE = null;
    }
    
    // Hide modal
    this.hide();
    
    // Call cancel callback
    if (callback) callback();
  }
  
  /**
   * Hide and clean up the modal.
   */
  hide() {
    // Remove keyboard handler
    if (this._boundKeyHandler) {
      document.removeEventListener('keydown', this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
    
    // Close SSE if still open
    if (this.closeSSE) {
      this.closeSSE();
      this.closeSSE = null;
    }
    
    // Remove modal
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }
}

// Export singleton instance
export const exportProgressModal = new ExportProgressModal();
