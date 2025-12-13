/**
 * AirtableUploadView - UI for uploading thumbnails to Airtable
 */

import { BaseView } from './base-view.js';
import { escapeHtml } from '../utils/dom-helpers.js';
import { showToast } from '../utils/toast-notification.js';

export class AirtableUploadView extends BaseView {
  constructor(containerSelector, controller, airtableService) {
    super(containerSelector);
    this.controller = controller;
    this.airtableService = airtableService;
    this._selectedFile = null;
    this._isUploading = false;
    this._lastResults = null; // Store results for report download
  }

  /**
   * Render the upload view based on authentication status
   * @param {boolean} isAuthenticated
   */
  async render(isAuthenticated) {
    this.ensureContainer();
    this.clear();

    if (!isAuthenticated) {
      this._renderUnauthenticated();
    } else {
      await this._renderAuthenticated();
    }

    this.bind();
  }

  _renderUnauthenticated() {
    const html = `
      <div class="airtable-auth-required">
        <div class="auth-required-icon">🔐</div>
        <h3>Airtable Authentication Required</h3>
        <p>Sign in to Airtable to upload CAD thumbnails to your records.</p>
        <button id="airtableLoginBtn" class="btn btn-primary">
          Sign in with Airtable
        </button>
        <div class="auth-note">
          <small>This will open Airtable's OAuth page. Your OnShape session will remain active.</small>
        </div>
      </div>
    `;
    this.renderHtml(html);
    this._bindLoginButton();
  }

