import requests
import os
import json
import csv
from dotenv import load_dotenv
from datetime import datetime

# --- Constants ---
HEADERS_JSON = {
    'Accept': 'application/json;charset=UTF-8; qs=0.09',
    'Content-Type': 'application/json'
}
HEADERS_IMAGE = {'Accept': 'image/*'}

# OnShape API v12 base URL (matches working TypeScript implementation)
# Reference: src/services/onshape-api-client.ts uses v12
BASE_API_URL = "https://cad.onshape.com/api/v12"
BASE_BOM_URL = f"{BASE_API_URL}/assemblies"

DEFAULT_THUMBNAIL_SIZE = "300x300"
THUMBNAIL_SIZES = ["600x340", "300x170", "70x40"] # Other available thumbnail sizes provided by Onshape

# --- User Input ---
def get_user_input():
    """
    Prompt user for versioned OnShape assembly link and API credentials.
    Attempts to load credentials from .env file first.
    """
    link = input("Paste your versioned Onshape assembly link: ").strip()
    access_key = ""
    secret_key = ""
    
    # Attempt to load from .env file
    try:
        load_dotenv()
        access_key = os.getenv("ONSHAPE_ACCESS_KEY", "").strip()
        secret_key = os.getenv("ONSHAPE_SECRET_KEY", "").strip()
        if access_key and secret_key:
            print("Loaded Onshape credentials from .env file.")
        else:
            raise ValueError("Credentials not found in .env")
    except Exception as e:
        print(f"Could not load credentials from .env: {e}")
        access_key = input("Enter your Onshape access key: ").strip()
        secret_key = input("Enter your Onshape secret key: ").strip()
    
    return link, access_key, secret_key

# --- Convert Onshape Link to BOM API URL ---
def build_bom_api_url(version_link):
    """
    Parse a versioned OnShape assembly link and construct the BOM API URL.
    
    Supported link formats:
    - Versioned: https://cad.onshape.com/documents/{did}/v/{vid}/e/{eid}
    - Workspace: https://cad.onshape.com/documents/{did}/w/{wid}/e/{eid}
    
    Returns:
        tuple: (api_url, document_id, wvm_type, wvm_id, element_id) or (None, ...) on error
    """
    try:
        parts = version_link.strip().split('/')
        
        # Find the 'documents' segment to extract IDs
        doc_index = parts.index("documents")
        document_id = parts[doc_index + 1]
        
        # Determine WVM type (workspace 'w', version 'v', or microversion 'm')
        wvm_type = parts[doc_index + 2]  # 'w', 'v', or 'm'
        wvm_id = parts[doc_index + 3]
        
        # Element ID follows 'e' segment - search dynamically to handle microversions
        try:
            e_index = parts.index('e', doc_index)
            element_id = parts[e_index + 1].split('?')[0]  # Remove query params if present
        except (ValueError, IndexError):
            print("Could not find element ID in URL (missing 'e' segment)")
            return None, None, None, None, None
        
        print(f"Parsed IDs:")
        print(f"  Document: {document_id}")
        print(f"  WVM Type: {wvm_type} (w=workspace, v=version, m=microversion)")
        print(f"  WVM ID: {wvm_id}")
        print(f"  Element: {element_id}")

        # Build BOM API URL with OnShape API v12 parameters
        # Reference: src/routes/api.ts - getBillOfMaterials endpoint
        # The endpoint structure is: /assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}/bom
        url = (
            f"{BASE_BOM_URL}/d/{document_id}/{wvm_type}/{wvm_id}/e/{element_id}/bom"
            "?indented=true"
            "&multiLevel=true"
            "&generateIfAbsent=false"
            "&includeExcluded=false"
            "&ignoreSubassemblyBomBehavior=false"
            "&includeItemMicroversions=true"
            "&includeTopLevelAssemblyRow=true"
            "&thumbnail=true"
        )

        print(f"\nConstructed BOM API URL:\n  {url}")
        return url, document_id, wvm_type, wvm_id, element_id

    except (ValueError, IndexError) as e:
        print(f"Invalid Onshape URL format: {e}")
        print("Expected formats:")
        print("  Versioned: https://cad.onshape.com/documents/{did}/v/{vid}/e/{eid}")
        print("  Workspace: https://cad.onshape.com/documents/{did}/w/{wid}/e/{eid}")
        return None, None, None, None, None

