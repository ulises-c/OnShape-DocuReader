/**
 * Generate CSV from parts data, filtering for ASM/PRT part numbers.
 * 
 * Filters parts whose "Part number" property contains ASM or PRT patterns.
 * Supports various formats: ASM-XXXXXX, PRT-XXXXXX, with/without dash/underscore.
 * 
 * @param {Array} parts Array of part objects from OnShape API
 * @returns {string} CSV content with filtered rows, or empty string if no matches
 */
export function getCSV(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return '';
  }

  const pattern = /\b(ASM|PRT)[-_]?\w{4,}\b/i;
  
  const filtered = parts.filter(part => {
    const partNumber = part?.partNumber || part?.['Part number'] || '';
    return pattern.test(String(partNumber));
  });

  if (filtered.length === 0) {
    return '';
  }

  const headers = ['Part number', 'Name', 'Document', 'Version/Workspace'];
  const rows = [headers];

  for (const part of filtered) {
    const partNumber = part?.partNumber || part?.['Part number'] || '';
    const name = part?.name || '';
    const document = part?.document || part?.documentName || '';
    const version = part?.version || part?.workspace || '';

    rows.push([
      escapeCsvField(String(partNumber)),
      escapeCsvField(String(name)),
      escapeCsvField(String(document)),
      escapeCsvField(String(version))
    ]);
  }

  return rows.map(row => row.join(',')).join('\n');
}

function escapeCsvField(field) {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
