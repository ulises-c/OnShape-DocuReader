/**
 * Modal for configuring export filters before pre-scan.
 * Allows filtering by folder prefix to limit scope of export.
 */

import { escapeHtml } from '../utils/dom-helpers.js';

export class ExportFilterModal {
  constructor() {
    this.modalElement = null;
    this._boundKeyHandler = null;
    this._resolvePromise = null;
  }

  /**
   * Show the filter modal and wait for user input.
   * @returns {Promise<Object|null>} Filter options or null if cancelled
   */
  prompt() {
    return new Promise((resolve) => {
      this._resolvePromise = resolve;
      this._show();
    });
  }

  /**
   * Show the modal.
   */
  _show() {
    // Remove existing modal if present
    this.hide();

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'export-filter-modal-overlay';
    this.modalElement.setAttribute('role', 'dialog');
    this.modalElement.setAttribute('aria-modal', 'true');
    this.modalElement.setAttribute('aria-labelledby', 'export-filter-title');
    this.modalElement.innerHTML = this._renderContent();

    // Add event listeners
    this.modalElement.querySelector('.export-filter-cancel-btn')
      ?.addEventListener('click', () => this._handleCancel());
    this.modalElement.querySelector('.export-filter-confirm-btn')
      ?.addEventListener('click', () => this._handleConfirm());

    // Handle form submission via Enter key in input
    this.modalElement.querySelector('#exportPrefixFilter')
      ?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._handleConfirm();
        }
      });

    // Close on overlay click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) this._handleCancel();
    });

    // Keyboard navigation
    this._boundKeyHandler = (e) => this._handleKeyDown(e);
    document.addEventListener('keydown', this._boundKeyHandler);

    // Add to DOM
    document.body.appendChild(this.modalElement);

    // Focus the input field
    const input = this.modalElement.querySelector('#exportPrefixFilter');
    if (input) {
      requestAnimationFrame(() => input.focus());
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
   * Handle keyboard events.
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this._handleCancel();
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
   * @returns {string} HTML string
   */
  _renderContent() {
    return `
      <div class="export-filter-modal">
        <div class="export-filter-modal-header">
          <span class="export-filter-modal-icon">🔍</span>
          <h2 id="export-filter-title">Export Filter</h2>
        </div>

        <div class="export-filter-modal-body">
          <div class="export-filter-section">
            <label for="exportPrefixFilter" class="export-filter-label">
              Folder Prefix Filter
            </label>
            <input 
              type="text" 
              id="exportPrefixFilter" 
              class="export-filter-input"
              placeholder="e.g., 600 or 600_"
              autocomplete="off"
              spellcheck="false"
            />
            <p class="export-filter-hint">
              Only scan root folders starting with this prefix.<br>
              Leave empty to scan all folders.
            </p>
          </div>

          <div class="export-filter-section">
            <div class="export-filter-examples">
              <strong>Examples:</strong>
              <ul>
                <li><code>600</code> → matches "600_Project", "600-Assembly", "600xyz"</li>
                <li><code>600_</code> → matches "600_Project" but not "6001"</li>
                <li><code>Client-A</code> → matches "Client-A_Designs", "Client-A-2024"</li>
              </ul>
            </div>
          </div>

          <div class="export-filter-section export-filter-section-formats">
            <label class="export-filter-section-label">Export Formats</label>
            <div class="export-filter-checkboxes">
              <label class="export-filter-checkbox">
                <input type="checkbox" name="formatJson" checked>
                <span>JSON (full metadata, nested structure)</span>
              </label>
              <label class="export-filter-checkbox">
                <input type="checkbox" name="formatCsv" checked>
                <span>CSV (flattened for Excel/Sheets)</span>
              </label>
            </div>
            <div class="export-filter-error" id="formatError"></div>
          </div>

          <div class="export-filter-section export-filter-section-rowfilter">
            <label class="export-filter-section-label">Row Filtering (CSV only)</label>
            <label class="export-filter-checkbox">
              <input type="checkbox" name="filterPrtAsm">
              <span>Only include parts with PRT/ASM prefix in Part Number</span>
            </label>
            <p class="export-filter-help">
              Filters BOM rows where Part Number matches patterns like: 
              PRT-12345, ASM-WIDGET, PRT_ABC123
            </p>
          </div>
        </div>

        <div class="export-filter-modal-footer">
          <button class="export-filter-cancel-btn" type="button">Cancel</button>
          <button class="export-filter-confirm-btn" type="button">Start Scan</button>
        </div>
      </div>
    `;
  }

  /**
   * Handle confirm button click.
   */
  _handleConfirm() {
    const prefixInput = this.modalElement?.querySelector('#exportPrefixFilter');
    const formatJsonCheck = this.modalElement?.querySelector('input[name="formatJson"]');
    const formatCsvCheck = this.modalElement?.querySelector('input[name="formatCsv"]');
    const filterPrtAsmCheck = this.modalElement?.querySelector('input[name="filterPrtAsm"]');
    
    const prefixFilter = prefixInput?.value?.trim() || null;
    
    const formats = {
      json: formatJsonCheck?.checked ?? true,
      csv: formatCsvCheck?.checked ?? true
    };
    
    // Validate at least one format selected
    if (!formats.json && !formats.csv) {
      const errorEl = this.modalElement?.querySelector('#formatError');
      if (errorEl) {
        errorEl.textContent = 'Please select at least one export format';
        errorEl.style.display = 'block';
      }
      return;
    }
    
    const rowFilters = {
      prtAsmOnly: filterPrtAsmCheck?.checked ?? false
    };
    
    this.hide();
    
    if (this._resolvePromise) {
      this._resolvePromise({ prefixFilter, formats, rowFilters });
      this._resolvePromise = null;
    }
  }

  /**
   * Handle cancel button click.
   */
  _handleCancel() {
    this.hide();
    
    if (this._resolvePromise) {
      this._resolvePromise(null);
      this._resolvePromise = null;
    }
  }
}

// Export singleton instance
export const exportFilterModal = new ExportFilterModal();
