/**
 * AirtableService - handles Airtable API interactions from frontend
 */

export class AirtableService {
  /**
   * Check Airtable authentication status
   * @returns {Promise<{configured: boolean, authenticated: boolean, scope?: string, error?: string}>}
   */
  async getAuthStatus() {
    try {
      const response = await fetch('/auth/airtable/status');
      if (!response.ok) {
        throw new Error(`Status check failed (${response.status})`);
      }
      return response.json();
    } catch (error) {
      console.error('[AirtableService] Error checking auth status:', error);
      return { configured: false, authenticated: false, error: error.message };
    }
  }

  /**
   * Get Airtable configuration status from server
   * @returns {Promise<{configured: boolean, databaseConfigured: boolean, partNumberField: string, thumbnailField: string}>}
   */
  async getConfiguration() {
    try {
      const response = await fetch('/api/airtable/config');
      if (!response.ok) {
        throw new Error(`Config check failed (${response.status})`);
      }
      return response.json();
    } catch (error) {
      console.error('[AirtableService] Error getting configuration:', error);
      return { configured: false, databaseConfigured: false };
    }
  }

  /**
   * Initiate Airtable OAuth login
   * @param {string} returnTo - Path to return to after auth (default: upload page)
   */
  login(returnTo = '/#/airtable/upload') {
    window.location.href = `/auth/airtable/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  /**
   * Logout from Airtable (does not affect OnShape auth)
   * @returns {Promise<{success: boolean}>}
   */
  async logout() {
    try {
      const response = await fetch('/auth/airtable/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Logout failed (${response.status})`);
      }
      return response.json();
    } catch (error) {
      console.error('[AirtableService] Error logging out:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of accessible Airtable bases
   * @returns {Promise<{bases: Array}>}
   */
  async getBases() {
    const response = await fetch('/api/airtable/bases');
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get bases (${response.status})`);
    }
    return response.json();
  }

  /**
   * Get list of tables in a base
   * @param {string} baseId - Airtable base ID
   * @returns {Promise<{tables: Array}>}
   */
  async getTables(baseId) {
    const response = await fetch(`/api/airtable/bases/${baseId}/tables`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get tables (${response.status})`);
    }
    return response.json();
  }

  /**
   * Get table schema including field IDs
   * @param {string} baseId - Airtable base ID
   * @param {string} tableId - Table ID or name
   * @returns {Promise<Object>}
   */
  async getTableSchema(baseId, tableId) {
    const response = await fetch(`/api/airtable/bases/${baseId}/tables/${tableId}/schema`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Failed to get schema (${response.status})`);
    }
    return response.json();
  }

  /**
   * Upload thumbnails from ZIP file to Airtable
   * @param {File} zipFile - ZIP file containing thumbnails
   * @param {Object} config - Optional config overrides
   * @param {string} config.baseId - Override base ID
   * @param {string} config.tableId - Override table ID
   * @param {string} config.partNumberField - Override part number field name
   * @param {string} config.thumbnailField - Override thumbnail field name
   * @param {boolean} config.dryRun - If true, only preview matches
   * @param {function} onProgress - Progress callback (optional)
   * @returns {Promise<{success: boolean, summary: Object, results: Array}>}
   */
  async uploadThumbnails(zipFile, config = {}, onProgress = null) {
    // Build query parameters
    const params = new URLSearchParams();
    if (config.baseId) params.set('baseId', config.baseId);
    if (config.tableId) params.set('tableId', config.tableId);
    if (config.partNumberField) params.set('partNumberField', config.partNumberField);
    if (config.thumbnailField) params.set('thumbnailField', config.thumbnailField);
    if (config.dryRun) params.set('dryRun', 'true');

    const url = `/api/airtable/upload-thumbnails${params.toString() ? '?' + params.toString() : ''}`;

    // Read file as ArrayBuffer
    const arrayBuffer = await zipFile.arrayBuffer();

    // Upload with progress tracking via XHR for upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/zip');

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              phase: 'uploading',
              loaded: e.loaded,
              total: e.total,
              percent: Math.round((e.loaded / e.total) * 100)
            });
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || error.message || `Upload failed (${xhr.status})`));
          } catch (e) {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(arrayBuffer);
    });
  }

  /**
   * Find a record by part number (for testing)
   * @param {string} partNumber - Part number to search
   * @param {Object} config - Optional config overrides
   * @returns {Promise<{found: boolean, partNumber: string, record?: Object}>}
   */
  async findRecord(partNumber, config = {}) {
    const response = await fetch('/api/airtable/find-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partNumber,
        baseId: config.baseId,
        tableId: config.tableId,
        partNumberField: config.partNumberField
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Find record failed (${response.status})`);
    }
    return response.json();
  }
}
