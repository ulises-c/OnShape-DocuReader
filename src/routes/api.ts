import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { OnShapeApiClient } from "../services/onshape-api-client.ts";
import { ApiUsageTracker } from "../services/api-usage-tracker.ts";

const router = Router();
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
