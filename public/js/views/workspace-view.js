import { BaseView } from './base-view.js';
import { escapeHtml } from '../utils/dom-helpers.js';

/**
 * Insert zero-width space BEFORE natural word separators to allow line breaks
 * This prevents breaks in the middle of words like "PCBAs" becoming "PCB" + "As"
 * The break opportunity is placed BEFORE the separator, so the separator stays with the following text
 */
function wrapAtSeparators(text) {
  if (!text) return '';
  // Insert zero-width space BEFORE separators (not after) to keep separator with following word
  return String(text).replace(/([_\-./])/g, '\u200B$1');
}

/**
 * WorkspaceView - renders folder tree and document exploration
 */
export class WorkspaceView extends BaseView {
  constructor(containerSelector, controller) {
    super(containerSelector);
    this.controller = controller;
    this.gridContainer = null;
    this.breadcrumbsContainer = null;
    this.loadingIndicator = null;
    this.errorIndicator = null;
    this._bound = false;
  }

  bind() {
    if (this._bound) return;
    
    // Find elements within our container
    this.breadcrumbsContainer = this.container.querySelector('#workspaceBreadcrumbs');
    this.gridContainer = this.container.querySelector('#workspaceGrid');
    this.loadingIndicator = this.container.querySelector('#workspaceLoading');
    this.errorIndicator = this.container.querySelector('#workspaceError');

    if (this.gridContainer) {
      this.gridContainer.addEventListener('click', (e) => {
        // Handle export selection checkbox clicks
        const checkbox = e.target.closest('.export-select-checkbox');
        if (checkbox) {
          e.stopPropagation();
          const item = checkbox.closest('.workspace-item');
          if (!item) return;
          
          const id = item.getAttribute('data-id');
          const type = item.getAttribute('data-type');
          
          if (type === 'folder') {
            this.controller.handleFolderExportSelect(id);
          } else if (type === 'document') {
            this.controller.handleDocumentExportSelect(id);
          }
          
          this._updateSelectionVisuals();
          return;
        }
        
        const item = e.target.closest('.workspace-item');
        if (!item) return;

        const id = item.getAttribute('data-id');
        const type = item.getAttribute('data-type');
        const name = item.getAttribute('data-name');

        if (type === 'folder') {
          this.controller.navigateToFolder(id, name);
        } else if (type === 'document') {
          if (typeof this.controller.navigateToDocument === 'function') {
            this.controller.navigateToDocument(id);
          } else {
            this.controller.viewDocument(id);
          }
        }
      });
    }

    if (this.breadcrumbsContainer) {
      this.breadcrumbsContainer.addEventListener('click', (e) => {
        const crumb = e.target.closest('.breadcrumb-item');
        if (!crumb || crumb.classList.contains('active')) return;

        const id = crumb.getAttribute('data-id');
        if (id === 'root') {
          this.controller.navigateToRootFolder();
        } else {
          this.controller.navigateToFolderBreadcrumb(id);
        }
      });
    }

    this._bound = true;
  }

  showLoading() {
    if (this.loadingIndicator) this.loadingIndicator.style.display = 'block';
    if (this.gridContainer) this.gridContainer.style.opacity = '0.5';
    this.hideError();
  }

  hideLoading() {
    if (this.loadingIndicator) this.loadingIndicator.style.display = 'none';
    if (this.gridContainer) this.gridContainer.style.opacity = '1';
  }

  showError(msg) {
    if (this.errorIndicator) {
      this.errorIndicator.textContent = msg;
      this.errorIndicator.style.display = 'block';
    }
    this.hideLoading();
  }

  hideError() {
    if (this.errorIndicator) this.errorIndicator.style.display = 'none';
  }

  render(items, breadcrumbs, workspaceName = null) {
    // Ensure elements are bound
    this.bind();
    this.hideLoading();
    
    this._renderBreadcrumbs(breadcrumbs);
    this._renderGrid(items);
    this._updateWorkspaceName(workspaceName);
  }

  _updateWorkspaceName(name) {
    const workspaceNameEl = document.getElementById('workspaceName');
    if (workspaceNameEl) {
      if (name) {
        workspaceNameEl.textContent = `(${name})`;
        workspaceNameEl.title = `Organization: ${name}`;
      } else {
        workspaceNameEl.textContent = '';
        workspaceNameEl.title = '';
      }
    }
  }

  _renderBreadcrumbs(path) {
    if (!this.breadcrumbsContainer) return;

    let html = '<span class="breadcrumb-item" data-id="root">Workspace</span>';

    if (Array.isArray(path) && path.length > 0) {
      path.forEach((p, index) => {
        html += ' <span class="breadcrumb-separator">/</span> ';
        const isLast = index === path.length - 1;
        if (isLast) {
          html += `<span class="breadcrumb-item active">${escapeHtml(p.name)}</span>`;
        } else {
          html += `<span class="breadcrumb-item" data-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}</span>`;
        }
      });
    }

    this.breadcrumbsContainer.innerHTML = html;
  }

  _renderGrid(items) {
    if (!this.gridContainer) return;

    if (!items || items.length === 0) {
      this.gridContainer.innerHTML = '<div class="empty-state">No items in this folder</div>';
      return;
    }

    // Get current export selection state
    const exportSelection = this.controller.state?.getState?.()?.exportSelection || {};
    const selectedDocIds = new Set(exportSelection.documentIds || []);
    const selectedFolderIds = new Set(exportSelection.folderIds || []);
    
    const html = items.map((item) => {
      // Determine icon and type
      // jsonType can be 'folder' or 'document-summary' or other Onshape types
      const isFolder = item.jsonType === 'folder' || item.resourceType === 'folder';
      const icon = isFolder ? '📁' : '📄';
      const typeClass = isFolder ? 'type-folder' : 'type-doc';
      const dataType = isFolder ? 'folder' : 'document';
      
      // Check if selected for export
      const isSelected = isFolder 
        ? selectedFolderIds.has(item.id)
        : selectedDocIds.has(item.id);
      const selectedClass = isSelected ? 'export-selected' : '';

      // Wrap name at natural separators for better line breaking
      const wrappedName = wrapAtSeparators(escapeHtml(item.name));
      
      return `
          <div class="workspace-item ${typeClass} ${selectedClass}" 
               data-id="${escapeHtml(item.id)}" 
               data-name="${escapeHtml(item.name)}" 
               data-type="${dataType}" 
               title="${escapeHtml(item.name)}">
              <label class="export-select-checkbox" title="Select for export">
                <input type="checkbox" ${isSelected ? 'checked' : ''} />
              </label>
              <div class="item-icon">${icon}</div>
              <div class="item-name">${wrappedName}</div>
          </div>
      `;
    }).join('');

    this.gridContainer.innerHTML = html;
  }

  /**
   * Update visual selection state for export checkboxes
   */
  _updateSelectionVisuals() {
    if (!this.gridContainer) return;
    
    const exportSelection = this.controller.state?.getState?.()?.exportSelection || {};
    const selectedDocIds = new Set(exportSelection.documentIds || []);
    const selectedFolderIds = new Set(exportSelection.folderIds || []);
    
    this.gridContainer.querySelectorAll('.workspace-item').forEach(item => {
      const id = item.getAttribute('data-id');
      const type = item.getAttribute('data-type');
      const checkbox = item.querySelector('.export-select-checkbox input');
      
      const isSelected = type === 'folder'
        ? selectedFolderIds.has(id)
        : selectedDocIds.has(id);
      
      item.classList.toggle('export-selected', isSelected);
      if (checkbox) checkbox.checked = isSelected;
    });
  }
}
