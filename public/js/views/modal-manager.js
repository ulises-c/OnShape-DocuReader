/**
 * ModalManager - controls export and progress modals
 */

import { qsa, qs } from '../utils/dom-helpers.js';

export class ModalManager {
  constructor() {
    this.exportModal = qs('#exportModal');
    this.progressModal = qs('#progressModal');
    this.bound = false;
    this.handlers = {
      onStartExport: null,
      onCancelExport: null
    };
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  showExport() {
    if (!this.exportModal) {
      console.error('Export modal not found');
      return;
    }
    this.exportModal.style.display = 'block';

    if (!this.bound) {
      this.bindExportModalEvents();
      this.bound = true;
    }

    this.updateEstimates();
  }

  hideExport() {
    if (this.exportModal) this.exportModal.style.display = 'none';
  }

  showProgress() {
    if (!this.progressModal) {
      console.error('Progress modal not found');
      return;
    }
    this.progressModal.style.display = 'block';
    this.bindProgressModalEvents();
  }

  hideProgress() {
    if (this.progressModal) this.progressModal.style.display = 'none';
  }

  bindExportModalEvents() {
    const closeBtn = qs('#exportModalClose');
    const cancelBtn = qs('#cancelExport');
    const startBtn = qs('#startExport');

    closeBtn?.addEventListener('click', () => this.hideExport());
    cancelBtn?.addEventListener('click', () => this.hideExport());
    startBtn?.addEventListener('click', () => {
      const options = this.readExportOptions();
      this.hideExport();
      this.handlers.onStartExport?.(options);
    });

    // Recompute estimates on option changes
    qsa('#exportModal input, #exportModal select').forEach((el) => {
      el.addEventListener('change', () => this.updateEstimates());
    });
  }

  bindProgressModalEvents() {
    const cancelBtn = qs('#cancelExportProgress');
    cancelBtn?.addEventListener('click', () => {
      this.hideProgress();
      this.handlers.onCancelExport?.();
    });
  }

  readExportOptions() {
    const getChecked = (id, def = false) => !!qs(`#${id}`)?.checked || def;
    const getRadio = (name, def) => qs(`input[name="${name}"]:checked`)?.value || def;
    const rpm = parseInt(qs('#requestsPerMinute')?.value || '30', 10);

    return {
      includeBasicInfo: getChecked('exportBasicInfo', true),
      includeElements: getChecked('exportElements', true),
      includeParts: getChecked('exportParts', false),
      includeAssemblies: getChecked('exportAssemblies', false),
      includeMassProperties: getChecked('exportMassProperties', false),
      includeMetadata: getChecked('exportMetadata', false),
      versionMode: getRadio('versionMode', 'new'),
      format: getRadio('exportFormat', 'json'),
      requestsPerMinute: isNaN(rpm) ? 30 : rpm
    };
  }

  updateEstimates(documentsCount = null) {
    try {
      const countEl = qs('#estimatedCount');
      const timeEl = qs('#estimatedTime');
      const rpm = parseInt(qs('#requestsPerMinute')?.value || '30', 10) || 30;

      // Fall back by reading from table if not provided
      let docs = documentsCount;
      if (docs === null) {
        const bodyRows = qsa('.doc-details-table tbody tr');
        docs = bodyRows.length || 0;
      }

      // Estimate calls similarly to legacy logic
      let estimatedCalls = docs; // base calls

      const exportElements = qs('#exportElements')?.checked;
      const exportParts = qs('#exportParts')?.checked;
      const exportAssemblies = qs('#exportAssemblies')?.checked;
      const exportMassProperties = qs('#exportMassProperties')?.checked;
      const exportMetadata = qs('#exportMetadata')?.checked;

      if (exportElements) estimatedCalls += docs;
      if (exportParts) estimatedCalls += docs * 2;
      if (exportAssemblies) estimatedCalls += docs * 1;
      if (exportMassProperties) estimatedCalls += docs * 2;
      if (exportMetadata) estimatedCalls += docs * 1;

      const estimatedMinutes = Math.ceil(estimatedCalls / rpm);

      if (countEl) countEl.textContent = String(docs);
      if (timeEl) timeEl.textContent = `${estimatedMinutes} minutes`;
    } catch (e) {
      console.error('Error updating export estimates:', e);
    }
  }

  updateProgress(current, total) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const fillEl = qs('#progressFill');
    const currentEl = qs('#currentProgress');
    const totalEl = qs('#totalProgress');

    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (currentEl) currentEl.textContent = String(current);
    if (totalEl) totalEl.textContent = String(total);
  }

  setCurrentTask(text) {
    const taskEl = qs('#currentTask');
    if (taskEl) taskEl.textContent = text;
  }

  appendLog(message) {
    try {
      const log = qs('#exportLog');
      if (!log) return;
      const p = document.createElement('p');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
    } catch (e) {
      console.error('Error appending log:', e);
    }
  }
}
