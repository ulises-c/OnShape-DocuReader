/**
 * Airtable OAuth 2.0 Service
 * 
 * Handles OAuth 2.0 Authorization Code flow with PKCE for Airtable.
 * Similar pattern to OnShape OAuth service but adapted for Airtable's OAuth implementation.
 */

import axios from 'axios';
import crypto from 'crypto';
import { airtableConfig } from '../config/airtable.ts';

export interface AirtableTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface AirtableTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  expiresAt: number;
}

export class AirtableOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];
  private authorizationUrl: string;
  private tokenUrl: string;

  constructor() {
    this.clientId = airtableConfig.clientId;
    this.clientSecret = airtableConfig.clientSecret;
    this.redirectUri = airtableConfig.redirectUri;
    this.scopes = airtableConfig.scopes;
    this.authorizationUrl = airtableConfig.authorizationUrl;
    this.tokenUrl = airtableConfig.tokenUrl;
  }

  /**
   * Generate a cryptographically secure random string for state/PKCE
   */
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier(): string {
    return this.generateRandomString(64);
  }

  /**
   * Generate PKCE code challenge from verifier (S256 method)
   */
  generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }

  /**
   * Generate the Airtable OAuth authorization URL
   * @param state - Random state for CSRF protection
   * @param codeChallenge - PKCE code challenge
   */
  generateAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state,
      scope: this.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from callback
   * @param codeVerifier - PKCE code verifier used when generating auth URL
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<AirtableTokenResponse> {
    try {
      // Airtable requires Basic auth header with client credentials
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post<AirtableTokens>(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      const tokens = response.data;
      const expiresAt = Date.now() + (tokens.expires_in * 1000);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Airtable token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh an expired access token
   * @param refreshToken - The refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AirtableTokenResponse> {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post<AirtableTokens>(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      const tokens = response.data;
      const expiresAt = Date.now() + (tokens.expires_in * 1000);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Airtable token refresh error:', error.response?.data || error.message);
      throw new Error(`Failed to refresh token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Check if tokens are expired or about to expire (within 5 minutes)
   */
  isTokenExpired(expiresAt: number): boolean {
    const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
    return Date.now() >= (expiresAt - bufferMs);
  }
}

// Export singleton instance
export const airtableOAuthService = new AirtableOAuthService();
