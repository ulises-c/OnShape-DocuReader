/**
 * Download helpers
 */

export function downloadJson(data, filenamePrefix = 'onshape-export') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const filename = `${filenamePrefix}-${Date.now()}.json`;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
