# CSV Exporter - Coder Prompt

## What is this file?

This is the AI coder prompt configuration for implementing the CSV exporter feature. It provides phase-by-phase instructions with explicit file paths, code patterns, and verification steps.

---

## Context

You are implementing a CSV export feature for the OnShape DocuReader application. The app already has a working JSON aggregate BOM exporter with:
- Pre-scan phase that discovers assemblies via BFS traversal
- Folder prefix filtering
- SSE streaming for progress updates
- Progress modal with real-time stats

**Your task**: Extend this system to support CSV output with enhanced pre-scan UI.

---

## Architecture Reference

```
Frontend Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Filter Modal    │ -> │ Stats/Scan Modal │ -> │ Progress Modal  │
│ (prefix,format) │    │ (live stats)     │    │ (BOM fetching)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                      │                       │
         v                      v                       v
┌─────────────────────────────────────────────────────────────────┐
│                    DocumentController                           │
│  exportAggregateBom() -> _startAggregateBomExport()            │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│                    DocumentService                              │
│  getDirectoryStats() / startAggregateBomExport()               │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│                      ApiClient                                  │
│  GET /api/export/directory-stats                                │
│  GET /api/export/aggregate-bom-stream (SSE)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: CSV Conversion Utility

### Task
Create the aggregate BOM to CSV converter.

### File: `public/js/utils/aggregateBomToCSV.js`

```javascript
/**
 * Convert aggregate BOM export result to flattened CSV.
 * Adds source metadata columns and handles multi-assembly header merging.
 * 
 * @param {Object} aggregateResult - Result from aggregate BOM export
 * @param {Object} options - Conversion options
 * @param {boolean} options.filterPrtAsm - Only include PRT/ASM part numbers
 * @returns {string} CSV string with all rows flattened
 */
export function aggregateBomToCSV(aggregateResult, options = {}) {
  if (!aggregateResult?.assemblies?.length) {
    return '';
  }

  const { filterPrtAsm = false } = options;
  
  // Pattern for PRT/ASM filtering
  const prtAsmPattern = /^(PRT|ASM)[-_]?\w*/i;

  // Collect all unique BOM headers across all assemblies
  const headerMap = new Map(); // id -> name
  
  for (const assembly of aggregateResult.assemblies) {
    if (assembly.bom?.headers) {
      for (const header of assembly.bom.headers) {
        if (!headerMap.has(header.id)) {
          headerMap.set(header.id, header.name || header.id);
        }
      }
    }
  }

  // Build complete header row
  const sourceHeaders = ['Document', 'Folder Path', 'Assembly'];
  const bomHeaderIds = Array.from(headerMap.keys());
  const bomHeaderNames = bomHeaderIds.map(id => headerMap.get(id));
  const allHeaders = [...sourceHeaders, ...bomHeaderNames];

  // Find Part Number header ID for filtering
  let partNumberHeaderId = null;
  if (filterPrtAsm) {
    for (const [id, name] of headerMap) {
      if (name.toLowerCase().includes('part number') || 
          name.toLowerCase() === 'partnumber' ||
          id.toLowerCase().includes('partnumber')) {
        partNumberHeaderId = id;
        break;
      }
    }
  }

  const csvRows = [];
  csvRows.push(allHeaders.map(escapeCsvField).join(','));

  // Process each assembly
  for (const assembly of aggregateResult.assemblies) {
    if (!assembly.bom?.rows?.length) continue;

    const docName = assembly.source?.documentName || '';
    const folderPath = Array.isArray(assembly.source?.folderPath)
      ? assembly.source.folderPath.join(' / ')
      : (assembly.source?.folderPath || '');
    const assemblyName = assembly.assembly?.name || '';

    for (const row of assembly.bom.rows) {
      // Apply PRT/ASM filter if enabled
      if (filterPrtAsm && partNumberHeaderId) {
        const partNumber = row.headerIdToValue?.[partNumberHeaderId] || '';
        if (!prtAsmPattern.test(String(partNumber))) {
          continue; // Skip non-matching rows
        }
      }

      const sourceValues = [docName, folderPath, assemblyName].map(escapeCsvField);
      
      const bomValues = bomHeaderIds.map(hid => {
        let val = '';
        if (row.headerIdToValue && 
            Object.prototype.hasOwnProperty.call(row.headerIdToValue, hid)) {
          val = row.headerIdToValue[hid];
          if (Array.isArray(val)) val = val.join(';');
          if (val && typeof val === 'object') val = JSON.stringify(val);
        }
        return escapeCsvField(String(val ?? ''));
      });

      csvRows.push([...sourceValues, ...bomValues].join(','));
    }
  }

  return csvRows.join('\n');
}

