Create `aggregateBomToCSV.js`
```js
// public/js/utils/aggregateBomToCSV.js
/**
 * Convert aggregate BOM export result to a flattened CSV.
 * Adds source columns (Document, Folder Path, Assembly) to each BOM row.
 * 
 * @param {Object} aggregateResult - Result from aggregate BOM export
 * @returns {string} CSV string with all BOM rows flattened
 */
export function aggregateBomToCSV(aggregateResult) {
  if (!aggregateResult?.assemblies?.length) {
    return '';
  }

  // Collect all unique header IDs across all BOMs
  const headerMap = new Map(); // id -> name
  
  for (const assembly of aggregateResult.assemblies) {
    if (assembly.bom?.headers) {
      for (const header of assembly.bom.headers) {
        if (!headerMap.has(header.id)) {
          headerMap.set(header.id, header.name || header.id);
        }
      }
    }
  }

  // Build header row: source columns + all BOM columns
  const sourceHeaders = ['Document', 'Folder Path', 'Assembly'];
  const bomHeaderIds = Array.from(headerMap.keys());
  const bomHeaderNames = bomHeaderIds.map(id => headerMap.get(id));
  const allHeaders = [...sourceHeaders, ...bomHeaderNames];

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
      const sourceValues = [docName, folderPath, assemblyName];
      
      const bomValues = bomHeaderIds.map(hid => {
        let val = '';
        if (row.headerIdToValue && 
            Object.prototype.hasOwnProperty.call(row.headerIdToValue, hid)) {
          val = row.headerIdToValue[hid];
          if (Array.isArray(val)) val = val.join(';');
          if (val && typeof val === 'object') val = JSON.stringify(val);
        }
        return escapeCsvField(String(val ?? ''));
      });

      csvRows.push([...sourceValues.map(escapeCsvField), ...bomValues].join(','));
    }
  }

  return csvRows.join('\n');
}

function escapeCsvField(field) {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

Update `document-controller.js`
```js
// Add import at top
import { aggregateBomToCSV } from '../utils/aggregateBomToCSV.js';

// Add this helper method to the class
_downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Modify the onComplete handler in _startAggregateBomExport:
onComplete: (result) => {
  if (btn) {
    btn.textContent = originalText;
    btn.disabled = false;
  }

  if (isPartial) {
    this.state.clearExportSelection();
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const scopeLabel = isPartial
    ? 'partial'
    : filterOptions?.prefixFilter
    ? `filtered-${filterOptions.prefixFilter}`
    : 'full';

  // Download both JSON and CSV
  const jsonFilename = `aggregate-bom-${scopeLabel}-${timestamp}.json`;
  const csvFilename = `aggregate-bom-${scopeLabel}-${timestamp}.csv`;
  
  this._downloadJson(result, jsonFilename);
  
  const csv = aggregateBomToCSV(result);
  if (csv) {
    this._downloadCsv(csv, csvFilename);
  }

  this._toast(
    `✅ Exported ${result.summary?.assembliesSucceeded || 0} assemblies (JSON + CSV)`
  );
},
```