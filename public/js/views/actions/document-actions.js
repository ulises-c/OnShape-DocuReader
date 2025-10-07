/**
 * Action handlers for document-level operations
 */

import { copyToClipboard } from '../../utils/clipboard.js';
import { downloadJson, downloadCsv } from '../../utils/file-download.js';
import { showToast } from '../../utils/toast-notification.js';

export class DocumentActions {
  constructor(controller) {
    this.controller = controller;
  }

  async handleGetDocument(docId) {
    try {
      const doc = this.controller.state.getState().currentDocument;
      if (!doc || doc.id !== docId) {
        showToast('Document not loaded');
        return false;
      }

      const comprehensive = await this.controller.documentService.getComprehensiveDocument(doc.id);
      downloadJson(comprehensive, `${doc.name || doc.id}.json`);
      showToast('Document JSON downloaded');
      return true;
    } catch (err) {
      console.error('Failed to get document:', err);
      showToast('Failed to get document');
      return false;
    }
  }

  async handleGetJson(docData) {
    try {
      downloadJson(docData, `${docData.name || docData.id}.json`);
      showToast('Document JSON downloaded');
      return true;
    } catch (err) {
      console.error('Failed to download JSON:', err);
      showToast('Failed to download JSON');
      return false;
    }
  }

  async handleCopyJson(docData) {
    try {
      await copyToClipboard(JSON.stringify(docData, null, 2));
      showToast('JSON copied to clipboard');
      return true;
    } catch (e) {
      console.error('Failed to copy raw JSON:', e);
      showToast('Failed to copy JSON');
      return false;
    }
  }

  async handleLoadHierarchy(docId, controller) {
    try {
      await controller.loadHierarchy(docId);
      return true;
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      showToast('Failed to load hierarchy');
      return false;
    }
  }

  async handleExportCsv(docData, elements) {
    try {
      const csvRows = [];
      const header = ['ID', 'Name', 'Type', 'ElementType'];
      csvRows.push(header.join(','));
      
      for (const el of elements) {
        const type = el.elementType || el.type || '';
        if (type === 'ASSEMBLY' || type === 'PART') {
          const row = [
            `"${el.id}"`,
            `"${el.name || ''}"`,
            `"${el.type || ''}"`,
            `"${el.elementType || ''}"`,
          ];
          csvRows.push(row.join(','));
        }
      }
      
      const csvContent = csvRows.join('\n');
      downloadCsv(csvContent, `${docData.name || docData.id}-ASM-PRT.csv`);
      showToast('CSV exported for current document');
      return true;
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('Failed to export CSV');
      return false;
    }
  }
}
