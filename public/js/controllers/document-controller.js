/**
 * DocumentController - orchestrates document flows
 */

import { DocumentListView } from '../views/document-list-view.js';
import { DocumentDetailView } from '../views/document-detail-view.js';
import { ElementDetailView } from '../views/element-detail-view.js';
import { PartDetailView } from '../views/part-detail-view.js';
import { formatDateWithUser } from '../utils/format-helpers.js';
import { copyToClipboard } from '../utils/clipboard.js';

export class DocumentController {
  constructor(state, services, navigation, thumbnailService) {
    this.state = state;
    this.documentService = services.documentService;
    this.navigation = navigation;

    this.listView = new DocumentListView('#documentsGrid', this);
    this.detailView = new DocumentDetailView('#documentInfo', this, thumbnailService);
    this.elementView = new ElementDetailView('#elementInfo', this);
    this.partView = new PartDetailView();
  }

  async loadDocuments() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const gridEl = document.getElementById('documentsGrid');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    gridEl.innerHTML = '';

    try {
      const docs = await this.documentService.getAll();
      // Transform documents to use creator similar to backend transformation
      const transformed = docs.map((d) => ({ ...d, creator: d.createdBy || d.owner }));
      this.state.setState({ documents: transformed });
      loadingEl.style.display = 'none';
      this.listView.render(transformed);
    } catch (error) {
      console.error('Error loading documents:', error);
      loadingEl.style.display = 'none';
      errorEl.textContent = 'Failed to load documents: ' + error.message;
      errorEl.style.display = 'block';
    }
  }

  onSelectionChanged(documentIds) {
    const docs = this.state.getState().documents;
    const selected = docs.filter((d) => documentIds.includes(d.id));
    this.state.setState({ selectedDocuments: selected });

    const btn = document.getElementById('getSelectedBtn');
    if (btn) {
      btn.disabled = selected.length === 0;
      btn.textContent = selected.length > 0 ? `📋 Get Selected (${selected.length})` : '📋 Get Selected';
    }
  }

  async search(query) {
    if (!query) {
      return this.listView.render(this.state.getState().documents);
    }
    const docs = this.state.getState().documents;
    const filtered = docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        (doc.creator?.name || '').toLowerCase().includes(query.toLowerCase())
    );
    this.listView.render(filtered);
  }

  async viewDocument(documentId) {
    console.log('viewDocument called with documentId:', documentId);
    try {
      const doc = await this.documentService.getById(documentId);
      let elements = [];
      if (doc.defaultWorkspace?.id) {
        try {
          elements = await this.documentService.getElements(documentId, doc.defaultWorkspace.id);
        } catch (e) {
          console.warn('Could not load document elements:', e);
        }
      }
      this.state.setState({ currentDocument: doc, currentElement: null, currentPart: null });
      // Set document title
      const title = document.getElementById('documentTitle');
      if (title) title.textContent = doc.name;

      this.detailView.render(doc, elements);
      this.navigation.navigateTo('documentDetail');

      // Bind element click delegation (view)
      const container = document.getElementById('documentElements');
      container?.addEventListener(
        'click',
        (e) => {
          const el = e.target.closest('.element-item');
          if (!el) return;
          const elementId = el.getAttribute('data-element-id');
          if (elementId) {
            console.log('Element clicked:', elementId);
            this.viewElement(elementId);
          }
        },
        { once: true }
      );
    } catch (e) {
      console.error('Error viewing document:', e);
      const errEl = document.getElementById('error');
      if (errEl) {
        errEl.textContent = 'Failed to load document details: ' + e.message;
        errEl.style.display = 'block';
      }
    }
  }

  async loadHierarchy(documentId) {
    const containerId = `parent-hierarchy-${documentId}`;
    const hierarchyEl = document.getElementById(containerId);
    if (!hierarchyEl) return;
    hierarchyEl.innerHTML = '<div style="color:#666; font-style:italic;">Loading parent hierarchy...</div>';

    try {
      const info = await this.documentService.getParentInfo(documentId);
      let html = '';
      if (info?.items?.length) {
        html = '<div style="margin-bottom: 0.5rem;"><strong>Document Hierarchy:</strong></div>';
        info.items.forEach((item, index) => {
          const indent = '&nbsp;'.repeat(index * 4);
          html += `<div style="font-family: monospace; font-size: 0.9rem; margin: 0.25rem 0;">
            ${indent}${index > 0 ? '↳ ' : ''}${escapeHtml(item.name || item.id)}
            <span style="color: #666; font-size: 0.8rem;">(${item.resourceType || 'unknown'})</span>
          </div>`;
        });
      } else {
        html = '<div style="color:#666;">No parent hierarchy available</div>';
      }
      this.detailView.updateHierarchy(documentId, html);
    } catch (e) {
      console.error('Error loading parent hierarchy:', e);
      this.detailView.updateHierarchy(documentId, '<div style="color:#e74c3c;">Failed to load parent hierarchy</div>');
    }
  }

  async copyElementJson(element) {
    try {
      const doc = this.state.getState().currentDocument;
      let enriched = { ...element };
      if (doc?.defaultWorkspace?.id) {
        try {
          const metadata = await this.documentService.getElementMetadata(doc.id, doc.defaultWorkspace.id, element.id);
          enriched.metadata = metadata;
        } catch (e) {
          console.warn('Could not fetch metadata for element:', e);
        }
      }
      await copyToClipboard(JSON.stringify(enriched, null, 2));
    } catch (e) {
      console.error('Failed to copy element JSON:', e);
    }
  }

  async viewElement(elementId) {
    const doc = this.state.getState().currentDocument;
    if (!doc?.defaultWorkspace?.id) {
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'No document or workspace available';
        err.style.display = 'block';
      }
      return;
    }

    try {
      const elements = await this.documentService.getElements(doc.id, doc.defaultWorkspace.id);
      const currentElement = elements.find((el) => el.id === elementId);
      if (!currentElement) {
        const err = document.getElementById('error');
        if (err) {
          err.textContent = 'Element not found';
          err.style.display = 'block';
        }
        return;
      }

      // Load parts, assemblies, metadata
      const [parts, assemblies, metadata] = await Promise.allSettled([
        this.documentService.getParts(doc.id, doc.defaultWorkspace.id, elementId),
        this.documentService.getAssemblies(doc.id, doc.defaultWorkspace.id, elementId),
        this.documentService.getElementMetadata(doc.id, doc.defaultWorkspace.id, elementId)
      ]);

      currentElement.parts = parts.status === 'fulfilled' ? parts.value : [];
      currentElement.assemblies = assemblies.status === 'fulfilled' ? assemblies.value : [];
      currentElement.metadata = metadata.status === 'fulfilled' ? metadata.value : {};

      this.state.setState({ currentElement, currentPart: null });
      // Title
      const title = document.getElementById('elementTitle');
      if (title) title.textContent = currentElement.name;

      this.elementView.render(currentElement);
      this.navigation.navigateTo('elementDetail');
    } catch (e) {
      console.error('Error viewing element:', e);
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'Failed to load element details: ' + e.message;
        err.style.display = 'block';
      }
    }
  }

  async viewPart(partId) {
    const st = this.state.getState();
    const doc = st.currentDocument;
    const el = st.currentElement;
    if (!doc || !el) {
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'No document or element available';
        err.style.display = 'block';
      }
      return;
    }

    try {
      const part = el.parts.find((p) => p.partId === partId);
      if (!part) {
        const err = document.getElementById('error');
        if (err) {
          err.textContent = 'Part not found';
          err.style.display = 'block';
        }
        return;
      }

      const massProps = await this.documentService.api.request(
        `/api/documents/${doc.id}/workspaces/${doc.defaultWorkspace.id}/elements/${el.id}/parts/${partId}/mass-properties`
      );
      part.massProperties = massProps;

      this.state.setState({ currentPart: part });
      this.navigation.navigateTo('partDetail');

      // Render part
      this.partView.render(part);
    } catch (e) {
      console.error('Error viewing part:', e);
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'Failed to load part details: ' + e.message;
        err.style.display = 'block';
      }
    }
  }

  async getComprehensiveDocument() {
    console.log('Get Document button clicked');
    const doc = this.state.getState().currentDocument;
    if (!doc) {
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'No document selected';
        err.style.display = 'block';
      }
      return;
    }

    const button = document.getElementById('getDocumentBtn');
    const originalText = button?.textContent;
    if (button) {
      button.textContent = '⏳ Processing...';
      button.disabled = true;
    }

    try {
      const data = await this.documentService.getComprehensive(doc.id, {
        includeBasicInfo: 'true',
        includeElements: 'true',
        includeParts: 'true',
        includeAssemblies: 'true',
        includeMetadata: 'true'
      });

      // Download as JSON
      const a = document.createElement('a');
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${doc.name.replace(/[^a-z0-9]/gi, '_')}_comprehensive.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this._toast(`Successfully downloaded comprehensive data for "${doc.name}"`);
    } catch (e) {
      console.error('Error getting comprehensive document:', e);
      const err = document.getElementById('error');
      if (err) {
        err.textContent = 'Failed to get comprehensive document data: ' + e.message;
        err.style.display = 'block';
      }
    } finally {
      if (button) {
        button.textContent = originalText || '📦 Get Document';
        button.disabled = false;
      }
    }
  }

  _toast(message) {
    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = message;
    div.style.cssText = `
      background-color:#d4edda;border:1px solid #c3e6cb;color:#155724;
      padding:12px 20px;border-radius:5px;margin:10px 0;position:fixed;top:20px;right:20px;z-index:1000;
      box-shadow:0 2px 10px rgba(0,0,0,0.1);animation:slideIn 0.3s ease-out;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
}
