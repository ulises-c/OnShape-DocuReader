/**
 * Mass export all documents as CSV files (filtered for ASM/PRT parts) with thumbnails.
 *
 * Provides two export modes:
 * 1. exportAllDocumentsAsZip - Single ZIP file (recommended, gesture-safe)
 * 2. exportAllDocuments - Multiple files (fallback, may be blocked by browser)
 */

import { getCSV } from "./getCSV.js";
import JSZip from "jszip";

/**
 * Export all documents as a single ZIP file with CSVs and thumbnails.
 * This is the recommended approach as it triggers only one download.
 *
 * @param {Object} apiClient - API client for backend requests
 * @param {Object} documentService - Document service for fetching data
 * @returns {Promise<void>}
 */
export async function exportAllDocumentsAsZip(apiClient, documentService) {
  if (!apiClient || !documentService) {
    throw new Error("API client and document service are required");
  }

  console.log("Starting ZIP-based mass export of all documents...");

  // Try to load a same-origin copy of JSZip first so Content-Security-Policy (CSP)
  // with script-src 'self' allows execution. If not present, fall back to the CDN
  // but this may be blocked by CSP (see app console for CSP errors).
  const zip = new JSZip();

  let documents = [];
  try {
    documents = await apiClient.getDocuments();
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    throw new Error(`Failed to fetch documents: ${err.message}`);
  }

  if (!documents || documents.length === 0) {
    console.log("No documents found to export.");
    return;
  }

  console.log(`Found ${documents.length} documents. Processing for ZIP...`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(
      `[${i + 1}/${documents.length}] Processing document: ${doc.name}`
    );

    const docName = sanitizeFilename(doc.name);
    const docFolder = zip.folder(docName);

    if (!docFolder) {
      console.warn(`Failed to create folder for document: ${doc.name}`);
      continue;
    }

    let parts = [];
    try {
      const workspaceId = doc.defaultWorkspace?.id;
      if (!workspaceId) {
        console.warn(`  No default workspace for document: ${doc.name}`);
        continue;
      }

      const elements = await documentService.getElements(doc.id, workspaceId);

      if (!elements || elements.length === 0) {
        console.log(`  No elements found in document: ${doc.name}`);
        continue;
      }

      for (const element of elements) {
        try {
          const elementParts = await documentService.getParts(
            doc.id,
            workspaceId,
            element.id
          );
          if (elementParts && elementParts.length > 0) {
            for (const part of elementParts) {
              part.document = doc.name;
              part.version = doc.defaultWorkspace?.name || "";
            }
            parts.push(...elementParts);
          }
        } catch (err) {
          console.warn(
            `  Failed to fetch parts for element ${element.id}:`,
            err.message
          );
        }
      }
    } catch (err) {
      console.error(`  Failed to process document ${doc.name}:`, err.message);
      continue;
    }

    if (parts.length === 0) {
      console.log(`  No parts found in document: ${doc.name}`);
      continue;
    }

    const csv = getCSV(parts);
    if (csv) {
      const csvFilename = `${docName}_parts.csv`;
      docFolder.file(csvFilename, csv);
      console.log(
        `  Added CSV with ${parts.length} parts (filtered for ASM/PRT)`
      );
    } else {
      console.log(`  No ASM/PRT parts found in document: ${doc.name}`);
    }

    const thumbnailUrl = await getThumbnailUrl(doc);
    if (thumbnailUrl) {
      console.log(`  Downloading thumbnail for: ${doc.name}`);
      try {
        const thumbnailBlob = await fetchThumbnailBlob(thumbnailUrl);
        if (thumbnailBlob) {
          docFolder.file(`${docName}.png`, thumbnailBlob);
          console.log(`  Added thumbnail to ZIP`);
        }
      } catch (err) {
        console.warn(
          `  Failed to download thumbnail for ${doc.name}:`,
          err.message
        );
      }
    } else {
      console.log(`  No thumbnail available for: ${doc.name}`);
    }
  }

  console.log("Generating ZIP file...");
  const content = await zip.generateAsync({ type: "blob" });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const zipFilename = `onshape-docs-export-${timestamp}.zip`;

  downloadBlob(content, zipFilename);
  console.log("ZIP export completed!");
}

