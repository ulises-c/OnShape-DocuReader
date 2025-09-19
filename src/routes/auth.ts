import express from 'express';
import { OAuthService } from '../services/oauth-service';
import { SessionStorage } from '../services/session-storage';

const router = express.Router();
const oauthService = OAuthService.getInstance();
const sessionStorage = SessionStorage.getInstance();

// Simple state store for OAuth (in production, use Redis or database)
const stateStore = new Map<string, string>();

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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * Handle OAuth callback
 * GET /auth/callback
 */
router.get('/callback', async (req, res): Promise<void> => {
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
    if (!stateStore.has(state as string)) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }
    
    // Clean up state
    stateStore.delete(state as string);
    
    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForToken(code as string, state as string);
    
    // Store tokens persistently
    const sessionId = Date.now().toString();
    sessionStorage.set(sessionId, tokens);

    // Set session cookie and redirect to main app (which will show dashboard if authenticated)
    res.cookie('session_id', sessionId, { httpOnly: true, secure: false });
    res.redirect('/');  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current authentication status
 * GET /auth/status
 */
router.get('/status', (req, res): void => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId || !sessionStorage.has(sessionId)) {
    res.json({ authenticated: false });
    return;
  }
  
  const tokens = sessionStorage.get(sessionId);
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
    sessionStorage.delete(sessionId);
  }
  
  res.clearCookie('session_id');
  res.json({ message: 'Logged out successfully' });
});

/**
 * Get access token for API calls (internal use)
 */
export function getTokenForSession(sessionId: string) {
  return sessionStorage.get(sessionId);
}

export { router as authRouter };