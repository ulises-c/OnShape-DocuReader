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
          if (typeof this.controller?.navigateToDocument === 'function') {
            this.controller.navigateToDocument(id);
          } else {
            this.controller.viewDocument(id);
          }
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

  /**
   * Capture current view state for restoration (scroll, selections, select-all, search query)
   */
  captureState() {
    try {
      const scrollContainer = this.container?.closest('[data-scroll-preserve]') || null;
      const selectedIds = qsa('.doc-checkbox:checked', this.container).map((cb) => cb.value);
      const selectAllEl = qs('#selectAll', this.container);
      const searchInput = document.querySelector('#searchInput');

      return {
        scroll: {
          windowY: typeof window !== 'undefined' ? (window.scrollY || 0) : 0,
          containerTop: scrollContainer ? (scrollContainer.scrollTop || 0) : 0,
          containerKey: scrollContainer?.getAttribute?.('data-scroll-key') || null
        },
        selectedIds,
        selectAll: !!(selectAllEl && selectAllEl.checked),
        searchQuery: searchInput?.value || ''
      };
    } catch (e) {
      console.error('captureState (DocumentListView) failed:', e);
      return {
        scroll: { windowY: 0, containerTop: 0, containerKey: null },
        selectedIds: [],
        selectAll: false,
        searchQuery: ''
      };
    }
  }

  /**
   * Restore previously captured state (order: inputs/selection, then scroll)
   */
  restoreState(state) {
    if (!state || typeof state !== 'object') return;

    try {
      // Restore search query first (affects filtering if any external logic later uses it)
      const searchInput = document.querySelector('#searchInput');
      if (searchInput && typeof state.searchQuery === 'string') {
        searchInput.value = state.searchQuery;
      }

      // Restore checkbox selections
      const boxes = qsa('.doc-checkbox', this.container);
      if (boxes.length) {
        const selectedSet = new Set(Array.isArray(state.selectedIds) ? state.selectedIds : []);
        boxes.forEach((cb) => {
          cb.checked = selectedSet.has(cb.value);
        });

        // Restore select-all visual state
        const selectAllEl = qs('#selectAll', this.container);
        if (selectAllEl) {
          const checkedCount = boxes.filter((b) => b.checked).length;
          selectAllEl.checked = checkedCount === boxes.length && boxes.length > 0;
          selectAllEl.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
        }

        // Notify controller to sync button state, wrapped in rAF to ensure DOM reflects changes
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => this._notifySelectionChanged());
        } else {
          setTimeout(() => this._notifySelectionChanged(), 0);
        }
      }

      // Restore scroll after paint to ensure layout is ready
      const applyScroll = () => {
        try {
          const scroll = state.scroll || {};
          const scrollContainer = this.container?.closest('[data-scroll-preserve]') || null;

          if (scrollContainer && typeof scroll.containerTop === 'number') {
            scrollContainer.scrollTop = scroll.containerTop;
          }
          if (typeof scroll.windowY === 'number') {
            window.scrollTo(0, scroll.windowY);
          }
        } catch (e) {
          console.warn('restoreState (DocumentListView) scroll failed:', e);
        }
      };

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(applyScroll));
      } else {
        setTimeout(applyScroll, 0);
      }
    } catch (e) {
      console.error('restoreState (DocumentListView) failed:', e);
    }
  }
}