/**
 * Export all documents as individual CSV and PNG files.
 * This is a fallback approach that may be blocked by browsers for multiple downloads.
 *
 * @param {Object} apiClient - API client for backend requests
 * @param {Object} documentService - Document service for fetching data
 * @returns {Promise<void>}
 */
export async function exportAllDocuments(apiClient, documentService) {
  if (!apiClient || !documentService) {
    throw new Error("API client and document service are required");
  }

  console.log("Starting multi-file mass export of all documents...");

  let documents = [];
  try {
    documents = await apiClient.getDocuments();
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    throw new Error(`Failed to fetch documents: ${err.message}`);
  }

  if (!documents || documents.length === 0) {
    console.log("No documents found to export.");
    return;
  }

  console.log(`Found ${documents.length} documents. Processing...`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(
      `[${i + 1}/${documents.length}] Processing document: ${doc.name}`
    );

    const docName = sanitizeFilename(doc.name);

    let parts = [];
    try {
      const workspaceId = doc.defaultWorkspace?.id;
      if (!workspaceId) {
        console.warn(`  No default workspace for document: ${doc.name}`);
        continue;
      }

      const elements = await documentService.getElements(doc.id, workspaceId);

      if (!elements || elements.length === 0) {
        console.log(`  No elements found in document: ${doc.name}`);
        continue;
      }

      for (const element of elements) {
        try {
          const elementParts = await documentService.getParts(
            doc.id,
            workspaceId,
            element.id
          );
          if (elementParts && elementParts.length > 0) {
            for (const part of elementParts) {
              part.document = doc.name;
              part.version = doc.defaultWorkspace?.name || "";
            }
            parts.push(...elementParts);
          }
        } catch (err) {
          console.warn(
            `  Failed to fetch parts for element ${element.id}:`,
            err.message
          );
        }
      }
    } catch (err) {
      console.error(`  Failed to process document ${doc.name}:`, err.message);
      continue;
    }

    if (parts.length === 0) {
      console.log(`  No parts found in document: ${doc.name}`);
      continue;
    }

    const csv = getCSV(parts);
    if (!csv) {
      console.log(`  No ASM/PRT parts found in document: ${doc.name}`);
      continue;
    }

    console.log(
      `  Generated CSV with ${parts.length} parts (filtered for ASM/PRT)`
    );
    downloadFile(csv, `${docName}_parts.csv`, "text/csv");

    const thumbnailUrl = await getThumbnailUrl(doc);
    if (thumbnailUrl) {
      console.log(`  Downloading thumbnail for: ${doc.name}`);
      try {
        const thumbnailBlob = await fetchThumbnailBlob(thumbnailUrl);
        if (thumbnailBlob) {
          downloadBlob(thumbnailBlob, `${docName}.png`);
        }
      } catch (err) {
        console.warn(
          `  Failed to download thumbnail for ${doc.name}:`,
          err.message
        );
      }
    } else {
      console.log(`  No thumbnail available for: ${doc.name}`);
    }
  }

  console.log("Multi-file export completed!");
}

function sanitizeFilename(name) {
  return String(name || "document")
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 200);
}

function basename(filename) {
  if (typeof filename !== "string") return "download";
  const normalized = filename.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

function downloadFile(content, filename, mimeType = "text/plain") {
  const safeFilename = basename(sanitizeFilename(filename));
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, safeFilename);
}

function downloadBlob(blob, filename) {
  const safeFilename = basename(sanitizeFilename(filename));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function getThumbnailUrl(doc) {
  if (!doc.thumbnail || !Array.isArray(doc.thumbnail.sizes)) {
    return null;
  }

  const preferred = ["300x300", "600x340", "300x170", "70x40"];
  let selected = null;
  for (const size of preferred) {
    selected = doc.thumbnail.sizes.find((s) => s.size === size);
    if (selected) break;
  }

  if (!selected && doc.thumbnail.sizes.length > 0) {
    selected = doc.thumbnail.sizes[0];
  }

  return selected?.href || null;
}

async function fetchThumbnailBlob(url) {
  const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.blob();
}
