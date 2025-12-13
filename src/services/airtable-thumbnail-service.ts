/**
 * Airtable Thumbnail Upload Service
 * 
 * Handles processing ZIP files containing thumbnails and uploading them
 * to matching Airtable records based on part number.
 * Uses parallel processing with controlled concurrency for better performance.
 * Implements rate limiting to avoid Airtable's 5 req/sec limit.
 */

import JSZip from 'jszip';
import pLimit from 'p-limit';
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
  phase: 'extracting' | 'matching' | 'uploading' | 'complete';
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
   * Process ZIP file and upload thumbnails to matching Airtable records.
   * Uses parallel processing for matching phase with rate limiting delays.
   * Sequential uploads to respect Airtable's content API rate limits.
   * 
   * @param zipBuffer - ZIP file content as Buffer
   * @param onProgress - Optional callback for progress updates
   * @param dryRun - If true, only reports matches without uploading
   * @param workerCount - Number of parallel workers for matching (default: 4)
   */
  async processZipFile(
    zipBuffer: Buffer,
    onProgress?: (progress: UploadProgress) => void,
    dryRun: boolean = false,
    workerCount: number = 8
  ): Promise<ThumbnailUploadResult[]> {
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
    console.log(`[AirtableThumbnail] Found ${thumbnailFiles.length} thumbnail files in ZIP`);

    // Parse all filenames first (synchronous, fast)
    const parsedFiles: Array<{
      name: string;
      file: JSZip.JSZipObject;
      parsed: ParsedFilename | null;
    }> = thumbnailFiles.map(({ name, file }) => ({
      name,
      file,
      parsed: this.parseFilename(name),
    }));

    // Separate files with valid filenames from invalid ones
    const validFiles = parsedFiles.filter(f => f.parsed !== null);
    const invalidFiles = parsedFiles.filter(f => f.parsed === null);

    // Handle invalid filenames immediately (no API call needed)
    const results: ThumbnailUploadResult[] = invalidFiles.map(({ name }) => {
      progress.processed++;
      progress.skipped++;
      return {
        partNumber: '',
        filename: name,
        status: 'skipped' as const,
        error: 'Filename does not match expected pattern: {bom#}_{part#}_{name}.{ext}',
      };
    });

    if (invalidFiles.length > 0) {
      console.log(`[AirtableThumbnail] Skipped ${invalidFiles.length} files with invalid filename patterns`);
      onProgress?.(progress);
    }

    // Phase 1: Parallel matching - find Airtable records for each part number
    // Use limited concurrency with rate limiting delays to avoid 429 errors
    progress.phase = 'matching';
    onProgress?.(progress);
    
    // Airtable rate limit: 5 requests/second per base
    // Use conservative concurrency with delays to stay well under limit
    const matchLimit = pLimit(Math.min(workerCount, 2)); // Max 2 concurrent matches
    const MATCH_DELAY = 250; // 250ms delay between match requests (allows ~4 req/sec)

    console.log(`[AirtableThumbnail] Starting parallel matching with ${Math.min(workerCount, 2)} workers, ${MATCH_DELAY}ms delay`);

    // Track matched files with their records for upload phase
    const matchedFiles: Array<{
      name: string;
      file: JSZip.JSZipObject;
      parsed: ParsedFilename;
      record: AirtableRecord | null;
    }> = [];

    // Use atomic counter for progress tracking
    let matchedCount = 0;

    // Process matching with controlled concurrency and delays
    await Promise.all(
      validFiles.map(({ name, file, parsed }, index) =>
        matchLimit(async () => {
          progress.currentFile = name;
          onProgress?.(progress);

          // Stagger requests with delay (based on execution order, not array index)
          await new Promise(resolve => setTimeout(resolve, MATCH_DELAY));

          try {
            const record = await this.findRecordByPartNumber(parsed!.partNumber);
            
            // Atomic increment of matched count
            matchedCount++;
            progress.processed = invalidFiles.length + matchedCount;
            
            if (!record) {
              console.log(`[AirtableThumbnail] No record found for part number: ${parsed!.partNumber}`);
              results.push({
                partNumber: parsed!.partNumber,
                filename: name,
                status: 'no_match',
                error: `No Airtable record found with part number "${parsed!.partNumber}"`,
              });
              progress.noMatch++;
            } else {
              // Store for upload phase (don't count as processed yet for upload)
              matchedFiles.push({ name, file, parsed: parsed!, record });
            }
            
            onProgress?.(progress);
          } catch (error: any) {
            // Atomic increment even on error
            matchedCount++;
            progress.processed = invalidFiles.length + matchedCount;
            
            console.error(`[AirtableThumbnail] Error matching "${name}":`, error.message);
            
            // Check for rate limit error
            const isRateLimit = error.response?.status === 429;
            results.push({
              partNumber: parsed!.partNumber,
              filename: name,
              status: 'error',
              error: isRateLimit 
                ? 'Rate limit exceeded. Try again later or reduce batch size.'
                : `Match error: ${error.message}`,
            });
            progress.errors++;
            onProgress?.(progress);
          }
        })
      )
    );

    console.log(`[AirtableThumbnail] Matching complete: ${matchedFiles.length} matches found`);

    // Phase 2: Sequential uploads (or dry run reporting)
    // Uploads are done sequentially with delays due to strict Airtable rate limits on content API
    progress.phase = 'uploading';
    // Reset processed counter for upload phase - now we track upload progress separately
    // The total should reflect total files, processed tracks how many we've handled
    onProgress?.(progress);

    const UPLOAD_DELAY = 300; // 300ms between uploads for rate limiting (content API is stricter)

    for (const { name, file, parsed, record } of matchedFiles) {
      progress.currentFile = name;
      onProgress?.(progress);

      try {
        if (dryRun) {
          // Dry run - just report the match
          console.log(`[AirtableThumbnail] [DRY RUN] Would upload "${name}" to record ${record!.id}`);
          results.push({
            partNumber: parsed.partNumber,
            filename: name,
            status: 'skipped',
            recordId: record!.id,
          });
          progress.skipped++;
        } else {
          // Extract file content and upload
          const imageBuffer = await file.async('nodebuffer');
          
          // Rate limit delay before upload
          await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY));
          
          await this.uploadThumbnail(record!.id, imageBuffer, parsed.fullMatch);
          
          console.log(`[AirtableThumbnail] Uploaded "${name}" to record ${record!.id}`);
          results.push({
            partNumber: parsed.partNumber,
            filename: name,
            status: 'uploaded',
            recordId: record!.id,
          });
          progress.uploaded++;
        }
        
        onProgress?.(progress);

      } catch (error: any) {
        console.error(`[AirtableThumbnail] Error uploading "${name}":`, error.message);
        
        // Check for rate limit error
        const isRateLimit = error.response?.status === 429;
        results.push({
          partNumber: parsed.partNumber,
          filename: name,
          status: 'error',
          error: isRateLimit 
            ? 'Rate limit exceeded during upload. Try again later.'
            : error.message,
        });
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
