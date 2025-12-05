/**
 * Full Assembly Exporter
 *
 * Exports a complete assembly package including:
 * - Flattened BOM as JSON
 * - Flattened BOM as CSV
 * - Thumbnails for each BOM item
 * - All packaged in a ZIP file
 *
 * @module utils/fullAssemblyExporter
 */

import { bomToCSV } from "./bomToCSV.js";
import JSZip from "jszip";

// ============================================================================
// Constants
// ============================================================================

const MAX_FILENAME_LENGTH = 100;
const THUMBNAIL_SIZE = "300x300";
const CONCURRENT_THUMBNAIL_LIMIT = 3;
const DEFAULT_THUMBNAIL_DELAY_MS = 100; // Rate limiting delay between thumbnail fetches
const THUMBNAIL_RETRY_COUNT = 2;
const THUMBNAIL_RETRY_DELAY_MS = 500;

// Characters not allowed in filenames (Windows + Unix)
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

// ============================================================================
// Export Phase Constants
// ============================================================================

/**
 * Export progress phases
 */
export const ExportPhase = {
  INITIALIZING: "initializing",
  FETCHING_BOM: "fetching_bom",
  CONVERTING_CSV: "converting_csv",
  FETCHING_THUMBNAILS: "fetching_thumbnails",
  BUILDING_ZIP: "building_zip",
  COMPLETE: "complete",
  ERROR: "error",
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Delay execution for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Filename Utilities
// ============================================================================

/**
 * Sanitize a string for use in filenames.
 * Replaces invalid characters with underscores and truncates if needed.
 *
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length (default: MAX_FILENAME_LENGTH)
 * @returns {string} Sanitized filename-safe string
 */
export function sanitizeForFilename(str, maxLength = MAX_FILENAME_LENGTH) {
  if (!str || typeof str !== "string") return "unknown";

  return (
    str
      .replace(INVALID_FILENAME_CHARS, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, maxLength) || "unknown"
  );
}

/**
 * Build a thumbnail filename from BOM row data.
 * Format: {itemNumber}_{partNumber}_{name}.png
 *
 * @param {Object} rowData - Parsed BOM row data
 * @param {string|number} rowData.itemNumber - Item number from BOM
 * @param {string} rowData.partNumber - Part number (or null if unknown)
 * @param {string} rowData.name - Part/assembly name
 * @param {string} rowData.type - 'assembly' or 'part'
 * @returns {string} Sanitized filename with .png extension
 */
export function buildThumbnailFilename(rowData) {
  const { itemNumber, partNumber, name, type } = rowData;

  // Item number - pad with zeros for sorting (e.g., "001", "002")
  const itemStr = String(itemNumber).padStart(3, "0");

  // Part number - use ASM-UNK or PRT-UNK if unknown
  let partStr;
  if (partNumber && partNumber.trim()) {
    partStr = sanitizeForFilename(partNumber, 30);
  } else {
    partStr = type === "assembly" ? "ASM-UNK" : "PRT-UNK";
  }

  // Name - sanitize and truncate
  const nameStr = sanitizeForFilename(name, 50);

  return `${itemStr}_${partStr}_${nameStr}.png`;
}

// ============================================================================
// BOM Parsing Utilities
// ============================================================================

/**
 * Extract header ID to name mapping from BOM headers.
 *
 * @param {Array} headers - BOM headers array
 * @returns {Map<string, string>} Map of header ID to header name (lowercase)
 */
function buildHeaderMap(headers) {
  const map = new Map();
  if (!Array.isArray(headers)) return map;

  for (const header of headers) {
    if (header.id && header.name) {
      map.set(header.id, header.name.toLowerCase());
    }
  }
  return map;
}

/**
 * Find a value in a BOM row by header name (case-insensitive).
 *
 * @param {Object} row - BOM row object
 * @param {Map} headerMap - Header ID to name mapping
 * @param {string[]} possibleNames - Possible header names to search for
 * @returns {string|null} Found value or null
 */
function findRowValue(row, headerMap, possibleNames) {
  if (!row?.headerIdToValue) return null;

  for (const [headerId, headerName] of headerMap) {
    if (possibleNames.some((name) => headerName.includes(name.toLowerCase()))) {
      const value = row.headerIdToValue[headerId];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }
  }
  return null;
}

/**
 * Parse a BOM row to extract thumbnail-relevant data.
 * Matches the Python script approach: uses thumbnailInfo from BOM response when available.
 *
 * @param {Object} row - BOM row from OnShape API
 * @param {Map} headerMap - Header ID to name mapping
 * @param {number} index - Row index (0-based)
 * @returns {Object} Parsed row data with thumbnail info
 */
export function parseBomRow(row, headerMap, index) {
  // Item number: use 'item' header, or fallback to index+1
  const itemNumber = findRowValue(row, headerMap, ["item"]) || index + 1;

  // Part number: look for 'part number', 'partnumber'
  const partNumber =
    findRowValue(row, headerMap, ["part number", "partnumber"]) || null;

  // Name: look for 'name', 'description', 'part name'
  const name =
    findRowValue(row, headerMap, ["name", "description", "part name"]) ||
    "Unnamed";

  // Determine type from BOM data
  const typeValue = findRowValue(row, headerMap, ["type", "element type"]);
  const isAssembly =
    typeValue?.toLowerCase().includes("assembly") ||
    name.toLowerCase().includes("asm") ||
    row.itemSource?.elementType === "ASSEMBLY";

  // PRIMARY: Extract thumbnailInfo from itemSource (matches Python script approach)
  // The BOM API returns thumbnailInfo when thumbnail=true is passed
  let thumbnailInfo = null;
  let directThumbnailUrl = null;
  
  // Check for pre-generated thumbnail URL in itemSource.thumbnailInfo (Python script method)
  if (row.itemSource?.thumbnailInfo?.sizes) {
    const sizes = row.itemSource.thumbnailInfo.sizes;
    // Find 300x300 size preference
    const preferred = sizes.find(s => s.size === '300x300');
    if (preferred?.href) {
      directThumbnailUrl = preferred.href;
    } else if (sizes.length > 0 && sizes[0].href) {
      // Fallback to first available size
      directThumbnailUrl = sizes[0].href;
    }
  }
  
  // FALLBACK: Construct URL from itemSource IDs
  if (!directThumbnailUrl && row.itemSource) {
    const src = row.itemSource;
    if (src.documentId && src.wvmId && src.elementId) {
      thumbnailInfo = {
        documentId: src.documentId,
        workspaceId: src.wvmId, // wvmId is the workspace ID in BOM response
        elementId: src.elementId,
        partId: src.partId || null,
      };
    }
  }
  
  // SECONDARY FALLBACK: relatedOccurrences for older BOM formats
  if (!directThumbnailUrl && !thumbnailInfo && row.relatedOccurrences?.length > 0) {
    const occ = row.relatedOccurrences[0];
    if (typeof occ === 'object' && occ.documentId) {
      thumbnailInfo = {
        documentId: occ.documentId,
        workspaceId: occ.workspaceId,
        elementId: occ.elementId,
        partId: occ.partId || null,
      };
    }
  }

  return {
    itemNumber,
    partNumber,
    name,
    type: isAssembly ? "assembly" : "part",
    thumbnailInfo,
    directThumbnailUrl, // Pre-generated URL from OnShape (preferred)
    originalRow: row,
  };
}

// ============================================================================
// Thumbnail Fetching
// ============================================================================

/**
 * Build the OnShape thumbnail URL for a part/element.
 * This is the fallback method when directThumbnailUrl is not available.
 *
 * @param {Object} info - Thumbnail info from parsed BOM row
 * @param {string} size - Thumbnail size (default: '300x300')
 * @returns {string|null} OnShape thumbnail URL or null
 */
export function buildThumbnailUrl(info, size = THUMBNAIL_SIZE) {
  if (!info?.documentId || !info?.workspaceId || !info?.elementId) {
    return null;
  }

  const baseUrl = "https://cad.onshape.com/api/thumbnails";
  let url = `${baseUrl}/d/${info.documentId}/w/${info.workspaceId}/e/${info.elementId}/s/${size}`;

  // Add partId if available for part-specific thumbnail
  if (info.partId) {
    url += `?partId=${encodeURIComponent(info.partId)}`;
  }

  // Add cache-busting timestamp
  const separator = info.partId ? "&" : "?";
  url += `${separator}t=${Date.now()}`;

  return url;
}

/**
 * Fetch a thumbnail via the proxy endpoint with retry logic.
 * Tries multiple URL strategies if the primary fails.
 *
 * @param {string} primaryUrl - Primary OnShape thumbnail URL
 * @param {string|null} fallbackUrl - Fallback URL to try if primary fails
 * @param {number} retries - Number of retries on failure (default: 2)
 * @param {number} retryDelayMs - Delay between retries (default: 500)
 * @returns {Promise<Blob|null>} Thumbnail blob or null on failure
 */
async function fetchThumbnailBlob(primaryUrl, fallbackUrl = null, retries = THUMBNAIL_RETRY_COUNT, retryDelayMs = THUMBNAIL_RETRY_DELAY_MS) {
  if (!primaryUrl && !fallbackUrl) return null;

  const urlsToTry = [primaryUrl, fallbackUrl].filter(Boolean);
  
  for (const thumbnailUrl of urlsToTry) {
    const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(thumbnailUrl)}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          const blob = await response.blob();
          // Verify we got actual image data
          if (blob.size > 0 && blob.type.startsWith('image/')) {
            return blob;
          }
          console.warn(`[FullExtract] Empty or invalid image response for: ${thumbnailUrl}`);
          break; // Try next URL
        }
        
        // Handle rate limiting (429) or server errors (5xx) with retry
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            console.warn(
              `[FullExtract] Thumbnail fetch retry ${attempt + 1}/${retries} (${response.status})`
            );
            await delay(retryDelayMs * (attempt + 1)); // Exponential backoff
            continue;
          }
        }
        
        // 404 means thumbnail doesn't exist for this URL, try next
        if (response.status === 404) {
          console.warn(`[FullExtract] Thumbnail not found (404), trying next method`);
          break; // Try fallback URL
        }
        
        console.warn(
          `[FullExtract] Thumbnail fetch failed (${response.status})`
        );
        break; // Try next URL
      } catch (err) {
        if (attempt < retries) {
          console.warn(`[FullExtract] Thumbnail fetch error, retrying: ${err.message}`);
          await delay(retryDelayMs * (attempt + 1));
          continue;
        }
        console.warn(`[FullExtract] Thumbnail fetch error: ${err.message}`);
        break; // Try next URL
      }
    }
  }
  
  return null;
}

