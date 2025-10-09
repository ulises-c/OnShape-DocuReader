import dotenv from 'dotenv';
dotenv.config();

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseApiUrl: string;
  oauthBaseUrl: string;
  scope: string;
}

export const oauthConfig: OAuthConfig = {
  clientId: process.env.ONSHAPE_CLIENT_ID || '',
  clientSecret: process.env.ONSHAPE_CLIENT_SECRET || '',
  redirectUri: process.env.ONSHAPE_REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'http://localhost:3000/auth/callback' : 'http://localhost:5173/auth/callback'),
  baseApiUrl: process.env.ONSHAPE_API_BASE_URL || 'https://cad.onshape.com/api/v12',
  oauthBaseUrl: process.env.ONSHAPE_OAUTH_BASE_URL || 'https://oauth.onshape.com',
  scope: 'OAuth2Read OAuth2ReadPII'
};

export function validateConfig(): void {
  const required = ['ONSHAPE_CLIENT_ID', 'ONSHAPE_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
