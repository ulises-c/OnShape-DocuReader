full-assembly-exporter.js
```js
/**
 * Full Assembly Exporter
 * 
 * Exports a complete assembly package including:
 * - Flattened BOM as JSON
 * - Flattened BOM as CSV
 * - Thumbnails for each BOM item
 * - All packaged in a ZIP file
 * 
 * @module utils/fullAssemblyExporter
 */

import { bomToCSV } from './bomToCSV.js';

// ============================================================================
// Constants
// ============================================================================

const MAX_FILENAME_LENGTH = 100;
const THUMBNAIL_SIZE = '300x300';
const CONCURRENT_THUMBNAIL_LIMIT = 3; // Rate limit thumbnail fetches

// Characters not allowed in filenames (Windows + Unix)
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

// ============================================================================
// Filename Utilities
// ============================================================================

/**
 * Sanitize a string for use in filenames.
 * Replaces invalid characters with underscores and truncates if needed.
 * 
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length (default: MAX_FILENAME_LENGTH)
 * @returns {string} Sanitized filename-safe string
 */
function sanitizeForFilename(str, maxLength = MAX_FILENAME_LENGTH) {
  if (!str || typeof str !== 'string') return 'unknown';
  
  return str
    .replace(INVALID_FILENAME_CHARS, '_')  // Replace invalid chars
    .replace(/\s+/g, '_')                   // Replace whitespace with underscore
    .replace(/_+/g, '_')                    // Collapse multiple underscores
    .replace(/^_|_$/g, '')                  // Trim leading/trailing underscores
    .slice(0, maxLength)                    // Truncate to max length
    || 'unknown';
}

/**
 * Build a thumbnail filename from BOM row data.
 * Format: {itemNumber}_{partNumber}_{name}.png
 * 
 * @param {Object} rowData - Parsed BOM row data
 * @param {string|number} rowData.itemNumber - Item number from BOM
 * @param {string} rowData.partNumber - Part number (or null if unknown)
 * @param {string} rowData.name - Part/assembly name
 * @param {string} rowData.type - 'assembly' or 'part'
 * @returns {string} Sanitized filename with .png extension
 */
function buildThumbnailFilename(rowData) {
  const { itemNumber, partNumber, name, type } = rowData;
  
  // Item number - pad with zeros for sorting (e.g., "001", "002")
  const itemStr = String(itemNumber).padStart(3, '0');
  
  // Part number - use ASM-UNK or PRT-UNK if unknown
  let partStr;
  if (partNumber && partNumber.trim()) {
    partStr = sanitizeForFilename(partNumber, 30);
  } else {
    partStr = type === 'assembly' ? 'ASM-UNK' : 'PRT-UNK';
  }
  
  // Name - sanitize and truncate
  const nameStr = sanitizeForFilename(name, 50);
  
  return `${itemStr}_${partStr}_${nameStr}.png`;
}

// ============================================================================
// BOM Parsing Utilities
// ============================================================================

/**
 * Extract header ID to name mapping from BOM headers.
 * 
 * @param {Array} headers - BOM headers array
 * @returns {Map<string, string>} Map of header ID to header name
 */
function buildHeaderMap(headers) {
  const map = new Map();
  if (!Array.isArray(headers)) return map;
  
  for (const header of headers) {
    if (header.id && header.name) {
      map.set(header.id, header.name.toLowerCase());
    }
  }
  return map;
}

/**
 * Find a value in a BOM row by header name (case-insensitive).
 * 
 * @param {Object} row - BOM row object
 * @param {Map} headerMap - Header ID to name mapping
 * @param {string[]} possibleNames - Possible header names to search for
 * @returns {string|null} Found value or null
 */
function findRowValue(row, headerMap, possibleNames) {
  if (!row?.headerIdToValue) return null;
  
  for (const [headerId, headerName] of headerMap) {
    if (possibleNames.some(name => headerName.includes(name.toLowerCase()))) {
      const value = row.headerIdToValue[headerId];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }
  }
  return null;
}

/**
 * Parse a BOM row to extract thumbnail-relevant data.
 * 
 * @param {Object} row - BOM row from OnShape API
 * @param {Map} headerMap - Header ID to name mapping
 * @param {number} index - Row index (0-based)
 * @returns {Object} Parsed row data with thumbnail info
 */
function parseBomRow(row, headerMap, index) {
  // Item number: use 'item' or 'item number' header, or fallback to index+1
  const itemNumber = findRowValue(row, headerMap, ['item']) || (index + 1);
  
  // Part number: look for 'part number', 'partnumber', 'number'
  const partNumber = findRowValue(row, headerMap, ['part number', 'partnumber']) || null;
  
  // Name: look for 'name', 'description', 'part name'
  const name = findRowValue(row, headerMap, ['name', 'description', 'part name']) || 'Unnamed';
  
  // Determine type from BOM data
  const typeValue = findRowValue(row, headerMap, ['type', 'element type']);
  const isAssembly = typeValue?.toLowerCase().includes('assembly') || 
                     name.toLowerCase().includes('asm') ||
                     row.relatedOccurrences?.[0]?.elementType === 'ASSEMBLY';
  
  // Extract thumbnail URL info from relatedOccurrences
  let thumbnailInfo = null;
  if (row.relatedOccurrences?.length > 0) {
    const occ = row.relatedOccurrences[0];
    thumbnailInfo = {
      documentId: occ.documentId,
      workspaceId: occ.workspaceId,
      elementId: occ.elementId,
      partId: occ.partId || null
    };
  }
  
  return {
    itemNumber,
    partNumber,
    name,
    type: isAssembly ? 'assembly' : 'part',
    thumbnailInfo,
    originalRow: row
  };
}

// ============================================================================
// Thumbnail Fetching
// ============================================================================

/**
 * Build the OnShape thumbnail URL for a part/element.
 * 
 * @param {Object} info - Thumbnail info from parsed BOM row
 * @param {string} size - Thumbnail size (default: '300x300')
 * @returns {string|null} OnShape thumbnail URL or null
 */
function buildThumbnailUrl(info, size = THUMBNAIL_SIZE) {
  if (!info?.documentId || !info?.workspaceId || !info?.elementId) {
    return null;
  }
  
  const baseUrl = 'https://cad.onshape.com/api/thumbnails';
  let url = `${baseUrl}/d/${info.documentId}/w/${info.workspaceId}/e/${info.elementId}/s/${size}`;
  
  // Add partId if available for part-specific thumbnail
  if (info.partId) {
    url += `?partId=${encodeURIComponent(info.partId)}`;
  }
  
  // Add cache-busting timestamp
  const separator = info.partId ? '&' : '?';
  url += `${separator}t=${Date.now()}`;
  
  return url;
}

/**
 * Fetch a thumbnail via the proxy endpoint.
 * 
 * @param {string} thumbnailUrl - OnShape thumbnail URL
 * @returns {Promise<Blob|null>} Thumbnail blob or null on failure
 */
async function fetchThumbnailBlob(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  
  const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(thumbnailUrl)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.warn(`Thumbnail fetch failed (${response.status}): ${thumbnailUrl}`);
      return null;
    }
    return await response.blob();
  } catch (err) {
    console.warn(`Thumbnail fetch error: ${err.message}`);
    return null;
  }
}

/**
 * Fetch thumbnails with concurrency limit.
 * 
 * @param {Array} items - Array of {url, filename} objects
 * @param {number} concurrency - Max concurrent fetches
 * @param {Function} onProgress - Progress callback (current, total, item)
 * @returns {Promise<Array>} Array of {filename, blob} results
 */
async function fetchThumbnailsWithLimit(items, concurrency, onProgress) {
  const results = [];
  const queue = [...items];
  let completed = 0;
  
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      
      const blob = await fetchThumbnailBlob(item.url);
      completed++;
      
      if (onProgress) {
        onProgress(completed, items.length, item);
      }
      
      if (blob) {
        results.push({ filename: item.filename, blob });
      }
    }
  }
  
  // Start workers
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  
  await Promise.all(workers);
  return results;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Load JSZip library (local or CDN fallback).
 * 
 * @returns {Promise<JSZip>} JSZip constructor
 */
async function loadJSZip() {
  try {
    // Try local copy first
    const module = await import('/js/lib/jszip.esm.min.js');
    return module.default || module.JSZip;
  } catch (err) {
    console.warn('Local JSZip not found, trying CDN...');
    try {
      const module = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      return window.JSZip || module.default;
    } catch (cdnErr) {
      throw new Error('Failed to load JSZip library');
    }
  }
}

/**
 * Export progress phases
 */
export const ExportPhase = {
  INITIALIZING: 'initializing',
  FETCHING_BOM: 'fetching_bom',
  CONVERTING_CSV: 'converting_csv',
  FETCHING_THUMBNAILS: 'fetching_thumbnails',
  BUILDING_ZIP: 'building_zip',
  COMPLETE: 'complete',
  ERROR: 'error'
};

/**
 * Perform full assembly extraction.
 * 
 * @param {Object} options - Export options
 * @param {Object} options.element - Assembly element object
 * @param {string} options.documentId - OnShape document ID
 * @param {string} options.workspaceId - OnShape workspace ID
 * @param {Object} options.documentService - DocumentService instance
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function fullAssemblyExtract(options) {
  const { element, documentId, workspaceId, documentService, onProgress } = options;
  
  const assemblyName = sanitizeForFilename(element.name || element.id, 50);
  const startTime = Date.now();
  
  // Progress helper
  const reportProgress = (phase, data = {}) => {
    if (onProgress) {
      onProgress({
        phase,
        assemblyName,
        timestamp: new Date().toISOString(),
        elapsedMs: Date.now() - startTime,
        ...data
      });
    }
  };
  
  try {
    // Phase: Initialize
    reportProgress(ExportPhase.INITIALIZING);
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    
    // Phase: Fetch BOM
    reportProgress(ExportPhase.FETCHING_BOM);
    const bom = await documentService.getBillOfMaterials(
      documentId,
      workspaceId,
      element.id,
      true // flattened
    );
    
    if (!bom || !Array.isArray(bom.rows)) {
      throw new Error('No BOM data available for this assembly');
    }
    
    console.log(`[FullExtract] BOM fetched: ${bom.rows.length} rows`);
    
    // Phase: Convert to CSV
    reportProgress(ExportPhase.CONVERTING_CSV, { bomRows: bom.rows.length });
    const csvContent = bomToCSV(bom);
    
    if (!csvContent) {
      throw new Error('Failed to convert BOM to CSV');
    }
    
    // Add BOM files to ZIP
    zip.file(`${assemblyName}-BOM.json`, JSON.stringify(bom, null, 2));
    zip.file(`${assemblyName}-BOM.csv`, csvContent);
    
    // Phase: Parse BOM and prepare thumbnail fetches
    const headerMap = buildHeaderMap(bom.headers);
    const thumbnailsFolder = zip.folder('thumbnails');
    
    const thumbnailItems = [];
    for (let i = 0; i < bom.rows.length; i++) {
      const row = bom.rows[i];
      const parsed = parseBomRow(row, headerMap, i);
      const filename = buildThumbnailFilename(parsed);
      const url = buildThumbnailUrl(parsed.thumbnailInfo);
      
      if (url) {
        thumbnailItems.push({ url, filename, parsed });
      }
    }
    
    console.log(`[FullExtract] Prepared ${thumbnailItems.length} thumbnail requests`);
    
    // Phase: Fetch thumbnails
    reportProgress(ExportPhase.FETCHING_THUMBNAILS, {
      totalThumbnails: thumbnailItems.length,
      currentThumbnail: 0
    });
    
    const thumbnailResults = await fetchThumbnailsWithLimit(
      thumbnailItems,
      CONCURRENT_THUMBNAIL_LIMIT,
      (current, total, item) => {
        reportProgress(ExportPhase.FETCHING_THUMBNAILS, {
          totalThumbnails: total,
          currentThumbnail: current,
          currentItem: item.filename
        });
      }
    );
    
    console.log(`[FullExtract] Fetched ${thumbnailResults.length}/${thumbnailItems.length} thumbnails`);
    
    // Add thumbnails to ZIP
    for (const { filename, blob } of thumbnailResults) {
      thumbnailsFolder.file(filename, blob);
    }
    
    // Phase: Build ZIP
    reportProgress(ExportPhase.BUILDING_ZIP);
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Trigger download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const zipFilename = `${assemblyName}_FullExtract_${timestamp}.zip`;
    
    downloadBlob(zipBlob, zipFilename);
    
    // Phase: Complete
    reportProgress(ExportPhase.COMPLETE, {
      bomRows: bom.rows.length,
      thumbnailsDownloaded: thumbnailResults.length,
      thumbnailsFailed: thumbnailItems.length - thumbnailResults.length,
      zipSizeBytes: zipBlob.size
    });
    
    console.log(`[FullExtract] Complete: ${zipFilename} (${(zipBlob.size / 1024).toFixed(1)} KB)`);
    
  } catch (error) {
    console.error('[FullExtract] Error:', error);
    reportProgress(ExportPhase.ERROR, { error: error.message });
    throw error;
  }
}

/**
 * Trigger browser download of a blob.
 * 
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Exports
// ============================================================================

export {
  sanitizeForFilename,
  buildThumbnailFilename,
  parseBomRow,
  buildThumbnailUrl
};
```

