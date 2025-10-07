/**
 * Centralized toast notification system
 */

let toastContainer = null;

export function showToast(message, duration = 2500) {
  try {
    ensureToastContainer();
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText =
      "background:#333;color:#fff;padding:10px 14px;border-radius:6px;margin-top:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:auto;opacity:0;transform:translateY(-6px);transition:opacity 200ms ease,transform 200ms ease;font-family:system-ui,Segoe UI,Roboto,-apple-system,Arial,sans-serif;font-size:0.95rem;";
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-6px)";
      setTimeout(() => toast.remove(), 220);
    }, duration);
  } catch (e) {
    console.warn("Failed to show toast:", e);
  }
}

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "docu-toast-container";
    toastContainer.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:1200;pointer-events:none;";
    document.body.appendChild(toastContainer);
  }
}
