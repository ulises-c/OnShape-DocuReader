#!/usr/bin/env python3
"""
JSON to CSV Converter for OnShape BOM Data

This script converts JSON files with a headers/rows structure to CSV.
It dynamically reads the headers array to determine column mappings,
handling varying header configurations across different JSON files.
"""

import json
import csv
import argparse
from pathlib import Path


def load_json(filepath: str) -> dict:
    """Load and parse JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_header_mapping(headers: list, use_visible_only: bool = False) -> dict:
    """
    Extract header ID to name mapping from headers array.
    
    Args:
        headers: List of header objects from JSON
        use_visible_only: If True, only include headers where visible=True
    
    Returns:
        Dictionary mapping header IDs/propertyNames to display names
    """
    mapping = {}
    seen_names = set()
    
    for header in headers:
        # Skip non-visible headers if requested
        if use_visible_only and not header.get('visible', True):
            continue
        
        header_id = header.get('id') or header.get('propertyName')
        property_name = header.get('propertyName')
        display_name = header.get('name', property_name)
        
        # Avoid duplicate column names
        if display_name in seen_names:
            display_name = f"{display_name} ({property_name})"
        seen_names.add(display_name)
        
        # Map both ID and propertyName to the display name
        if header_id:
            mapping[header_id] = {
                'name': display_name,
                'propertyName': property_name,
                'valueType': header.get('valueType', 'STRING')
            }
        if property_name and property_name != header_id:
            mapping[property_name] = {
                'name': display_name,
                'propertyName': property_name,
                'valueType': header.get('valueType', 'STRING')
            }
    
    return mapping


def get_ordered_columns(headers: list, use_visible_only: bool = False) -> list:
    """
    Get ordered list of columns based on headers array order.
    
    Returns list of tuples: (header_id, display_name, property_name)
    """
    columns = []
    seen = set()
    
    for header in headers:
        if use_visible_only and not header.get('visible', True):
            continue
        
        header_id = header.get('id') or header.get('propertyName')
        property_name = header.get('propertyName')
        display_name = header.get('name', property_name)
        
        if header_id not in seen:
            columns.append((header_id, display_name, property_name))
            seen.add(header_id)
    
    return columns


def extract_cell_value(row: dict, header_id: str, property_name: str) -> str:
    """
    Extract cell value from a row, checking multiple possible locations.
    
    Row data might be stored under the header ID, property name, or in a 
    nested 'values' or 'properties' structure.
    """
    # Direct lookup by header_id
    if header_id in row:
        return format_value(row[header_id])
    
    # Direct lookup by property_name
    if property_name and property_name in row:
        return format_value(row[property_name])
    
    # Check nested 'values' structure
    if 'values' in row and isinstance(row['values'], dict):
        if header_id in row['values']:
            return format_value(row['values'][header_id])
        if property_name and property_name in row['values']:
            return format_value(row['values'][property_name])
    
    # Check nested 'properties' structure
    if 'properties' in row and isinstance(row['properties'], dict):
        if header_id in row['properties']:
            return format_value(row['properties'][header_id])
        if property_name and property_name in row['properties']:
            return format_value(row['properties'][property_name])
    
    # Check for headerIdToValue mapping (common in OnShape API)
    if 'headerIdToValue' in row and isinstance(row['headerIdToValue'], dict):
        if header_id in row['headerIdToValue']:
            return format_value(row['headerIdToValue'][header_id])
    
    return ''


def format_value(value) -> str:
    """Format a value for CSV output, handling commas and newlines appropriately."""
    if value is None:
        return ''
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, dict):
        # Handle objects like Material which might have nested structure
        if 'displayName' in value:
            formatted = str(value['displayName'])
        elif 'value' in value:
            formatted = str(value['value'])
        elif 'name' in value:
            formatted = str(value['name'])
        else:
            formatted = json.dumps(value)
    elif isinstance(value, list):
        formatted = '; '.join(format_value(v) for v in value)
    else:
        formatted = str(value)
    
    # Replace problematic characters with underscores to avoid CSV issues
    # First replace comma-space with just space to avoid "_ " patterns
    formatted = formatted.replace(', ', ' ')
    # Then replace any remaining commas with underscores
    formatted = formatted.replace(',', '_')
    # Replace newlines and carriage returns with underscores
    formatted = formatted.replace('\n', '_')
    formatted = formatted.replace('\r', '_')
    return formatted


def convert_json_to_csv(
    json_data: dict,
    output_path: str,
    visible_only: bool = False,
    include_metadata: bool = False
) -> int:
    """
    Convert JSON BOM data to CSV.
    
    Args:
        json_data: Parsed JSON data
        output_path: Path for output CSV file
        visible_only: Only include visible columns
        include_metadata: Include source/assembly metadata as columns
    
    Returns:
        Number of rows written
    """
    # Determine the list of documents/assemblies
    if isinstance(json_data, list):
        # Direct list of assemblies
        documents = json_data
    elif 'assemblies' in json_data:
        # Aggregate report format with assemblies array
        documents = json_data['assemblies']
    elif 'bom' in json_data:
        # Single document with bom
        documents = [json_data]
    else:
        # Assume the data itself is a bom
        documents = [{'bom': json_data}]
    
    all_rows = []
    all_headers = []
    seen_header_ids = set()
    
    for doc in documents:
        if not doc:
            continue  # Skip null entries
        bom = doc.get('bom')
        if not bom:
            continue  # Skip assemblies with no BOM data
        headers = bom.get('headers') or []
        rows = bom.get('rows') or []
        
        # Merge headers (avoid duplicates)
        for h in headers:
            h_id = h.get('id') or h.get('propertyName')
            if h_id not in seen_header_ids:
                all_headers.append(h)
                seen_header_ids.add(h_id)
        
        # Add metadata to rows if requested
        if include_metadata:
            source = doc.get('source', {})
            assembly = doc.get('assembly', {})
            for row in rows:
                row['_documentName'] = source.get('documentName', '')
                row['_assemblyName'] = assembly.get('name', '')
        
        all_rows.extend(rows)
    
    headers = all_headers
    rows = all_rows
    
    # Get ordered columns
    columns = get_ordered_columns(headers, visible_only)
    
    # Add metadata columns if requested
    if include_metadata:
        columns = [
            ('_documentName', 'Document Name', '_documentName'),
            ('_assemblyName', 'Assembly Name', '_assemblyName')
        ] + columns
    
    # Write CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header row
        writer.writerow([col[1] for col in columns])
        
        # Write data rows
        for row in rows:
            csv_row = [
                extract_cell_value(row, col[0], col[2])
                for col in columns
            ]
            writer.writerow(csv_row)
    
    return len(rows)


def main():
    parser = argparse.ArgumentParser(
        description='Convert OnShape BOM JSON to CSV',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python json_to_csv.py input.json output.csv
  python json_to_csv.py input.json output.csv --visible-only
  python json_to_csv.py input.json output.csv --include-metadata
        '''
    )
    parser.add_argument('input', help='Input JSON file path')
    parser.add_argument('output', help='Output CSV file path')
    parser.add_argument(
        '--visible-only', '-v',
        action='store_true',
        help='Only include columns marked as visible in headers'
    )
    parser.add_argument(
        '--include-metadata', '-m',
        action='store_true',
        help='Include document/assembly metadata as columns'
    )
    
    args = parser.parse_args()
    
    # Load JSON
    print(f"Loading JSON from: {args.input}")
    json_data = load_json(args.input)
    
    # Convert to CSV
    print(f"Converting to CSV...")
    row_count = convert_json_to_csv(
        json_data,
        args.output,
        visible_only=args.visible_only,
        include_metadata=args.include_metadata
    )
    
    print(f"Done! Wrote {row_count} rows to: {args.output}")


if __name__ == '__main__':
    main()