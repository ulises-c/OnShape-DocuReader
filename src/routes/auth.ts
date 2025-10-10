import { Router } from "express";
import type { Request, Response } from "express";
import { OAuthService } from "../services/oauth-service.ts";

const router = Router();
const oauthService = OAuthService.getInstance();

router.get("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const returnTo = (req.query.returnTo as string) || "/";
    req.session.returnTo = returnTo;

    const { url } = await oauthService.generateAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error("Auth URL generation error:", error);
    res.status(500).send("Failed to generate authentication URL");
  }
});

router.get(
  "/callback",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(401).send(`Auth error: ${error}`);
      }

      if (!code || typeof code !== "string") {
        return res.status(400).send("No authorization code provided");
      }

      if (!state || typeof state !== "string") {
        return res.status(400).send("No state parameter provided");
      }

      const tokens = await oauthService.exchangeCodeForToken(code, state);

      req.session.accessToken = tokens.access_token;
      req.session.refreshToken = tokens.refresh_token;
      req.session.authenticated = true;

      // Promisified session save with extended delay
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully, ID:", req.sessionID);
            resolve();
          }
        });
      });

      // Extended delay for file system flush
      await new Promise(resolve => setTimeout(resolve, 250));

      const returnPath = req.session.returnTo || "/";
      delete req.session.returnTo;

      // In development, always redirect to Vite dev server
      // In production, redirect to the same origin
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? returnPath 
        : `http://localhost:5173${returnPath}`;

      console.log('OAuth callback redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return res.status(500).send("Authentication failed");
    }
  }
);

router.get("/status", (req: Request, res: Response): Response => {
  const authenticated = !!req.session?.authenticated;
  console.log("Auth status check:", { 
    authenticated, 
    sessionID: req.sessionID,
    hasAccessToken: !!req.session?.accessToken 
  });
  return res.json({ authenticated });
});

router.post("/logout", (req: Request, res: Response): void => {
  const sessionId = req.sessionID;
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    console.log("Session destroyed:", sessionId);
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
