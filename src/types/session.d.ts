import 'express-session';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    accessToken?: string;
    refreshToken?: string;
    returnTo?: string;
    userId?: string;
    
    // Airtable OAuth session fields
    airtable?: {
      accessToken: string;
      refreshToken: string;
      tokenExpiry: number;
      scope: string;
    };
    airtableCodeVerifier?: string;
    airtableOauthState?: string;
    airtableReturnTo?: string;
  }
}
