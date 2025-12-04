# Full Assembly Extraction - Integration Guide

## Overview

This document describes the changes needed to integrate the Full Assembly Extraction feature into your existing OnShape DocuReader codebase.

## New Files to Add

### 1. `public/js/utils/fullAssemblyExporter.js`
Copy the provided `fullAssemblyExporter.js` to this location.

### 2. `public/js/views/full-extract-modal.js`
Copy the provided `full-extract-modal.js` to this location.

---

## Changes to Existing Files

### 1. `public/js/views/helpers/element-list-renderer.js`

Add a new "Full Extract" button for assembly elements.

**Find this section in `renderElementActions(element)`:**
```javascript
const bomButtons =
  element.elementType === 'ASSEMBLY'
    ? `
  <button class="btn fetch-bom-btn" data-element-id="${escapeHtml(
    element.id
  )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#28a745; color:white; border:1px solid #1e7e34; border-radius:4px; cursor:pointer;">Download BOM JSON</button>
  <button class="btn download-bom-csv-btn" data-element-id="${escapeHtml(
    element.id
  )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#ffc107; color:#333; border:1px solid #e0a800; border-radius:4px; cursor:pointer;">Download BOM CSV</button>
`
    : '';
```

**Replace with:**
```javascript
const bomButtons =
  element.elementType === 'ASSEMBLY'
    ? `
  <button class="btn fetch-bom-btn" data-element-id="${escapeHtml(
    element.id
  )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#28a745; color:white; border:1px solid #1e7e34; border-radius:4px; cursor:pointer;">Download BOM JSON</button>
  <button class="btn download-bom-csv-btn" data-element-id="${escapeHtml(
    element.id
  )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#ffc107; color:#333; border:1px solid #e0a800; border-radius:4px; cursor:pointer;">Download BOM CSV</button>
  <button class="btn full-extract-btn" data-element-id="${escapeHtml(
    element.id
  )}" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#6f42c1; color:white; border:1px solid #5a32a3; border-radius:4px; cursor:pointer;" title="Download BOM JSON, CSV, and all part thumbnails as ZIP">📦 Full Extract</button>
`
    : '';
```

---

### 2. `public/js/views/actions/element-actions.js`

Add the new handler method and import.

**Add import at the top of the file:**
```javascript
import { fullAssemblyExtract, ExportPhase } from '../../utils/fullAssemblyExporter.js';
import { showModal, updateProgress, hideModal } from '../full-extract-modal.js';
```

**Add new method to the `ElementActions` class:**
```javascript
/**
 * Handle full assembly extraction (BOM + CSV + Thumbnails ZIP)
 * 
 * @param {Object} element - Assembly element
 * @param {string} documentId - Document ID
 * @param {string} workspaceId - Workspace ID
 * @param {Object} service - DocumentService instance
 * @returns {Promise<boolean>} Success status
 */
async handleFullExtract(element, documentId, workspaceId, service) {
  if (element.elementType !== 'ASSEMBLY') {
    showToast('Full Extract is only available for assemblies');
    return false;
  }

  try {
    // Show progress modal
    showModal(element.name || element.id);

    // Execute extraction with progress updates
    await fullAssemblyExtract({
      element,
      documentId,
      workspaceId,
      documentService: service,
      onProgress: (progress) => {
        updateProgress(progress);
        
        // Log to console for backend tracking
        if (progress.phase === ExportPhase.COMPLETE) {
          console.log('[FullExtract] Export completed:', {
            assembly: progress.assemblyName,
            bomRows: progress.bomRows,
            thumbnails: progress.thumbnailsDownloaded,
            zipSize: progress.zipSizeBytes,
            duration: progress.elapsedMs
          });
        }
      }
    });

    showToast('Full extraction complete!');
    return true;

  } catch (err) {
    console.error('[FullExtract] Error:', err);
    showToast(`Full extraction failed: ${err.message}`);
    return false;
  }
}
```

---

### 3. `public/js/views/document-detail-view.js`

Bind the click handler for the new button.

**Find the `_bindElementActions` method and add a handler for `.full-extract-btn`:**

Inside the event listener callback in `_bindElementActions`, add:

