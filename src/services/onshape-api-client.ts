import axios from "axios";
import type { AxiosInstance } from "axios";
import pLimit from "p-limit";
import { oauthConfig } from "../config/oauth.ts";
import { EventEmitter } from "events";
import { ApiUsageTracker } from "./api-usage-tracker.ts";
import type { DirectoryStats, AssemblyReference, ExportMetadata, AssemblyBomFetchResult, AggregateBomResult, ExportProgressEvent, RootFolderStatus } from "../types/onshape.ts";

export interface OnShapeUser {
  id: string;
  name: string;
  email: string;
  company: string;
  image: string;
  firstName?: string;
  lastName?: string;
}

export interface OnShapeDocument {
  id: string;
  name: string;
  isPublic: boolean;
  owner: {
    id: string;
    name: string;
    type: number;
  };
  createdBy?: {
    id: string;
    name: string;
    jsonType?: string;
  };
  createdAt: string;
  modifiedAt: string;
  href: string;
}

export interface OnShapeDocumentElement {
  id: string;
  name: string;
  type: string;
  elementType: string;
  lengthUnits: string;
  angleUnits: string;
  massUnits: string;
}

export interface OnShapeDocumentInfo {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    name: string;
    type: number;
  };
  createdAt: string;
  modifiedAt: string;
  isPublic: boolean;
  defaultWorkspace: {
    id: string;
    name: string;
  };
  workspaces: Array<{
    id: string;
    name: string;
    isPublic: boolean;
  }>;
}

// AggregateBomResult is now imported from types/onshape.ts

declare module "axios" {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export class OnShapeApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string;
  private usageTracker?: ApiUsageTracker;
  private userId?: string;
  private baseApiRoot: string;

