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
      <div class="modal-content" style="max-width: 1000px; max-height: 85vh; padding: 2rem;">
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
    
    // Close on overlay click (only when close button is visible)
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
  const { bomRows, thumbnailsDownloaded, thumbnailsFailed, thumbnailsSkipped, zipSizeBytes, elapsedMs } = progress;
  
  updateElement('stat-bom-rows', String(bomRows || 0));
  
  // Build thumbnails status string
  let thumbnailStatus = `${thumbnailsDownloaded || 0} downloaded`;
  if (thumbnailsFailed) {
    thumbnailStatus += `, ${thumbnailsFailed} failed`;
  }
  if (thumbnailsSkipped) {
    thumbnailStatus += `, ${thumbnailsSkipped} skipped`;
  }
  updateElement('stat-thumbnails', thumbnailStatus);
  
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