# --- Extract Assembly Name and Version from BOM JSON ---
def get_assembly_name_and_version(json_data):
    """
    Extract assembly document name and version name from BOM response.
    Used for naming the output folder.
    Prefers workspace name if available, falls back to version name.
    """
    bom_source = json_data.get("bomSource", {})
    doc_name = bom_source.get("document", {}).get("name", "Assembly")
    
    # Check for workspace first (has priority), then version
    workspace_info = bom_source.get("workspace", {})
    if workspace_info and workspace_info.get("name"):
        version_name = workspace_info.get("name")
    else:
        # Fallback to version info if workspace not available
        version_info = bom_source.get("version", {})
        version_name = version_info.get("name", "workspace") if version_info else "workspace"
    
    # Sanitize names for filesystem
    doc_name = doc_name.replace(" ", "_").replace("/", "-")
    version_name = version_name.replace(" ", "_").replace("/", "-")
    
    return doc_name, version_name

# --- Download a Thumbnail Image ---
def download_thumbnail(thumbnail_url, filename, root_folder, auth):
    """
    Download a thumbnail image from OnShape API with fallback strategy.
    
    Strategy:
    1. First attempt: Try to download 300x300 size directly
    2. If that fails: Fetch API metadata to discover available sizes
    3. Fallback: Cross-reference with priority list and download highest priority available size
       Priority order: 600x340, 300x170, 70x40 (THUMBNAIL_SIZES in order)
    4. Last ditch effort: Try any remaining available sizes from metadata not in the priority list
    
    Saves files to "thumbnails" subfolder for PRT/ASM files, "thumbnails_ignored" for others.
    
    Returns:
        dict: Result object with download status and metadata
    """
    result = {
        "part_number": filename,
        "part_name": filename,
        "thumbnail_downloaded": False,
        "thumbnail_size": None,
        "thumbnail_filename": None,
        "thumbnail_URL": thumbnail_url,
        "error_code": None
    }
    
    try:
        # Determine subfolder based on part number prefix
        if filename.upper().startswith(('PRT', 'ASM')):
            save_folder = os.path.join(root_folder, "thumbnails")
        else:
            save_folder = os.path.join(root_folder, "thumbnails_ignored")
        
        if not os.path.exists(save_folder):
            os.makedirs(save_folder)

        # Sanitize filename for filesystem
        safe_filename = filename.replace("/", "-").replace("\\", "-").replace(":", "-")
        
        # Extract base URL (without /s/size parameter)
        base_url = thumbnail_url.split("/s/")[0] if "/s/" in thumbnail_url else thumbnail_url
        
        # Step 1: Try default 300x300 size
        print(f"  Attempting default size: {DEFAULT_THUMBNAIL_SIZE}")
        default_url = f"{base_url}/s/{DEFAULT_THUMBNAIL_SIZE}"
        response = requests.get(default_url, headers=HEADERS_IMAGE, auth=auth, timeout=10)
        
        if response.status_code == 200:
            # Successfully downloaded default size
            image_path = os.path.join(save_folder, f"{safe_filename}.png")
            with open(image_path, 'wb') as f:
                f.write(response.content)
            print(f"  Saved: {image_path} (size: {DEFAULT_THUMBNAIL_SIZE})")
            result["thumbnail_downloaded"] = True
            result["thumbnail_size"] = DEFAULT_THUMBNAIL_SIZE
            result["thumbnail_filename"] = f"{safe_filename}.png"
            return result
        
        # Step 2: Default size failed, fetch metadata
        print(f"  Default size failed. Fetching available thumbnail sizes...")
        json_response = requests.get(base_url, headers=HEADERS_JSON, auth=auth, timeout=10)
        
        if json_response.status_code != 200:
            print(f"  Failed to fetch thumbnail metadata (status: {json_response.status_code})")
            result["error_code"] = f"METADATA_FETCH_FAILED_{json_response.status_code}"
            return result
        
        try:
            thumbnail_data = json_response.json()
            available_sizes = thumbnail_data.get("sizes", [])
            
            if not available_sizes:
                print(f"  No sizes found in API response")
                result["error_code"] = "NO_SIZES_IN_METADATA"
                return result
            
            # Extract size strings from API response
            available_size_strings = [size_info.get("size") for size_info in available_sizes if size_info.get("size")]
            print(f"  Available sizes: {available_size_strings}")
            
            # Step 3: Try fallback sizes in priority order (THUMBNAIL_SIZES order)
            for priority_size in THUMBNAIL_SIZES:
                if priority_size not in available_size_strings:
                    print(f"    Size {priority_size} not available")
                    continue
                
                # Find the href for this size
                href = None
                for size_info in available_sizes:
                    if size_info.get("size") == priority_size:
                        href = size_info.get("href")
                        break
                
                if href:
                    print(f"  Attempting fallback size: {priority_size}")
                    response = requests.get(href, headers=HEADERS_IMAGE, auth=auth, timeout=10)
                    
                    if response.status_code == 200:
                        image_path = os.path.join(save_folder, f"{safe_filename}.png")
                        with open(image_path, 'wb') as f:
                            f.write(response.content)
                        print(f"  Saved: {image_path} (size: {priority_size})")
                        result["thumbnail_downloaded"] = True
                        result["thumbnail_size"] = priority_size
                        result["thumbnail_filename"] = f"{safe_filename}.png"
                        result["thumbnail_URL"] = href
                        return result
                    else:
                        print(f"    Failed to download size {priority_size} (status: {response.status_code})")
            
            # Step 4: Last ditch effort - try any remaining available sizes not in THUMBNAIL_SIZES
            print(f"  No priority sizes available. Trying any other available sizes...")
            for size_info in available_sizes:
                size = size_info.get("size")
                href = size_info.get("href")
                
                # Skip sizes we already tried
                if size in THUMBNAIL_SIZES or size == DEFAULT_THUMBNAIL_SIZE:
                    continue
                
                if size and href:
                    print(f"  Attempting size: {size}")
                    response = requests.get(href, headers=HEADERS_IMAGE, auth=auth, timeout=10)
                    
                    if response.status_code == 200:
                        image_path = os.path.join(save_folder, f"{safe_filename}.png")
                        with open(image_path, 'wb') as f:
                            f.write(response.content)
                        print(f"  Saved: {image_path} (size: {size})")
                        result["thumbnail_downloaded"] = True
                        result["thumbnail_size"] = size
                        result["thumbnail_filename"] = f"{safe_filename}.png"
                        result["thumbnail_URL"] = href
                        return result
                    else:
                        print(f"    Failed to download size {size} (status: {response.status_code})")
            
            print(f"  Could not download any available size for '{filename}'")
            result["error_code"] = "NO_DOWNLOADABLE_SIZES"
            return result
            
        except Exception as e:
            print(f"  Error parsing thumbnail JSON: {e}")
            result["error_code"] = f"JSON_PARSE_ERROR: {str(e)}"
            return result

    except Exception as e:
        print(f"  Error downloading image for '{filename}': {e}")
        result["error_code"] = f"DOWNLOAD_ERROR: {str(e)}"
        return result


