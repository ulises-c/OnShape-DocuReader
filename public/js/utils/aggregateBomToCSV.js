/**
 * Convert aggregate BOM export result to a flattened CSV.
 * Adds source columns (Document, Folder Path, Assembly) to each BOM row.
 * 
 * @param {Object} aggregateResult - Result from aggregate BOM export
 * @param {Object} options - Conversion options
 * @param {boolean} options.filterPrtAsm - Only include PRT/ASM part numbers
 * @returns {string} CSV string with all BOM rows flattened
 */
export function aggregateBomToCSV(aggregateResult, options = {}) {
  if (!aggregateResult?.assemblies?.length) {
    return '';
  }

  const { filterPrtAsm = false } = options;
  
  // Pattern for PRT/ASM filtering - matches PRT-xxx, ASM-xxx, PRT_xxx, ASM_xxx, PRTxxx, ASMxxx
  const prtAsmPattern = /^(PRT|ASM)[-_]?\w*/i;

  // Collect all unique BOM headers across all assemblies
  const headerMap = new Map(); // id -> name
  
  for (const assembly of aggregateResult.assemblies) {
    if (assembly.bom?.headers) {
      for (const header of assembly.bom.headers) {
        const headerId = typeof header === 'string' ? header : header.id;
        const headerName = typeof header === 'string' ? header : (header.name || header.id);
        if (!headerMap.has(headerId)) {
          headerMap.set(headerId, headerName);
        }
      }
    }
  }

  // Build complete header row: source columns + all BOM columns
  const sourceHeaders = ['Document', 'Folder Path', 'Assembly'];
  const bomHeaderIds = Array.from(headerMap.keys());
  const bomHeaderNames = bomHeaderIds.map(id => headerMap.get(id));
  const allHeaders = [...sourceHeaders, ...bomHeaderNames];

  // Find Part Number header ID for filtering
  let partNumberHeaderId = null;
  if (filterPrtAsm) {
    for (const [id, name] of headerMap) {
      const lowerName = (name || '').toLowerCase();
      const lowerId = (id || '').toLowerCase();
      if (lowerName.includes('part number') || 
          lowerName === 'partnumber' ||
          lowerId.includes('partnumber') ||
          lowerName === 'part_number' ||
          lowerId === 'part_number') {
        partNumberHeaderId = id;
        break;
      }
    }
  }

  const csvRows = [];
  csvRows.push(allHeaders.map(escapeCsvField).join(','));

  // Process each assembly's BOM rows
  for (const assembly of aggregateResult.assemblies) {
    if (!assembly.bom?.rows?.length) continue;

    const docName = assembly.source?.documentName || '';
    const folderPath = Array.isArray(assembly.source?.folderPath) 
      ? assembly.source.folderPath.join(' / ') 
      : (assembly.source?.folderPath || '');
    const assemblyName = assembly.assembly?.name || '';

    for (const row of assembly.bom.rows) {
      // Apply PRT/ASM filter if enabled
      if (filterPrtAsm && partNumberHeaderId) {
        const partNumber = row.headerIdToValue?.[partNumberHeaderId] || '';
        if (!prtAsmPattern.test(String(partNumber))) {
          continue; // Skip non-matching rows
        }
      }

      const sourceValues = [docName, folderPath, assemblyName].map(escapeCsvField);
      
      const bomValues = bomHeaderIds.map(hid => {
        let val = '';
        if (row.headerIdToValue && 
            Object.prototype.hasOwnProperty.call(row.headerIdToValue, hid)) {
          val = row.headerIdToValue[hid];
          // If value is array, join with semicolon
          if (Array.isArray(val)) val = val.join(';');
          // If value is object, JSON stringify
          if (val && typeof val === 'object') val = JSON.stringify(val);
        }
        return escapeCsvField(String(val ?? ''));
      });

      csvRows.push([...sourceValues, ...bomValues].join(','));
    }
  }

  return csvRows.join('\n');
}

/**
 * Escape a field for CSV format.
 * @param {string} field - Field value to escape
 * @returns {string} Escaped field safe for CSV
 */
function escapeCsvField(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
