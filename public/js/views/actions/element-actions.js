/**
 * Action handlers for element-level operations
 */

import { downloadJson } from '../../utils/file-download.js';
import { showToast } from '../../utils/toast-notification.js';
import { downloadCsv } from '../../utils/file-download.js';
import { bomToCSV } from '../../utils/bomToCSV.js';
import { fullAssemblyExtract, ExportPhase } from '../../utils/fullAssemblyExporter.js';
import { showModal, updateProgress, hideModal } from '../full-extract-modal.js';
import { showProgress, showPreview, showError } from '../action-preview-modal.js';

export class ElementActions {
  constructor(controller, documentService) {
    this.controller = controller;
    this.documentService = documentService;

    // Prevent duplicate actions when views re-render and event listeners get rebound.
    // Keyed by action name, values are Sets of in-flight identifiers (e.g. element.id).
    this._inFlight = new Map();
    this._lastClickAtMs = new Map();
  }

  _getInFlightSet(action) {
    let set = this._inFlight.get(action);
    if (!set) {
      set = new Set();
      this._inFlight.set(action, set);
    }
    return set;
  }

  _isDuplicateClick(action, key, windowMs = 750) {
    const now = Date.now();
    const mapKey = `${action}:${key}`;
    const last = this._lastClickAtMs.get(mapKey) || 0;
    this._lastClickAtMs.set(mapKey, now);
    return now - last < windowMs;
  }

  async _runSingleFlight(action, key, fn) {
    const inFlight = this._getInFlightSet(action);
    if (inFlight.has(key)) {
      return { ran: false, reason: "in-flight" };
    }

    inFlight.add(key);
    try {
      await fn();
      return { ran: true };
    } finally {
      inFlight.delete(key);
    }
  }

  async handleCopyElementJson(element, controller) {
    try {
      await controller.copyElementJson(element);
      showToast(`${element.name || element.id} JSON copied`);
      return true;
    } catch (err) {
      console.error('Error copying element JSON:', err);
      showToast('Failed to copy element JSON');
      return false;
    }
  }

  async handleFetchBomJson(element, documentId, workspaceId, service) {
    try {
      const filename = `${element.name || element.id}-BOM.json`;

      showProgress({
        title: "Download BOM JSON",
        statusText: `Fetching BOM for "${element.name || element.id}"...`
      });

      const bom = await service.getBillOfMaterials(
        documentId,
        workspaceId,
        element.id
      );

      const content = JSON.stringify(bom, null, 2);

      showPreview({
        title: "Download BOM JSON",
        statusText: `Ready to download: ${filename}`,
        contentText: content,
        showDownload: true,
        onCopy: async () => {
          // Copy from the already-fetched content, no extra API call.
          await navigator.clipboard.writeText(content);
          showToast('BOM JSON copied to clipboard');
        },
        onDownload: async () => {
          downloadJson(bom, filename);
          showToast('BOM JSON downloaded');
        }
      });

      return true;
    } catch (apiErr) {
      console.error('Failed to fetch BOM from server:', apiErr);
      showError({
        title: "Download BOM JSON",
        statusText: "Failed",
        errorMessage: apiErr?.message || "Failed to fetch BOM"
      });
      showToast('Failed to fetch BOM from server');
      return false;
    }
  }

