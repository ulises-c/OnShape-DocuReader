import requests
import os
from dotenv import load_dotenv

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

THUMBNAIL_SIZES = ["600x340", "300x170", "300x300", "70x40"] # Available thumbnail sizes provided by Onshape

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
        
        # Element ID follows 'e' segment
        element_id = parts[doc_index + 5].split('?')[0]  # Remove query params if present
        
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
    """
    bom_source = json_data.get("bomSource", {})
    doc_name = bom_source.get("document", {}).get("name", "Assembly")
    
    # Version info may not exist for workspace links
    version_info = bom_source.get("version", {})
    version_name = version_info.get("name", "workspace") if version_info else "workspace"
    
    # Sanitize names for filesystem
    doc_name = doc_name.replace(" ", "_").replace("/", "-")
    version_name = version_name.replace(" ", "_").replace("/", "-")
    
    return doc_name, version_name

# --- Download a Thumbnail Image ---
def download_thumbnail(thumbnail_url, filename, save_folder, auth):
    """
    Download a thumbnail image from OnShape API.
    Handles 404 errors by attempting URL modification for size parameter.
    """
    try:
        if not os.path.exists(save_folder):
            os.makedirs(save_folder)

        # Sanitize filename for filesystem
        safe_filename = filename.replace("/", "-").replace("\\", "-").replace(":", "-")
        
        response = requests.get(thumbnail_url, headers=HEADERS_IMAGE, auth=auth)

        if response.status_code == 404:
            # Modify the URL if 404 is returned - try without size suffix
            base_url = thumbnail_url.split("/s/")[0] if "/s/" in thumbnail_url else thumbnail_url.split("300x300")[0]
            modified_url = f"{base_url}/s/300x300"
            print(f"  Retrying with modified URL: {modified_url}")
            response = requests.get(modified_url, headers=HEADERS_IMAGE, auth=auth)

        if response.status_code == 200:
            image_path = os.path.join(save_folder, f"{safe_filename}.png")
            with open(image_path, 'wb') as f:
                f.write(response.content)
            print(f"  Saved: {image_path}")
            return True
        else:
            print(f"  Failed to fetch image for '{filename}'. Status code: {response.status_code}")
            return False

    except Exception as e:
        print(f"  Error downloading image for '{filename}': {e}")
        return False

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
        folder_name = f"{assembly_name}_{version_name}_Thumbnails"
        print(f"\nThumbnails will be saved in: {folder_name}")

        rows = bom_data.get("rows", [])
        print(f"Found {len(rows)} rows in BOM\n")

        success_count = 0
        skip_count = 0
        
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
                if download_thumbnail(thumbnail_url, part_number, save_folder=folder_name, auth=auth):
                    success_count += 1
            else:
                print(f"  No 300x300 thumbnail found for: {part_number}")
                skip_count += 1

        print(f"\n{'='*50}")
        print(f"Download complete!")
        print(f"  Successful: {success_count}")
        print(f"  Skipped (no thumbnail): {skip_count}")
        print(f"  Total rows: {len(rows)}")
        print(f"{'='*50}")
        
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
