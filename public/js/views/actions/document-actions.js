/**
 * Action handlers for document-level operations
 */

import { copyToClipboard } from '../../utils/clipboard.js';
import { downloadJson, downloadCsv } from '../../utils/file-download.js';
import { showToast } from '../../utils/toast-notification.js';
import { showPreview, showProgress, showError, hide as hideActionModal } from '../action-preview-modal.js';

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

      showProgress({
        title: "Get Document",
        statusText: "Fetching comprehensive document JSON..."
      });

      const comprehensive = await this.controller.documentService.getComprehensiveDocument(doc.id);
      const filename = `${doc.name || doc.id}.json`;
      const content = JSON.stringify(comprehensive, null, 2);

      showPreview({
        title: "Get Document",
        statusText: `Ready to download: ${filename}`,
        contentText: content,
        showDownload: true,
        onCopy: async () => {
          await copyToClipboard(content);
          showToast('JSON copied to clipboard');
        },
        onDownload: async () => {
          downloadJson(comprehensive, filename);
          showToast('Document JSON downloaded');
          hideActionModal();
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to get document:', err);
      showError({
        title: "Get Document",
        statusText: "Failed",
        errorMessage: err?.message || "Failed to fetch document"
      });
      showToast('Failed to get document');
      return false;
    }
  }

  async handleGetJson(docData) {
    try {
      // Maintain behavior: "Get JSON" downloads immediately, but show preview first so user can copy.
      const filename = `${docData.name || docData.id}.json`;
      const content = JSON.stringify(docData, null, 2);

      showPreview({
        title: "Document JSON",
        statusText: `Ready to download: ${filename}`,
        contentText: content,
        showDownload: true,
        onCopy: async () => {
          await copyToClipboard(content);
          showToast('JSON copied to clipboard');
        },
        onDownload: async () => {
          downloadJson(docData, filename);
          showToast('Document JSON downloaded');
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to download JSON:', err);
      showToast('Failed to download JSON');
      return false;
    }
  }

  async handleCopyJson(docData) {
    try {
      const content = JSON.stringify(docData, null, 2);

      // Show preview and copy from the preview content, no new API call.
      showPreview({
        title: "Copy Raw JSON",
        statusText: "Review the content, then click Copy",
        contentText: content,
        showDownload: false,
        onCopy: async () => {
          await copyToClipboard(content);
          showToast('JSON copied to clipboard');
        }
      });

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
