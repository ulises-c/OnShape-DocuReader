/**
 * Full Assembly Exporter
 *
 * Exports a complete assembly package including:
 * - Flattened BOM as JSON
 * - Flattened BOM as CSV
 * - Thumbnails for each BOM item (organized by part number prefix)
 * - Thumbnail extraction report
 * - All packaged in a ZIP file
 *
 * Enhanced to match Python thumbnail_extractor.py implementation:
 * - Uses OnShape field IDs for reliable part number extraction
 * - Hybrid thumbnail URL resolution (BOM direct → metadata fallback → constructed)
 * - Folder organization: thumbnails/ for PRT/ASM, thumbnails_ignored/ for others
 * - Comprehensive thumbnail_report.json generation
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
const THUMBNAIL_RETRY_COUNT = 2; // Retries for better success rate
const THUMBNAIL_RETRY_DELAY_MS = 300; // Base delay for exponential backoff

// Characters not allowed in filenames (Windows + Unix)
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

// OnShape field IDs for reliable BOM data extraction (matches Python implementation)
const DEFAULT_FIELD_IDS = {
  partNumber: "57f3fb8efa3416c06701d60f",
  name: "57f3fb8efa3416c06701d60d",
  description: "57f3fb8efa3416c06701d610"
};

// Preferred thumbnail sizes in order of preference (matches Python)
const PREFERRED_THUMBNAIL_SIZES = ["300x300", "600x340", "300x170", "70x40"];

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
  return new Promise((resolve) => setTimeout(resolve, ms));
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
 * Determine thumbnail folder based on part number prefix.
 * PRT/ASM prefixes → thumbnails/
 * Everything else → thumbnails_ignored/
 *
 * @param {string} partNumber - Part number string
 * @returns {string} Folder name: "thumbnails" or "thumbnails_ignored"
 */
function getThumbnailFolder(partNumber) {
  const prefix = String(partNumber || "").toUpperCase().slice(0, 3);
  return (prefix === "PRT" || prefix === "ASM") 
    ? "thumbnails" 
    : "thumbnails_ignored";
}

/**
 * Build a thumbnail filename from BOM row data.
 * Format: {partNumber}_{name}.png
 *
 * @param {Object} rowData - Parsed BOM row data
 * @param {string} rowData.partNumber - Part number (or "PRT-UNK"/"ASM-UNK" if unknown)
 * @param {string} rowData.name - Part/assembly name
 * @returns {string} Sanitized filename with .png extension
 */
export function buildThumbnailFilename(rowData) {
  const { partNumber, name } = rowData;

  // Part number - sanitize
  const partStr = sanitizeForFilename(partNumber || "unknown", 30);

  // Name - sanitize and truncate
  const nameStr = sanitizeForFilename(name || "Unnamed", 50);

  return `${partStr}_${nameStr}.png`;
}

// ============================================================================
// BOM Header Map (Field ID Resolution)
// ============================================================================

/**
 * Build header map from BOM headers, validating against known OnShape defaults.
 * Uses field IDs for reliable extraction (matches Python implementation).
 *
 * @param {Array} headers - BOM headers array from OnShape API
 * @returns {Object} Map of propertyName → { id, name, validated }
 */
function buildHeaderMap(headers) {
  const map = {};
  
  if (!Array.isArray(headers)) {
    console.warn("[HeaderMap] No headers array provided, using defaults");
    // Return defaults when no headers available
    for (const [prop, defaultId] of Object.entries(DEFAULT_FIELD_IDS)) {
      map[prop] = { id: defaultId, name: prop, validated: false };
    }
    return map;
  }
  
  for (const header of headers) {
    const { propertyName, id, name } = header;
    if (!propertyName) continue;
    
    const defaultId = DEFAULT_FIELD_IDS[propertyName];
    const validated = defaultId ? (id === defaultId) : null;
    
    if (defaultId && !validated) {
      console.warn(
        `[HeaderMap] Field ID mismatch for "${propertyName}": ` +
        `expected "${defaultId}", got "${id}". Using API value.`
      );
    }
    
    map[propertyName] = { id, name, validated };
  }
  
  // Add defaults for missing critical fields
  for (const [prop, defaultId] of Object.entries(DEFAULT_FIELD_IDS)) {
    if (!map[prop]) {
      console.warn(`[HeaderMap] Missing header for "${prop}", using default ID`);
      map[prop] = { id: defaultId, name: prop, validated: false };
    }
  }
  
  return map;
}

