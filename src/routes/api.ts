import { Router, Request, Response, NextFunction } from 'express';
import { OnShapeApiClient } from '../services/onshape-api-client.ts';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(requireAuth);

router.get('/user', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const user = await client.getCurrentUser();
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/documents', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const documents = await client.getDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const document = await client.getDocument(req.params.id);
    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.get('/documents/:id/comprehensive', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const data = await client.getComprehensiveDocument(req.params.id, req.query);
    res.json(data);
  } catch (error) {
    console.error('Get comprehensive document error:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive document' });
  }
});

router.get('/documents/:id/parent', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const parent = await client.getParentInfo(req.params.id);
    res.json(parent);
  } catch (error) {
    console.error('Get parent info error:', error);
    res.status(500).json({ error: 'Failed to fetch parent info' });
  }
});

router.get('/documents/:id/workspaces/:wid/elements', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const elements = await client.getElements(req.params.id, req.params.wid);
    res.json(elements);
  } catch (error) {
    console.error('Get elements error:', error);
    res.status(500).json({ error: 'Failed to fetch elements' });
  }
});

router.get('/documents/:id/workspaces/:wid/elements/:eid/parts', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const parts = await client.getParts(req.params.id, req.params.wid, req.params.eid);
    res.json(parts);
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Failed to fetch parts' });
  }
});

router.get('/documents/:id/workspaces/:wid/elements/:eid/assemblies', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const assemblies = await client.getAssemblies(req.params.id, req.params.wid, req.params.eid);
    res.json(assemblies);
  } catch (error) {
    console.error('Get assemblies error:', error);
    res.status(500).json({ error: 'Failed to fetch assemblies' });
  }
});

router.get('/documents/:id/workspaces/:wid/elements/:eid/metadata', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const metadata = await client.getElementMetadata(req.params.id, req.params.wid, req.params.eid);
    res.json(metadata);
  } catch (error) {
    console.error('Get element metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch element metadata' });
  }
});

router.get('/documents/:id/workspaces/:wid/elements/:eid/parts/:pid/mass-properties', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const massProps = await client.getPartMassProperties(
      req.params.id,
      req.params.wid,
      req.params.eid,
      req.params.pid
    );
    res.json(massProps);
  } catch (error) {
    console.error('Get mass properties error:', error);
    res.status(500).json({ error: 'Failed to fetch mass properties' });
  }
});

router.get('/export/all', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const options = req.query;
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',') : undefined;
    const data = await client.exportAll(options, ids);
    res.json(data);
  } catch (error) {
    console.error('Export all error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/export/stream', async (req: Request, res: Response) => {
  try {
    const client = new OnShapeApiClient(req.session.accessToken!);
    const options = req.query;
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',') : undefined;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const stream = await client.exportStream(options, ids);
    
    stream.on('data', (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
    
    stream.on('end', () => {
      res.end();
    });
    
    stream.on('error', (error: Error) => {
      console.error('Export stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.error('Export stream error:', error);
    res.status(500).json({ error: 'Export stream failed' });
  }
});

router.get('/thumbnail-proxy', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    const client = new OnShapeApiClient(req.session.accessToken!);
    const imageBuffer = await client.fetchThumbnail(url);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch thumbnail' });
  }
});

export default router;
