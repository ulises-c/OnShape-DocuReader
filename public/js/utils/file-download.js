/**
 * Generic file download utilities
 */

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, filename);
}

export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv' });
  downloadBlob(blob, filename);
}

export function createDownloadLink(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  return { link: a, url };
}

function downloadBlob(blob, filename) {
  const { link, url } = createDownloadLink(blob, filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