/**
 * Extract value from BOM row using header map with field ID lookup.
 * Primary method: use field ID from headerMap.
 * Fallback: search by property name variations.
 *
 * @param {Object} row - BOM row object
 * @param {Object} headerMap - Header map from buildHeaderMap
 * @param {string} propertyName - Property to extract (e.g., "partNumber")
 * @param {string} [fallbackPropertyName] - Fallback property if primary not found
 * @returns {string|null} Extracted value or null
 */
function getRowValue(row, headerMap, propertyName, fallbackPropertyName = null) {
  const headerValues = row.headerIdToValue || {};
  
  // Try primary property via field ID
  const primary = headerMap[propertyName];
  if (primary?.id && headerValues[primary.id] !== undefined && headerValues[primary.id] !== null) {
    return String(headerValues[primary.id]);
  }
  
  // Try fallback property via field ID
  if (fallbackPropertyName) {
    const fallback = headerMap[fallbackPropertyName];
    if (fallback?.id && headerValues[fallback.id] !== undefined && headerValues[fallback.id] !== null) {
      return String(headerValues[fallback.id]);
    }
  }
  
  return null;
}

/**
 * Legacy helper: Find a value in a BOM row by header name (case-insensitive).
 * Used as additional fallback when field ID lookup fails.
 *
 * @param {Object} row - BOM row object
 * @param {Map} headerMapLegacy - Legacy header ID to name mapping
 * @param {string[]} possibleNames - Possible header names to search for
 * @returns {string|null} Found value or null
 */
