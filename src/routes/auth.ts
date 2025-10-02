import { Router, Request, Response } from 'express';
import { OAuthService } from '../services/oauth-service.ts';

const router = Router();
const oauthService = new OAuthService();

router.get('/login', (req: Request, res: Response) => {
  const authUrl = oauthService.getAuthorizationUrl();
  res.redirect(authUrl);
});

router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    const tokens = await oauthService.exchangeCodeForTokens(code as string);
    
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.authenticated = true;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/status', (req: Request, res: Response) => {
  const authenticated = !!req.session?.authenticated;
  res.json({ authenticated });
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export default router;