/**
 * Fetch thumbnails with concurrency limit and rate limiting.
 *
 * @param {Array} items - Array of {primaryUrl, fallbackUrl, filename} objects
 * @param {number} concurrency - Max concurrent fetches
 * @param {Function} onProgress - Progress callback (current, total, item)
 * @param {number} delayMs - Delay between fetches in ms (rate limiting)
 * @returns {Promise<Array>} Array of {filename, blob} results
 */
async function fetchThumbnailsWithLimit(items, concurrency, onProgress, delayMs = DEFAULT_THUMBNAIL_DELAY_MS) {
  const results = [];
  const queue = [...items];
  let completed = 0;
  let activeWorkers = 0;
  const maxWorkers = Math.min(concurrency, items.length);

  // Create a promise that resolves when all workers complete
  return new Promise((resolve) => {
    async function worker() {
      activeWorkers++;
      
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        // Rate limiting delay before each fetch
        if (delayMs > 0) {
          await delay(delayMs);
        }

        const blob = await fetchThumbnailBlob(item.primaryUrl, item.fallbackUrl);
        completed++;

        if (onProgress) {
          onProgress(completed, items.length, item);
        }

        if (blob) {
          results.push({ filename: item.filename, blob });
        }
      }
      
      activeWorkers--;
      
      // Check if all workers are done
      if (activeWorkers === 0) {
        resolve(results);
      }
    }

    // Start workers
    for (let i = 0; i < maxWorkers; i++) {
      worker();
    }
    
    // Handle empty items array
    if (items.length === 0) {
      resolve(results);
    }
  });
}