function findRowValueLegacy(row, headerMapLegacy, possibleNames) {
  if (!row?.headerIdToValue) return null;

  for (const [headerId, headerName] of headerMapLegacy) {
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
 * Build legacy header map (ID → name) for fallback searches.
 *
 * @param {Array} headers - BOM headers array
 * @returns {Map<string, string>} Map of header ID to header name (lowercase)
 */
function buildLegacyHeaderMap(headers) {
  const map = new Map();
  if (!Array.isArray(headers)) return map;

  for (const header of headers) {
    if (header.id && header.name) {
      map.set(header.id, header.name.toLowerCase());
    }
  }
  return map;
}

// ============================================================================
// Thumbnail URL Resolution (Hybrid Strategy)
// ============================================================================

/**
 * Select preferred thumbnail size from available sizes.
 * Tries sizes in order: 300x300 → 600x340 → 300x170 → 70x40 → first available.
 *
 * @param {Array} sizes - Array of { size, href } objects
 * @returns {string|null} Selected href or null
 */
function selectPreferredSize(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  
  for (const pref of PREFERRED_THUMBNAIL_SIZES) {
    const match = sizes.find(s => s.size === pref);
    if (match?.href) return match.href;
  }
  
  // Fallback to first available
  return sizes[0]?.href || null;
}

/**
 * Build the OnShape thumbnail URL for a part/element (constructed fallback).
 * This is the tertiary fallback method when direct URLs are unavailable.
 * Supports both workspace (w) and version (v) references.
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
  // Use wvmType if available (w=workspace, v=version), default to workspace
  const wvmType = info.wvmType || "w";
  let url = `${baseUrl}/d/${info.documentId}/${wvmType}/${info.workspaceId}/e/${info.elementId}/s/${size}`;

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
 * Resolve thumbnail URL using hybrid multi-tier strategy.
 * Order: BOM thumbnailInfo direct → metadata API fallback → constructed URL.
 *
 * @param {Object} row - BOM row object
 * @param {Object} parsedData - Parsed row data from parseBomRow
 * @param {Object} documentService - DocumentService for metadata fallback
 * @returns {Promise<{url: string|null, source: string}>} Resolved URL and source
 */
async function resolveThumbnailUrl(row, parsedData, documentService) {
  // 1. PRIMARY: Use thumbnailInfo.sizes[].href from BOM response (requires thumbnail=true)
  const thumbnailInfo = row.itemSource?.thumbnailInfo;
  if (thumbnailInfo?.sizes?.length > 0) {
    const url = selectPreferredSize(thumbnailInfo.sizes);
    if (url) {
      return { url, source: 'bom-direct' };
    }
  }
  
  // Also check for direct href in thumbnailInfo
  if (parsedData.directThumbnailUrl) {
    return { url: parsedData.directThumbnailUrl, source: 'bom-direct' };
  }
  
  // 2. SECONDARY: Fetch metadata to discover available sizes
  const itemSource = row.itemSource;
  if (itemSource && documentService?.getThumbnailMetadata) {
    try {
      const metadata = await documentService.getThumbnailMetadata(
        itemSource.documentId,
        itemSource.wvmId || itemSource.workspaceId,
        itemSource.elementId,
        itemSource.partId
      );
      if (metadata?.sizes?.length > 0) {
        const url = selectPreferredSize(metadata.sizes);
        if (url) {
          return { url, source: 'metadata' };
        }
      }
    } catch (e) {
      // Metadata fetch failed, continue to constructed fallback
      console.warn(`[ThumbnailResolver] Metadata fallback failed: ${e.message}`);
    }
  }
  
  // 3. TERTIARY: Construct URL from itemSource IDs
  if (parsedData.thumbnailInfo) {
    const url = buildThumbnailUrl(parsedData.thumbnailInfo);
    if (url) {
      return { url, source: 'constructed' };
    }
  }
  
  return { url: null, source: null };
}

// ============================================================================
// BOM Parsing
// ============================================================================

/**
 * Parse a BOM row to extract thumbnail-relevant data.
 * Uses OnShape field IDs for reliable extraction (matches Python).
 *
 * @param {Object} row - BOM row from OnShape API
 * @param {Object} headerMap - Header map from buildHeaderMap
 * @param {Map} legacyHeaderMap - Legacy header map for fallback
 * @param {number} index - Row index (0-based)
 * @returns {Object} Parsed row data with thumbnail info
 */
export function parseBomRow(row, headerMap, legacyHeaderMap, index) {
  // Item number: use 'item' header via legacy search, or fallback to index+1
  const itemNumber = findRowValueLegacy(row, legacyHeaderMap, ["item"]) || index + 1;

  // Part number: use field ID lookup with name fallback (matches Python)
  let partNumber = getRowValue(row, headerMap, "partNumber", "name");
  
  // If still no part number, try legacy search
  if (!partNumber) {
    partNumber = findRowValueLegacy(row, legacyHeaderMap, ["part number", "partnumber"]);
  }
  
  // Name: try itemSource first, then field ID, then legacy
  let name = row.itemSource?.itemName;
  if (!name) {
    name = getRowValue(row, headerMap, "name");
  }
  if (!name) {
    name = findRowValueLegacy(row, legacyHeaderMap, ["name", "description", "part name"]);
  }
  name = name || "Unnamed";

  // Description: field ID with legacy fallback
  let description = getRowValue(row, headerMap, "description");
  if (!description) {
    description = findRowValueLegacy(row, legacyHeaderMap, ["description"]);
  }

  // Determine type from BOM data
  const typeValue = findRowValueLegacy(row, legacyHeaderMap, ["type", "element type"]);
  const isAssembly =
    typeValue?.toLowerCase().includes("assembly") ||
    name.toLowerCase().includes("asm") ||
    (partNumber && partNumber.toUpperCase().startsWith("ASM")) ||
    row.itemSource?.elementType === "ASSEMBLY";

  // Extract thumbnailInfo from itemSource for direct URL (Python approach)
  let directThumbnailUrl = null;
  if (row.itemSource?.thumbnailInfo?.sizes) {
    const sizes = row.itemSource.thumbnailInfo.sizes;
    directThumbnailUrl = selectPreferredSize(sizes);
  }

  // Build fallback thumbnailInfo for constructed URLs
  let thumbnailInfo = null;
  if (row.itemSource) {
    const src = row.itemSource;
    if (src.documentId && src.wvmId && src.elementId) {
      thumbnailInfo = {
        documentId: src.documentId,
        workspaceId: src.wvmId,
        elementId: src.elementId,
        partId: src.partId || null,
        wvmType: src.wvmType || "w",
      };
    }
  }

  // Secondary fallback: relatedOccurrences
  if (!directThumbnailUrl && !thumbnailInfo && row.relatedOccurrences?.length > 0) {
    const occ = row.relatedOccurrences[0];
    if (typeof occ === "object" && occ.documentId) {
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
    partNumber: partNumber || (isAssembly ? "ASM-UNK" : "PRT-UNK"),
    name,
    description,
    type: isAssembly ? "assembly" : "part",
    thumbnailInfo,
    directThumbnailUrl,
    originalRow: row,
  };
}

// ============================================================================
// Thumbnail Report Generation
// ============================================================================

/**
 * Thumbnail report generator class.
 * Tracks extraction results and generates comprehensive report.
 */
class ThumbnailReport {
  constructor(assemblyName, bomRowCount) {
    this.metadata = {
      generatedAt: new Date().toISOString(),
      assemblyName,
      bomRowCount
    };
    this.items = [];
    this.errors = [];
  }
  
  addSuccess(partNumber, folder, filename, source) {
    this.items.push({ 
      partNumber, 
      folder, 
      filename, 
      source, 
      success: true 
    });
  }
  
  addFailure(partNumber, itemSource, error, errorStatus = null, attemptedUrls = []) {
    this.items.push({ 
      partNumber, 
      folder: null, 
      filename: null, 
      source: null, 
      success: false 
    });
    this.errors.push({ 
      partNumber, 
      itemSource: itemSource ? {
        documentId: itemSource.documentId,
        elementId: itemSource.elementId,
        partId: itemSource.partId
      } : null,
      error,
      errorStatus,
      attemptedUrls 
    });
  }
  
  addSkipped(partNumber, reason) {
    this.items.push({
      partNumber,
      folder: null,
      filename: null,
      source: null,
      success: false,
      skipped: true,
      skipReason: reason
    });
  }
  
  generate() {
    const succeeded = this.items.filter(i => i.success).length;
    const failedItems = this.items.filter(i => !i.success && !i.skipped);
    const skipped = this.items.filter(i => i.skipped).length;

    const failedBreakdown = {
      total_failed: failedItems.length,
      fail_by_403: 0,
      fail_by_404: 0,
      fail_by_other: 0,
    };

    for (const err of this.errors) {
      if (err?.errorStatus === 403) failedBreakdown.fail_by_403++;
      else if (err?.errorStatus === 404) failedBreakdown.fail_by_404++;
      else failedBreakdown.fail_by_other++;
    }
    
    // Group by folder
    const byFolder = {};
    for (const item of this.items) {
      const folder = item.folder || (item.skipped ? 'skipped' : 'failed');
      byFolder[folder] = byFolder[folder] || { count: 0, succeeded: 0, failed: 0 };
      byFolder[folder].count++;
      if (item.success) {
        byFolder[folder].succeeded++;
      } else {
        byFolder[folder].failed++;
      }
    }
    
    // Group by source
    const bySource = {};
    for (const item of this.items.filter(i => i.success)) {
      bySource[item.source] = (bySource[item.source] || 0) + 1;
    }
    
    return {
      metadata: this.metadata,
      summary: {
        total: this.items.length,
        succeeded,
        failed: failedBreakdown,
        skipped,
        successRate: this.items.length > 0 
          ? `${((succeeded / this.items.length) * 100).toFixed(1)}%`
          : "0%"
      },
      byFolder,
      bySource,
      errors: this.errors,
      items: this.items
    };
  }
}

// ============================================================================
// Thumbnail Fetching
// ============================================================================

/**
 * Fetch a thumbnail via the proxy endpoint with retry logic.
 * Tries multiple URL strategies if the primary fails.
 * Uses exponential backoff for rate limiting and server errors.
 *
 * @param {string} primaryUrl - Primary OnShape thumbnail URL (pre-generated from thumbnailInfo)
 * @param {string|null} fallbackUrl - Fallback URL to try if primary fails (constructed URL)
 * @param {number} retries - Number of retries on failure (default: 2)
 * @param {number} retryDelayMs - Base delay between retries (default: 300)
 * @returns {Promise<{blob: Blob|null, usedUrl: string|null}>} Thumbnail blob and URL used
 */
async function fetchThumbnailBlob(
  primaryUrl,
  fallbackUrl = null,
  retries = THUMBNAIL_RETRY_COUNT,
  retryDelayMs = THUMBNAIL_RETRY_DELAY_MS
) {
  if (!primaryUrl && !fallbackUrl) return { blob: null, usedUrl: null };

  const urlsToTry = [primaryUrl, fallbackUrl].filter(Boolean);
  const attemptedUrls = [];
  let lastStatus = null;

  for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
    const thumbnailUrl = urlsToTry[urlIndex];
    attemptedUrls.push(thumbnailUrl);
    const isLastUrl = urlIndex === urlsToTry.length - 1;
    const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
      thumbnailUrl
    )}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(proxyUrl);

        if (response.ok) {
          const blob = await response.blob();
          // Verify we got actual image data (must have content and be an image type)
          if (
            blob.size > 100 &&
            (blob.type.startsWith("image/") ||
              blob.type === "application/octet-stream")
          ) {
            return { blob, usedUrl: thumbnailUrl, attemptedUrls, errorStatus: null };
          }
          // Small response or wrong type - probably an error page
          console.warn(
            `[FullExtract] Invalid image response (size=${blob.size}, type=${blob.type})`
          );
          lastStatus = response.status || lastStatus;
          break; // Try next URL
        }

        lastStatus = response.status || lastStatus;

        // Handle rate limiting (429) or server errors (5xx) with exponential backoff
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            const backoffMs = retryDelayMs * Math.pow(2, attempt); // Exponential: 300, 600, 1200...
            console.warn(
              `[FullExtract] Thumbnail fetch retry ${attempt + 1}/${retries} (${
                response.status
              }), waiting ${backoffMs}ms`
            );
            await delay(backoffMs);
            continue;
          }
          console.warn(
            `[FullExtract] Thumbnail fetch failed after ${retries} retries (${response.status})`
          );
        }

        // 404 means thumbnail doesn't exist for this URL, try fallback immediately
        if (response.status === 404) {
          if (!isLastUrl) {
            console.warn(
              `[FullExtract] Thumbnail not found (404), trying fallback URL`
            );
          }
          break; // Try fallback URL
        }

        // Other client errors (400, 401, 403) - don't retry, try fallback
        if (response.status >= 400 && response.status < 500) {
          console.warn(
            `[FullExtract] Thumbnail fetch client error (${response.status})`
          );
          break; // Try next URL
        }

        console.warn(
          `[FullExtract] Thumbnail fetch failed (${response.status})`
        );
        break; // Try next URL
      } catch (err) {
        if (attempt < retries) {
          const backoffMs = retryDelayMs * Math.pow(2, attempt);
          console.warn(
            `[FullExtract] Thumbnail fetch error, retrying in ${backoffMs}ms: ${err.message}`
          );
          await delay(backoffMs);
          continue;
        }
        console.warn(
          `[FullExtract] Thumbnail fetch error after ${retries} retries: ${err.message}`
        );
        break; // Try next URL
      }
    }
  }

  return { blob: null, usedUrl: null, attemptedUrls, errorStatus: lastStatus };
}

