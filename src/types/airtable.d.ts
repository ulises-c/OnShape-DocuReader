/**
 * Airtable Type Definitions
 * 
 * Type definitions for Airtable session data and API structures.
 */

/** Session data for Airtable OAuth tokens */
export interface AirtableSessionData {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  scope: string;
}

/** Airtable OAuth state stored in session */
export interface AirtableOAuthState {
  codeVerifier: string;
  state: string;
}
