"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const onshape_api_client_1 = require("../services/onshape-api-client");
const auth_1 = require("./auth");
const router = express_1.default.Router();
exports.apiRouter = router;
// Middleware to check authentication
const requireAuth = (req, res, next) => {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    const tokens = (0, auth_1.getTokenForSession)(sessionId);
    if (!tokens) {
        res.status(401).json({ error: 'Invalid session' });
        return;
    }
    // Attach tokens to request for use in routes
    req.tokens = tokens;
    next();
};
/**
 * Get current user information
 * GET /api/user
 */
router.get('/user', requireAuth, async (req, res) => {
    try {
        const tokens = req.tokens;
        const apiClient = new onshape_api_client_1.OnShapeApiClient(tokens.access_token);
        const user = await apiClient.getCurrentUser();
        res.json(user);
    }
    catch (error) {
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
        const tokens = req.tokens;
        const apiClient = new onshape_api_client_1.OnShapeApiClient(tokens.access_token);
        const documents = await apiClient.getDocuments();
        res.json(documents);
    }
    catch (error) {
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
        const tokens = req.tokens;
        const apiClient = new onshape_api_client_1.OnShapeApiClient(tokens.access_token);
        const document = await apiClient.getDocument(documentId);
        res.json(document);
    }
    catch (error) {
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
        const tokens = req.tokens;
        const apiClient = new onshape_api_client_1.OnShapeApiClient(tokens.access_token);
        const elements = await apiClient.getDocumentElements(documentId, workspaceId);
        res.json(elements);
    }
    catch (error) {
        console.error('Get elements error:', error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=api.js.map