/**
 * Fetch thumbnails with concurrency limit and rate limiting.
 * Uses hybrid URL resolution strategy.
 *
 * @param {Array} items - Array of parsed BOM items with thumbnail info
 * @param {number} concurrency - Max concurrent fetches
 * @param {Function} onProgress - Progress callback (current, total, item)
 * @param {number} delayMs - Delay between fetches in ms (rate limiting)
 * @param {Object} documentService - DocumentService for metadata fallback
 * @param {ThumbnailReport} report - Report instance for tracking
 * @returns {Promise<Array>} Array of {filename, blob, folder} results
 */
async function fetchThumbnailsWithLimit(
  items,
  concurrency,
  onProgress,
  delayMs = DEFAULT_THUMBNAIL_DELAY_MS,
  documentService,
  report
) {
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

        const { parsed, row } = item;
        const filename = buildThumbnailFilename(parsed);
        const folder = getThumbnailFolder(parsed.partNumber);

        // Use hybrid URL resolution
        const { url: resolvedUrl, source } = await resolveThumbnailUrl(
          row, 
          parsed, 
          documentService
        );
        
        // Also get constructed URL as additional fallback
        const constructedUrl = buildThumbnailUrl(parsed.thumbnailInfo);
        
        if (!resolvedUrl && !constructedUrl) {
          // No URL available at all
          report.addSkipped(parsed.partNumber, "No thumbnail URL available");
          completed++;
          if (onProgress) {
            onProgress(completed, items.length, { filename, parsed });
          }
          continue;
        }

        const { blob, usedUrl, attemptedUrls, errorStatus } = await fetchThumbnailBlob(
          resolvedUrl,
          source !== 'constructed' ? constructedUrl : null // Don't try constructed twice
        );
        
        completed++;

        if (onProgress) {
          onProgress(completed, items.length, { filename, parsed });
        }

        if (blob) {
          results.push({ filename, blob, folder });
          report.addSuccess(
            parsed.partNumber, 
            folder, 
            filename, 
            source || 'constructed'
          );
        } else {
          report.addFailure(
            parsed.partNumber,
            parsed.thumbnailInfo,
            "All thumbnail URLs failed",
            errorStatus || null,
            attemptedUrls || []
          );
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
    thumbnailDelayMs = DEFAULT_THUMBNAIL_DELAY_MS,
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

    // Phase: Fetch BOM (now with thumbnail=true via updated service)
    reportProgress(ExportPhase.FETCHING_BOM);
    console.log(`[FullExtract] Fetching BOM with thumbnails for ${assemblyName}...`);

    let bom;
    try {
      // getBillOfMaterials now always includes thumbnail=true
      bom = await documentService.getBillOfMaterials(
        documentId,
        workspaceId,
        element.id
      );
    } catch (bomError) {
      console.error(`[FullExtract] Error:`, bomError);
      throw new Error(
        `Get BOM failed (${bomError.message || "unknown error"})`
      );
    }

    if (!bom || !Array.isArray(bom.rows)) {
      throw new Error("No BOM data available for this assembly");
    }

    console.log(
      `[FullExtract] BOM fetched: ${bom.rows.length} rows, ${
        bom.headers?.length || 0
      } headers`
    );

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
    // Build both header maps for extraction
    const headerMap = buildHeaderMap(bom.headers);
    const legacyHeaderMap = buildLegacyHeaderMap(bom.headers);
    
    // Create folder references in ZIP
    const thumbnailsFolder = zip.folder("thumbnails");
    const thumbnailsIgnoredFolder = zip.folder("thumbnails_ignored");

    // Initialize thumbnail report
    const thumbnailReport = new ThumbnailReport(assemblyName, bom.rows.length);

    const thumbnailItems = [];
    let skippedNoInfo = 0;

    for (let i = 0; i < bom.rows.length; i++) {
      const row = bom.rows[i];
      const parsed = parseBomRow(row, headerMap, legacyHeaderMap, i);

      // Check if we have any thumbnail source
      if (parsed.directThumbnailUrl || parsed.thumbnailInfo) {
        thumbnailItems.push({
          parsed,
          row,
        });
      } else {
        skippedNoInfo++;
        thumbnailReport.addSkipped(parsed.partNumber, "No thumbnail info in BOM row");
        console.log(
          `[FullExtract] Row ${i + 1}: No thumbnail info for "${parsed.name}" (${parsed.partNumber})`
        );
      }
    }

    console.log(
      `[FullExtract] Prepared ${thumbnailItems.length} thumbnail requests (${skippedNoInfo} skipped - no info)`
    );
    console.log(
      `[FullExtract] Using ${CONCURRENT_THUMBNAIL_LIMIT} concurrent workers with ${thumbnailDelayMs}ms delay`
    );

    // Phase: Fetch thumbnails with hybrid resolution and rate limiting
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
      thumbnailDelayMs,
      documentService,
      thumbnailReport
    );

    console.log(
      `[FullExtract] Fetched ${thumbnailResults.length}/${thumbnailItems.length} thumbnails`
    );

    // Add thumbnails to appropriate folders in ZIP
    for (const { filename, blob, folder } of thumbnailResults) {
      if (folder === "thumbnails") {
        thumbnailsFolder.file(filename, blob);
      } else {
        thumbnailsIgnoredFolder.file(filename, blob);
      }
    }

    // Generate and add thumbnail report
    const reportData = thumbnailReport.generate();
    zip.file("thumbnail_report.json", JSON.stringify(reportData, null, 2));

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
    const reportSummary = reportData.summary;
    reportProgress(ExportPhase.COMPLETE, {
      bomRows: bom.rows.length,
      thumbnailsDownloaded: reportSummary.succeeded,
      thumbnailsFailed: reportSummary.failed,
      thumbnailsSkipped: reportSummary.skipped,
      zipSizeBytes: zipBlob.size,
      thumbnailReport: reportSummary,
    });

    console.log(
      `[FullExtract] Complete: ${zipFilename} (${(zipBlob.size / 1024).toFixed(
        1
      )} KB)`
    );
    console.log(`[FullExtract] Thumbnails by source:`, reportData.bySource);
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
