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

  async getDocuments(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    const res = await fetch(`/api/documents?${params.toString()}`);
    if (!res.ok) throw new Error(`Get documents failed (${res.status})`);
    return res.json();
  }

  async getDocument(documentId) {
    const res = await fetch(`/api/documents/${documentId}`);
    if (!res.ok) throw new Error(`Get document failed (${res.status})`);
    return res.json();
  }

  async getDocumentVersions(documentId) {
    const res = await fetch(`/api/documents/${documentId}/versions`);
    if (!res.ok) throw new Error(`Get document versions failed (${res.status})`);
    return res.json();
  }

  async getDocumentBranches(documentId) {
    const res = await fetch(`/api/documents/${documentId}/branches`);
    if (!res.ok) throw new Error(`Get document branches failed (${res.status})`);
    return res.json();
  }

  async getCombinedDocumentHistory(documentId) {
    const res = await fetch(`/api/documents/${documentId}/combined-history`);
    if (!res.ok) throw new Error(`Get combined document history failed (${res.status})`);
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

  async getBillOfMaterials(documentId, workspaceId, elementId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/documents/${documentId}/workspaces/${workspaceId}/elements/${elementId}/bom${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Get BOM failed (${res.status})`);
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

  /**
   * Fetch thumbnail metadata to discover available sizes.
   * Used as fallback when direct thumbnail URL from BOM is unavailable.
   * 
   * @param {string} documentId - Document ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} elementId - Element ID
   * @param {string} [partId] - Optional part ID for part-specific thumbnail
   * @returns {Promise<Object>} Thumbnail metadata with sizes array
   */
  async getThumbnailMetadata(documentId, workspaceId, elementId, partId = null) {
    const params = new URLSearchParams({
      documentId,
      workspaceId,
      elementId,
    });
    if (partId) {
      params.set('partId', partId);
    }
    
    const res = await fetch(`/api/thumbnail-metadata?${params.toString()}`);
    if (!res.ok) throw new Error(`Get thumbnail metadata failed (${res.status})`);
    return res.json();
  }

  async getParentInfo(documentId) {
    const res = await fetch(`/api/documents/${documentId}/parent`);
    if (!res.ok) throw new Error(`Get parent info failed (${res.status})`);
    return res.json();
  }

  async getAggregateBom(delayMs = 100) {
    const params = new URLSearchParams({
      delay: String(delayMs)
    });
    const res = await fetch(`/api/export/aggregate-bom?${params.toString()}`);
    if (!res.ok) throw new Error(`Get aggregate BOM failed (${res.status})`);
    return res.json();
  }

  /**
   * Get directory statistics (pre-scan without fetching BOMs).
   * @param {number} delayMs - Delay between API calls in ms
   * @param {Object} scope - Optional scope for partial export
   * @param {string} scope.scope - 'full' or 'partial'
   * @param {string[]} scope.documentIds - Document IDs for partial
   * @param {string[]} scope.folderIds - Folder IDs for partial
   * @param {Object} filterOptions - Optional filter options
   * @param {string} filterOptions.prefixFilter - Prefix to filter root folders
   * @returns {Promise<Object>} Directory stats including assembly list
   */
  /**
   * Prepare assemblies for export (stores on server, returns exportId).
   * Part of hybrid two-request approach to eliminate double pre-scan.
   * @param {Object} options
   * @param {Array} options.assemblies - Pre-scanned assemblies array
   * @param {Object} [options.scope] - Scope filter
   * @param {string} [options.prefixFilter] - Prefix filter
   * @returns {Promise<{exportId: string, assembliesCount: number}>}
   */
  async prepareAssembliesForExport({ assemblies, scope = null, prefixFilter = null }) {
    const response = await fetch('/api/export/prepare-assemblies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assemblies,
        ...(scope?.scope === 'partial' && { scope }),
        ...(prefixFilter && { prefixFilter })
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  async getDirectoryStats(delayMs = 100, scope = null, filterOptions = null) {
    const params = new URLSearchParams({
      delay: String(delayMs)
    });
    
    // Add scope parameters
    if (scope?.scope === 'partial') {
      params.set('scope', 'partial');
      if (scope.documentIds?.length) {
        params.set('documentIds', scope.documentIds.join(','));
      }
      if (scope.folderIds?.length) {
        params.set('folderIds', scope.folderIds.join(','));
      }
    }
    
    // Add prefix filter
    if (filterOptions?.prefixFilter) {
      params.set('prefixFilter', filterOptions.prefixFilter);
    }
    
    const res = await fetch(`/api/export/directory-stats?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Get directory stats failed (${res.status})`);
    }
    return res.json();
  }

  /**
   * Start aggregate BOM export with SSE progress streaming.
   * @param {Object} options - Export options
   * @param {number} options.workers - Number of parallel workers (1-8)
   * @param {number} options.delay - Delay between API calls in ms
   * @param {Object} options.scope - Optional scope for partial export
   * @param {string} options.prefixFilter - Optional prefix to filter root folders
   * @param {string} options.exportId - Pre-prepared export session ID (skips scan phase)
   * @param {Object} options.formats - Format selection { json: boolean, csv: boolean }
   * @param {Object} options.rowFilters - Row filter options { prtAsmOnly: boolean }
   * @param {function} options.onProgress - Callback for progress events
   * @param {function} options.onComplete - Callback when export completes
   * @param {function} options.onError - Callback for errors
   * @returns {function} Cleanup function to close SSE connection
   */
  startAggregateBomStream({ workers = 4, delay = 100, scope = null, prefixFilter = null, exportId = null, formats = null, rowFilters = null, onProgress, onComplete, onError }) {
    const params = new URLSearchParams();
    params.set('workers', workers.toString());
    params.set('delay', delay.toString());
    
    //  Add scope parameters
    if (scope?.scope === 'partial') {
      params.set('scope', 'partial');
      if (scope.documentIds?.length) {
        params.set('documentIds', scope.documentIds.join(','));
      }
      if (scope.folderIds?.length) {
        params.set('folderIds', scope.folderIds.join(','));
      }
    }
    
    // Add prefix filter (only if not using exportId - prefixFilter already applied during scan)
    if (prefixFilter && !exportId) {
      params.set('prefixFilter', prefixFilter);
    }
    
    // Add exportId if provided (hybrid approach - skip server-side scan)
    if (exportId) {
      params.set('exportId', exportId);
    }
    
    const url = `/api/export/aggregate-bom-stream?${params.toString()}`;
    console.log(`[Export SSE] Starting stream: ${url}${exportId ? ' (using prepared assemblies)' : ''}`);
    const eventSource = new EventSource(url);
    
    eventSource.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log(`[Export SSE] ══════════════════════════════════════`);
        console.log(`[Export SSE] Connected at ${data.timestamp}`);
        console.log(`[Export SSE] ══════════════════════════════════════`);
      } catch (err) {
        console.log('[Export SSE] Connected');
      }
    });
    
    // Track progress for periodic logging (reduce console clutter)
    let lastLoggedFolders = 0;
    let lastLoggedAssemblies = 0;
    
    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        
        // Log progress periodically to frontend console (every 5 folders during scan, every 5 assemblies during fetch)
        if (data.phase === 'scanning' && data.scan) {
          const folders = data.scan.foldersScanned || 0;
          if (folders >= lastLoggedFolders + 5 || folders === 0) {
            console.log(`[Export] 📁 Scanning: ${folders} folders, ${data.scan.documentsScanned || 0} docs, ${data.scan.elementCounts?.ASSEMBLY || 0} assemblies`);
            lastLoggedFolders = folders;
          }
        } else if (data.phase === 'fetching' && data.fetch) {
          const current = data.fetch.current || 0;
          if (current >= lastLoggedAssemblies + 5 || current === 0) {
            const pct = data.fetch.total > 0 ? Math.round((current / data.fetch.total) * 100) : 0;
            console.log(`[Export] 🏗️ Fetching: ${pct}% (${current}/${data.fetch.total})`);
            lastLoggedAssemblies = current;
          }
        }
        
        // Pass progress to handler
        if (onProgress) onProgress(data);
      } catch (err) {
        console.error('[Export SSE] Failed to parse progress:', err);
      }
    });
    
    eventSource.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        const summary = data.result?.summary;
        console.log(`[Export SSE] ══════════════════════════════════════`);
        console.log(`[Export SSE] ✅ Complete!`);
        console.log(`[Export SSE]   Assemblies: ${summary?.assembliesSucceeded || 0}/${summary?.assembliesFound || 0}`);
        console.log(`[Export SSE]   BOM Rows: ${summary?.totalBomRows || 0}`);
        console.log(`[Export SSE] ══════════════════════════════════════`);
        eventSource.close();
        if (onComplete) onComplete(data.result);
      } catch (err) {
        console.error('[Export SSE] Failed to parse complete:', err);
        if (onError) onError(new Error('Failed to parse export result'));
      }
    });
    
    eventSource.addEventListener('error', (e) => {
      // Check if this is a real error or just connection closed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[Export SSE] Connection closed');
        return;
      }
      
      // Try to parse error data if available
      let errorMessage = 'Export failed';
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          errorMessage = data.error?.message || errorMessage;
        } catch (err) {
          // Ignore parse error
        }
      }
      
      eventSource.close();
      if (onError) onError(new Error(errorMessage));
    });
    
    // Also handle generic errors
    eventSource.onerror = (e) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        return; // Already handled
      }
      console.error('[Export SSE] Connection error:', e);
      eventSource.close();
      if (onError) onError(new Error('Connection to server lost'));
    };
    
    // Return cleanup function
    return () => {
      console.log('[Export SSE] Closing connection');
      eventSource.close();
    };
  }

  async getGlobalTreeNodes(limit = 50, offset = 0, getPathToRoot = false) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      getPathToRoot: String(getPathToRoot)
    });
    const res = await fetch(`/api/onshape/folders?${params.toString()}`);
    if (!res.ok) throw new Error(`Get root folders failed (${res.status})`);
    return res.json();
  }

  async getFolderContents(folderId, limit = 50, offset = 0, getPathToRoot = false) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      getPathToRoot: String(getPathToRoot)
    });
    const res = await fetch(`/api/onshape/folders/${folderId}?${params.toString()}`);
    if (!res.ok) throw new Error(`Get folder contents failed (${res.status})`);
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
