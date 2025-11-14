import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { OnShapeApiClient } from "../services/onshape-api-client.ts";
import { ApiUsageTracker } from "../services/api-usage-tracker.ts";
import Database from "better-sqlite3";

const router = Router();
const usageTracker = new ApiUsageTracker();

const folderDb = new Database(".data/app.db");
folderDb.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    owner_type INTEGER,
    created_at TEXT,
    modified_at TEXT,
    fetched_at TEXT DEFAULT (datetime('now')),
    microversion TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_folders_fetched ON folders(fetched_at);
`);

// Try to add parent_id column if it does not exist yet (idempotent via try/catch)
try {
  const cols = folderDb
    .prepare("PRAGMA table_info(folders)")
    .all()
    .map((r: any) => r.name);
  if (!cols.includes("parent_id")) {
    folderDb.exec(`ALTER TABLE folders ADD COLUMN parent_id TEXT`);
  }
} catch (e) {
  // ignore migration errors
}

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

router.get(
  "/folders/:id",
  async (req: Request, res: Response): Promise<Response> => {
    const id = String(req.params.id || "").trim();
    try {
      if (!id || id.toLowerCase() === "root") {
        res.setHeader("X-Cache", "BYPASS");
        return res.json({
          id: "root",
          name: "Root",
          description: null,
          owner: null,
          modifiedAt: null,
          parentId: null,
        });
      }

      const row = folderDb
        .prepare("SELECT * FROM folders WHERE id = ?")
        .get(id) as
        | {
            id: string;
            name: string;
            description?: string | null;
            owner?: string | null;
            owner_type?: number | null;
            created_at?: string | null;
            modified_at?: string | null;
            fetched_at?: string | null;
            microversion?: string | null;
            parent_id?: string | null;
          }
        | undefined;

      const TTL_MS = 7 * 24 * 60 * 60 * 1000;
      const isFresh =
        !!row &&
        !!row.fetched_at &&
        Date.now() - new Date(row.fetched_at).getTime() < TTL_MS;

      if (isFresh) {
        res.setHeader("X-Cache", "HIT");
        return res.json({
          id: row.id,
          name: row.name,
          description: row.description ?? null,
          owner: row.owner ?? null,
          modifiedAt: row.modified_at ?? null,
          parentId: row.parent_id ?? null,
        });
      }

      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );

      const folder = await client.getFolder(id);

      const info = {
        id: String(folder.id || id),
        name: String(folder.name || `Folder ${id}`),
        description:
          typeof folder.description === "string" ? folder.description : null,
        owner:
          folder?.owner?.name ||
          folder?.owner?.id ||
          (typeof folder.owner === "string" ? folder.owner : null),
        owner_type:
          typeof folder?.owner?.type === "number" ? folder.owner.type : null,
        created_at: folder.createdAt || folder.created_at || null,
        modified_at: folder.modifiedAt || folder.modified_at || null,
        microversion: folder.microversion || null,
        parent_id:
          folder?.parentId ||
          folder?.parent?.id ||
          null,
      };

      folderDb
        .prepare(
          `
          INSERT INTO folders (id, name, description, owner, owner_type, created_at, modified_at, microversion, fetched_at, parent_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            description=excluded.description,
            owner=excluded.owner,
            owner_type=excluded.owner_type,
            created_at=excluded.created_at,
            modified_at=excluded.modified_at,
            microversion=excluded.microversion,
            fetched_at=datetime('now'),
            parent_id=excluded.parent_id
        `
        )
        .run(
          info.id,
          info.name,
          info.description,
          info.owner,
          info.owner_type ?? null,
          info.created_at,
          info.modified_at,
          info.microversion,
          info.parent_id
        );

      res.setHeader("X-Cache", "MISS");
      return res.json({
        id: info.id,
        name: info.name,
        description: info.description,
        owner: info.owner,
        modifiedAt: info.modified_at,
        parentId: info.parent_id ?? null,
      });
    } catch (error: any) {
      console.error("Get folder error:", error);
      const row = folderDb
        .prepare("SELECT * FROM folders WHERE id = ?")
        .get(id) as any;
      if (row) {
        res.setHeader("X-Cache", "STALE");
        return res.json({
          id: row.id,
          name: row.name,
          description: row.description ?? null,
          owner: row.owner ?? null,
          modifiedAt: row.modified_at ?? null,
          parentId: row.parent_id ?? null,
        });
      }
      res.setHeader("X-Cache", "MISS");
      return res.json({
        id,
        name: `Folder ${id}`,
        description: null,
        owner: null,
        modifiedAt: null,
        parentId: null,
      });
    }
  }
);

// Global tree: top-level nodes
router.get(
  "/folders/tree/root",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const data: any = await client.getGlobalTreeMagicRoot(true);

      // Attempt to extract list of nodes resiliently across possible shapes
      const list: any[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.children)
        ? data.children
        : Array.isArray(data?.nodes)
        ? data.nodes
        : Array.isArray(data)
        ? data
        : [];

      // Heuristic: identify folder-like nodes conservatively
      const folders = list.filter((n: any) => {
        const t = String(n?.nodeType || n?.type || n?.kind || "").toLowerCase();
        return (
          t.includes("folder") ||
          n?.isContainer === true ||
          n?.folder === true ||
          t === "w" // some deployments mark folder as 'w'
        );
      });

      const upsert = folderDb.prepare(`
        INSERT INTO folders (id, name, parent_id, fetched_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          parent_id=excluded.parent_id,
          fetched_at=datetime('now')
      `);

      const simplified = folders.map((n: any) => {
        const id = String(n?.id || n?.folderId || n?.oid || "");
        const name = String(n?.name || n?.label || `Folder ${id}`);
        // At top-level, parent is virtual "root"
        upsert.run(id, name, "root");
        return { id, name, parentId: "root" };
      });

      return res.json({ folders: simplified });
    } catch (error) {
      console.error("Get global tree root error:", error);
      return res.status(500).json({ error: "Failed to fetch folder tree root" });
    }
  }
);

// Global tree: children of a specific folder id
router.get(
  "/folders/tree/:id",
  async (req: Request, res: Response): Promise<Response> => {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "Folder id is required" });

    try {
      const client = new OnShapeApiClient(
        req.session.accessToken!,
        req.session.userId,
        usageTracker
      );
      const data: any = await client.getGlobalTreeFolder(id);

      const list: any[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.children)
        ? data.children
        : Array.isArray(data?.nodes)
        ? data.nodes
        : Array.isArray(data)
        ? data
        : [];

      const folders = list.filter((n: any) => {
        const t = String(n?.nodeType || n?.type || n?.kind || "").toLowerCase();
        return (
          t.includes("folder") ||
          n?.isContainer === true ||
          n?.folder === true ||
          t === "w"
        );
      });

      const upsert = folderDb.prepare(`
        INSERT INTO folders (id, name, parent_id, fetched_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          parent_id=excluded.parent_id,
          fetched_at=datetime('now')
      `);

      const simplified = folders.map((n: any) => {
        const fid = String(n?.id || n?.folderId || n?.oid || "");
        const name = String(n?.name || n?.label || `Folder ${fid}`);
        upsert.run(fid, name, id);
        return { id: fid, name, parentId: id };
      });

      return res.json({ folders: simplified });
    } catch (error) {
      console.error("Get global tree folder error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch folder children" });
    }
  }
);

router.get("/user", async (req: Request, res: Response): Promise<Response> => {
  try {
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
      const limit = parseInt(String(req.query.limit || "20"), 10);
      const offset = parseInt(String(req.query.offset || "0"), 10);
      
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
