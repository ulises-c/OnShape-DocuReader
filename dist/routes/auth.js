"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.getTokenForSession = getTokenForSession;
const express_1 = __importDefault(require("express"));
const oauth_service_1 = require("../services/oauth-service");
const router = express_1.default.Router();
exports.authRouter = router;
const oauthService = oauth_service_1.OAuthService.getInstance();
// Store tokens temporarily (in production, use secure sessions/database)
const tokenStore = new Map();
// Simple state store for OAuth (in production, use Redis or database)
const stateStore = new Map();
/**
 * Initiate OAuth flow
 * GET /auth/login
 */
router.get('/login', (req, res) => {
    try {
        const { url, state } = oauthService.generateAuthUrl();
        // Store state temporarily
        stateStore.set(state, state);
        res.redirect(url);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }
});
/**
 * Handle OAuth callback
 * GET /auth/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            res.status(400).json({ error: `OAuth error: ${error}` });
            return;
        }
        if (!code || !state) {
            res.status(400).json({ error: 'Missing authorization code or state' });
            return;
        }
        // Verify state
        if (!stateStore.has(state)) {
            res.status(400).json({ error: 'Invalid state parameter' });
            return;
        }
        // Clean up state
        stateStore.delete(state);
        // Exchange code for tokens
        const tokens = await oauthService.exchangeCodeForToken(code, state);
        // Store tokens (in production, use secure storage)
        const sessionId = Date.now().toString();
        tokenStore.set(sessionId, tokens);
        // Set session cookie and redirect to dashboard
        res.cookie('session_id', sessionId, { httpOnly: true, secure: false });
        res.redirect('/dashboard');
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get current authentication status
 * GET /auth/status
 */
router.get('/status', (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (!sessionId || !tokenStore.has(sessionId)) {
        res.json({ authenticated: false });
        return;
    }
    const tokens = tokenStore.get(sessionId);
    res.json({
        authenticated: true,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in
    });
});
/**
 * Logout - clear session
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
        tokenStore.delete(sessionId);
    }
    res.clearCookie('session_id');
    res.json({ message: 'Logged out successfully' });
});
/**
 * Get access token for API calls (internal use)
 */
function getTokenForSession(sessionId) {
    return tokenStore.get(sessionId);
}
//# sourceMappingURL=auth.js.map