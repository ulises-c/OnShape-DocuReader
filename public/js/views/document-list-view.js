/**
 * DocumentListView - renders document grid/table
 */

import { BaseView } from './base-view.js';
import { escapeHtml, qsa, qs } from '../utils/dom-helpers.js';

export class DocumentListView extends BaseView {
  constructor(containerSelector, controller) {
    super(containerSelector);
    this.controller = controller;
    this._unsub = [];
  }

  render(documents) {
    if (!documents || documents.length === 0) {
      this.renderHtml('<p style="text-align:center; color:#666; font-style:italic;">No documents found</p>');
      return;
    }

    const rows = documents.map((doc) => {
      const creator = doc.creator?.name || 'Unknown Creator';
      const created = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-';
      const modified = doc.modifiedAt ? new Date(doc.modifiedAt).toLocaleString() : '-';
      const lastModifiedBy = doc.modifiedBy?.name || doc.modifiedBy || '-';
      const parent = doc.parentName || doc.parent?.name || (doc.parentId ? `Parent ID: ${doc.parentId}` : '-');
      const type = doc.type || 'Document';

      return `
        <tr class="document-card" data-id="${escapeHtml(doc.id)}">
          <td class="select-column"><input type="checkbox" class="doc-checkbox" value="${escapeHtml(doc.id)}"></td>
          <td class="doc-file-title">${escapeHtml(doc.name)}</td>
          <td>${escapeHtml(creator)}</td>
          <td>${escapeHtml(created)}</td>
          <td>${escapeHtml(modified)}</td>
          <td>${escapeHtml(lastModifiedBy)}</td>
          <td>${escapeHtml(parent)}</td>
          <td>${escapeHtml(type)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <table class="doc-details-table">
        <thead>
          <tr>
            <th class="select-column"><input type="checkbox" id="selectAll" title="Select All"></th>
            <th>Name</th>
            <th>Creator</th>
            <th>Date Created</th>
            <th>Date Modified</th>
            <th>Last Modified By</th>
            <th>Parent</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    this.renderHtml(html);
    this.bind();
  }

  bind() {
    this.unbind();
    // Row click (document open)
    this._unsub.push(
      this._delegate('.document-card', 'click', (e, row) => {
        if (e.target.type === 'checkbox' || e.target.closest('.select-column')) return;
        const id = row.getAttribute('data-id');
        if (id) {
          console.log('Document card clicked:', id);
          this.controller.viewDocument(id);
        }
      })
    );

    // Select all
    const selectAll = qs('#selectAll', this.container);
    selectAll?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      qsa('.doc-checkbox', this.container).forEach((cb) => {
        cb.checked = checked;
      });
      this._notifySelectionChanged();
    });

    // Individual checkboxes
    qsa('.doc-checkbox', this.container).forEach((cb) => {
      cb.addEventListener('change', () => {
        const boxes = qsa('.doc-checkbox', this.container);
        const checkedCount = boxes.filter((b) => b.checked).length;
        if (selectAll) {
          selectAll.checked = checkedCount === boxes.length;
          selectAll.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
        }
        this._notifySelectionChanged();
      });
    });

    // Initialize button state
    this._notifySelectionChanged();
  }

  _notifySelectionChanged() {
    const checked = qsa('.doc-checkbox:checked', this.container).map((cb) => cb.value);
    this.controller.onSelectionChanged(checked);
  }

  _delegate(selector, eventName, handler) {
    const root = this.container;
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    };
    root.addEventListener(eventName, listener);
    return () => root.removeEventListener(eventName, listener);
  }

  unbind() {
    this._unsub.forEach((off) => off());
    this._unsub = [];
  }
}