```javascript
// Full Extract button handler
const fullExtractBtn = e.target.closest('.full-extract-btn');
if (fullExtractBtn) {
  const elementId = fullExtractBtn.getAttribute('data-element-id');
  const el = this._elementsMap.get(String(elementId));
  if (el) {
    await this.elementActions.handleFullExtract(
      el,
      docData.id,
      docData.defaultWorkspace?.id,
      this.documentService
    );
  }
}
```

**Full context - the updated `_bindElementActions` should include:**

```javascript
_bindElementActions(elementsContainer, docData) {
  if (!elementsContainer) return;

  elementsContainer.addEventListener('click', async (e) => {
    // Copy element JSON button
    const copyBtn = e.target.closest('.copy-element-json-btn');
    if (copyBtn) {
      const elementId = copyBtn.getAttribute('data-element-id');
      const el = this._elementsMap.get(String(elementId));
      if (el) {
        const success = await this.elementActions.handleCopyElementJson(
          el,
          this.controller
        );
        if (success && copyBtn) this._flashButton(copyBtn);
      }
    }

    // Fetch BOM JSON button
    const bomBtn = e.target.closest('.fetch-bom-btn');
    if (bomBtn) {
      const elementId = bomBtn.getAttribute('data-element-id');
      const el = this._elementsMap.get(String(elementId));
      if (el) {
        await this.elementActions.handleFetchBomJson(
          el,
          docData.id,
          docData.defaultWorkspace?.id,
          this.documentService
        );
      }
    }

    // Download BOM CSV button
    const csvBtn = e.target.closest('.download-bom-csv-btn');
    if (csvBtn) {
      const elementId = csvBtn.getAttribute('data-element-id');
      const el = this._elementsMap.get(String(elementId));
      if (el) {
        await this.elementActions.handleDownloadBomCsv(
          el,
          docData.id,
          docData.defaultWorkspace?.id,
          this.documentService
        );
      }
    }

    // Full Extract button (NEW)
    const fullExtractBtn = e.target.closest('.full-extract-btn');
    if (fullExtractBtn) {
      const elementId = fullExtractBtn.getAttribute('data-element-id');
      const el = this._elementsMap.get(String(elementId));
      if (el) {
        await this.elementActions.handleFullExtract(
          el,
          docData.id,
          docData.defaultWorkspace?.id,
          this.documentService
        );
      }
    }
  });
}
```

---

## CSS Additions (Optional)

Add to `public/css/main.css` for modal styling:

```css
/* Full Extract Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay .modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

/* Full Extract Button Hover */
.full-extract-btn:hover {
  background: #5a32a3 !important;
}
```

---

## Testing Checklist

1. [ ] Navigate to a document with an assembly element
2. [ ] Verify the "📦 Full Extract" button appears for assemblies
3. [ ] Click the button and verify modal opens
4. [ ] Watch progress through phases:
   - Initializing
   - Fetching BOM data
   - Converting to CSV
   - Downloading thumbnails (with count)
   - Building ZIP
5. [ ] Verify ZIP downloads automatically
6. [ ] Check ZIP contents:
   - `{assembly}-BOM.json`
   - `{assembly}-BOM.csv`
   - `thumbnails/` folder with `.png` files
7. [ ] Verify thumbnail filenames follow format: `{itemNum}_{partNum}_{name}.png`
8. [ ] Check backend console for API request logs
9. [ ] Test error handling (e.g., assembly with no BOM)

---

## Notes on Thumbnail URLs

The implementation constructs thumbnail URLs using data from BOM `relatedOccurrences`:

```
https://cad.onshape.com/api/thumbnails/d/{documentId}/w/{workspaceId}/e/{elementId}/s/300x300?partId={partId}
```

If BOM rows don't include `relatedOccurrences`, the thumbnail for that row will be skipped. This is logged to console.

You may need to adjust the `parseBomRow` function if your BOM structure differs from the expected format.

---

## API Usage Tracking

All thumbnail fetches go through `/api/thumbnail-proxy`, which should already be instrumented with your `api-usage-tracker`. Each call will be logged to `api-usage.jsonl`.

Backend console will also show:
- `[FullExtract] BOM fetched: X rows`
- `[FullExtract] Prepared X thumbnail requests`
- `[FullExtract] Fetched X/Y thumbnails`
- `[FullExtract] Complete: filename.zip (XX KB)`