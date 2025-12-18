/**
 * Action Preview Modal
 *
 * A reusable modal for showing progress and previewing content for copy/download actions.
 * This is used to provide UX feedback so the app does not appear unresponsive.
 *
 * @module views/action-preview-modal
 */

import { copyToClipboard } from "../utils/clipboard.js";

let modalElement = null;
let isVisible = false;
let state = {
  title: "Action",
  statusText: "",
  contentText: "",
  contentLanguage: "text",
  mode: "preview", // "progress" | "preview" | "error"
  startedAtMs: 0,
  timers: {
    elapsedInterval: null,
  },
  handlers: {
    onCopy: null,
    onDownload: null,
    onClose: null,
  },
};

function getModalHTML() {
  return `
    <div id="action-preview-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content" style="max-width: 760px; padding: 1.5rem;">
        <div class="modal-header" style="margin-bottom: 1rem;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span id="action-preview-icon">⏳</span>
            <span id="action-preview-title">Action</span>
          </h3>
        </div>

        <div class="modal-body">
          <div id="action-preview-status" style="margin-bottom: 0.75rem; color: #666;">
            Working...
          </div>

          <div id="action-preview-progress" style="display:none; margin-bottom: 0.75rem; color: #666;">
            <span id="action-preview-elapsed">Elapsed: 0.0s</span>
          </div>

          <div id="action-preview-error" style="display:none; margin-bottom: 0.75rem; padding: 0.75rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
            <strong>Error:</strong> <span id="action-preview-error-message"></span>
          </div>

          <div id="action-preview-content-wrap" style="display:none;">
            <div style="display:flex; gap: 0.5rem; align-items:center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.875rem; color: #666;">Preview</span>
            </div>

            <pre id="action-preview-content" style="background:#f8f9fa; border-radius:6px; padding:1em; font-size:0.95em; max-height:420px; overflow:auto; white-space:pre; word-break:break-word;"></pre>
          </div>
        </div>

        <div class="modal-footer" style="margin-top: 1rem; display:flex; justify-content: flex-end; gap: 0.5rem;">
          <button id="action-preview-copy-btn" class="btn"
                  style="padding:0.5rem 1rem; background:#007bff; color:white; border:1px solid #0056b3; border-radius:4px; cursor:pointer; display:none;">
            📋 Copy
          </button>
          <button id="action-preview-download-btn" class="btn"
                  style="padding:0.5rem 1rem; background:#28a745; color:white; border:1px solid #1e7e34; border-radius:4px; cursor:pointer; display:none;">
            ⬇️ Download
          </button>
          <button id="action-preview-close-btn" class="btn"
                  style="padding:0.5rem 1rem; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

function ensureModal() {
  if (!modalElement) {
    const container = document.createElement("div");
    container.innerHTML = getModalHTML();
    document.body.appendChild(container.firstElementChild);
    modalElement = document.getElementById("action-preview-modal");

    const closeBtn = document.getElementById("action-preview-close-btn");
    closeBtn?.addEventListener("click", () => hide());

    const copyBtn = document.getElementById("action-preview-copy-btn");
    copyBtn?.addEventListener("click", async () => {
      if (typeof state.handlers.onCopy === "function") {
        await state.handlers.onCopy();
        return;
      }
      await defaultCopy();
    });

    const downloadBtn = document.getElementById("action-preview-download-btn");
    downloadBtn?.addEventListener("click", async () => {
      if (typeof state.handlers.onDownload === "function") {
        await state.handlers.onDownload();
      }
    });

    modalElement?.addEventListener("click", (e) => {
      if (e.target === modalElement) {
        hide();
      }
    });
  }
  return modalElement;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "";
}

function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function setContent(text) {
  const el = document.getElementById("action-preview-content");
  if (el) {
    // Use textContent so the preview is not interpreted as HTML.
    el.textContent = text || "";
  }
}

function clearTimers() {
  if (state.timers.elapsedInterval) {
    clearInterval(state.timers.elapsedInterval);
    state.timers.elapsedInterval = null;
  }
}

function startElapsedTimer() {
  state.startedAtMs = Date.now();
  clearTimers();

  state.timers.elapsedInterval = setInterval(() => {
    const elapsedMs = Date.now() - state.startedAtMs;
    setText("action-preview-elapsed", `Elapsed: ${(elapsedMs / 1000).toFixed(1)}s`);
  }, 200);
}

async function defaultCopy() {
  await copyToClipboard(state.contentText || "");
}

function setMode(mode) {
  state.mode = mode;

  if (mode === "progress") {
    setText("action-preview-icon", "⏳");
    showEl("action-preview-progress");
    hideEl("action-preview-content-wrap");
    hideEl("action-preview-error");
    hideEl("action-preview-copy-btn");
    hideEl("action-preview-download-btn");
    startElapsedTimer();
    return;
  }

  if (mode === "preview") {
    setText("action-preview-icon", "✅");
    hideEl("action-preview-progress");
    hideEl("action-preview-error");
    showEl("action-preview-content-wrap");
    showEl("action-preview-copy-btn");
    clearTimers();
    return;
  }

  if (mode === "error") {
    setText("action-preview-icon", "❌");
    hideEl("action-preview-progress");
    hideEl("action-preview-content-wrap");
    showEl("action-preview-error");
    hideEl("action-preview-copy-btn");
    hideEl("action-preview-download-btn");
    clearTimers();
    return;
  }
}

export function showProgress({ title, statusText }) {
  ensureModal();
  state.title = title || "Working...";
  state.statusText = statusText || "Working...";
  state.contentText = "";
  state.handlers.onCopy = null;
  state.handlers.onDownload = null;
  state.handlers.onClose = null;

  setText("action-preview-title", state.title);
  setText("action-preview-status", state.statusText);
  setMode("progress");

  modalElement.style.display = "flex";
  isVisible = true;
}

export function showPreview({
  title,
  statusText,
  contentText,
  onCopy = null,
  onDownload = null,
  showDownload = false,
}) {
  ensureModal();
  state.title = title || "Preview";
  state.statusText = statusText || "Ready";
  state.contentText = contentText || "";
  state.handlers.onCopy = onCopy;
  state.handlers.onDownload = onDownload;
  state.handlers.onClose = null;

  setText("action-preview-title", state.title);
  setText("action-preview-status", state.statusText);
  setContent(state.contentText);
  setMode("preview");

  if (showDownload) {
    showEl("action-preview-download-btn");
  } else {
    hideEl("action-preview-download-btn");
  }

  modalElement.style.display = "flex";
  isVisible = true;
}

export function showError({ title, statusText, errorMessage }) {
  ensureModal();
  state.title = title || "Error";
  state.statusText = statusText || "Failed";
  state.contentText = "";
  state.handlers.onCopy = null;
  state.handlers.onDownload = null;
  state.handlers.onClose = null;

  setText("action-preview-title", state.title);
  setText("action-preview-status", state.statusText);
  setText("action-preview-error-message", errorMessage || "Unknown error");
  setMode("error");

  modalElement.style.display = "flex";
  isVisible = true;
}

export function hide() {
  clearTimers();
  if (modalElement) {
    modalElement.style.display = "none";
  }
  isVisible = false;

  if (typeof state.handlers.onClose === "function") {
    try {
      state.handlers.onClose();
    } catch {
      // no-op
    }
  }
}

export function isModalVisible() {
  return isVisible;
}

