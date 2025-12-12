/**
 * AirtableUploadView - UI for uploading thumbnails to Airtable
 */

import { BaseView } from './base-view.js';
import { escapeHtml, qs, on } from '../utils/dom-helpers.js';
import { showToast } from '../utils/toast-notification.js';

export class AirtableUploadView extends BaseView {
  constructor(containerSelector, controller, airtableService) {
    super(containerSelector);
    this.controller = controller;
    this.airtableService = airtableService;
    
    this._selectedFile = null;
    this._config = {
      dryRun: true,
      baseId: '',
      tableId: '',
      partNumberField: 'Part number',
      thumbnailField: 'CAD_Thumbnail'
    };
    this._bases = [];
    this._tables = [];
    this._isUploading = false;
  }

  /**
   * Render the upload view
   * @param {boolean} isAuthenticated - Whether user is authenticated with Airtable
   */
  async render(isAuthenticated) {
    this.clear();
    
    if (!isAuthenticated) {
      this._renderUnauthenticated();
      return;
    }
    
    this._renderAuthenticated();
    await this._loadBases();
  }

  /**
   * Render unauthenticated state
   */
  _renderUnauthenticated() {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="airtable-upload-panel">
        <div class="airtable-auth-section">
          <div class="auth-icon">🔐</div>
          <h3>Connect to Airtable</h3>
          <p>Sign in to Airtable to upload thumbnails to your records.</p>
          <button class="btn btn-primary" id="airtable-login-btn">
            Sign in with Airtable
          </button>
        </div>
      </div>
    `;

    // Bind login button
    const loginBtn = container.querySelector('#airtable-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.controller.login());
    }
  }

  /**
   * Render authenticated state with upload UI
   */
  _renderAuthenticated() {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="airtable-upload-panel">
        <div class="airtable-header">
          <div class="airtable-status">
            <span class="status-indicator connected"></span>
            <span>Connected to Airtable</span>
          </div>
          <button class="btn btn-secondary btn-sm" id="airtable-logout-btn">
            Sign Out
          </button>
        </div>

        <div class="upload-section">
          <h3>Upload Thumbnails to Airtable</h3>
          
          <div class="upload-requirements">
            <h4>ZIP File Requirements</h4>
            <ul>
              <li>Contains a <code>thumbnails/</code> folder (or images at root)</li>
              <li>Image filenames: <code>{bomItem}_{partNumber}_{name}.png</code></li>
              <li>Example: <code>1_PRT-123456_Widget.png</code></li>
            </ul>
          </div>

          <div class="config-section">
            <h4>Configuration</h4>
            
            <div class="config-row">
              <label for="airtable-base-select">Base:</label>
              <select id="airtable-base-select" class="form-select">
                <option value="">Loading bases...</option>
              </select>
            </div>

            <div class="config-row">
              <label for="airtable-table-select">Table:</label>
              <select id="airtable-table-select" class="form-select" disabled>
                <option value="">Select a base first</option>
              </select>
            </div>

            <div class="config-row">
              <label for="part-number-field">Part Number Field:</label>
              <input type="text" id="part-number-field" class="form-input" 
                     value="${escapeHtml(this._config.partNumberField)}" 
                     placeholder="Part number">
            </div>

            <div class="config-row">
              <label for="thumbnail-field">Thumbnail Field:</label>
              <input type="text" id="thumbnail-field" class="form-input" 
                     value="${escapeHtml(this._config.thumbnailField)}" 
                     placeholder="CAD_Thumbnail">
            </div>
          </div>

          <div class="upload-dropzone" id="airtable-dropzone">
            <input type="file" id="zip-file-input" accept=".zip" hidden />
            <div class="dropzone-content">
              <div class="dropzone-icon">📦</div>
              <p>Drop ZIP file here or <button class="btn-link" id="browse-zip-btn">browse</button></p>
              <p class="dropzone-hint">Supports .zip files up to 50MB</p>
            </div>
          </div>

          <div class="selected-file" id="selected-file-display" style="display: none;">
            <span class="file-icon">📄</span>
            <span class="file-name" id="selected-file-name"></span>
            <span class="file-size" id="selected-file-size"></span>
            <button class="btn-icon" id="clear-file-btn" title="Remove file">✕</button>
          </div>

          <div class="upload-options">
            <label class="checkbox-label">
              <input type="checkbox" id="dry-run-checkbox" checked />
              <span>Dry Run (preview matches without uploading)</span>
            </label>
          </div>

          <div class="upload-actions">
            <button class="btn btn-primary" id="start-upload-btn" disabled>
              Upload Thumbnails
            </button>
          </div>
        </div>

        <div class="upload-progress" id="upload-progress-section" style="display: none;">
          <h4>Upload Progress</h4>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" id="upload-progress-fill" style="width: 0%"></div>
            </div>
            <span class="progress-text" id="upload-progress-text">0%</span>
          </div>
          <p class="progress-status" id="upload-status-text">Preparing...</p>
          <button class="btn btn-secondary" id="cancel-upload-btn">Cancel</button>
        </div>

        <div class="upload-results" id="upload-results-section" style="display: none;">
          <h4>Results</h4>
          <div class="results-summary" id="results-summary"></div>
          <div class="results-details" id="results-details"></div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    const container = this.getContainer();
    if (!container) return;

    // Logout button
    const logoutBtn = container.querySelector('#airtable-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.controller.logout());
    }

    // Base select
    const baseSelect = container.querySelector('#airtable-base-select');
    if (baseSelect) {
      baseSelect.addEventListener('change', (e) => this._handleBaseChange(e.target.value));
    }

    // Table select
    const tableSelect = container.querySelector('#airtable-table-select');
    if (tableSelect) {
      tableSelect.addEventListener('change', (e) => {
        this._config.tableId = e.target.value;
        this._updateUploadButton();
      });
    }

    // Field inputs
    const partNumberField = container.querySelector('#part-number-field');
    if (partNumberField) {
      partNumberField.addEventListener('input', (e) => {
        this._config.partNumberField = e.target.value;
      });
    }

    const thumbnailField = container.querySelector('#thumbnail-field');
    if (thumbnailField) {
      thumbnailField.addEventListener('input', (e) => {
        this._config.thumbnailField = e.target.value;
      });
    }

    // File input and dropzone
    this._bindDropzone();

    // Dry run checkbox
    const dryRunCheckbox = container.querySelector('#dry-run-checkbox');
    if (dryRunCheckbox) {
      dryRunCheckbox.addEventListener('change', (e) => {
        this._config.dryRun = e.target.checked;
        this._updateUploadButtonText();
      });
    }

    // Upload button
    const uploadBtn = container.querySelector('#start-upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this._startUpload());
    }

    // Cancel button
    const cancelBtn = container.querySelector('#cancel-upload-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this._cancelUpload());
    }

    // Clear file button
    const clearBtn = container.querySelector('#clear-file-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._clearFile());
    }
  }

  /**
   * Bind dropzone events
   */
  _bindDropzone() {
    const container = this.getContainer();
    const dropzone = container?.querySelector('#airtable-dropzone');
    const fileInput = container?.querySelector('#zip-file-input');
    const browseBtn = container?.querySelector('#browse-zip-btn');

    if (!dropzone || !fileInput) return;

    // Browse button
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    // Click on dropzone
    dropzone.addEventListener('click', (e) => {
      if (e.target === dropzone || e.target.closest('.dropzone-content')) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this._handleFileSelect(e.target.files[0]);
      }
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      
      const files = e.dataTransfer?.files;
      if (files?.length) {
        const file = files[0];
        if (file.name.endsWith('.zip')) {
          this._handleFileSelect(file);
        } else {
          showToast('Please select a ZIP file');
        }
      }
    });
  }

  /**
   * Handle file selection
   */
  _handleFileSelect(file) {
    if (!file.name.endsWith('.zip')) {
      showToast('Please select a ZIP file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File too large. Maximum size is 50MB');
      return;
    }

    this._selectedFile = file;
    
    // Update UI
    const container = this.getContainer();
    const dropzone = container?.querySelector('#airtable-dropzone');
    const fileDisplay = container?.querySelector('#selected-file-display');
    const fileName = container?.querySelector('#selected-file-name');
    const fileSize = container?.querySelector('#selected-file-size');

    if (dropzone) dropzone.style.display = 'none';
    if (fileDisplay) fileDisplay.style.display = 'flex';
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = this._formatFileSize(file.size);

    this._updateUploadButton();
  }

  /**
   * Clear selected file
   */
  _clearFile() {
    this._selectedFile = null;
    
    const container = this.getContainer();
    const dropzone = container?.querySelector('#airtable-dropzone');
    const fileDisplay = container?.querySelector('#selected-file-display');
    const fileInput = container?.querySelector('#zip-file-input');

    if (dropzone) dropzone.style.display = 'block';
    if (fileDisplay) fileDisplay.style.display = 'none';
    if (fileInput) fileInput.value = '';

    this._updateUploadButton();
  }

  /**
   * Format file size for display
   */
  _formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Load available Airtable bases
   */
  async _loadBases() {
    const container = this.getContainer();
    const baseSelect = container?.querySelector('#airtable-base-select');
    
    if (!baseSelect) return;

    try {
      const response = await this.airtableService.getBases();
      this._bases = response.bases || [];

      if (this._bases.length === 0) {
        baseSelect.innerHTML = '<option value="">No bases available</option>';
        return;
      }

      baseSelect.innerHTML = '<option value="">Select a base...</option>' +
        this._bases.map(base => 
          `<option value="${escapeHtml(base.id)}">${escapeHtml(base.name)}</option>`
        ).join('');

    } catch (error) {
      console.error('[AirtableUploadView] Error loading bases:', error);
      baseSelect.innerHTML = '<option value="">Error loading bases</option>';
      showToast('Failed to load Airtable bases');
    }
  }

  /**
   * Handle base selection change
   */
  async _handleBaseChange(baseId) {
    this._config.baseId = baseId;
    this._config.tableId = '';
    
    const container = this.getContainer();
    const tableSelect = container?.querySelector('#airtable-table-select');
    
    if (!tableSelect) return;

    if (!baseId) {
      tableSelect.innerHTML = '<option value="">Select a base first</option>';
      tableSelect.disabled = true;
      this._updateUploadButton();
      return;
    }

    tableSelect.innerHTML = '<option value="">Loading tables...</option>';
    tableSelect.disabled = true;

    try {
      const response = await this.airtableService.getTables(baseId);
      this._tables = response.tables || [];

      if (this._tables.length === 0) {
        tableSelect.innerHTML = '<option value="">No tables available</option>';
        return;
      }

      tableSelect.innerHTML = '<option value="">Select a table...</option>' +
        this._tables.map(table => 
          `<option value="${escapeHtml(table.id)}">${escapeHtml(table.name)}</option>`
        ).join('');
      tableSelect.disabled = false;

    } catch (error) {
      console.error('[AirtableUploadView] Error loading tables:', error);
      tableSelect.innerHTML = '<option value="">Error loading tables</option>';
      showToast('Failed to load tables');
    }

    this._updateUploadButton();
  }

  /**
   * Update upload button state
   */
  _updateUploadButton() {
    const container = this.getContainer();
    const uploadBtn = container?.querySelector('#start-upload-btn');
    
    if (!uploadBtn) return;

    const isReady = this._selectedFile && 
                    this._config.baseId && 
                    this._config.tableId &&
                    this._config.partNumberField &&
                    this._config.thumbnailField;

    uploadBtn.disabled = !isReady || this._isUploading;
    this._updateUploadButtonText();
  }

  /**
   * Update upload button text based on dry run setting
   */
  _updateUploadButtonText() {
    const container = this.getContainer();
    const uploadBtn = container?.querySelector('#start-upload-btn');
    
    if (!uploadBtn) return;

    if (this._isUploading) {
      uploadBtn.textContent = 'Uploading...';
    } else if (this._config.dryRun) {
      uploadBtn.textContent = 'Preview Matches';
    } else {
      uploadBtn.textContent = 'Upload Thumbnails';
    }
  }

  /**
   * Start the upload process
   */
  async _startUpload() {
    if (!this._selectedFile || this._isUploading) return;

    this._isUploading = true;
    this._updateUploadButton();
    this._showProgress();

    try {
      const result = await this.controller.uploadThumbnails(this._selectedFile, {
        dryRun: this._config.dryRun,
        baseId: this._config.baseId,
        tableId: this._config.tableId,
        partNumberField: this._config.partNumberField,
        thumbnailField: this._config.thumbnailField,
        onProgress: (progress) => this._updateProgress(progress)
      });

      this._showResults(result);
      
      if (this._config.dryRun) {
        showToast(`Preview complete: ${result.matched || 0} matches found`);
      } else {
        showToast(`Upload complete: ${result.uploaded || 0} thumbnails uploaded`);
      }

    } catch (error) {
      console.error('[AirtableUploadView] Upload error:', error);
      showToast(`Upload failed: ${error.message}`);
      this._hideProgress();
    } finally {
      this._isUploading = false;
      this._updateUploadButton();
    }
  }

  /**
   * Cancel upload (placeholder - actual cancellation requires AbortController)
   */
  _cancelUpload() {
    // For now, just hide progress and reset state
    this._isUploading = false;
    this._hideProgress();
    this._updateUploadButton();
    showToast('Upload cancelled');
  }

  /**
   * Show progress section
   */
  _showProgress() {
    const container = this.getContainer();
    const progressSection = container?.querySelector('#upload-progress-section');
    const resultsSection = container?.querySelector('#upload-results-section');
    
    if (progressSection) progressSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
  }

  /**
   * Hide progress section
   */
  _hideProgress() {
    const container = this.getContainer();
    const progressSection = container?.querySelector('#upload-progress-section');
    if (progressSection) progressSection.style.display = 'none';
  }

  /**
   * Update progress display
   */
  _updateProgress(progress) {
    const container = this.getContainer();
    const progressFill = container?.querySelector('#upload-progress-fill');
    const progressText = container?.querySelector('#upload-progress-text');
    const statusText = container?.querySelector('#upload-status-text');

    const pct = progress.total > 0 
      ? Math.round((progress.processed / progress.total) * 100) 
      : 0;

    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${pct}%`;
    if (statusText) {
      statusText.textContent = progress.currentFile 
        ? `Processing: ${progress.currentFile}` 
        : `${progress.processed} of ${progress.total} files processed`;
    }
  }