/**
 * Escape a field for CSV format.
 */
function escapeCsvField(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

### Verification
1. Import in browser console: `import { aggregateBomToCSV } from '/js/utils/aggregateBomToCSV.js'`
2. Test with mock data
3. Test PRT/ASM filter with matching/non-matching rows

---

## Phase 2: Update Export Filter Modal

### Task
Add format selection and row filter options.

### File: `public/js/views/export-filter-modal.js`

### Changes

**Add to `_renderContent()` method**, after the existing prefix filter section:

```javascript
<!-- Format Selection -->
<div class="export-filter-section">
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
</div>

<!-- Row Filtering -->
<div class="export-filter-section">
  <label class="export-filter-section-label">Row Filtering</label>
  <label class="export-filter-checkbox">
    <input type="checkbox" name="filterPrtAsm">
    <span>Only include parts with PRT/ASM prefix in Part Number</span>
  </label>
  <p class="export-filter-help">
    Filters BOM rows where Part Number matches patterns like: 
    PRT-12345, ASM-WIDGET, PRT_ABC123
  </p>
</div>
```

**Update `_handleConfirm()` method**:

```javascript
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
    // Show validation error
    const errorEl = this.modalElement?.querySelector('.export-filter-error');
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
  }
}
```

### File: `public/css/views/export-filter-modal.css`

**Add these styles**:

```css
.export-filter-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.export-filter-section-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.export-filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.export-filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.export-filter-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.export-filter-checkbox span {
  color: #555;
  font-size: 0.95rem;
}

.export-filter-help {
  margin: 0.5rem 0 0 1.5rem;
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
}

.export-filter-error {
  display: none;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
  font-size: 0.9rem;
}
```

---

## Phase 3: Enhanced Pre-Scan Stats Modal

### Task
Add live stats, root folder visualization, and cancel/resume capability.

### File: `public/js/views/export-stats-modal.js`

### Key Changes

**1. Add scan state tracking**:

```javascript
constructor() {
  this.modalElement = null;
  this.scanState = {
    startTime: null,
    elapsedInterval: null,
    rootFolders: [],
    checkpoint: null
  };
}
```

**2. Update `showLoading()` to show live scan UI**:

```javascript
showLoading() {
  this.hide();
  
  // Check for existing checkpoint
  const checkpoint = this._loadCheckpoint();
  
  this.modalElement = document.createElement('div');
  this.modalElement.className = 'export-stats-modal-overlay';
  this.modalElement.innerHTML = this._renderScanningContent(checkpoint);
  
  // Bind cancel button
  this.modalElement.querySelector('.export-stats-cancel-btn')
    ?.addEventListener('click', () => this._handleScanCancel());
  
  // Start elapsed timer
  this.scanState.startTime = Date.now();
  this.scanState.elapsedInterval = setInterval(() => this._updateElapsed(), 1000);
  
  document.body.appendChild(this.modalElement);
}

_renderScanningContent(checkpoint) {
  const resumeNotice = checkpoint ? `
    <div class="scan-resume-notice">
      <span>📌 Resuming from checkpoint: ${checkpoint.partialStats.foldersScanned} folders scanned</span>
      <button class="scan-resume-clear-btn">Start Fresh</button>
    </div>
  ` : '';
  
  return `
    <div class="export-stats-modal">
      <div class="export-stats-header">
        <h3>🔍 Scanning Workspace</h3>
      </div>
      
      <div class="export-stats-body">
        ${resumeNotice}
        
        <!-- Live Stats Grid -->
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
            <span class="scan-stat-icon">📐</span>
            <span class="scan-stat-label">Part Studios:</span>
            <span class="scan-stat-value" data-stat="partstudios">0</span>
          </div>
          <div class="scan-stat-row">
            <span class="scan-stat-icon">📝</span>
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
        
        <!-- Root Folders Status -->
        <div class="scan-root-folders">
          <h4>Root Folders</h4>
          <div class="scan-root-folders-list" data-container="rootFolders">
            <div class="scan-root-folder-placeholder">Loading folders...</div>
          </div>
        </div>
      </div>
      
      <div class="export-stats-footer">
        <button class="export-stats-cancel-btn">Cancel Scan</button>
      </div>
    </div>
  `;
}
```

**3. Add stat update methods**:

```javascript
updateScanStat(stat, value) {
  const el = this.modalElement?.querySelector(`[data-stat="${stat}"]`);
  if (el) el.textContent = String(value);
}

updateRootFolders(folders) {
  this.scanState.rootFolders = folders;
  const container = this.modalElement?.querySelector('[data-container="rootFolders"]');
  if (!container) return;
  
  container.innerHTML = folders.map(folder => `
    <div class="scan-root-folder ${folder.status}">
      <span class="scan-root-folder-icon">${this._getStatusIcon(folder.status)}</span>
      <span class="scan-root-folder-name">${escapeHtml(folder.name)}</span>
      <span class="scan-root-folder-info">${this._getStatusText(folder)}</span>
    </div>
  `).join('');
}

_getStatusIcon(status) {
  switch (status) {
    case 'scanned': return '✅';
    case 'scanning': return '🔄';
    case 'upcoming': return '⏳';
    case 'ignored': return '🚫';
    default: return '❓';
  }
}

_getStatusText(folder) {
  switch (folder.status) {
    case 'scanned': return `${folder.documentCount || 0} docs`;
    case 'scanning': return 'scanning...';
    case 'upcoming': return 'queued';
    case 'ignored': return 'filtered out';
    default: return '';
  }
}

_updateElapsed() {
  if (!this.scanState.startTime) return;
  const elapsed = Math.floor((Date.now() - this.scanState.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  this.updateScanStat('elapsed', `${mins}:${secs.toString().padStart(2, '0')}`);
}
```

**4. Add cancel/resume logic**:

```javascript
_handleScanCancel() {
  // Signal cancellation to controller
  if (this._onCancel) {
    this._onCancel();
  }
  
  // Prompt for checkpoint save
  if (this.scanState.rootFolders.length > 0) {
    const saveCheckpoint = confirm('Save progress to resume later?');
    if (saveCheckpoint) {
      this._saveCheckpoint();
    }
  }
  
  this.hide();
}

_saveCheckpoint() {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    rootFolders: this.scanState.rootFolders,
    partialStats: {
      // Gather current stats from DOM
      foldersScanned: parseInt(this.modalElement?.querySelector('[data-stat="folders"]')?.textContent || '0'),
      documentsScanned: parseInt(this.modalElement?.querySelector('[data-stat="documents"]')?.textContent || '0')
    }
  };
  sessionStorage.setItem('exportScanCheckpoint', JSON.stringify(checkpoint));
}

_loadCheckpoint() {
  try {
    const data = sessionStorage.getItem('exportScanCheckpoint');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

_clearCheckpoint() {
  sessionStorage.removeItem('exportScanCheckpoint');
}
```

### File: `public/css/views/export-stats-modal.css`

**Add these styles**:

```css
/* Live Stats Grid */
.scan-live-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.scan-stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scan-stat-icon {
  width: 24px;
  text-align: center;
}

.scan-stat-label {
  flex: 0 0 140px;
  color: #666;
  font-size: 0.9rem;
}

.scan-stat-value {
  font-weight: 600;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.scan-stat-path .scan-stat-value {
  font-family: monospace;
  font-size: 0.85rem;
  color: #0066cc;
  word-break: break-all;
  max-width: 300px;
}

/* Root Folders List */
.scan-root-folders {
  margin-top: 1rem;
}

.scan-root-folders h4 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #444;
}

.scan-root-folders-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.scan-root-folder {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.scan-root-folder.scanning {
  background: #fff8e6;
  border-color: #ffc107;
}

.scan-root-folder.scanning .scan-root-folder-icon {
  animation: spin 1s linear infinite;
}

.scan-root-folder.scanned {
  background: #e8f5e9;
  border-color: #4caf50;
}

.scan-root-folder.ignored {
  background: #f5f5f5;
  border-color: #bbb;
  opacity: 0.7;
}

.scan-root-folder-name {
  flex: 1;
  font-weight: 500;
}

.scan-root-folder-info {
  color: #777;
  font-size: 0.85rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Resume Notice */
.scan-resume-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.scan-resume-clear-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  background: transparent;
  border: 1px solid #1976d2;
  color: #1976d2;
  border-radius: 4px;
  cursor: pointer;
}

.scan-resume-clear-btn:hover {
  background: #1976d2;
  color: white;
}
```

---

## Phase 4: Backend SSE Enhancements

### Task
Add enhanced progress events with current path and element counts.

### File: `src/services/onshape-api-client.ts`

### Changes to `getDirectoryStats()` method

**Add rootFolders tracking and enhanced progress**:

```typescript
async getDirectoryStats(
  limit: number = 100,
  options: DirectoryStatsOptions = {}
): Promise<DirectoryStats> {
  const { scope, prefixFilter, onProgress, signal } = options;
  
  const startTime = Date.now();
  
  // Get root folders
  const rootItems = await this.getGlobalTreeRootNodes();
  
  // Initialize root folder tracking
  const rootFolderStatuses: Map<string, {
    id: string;
    name: string;
    status: 'upcoming' | 'scanning' | 'scanned' | 'ignored';
    documentCount: number;
  }> = new Map();
  
  // Apply prefix filter and set initial statuses
  let foldersToScan: TreeItem[] = [];
  for (const item of rootItems.items) {
    if (item.jsonType !== 'folder') continue;
    
    const isFiltered = prefixFilter && !item.name.startsWith(prefixFilter);
    
    rootFolderStatuses.set(item.id, {
      id: item.id,
      name: item.name,
      status: isFiltered ? 'ignored' : 'upcoming',
      documentCount: 0
    });
    
    if (!isFiltered) {
      foldersToScan.push(item);
    }
  }
  
  // Emit initial progress with root folders
  if (onProgress) {
    onProgress({
      phase: 'scanning',
      scan: {
        foldersScanned: 0,
        documentsScanned: 0,
        currentPath: ['/'],
        elementCounts: { ASSEMBLY: 0, PARTSTUDIO: 0, DRAWING: 0, BLOB: 0, OTHER: 0 },
        rootFolders: Array.from(rootFolderStatuses.values())
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // BFS with enhanced progress...
  // (Update status to 'scanning' when entering a root folder)
  // (Update status to 'scanned' with documentCount when leaving)
  // (Emit currentPath as array of folder names)
```

**Update progress emission in BFS loop**:

```typescript
// When starting to process a root folder
if (rootFolderStatuses.has(current.id)) {
  const status = rootFolderStatuses.get(current.id)!;
  status.status = 'scanning';
}

// Emit progress with current absolute path
if (onProgress) {
  onProgress({
    phase: 'scanning',
    scan: {
      foldersScanned: totalFolders,
      documentsScanned: totalDocuments,
      currentPath: currentPath, // Array like ['Root', 'Projects', 'Widget']
      elementCounts: { ...elementCounts },
      rootFolders: Array.from(rootFolderStatuses.values())
    },
    timestamp: new Date().toISOString()
  });
}

// When finished with a root folder
if (rootFolderStatuses.has(rootFolderId)) {
  const status = rootFolderStatuses.get(rootFolderId)!;
  status.status = 'scanned';
  status.documentCount = docsInThisRoot;
}
```

### File: `src/types/onshape.ts`

**Update `ExportProgressEvent` interface**:

```typescript
export interface ExportProgressEvent {
  phase: ExportPhase;
  
  scan?: {
    foldersScanned: number;
    documentsScanned: number;
    currentPath: string[];  // NEW: Absolute path as array
    elementCounts: {        // NEW: Element type breakdown
      ASSEMBLY: number;
      PARTSTUDIO: number;
      DRAWING: number;
      BLOB: number;
      OTHER: number;
    };
    rootFolders: Array<{    // NEW: Root folder statuses
      id: string;
      name: string;
      status: 'scanned' | 'scanning' | 'upcoming' | 'ignored';
      documentCount: number;
    }>;
  };
  
  // ... existing fields
}
```

---

## Phase 5: Controller Integration

### Task
Wire everything together in the document controller.

### File: `public/js/controllers/document-controller.js`

### Changes

**1. Add import**:

```javascript
import { aggregateBomToCSV } from '../utils/aggregateBomToCSV.js';
```

**2. Add CSV download helper**:

```javascript
_downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
```

**3. Update `_startAggregateBomExport()` onComplete handler**:

```javascript
onComplete: (result) => {
  if (btn) {
    btn.textContent = originalText;
    btn.disabled = false;
  }

  if (isPartial) {
    this.state.clearExportSelection();
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const scopeLabel = isPartial
    ? 'partial'
    : filterOptions?.prefixFilter
    ? `filtered-${filterOptions.prefixFilter}`
    : 'full';

  // Download based on format selection
  const formats = filterOptions?.formats || { json: true, csv: false };
  const rowFilters = filterOptions?.rowFilters || {};
  
  let downloadCount = 0;
  
  if (formats.json) {
    const jsonFilename = `aggregate-bom-${scopeLabel}-${timestamp}.json`;
    this._downloadJson(result, jsonFilename);
    downloadCount++;
  }
  
  if (formats.csv) {
    const csv = aggregateBomToCSV(result, {
      filterPrtAsm: rowFilters.prtAsmOnly || false
    });
    
    if (csv) {
      const csvFilename = `aggregate-bom-${scopeLabel}-${timestamp}.csv`;
      this._downloadCsv(csv, csvFilename);
      downloadCount++;
    }
  }

  // Build success message
  const formatNames = [];
  if (formats.json) formatNames.push('JSON');
  if (formats.csv) formatNames.push('CSV');
  
  const rowFilterNote = rowFilters.prtAsmOnly ? ' (PRT/ASM filtered)' : '';
  
  this._toast(
    `✅ Exported ${result.summary?.assembliesSucceeded || 0} assemblies ` +
    `as ${formatNames.join(' + ')}${rowFilterNote}`
  );
},
```

**4. Update progress modal to receive enhanced scan events**:

In the `startExport` callback, ensure the modal handles enhanced progress:

```javascript
// In exportProgressModal.show() options
handleProgress: (event) => {
  // Update scan stats
  if (event.phase === 'scanning' && event.scan) {
    exportStatsModal.updateScanStat('folders', event.scan.foldersScanned);
    exportStatsModal.updateScanStat('documents', event.scan.documentsScanned);
    exportStatsModal.updateScanStat('currentPath', event.scan.currentPath.join(' / ') || '/');
    
    if (event.scan.elementCounts) {
      exportStatsModal.updateScanStat('assemblies', event.scan.elementCounts.ASSEMBLY);
      exportStatsModal.updateScanStat('partstudios', event.scan.elementCounts.PARTSTUDIO);
      exportStatsModal.updateScanStat('drawings', event.scan.elementCounts.DRAWING);
      exportStatsModal.updateScanStat('blobs', event.scan.elementCounts.BLOB);
    }
    
    if (event.scan.rootFolders) {
      exportStatsModal.updateRootFolders(event.scan.rootFolders);
    }
  }
}
```

---

## Verification Steps

After each phase, verify:

### Phase 1
```javascript
// In browser console
import { aggregateBomToCSV } from '/js/utils/aggregateBomToCSV.js';

const mockResult = {
  assemblies: [{
    source: { documentName: 'Doc1', folderPath: ['Root', 'Projects'] },
    assembly: { name: 'Asm1' },
    bom: {
      headers: [{ id: 'pn', name: 'Part Number' }, { id: 'qty', name: 'Quantity' }],
      rows: [
        { headerIdToValue: { pn: 'PRT-001', qty: 5 } },
        { headerIdToValue: { pn: 'BOLT-001', qty: 10 } }
      ]
    }
  }]
};

console.log(aggregateBomToCSV(mockResult)); // All rows
console.log(aggregateBomToCSV(mockResult, { filterPrtAsm: true })); // Only PRT row
```

### Phase 2
1. Click "Get All" button
2. Filter modal shows format checkboxes (both checked by default)
3. Filter modal shows PRT/ASM filter checkbox (unchecked by default)
4. Uncheck both formats → shows validation error
5. Check PRT/ASM filter → reflected in returned options

### Phase 3
1. During scan, live stats update in real-time
2. Current path shows full folder path
3. Root folders show correct status icons
4. Cancel button prompts for checkpoint save
5. Re-opening modal offers resume option

### Phase 4
1. Backend emits enhanced progress events
2. `currentPath` is array of folder names
3. `elementCounts` includes all types
4. `rootFolders` includes status and document counts

### Phase 5
1. Full export with JSON only → downloads .json
2. Full export with CSV only → downloads .csv
3. Full export with both → downloads both files
4. PRT/ASM filter → CSV has fewer rows than JSON
5. Toast shows correct format names

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| CSV has wrong encoding | Ensure UTF-8 BOM or charset in Blob |
| Progress not updating | Check SSE connection, verify event parsing |
| Root folders not showing | Verify `globaltreenodes/magic` response format |
| Cancel not working | Ensure AbortController signal is passed through |
| Checkpoint not persisting | Check sessionStorage quota/availability |

---

*Generated for OnShape DocuReader CSV Export Feature*