full-asm-extract-modal.js
```js
/**
 * Full Extract Progress Modal
 * 
 * Displays progress for the Full Assembly Extraction feature.
 * Shows phases, progress bar, and status messages.
 * 
 * @module views/full-extract-modal
 */

import { ExportPhase } from '../utils/fullAssemblyExporter.js';

// ============================================================================
// Modal State
// ============================================================================

let modalElement = null;
let isVisible = false;

// ============================================================================
// Modal HTML Template
// ============================================================================

function getModalHTML() {
  return `
    <div id="full-extract-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content" style="max-width: 500px; padding: 2rem;">
        <div class="modal-header" style="margin-bottom: 1.5rem;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span id="full-extract-icon">📦</span>
            <span>Full Assembly Extraction</span>
          </h3>
        </div>
        
        <div class="modal-body">
          <!-- Assembly Name -->
          <div id="full-extract-assembly" style="font-weight: 600; margin-bottom: 1rem; color: #333;">
            Preparing...
          </div>
          
          <!-- Phase Status -->
          <div id="full-extract-phase" style="margin-bottom: 1rem; color: #666;">
            Initializing...
          </div>
          
          <!-- Progress Bar Container -->
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span id="full-extract-progress-label" style="font-size: 0.875rem; color: #666;">Progress</span>
              <span id="full-extract-progress-percent" style="font-size: 0.875rem; font-weight: 600;">0%</span>
            </div>
            <div style="background: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
              <div id="full-extract-progress-bar" 
                   style="background: #007bff; height: 100%; width: 0%; transition: width 0.3s ease;">
              </div>
            </div>
          </div>
          
          <!-- Current Item -->
          <div id="full-extract-current-item" style="font-size: 0.875rem; color: #888; min-height: 1.25rem; word-break: break-all;">
          </div>
          
          <!-- Stats Section (shown on complete) -->
          <div id="full-extract-stats" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
              <div>BOM Rows:</div>
              <div id="stat-bom-rows" style="font-weight: 600;">-</div>
              <div>Thumbnails:</div>
              <div id="stat-thumbnails" style="font-weight: 600;">-</div>
              <div>ZIP Size:</div>
              <div id="stat-zip-size" style="font-weight: 600;">-</div>
              <div>Duration:</div>
              <div id="stat-duration" style="font-weight: 600;">-</div>
            </div>
          </div>
          
          <!-- Error Message (shown on error) -->
          <div id="full-extract-error" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
            <strong>Error:</strong> <span id="full-extract-error-message"></span>
          </div>
        </div>
        
        <div class="modal-footer" style="margin-top: 1.5rem; text-align: right;">
          <button id="full-extract-close-btn" class="btn" 
                  style="padding: 0.5rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Modal Lifecycle
