/**
 * Airtable OAuth & API Configuration
 * 
 * Configuration for Airtable OAuth 2.0 integration and API access.
 * Requires environment variables to be set for credentials and database IDs.
 */

import dotenv from 'dotenv';
dotenv.config();

export interface AirtableConfig {
  // OAuth settings
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  
  // OAuth URLs
  authorizationUrl: string;
  tokenUrl: string;
  
  // API settings
  apiBaseUrl: string;
  contentBaseUrl: string;
  
  // Database configuration (constants for specific use case)
  baseId: string;
  tableId: string;
  partNumberField: string;
  thumbnailField: string;
}

export const airtableConfig: AirtableConfig = {
  // OAuth credentials from environment
  clientId: process.env.AIRTABLE_CLIENT_ID || '',
  clientSecret: process.env.AIRTABLE_CLIENT_SECRET || '',
  redirectUri: process.env.AIRTABLE_REDIRECT_URI || 'http://localhost:3000/auth/airtable/callback',
  
  // Required scopes for reading/writing records and schema
  scopes: ['data.records:read', 'data.records:write', 'schema.bases:read'],
  
  // Airtable OAuth URLs
  authorizationUrl: 'https://airtable.com/oauth2/v1/authorize',
  tokenUrl: 'https://airtable.com/oauth2/v1/token',
  
  // API base URLs
  apiBaseUrl: 'https://api.airtable.com/v0',
  contentBaseUrl: 'https://content.airtable.com/v0',
  
  // Database configuration from environment
  baseId: process.env.AIRTABLE_BASE_ID || '',
  tableId: process.env.AIRTABLE_TABLE_ID || '',
  partNumberField: process.env.AIRTABLE_PART_NUMBER_FIELD || 'Part number',
  thumbnailField: process.env.AIRTABLE_THUMBNAIL_FIELD || 'CAD_Thumbnail',
};

/**
 * Check if Airtable is configured
 */
export function isAirtableConfigured(): boolean {
  return !!(airtableConfig.clientId && airtableConfig.clientSecret);
}

/**
 * Check if Airtable database configuration is complete
 */
export function isAirtableDatabaseConfigured(): boolean {
  return !!(airtableConfig.baseId && airtableConfig.tableId);
}
