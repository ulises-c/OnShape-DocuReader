import { Router } from "express";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { OnShapeApiClient } from "../services/onshape-api-client.ts";
import { ApiUsageTracker } from "../services/api-usage-tracker.ts";
import type { AssemblyReference } from "../types/onshape.ts";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// In-memory store for prepared export assemblies (hybrid two-request approach)
// ─────────────────────────────────────────────────────────────────────────────
const exportPreparedData = new Map<string, {
  assemblies: AssemblyReference[];
  createdAt: number;
  scope?: { scope: 'full' | 'partial'; documentIds?: string[]; folderIds?: string[] };
  prefixFilter?: string;
}>();

// Clean up old entries every 5 minutes (TTL: 30 minutes)
setInterval(() => {
  const now = Date.now();
  const TTL = 30 * 60 * 1000; // 30 minutes
  for (const [id, data] of exportPreparedData.entries()) {
    if (now - data.createdAt > TTL) {
      exportPreparedData.delete(id);
      console.log(`[Export] Cleaned up expired export data: ${id}`);
    }
  }
}, 5 * 60 * 1000);
const usageTracker = new ApiUsageTracker();

const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

router.use(requireAuth);

router.get("/user", async (req: Request, res: Response): Promise<Response> => {
  try {
    process.stdout.write("[API] GET /api/user\n");
    const client = new OnShapeApiClient(
      req.session.accessToken!,
      req.session.userId,
      usageTracker
    );
    const user = await client.getCurrentUser();
    return res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get(
  "/documents",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const limit = parseInt(String(req.query.limit || "50"), 10);
      const offset = parseInt(String(req.query.offset || "0"), 10);
      
      process.stdout.write(`[API] GET /api/documents (limit=${limit}, offset=${offset})\n`);
      
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const documents = await client.getDocuments(limit, offset);
      return res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  }
);

router.get(
  "/documents/:id",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const document = await client.getDocument(req.params.id);
      return res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      return res.status(500).json({ error: "Failed to fetch document" });
    }
  }
);

router.get(
  "/documents/:id/versions",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const versions = await client.getDocumentVersions(req.params.id);
      return res.json(versions);
    } catch (error) {
      console.error("Get document versions error:", error);
      return res.status(500).json({ error: "Failed to fetch document versions" });
    }
  }
);

router.get(
  "/documents/:id/branches",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const branches = await client.getDocumentBranches(req.params.id);
      return res.json(branches);
    } catch (error) {
      console.error("Get document branches error:", error);
      return res.status(500).json({ error: "Failed to fetch document branches" });
    }
  }
);

router.get(
  "/documents/:id/branches",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const branches = await client.getDocumentBranches(req.params.id);
      return res.json(branches);
    } catch (error) {
      console.error("Get document branches error:", error);
      return res.status(500).json({ error: "Failed to fetch document branches" });
    }
  }
);

router.get(
  "/documents/:id/combined-history",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const history = await client.getCombinedDocumentHistory(req.params.id);
      return res.json(history);
    } catch (error) {
      console.error("Get combined document history error:", error);
      return res.status(500).json({ error: "Failed to fetch combined document history" });
    }
  }
);

router.get(
  "/documents/:id/history",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const history = await client.getDocumentVersions(req.params.id);
      return res.json(history);
    } catch (error) {
      console.error("Get document history error:", error);
      return res.status(500).json({ error: "Failed to fetch document history" });
    }
  }
);

router.get(
  "/documents/:id/comprehensive",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const data = await client.getComprehensiveDocument(
        req.params.id,
        req.query
      );
      return res.json(data);
    } catch (error) {
      console.error("Get comprehensive document error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch comprehensive document" });
    }
  }
);

router.get(
  "/documents/:id/parent",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const parent = await client.getParentInfo(req.params.id);
      return res.json(parent);
    } catch (error) {
      console.error("Get parent info error:", error);
      return res.status(500).json({ error: "Failed to fetch parent info" });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const elements = await client.getElements(req.params.id, req.params.wid);
      return res.json(elements);
    } catch (error) {
      console.error("Get elements error:", error);
      return res.status(500).json({ error: "Failed to fetch elements" });
    }
  }
);

