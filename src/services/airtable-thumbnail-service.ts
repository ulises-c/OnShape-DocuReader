/**
 * Airtable Thumbnail Upload Service
 * 
 * Handles processing ZIP files containing thumbnails and uploading them
 * to matching Airtable records based on part number.
 */

import JSZip from 'jszip';
import { AirtableApiClient } from './airtable-api-client.ts';
import type { AirtableRecord } from './airtable-api-client.ts';
import { airtableConfig } from '../config/airtable.ts';

export interface ParsedFilename {
  bomItem: string;
  partNumber: string;
  itemName: string;
  fullMatch: string;
}

export interface ThumbnailUploadResult {
  partNumber: string;
  filename: string;
  status: 'uploaded' | 'skipped' | 'error' | 'no_match';
  recordId?: string;
  error?: string;
}

export interface UploadProgress {
  total: number;
  processed: number;
  uploaded: number;
  skipped: number;
  errors: number;
  noMatch: number;
  currentFile?: string;
  phase: 'extracting' | 'processing' | 'complete';
}

export interface ThumbnailServiceConfig {
  baseId: string;
  tableId: string;
  partNumberField: string;
  thumbnailField: string;
}

export class AirtableThumbnailService {
  private apiClient: AirtableApiClient;
  private config: ThumbnailServiceConfig;
  private thumbnailFieldId: string | null = null;

  constructor(apiClient: AirtableApiClient, config?: Partial<ThumbnailServiceConfig>) {
    this.apiClient = apiClient;
    this.config = {
      baseId: config?.baseId || airtableConfig.baseId,
      tableId: config?.tableId || airtableConfig.tableId,
      partNumberField: config?.partNumberField || airtableConfig.partNumberField,
      thumbnailField: config?.thumbnailField || airtableConfig.thumbnailField,
    };
  }

  /**
   * Parse filename to extract part number
   * Expected format: {bom#}_{part#}_{name}.png
   * Example: "001_ABC-123_Widget.png" -> { bomItem: "001", partNumber: "ABC-123", itemName: "Widget" }
   */
  parseFilename(filename: string): ParsedFilename | null {
    // Remove path if present
    const basename = filename.split('/').pop() || filename;
    
    // Match pattern: {bom#}_{part#}_{name}.{ext}
    // bom# can be numbers, part# can be alphanumeric with dashes, name is everything until extension
    const match = basename.match(/^(\d+)_([A-Za-z0-9\-]+)_(.+)\.(png|jpg|jpeg|gif|webp)$/i);
    
    if (!match) {
      return null;
    }

    return {
      bomItem: match[1],
      partNumber: match[2],
      itemName: match[3],
      fullMatch: match[0],
    };
  }

  /**
   * Find Airtable record by part number
   */
  async findRecordByPartNumber(partNumber: string): Promise<AirtableRecord | null> {
    return this.apiClient.findRecordByPartNumber(
      this.config.baseId,
      this.config.tableId,
      partNumber,
      this.config.partNumberField
    );
  }

  /**
   * Get the field ID for the thumbnail field (cached)
   * @throws Error if field ID cannot be found
   */
  private async getThumbnailFieldId(): Promise<string> {
    if (this.thumbnailFieldId) {
      return this.thumbnailFieldId;
    }

    const fieldId = await this.apiClient.getFieldId(
      this.config.baseId,
      this.config.tableId,
      this.config.thumbnailField
    );

    if (!fieldId) {
      throw new Error(`Thumbnail field "${this.config.thumbnailField}" not found in table schema`);
    }

    this.thumbnailFieldId = fieldId;
    return this.thumbnailFieldId;
  }

  /**
   * Upload a single thumbnail to a record
   */
  async uploadThumbnail(
    recordId: string,
    imageBuffer: Buffer,
    filename: string
  ): Promise<void> {
    const fieldId = await this.getThumbnailFieldId();
    
    // Determine content type from filename
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    }[ext || 'png'] || 'image/png';

