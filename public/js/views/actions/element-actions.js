/**
 * Action handlers for element-level operations
 */

import { downloadJson } from '../../utils/file-download.js';
import { showToast } from '../../utils/toast-notification.js';
import { downloadCsv } from '../../utils/file-download.js';
import { bomToCSV } from '../../utils/bomToCSV.js';

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
}
