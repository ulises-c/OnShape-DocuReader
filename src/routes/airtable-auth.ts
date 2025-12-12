/**
 * Airtable Authentication Routes
 * 
 * Handles OAuth 2.0 flow for Airtable authentication.
 * Separate from OnShape auth to allow independent login/logout.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { airtableOAuthService } from '../services/airtable-oauth-service.ts';
import { isAirtableConfigured } from '../config/airtable.ts';

const router = Router();

/**
 * GET /auth/airtable/login
 * Initiate Airtable OAuth flow
 */
router.get('/login', (req: Request, res: Response): void => {
  if (!isAirtableConfigured()) {
    res.status(503).json({ error: 'Airtable OAuth not configured' });
    return;
  }

  try {
    // Generate PKCE values
    const codeVerifier = airtableOAuthService.generateCodeVerifier();
    const codeChallenge = airtableOAuthService.generateCodeChallenge(codeVerifier);
    const state = airtableOAuthService.generateRandomString(16);

    // Store in session for callback verification
    req.session.airtableCodeVerifier = codeVerifier;
    req.session.airtableOauthState = state;

    // Generate authorization URL
    const authUrl = airtableOAuthService.generateAuthUrl(state, codeChallenge);

    console.log('[Airtable Auth] Initiating OAuth flow');
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('[Airtable Auth] Login error:', error);
    res.status(500).json({ error: 'Failed to initiate Airtable login' });
  }
});

/**
 * GET /auth/airtable/callback
 * Handle OAuth callback from Airtable
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('[Airtable Auth] OAuth error:', error, error_description);
    res.redirect('/#/airtable-error?error=' + encodeURIComponent(String(error_description || error)));
    return;
  }

  // Verify state parameter
  if (!state || state !== req.session.airtableOauthState) {
    console.error('[Airtable Auth] State mismatch');
    res.redirect('/#/airtable-error?error=state_mismatch');
    return;
  }

  // Verify code is present
  if (!code || typeof code !== 'string') {
    console.error('[Airtable Auth] Missing authorization code');
    res.redirect('/#/airtable-error?error=missing_code');
    return;
  }

  // Verify code verifier is in session
  const codeVerifier = req.session.airtableCodeVerifier;
  if (!codeVerifier) {
    console.error('[Airtable Auth] Missing code verifier in session');
    res.redirect('/#/airtable-error?error=session_expired');
    return;
  }

  try {
    // Exchange code for tokens
    const tokens = await airtableOAuthService.exchangeCodeForTokens(code, codeVerifier);

    // Store tokens in session
    req.session.airtable = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiresAt,
      scope: tokens.scope,
    };

    // Clear OAuth state from session
    delete req.session.airtableCodeVerifier;
    delete req.session.airtableOauthState;

    console.log('[Airtable Auth] Successfully authenticated');

    // Redirect back to dashboard
    res.redirect('/#/documents');
  } catch (error: any) {
    console.error('[Airtable Auth] Token exchange error:', error);
    res.redirect('/#/airtable-error?error=' + encodeURIComponent(error.message));
  }
});

/**
 * GET /auth/airtable/status
 * Check Airtable authentication status
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  // Check if Airtable is configured
  if (!isAirtableConfigured()) {
    res.json({
      configured: false,
      authenticated: false,
      message: 'Airtable OAuth not configured',
    });
    return;
  }

  const airtableSession = req.session.airtable;

  if (!airtableSession?.accessToken) {
    res.json({
      configured: true,
      authenticated: false,
    });
    return;
  }

  // Check if token is expired
  const isExpired = airtableOAuthService.isTokenExpired(airtableSession.tokenExpiry);

  if (isExpired && airtableSession.refreshToken) {
    // Try to refresh the token
    try {
      const newTokens = await airtableOAuthService.refreshAccessToken(airtableSession.refreshToken);
      
      req.session.airtable = {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiry: newTokens.expiresAt,
        scope: newTokens.scope,
      };

      res.json({
        configured: true,
        authenticated: true,
        scope: newTokens.scope,
        tokenRefreshed: true,
      });
      return;
    } catch (error) {
      console.error('[Airtable Auth] Token refresh failed:', error);
      // Clear invalid tokens
      delete req.session.airtable;
      
      res.json({
        configured: true,
        authenticated: false,
        error: 'Token refresh failed',
      });
      return;
    }
  }

  res.json({
    configured: true,
    authenticated: !isExpired,
    scope: airtableSession.scope,
    expiresAt: airtableSession.tokenExpiry,
  });
});

/**
 * POST /auth/airtable/logout
 * Clear Airtable tokens from session (does not affect OnShape auth)
 */
router.post('/logout', (req: Request, res: Response): void => {
  // Only clear Airtable-related session data
  delete req.session.airtable;
  delete req.session.airtableCodeVerifier;
  delete req.session.airtableOauthState;

  console.log('[Airtable Auth] Logged out');
  res.json({ success: true });
});

/**
 * POST /auth/airtable/refresh
 * Manually refresh access token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const airtableSession = req.session.airtable;

  if (!airtableSession?.refreshToken) {
    res.status(401).json({ error: 'No Airtable session or refresh token' });
    return;
  }

  try {
    const newTokens = await airtableOAuthService.refreshAccessToken(airtableSession.refreshToken);
    
    req.session.airtable = {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenExpiry: newTokens.expiresAt,
      scope: newTokens.scope,
    };

    res.json({
      success: true,
      expiresAt: newTokens.expiresAt,
    });
  } catch (error: any) {
    console.error('[Airtable Auth] Manual refresh failed:', error);
    res.status(500).json({ error: 'Token refresh failed', message: error.message });
  }
});

export default router;