    await this.apiClient.uploadAttachment(
      this.config.baseId,
      recordId,
      fieldId,
      imageBuffer,
      filename,
      contentType
    );
  }

  /**
   * Process ZIP file and upload thumbnails to matching Airtable records
   * 
   * @param zipBuffer - ZIP file content as Buffer
   * @param onProgress - Optional callback for progress updates
   * @param dryRun - If true, only reports matches without uploading
   */
  async processZipFile(
    zipBuffer: Buffer,
    onProgress?: (progress: UploadProgress) => void,
    dryRun: boolean = false
  ): Promise<ThumbnailUploadResult[]> {
    const results: ThumbnailUploadResult[] = [];
    const progress: UploadProgress = {
      total: 0,
      processed: 0,
      uploaded: 0,
      skipped: 0,
      errors: 0,
      noMatch: 0,
      phase: 'extracting',
    };

    // Load ZIP file
    const zip = await JSZip.loadAsync(zipBuffer);

    // Find thumbnail files (look in root and thumbnails/ folder)
    const thumbnailFiles: { name: string; file: JSZip.JSZipObject }[] = [];
    
    zip.forEach((relativePath, file) => {
      // Skip directories
      if (file.dir) return;
      
      // Check if it's an image file
      const ext = relativePath.split('.').pop()?.toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return;
      
      // Include files from root or thumbnails/ folder
      const isInThumbnailsFolder = relativePath.startsWith('thumbnails/');
      const isInRoot = !relativePath.includes('/');
      
      if (isInRoot || isInThumbnailsFolder) {
        thumbnailFiles.push({ name: relativePath, file });
      }
    });

    progress.total = thumbnailFiles.length;
    progress.phase = 'processing';
    onProgress?.(progress);

    console.log(`[AirtableThumbnail] Found ${thumbnailFiles.length} thumbnail files in ZIP`);

    // Airtable rate limit: 5 requests/second per base
    const RATE_LIMIT_DELAY = 250; // 250ms between requests = 4/second (safe margin)

    // Process each thumbnail
    for (const { name, file } of thumbnailFiles) {
      progress.currentFile = name;
      onProgress?.(progress);

      // Parse filename to get part number
      const parsed = this.parseFilename(name);
      
      if (!parsed) {
        console.log(`[AirtableThumbnail] Skipping "${name}" - filename doesn't match expected pattern`);
        results.push({
          partNumber: '',
          filename: name,
          status: 'skipped',
          error: 'Filename does not match expected pattern: {bom#}_{part#}_{name}.{ext}',
        });
        progress.processed++;
        progress.skipped++;
        onProgress?.(progress);
        continue;
      }

      try {
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

        // Find matching record
        const record = await this.findRecordByPartNumber(parsed.partNumber);

        if (!record) {
          console.log(`[AirtableThumbnail] No record found for part number: ${parsed.partNumber}`);
          results.push({
            partNumber: parsed.partNumber,
            filename: name,
            status: 'no_match',
            error: `No Airtable record found with part number "${parsed.partNumber}"`,
          });
          progress.processed++;
          progress.noMatch++;
          onProgress?.(progress);
          continue;
        }

        if (dryRun) {
          // Dry run - just report the match
          console.log(`[AirtableThumbnail] [DRY RUN] Would upload "${name}" to record ${record.id}`);
          results.push({
            partNumber: parsed.partNumber,
            filename: name,
            status: 'skipped',
            recordId: record.id,
          });
          progress.processed++;
          progress.skipped++;
        } else {
          // Extract file content and upload
          const imageBuffer = await file.async('nodebuffer');
          
          // Another rate limit delay before upload
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
          
          await this.uploadThumbnail(record.id, imageBuffer, parsed.fullMatch);
          
          console.log(`[AirtableThumbnail] Uploaded "${name}" to record ${record.id}`);
          results.push({
            partNumber: parsed.partNumber,
            filename: name,
            status: 'uploaded',
            recordId: record.id,
          });
          progress.processed++;
          progress.uploaded++;
        }
        
        onProgress?.(progress);

      } catch (error: any) {
        console.error(`[AirtableThumbnail] Error processing "${name}":`, error.message);
        results.push({
          partNumber: parsed.partNumber,
          filename: name,
          status: 'error',
          error: error.message,
        });
        progress.processed++;
        progress.errors++;
        onProgress?.(progress);
      }
    }

    progress.phase = 'complete';
    progress.currentFile = undefined;
    onProgress?.(progress);

    return results;
  }
}
