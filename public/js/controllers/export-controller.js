/**
 * ExportController - orchestrates export workflow
 */

import { downloadJson } from '../utils/download.js';

export class ExportController {
  constructor(state, services, modalManager) {
    this.state = state;
    this.exportService = services.exportService;
    this.modal = modalManager;

    this.modal.setHandlers({
      onStartExport: (options) => this.startExport(options),
      onCancelExport: () => this.cancelExport()
    });
  }

  showExportModal(selectedDocuments = null) {
    // Store the selected documents in state for estimates if needed
    const docs = selectedDocuments ?? this.state.getState().documents;
    this._lastDocsCount = docs.length;
    this.modal.showExport();
    this.modal.updateEstimates(this._lastDocsCount);
  }

  async startExport(options) {
    console.log('Starting advanced export...');
    this.modal.showProgress();
    this.modal.setCurrentTask('Processing all documents...');
    this.modal.appendLog('📊 Processing documents...');

    let prog = 0;
    const total = 100;
    const timer = setInterval(() => {
      prog = Math.min(prog + 10, 90);
      this.modal.updateProgress(prog, total);
    }, 1000);

    try {
      const data = await this.exportService.execute(options);
      clearInterval(timer);
      this.modal.updateProgress(data.exportInfo.processedDocuments, data.exportInfo.totalDocuments);
      this.modal.appendLog('✅ Export completed successfully!');
      this.modal.appendLog(
        `📊 Processed ${data.exportInfo.processedDocuments}/${data.exportInfo.totalDocuments} documents`
      );

      // Download file
      downloadJson(data, 'onshape-export');

      setTimeout(() => this.modal.hideProgress(), 1500);
    } catch (e) {
      clearInterval(timer);
      console.error('Export failed:', e);
      this.modal.appendLog(`❌ Export failed: ${e.message}`);
      this.modal.hideProgress();
    }
  }

  cancelExport() {
    // Placeholder - backend cancel not implemented
    this.modal.appendLog('❌ Export cancelled by user');
  }
}
