/**
 * AirtableService - handles Airtable API interactions from frontend
 */

export class AirtableService {
  constructor() {
    this._baseUrl = '/api/airtable';
    this._authUrl = '/auth/airtable';
  }

  /**
   * Check Airtable authentication status
   * @returns {Promise<{authenticated: boolean, scope?: string}>}
   */
  async getAuthStatus() {
    try {
      const response = await fetch(`${this._authUrl}/status`);
      if (!response.ok) {
        return { authenticated: false };
      }
      return response.json();
    } catch (error) {
      console.error('[AirtableService] Auth status check failed:', error);
      return { authenticated: false };
    }
  }

  /**
   * Redirect to Airtable OAuth login
   */
  login() {
    // Store current location for return after OAuth
    const returnTo = window.location.pathname + window.location.hash;
    window.location.href = `${this._authUrl}/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  /**
   * Logout from Airtable (clears Airtable tokens only)
   */
  async logout() {
    const response = await fetch(`${this._authUrl}/logout`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get list of accessible Airtable bases
   * @returns {Promise<{bases: Array<{id: string, name: string, permissionLevel: string}>}>}
   */
  async getBases() {
    const response = await fetch(`${this._baseUrl}/bases`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get bases: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get tables in a base
   * @param {string} baseId - Airtable base ID
   * @returns {Promise<{tables: Array<{id: string, name: string}>}>}
   */
  async getTables(baseId) {
    const response = await fetch(`${this._baseUrl}/bases/${encodeURIComponent(baseId)}/tables`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get tables: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get table schema (fields)
   * @param {string} baseId - Airtable base ID
   * @param {string} tableId - Airtable table ID
   * @returns {Promise<{fields: Array<{id: string, name: string, type: string}>}>}
   */
  async getTableSchema(baseId, tableId) {
    const response = await fetch(
      `${this._baseUrl}/bases/${encodeURIComponent(baseId)}/tables/${encodeURIComponent(tableId)}/schema`
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get schema: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Upload thumbnails from ZIP file
   * @param {File} zipFile - The ZIP file containing thumbnails
   * @param {Object} config - Upload configuration
   * @returns {Promise<Object>} Upload results
   */
  async uploadThumbnails(zipFile, config) {
    const formData = new FormData();
    formData.append('file', zipFile);
    formData.append('baseId', config.baseId);
    formData.append('tableId', config.tableId);
    formData.append('partNumberField', config.partNumberField);
    formData.append('thumbnailField', config.thumbnailField);
    formData.append('dryRun', String(config.dryRun));

    const response = await fetch(`${this._baseUrl}/upload-thumbnails`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Start streaming upload with progress events
   * @param {File} zipFile - The ZIP file
   * @param {Object} config - Upload configuration
   * @param {function} onProgress - Progress callback
   * @returns {function} Cleanup function
   */
  startStreamingUpload(zipFile, config, onProgress) {
    // For now, use regular upload - SSE streaming can be added later
    // This is a placeholder for the streaming implementation
    console.log('[AirtableService] Streaming upload not yet implemented, using regular upload');
    return () => {}; // cleanup function
  }
}

// Export singleton instance for convenience
export const airtableService = new AirtableService();
