/**
 * Pure rendering functions for document metadata sections
 */

import { escapeHtml } from "../../utils/dom-helpers.js";
import { formatDateWithUser } from "../../utils/format-helpers.js";

export function renderDocumentInfo(docData) {
  const createdDate = formatDateWithUser(
    docData.createdAt,
    docData.createdBy || docData.creator
  );
  const modifiedDate = formatDateWithUser(
    docData.modifiedAt,
    docData.modifiedBy
  );

  return `
    <div class="info-item">
      <div class="info-label">Name</div>
      <div class="info-value">${escapeHtml(docData.name)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Description</div>
      <div class="info-value">${escapeHtml(
        docData.description || "No description"
      )}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Notes</div>
      <div class="info-value">${escapeHtml(docData.notes || "No notes")}</div>
    </div>
    ${renderTagsAndLabels(docData)}
    <div class="info-item">
      <div class="info-label">Created</div>
      <div class="info-value">${escapeHtml(createdDate)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Modified</div>
      <div class="info-value">${escapeHtml(modifiedDate)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Visibility</div>
      <div class="info-value">${docData.isPublic ? "Public" : "Private"}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Parent/Hierarchy</div>
      <div class="info-value" id="parent-hierarchy-${docData.id}">
        ${
          docData.parentId
            ? `Parent ID: ${escapeHtml(docData.parentId)}`
            : "No parent information"
        }
        <div style="margin-top: 0.5rem;">
          <button id="load-hierarchy-${
            docData.id
          }" class="btn load-hierarchy-btn" data-doc-id="${
    docData.id
  }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#f0f0f0; border:1px solid #ddd;">
            🔍 Load Hierarchy Details
          </button>
        </div>
      </div>
    </div>
    <div class="info-item">
      <div class="info-label">Raw JSON</div>
      <div style="margin-bottom:0.5rem; display:flex; gap:0.5rem; align-items:center;">
        <button id="copy-json-${
          docData.id
        }" class="btn copy-json-btn" data-doc-id="${
    docData.id
  }" style="padding:0.25rem 0.5rem; font-size:0.8rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer;">
          📋 Copy Raw JSON
        </button>
      </div>
      <pre id="raw-json-${
        docData.id
      }" class="info-value" style="background:#f8f9fa; border-radius:6px; padding:1em; font-size:0.95em; max-height:400px; overflow:auto;">${escapeHtml(
    JSON.stringify(docData, null, 2)
  )}</pre>
    </div>
  `;
}

export function renderThumbnailSection(docData) {
  if (!docData.thumbnail || !Array.isArray(docData.thumbnail.sizes)) {
    return "";
  }

  const preferred = ["300x300", "600x340", "300x170", "70x40"];
  let selected = null;
  for (const size of preferred) {
    selected = docData.thumbnail.sizes.find((s) => s.size === size);
    if (selected) break;
  }
  if (!selected && docData.thumbnail.sizes.length > 0) {
    selected = docData.thumbnail.sizes[0];
  }

  if (!selected?.href) {
    return "";
  }

  const proxyUrl = `/api/thumbnail-proxy?url=${encodeURIComponent(
    selected.href
  )}`;

  return `
    <div class="info-item">
      <div class="info-value thumbnail-container">
        <div id="thumbnail-placeholder-${docData.id}" style="width: 300px; height: 200px; background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #666; font-style: italic;">
          <div>📷</div>
          <div style="margin-top: 0.5rem;">Loading thumbnail...</div>
        </div>
        <img id="document-thumbnail-img-${docData.id}"
             src="${proxyUrl}"
             alt="Document thumbnail"
             class="document-thumbnail"
             data-original-url="${selected.href}"
             data-proxy-url="${proxyUrl}"
             data-doc-id="${docData.id}"
             style="max-width:300px; max-height:200px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:none;" />
        <div class="thumbnail-info" style="margin-top:0.5rem; font-size:0.9rem; color:#666;">Size: ${selected.size} | Click to view original</div>
      </div>
    </div>
  `;
}

export function renderTagsAndLabels(docData) {
  const tagsHtml = docData.tags?.length
    ? docData.tags
        .map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`)
        .join(" ")
    : "No tags";

  const labelsHtml = docData.documentLabels?.length
    ? docData.documentLabels
        .map(
          (l) =>
            `<span class="label-badge">${escapeHtml(
              typeof l === "string" ? l : l.name || JSON.stringify(l)
            )}</span>`
        )
        .join(" ")
    : "No document labels";

  return `
    <div class="info-item">
      <div class="info-label">Tags</div>
      <div class="info-value">${tagsHtml}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Document Labels</div>
      <div class="info-value">${labelsHtml}</div>
    </div>
  `;
}
