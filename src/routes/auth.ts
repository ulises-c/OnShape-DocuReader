import { Router, Request, Response } from 'express';
import { OAuthService } from '../services/oauth-service.js';

const router = Router();
const oauthService = new OAuthService();

router.get('/login', (req: Request, res: Response): void => {
  const { url } = oauthService.generateAuthUrl();
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(401).send(`Auth error: ${error}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send('No authorization code provided');
    }

    if (!state || typeof state !== 'string') {
      return res.status(400).send('No state parameter provided');
    }

    const tokens = await oauthService.exchangeCodeForToken(code, state);
    
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.authenticated = true;

    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
    });

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).send('Authentication failed');
  }
});

router.get('/status', (req: Request, res: Response): Response => {
  const authenticated = !!req.session?.authenticated;
  return res.json({ authenticated });
});

router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export default router;
