/**
 * Convert Onshape BOM JSON to CSV.
 *
 * @param {Object} bomJson - BOM JSON object from Onshape API
 * @returns {string} CSV string
 */

// TODO: Check for edge cases, e.g. commas, quotes in values

export function bomToCSV(bomJson) {
  if (
    !bomJson ||
    !Array.isArray(bomJson.headers) ||
    !Array.isArray(bomJson.rows)
  ) {
    return "";
  }

  // Use all headers, not just visible, to match OnShape export
  const allHeaders = bomJson.headers;
  const headerNames = allHeaders.map((h) => h.name || "Property not found");
  const headerIds = allHeaders.map((h) => h.id);

  // Build CSV rows
  const csvRows = [];
  csvRows.push(headerNames.map(escapeCsvField).join(","));

  for (const row of bomJson.rows) {
    const values = headerIds.map((hid) => {
      let val = "";
      if (
        row.headerIdToValue &&
        Object.prototype.hasOwnProperty.call(row.headerIdToValue, hid)
      ) {
        val = row.headerIdToValue[hid];
        // If value is array, join with semicolon
        if (Array.isArray(val)) val = val.join(";");
        // If value is object, JSON.stringify
        if (val && typeof val === "object") val = JSON.stringify(val);
      }
      return escapeCsvField(String(val ?? ""));
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function escapeCsvField(field) {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
