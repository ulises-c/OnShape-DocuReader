// file: public/js/services/folder-service.js
/**
 * FolderService - fetches folder metadata with simple in-memory cache.
 * Server provides SQLite-backed caching and X-Cache headers for observability.
 */
export class FolderService {
  constructor() {
    this._cache = new Map(); // id -> { data, expiresAt }
    this._ttlMs = 5 * 60 * 1000; // client-side soft TTL
  }

  /**
   * Get folder info for a single folder id.
   * Returns { id, name, description, owner, modifiedAt }
   */
  async getFolderInfo(folderId) {
    if (!folderId || folderId === "root") {
      return {
        id: "root",
        name: "Root",
        description: null,
        owner: null,
        modifiedAt: null,
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
          };
        }
      });
    }

    return out;
  }
}