// ============================================================================
// JSZip Loading
// ============================================================================

/**
 * Load JSZip library via npm import.
 *
 * @returns {Promise<JSZip>} JSZip constructor
 */
async function loadJSZip() {
  // JSZip is bundled via npm and imported at the top of this file.
  // Kept async so existing call sites (await loadJSZip()) don't need to change.
  return JSZip;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Perform full assembly extraction.
 *
 * @param {Object} options - Export options
 * @param {Object} options.element - Assembly element object
 * @param {string} options.documentId - OnShape document ID
 * @param {string} options.workspaceId - OnShape workspace ID
 * @param {Object} options.documentService - DocumentService instance
 * @param {Function} options.onProgress - Progress callback
 * @param {number} options.thumbnailDelayMs - Delay between thumbnail fetches (default: 100)
 * @returns {Promise<void>}
 */
export async function fullAssemblyExtract(options) {
  const { 
    element, 
    documentId, 
    workspaceId, 
    documentService, 
    onProgress,
    thumbnailDelayMs = DEFAULT_THUMBNAIL_DELAY_MS
  } = options;

  const assemblyName = sanitizeForFilename(element.name || element.id, 50);
  const startTime = Date.now();

  // Progress helper
  const reportProgress = (phase, data = {}) => {
    if (onProgress) {
      onProgress({
        phase,
        assemblyName,
        timestamp: new Date().toISOString(),
        elapsedMs: Date.now() - startTime,
        ...data,
      });
    }
  };

  try {
    // Phase: Initialize
    reportProgress(ExportPhase.INITIALIZING);
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Phase: Fetch BOM
    // Request flattened BOM with thumbnail info (matches Python script approach)
    reportProgress(ExportPhase.FETCHING_BOM);
    console.log(`[FullExtract] Fetching flattened BOM with thumbnails for ${assemblyName}...`);
    
    const bom = await documentService.getBillOfMaterials(
      documentId,
      workspaceId,
      element.id,
      false, // NOT indented = flattened BOM
      true   // include thumbnails
    );

    if (!bom || !Array.isArray(bom.rows)) {
      throw new Error("No BOM data available for this assembly");
    }

    console.log(`[FullExtract] BOM fetched: ${bom.rows.length} rows, ${bom.headers?.length || 0} headers`);
    console.log(`[FullExtract] BOM type: ${bom.type || 'unknown'}`);

    // Phase: Convert to CSV
    reportProgress(ExportPhase.CONVERTING_CSV, { bomRows: bom.rows.length });
    const csvContent = bomToCSV(bom);

    if (!csvContent) {
      console.warn(
        "[FullExtract] CSV conversion returned empty, continuing with JSON only"
      );
    }

    // Add BOM files to ZIP
    zip.file(`${assemblyName}-BOM.json`, JSON.stringify(bom, null, 2));
    if (csvContent) {
      zip.file(`${assemblyName}-BOM.csv`, csvContent);
    }

    // Phase: Parse BOM and prepare thumbnail fetches
    const headerMap = buildHeaderMap(bom.headers);
    const thumbnailsFolder = zip.folder("thumbnails");

    const thumbnailItems = [];
    let skippedNoInfo = 0;
    
    for (let i = 0; i < bom.rows.length; i++) {
      const row = bom.rows[i];
      const parsed = parseBomRow(row, headerMap, i);
      const filename = buildThumbnailFilename(parsed);
      
      // Prefer direct URL from thumbnailInfo, fallback to constructed URL
      const primaryUrl = parsed.directThumbnailUrl;
      const fallbackUrl = buildThumbnailUrl(parsed.thumbnailInfo);

      if (primaryUrl || fallbackUrl) {
        thumbnailItems.push({ 
          primaryUrl, 
          fallbackUrl,
          filename, 
          parsed 
        });
      } else {
        skippedNoInfo++;
        console.log(`[FullExtract] Row ${i + 1}: No thumbnail info for "${parsed.name}"`);
      }
    }

    console.log(
      `[FullExtract] Prepared ${thumbnailItems.length} thumbnail requests (${skippedNoInfo} skipped - no info)`
    );
    console.log(
      `[FullExtract] Using ${CONCURRENT_THUMBNAIL_LIMIT} concurrent workers with ${thumbnailDelayMs}ms delay`
    );

    // Phase: Fetch thumbnails with rate limiting
    reportProgress(ExportPhase.FETCHING_THUMBNAILS, {
      totalThumbnails: thumbnailItems.length,
      currentThumbnail: 0,
    });

    const thumbnailResults = await fetchThumbnailsWithLimit(
      thumbnailItems,
      CONCURRENT_THUMBNAIL_LIMIT,
      (current, total, item) => {
        reportProgress(ExportPhase.FETCHING_THUMBNAILS, {
          totalThumbnails: total,
          currentThumbnail: current,
          currentItem: item.filename,
        });
      },
      thumbnailDelayMs // Pass rate limiting delay
    );

    console.log(
      `[FullExtract] Fetched ${thumbnailResults.length}/${thumbnailItems.length} thumbnails`
    );

    // Add thumbnails to ZIP
    for (const { filename, blob } of thumbnailResults) {
      thumbnailsFolder.file(filename, blob);
    }

    // Phase: Build ZIP
    reportProgress(ExportPhase.BUILDING_ZIP);
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Trigger download
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const zipFilename = `${assemblyName}_FullExtract_${timestamp}.zip`;

    downloadBlob(zipBlob, zipFilename);

    // Phase: Complete
    reportProgress(ExportPhase.COMPLETE, {
      bomRows: bom.rows.length,
      thumbnailsDownloaded: thumbnailResults.length,
      thumbnailsFailed: thumbnailItems.length - thumbnailResults.length,
      thumbnailsSkipped: skippedNoInfo,
      zipSizeBytes: zipBlob.size,
    });

    console.log(
      `[FullExtract] Complete: ${zipFilename} (${(zipBlob.size / 1024).toFixed(
        1
      )} KB)`
    );
  } catch (error) {
    console.error("[FullExtract] Error:", error);
    reportProgress(ExportPhase.ERROR, { error: error.message });
    throw error;
  }
}

/**
 * Trigger browser download of a blob.
 *
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
