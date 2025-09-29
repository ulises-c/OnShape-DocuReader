/**
 * ApiClient - wraps all HTTP calls
 */

export class ApiClient {
  async request(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
      let message = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res;
  }

  // Auth
  getAuthStatus() {
    return this.request('/auth/status');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // User
  getUser() {
    return this.request('/api/user');
  }

  // Documents
  getDocuments() {
    return this.request('/api/documents');
  }

  getDocument(documentId) {
    return this.request(`/api/documents/${documentId}`);
  }

  getDocumentElements(documentId, workspaceId) {
    return this.request(`/api/documents/${documentId}/workspaces/${workspaceId}/elements`);
  }

  getParts(documentId, workspaceId, elementId) {
    return this.request(`/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts`);
  }

  getAssemblies(documentId, workspaceId, elementId) {
    return this.request(`/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/assemblies`);
  }

  getElementMetadata(documentId, workspaceId, elementId) {
    return this.request(`/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/metadata`);
  }

  getDocumentMetadata(documentId) {
    return this.request(`/api/metadata/d/${documentId}`);
  }

  getParentInfo(documentId) {
    return this.request(`/api/documents/${documentId}/parent`);
  }

  // Export
  exportAll(params) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/export/all?${qs}`);
  }

  exportStream(params) {
    const qs = new URLSearchParams(params).toString();
    return new EventSource(`/api/export/stream?${qs}`);
  }

  // Comprehensive single document
  getComprehensiveDocument(documentId, params) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/documents/${documentId}/comprehensive?${qs}`);
  }
}