// ============================================================================

/**
 * Ensure modal element exists in DOM.
 */
function ensureModal() {
  if (!modalElement) {
    const container = document.createElement('div');
    container.innerHTML = getModalHTML();
    document.body.appendChild(container.firstElementChild);
    modalElement = document.getElementById('full-extract-modal');
    
    // Bind close button
    const closeBtn = document.getElementById('full-extract-close-btn');
    closeBtn?.addEventListener('click', hideModal);
    
    // Close on overlay click
    modalElement?.addEventListener('click', (e) => {
      if (e.target === modalElement && closeBtn.style.display !== 'none') {
        hideModal();
      }
    });
  }
  return modalElement;
}

/**
 * Show the progress modal.
 * 
 * @param {string} assemblyName - Name of the assembly being extracted
 */
export function showModal(assemblyName) {
  ensureModal();
  
  // Reset state
  updateElement('full-extract-assembly', assemblyName || 'Assembly');
  updateElement('full-extract-phase', 'Initializing...');
  updateElement('full-extract-progress-percent', '0%');
  updateElement('full-extract-current-item', '');
  updateElement('full-extract-icon', '📦');
  
  const progressBar = document.getElementById('full-extract-progress-bar');
  if (progressBar) progressBar.style.width = '0%';
  
  // Hide stats/error, hide close button
  hideElement('full-extract-stats');
  hideElement('full-extract-error');
  hideElement('full-extract-close-btn');
  
  // Show modal
  modalElement.style.display = 'flex';
  isVisible = true;
}