  async _renderAuthenticated() {
    // Get configuration info
    let config = { configured: false, databaseConfigured: false };
    try {
      config = await this.airtableService.getConfiguration();
    } catch (error) {
      console.warn('[AirtableUploadView] Could not get config:', error);
    }

    const configWarning = !config.databaseConfigured
      ? `<div class="config-warning">
          <strong>⚠️ Database not fully configured</strong>
          <p>Set AIRTABLE_BASE_ID and AIRTABLE_TABLE_ID in environment variables, or provide them in the form below.</p>
        </div>`
      : '';

    const html = `
      <div class="airtable-upload-panel">
        <div class="upload-header">
          <h3>📤 Upload Thumbnails to Airtable</h3>
          <button id="airtableLogoutBtn" class="btn btn-secondary btn-sm">Logout</button>
        </div>

        ${configWarning}

        <div class="upload-instructions">
          <h4>Instructions</h4>
          <p>Upload a ZIP file containing thumbnail images. The filename format should be:</p>
          <code>{bom_item}_{part_number}_{name}.png</code>
          <p>Example: <code>001_PRT-12345_Widget.png</code></p>
          <p>The service will match part numbers to Airtable records and upload the thumbnails.</p>
        </div>

        <div class="upload-dropzone" id="airtableDropzone">
          <input type="file" id="zipFileInput" accept=".zip" hidden />
          <div class="dropzone-content">
            <div class="dropzone-icon">📁</div>
            <p class="dropzone-text">Drop ZIP file here or click to browse</p>
            <p class="dropzone-hint">Supports: .zip files up to 100MB</p>
          </div>
          <div class="selected-file" id="selectedFileInfo" style="display: none;">
            <span class="file-icon">📦</span>
            <span class="file-name" id="selectedFileName"></span>
            <span class="file-size" id="selectedFileSize"></span>
            <button class="btn-clear-file" id="clearFileBtn" title="Remove file">✕</button>
          </div>
        </div>

        <div class="upload-options">
          <label class="dry-run-label">
            <input type="checkbox" id="dryRunCheckbox" checked />
            Dry Run (preview matches without uploading)
          </label>
        </div>

        <div class="upload-actions">
          <button id="startUploadBtn" class="btn btn-primary" disabled>
            Upload Thumbnails
          </button>
        </div>

        <div class="upload-progress" id="uploadProgress" style="display: none;">
          <div class="progress-header">
            <span class="progress-phase" id="progressPhase">Uploading...</span>
            <button id="cancelUploadBtn" class="btn btn-danger btn-sm">Cancel</button>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="uploadProgressFill" style="width: 0%"></div>
          </div>
          <div class="progress-text" id="uploadProgressText">0%</div>
        </div>

        <div class="upload-results" id="uploadResults" style="display: none;">
          <h4>Results</h4>
          <div class="results-summary" id="resultsSummary"></div>
          <div class="results-download-buttons" id="resultsDownloadButtons">
            <button id="downloadJsonBtn" class="btn btn-primary btn-sm">📥 Download JSON Report</button>
            <button id="downloadCsvBtn" class="btn btn-success btn-sm">📥 Download CSV Report</button>
          </div>
          <div class="results-table-container">
            <table class="results-table" id="resultsTable">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="resultsTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    this.renderHtml(html);
    this._bindEvents();
    this._bindDropzone();
  }

  _bindLoginButton() {
    const loginBtn = document.getElementById('airtableLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.controller.login());
    }
  }

  _bindEvents() {
    // Logout button
    const logoutBtn = document.getElementById('airtableLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.controller.logout());
    }

    // Clear file button
    const clearBtn = document.getElementById('clearFileBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._clearFile());
    }

    // Start upload button
    const uploadBtn = document.getElementById('startUploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this._startUpload());
    }

    // Cancel upload button
    const cancelBtn = document.getElementById('cancelUploadBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this._cancelUpload());
    }

    // Download report buttons
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener('click', () => this._downloadReport('json'));
    }

    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    if (downloadCsvBtn) {
      downloadCsvBtn.addEventListener('click', () => this._downloadReport('csv'));
    }
  }

  _bindDropzone() {
    const dropzone = document.getElementById('airtableDropzone');
    const fileInput = document.getElementById('zipFileInput');

    if (!dropzone || !fileInput) return;

    // Click to browse
    dropzone.addEventListener('click', (e) => {
      if (e.target.id !== 'clearFileBtn' && !this._selectedFile) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this._handleFileSelect(file);
    });

    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        if (file.name.endsWith('.zip')) {
          this._handleFileSelect(file);
        } else {
          showToast('Please drop a ZIP file');
        }
      }
    });
  }

  _handleFileSelect(file) {
    // Validate file
    if (!file.name.endsWith('.zip')) {
      showToast('Please select a ZIP file');
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 100MB');
      return;
    }

    this._selectedFile = file;

    // Update UI
    const dropzone = document.getElementById('airtableDropzone');
    const fileInfo = document.getElementById('selectedFileInfo');
    const dropzoneContent = dropzone?.querySelector('.dropzone-content');
    const fileName = document.getElementById('selectedFileName');
    const fileSize = document.getElementById('selectedFileSize');
    const uploadBtn = document.getElementById('startUploadBtn');

    if (dropzoneContent) dropzoneContent.style.display = 'none';
    if (fileInfo) fileInfo.style.display = 'flex';
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = this._formatFileSize(file.size);
    if (uploadBtn) uploadBtn.disabled = false;

    // Add selected class to dropzone
    if (dropzone) dropzone.classList.add('has-file');
  }

  _clearFile() {
    this._selectedFile = null;

    // Reset UI
    const dropzone = document.getElementById('airtableDropzone');
    const fileInfo = document.getElementById('selectedFileInfo');
    const dropzoneContent = dropzone?.querySelector('.dropzone-content');
    const fileInput = document.getElementById('zipFileInput');
    const uploadBtn = document.getElementById('startUploadBtn');

    if (dropzoneContent) dropzoneContent.style.display = 'flex';
    if (fileInfo) fileInfo.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (uploadBtn) uploadBtn.disabled = true;
    if (dropzone) dropzone.classList.remove('has-file');
  }

  async _startUpload() {
    if (!this._selectedFile || this._isUploading) return;

    this._isUploading = true;
    this._lastResults = null;
    const dryRun = document.getElementById('dryRunCheckbox')?.checked ?? true;

    // Show progress UI
    const progressEl = document.getElementById('uploadProgress');
    const resultsEl = document.getElementById('uploadResults');
    const uploadBtn = document.getElementById('startUploadBtn');

    if (progressEl) progressEl.style.display = 'block';
    if (resultsEl) resultsEl.style.display = 'none';
    if (uploadBtn) uploadBtn.disabled = true;

    this._updateProgress('Uploading...', 0);

    try {
      const result = await this.airtableService.uploadThumbnails(
        this._selectedFile,
        { dryRun },
        (progress) => {
          if (progress.phase === 'uploading') {
            this._updateProgress('Uploading ZIP...', progress.percent);
          }
        }
      );

      console.log('[AirtableUploadView] Upload result:', result);

      // Store results for report download
      this._lastResults = {
        ...result,
        fileName: this._selectedFile.name,
        dryRun,
        timestamp: new Date().toISOString()
      };

      console.log('[AirtableUploadView] Stored results for download:', this._lastResults.summary);

      // Show results
      this._showResults(result, dryRun);
      showToast(dryRun ? 'Dry run complete!' : 'Upload complete!');

    } catch (error) {
      console.error('[AirtableUploadView] Upload error:', error);
      showToast(`Upload failed: ${error.message}`);
      this._hideProgress();
    } finally {
      this._isUploading = false;
      if (uploadBtn) uploadBtn.disabled = !this._selectedFile;
    }
  }

  _cancelUpload() {
    // TODO: Implement actual cancellation if using streaming upload
    this._isUploading = false;
    this._hideProgress();
    showToast('Upload cancelled');
  }

  _updateProgress(phase, percent) {
    const phaseEl = document.getElementById('progressPhase');
    const fillEl = document.getElementById('uploadProgressFill');
    const textEl = document.getElementById('uploadProgressText');

    if (phaseEl) phaseEl.textContent = phase;
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `${percent}%`;
  }

  _hideProgress() {
    const progressEl = document.getElementById('uploadProgress');
    if (progressEl) progressEl.style.display = 'none';
  }

  _showResults(result, dryRun) {
    this._hideProgress();

    const resultsEl = document.getElementById('uploadResults');
    const summaryEl = document.getElementById('resultsSummary');
    const tableBody = document.getElementById('resultsTableBody');

    if (!resultsEl || !summaryEl || !tableBody) return;

    resultsEl.style.display = 'block';

    // Render summary
    const summary = result.summary || {};
    const modeLabel = dryRun ? 'Dry Run' : 'Upload';
    summaryEl.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Mode</span>
          <span class="summary-value ${dryRun ? 'mode-dry' : 'mode-live'}">${modeLabel}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Files</span>
          <span class="summary-value">${summary.total || 0}</span>
        </div>
        <div class="summary-item summary-success">
          <span class="summary-label">${dryRun ? 'Would Upload' : 'Uploaded'}</span>
          <span class="summary-value">${summary.uploaded || 0}</span>
        </div>
        <div class="summary-item summary-skipped">
          <span class="summary-label">Skipped</span>
          <span class="summary-value">${summary.skipped || 0}</span>
        </div>
        <div class="summary-item summary-nomatch">
          <span class="summary-label">No Match</span>
          <span class="summary-value">${summary.noMatch || 0}</span>
        </div>
        <div class="summary-item summary-error">
          <span class="summary-label">Errors</span>
          <span class="summary-value">${summary.errors || 0}</span>
        </div>
      </div>
    `;

    // Render results table
    const results = result.results || [];
    tableBody.innerHTML = results.map(r => {
      const statusClass = this._getStatusClass(r.status);
      const statusIcon = this._getStatusIcon(r.status);
      return `
        <tr class="${statusClass}">
          <td>${escapeHtml(r.partNumber || '—')}</td>
          <td class="filename-cell" title="${escapeHtml(r.filename || '')}">${escapeHtml(r.filename || '—')}</td>
          <td><span class="status-badge ${statusClass}">${statusIcon} ${escapeHtml(r.status)}</span></td>
          <td class="details-cell">${escapeHtml(r.error || r.recordId || '—')}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Download report in specified format
   * @param {string} format - 'json' or 'csv'
   */
  _downloadReport(format) {
    console.log('[AirtableUploadView] Download report requested:', format, 'hasResults:', !!this._lastResults);
    
    if (!this._lastResults) {
      showToast('No results to download');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const modeLabel = this._lastResults.dryRun ? 'dryrun' : 'upload';

    console.log('[AirtableUploadView] Generating', format, 'report with', this._lastResults.results?.length || 0, 'items');

    if (format === 'json') {
      this._downloadJson(this._lastResults, `airtable-${modeLabel}-report-${timestamp}.json`);
    } else if (format === 'csv') {
      const csv = this._resultsToCSV(this._lastResults);
      this._downloadCsv(csv, `airtable-${modeLabel}-report-${timestamp}.csv`);
    }
  }

  /**
   * Convert results to CSV format
   * @param {Object} results - Results object
   * @returns {string} CSV string
   */
  _resultsToCSV(results) {
    const headers = ['Part Number', 'Filename', 'Status', 'Record ID', 'Error'];
    const rows = (results.results || []).map(r => [
      r.partNumber || '',
      r.filename || '',
      r.status || '',
      r.recordId || '',
      r.error || ''
    ]);

    // Escape CSV values
    const escapeCSV = (val) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      `# Airtable Thumbnail Upload Report`,
      `# Generated: ${results.timestamp || new Date().toISOString()}`,
      `# File: ${results.fileName || 'Unknown'}`,
      `# Mode: ${results.dryRun ? 'Dry Run' : 'Live Upload'}`,
      `# Total: ${results.summary?.total || 0}, Uploaded: ${results.summary?.uploaded || 0}, Skipped: ${results.summary?.skipped || 0}, No Match: ${results.summary?.noMatch || 0}, Errors: ${results.summary?.errors || 0}`,
      '',
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Download data as JSON file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename
   */
  _downloadJson(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this._triggerDownload(blob, filename);
  }

  /**
   * Download string as CSV file
   * @param {string} csv - CSV content
   * @param {string} filename - Filename
   */
  _downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this._triggerDownload(blob, filename);
  }

  /**
   * Trigger browser download
   * @param {Blob} blob - Data blob
   * @param {string} filename - Filename
   */
  _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded: ${filename}`);
  }

  _getStatusClass(status) {
    switch (status) {
      case 'uploaded': return 'status-uploaded';
      case 'skipped': return 'status-skipped';
      case 'no_match': return 'status-nomatch';
      case 'error': return 'status-error';
      default: return '';
    }
  }

  _getStatusIcon(status) {
    switch (status) {
      case 'uploaded': return '✅';
      case 'skipped': return '⏭️';
      case 'no_match': return '❓';
      case 'error': return '❌';
      default: return '';
    }
  }

  _formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // State capture/restore for router navigation
  captureState() {
    return {
      selectedFileName: this._selectedFile?.name || null,
      dryRun: document.getElementById('dryRunCheckbox')?.checked ?? true
    };
  }

  restoreState(state) {
    if (!state) return;
    
    const dryRunCheckbox = document.getElementById('dryRunCheckbox');
    if (dryRunCheckbox && typeof state.dryRun === 'boolean') {
      dryRunCheckbox.checked = state.dryRun;
    }
  }
}