router.get(
  "/documents/:id/versions/:vid/elements",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const elements = await client.getElementsByVersion(req.params.id, req.params.vid);
      return res.json(elements);
    } catch (error) {
      console.error("Get elements by version error:", error);
      return res.status(500).json({ error: "Failed to fetch elements for version" });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements/:eid/parts",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const parts = await client.getParts(
        req.params.id,
        req.params.wid,
        req.params.eid
      );
      return res.json(parts);
    } catch (error) {
      console.error("Get parts error:", error);
      return res.status(500).json({ error: "Failed to fetch parts" });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements/:eid/assemblies",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const assemblies = await client.getAssemblies(
        req.params.id,
        req.params.wid,
        req.params.eid
      );
      return res.json(assemblies);
    } catch (error) {
      console.error("Get assemblies error:", error);
      return res.status(500).json({ error: "Failed to fetch assemblies" });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements/:eid/bom",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const bom = await client.getBillOfMaterials(
        req.params.id,
        req.params.wid,
        req.params.eid,
        req.query
      );
      return res.json(bom);
    } catch (error: any) {
      console.error("Get BOM error:", error);
      const status = error.response?.status || 500;
      return res.status(502).json({
        error: "Failed to fetch BOM from Onshape",
        status,
        details: error.response?.data || null,
      });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements/:eid/metadata",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const metadata = await client.getElementMetadata(
        req.params.id,
        req.params.wid,
        req.params.eid
      );
      return res.json(metadata);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.info(
          `Element metadata not found for document=${req.params.id} workspace=${req.params.wid} element=${req.params.eid}`
        );
        return res.json({});
      }
      console.error("Get element metadata error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch element metadata" });
    }
  }
);

router.get(
  "/documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const massProps = await client.getPartMassProperties(
        req.params.id,
        req.params.wid,
        req.params.eid,
        req.params.pid
      );
      return res.json(massProps);
    } catch (error) {
      console.error("Get mass properties error:", error);
      return res.status(500).json({ error: "Failed to fetch mass properties" });
    }
  }
);

router.get(
  "/onshape/folders",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const limitRaw = String(req.query.limit ?? "");
      const offsetRaw = String(req.query.offset ?? "");
      const limit = Number.parseInt(limitRaw, 10);
      const offset = Number.parseInt(offsetRaw, 10);
      const getPathToRoot = req.query.getPathToRoot === "true";
      const raw = req.query.raw === "true";

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );

      const data = await client.getGlobalTreeRootNodes({
        limit: Number.isNaN(limit) ? undefined : limit,
        offset: Number.isNaN(offset) ? undefined : offset,
        getPathToRoot,
        raw,
      });

      return res.json(data);
    } catch (error) {
      console.error("Get root folders error:", error);
      return res.status(500).json({ error: "Failed to fetch root folders" });
    }
  }
);

router.get(
  "/onshape/folders/:id",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const folderId = req.params.id;
      const limitRaw = String(req.query.limit ?? "");
      const offsetRaw = String(req.query.offset ?? "");
      const limit = Number.parseInt(limitRaw, 10);
      const offset = Number.parseInt(offsetRaw, 10);
      const getPathToRoot = req.query.getPathToRoot === "true";
      const raw = req.query.raw === "true";

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );

      const data = await client.getGlobalTreeFolderContents(folderId, {
        limit: Number.isNaN(limit) ? undefined : limit,
        offset: Number.isNaN(offset) ? undefined : offset,
        getPathToRoot,
        raw,
      });

      return res.json(data);
    } catch (error: any) {
      const status = error?.response?.status || 500;
      console.error("Get folder contents error:", error);
      return res
        .status(status >= 400 && status < 600 ? status : 500)
        .json({ error: "Failed to fetch folder contents" });
    }
  }
);

router.get(
  "/export/all",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const options = req.query;
      const ids =
        typeof req.query.ids === "string"
          ? req.query.ids.split(",")
          : undefined;
      const data = await client.exportAll(options, ids);
      return res.json(data);
    } catch (error) {
      console.error("Export all error:", error);
      return res.status(500).json({ error: "Export failed" });
    }
  }
);