/**
 * Hide the progress modal.
 */
export function hideModal() {
  if (modalElement) {
    modalElement.style.display = 'none';
  }
  isVisible = false;
}

/**
 * Check if modal is visible.
 * @returns {boolean}
 */
export function isModalVisible() {
  return isVisible;
}

// ============================================================================
// Progress Updates
// ============================================================================

/**
 * Phase display names and progress weights.
 */
const PHASE_CONFIG = {
  [ExportPhase.INITIALIZING]: { 
    label: 'Initializing...', 
    icon: '⏳',
    weight: 5 
  },
  [ExportPhase.FETCHING_BOM]: { 
    label: 'Fetching BOM data...', 
    icon: '📋',
    weight: 10 
  },
  [ExportPhase.CONVERTING_CSV]: { 
    label: 'Converting to CSV...', 
    icon: '📝',
    weight: 5 
  },
  [ExportPhase.FETCHING_THUMBNAILS]: { 
    label: 'Downloading thumbnails...', 
    icon: '🖼️',
    weight: 70 
  },
  [ExportPhase.BUILDING_ZIP]: { 
    label: 'Building ZIP archive...', 
    icon: '📦',
    weight: 10 
  },
  [ExportPhase.COMPLETE]: { 
    label: 'Complete!', 
    icon: '✅',
    weight: 0 
  },
  [ExportPhase.ERROR]: { 
    label: 'Error', 
    icon: '❌',
    weight: 0 
  }
};