  /**
   * Show results section
   */
  _showResults(result) {
    const container = this.getContainer();
    const progressSection = container?.querySelector('#upload-progress-section');
    const resultsSection = container?.querySelector('#upload-results-section');
    const summaryEl = container?.querySelector('#results-summary');
    const detailsEl = container?.querySelector('#results-details');

    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';

    if (summaryEl) {
      const isDryRun = this._config.dryRun;
      summaryEl.innerHTML = `
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value">${result.total || 0}</span>
            <span class="stat-label">Files in ZIP</span>
          </div>
          <div class="stat">
            <span class="stat-value">${result.matched || 0}</span>
            <span class="stat-label">Matches Found</span>
          </div>
          ${!isDryRun ? `
            <div class="stat stat-success">
              <span class="stat-value">${result.uploaded || 0}</span>
              <span class="stat-label">Uploaded</span>
            </div>
            <div class="stat stat-error">
              <span class="stat-value">${result.errors || 0}</span>
              <span class="stat-label">Errors</span>
            </div>
          ` : `
            <div class="stat stat-info">
              <span class="stat-value">${result.skipped || 0}</span>
              <span class="stat-label">No Match</span>
            </div>
          `}
        </div>
      `;
    }

    if (detailsEl && result.results?.length) {
      const maxDisplay = 100;
      const displayResults = result.results.slice(0, maxDisplay);
      
      detailsEl.innerHTML = `
        <table class="results-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Part Number</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${displayResults.map(r => `
              <tr class="result-${r.status}">
                <td>${escapeHtml(r.filename || '')}</td>
                <td>${escapeHtml(r.partNumber || '-')}</td>
                <td><span class="status-badge status-${r.status}">${r.status}</span></td>
                <td>${escapeHtml(r.error || r.recordId || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${result.results.length > maxDisplay ? 
          `<p class="results-truncated">Showing ${maxDisplay} of ${result.results.length} results</p>` : ''}
      `;
    } else if (detailsEl) {
      detailsEl.innerHTML = '<p class="no-results">No detailed results available</p>';
    }
  }

  /**
   * Capture state for navigation
   */
  captureState() {
    return {
      config: { ...this._config },
      hasFile: !!this._selectedFile
    };
  }

  /**
   * Restore state from navigation
   */
  restoreState(state) {
    if (state?.config) {
      this._config = { ...this._config, ...state.config };
      
      // Update form fields
      const container = this.getContainer();
      if (container) {
        const partField = container.querySelector('#part-number-field');
        const thumbField = container.querySelector('#thumbnail-field');
        const dryRun = container.querySelector('#dry-run-checkbox');
        
        if (partField) partField.value = this._config.partNumberField;
        if (thumbField) thumbField.value = this._config.thumbnailField;
        if (dryRun) dryRun.checked = this._config.dryRun;
      }
    }
  }
}
