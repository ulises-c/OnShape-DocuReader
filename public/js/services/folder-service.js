/**
 * FolderService - fetches folder metadata with simple in-memory cache.
 * Server provides SQLite-backed caching and X-Cache headers for observability.
 */
export class FolderService {
  constructor() {
    this._cache = new Map(); // id -> { data, expiresAt }
    this._ttlMs = 5 * 60 * 1000; // client-side soft TTL
    this._rootPreloaded = false;
  }

  /**
   * Preload top-level folder tree and seed the cache with parentId = "root".
   * This primes hierarchy so UI can nest top-level folders correctly.
   */
  async preloadRootTree() {
    if (this._rootPreloaded) return;
    try {
      const res = await fetch(`/api/folders/tree/root`);
      if (!res.ok) throw new Error(`Preload root tree failed (${res.status})`);
      const data = await res.json();
      const now = Date.now();
      if (Array.isArray(data?.folders)) {
        for (const f of data.folders) {
          const out = {
            id: String(f.id),
            name: String(f.name || `Folder ${f.id}`),
            description: null,
            owner: null,
            modifiedAt: null,
            parentId: f.parentId ?? "root",
          };
          this._cache.set(out.id, { data: out, expiresAt: now + this._ttlMs });
        }
      }
      this._rootPreloaded = true;
    } catch (e) {
      console.warn("FolderService.preloadRootTree failed:", e);
    }
  }

  /**
   * Optionally preload children for a specific folder to enhance hierarchy depth.
   * Non-blocking enrichment; failures do not break UI.
   */
  async preloadFolderTree(folderId) {
    if (!folderId || folderId === "root") return;
    try {
      const res = await fetch(`/api/folders/tree/${encodeURIComponent(folderId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const now = Date.now();
      if (Array.isArray(data?.folders)) {
        for (const f of data.folders) {
          const out = {
            id: String(f.id),
            name: String(f.name || `Folder ${f.id}`),
            description: null,
            owner: null,
            modifiedAt: null,
            parentId: f.parentId ?? folderId,
          };
          this._cache.set(out.id, { data: out, expiresAt: now + this._ttlMs });
        }
      }
    } catch {
      // silently ignore
    }
  }

  /**
   * Get folder info for a single folder id.
   * Returns { id, name, description, owner, modifiedAt, parentId }
   */
  async getFolderInfo(folderId) {
    if (!folderId || folderId === "root") {
      return {
        id: "root",
        name: "Root",
        description: null,
        owner: null,
        modifiedAt: null,
        parentId: null,
      };
    }

    const now = Date.now();
    const cached = this._cache.get(folderId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    try {
      const res = await fetch(`/api/folders/${encodeURIComponent(folderId)}`);
      const data = await res.json();
      const out = {
        id: String(data.id || folderId),
        name: String(data.name || `Folder ${folderId}`),
        description: data.description ?? null,
        owner: data.owner ?? null,
        modifiedAt: data.modifiedAt ?? null,
        parentId: data.parentId ?? null,
      };

      // Cache the result
      this._cache.set(folderId, { data: out, expiresAt: now + this._ttlMs });
      return out;
    } catch (e) {
      console.warn("FolderService.getFolderInfo failed:", e);
      const fallback = {
        id: String(folderId),
        name: `Folder ${folderId}`,
        description: null,
        owner: null,
        modifiedAt: null,
        parentId: null,
      };
      this._cache.set(folderId, { data: fallback, expiresAt: now + 30_000 });
      return fallback;
    }
  }

  /**
   * Batch fetch folder info for multiple ids.
   * Returns a map-like plain object { [id]: FolderInfo }
   * Uses Promise.allSettled, and prioritizes order of ids given.
   */
  async batchGetFolders(ids) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (!unique.length) return {};

    const out = {};
    const misses = [];

    const now = Date.now();
    for (const id of unique) {
      const cached = this._cache.get(id);
      if (cached && cached.expiresAt > now) {
        out[id] = cached.data;
      } else {
        misses.push(id);
      }
    }

    if (misses.length) {
      // Soft-preload children of each candidate to capture parent relationships deeper in the tree.
      // This runs in the background and does not block the batch resolution.
      misses.forEach((fid) => {
        // Fire and forget to opportunistically enrich hierarchy
        this.preloadFolderTree(fid);
      });

      const results = await Promise.allSettled(
        misses.map((id) => this.getFolderInfo(id))
      );
      results.forEach((res, idx) => {
        const id = misses[idx];
        if (res.status === "fulfilled" && res.value) {
          out[id] = res.value;
        } else {
          out[id] = {
            id,
            name: `Folder ${id}`,
            description: null,
            owner: null,
            modifiedAt: null,
            parentId: null,
          };
        }
      });
    }

    return out;
  }
}