/**
 * Calculate overall progress percentage.
 * 
 * @param {string} phase - Current phase
 * @param {Object} data - Progress data
 * @returns {number} Progress 0-100
 */
function calculateProgress(phase, data) {
  const phases = Object.keys(PHASE_CONFIG);
  const phaseIndex = phases.indexOf(phase);
  
  if (phase === ExportPhase.COMPLETE) return 100;
  if (phase === ExportPhase.ERROR) return 0;
  
  // Calculate base progress from completed phases
  let baseProgress = 0;
  for (let i = 0; i < phaseIndex; i++) {
    baseProgress += PHASE_CONFIG[phases[i]]?.weight || 0;
  }
  
  // Add progress within current phase
  let phaseProgress = 0;
  if (phase === ExportPhase.FETCHING_THUMBNAILS && data.totalThumbnails > 0) {
    phaseProgress = (data.currentThumbnail / data.totalThumbnails) * PHASE_CONFIG[phase].weight;
  }
  
  return Math.min(Math.round(baseProgress + phaseProgress), 99);
}

/**
 * Update modal with progress data.
 * 
 * @param {Object} progress - Progress event from fullAssemblyExtract
 */
export function updateProgress(progress) {
  if (!isVisible || !modalElement) return;
  
  const { phase, assemblyName, elapsedMs } = progress;
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG[ExportPhase.INITIALIZING];
  
  // Update phase display
  updateElement('full-extract-icon', config.icon);
  updateElement('full-extract-phase', config.label);
  
  if (assemblyName) {
    updateElement('full-extract-assembly', assemblyName);
  }
  
  // Calculate and update progress
  const percent = calculateProgress(phase, progress);
  updateElement('full-extract-progress-percent', `${percent}%`);
  
  const progressBar = document.getElementById('full-extract-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.style.background = phase === ExportPhase.ERROR ? '#dc3545' : '#007bff';
  }
  
  // Update current item during thumbnail phase
  if (phase === ExportPhase.FETCHING_THUMBNAILS) {
    const { currentThumbnail, totalThumbnails, currentItem } = progress;
    updateElement('full-extract-progress-label', `Thumbnails (${currentThumbnail}/${totalThumbnails})`);
    updateElement('full-extract-current-item', currentItem || '');
  } else {
    updateElement('full-extract-progress-label', 'Progress');
    updateElement('full-extract-current-item', '');
  }
  
  // Handle completion
  if (phase === ExportPhase.COMPLETE) {
    showCompletionStats(progress);
    showElement('full-extract-close-btn');
  }
  
  // Handle error
  if (phase === ExportPhase.ERROR) {
    showError(progress.error);
    showElement('full-extract-close-btn');
  }
}

/**
 * Show completion statistics.
 * 
 * @param {Object} progress - Final progress data
 */
function showCompletionStats(progress) {
  const { bomRows, thumbnailsDownloaded, thumbnailsFailed, zipSizeBytes, elapsedMs } = progress;
  
  updateElement('stat-bom-rows', String(bomRows || 0));
  updateElement('stat-thumbnails', `${thumbnailsDownloaded || 0} downloaded${thumbnailsFailed ? `, ${thumbnailsFailed} failed` : ''}`);
  updateElement('stat-zip-size', formatBytes(zipSizeBytes || 0));
  updateElement('stat-duration', formatDuration(elapsedMs || 0));
  
  showElement('full-extract-stats');
}

/**
 * Show error message.
 * 
 * @param {string} message - Error message
 */
function showError(message) {
  updateElement('full-extract-error-message', message || 'Unknown error occurred');
  showElement('full-extract-error');
}

// ============================================================================
// DOM Helpers
// ============================================================================

function updateElement(id, content) {
  const el = document.getElementById(id);
  if (el) el.textContent = content;
}

function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
```
