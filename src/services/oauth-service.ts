import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { oauthConfig } from "../config/oauth.ts";

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
}

export class OAuthService {
  private static instance: OAuthService;
  private stateStore = new Map<string, string>(); // In production, use Redis or database

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Generate OAuth authorization URL for OnShape
   */
  public async generateAuthUrl(): Promise<{ url: string; state: string }> {
    const state = uuidv4();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store the code verifier with state for later use
    this.stateStore.set(state, codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      scope: oauthConfig.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${
      oauthConfig.oauthBaseUrl
    }/oauth/authorize?${params.toString()}`;

    return { url: authUrl, state };
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<OAuthTokens> {
    const codeVerifier = this.stateStore.get(state);
    if (!codeVerifier) {
      throw new Error("Invalid or expired state parameter");
    }

    // Clean up state
    this.stateStore.delete(state);

    const tokenUrl = `${oauthConfig.oauthBaseUrl}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      redirect_uri: oauthConfig.redirectUri,
      code: code,
      code_verifier: codeVerifier,
    });

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });

      return response.data as OAuthTokens;
    } catch (error: any) {
      console.error(
        "Token exchange error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to exchange authorization code: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const tokenUrl = `${oauthConfig.oauthBaseUrl}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });

      return response.data as OAuthTokens;
    } catch (error: any) {
      console.error(
        "Token refresh error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to refresh token: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  private generateCodeVerifier(): string {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    for (let i = 0; i < 128; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    return hashBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
}
