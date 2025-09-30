// All HTTP requests to backend endpoints, no DOM manipulation
export class ApiClient {
  async getAuthStatus() {
    const res = await fetch("/auth/status");
    if (!res.ok) throw new Error(`Auth status failed (${res.status})`);
    return res.json();
  }

  async logout() {
    const res = await fetch("/auth/logout", { method: "POST" });
    if (!res.ok) throw new Error(`Logout failed (${res.status})`);
    return res.json();
  }

  async getUser() {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(`Get user failed (${res.status})`);
    return res.json();
  }

  async getDocuments() {
    const res = await fetch("/api/documents");
    if (!res.ok) throw new Error(`Get documents failed (${res.status})`);
    return res.json();
  }

  async getDocument(documentId) {
    const res = await fetch(`/api/documents/${documentId}`);
    if (!res.ok) throw new Error(`Get document failed (${res.status})`);
    return res.json();
  }

  async getElements(documentId, workspaceId) {
    const res = await fetch(
      `/api/documents/${documentId}/workspaces/${workspaceId}/elements`
    );
    if (!res.ok) throw new Error(`Get elements failed (${res.status})`);
    return res.json();
  }

  async getParts(documentId, workspaceId, elementId) {
    const res = await fetch(
      `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts`
    );
    if (!res.ok) throw new Error(`Get parts failed (${res.status})`);
    return res.json();
  }

  async getAssemblies(documentId, workspaceId, elementId) {
    const res = await fetch(
      `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/assemblies`
    );
    if (!res.ok) throw new Error(`Get assemblies failed (${res.status})`);
    return res.json();
  }

  async getElementMetadata(documentId, workspaceId, elementId) {
    const res = await fetch(
      `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/metadata`
    );
    if (!res.ok) throw new Error(`Get element metadata failed (${res.status})`);
    return res.json();
  }

  async getPartMassProperties(documentId, workspaceId, elementId, partId) {
    const res = await fetch(
      `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/parts/${partId}/mass-properties`
    );
    if (!res.ok) throw new Error(`Get mass properties failed (${res.status})`);
    return res.json();
  }

  async getParentInfo(documentId) {
    const res = await fetch(`/api/documents/${documentId}/parent`);
    if (!res.ok) throw new Error(`Get parent info failed (${res.status})`);
    return res.json();
  }

  async exportAll(options, ids) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => params.append(k, String(v)));
    if (Array.isArray(ids) && ids.length > 0) {
      params.append("ids", ids.join(","));
    }
    const res = await fetch(`/api/export/all?${params.toString()}`);
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    return res.json();
  }

  exportStreamSSE(options, ids) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => params.append(k, String(v)));
    if (Array.isArray(ids) && ids.length > 0) {
      params.append("ids", ids.join(","));
    }
    return new EventSource(`/api/export/stream?${params.toString()}`);
  }
}
