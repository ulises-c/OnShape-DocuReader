/**
 * DocumentListView - renders document grid/table
 */

import { BaseView } from './base-view.js';
import { qsa, qs } from '../utils/dom-helpers.js';
import { renderPaginationControls, renderDocumentRows } from './helpers/pagination-renderer.js';

export class DocumentListView extends BaseView {
  constructor(containerSelector, controller) {
    super(containerSelector);
    this.controller = controller;
    this._unsub = [];
  }

  render(documents, pagination = null) {
    if (!documents || documents.length === 0) {
      this.renderHtml('<p style="text-align:center; color:#666; font-style:italic;">No documents found</p>');
      return;
    }

    const rows = renderDocumentRows(documents);
    const paginationHtml = pagination ? renderPaginationControls(pagination) : '';

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
      ${paginationHtml}
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

    // Pagination controls
    this._bindPaginationControls();

    // Initialize button state
    this._notifySelectionChanged();
  }

  _bindPaginationControls() {
    // Navigation buttons
    qsa('.pagination-btn', this.container).forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const pagination = this.controller.pagination;
        
        let targetPage = pagination.currentPage;
        if (action === 'first') targetPage = 1;
        else if (action === 'prev') targetPage = Math.max(1, pagination.currentPage - 1);
        else if (action === 'next') targetPage = Math.min(pagination.totalPages, pagination.currentPage + 1);
        else if (action === 'last') targetPage = pagination.totalPages;
        
        if (targetPage !== pagination.currentPage) {
          this.controller.changePage(targetPage);
        }
      });
    });

    // Page jump input
    const pageJump = qs('.page-jump', this.container);
    if (pageJump) {
      pageJump.addEventListener('change', (e) => {
        const targetPage = parseInt(e.target.value, 10);
        const pagination = this.controller.pagination;
        
        if (targetPage >= 1 && targetPage <= pagination.totalPages && targetPage !== pagination.currentPage) {
          this.controller.changePage(targetPage);
        } else {
          e.target.value = pagination.currentPage;
        }
      });

      pageJump.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    }

    // Page size selector
    const pageSizeSelector = qs('.page-size-selector', this.container);
    if (pageSizeSelector) {
      pageSizeSelector.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value, 10);
        this.controller.changePageSize(newSize);
      });
    }
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
      const pagination = this.controller?.pagination || null;

      return {
        scroll: {
          windowY: typeof window !== 'undefined' ? (window.scrollY || 0) : 0,
          containerTop: scrollContainer ? (scrollContainer.scrollTop || 0) : 0,
          containerKey: scrollContainer?.getAttribute?.('data-scroll-key') || null
        },
        selectedIds,
        selectAll: !!(selectAllEl && selectAllEl.checked),
        searchQuery: searchInput?.value || '',
        pagination: pagination ? {
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize
        } : null
      };
    } catch (e) {
      console.error('captureState (DocumentListView) failed:', e);
      return {
        scroll: { windowY: 0, containerTop: 0, containerKey: null },
        selectedIds: [],
        selectAll: false,
        searchQuery: '',
        pagination: null
      };
    }
  }

  /**
   * Restore previously captured state (order: inputs/selection, then scroll)
   */
  restoreState(state) {
    if (!state || typeof state !== 'object') return;

    try {
      // Restore pagination if needed (controller should handle this, but we preserve the state)
      if (state.pagination && this.controller) {
        const { currentPage, pageSize } = state.pagination;
        if (currentPage !== this.controller.pagination.currentPage || 
            pageSize !== this.controller.pagination.pageSize) {
          this.controller.loadDocuments(currentPage, pageSize);
          return;
        }
      }

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
