/**
 * DocumentService - document-related operations
 */

export class DocumentService {
  constructor(api, folderService) {
    this.api = api;
    this.folderService = folderService || null;
  }

  async getAll(limit = 20, offset = 0) {
    const result = await this.api.getDocuments(limit, offset);
    if (!this.folderService) return result;

    const items = Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result)
      ? result
      : [];

    // Group by parentId (documents without parentId go to "root")
    const groupsMap = new Map();
    for (const d of items) {
      const parentId =
        d.parentId || d.parent?.id || null;
      const key = parentId || "root";
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key).push(d);
    }

    // Sort each group's documents by modifiedAt desc
    for (const docs of groupsMap.values()) {
      docs.sort((a, b) => {
        const am = new Date(a.modifiedAt || a.modified_at || 0).getTime();
        const bm = new Date(b.modifiedAt || b.modified_at || 0).getTime();
        return bm - am;
      });
    }

    // Prepare folder metadata fetch, prioritize groups with most recent activity
    const nonRootIds = Array.from(groupsMap.keys()).filter((k) => k !== "root");
    nonRootIds.sort((a, b) => {
      const aDocs = groupsMap.get(a) || [];
      const bDocs = groupsMap.get(b) || [];
      const aMax = aDocs.length
        ? Math.max(
            ...aDocs.map((x) =>
              new Date(x.modifiedAt || x.modified_at || 0).getTime()
            )
          )
        : 0;
      const bMax = bDocs.length
        ? Math.max(
            ...bDocs.map((x) =>
              new Date(x.modifiedAt || x.modified_at || 0).getTime()
            )
          )
        : 0;
      return bMax - aMax;
    });

    let folderMap = {};
    try {
      if (this.folderService?.batchGetFolders) {
        folderMap = await this.folderService.batchGetFolders(nonRootIds);
      }
    } catch (e) {
      console.warn("Folder metadata batch fetch failed, continuing:", e);
      folderMap = {};
    }

    const groups = [];
    for (const [key, docs] of groupsMap.entries()) {
      const isRoot = key === "root";
      const folderInfo = isRoot
        ? { id: "root", name: "Root", description: null, owner: null, modifiedAt: null }
        : folderMap[key] ||
          { id: key, name: `Folder ${key}`, description: null, owner: null, modifiedAt: null };

      groups.push({
        folder: folderInfo,
        documents: docs,
        groupModifiedAt: docs.length
          ? docs[0].modifiedAt || docs[0].modified_at || null
          : null,
      });
    }

    // Sort groups by latest document modification timestamp desc, put Root first
    groups.sort((a, b) => {
      if (a.folder.id === "root") return -1;
      if (b.folder.id === "root") return 1;
      const am = new Date(a.groupModifiedAt || 0).getTime();
      const bm = new Date(b.groupModifiedAt || 0).getTime();
      return bm - am;
    });

    return {
      items,
      totalCount:
        typeof result?.totalCount === "number"
          ? result.totalCount
          : items.length,
      groups,
    };
  }

  async getById(documentId) {
    return this.api.getDocument(documentId);
  }

  async getElements(documentId, workspaceId) {
    return this.api.getElements(documentId, workspaceId);
  }

  async getParts(documentId, workspaceId, elementId) {
    return this.api.getParts(documentId, workspaceId, elementId);
  }

  async getAssemblies(documentId, workspaceId, elementId) {
    return this.api.getAssemblies(documentId, workspaceId, elementId);
  }

  async getElementMetadata(documentId, workspaceId, elementId) {
    return this.api.getElementMetadata(documentId, workspaceId, elementId);
  }

  async getParentInfo(documentId) {
    return this.api.getParentInfo(documentId);
  }

  async getPartMassProperties(documentId, workspaceId, elementId, partId) {
    return this.api.getPartMassProperties(
      documentId,
      workspaceId,
      elementId,
      partId
    );
  }

  async getBillOfMaterials(documentId, workspaceId, elementId, flatten = true) {
    const params = {
      indented: String(!flatten), // false for flattened, true for structured
      generateIfAbsent: "false",
    };

    return this.api.getBillOfMaterials(
      documentId,
      workspaceId,
      elementId,
      params
    );
  }

  async getComprehensiveDocument(documentId, params) {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(
      `/api/documents/${documentId}/comprehensive?${queryString}`
    );
    if (!res.ok)
      throw new Error(`Get comprehensive document failed (${res.status})`);
    return res.json();
  }
}