  constructor(
    accessToken: string,
    userId?: string,
    tracker?: ApiUsageTracker
  ) {
    this.accessToken = accessToken;
    this.userId = userId;
    this.usageTracker = tracker;
    // Base API root without version segment, used for non-versioned endpoints like globaltreenodes
    this.baseApiRoot = oauthConfig.baseApiUrl.replace(/\/v\d+$/, "");

    this.axiosInstance = axios.create({
      baseURL: oauthConfig.baseApiUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      async (response) => {
        await this.logUsage(response.config, response.status);
        return response;
      },
      async (error) => {
        const status = error.response?.status || 0;
        await this.logUsage(error.config, status);

        console.error("OnShape API Error:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  private async logUsage(config: any, status: number): Promise<void> {
    if (!this.usageTracker || !config?.metadata?.startTime) {
      return;
    }

    try {
      const duration = Date.now() - config.metadata.startTime;
      await this.usageTracker.log({
        timestamp: new Date().toISOString(),
        endpoint: config.url || "",
        method: config.method?.toUpperCase() || "GET",
        userId: this.userId,
        responseTime: duration,
        status,
      });
    } catch (error) {
      console.error("Failed to log API usage:", error);
    }
  }

  async getCurrentUser(): Promise<OnShapeUser> {
    const response = await this.axiosInstance.get("/users/sessioninfo");
    return response.data;
  }

  async getDocuments(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ items: OnShapeDocument[]; totalCount: number }> {
    // Diagnostic: log request parameters to trace pagination behavior
    console.log("OnShapeApiClient.getDocuments request", { limit, offset });

    const response = await this.axiosInstance.get("/documents", {
      params: {
        limit,
        offset,
        sortColumn: "modifiedAt",
        sortOrder: "desc",
      },
    });

    const data: any = response?.data || {};
    const items: OnShapeDocument[] = Array.isArray(data.items) ? data.items : [];
    const totalFromApi =
      typeof data.totalCount === "number" ? (data.totalCount as number) : undefined;

    // Some Onshape deployments may not return totalCount.
    // Heuristic: if page is full, assume there might be more, so report "unknown total"
    // by adding +1 beyond the current window to keep Next enabled. If not full, clamp to actual seen total.
    const hasMore = items.length === limit;
    const computedTotal =
      totalFromApi !== undefined
        ? totalFromApi
        : offset + items.length + (hasMore ? 1 : 0);

    // Diagnostic: log response structure and derived values
    try {
      console.log("OnShapeApiClient.getDocuments response", {
        limit,
        offset,
        keys: Object.keys(data || {}),
        itemsLength: items.length,
        totalFromApi,
        computedTotal,
        hasMore,
      });
    } catch {
      // ignore logging errors
    }

    return {
      items,
      totalCount: computedTotal,
    };
  }

  async getDocument(documentId: string): Promise<OnShapeDocumentInfo> {
    const response = await this.axiosInstance.get(`/documents/${documentId}`);
    return response.data;
  }

  async getComprehensiveDocument(
    documentId: string,
    params: any
  ): Promise<any> {
    const doc = await this.getDocument(documentId);
    const result: any = { ...doc };

    if (doc.defaultWorkspace?.id && params.includeElements === "true") {
      result.elements = await this.getElements(
        documentId,
        doc.defaultWorkspace.id
      );

      if (
        params.includeParts === "true" ||
        params.includeAssemblies === "true"
      ) {
        for (const element of result.elements) {
          if (params.includeParts === "true") {
            element.parts = await this.getParts(
              documentId,
              doc.defaultWorkspace.id,
              element.id
            );
          }
          if (params.includeAssemblies === "true") {
            element.assemblies = await this.getAssemblies(
              documentId,
              doc.defaultWorkspace.id,
              element.id
            );
          }
        }
      }
    }

    return result;
  }

  async getParentInfo(documentId: string): Promise<any> {
    const response = await this.axiosInstance.get(
      `/documents/${documentId}/parent`
    );
    return response.data;
  }

  async getElements(
    documentId: string,
    workspaceId: string
  ): Promise<OnShapeDocumentElement[]> {
    return this.getDocumentElements(documentId, workspaceId);
  }

  async getDocumentElements(
    documentId: string,
    workspaceId: string
  ): Promise<OnShapeDocumentElement[]> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/elements`
    );
    return response.data || [];
  }

  async getParts(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(
        `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts`
      );
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.info(
          `OnShape getParts returned 404 for document=${documentId} workspace=${workspaceId} element=${elementId}`
        );
        return [];
      }
      throw error;
    }
  }

  async getAssemblies(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(
        `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/assemblies`
      );
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.info(
          `OnShape getAssemblies returned 404 for document=${documentId} workspace=${workspaceId} element=${elementId}`
        );
        return [];
      }
      throw error;
    }
  }

  async getBillOfMaterials(
    documentId: string,
    workspaceId: string,
    elementId: string,
    params?: Record<string, any>
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/assemblies/d/${documentId}/w/${workspaceId}/e/${elementId}/bom`,
        params ? { params } : undefined
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Get BOM error:",
        error.response
          ? {
              status: error.response.status,
              data: error.response.data,
              url: error.config?.url,
            }
          : error
      );
      throw error;
    }
  }

  async getPartMassProperties(
    documentId: string,
    workspaceId: string,
    elementId: string,
    partId: string
  ): Promise<any> {
    const response = await this.axiosInstance.get(
      `/documents/d/${documentId}/w/${workspaceId}/e/${elementId}/parts/${partId}/massProperties`
    );
    return response.data;
  }

  async searchDocuments(
    query: string,
    limit: number = 20
  ): Promise<OnShapeDocument[]> {
    const response = await this.axiosInstance.get("/documents", {
      params: {
        q: query,
        limit,
        sortColumn: "modifiedAt",
        sortOrder: "desc",
      },
    });
    return response.data.items || [];
  }

  async getDocumentMetadata(documentId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/metadata/d/${documentId}`);
    return response.data;
  }

  async getElementMetadata(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/metadata/d/${documentId}/w/${workspaceId}/e/${elementId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.info(
          `OnShape getElementMetadata returned 404 for document=${documentId} workspace=${workspaceId} element=${elementId}`
        );
        return {};
      }
      throw error;
    }
  }

  // GlobalTreeNodes: root-level folders and documents
  async getGlobalTreeRootNodes(options: { limit?: number; offset?: number; getPathToRoot?: boolean; raw?: boolean } = {}): Promise<any> {
    const url = `${this.baseApiRoot}/globaltreenodes/magic/1`;
    const params: Record<string, any> = {};
    if (typeof options.limit === "number") params.limit = options.limit;
    if (typeof options.offset === "number") params.offset = options.offset;
    if (options.getPathToRoot) params.getPathToRoot = "true";

    const response = await this.axiosInstance.get(url, { params });
    const data = response?.data || {};
    const items = Array.isArray(data.items) ? data.items.map((it: any) => this.mapGlobalTreeNode(it)) : [];

    return {
      href: data.href || url,
      next: data.next || null,
      items,
      raw: options.raw ? data : undefined,
    };
  }

  // GlobalTreeNodes: contents of a given folder by ID
  async getGlobalTreeFolderContents(folderId: string, options: { limit?: number; offset?: number; getPathToRoot?: boolean; raw?: boolean } = {}): Promise<any> {
    const url = `${this.baseApiRoot}/globaltreenodes/folder/${encodeURIComponent(folderId)}`;
    const params: Record<string, any> = {};
    if (typeof options.limit === "number") params.limit = options.limit;
    if (typeof options.offset === "number") params.offset = options.offset;
    if (options.getPathToRoot) params.getPathToRoot = "true";

    const response = await this.axiosInstance.get(url, { params });
    const data = response?.data || {};
    const items = Array.isArray(data.items) ? data.items.map((it: any) => this.mapGlobalTreeNode(it)) : [];

    return {
      href: data.href || url,
      next: data.next || null,
      items,
      raw: options.raw ? data : undefined,
    };
  }

  private mapGlobalTreeNode(item: any): any {
    if (!item || typeof item !== "object") return item;
    return {
      id: item.id,
      name: item.name,
      jsonType: item.jsonType || item.resourceType,
      resourceType: item.resourceType,
      isContainer: !!item.isContainer,
      isMutable: !!item.isMutable,
      active: !!item.active,
      trash: !!item.trash,
      parentId: item.parentId ?? null,
      owner: item.owner ?? null,
      permissionSet: Array.isArray(item.permissionSet) ? item.permissionSet : [],
      createdAt: item.createdAt,
      modifiedAt: item.modifiedAt,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      href: item.href,
      treeHref: item.treeHref,
      unparentHref: item.unparentHref,
      connectionName: item.connectionName,
      description: item.description,
    };
  }

  /**
   * Aggregate BOM export using BFS traversal of all folders and documents.
   * Finds all assemblies and fetches their flattened BOMs.
   */
  /**
   * Pre-scan the workspace tree to gather statistics without fetching BOMs.
   * Uses BFS traversal to count folders, documents, and element types.
   * Returns assembly list for subsequent parallel BOM fetching.
   * 
   * @param options.delayMs - Delay between API calls (default: 100)
   * @param options.onProgress - Optional callback for enhanced progress updates
   * @param options.signal - Optional AbortSignal for cancellation
   * @param options.scope - Optional scope for partial export
   * @param options.prefixFilter - Optional prefix to filter root folders
   */
  async getDirectoryStats(options: { 
    delayMs?: number; 
    onProgress?: (progress: { 
      foldersScanned: number; 
      documentsScanned: number;
      currentPath?: string[];
      elementCounts?: { ASSEMBLY: number; PARTSTUDIO: number; DRAWING: number; BLOB: number; OTHER: number };
      rootFolders?: RootFolderStatus[];
    }) => void;
    signal?: AbortSignal;
    scope?: { scope: 'full' | 'partial'; documentIds?: string[]; folderIds?: string[] };
    prefixFilter?: string;
  } = {}): Promise<DirectoryStats> {
    const startTime = Date.now();
    const delay = options.delayMs ?? 100;

    // Statistics accumulators
    let totalFolders = 0;
    let totalDocuments = 0;
    let maxDepth = 0;
    const levelCounts: Map<number, number> = new Map();
    const elementCounts = {
      ASSEMBLY: 0,
      PARTSTUDIO: 0,
      DRAWING: 0,
      BLOB: 0,
      OTHER: 0,
    };
    const assemblies: AssemblyReference[] = [];

    // BFS queue: { id, name, type, depth, path, rootFolderId }
    const queue: Array<{
      id: string;
      name: string;
      type: string;
      depth: number;
      path: string[];
      rootFolderId?: string;
    }> = [];
    const visited = new Set<string>();

    const prefixFilter = options.prefixFilter;
    const isPartialExport = options.scope?.scope === 'partial' && 
      ((options.scope.documentIds?.length || 0) > 0 || (options.scope.folderIds?.length || 0) > 0);

    // Root folder status tracking for visualization
    const rootFolderStatuses: Map<string, RootFolderStatus> = new Map();
    const rootFolderDocCounts: Map<string, number> = new Map();

    console.log("[DirectoryStats] Starting pre-scan with delay:", delay, "ms", 
      isPartialExport ? `(partial: ${options.scope?.documentIds?.length || 0} docs, ${options.scope?.folderIds?.length || 0} folders)` : "(full)",
      prefixFilter ? `prefixFilter="${prefixFilter}"` : "");

    // Helper to check if aborted
    const checkAborted = () => {
      if (options.signal?.aborted) {
        throw new Error('Export cancelled');
      }
    };

    // Helper to emit enhanced progress
    const emitProgress = (currentPath: string[] = []) => {
      if (options.onProgress) {
        options.onProgress({ 
          foldersScanned: totalFolders, 
          documentsScanned: totalDocuments,
          currentPath,
          elementCounts: { ...elementCounts },
          rootFolders: Array.from(rootFolderStatuses.values())
        });
      }
    };

    // 1. Seed queue based on scope
    if (isPartialExport) {
      // PARTIAL EXPORT: Process only specified items
      
      // Add specified folders to queue
      if (options.scope?.folderIds?.length) {
        for (const folderId of options.scope.folderIds) {
          queue.push({
            id: folderId,
            name: "Selected Folder",
            type: "folder",
            depth: 0,
            path: [],
          });
        }
      }
      
      // Add specified documents to queue
      if (options.scope?.documentIds?.length) {
        for (const docId of options.scope.documentIds) {
          queue.push({
            id: docId,
            name: "Selected Document",
            type: "document-summary",
            depth: 0,
            path: [],
          });
        }
      }
    } else {
      // FULL EXPORT: Original BFS from root
      try {
        const rootData = await this.getGlobalTreeRootNodes({ limit: 50 });
        let rootItems = rootData.items || [];
        
        // Initialize root folder statuses
        for (const item of rootItems) {
          if (item.jsonType === 'folder' || item.resourceType === 'folder') {
            const isFiltered = prefixFilter && !item.name?.startsWith(prefixFilter);
            rootFolderStatuses.set(item.id, {
              id: item.id,
              name: item.name || 'Unknown',
              status: isFiltered ? 'ignored' : 'upcoming',
              documentCount: 0
            });
            rootFolderDocCounts.set(item.id, 0);
          }
        }
        
        // Apply prefix filter to root folders only
        if (prefixFilter) {
          const originalCount = rootItems.length;
          rootItems = rootItems.filter((item: any) => {
            // Only filter folders by prefix, keep documents at root
            if (item.jsonType === 'folder' || item.resourceType === 'folder') {
              return item.name?.startsWith(prefixFilter);
            }
            return true; // Keep non-folder items (documents at root)
          });
          console.log(`[DirectoryStats] Prefix filter "${prefixFilter}" reduced root items: ${originalCount} → ${rootItems.length}`);
        }
        
        for (const item of rootItems) {
          const isFolder = item.jsonType === 'folder' || item.resourceType === 'folder';
          queue.push({
            id: item.id,
            name: item.name || "Unknown",
            type: item.jsonType || item.resourceType || "unknown",
            depth: 0,
            path: [],
            rootFolderId: isFolder ? item.id : undefined,
          });
        }
        
        // Emit initial progress with root folders
        emitProgress([]);
        
      } catch (err: any) {
        console.error("[DirectoryStats] Failed to fetch root nodes:", err.message);
      }
    }

    // 2. BFS loop
    while (queue.length > 0) {
      checkAborted();
      
      const current = queue.shift()!;

      // Skip if already visited
      if (visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);

      // Update max depth
      maxDepth = Math.max(maxDepth, current.depth);

      // Rate limiting delay
      await new Promise((r) => setTimeout(r, delay));

      const itemType = current.type.toLowerCase();

      // Handle folders
      if (itemType === "folder") {
        console.log("[DirectoryStats] Scanning folder:", current.name);
        totalFolders++;

        // Track level counts for widest level calculation
        levelCounts.set(current.depth, (levelCounts.get(current.depth) || 0) + 1);

        // Update root folder status to scanning if this is a root folder
        const rootId = current.rootFolderId || current.id;
        if (current.depth === 0 && rootFolderStatuses.has(current.id)) {
          const status = rootFolderStatuses.get(current.id)!;
          status.status = 'scanning';
        }

        // Build current path for display
        const currentPath = [...current.path, current.name];

        // Emit enhanced scan progress
        emitProgress(currentPath);

        try {
          const folderData = await this.getGlobalTreeFolderContents(current.id, { limit: 50 });
          for (const child of folderData.items || []) {
            if (!visited.has(child.id)) {
              queue.push({
                id: child.id,
                name: child.name || "Unknown",
                type: child.jsonType || child.resourceType || "unknown",
                depth: current.depth + 1,
                path: currentPath,
                rootFolderId: current.rootFolderId || (current.depth === 0 ? current.id : undefined),
              });
            }
          }
        } catch (err: any) {
          console.error("[DirectoryStats] Error scanning folder", current.name, ":", err.message);
        }
        continue;
      }

      // Handle documents
      if (itemType === "document-summary" || itemType === "document") {
        console.log("[DirectoryStats] Processing document:", current.name);
        totalDocuments++;

        // Track document count per root folder
        if (current.rootFolderId && rootFolderDocCounts.has(current.rootFolderId)) {
          rootFolderDocCounts.set(current.rootFolderId, rootFolderDocCounts.get(current.rootFolderId)! + 1);
          const status = rootFolderStatuses.get(current.rootFolderId);
          if (status) {
            status.documentCount = rootFolderDocCounts.get(current.rootFolderId)!;
          }
        }

        // Build current path for display
        const currentPath = [...current.path, current.name];

        // Emit enhanced scan progress
        emitProgress(currentPath);

        try {
          // Fetch document details
          const doc = await this.getDocument(current.id);
          const workspaceId = doc.defaultWorkspace?.id;

          if (!workspaceId) {
            console.log("[DirectoryStats] No default workspace for document:", current.name);
            continue;
          }

          // Rate limiting delay before elements call
          await new Promise((r) => setTimeout(r, delay));

          // Fetch elements
          const elements = await this.getElements(current.id, workspaceId);

          // Categorize elements by type
          for (const element of elements) {
            const elementType = element.elementType || element.type || "OTHER";

            switch (elementType.toUpperCase()) {
              case "ASSEMBLY":
                elementCounts.ASSEMBLY++;
                assemblies.push({
                  documentId: current.id,
                  documentName: doc.name || current.name,
                  workspaceId: workspaceId,
                  elementId: element.id,
                  elementName: element.name || "Unnamed Assembly",
                  folderPath: current.path,
                });
                break;
              case "PARTSTUDIO":
                elementCounts.PARTSTUDIO++;
                break;
              case "DRAWING":
                elementCounts.DRAWING++;
                break;
              case "BLOB":
                elementCounts.BLOB++;
                break;
              default:
                elementCounts.OTHER++;
            }
          }
        } catch (err: any) {
          console.error("[DirectoryStats] Error processing document", current.name, ":", err.message);
        }
      }
    }

    // Mark all remaining root folders as scanned
    for (const [id, status] of rootFolderStatuses) {
      if (status.status === 'scanning' || status.status === 'upcoming') {
        if (status.status !== 'ignored') {
          status.status = 'scanned';
        }
      }
    }

    // Emit final progress
    emitProgress([]);

    // Find widest level
    let widestLevel = { depth: 0, count: 0 };
    for (const [depth, count] of levelCounts) {
      if (count > widestLevel.count) {
        widestLevel = { depth, count };
      }
    }

    const scanDurationMs = Date.now() - startTime;

    const result: DirectoryStats = {
      scanDate: new Date().toISOString(),
      scanDurationMs,
      summary: {
        totalFolders,
        totalDocuments,
        maxDepth,
        widestLevel,
      },
      elementTypes: elementCounts,
      estimates: {
        assembliesFound: assemblies.length,
        estimatedBomApiCalls: assemblies.length,
        estimatedTimeMinutes: Math.ceil((assemblies.length * 500) / 60000), // 500ms avg per BOM
      },
      assemblies,
    };

    console.log("[DirectoryStats] Pre-scan complete:", result.summary);
    return result;
  }

  /**
   * Helper: Delay execution for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch BOM for a single assembly.
   * Returns null if assembly has no BOM (graceful 404 handling).
   */
  private async getAssemblyBom(
    documentId: string,
    workspaceId: string,
    elementId: string
  ): Promise<{ headers: any[]; rows: any[] } | null> {
    try {
      const response = await this.getBillOfMaterials(documentId, workspaceId, elementId, { indented: "false" });
      
      // Extract headers and rows from response
      return {
        headers: response.headers || response.columnHeaders?.map((h: any) => h.name) || [],
        rows: response.rows || response.bomTable?.items || []
      };
    } catch (error: any) {
      // 404 is expected for assemblies without BOMs
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Export aggregate BOM data for all assemblies with progress callbacks for SSE streaming.
   * Uses parallel fetching with controlled concurrency.
   * 
   * @param options.delayMs - Delay between API calls (per worker)
   * @param options.workerCount - Number of concurrent workers (1-8)
   * @param options.onProgress - Callback for progress events
   * @param options.signal - AbortSignal for cancellation
   * @param options.scope - Optional scope for partial export
   * @param options.prefixFilter - Optional prefix to filter root folders
   */
  async getAggregateBomWithProgress(
    options: {
      delayMs?: number;
      workerCount?: number;
      onProgress?: (event: ExportProgressEvent) => void;
      signal?: AbortSignal;
      scope?: { scope: 'full' | 'partial'; documentIds?: string[]; folderIds?: string[] };
      prefixFilter?: string;
    } = {}
  ): Promise<AggregateBomResult> {
    const startTime = Date.now();
    const delayMs = options.delayMs ?? 100;
    const onProgress = options.onProgress;
    const signal = options.signal;
    
    // Clamp worker count to safe range (1-8)
    const workers = Math.max(1, Math.min(8, options.workerCount ?? 4));
    
    // Check if partial export
    const isPartialExport = options.scope?.scope === 'partial' && 
      ((options.scope.documentIds?.length || 0) > 0 || (options.scope.folderIds?.length || 0) > 0);

    // Helper to check if aborted
    const checkAborted = () => {
      if (signal?.aborted) {
        throw new Error('Export cancelled');
      }
    };

    // Emit initializing phase
    if (onProgress) {
      onProgress({
        phase: 'initializing',
        timestamp: new Date().toISOString()
      });
    }

    checkAborted();

    // Get current user for metadata (with graceful fallback)
    let currentUser: { name: string; email: string } = { name: 'Unknown', email: '' };
    try {
      const userInfo = await this.getCurrentUser();
      currentUser = {
        name: userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Unknown',
        email: userInfo.email || ''
      };
    } catch (error: any) {
      console.warn('[AggregateBOM] Could not fetch user info:', error.message);
      // Continue with default "Unknown" user
    }

    checkAborted();

    // Phase 1: Pre-scan to get assembly list with progress
    console.log(`[AggregateBOM] Starting pre-scan with ${workers} workers...`);
    
    // Emit scanning phase start
    if (onProgress) {
      onProgress({
        phase: 'scanning',
        scan: { foldersScanned: 0, documentsScanned: 0 },
        timing: { elapsedMs: Date.now() - startTime, avgFetchMs: 0, estimatedRemainingMs: 0 },
        timestamp: new Date().toISOString()
      });
    }

    const stats = await this.getDirectoryStats({
      delayMs,
      signal,
      scope: options.scope,
      prefixFilter: options.prefixFilter,
      onProgress: (scanProgress) => {
        if (onProgress) {
          onProgress({
            phase: 'scanning',
            scan: scanProgress,
            timing: { elapsedMs: Date.now() - startTime, avgFetchMs: 0, estimatedRemainingMs: 0 },
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    console.log(`[AggregateBOM] Pre-scan complete: ${stats.assemblies.length} assemblies found`);

    checkAborted();

    // Phase 2: Parallel BOM fetching with progress
    console.log(`[AggregateBOM] Fetching BOMs with ${workers} workers, delay=${delayMs}ms...`);
    
    const limit = pLimit(workers);
    let completedCount = 0;
    let succeededCount = 0;
    let failedCount = 0;
    const fetchTimes: number[] = [];

    // Helper to emit fetch progress
    const emitFetchProgress = (currentAssembly: string, currentPath: string[]) => {
      if (!onProgress) return;
      
      const avgFetchMs = fetchTimes.length > 0 
        ? fetchTimes.reduce((a, b) => a + b, 0) / fetchTimes.length 
        : 500;
      const remaining = stats.assemblies.length - completedCount;
      const estimatedRemainingMs = remaining * avgFetchMs;
      
      onProgress({
        phase: 'fetching',
        fetch: {
          current: completedCount,
          total: stats.assemblies.length,
          currentAssembly,
          currentPath,
          succeeded: succeededCount,
          failed: failedCount
        },
        timing: {
          elapsedMs: Date.now() - startTime,
          avgFetchMs: Math.round(avgFetchMs),
          estimatedRemainingMs: Math.round(estimatedRemainingMs)
        },
        timestamp: new Date().toISOString()
      });
    };

    // Initial fetch progress
    emitFetchProgress('', []);

    const results = await Promise.all(
      stats.assemblies.map(assembly =>
        limit(async (): Promise<AssemblyBomFetchResult> => {
          checkAborted();
          
          const fetchStart = Date.now();
          
          // Emit progress before starting this assembly
          emitFetchProgress(assembly.elementName, assembly.folderPath);
          
          try {
            // Rate limiting delay
            if (delayMs > 0) {
              await this.delay(delayMs);
            }
            
            checkAborted();
            
            // Fetch BOM for this assembly
            const bom = await this.getAssemblyBom(
              assembly.documentId,
              assembly.workspaceId,
              assembly.elementId
            );
            
            const fetchDurationMs = Date.now() - fetchStart;
            fetchTimes.push(fetchDurationMs);
            // Keep only last 20 for rolling average
            if (fetchTimes.length > 20) fetchTimes.shift();
            
            completedCount++;
            succeededCount++;
            
            console.log(
              `[AggregateBOM] ✓ ${completedCount}/${stats.assemblies.length}: ` +
              `"${assembly.elementName}" (${fetchDurationMs}ms)`
            );
            
            // Emit progress after completion
            emitFetchProgress(assembly.elementName, assembly.folderPath);
            
            return {
              source: {
                documentId: assembly.documentId,
                documentName: assembly.documentName,
                folderPath: assembly.folderPath,
                workspaceId: assembly.workspaceId
              },
              assembly: {
                elementId: assembly.elementId,
                name: assembly.elementName
              },
              bom: bom ? {
                headers: bom.headers || [],
                rows: bom.rows || []
              } : null,
              fetchDurationMs
            };
          } catch (error) {
            const fetchDurationMs = Date.now() - fetchStart;
            fetchTimes.push(fetchDurationMs);
            if (fetchTimes.length > 20) fetchTimes.shift();
            
            completedCount++;
            failedCount++;
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            console.warn(
              `[AggregateBOM] ✗ ${completedCount}/${stats.assemblies.length}: ` +
              `"${assembly.elementName}" - ${errorMessage}`
            );
            
            // Emit error progress (but don't stop)
            if (onProgress) {
              onProgress({
                phase: 'fetching',
                fetch: {
                  current: completedCount,
                  total: stats.assemblies.length,
                  currentAssembly: assembly.elementName,
                  currentPath: assembly.folderPath,
                  succeeded: succeededCount,
                  failed: failedCount
                },
                error: {
                  message: errorMessage,
                  assembly: assembly.elementName
                },
                timestamp: new Date().toISOString()
              });
            }
            
            return {
              source: {
                documentId: assembly.documentId,
                documentName: assembly.documentName,
                folderPath: assembly.folderPath,
                workspaceId: assembly.workspaceId
              },
              assembly: {
                elementId: assembly.elementId,
                name: assembly.elementName
              },
              bom: null,
              error: errorMessage,
              fetchDurationMs
            };
          }
        })
      )
    );

    // Calculate summary statistics
    const totalBomRows = results.reduce(
      (sum, r) => sum + (r.bom?.rows?.length || 0),
      0
    );

    const exportDurationMs = Date.now() - startTime;

    console.log('[AggregateBOM] ════════════════════════════════════════');
    console.log('[AggregateBOM] Export Complete');
    console.log(`[AggregateBOM]   Duration: ${(exportDurationMs / 1000).toFixed(1)}s`);
    console.log(`[AggregateBOM]   Workers: ${workers}`);
    console.log(`[AggregateBOM]   Assemblies: ${succeededCount}/${results.length} succeeded`);
    console.log(`[AggregateBOM]   BOM Rows: ${totalBomRows}`);
    console.log('[AggregateBOM] ════════════════════════════════════════');

    return {
      metadata: {
        reportGeneratedAt: new Date().toISOString(),
        generatedBy: currentUser.name || currentUser.email || 'Unknown',
        exportDurationMs,
        exportConfig: {
          workerCount: workers,
          delayMs,
          scope: isPartialExport ? 'partial' : 'full',
          ...(isPartialExport && options.scope?.documentIds?.length && {
            selectedDocuments: options.scope.documentIds
          }),
          ...(isPartialExport && options.scope?.folderIds?.length && {
            selectedFolders: options.scope.folderIds
          }),
          ...(isPartialExport && {
            selectedItemCount: (options.scope?.documentIds?.length || 0) + (options.scope?.folderIds?.length || 0)
          })
        }
      },
      exportDate: new Date().toISOString(),
      summary: {
        foldersScanned: stats.summary.totalFolders,
        documentsScanned: stats.summary.totalDocuments,
        assembliesFound: results.length,
        assembliesSucceeded: succeededCount,
        assembliesFailed: failedCount,
        totalBomRows
      },
      assemblies: results
    };
  }

  /**
   * Export aggregate BOM data for all assemblies in the workspace.
   * Uses parallel fetching with controlled concurrency.
   * 
   * @param delayMs - Delay between API calls (per worker)
   * @param workerCount - Number of concurrent workers (1-8)
   */
  async getAggregateBom(options: { delayMs?: number; workerCount?: number } = {}): Promise<AggregateBomResult> {
    // Delegate to the progress-enabled version without callbacks
    return this.getAggregateBomWithProgress({
      delayMs: options.delayMs,
      workerCount: options.workerCount
    });
  }

  /**
   * Original getAggregateBom implementation (kept for reference during transition).
   * @deprecated Use getAggregateBomWithProgress instead
   */
  private async getAggregateBomLegacy(options: { delayMs?: number; workerCount?: number } = {}): Promise<AggregateBomResult> {
    const startTime = Date.now();
    const delayMs = options.delayMs ?? 100;
    
    // Clamp worker count to safe range (1-8)
    const workers = Math.max(1, Math.min(8, options.workerCount ?? 4));

    // Get current user for metadata (with graceful fallback)
    let currentUser: { name: string; email: string } = { name: 'Unknown', email: '' };
    try {
      const userInfo = await this.getCurrentUser();
      currentUser = {
        name: userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Unknown',
        email: userInfo.email || ''
      };
    } catch (error: any) {
      console.warn('[AggregateBOM] Could not fetch user info:', error.message);
      // Continue with default "Unknown" user
    }

    // Phase 1: Pre-scan to get assembly list
    console.log(`[AggregateBOM] Starting pre-scan with ${workers} workers...`);
    const stats = await this.getDirectoryStats({ delayMs });
    console.log(`[AggregateBOM] Pre-scan complete: ${stats.assemblies.length} assemblies found`);

    // Phase 2: Parallel BOM fetching
    console.log(`[AggregateBOM] Fetching BOMs with ${workers} workers, delay=${delayMs}ms...`);
    
    const limit = pLimit(workers);
    let completedCount = 0;

    const results = await Promise.all(
      stats.assemblies.map(assembly =>
        limit(async (): Promise<AssemblyBomFetchResult> => {
          const fetchStart = Date.now();
          
          try {
            // Rate limiting delay
            if (delayMs > 0) {
              await this.delay(delayMs);
            }
            
            // Fetch BOM for this assembly
            const bom = await this.getAssemblyBom(
              assembly.documentId,
              assembly.workspaceId,
              assembly.elementId
            );
            
            completedCount++;
            const fetchDurationMs = Date.now() - fetchStart;
            
            console.log(
              `[AggregateBOM] ✓ ${completedCount}/${stats.assemblies.length}: ` +
              `"${assembly.elementName}" (${fetchDurationMs}ms)`
            );
            
            return {
              source: {
                documentId: assembly.documentId,
                documentName: assembly.documentName,
                folderPath: assembly.folderPath,
                workspaceId: assembly.workspaceId
              },
              assembly: {
                elementId: assembly.elementId,
                name: assembly.elementName
              },
              bom: bom ? {
                headers: bom.headers || [],
                rows: bom.rows || []
              } : null,
              fetchDurationMs
            };
          } catch (error) {
            completedCount++;
            const fetchDurationMs = Date.now() - fetchStart;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            console.warn(
              `[AggregateBOM] ✗ ${completedCount}/${stats.assemblies.length}: ` +
              `"${assembly.elementName}" - ${errorMessage}`
            );
            
            return {
              source: {
                documentId: assembly.documentId,
                documentName: assembly.documentName,
                folderPath: assembly.folderPath,
                workspaceId: assembly.workspaceId
              },
              assembly: {
                elementId: assembly.elementId,
                name: assembly.elementName
              },
              bom: null,
              error: errorMessage,
              fetchDurationMs
            };
          }
        })
      )
    );

    // Calculate summary statistics
    const assembliesSucceeded = results.filter(r => r.bom !== null).length;
    const assembliesFailed = results.filter(r => r.error).length;
    const totalBomRows = results.reduce(
      (sum, r) => sum + (r.bom?.rows?.length || 0),
      0
    );

    const exportDurationMs = Date.now() - startTime;

    console.log('[AggregateBOM] ════════════════════════════════════════');
    console.log('[AggregateBOM] Export Complete');
    console.log(`[AggregateBOM]   Duration: ${(exportDurationMs / 1000).toFixed(1)}s`);
    console.log(`[AggregateBOM]   Workers: ${workers}`);
    console.log(`[AggregateBOM]   Assemblies: ${assembliesSucceeded}/${results.length} succeeded`);
    console.log(`[AggregateBOM]   BOM Rows: ${totalBomRows}`);
    console.log('[AggregateBOM] ════════════════════════════════════════');

    return {
      metadata: {
        reportGeneratedAt: new Date().toISOString(),
        generatedBy: currentUser.name || currentUser.email || 'Unknown',
        exportDurationMs,
        exportConfig: {
          workerCount: workers,
          delayMs,
          scope: 'full'
        }
      },
      exportDate: new Date().toISOString(),
      summary: {
        foldersScanned: stats.summary.totalFolders,
        documentsScanned: stats.summary.totalDocuments,
        assembliesFound: results.length,
        assembliesSucceeded,
        assembliesFailed,
        totalBomRows
      },
      assemblies: results
    };
  }

  async exportAll(options: any, ids?: string[]): Promise<any> {
    let documentsToExport: OnShapeDocumentInfo[];

    if (ids && ids.length > 0) {
      documentsToExport = await Promise.all(
        ids.map((id) => this.getDocument(id))
      );
    } else {
      const documentList = await this.getDocuments(100, 0);
      documentsToExport = await Promise.all(
        documentList.items.map((doc) => this.getDocument(doc.id))
      );
    }

    const result: any = {
      documents: [],
      exportInfo: {
        totalDocuments: documentsToExport.length,
        processedDocuments: 0,
        exportDate: new Date().toISOString(),
      },
    };

    for (const doc of documentsToExport) {
      const docData: any = { ...doc };

      if (options.includeElements === "true" && doc.defaultWorkspace?.id) {
        docData.elements = await this.getElements(
          doc.id,
          doc.defaultWorkspace.id
        );
      }

      result.documents.push(docData);
      result.exportInfo.processedDocuments++;
    }

    return result;
  }

  async exportStream(options: any, ids?: string[]): Promise<EventEmitter> {
    const emitter = new EventEmitter();

    setTimeout(async () => {
      try {
        const data = await this.exportAll(options, ids);
        emitter.emit("data", data);
        emitter.emit("end");
      } catch (error) {
        emitter.emit("error", error);
      }
    }, 0);

    return emitter;
  }

  async fetchThumbnail(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  }
}
