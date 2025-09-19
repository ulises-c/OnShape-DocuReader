import express from 'express';
import { OnShapeApiClient } from '../services/onshape-api-client';
import { getTokenForSession } from './auth';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const tokens = getTokenForSession(sessionId);
  if (!tokens) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  
  // Attach tokens to request for use in routes
  (req as any).tokens = tokens;
  next();
};

/**
 * Get current user information
 * GET /api/user
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const user = await apiClient.getCurrentUser();
    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's documents
 * GET /api/documents
 */
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const documents = await apiClient.getDocuments();
    res.json(documents);
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document details
 * GET /api/documents/:documentId
 */
router.get('/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const document = await apiClient.getDocument(documentId);
    res.json(document);
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document elements (parts, assemblies, etc.)
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const elements = await apiClient.getDocumentElements(documentId, workspaceId);
    res.json(elements);
  } catch (error: any) {
    console.error('Get elements error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get parts from a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const parts = await apiClient.getParts(documentId, workspaceId, elementId);
    res.json(parts);
  } catch (error: any) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get assemblies from a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/assemblies
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/assemblies', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const assemblies = await apiClient.getAssemblies(documentId, workspaceId, elementId);
    res.json(assemblies);
  } catch (error: any) {
    console.error('Get assemblies error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get mass properties for a specific part
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts/:partId/mass-properties
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/parts/:partId/mass-properties', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId, partId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const massProperties = await apiClient.getPartMassProperties(documentId, workspaceId, elementId, partId);
    res.json(massProperties);
  } catch (error: any) {
    console.error('Get mass properties error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get metadata for a specific element
 * GET /api/documents/:documentId/workspaces/:workspaceId/elements/:elementId/metadata
 */
router.get('/documents/:documentId/workspaces/:workspaceId/elements/:elementId/metadata', requireAuth, async (req, res) => {
  try {
    const { documentId, workspaceId, elementId } = req.params;
    const tokens = (req as any).tokens;
    const apiClient = new OnShapeApiClient(tokens.access_token);
    
    const metadata = await apiClient.getElementMetadata(documentId, workspaceId, elementId);
    res.json(metadata);
  } catch (error: any) {
    console.error('Get element metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as apiRouter };