router.get(
  "/export/stream",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const options = req.query;
      const ids =
        typeof req.query.ids === "string"
          ? req.query.ids.split(",")
          : undefined;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await client.exportStream(options, ids);

      stream.on("data", (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      });

      stream.on("end", () => {
        res.end();
      });

      stream.on("error", (error: Error) => {
        console.error("Export stream error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });
    } catch (error) {
      console.error("Export stream error:", error);
      res.status(500).json({ error: "Export stream failed" });
    }
  }
);

/**
 * GET /api/export/directory-stats
 *
 * Pre-scan the workspace tree to gather statistics.
 * Fast alternative to full export - doesn't fetch BOMs.
 * Returns assembly list for subsequent parallel BOM fetching.
 * 
 * Query params:
 *   - delay: Delay between API calls in ms (default: 100)
 *   - scope: 'full' | 'partial' (default: 'full')
 *   - documentIds: Comma-separated document IDs (for partial)
 *   - folderIds: Comma-separated folder IDs (for partial)
 *   - prefixFilter: Prefix to filter root folders (optional)
 */
router.get(
  "/export/directory-stats",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const delayMs = parseInt(String(req.query.delay ?? "100"), 10);
      
      // Parse scope parameters
      const scopeParam = req.query.scope as string;
      const documentIdsParam = req.query.documentIds as string;
      const folderIdsParam = req.query.folderIds as string;
      
      // Parse prefix filter
      const prefixFilter = req.query.prefixFilter as string | undefined;
      
      const scope = scopeParam === 'partial' 
        ? {
            scope: 'partial' as const,
            documentIds: documentIdsParam ? documentIdsParam.split(',').filter(Boolean) : undefined,
            folderIds: folderIdsParam ? folderIdsParam.split(',').filter(Boolean) : undefined
          }
        : undefined;

      process.stdout.write(`\n[Export] ════════════════════════════════════════════════════════════════\n`);
      process.stdout.write(`[Export] Starting directory stats pre-scan\n`);
      process.stdout.write(`[Export]   Delay: ${delayMs}ms\n`);
      process.stdout.write(`[Export]   Scope: ${scope ? `partial (${scope.documentIds?.length || 0} docs, ${scope.folderIds?.length || 0} folders)` : 'full'}\n`);
      if (prefixFilter) {
        process.stdout.write(`[Export]   Prefix filter: "${prefixFilter}"\n`);
      }
      process.stdout.write(`[Export] ════════════════════════════════════════════════════════════════\n`);

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );

      const stats = await client.getDirectoryStats({ delayMs, scope, prefixFilter });

      process.stdout.write(`[Export] Directory stats complete:\n`);
      process.stdout.write(`[Export]   Folders: ${stats.summary.totalFolders}\n`);
      process.stdout.write(`[Export]   Documents: ${stats.summary.totalDocuments}\n`);
      process.stdout.write(`[Export]   Assemblies: ${stats.estimates.assembliesFound}\n`);

      return res.json(stats);
    } catch (error: any) {
      console.error("[Export] Directory stats error:", error);
      return res.status(500).json({
        error: "Failed to scan directory",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/export/prepare-assemblies
 * 
 * Prepare assemblies for export (stores on server, returns exportId).
 * Part of hybrid two-request approach to eliminate double pre-scan.
 * 
 * Body params:
 *   - assemblies: Array of AssemblyReference objects (required)
 *   - scope: Export scope object (optional)
 *   - prefixFilter: Prefix filter string (optional)
 * 
 * Returns:
 *   - exportId: Unique ID to use with aggregate-bom-stream
 *   - assembliesCount: Number of assemblies stored
 */
router.post(
  "/export/prepare-assemblies",
  express.json({ limit: '10mb' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { assemblies, scope, prefixFilter } = req.body;
      
      if (!assemblies || !Array.isArray(assemblies) || assemblies.length === 0) {
        res.status(400).json({ error: "assemblies array is required" });
        return;
      }
      
      // Generate unique ID
      const exportId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Store for later retrieval
      exportPreparedData.set(exportId, {
        assemblies,
        createdAt: Date.now(),
        scope,
        prefixFilter
      });
      
      console.log(`[Export] Prepared ${assemblies.length} assemblies with exportId: ${exportId}`);
      
      res.json({ exportId, assembliesCount: assemblies.length });
    } catch (error) {
      console.error("[Export] Error preparing assemblies:", error);
      res.status(500).json({ error: "Failed to prepare assemblies" });
    }
  }
);

/**
 * GET /api/export/aggregate-bom-stream
 * 
 * Stream aggregate BOM export with real-time progress via SSE.
 * 
 * Query params:
 *   - delay: Delay between API calls in ms (default: 100)
 *   - workers: Number of parallel workers 1-8 (default: 4)
 *   - scope: 'full' | 'partial' (default: 'full')
 *   - documentIds: Comma-separated document IDs (for partial)
 *   - folderIds: Comma-separated folder IDs (for partial)
 *   - prefixFilter: Prefix to filter root folders (optional)
 *   - exportId: ID from prepare-assemblies endpoint (skip scan if provided)
 * 
 * Events emitted:
 *   - connected: Initial connection established
 *   - progress: Export progress update
 *   - complete: Export finished successfully (includes full result)
 *   - error: Export failed
 */
router.get(
  "/export/aggregate-bom-stream",
  async (req: Request, res: Response): Promise<void> => {
    const accessToken = req.session?.accessToken;
    
    if (!accessToken) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const delayMs = parseInt(String(req.query.delay ?? "100"), 10);
    const workerCount = parseInt(String(req.query.workers ?? "4"), 10);
    
    // Parse exportId for hybrid two-request approach (skip scan if provided)
    const exportId = req.query.exportId as string | undefined;
    
    // Parse scope parameters
    const scopeParam = req.query.scope as string;
    const documentIdsParam = req.query.documentIds as string;
    const folderIdsParam = req.query.folderIds as string;
    
    // Parse prefix filter
    let activePrefixFilter = req.query.prefixFilter as string | undefined;
    
    // Scope can be 'partial' or undefined (full). Type allows both.
    let scope: { scope: 'full' | 'partial'; documentIds?: string[]; folderIds?: string[] } | undefined = 
      scopeParam === 'partial' 
        ? {
            scope: 'partial' as const,
            documentIds: documentIdsParam ? documentIdsParam.split(',').filter(Boolean) : undefined,
            folderIds: folderIdsParam ? folderIdsParam.split(',').filter(Boolean) : undefined
          }
        : undefined;
    
    // Check for pre-scanned assemblies (hybrid approach)
    // Must be done BEFORE setting SSE headers so we can return JSON error if invalid
    let preScannedAssemblies: AssemblyReference[] | undefined;
    
    if (exportId) {
      const preparedData = exportPreparedData.get(exportId);
      if (!preparedData) {
        // Return JSON error since SSE headers not set yet
        res.status(400).json({ error: "Export session expired or invalid. Please try again." });
        return;
      }
      
      // Retrieve and delete (one-time use)
      preScannedAssemblies = preparedData.assemblies;
      // Override scope/prefixFilter from prepared data if present
      if (preparedData.scope) {
        scope = preparedData.scope;
      }
      if (preparedData.prefixFilter) {
        activePrefixFilter = preparedData.prefixFilter;
      }
      exportPreparedData.delete(exportId);
      
      console.log(`[Export SSE] Using ${preScannedAssemblies.length} pre-scanned assemblies from exportId: ${exportId}`);
    }
    
    // Set SSE headers (after exportId validation)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    let closed = false;
    
    // Define sendEvent helper for SSE communication
    const sendEvent = (event: string, data: any) => {
      if (closed) return;
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        
        // Log progress events to backend console for debugging (immediate flush)
        if (event === 'progress' && data.phase) {
          if (data.phase === 'scanning' && data.scan) {
            process.stdout.write(`[Export SSE] 📁 Scanning: ${data.scan.foldersScanned} folders, ${data.scan.documentsScanned} docs\n`);
          } else if (data.phase === 'fetching' && data.fetch) {
            const pct = data.fetch.total > 0 ? Math.round((data.fetch.current / data.fetch.total) * 100) : 0;
            process.stdout.write(`[Export SSE] 🏗️ Fetching: [${pct}%] ${data.fetch.current}/${data.fetch.total} - ${data.fetch.currentAssembly || ''}\n`);
          }
        }
      } catch (e) {
        closed = true;
      }
    };
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('[Export SSE] Client disconnected');
      closed = true;
      abortController.abort();
    });
    
    // Send connected event
    sendEvent('connected', { timestamp: new Date().toISOString() });
    
    process.stdout.write("\n");
    process.stdout.write("╔════════════════════════════════════════════════════════════════════════╗\n");
    process.stdout.write("║  [Export SSE] Starting aggregate BOM stream                            ║\n");
    process.stdout.write("╚════════════════════════════════════════════════════════════════════════╝\n");
    process.stdout.write(`[Export SSE]   Workers: ${workerCount}\n`);
    process.stdout.write(`[Export SSE]   Delay: ${delayMs}ms\n`);
    process.stdout.write(`[Export SSE]   Scope: ${scope?.scope === 'partial' ? 'partial' : 'full'}\n`);
    if (scope?.scope === 'partial') {
      process.stdout.write(`[Export SSE]   Documents: ${scope.documentIds?.length || 0}\n`);
      process.stdout.write(`[Export SSE]   Folders: ${scope.folderIds?.length || 0}\n`);
    }
    if (activePrefixFilter) {
      process.stdout.write(`[Export SSE]   Prefix filter: "${activePrefixFilter}"\n`);
    }
    process.stdout.write("──────────────────────────────────────────────────────────────────────────\n");
    
    try {
      const client = new OnShapeApiClient(
        accessToken,
        req.session.userId,
        usageTracker
      );
      
      const result = await client.getAggregateBomWithProgress({
        delayMs,
        workerCount,
        onProgress: (event) => {
          if (!closed) {
            sendEvent('progress', event);
          }
        },
        signal: abortController.signal,
        scope: scope?.scope === 'partial' ? scope : undefined,
        prefixFilter: exportId ? undefined : activePrefixFilter, // prefixFilter only applies during scan
        preScannedAssemblies
      });
      
      // Send complete event with full result
      if (!closed) {
        sendEvent('complete', {
          phase: 'complete',
          result,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message === 'Export cancelled') {
        process.stdout.write('[Export SSE] Export cancelled by client\n');
      } else {
        process.stdout.write(`[Export SSE] Export error: ${message}\n`);
        if (!closed) {
          sendEvent('error', {
            phase: 'error',
            error: { message },
            timestamp: new Date().toISOString()
          });
        }
      }
    } finally {
      if (!closed) {
        res.end();
      }
    }
  }
);

/**
 * GET /api/export/aggregate-bom
 * 
 * Export aggregate BOM data for all assemblies.
 * Uses parallel fetching with controlled concurrency.
 * 
 * Query params:
 *   - delay: Delay between API calls in ms (default: 100)
 *   - workers: Number of parallel workers 1-8 (default: 4)
 */
router.get(
  "/export/aggregate-bom",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      // Delay between API calls to avoid rate limits
      const delayMs = parseInt(String(req.query.delay ?? "150"), 10);
      const workerCount = parseInt(String(req.query.workers ?? "4"), 10);

      console.log(`[AggregateBOM] Starting export (workers=${workerCount}, delay=${delayMs}ms)`);

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );

      const result = await client.getAggregateBom({ delayMs, workerCount });

      console.log("[AggregateBOM] Export complete:", result.summary);

      return res.json(result);
    } catch (error: any) {
      console.error("Aggregate BOM export error:", error);
      return res.status(500).json({
        error: "Aggregate BOM export failed",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/thumbnail-metadata
 * 
 * Fetch thumbnail metadata to discover available sizes.
 * Used as fallback when direct thumbnail URL from BOM response is unavailable.
 * 
 * Query params:
 *   - documentId: Document ID (required)
 *   - workspaceId: Workspace ID (required)
 *   - elementId: Element ID (required)
 *   - partId: Part ID (optional, for part-specific thumbnails)
 */
router.get(
  "/thumbnail-metadata",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { documentId, workspaceId, elementId, partId } = req.query;
      
      if (!documentId || !workspaceId || !elementId) {
        return res.status(400).json({ 
          error: "Missing required parameters: documentId, workspaceId, elementId" 
        });
      }
      
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      
      const metadata = await client.getThumbnailMetadata(
        documentId as string,
        workspaceId as string,
        elementId as string,
        partId as string | undefined
      );
      
      return res.json(metadata);
    } catch (error: any) {
      console.error("Get thumbnail metadata error:", error);
      const status = error.response?.status || 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ 
        error: "Failed to fetch thumbnail metadata",
        details: error.message
      });
    }
  }
);

router.get(
  "/thumbnail-proxy",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL parameter required" });
      }

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const imageBuffer = await client.fetchThumbnail(url);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(imageBuffer);
    } catch (error) {
      console.error("Thumbnail proxy error:", error);
      return res.status(500).json({ error: "Failed to fetch thumbnail" });
    }
  }
);

router.get(
  "/usage/stats",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const detailed = req.query.detailed === "true";

      const stats = await usageTracker.getStats(hours);

      if (detailed) {
        const endpointBreakdown = await usageTracker.getEndpointBreakdown();
        return res.json({
          ...stats,
          endpointBreakdown,
        });
      }

      return res.json(stats);
    } catch (error) {
      console.error("Get usage stats error:", error);
      return res.status(500).json({ error: "Failed to retrieve usage stats" });
    }
  }
);

export default router;