# --- Extract Part Number from Row ---
def get_part_number_from_row(row):
    """
    Extract part number from BOM row.
    The part number is stored in headerIdToValue with key "57f3fb8efa3416c06701d60f".
    """
    header_values = row.get('headerIdToValue', {})
    # Part Number field ID in OnShape BOM
    part_number = header_values.get("57f3fb8efa3416c06701d60f", "")
    
    if not part_number:
        # Try to get name as fallback
        part_number = header_values.get("57f3fb8efa3416c06701d60d", "unknown")
    
    return part_number if part_number else "unknown"

# --- Generate JSON Report ---
def generate_json_report(folder_name, items, bom_data):
    """
    Generate a JSON report with download statistics and individual item details.
    Includes detailed breakdown of failure reasons by error code.
    """
    # Calculate statistics
    successful_items = [item for item in items if item["thumbnail_downloaded"]]
    failed_items = [item for item in items if not item["thumbnail_downloaded"]]
    
    # Analyze failure codes
    failure_codes = {}
    for item in failed_items:
        error_code = item.get("error_code") or "UNKNOWN"
        
        # Categorize error codes
        if "404" in error_code:
            category = "404_fail"
        elif "403" in error_code:
            category = "403_fail"
        else:
            category = "other"
        
        failure_codes[category] = failure_codes.get(category, 0) + 1
    
    # Build failure breakdown
    failure_breakdown = {
        "total_failed": len(failed_items),
        "404_fail": failure_codes.get("404_fail", 0),
        "403_fail": failure_codes.get("403_fail", 0),
        "other": failure_codes.get("other", 0)
    }
    
    report = {
        "metadata": {
            "total_items": len(items),
            "successful_downloads": len(successful_items),
            "failed_downloads": failure_breakdown,
            "success_rate": f"{(len(successful_items) / len(items) * 100):.1f}%" if items else "0%",
            "assembly_name": folder_name
        },
        "items": items
    }
    
    # Save JSON to file
    json_filename = os.path.join(folder_name, "thumbnail_report.json")
    try:
        with open(json_filename, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nReport saved to: {json_filename}")
        return json_filename
    except Exception as e:
        print(f"Error saving JSON report: {e}")
        return None

# --- Save BOM Data ---
def save_bom_data(folder_name, bom_data):
    """
    Save the fetched BOM JSON data to a file for cross-reference and archival.
    """
    bom_filename = os.path.join(folder_name, "bom_data.json")
    try:
        with open(bom_filename, 'w') as f:
            json.dump(bom_data, f, indent=2)
        print(f"BOM data saved to: {bom_filename}")
        return bom_filename
    except Exception as e:
        print(f"Error saving BOM data: {e}")
        return None

# --- JSON to CSV Conversion Functions ---
def get_ordered_columns(headers, use_visible_only=False):
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


def extract_cell_value(row, header_id, property_name):
    """
    Extract cell value from a row, checking multiple possible locations.
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


def format_value(value):
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


def convert_json_to_csv(json_data, output_path, visible_only=False):
    """
    Convert JSON BOM data to CSV.
    
    Args:
        json_data: Parsed JSON BOM data
        output_path: Path for output CSV file
        visible_only: Only include visible columns
    
    Returns:
        Number of rows written
    """
    headers = json_data.get('headers') or []
    rows = json_data.get('rows') or []
    
    # Get ordered columns
    columns = get_ordered_columns(headers, visible_only)
    
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


def save_bom_as_csv(folder_name, bom_data):
    """
    Convert BOM data to CSV and save in root folder.
    """
    csv_filename = os.path.join(folder_name, "bom_data.csv")
    try:
        row_count = convert_json_to_csv(bom_data, csv_filename)
        print(f"BOM data exported to CSV: {csv_filename} ({row_count} rows)")
        return csv_filename
    except Exception as e:
        print(f"Error converting BOM to CSV: {e}")
        return None

# --- Main Execution ---
def main():
    try:
        link, access_key, secret_key = get_user_input()
        auth = (access_key, secret_key)
        
        api_url, doc_id, wvm_type, wvm_id, element_id = build_bom_api_url(link)

        if not api_url:
            print("Exiting due to invalid Onshape link.")
            return

        print("\nFetching BOM data...")
        response = requests.get(api_url, headers=HEADERS_JSON, auth=auth)
        
        if response.status_code != 200:
            print(f"Failed to retrieve BOM. Status code: {response.status_code}")
            if response.status_code == 404:
                print("\n404 Not Found - Possible causes:")
                print("  1. Document/element does not exist")
                print("  2. Element is not an Assembly (must be Assembly type)")
                print("  3. You don't have access to this document")
                print("  4. Invalid API credentials")
            elif response.status_code == 401:
                print("\n401 Unauthorized - Check your API credentials")
            elif response.status_code == 403:
                print("\n403 Forbidden - You don't have permission to access this document")
            print(f"\nResponse: {response.text[:500]}...")
            return

        bom_data = response.json()

        # Get folder name from BOM JSON
        assembly_name, version_name = get_assembly_name_and_version(bom_data)
        # I need more time data to ensure unique folder names
        iso_date = datetime.now().strftime("%Y-%m-%d-T%H-%M-%S")
        root_folder = f"thumbnail_extraction/{assembly_name}_{version_name}_{iso_date}"
        print(f"\nThumbnails will be saved in: {root_folder}")
        
        # Create root folder for JSONs and subfolders
        if not os.path.exists(root_folder):
            os.makedirs(root_folder)
        
        # Save BOM data in root folder
        save_bom_data(root_folder, bom_data)

        rows = bom_data.get("rows", [])
        print(f"Found {len(rows)} rows in BOM\n")

        items = []
        
        # Loop through BOM rows
        for i, row in enumerate(rows, 1):
            part_number = get_part_number_from_row(row)
            print(f"[{i}/{len(rows)}] Processing: {part_number}")
            
            thumb_info = row.get('itemSource', {}).get('thumbnailInfo', {})
            sizes = thumb_info.get('sizes', [])
            
            # Find 300x300 thumbnail URL
            thumbnail_url = None
            for size_info in sizes:
                if size_info.get('size') == '300x300':
                    thumbnail_url = size_info.get('href')
                    break
            
            if thumbnail_url:
                result = download_thumbnail(thumbnail_url, part_number, root_folder, auth)
                # Enrich result with part name from row
                result["part_name"] = row.get('itemSource', {}).get('itemName', part_number)
                items.append(result)
            else:
                print(f"  No thumbnail found for: {part_number}")
                items.append({
                    "part_number": part_number,
                    "part_name": row.get('itemSource', {}).get('itemName', part_number),
                    "thumbnail_downloaded": False,
                    "thumbnail_size": None,
                    "thumbnail_filename": None,
                    "thumbnail_URL": None,
                    "error_code": "NO_THUMBNAIL_URL"
                })

        print(f"\n{'='*50}")
        print(f"Download complete!")
        successful = sum(1 for item in items if item["thumbnail_downloaded"])
        failed = len(items) - successful
        print(f"  Successful: {successful}")
        print(f"  Failed: {failed}")
        print(f"  Total rows: {len(rows)}")
        print(f"{'='*50}")
        
        # Generate JSON report in root folder
        generate_json_report(root_folder, items, bom_data)
        
        # Convert BOM data to CSV
        save_bom_as_csv(root_folder, bom_data)
        
        input("\nPress Enter to exit...")

    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")

# --- Entry Point ---
if __name__ == "__main__":
    main()