  async handleDownloadBomCsv(element, documentId, workspaceId, service) {
    try {
      const filename = `${element.name || element.id}-BOM.csv`;

      showProgress({
        title: "Download BOM CSV",
        statusText: `Fetching BOM and generating CSV for "${element.name || element.id}"...`
      });

      const bom = await service.getBillOfMaterials(
        documentId,
        workspaceId,
        element.id
      );
      
      // const { bomToCSV } = await import('../../utils/bomToCSV.js');
      const csv = bomToCSV(bom);
      
      if (!csv) {
        showError({
          title: "Download BOM CSV",
          statusText: "No data",
          errorMessage: "No BOM data available for CSV export"
        });
        showToast('No BOM data available for CSV export');
        return false;
      }

      showPreview({
        title: "Download BOM CSV",
        statusText: `Ready to download: ${filename}`,
        contentText: csv,
        showDownload: true,
        onCopy: async () => {
          // Copy from generated CSV content, no extra API call.
          await navigator.clipboard.writeText(csv);
          showToast('BOM CSV copied to clipboard');
        },
        onDownload: async () => {
          downloadCsv(csv, filename);
          showToast('BOM CSV downloaded');
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to export BOM CSV:', err);
      showError({
        title: "Download BOM CSV",
        statusText: "Failed",
        errorMessage: err?.message || "Failed to export BOM CSV"
      });
      showToast('Failed to export BOM CSV');
      return false;
    }
  }

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

    const key = `${documentId}:${workspaceId}:${element.id}`;

    // Extra protection against double dispatch in the same tick or rapid duplicate events.
    if (this._isDuplicateClick("fullExtract", key, 1000)) {
      return false;
    }

    // Disable the clicked button immediately if present.
    // This is best-effort, event delegation means the specific button might not be available here.
    // NOTE: The UI uses `.full-extract-btn` (see element-list-renderer.js). Keep selector in sync.
    const buttonSelector = `.full-extract-btn[data-element-id="${element.id}"]`;
    const btn = document.querySelector(buttonSelector);
    const prevDisabled = btn ? btn.disabled : null;
    if (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    }

    let finalSummary = null;

    try {
      const result = await this._runSingleFlight("fullExtract", key, async () => {
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

              // Capture summary to present to user after ZIP download triggers.
              finalSummary = {
                assemblyName: progress.assemblyName,
                bomRows: progress.bomRows,
                thumbnailsDownloaded: progress.thumbnailsDownloaded,
                thumbnailsFailed: progress.thumbnailsFailed,
                thumbnailsSkipped: progress.thumbnailsSkipped,
                zipSizeBytes: progress.zipSizeBytes,
                elapsedMs: progress.elapsedMs,
                thumbnailReport: progress.thumbnailReport || null
              };
            }
          }
        });

        showToast('Full extraction complete!');
      });

      if (!result.ran) {
        // Another handler is already running due to duplicated listeners.
        // Keep UX quiet to avoid spam, the modal already shows progress.
        return false;
      }

      // After the ZIP download is triggered, show a preview modal with copyable summary.
      if (finalSummary) {
        const reportText = JSON.stringify(finalSummary, null, 2);
        showPreview({
          title: "Full Extract",
          statusText: "ZIP download triggered. Copy summary or close.",
          contentText: reportText,
          showDownload: false,
          onCopy: async () => {
            await navigator.clipboard.writeText(reportText);
            showToast('Full extract summary copied to clipboard');
          }
        });
      } else {
        // If we did not receive a completion event for some reason, still show a minimal confirmation.
        showPreview({
          title: "Full Extract",
          statusText: "ZIP download triggered.",
          contentText: "Extraction completed, ZIP download was triggered by the browser.",
          showDownload: false,
          onCopy: async () => {
            await navigator.clipboard.writeText("Extraction completed, ZIP download was triggered by the browser.");
            showToast('Copied');
          }
        });
      }

      return true;
    } catch (err) {
      console.error('[FullExtract] Error:', err);
      showError({
        title: "Full Extract",
        statusText: "Failed",
        errorMessage: err?.message || "Full extraction failed"
      });
      showToast(`Full extraction failed: ${err.message}`);
      return false;
    } finally {
      // Do not hide the FullExtractModal unconditionally here.
      // It is the primary "doing work" UI, hiding it immediately caused the user to never see it.
      // On completion, the modal shows a Close button, and the user can dismiss it.
      // On error, we hide it to avoid trapping the user behind an incomplete modal.
      if (!finalSummary) {
        try {
          hideModal();
        } catch {
          // no-op
        }
      }
      if (btn) {
        btn.disabled = prevDisabled === null ? false : prevDisabled;
        btn.removeAttribute("aria-busy");
      }
    }
  }
}
