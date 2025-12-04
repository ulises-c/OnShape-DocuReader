/**
 * Action handlers for element-level operations
 */

import { downloadJson } from '../../utils/file-download.js';
import { showToast } from '../../utils/toast-notification.js';
import { downloadCsv } from '../../utils/file-download.js';
import { bomToCSV } from '../../utils/bomToCSV.js';
import { fullAssemblyExtract, ExportPhase } from '../../utils/fullAssemblyExporter.js';
import { showModal, updateProgress, hideModal } from '../full-extract-modal.js';

export class ElementActions {
  constructor(controller, documentService) {
    this.controller = controller;
    this.documentService = documentService;
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
      const bom = await service.getBillOfMaterials(
        documentId,
        workspaceId,
        element.id
      );
      downloadJson(bom, `${element.name || element.id}-BOM.json`);
      showToast('BOM JSON downloaded');
      return true;
    } catch (apiErr) {
      console.error('Failed to fetch BOM from server:', apiErr);
      showToast('Failed to fetch BOM from server');
      return false;
    }
  }

  async handleDownloadBomCsv(element, documentId, workspaceId, service) {
    try {
      const bom = await service.getBillOfMaterials(
        documentId,
        workspaceId,
        element.id
      );
      
      // const { bomToCSV } = await import('../../utils/bomToCSV.js');
      const csv = bomToCSV(bom);
      
      if (!csv) {
        showToast('No BOM data available for CSV export');
        return false;
      }
      
      // const { downloadCsv } = await import('../../utils/file-download.js');
      downloadCsv(csv, `${element.name || element.id}-BOM.csv`);
      showToast('BOM CSV downloaded');
      return true;
    } catch (err) {
      console.error('Failed to export BOM CSV:', err);
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
}
