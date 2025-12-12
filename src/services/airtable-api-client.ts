/**
 * Airtable API Client
 * Provides methods for interacting with Airtable's REST API.
 * Handles record operations, schema retrieval, and attachment uploads.
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface TableField {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, unknown>;
}

export interface TableSchema {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: TableField[];
  views: Array<{ id: string; name: string; type: string }>;
}

export interface AttachmentResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableBasesResponse {
  bases: AirtableBase[];
  offset?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Airtable API Client
// ─────────────────────────────────────────────────────────────────────────────

export class AirtableApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    
    this.axiosInstance = axios.create({
      baseURL: 'https://api.airtable.com/v0',
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`[Airtable API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[Airtable API] Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Base Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List all bases accessible by the authenticated user.
   */
  async listBases(): Promise<AirtableBasesResponse> {
    const response = await this.axiosInstance.get('/meta/bases');
    return response.data;
  }

  /**
   * List all tables in a base.
   */
  async listTables(baseId: string): Promise<{ tables: TableSchema[] }> {
    const response = await this.axiosInstance.get(`/meta/bases/${baseId}/tables`);
    return response.data;
  }

  /**
   * Alias for listTables - get all tables in a base.
   */
  async getTables(baseId: string): Promise<{ tables: TableSchema[] }> {
    return this.listTables(baseId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Record Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List records from a table with optional filtering.
   * @param baseId - Airtable base ID
   * @param tableId - Table ID or name
   * @param options - Query options
   */
  async listRecords(
    baseId: string,
    tableId: string,
    options?: {
      filterByFormula?: string;
      fields?: string[];
      maxRecords?: number;
      pageSize?: number;
      offset?: string;
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    }
  ): Promise<AirtableListResponse> {
    const params: Record<string, string | number | string[]> = {};
    
    if (options?.filterByFormula) {
      params.filterByFormula = options.filterByFormula;
    }
    if (options?.fields?.length) {
      // Airtable expects fields[] query param format
      params['fields[]'] = options.fields;
    }
    if (options?.maxRecords) {
      params.maxRecords = options.maxRecords;
    }
    if (options?.pageSize) {
      params.pageSize = options.pageSize;
    }
    if (options?.offset) {
      params.offset = options.offset;
    }
    if (options?.sort?.length) {
      options.sort.forEach((s, i) => {
        params[`sort[${i}][field]`] = s.field;
        if (s.direction) {
          params[`sort[${i}][direction]`] = s.direction;
        }
      });
    }

    const response = await this.axiosInstance.get(`/${baseId}/${tableId}`, { params });
    return response.data;
  }

  /**
   * Get a single record by ID.
   */
  async getRecord(baseId: string, tableId: string, recordId: string): Promise<AirtableRecord> {
    const response = await this.axiosInstance.get(`/${baseId}/${tableId}/${recordId}`);
    return response.data;
  }

  /**
   * Update a record's fields.
   */
  async updateRecord(
    baseId: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ): Promise<AirtableRecord> {
    const response = await this.axiosInstance.patch(`/${baseId}/${tableId}/${recordId}`, {
      fields,
    });
    return response.data;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Schema Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get table schema including field IDs (needed for direct attachment upload).
   */
  async getTableSchema(baseId: string, tableId: string): Promise<TableSchema> {
    const response = await this.axiosInstance.get(`/meta/bases/${baseId}/tables`);
    const tables: TableSchema[] = response.data.tables || [];
    
    // Find the specific table by ID or name
    const table = tables.find(t => t.id === tableId || t.name === tableId);
    
    if (!table) {
      throw new Error(`Table ${tableId} not found in base ${baseId}`);
    }
    
    return table;
  }

  /**
   * Find the field ID for a given field name.
   */
  async getFieldId(baseId: string, tableId: string, fieldName: string): Promise<string | null> {
    const schema = await this.getTableSchema(baseId, tableId);
    const field = schema.fields.find(f => f.name === fieldName);
    return field?.id || null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Attachment Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Upload an attachment directly to Airtable using the content upload API.
   * This requires the field ID (not field name).
   * 
   * @param baseId - Airtable base ID
   * @param recordId - Record ID to attach to
   * @param fieldId - Field ID (not name) for the attachment field
   * @param fileBuffer - File content as Buffer
   * @param filename - Original filename
   * @param contentType - MIME type (e.g., 'image/png')
   */
  async uploadAttachment(
    baseId: string,
    recordId: string,
    fieldId: string,
    fileBuffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<AttachmentResult> {
    // Airtable direct upload endpoint
    const uploadUrl = `https://content.airtable.com/v0/${baseId}/${recordId}/${fieldId}/uploadAttachment`;
    
    const response = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return response.data;
  }

  /**
   * Alternative: Update record with URL-based attachment.
   * Use this if you have a publicly accessible URL for the image.
   * 
   * @param baseId - Airtable base ID
   * @param tableId - Table ID or name
   * @param recordId - Record ID
   * @param fieldName - Field name (not ID)
   * @param attachmentUrl - Public URL of the attachment
   * @param filename - Optional filename
   */
  async updateRecordAttachment(
    baseId: string,
    tableId: string,
    recordId: string,
    fieldName: string,
    attachmentUrl: string,
    filename?: string
  ): Promise<AirtableRecord> {
    const attachment: { url: string; filename?: string } = { url: attachmentUrl };
    if (filename) {
      attachment.filename = filename;
    }

    return this.updateRecord(baseId, tableId, recordId, {
      [fieldName]: [attachment],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Query Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Find records by a specific field value.
   * Useful for matching by part number.
   */
  async findRecordsByField(
    baseId: string,
    tableId: string,
    fieldName: string,
    value: string,
    options?: { maxRecords?: number }
  ): Promise<AirtableRecord[]> {
    // Escape single quotes in value for formula
    const escapedValue = value.replace(/'/g, "\\'");
    const filterByFormula = `{${fieldName}} = '${escapedValue}'`;
    
    const response = await this.listRecords(baseId, tableId, {
      filterByFormula,
      maxRecords: options?.maxRecords || 100,
    });

    return response.records;
  }

  /**
   * Find a single record by field value.
   * Returns null if not found.
   */
  async findRecordByField(
    baseId: string,
    tableId: string,
    fieldName: string,
    value: string
  ): Promise<AirtableRecord | null> {
    const records = await this.findRecordsByField(baseId, tableId, fieldName, value, {
      maxRecords: 1,
    });
    return records[0] || null;
  }

  /**
   * Find a record by part number.
   * Convenience method that wraps findRecordByField.
   * @param baseId - Airtable base ID
   * @param tableId - Table ID or name
   * @param partNumber - Part number to search for
   * @param partNumberField - Field name containing part numbers (default: 'Part number')
   */
  async findRecordByPartNumber(
    baseId: string,
    tableId: string,
    partNumber: string,
    partNumberField: string = 'Part number'
  ): Promise<AirtableRecord | null> {
    return this.findRecordByField(baseId, tableId, partNumberField, partNumber);
  }
}
