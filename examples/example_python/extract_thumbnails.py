import requests
import os
from dotenv import load_dotenv

# --- Constants ---
HEADERS_JSON = {'Accept': 'application/json;charset=UTF-8; qs=0.09', 'Content-Type': 'application/json'}
HEADERS_IMAGE = {'Accept': 'image/*'}
BASE_BOM_URL = "https://cad.onshape.com/api/v12/assemblies"

# --- User Input ---
def get_user_input():
    link = input("Paste your versioned Onshape assembly link: ").strip()
    access_key = ""
    secret_key = ""
    try:
        load_dotenv()
        access_key = os.getenv("ONSHAPE_ACCESS_KEY", "").strip()
        secret_key = os.getenv("ONSHAPE_SECRET_KEY", "").strip()
        print("Loaded Onshape credentials from .env file.")
    except Exception as e:
        print(f"Error loading .env file: {e}")
        access_key = input("Enter your Onshape access key: ").strip()
        secret_key = input("Enter your Onshape secret key: ").strip()
    return link, access_key, secret_key

# --- Convert Onshape Link to BOM API URL ---
def build_bom_api_url(version_link):
    try:
        parts = version_link.strip().split('/')
        doc_index = parts.index("documents")
        document_id = parts[doc_index + 1]
        version_id = parts[doc_index + 3]
        element_id = parts[doc_index + 5]

        url = f"{BASE_BOM_URL}/d/{document_id}/v/{version_id}/e/{element_id}/bom" \
              "?indented=true&multiLevel=true&generateIfAbsent=false&includeExcluded=false" \
              "&ignoreSubassemblyBomBehavior=false&includeItemMicroversions=true" \
              "&includeTopLevelAssemblyRow=true&thumbnail=true"

        print(f"Constructed BOM API URL: {url}")
        return url, document_id, version_id, element_id

    except Exception as e:
        print(f"Invalid Onshape URL format: {e}")
        return None, None, None, None

# --- Extract Assembly Name and Version from BOM JSON ---
def get_assembly_name_and_version(json_data):
    doc_name = json_data.get("bomSource", {}).get("document", {}).get("name", "Assembly")
    version_name = json_data.get("bomSource", {}).get("version", {}).get("name", "v1")
    return doc_name.replace(" ", "_"), version_name.replace(" ", "_")

# --- Download a Thumbnail Image ---
def download_thumbnail(thumbnail_url, filename, save_folder, auth):
    try:
        if not os.path.exists(save_folder):
            os.makedirs(save_folder)

        response = requests.get(thumbnail_url, headers=HEADERS_IMAGE, auth=auth)

        if response.status_code == 404:
            # Modify the URL if 404 is returned
            thumbnail_url = thumbnail_url.split("300x300")[0] + "300x300"
            response = requests.get(thumbnail_url, headers=HEADERS_IMAGE, auth=auth)

        if response.status_code == 200:
            image_path = os.path.join(save_folder, f"{filename}.png")
            with open(image_path, 'wb') as f:
                f.write(response.content)
            print(f" Saved: {image_path}")
        else:
            print(f" Failed to fetch image for '{filename}'. Status code: {response.status_code}")

    except Exception as e:
        print(f" Error downloading image for '{filename}': {e}")

# --- Main Execution ---
def main():
    try:
        link, access_key, secret_key = get_user_input()
        auth = (access_key, secret_key)
        api_url, doc_id, version_id, element_id = build_bom_api_url(link)

        if not api_url:
            print("Exiting due to invalid Onshape link.")
            return

        print("Fetching BOM data...")
        response = requests.get(api_url, headers=HEADERS_JSON, auth=auth)
        if response.status_code != 200:
            print(f" Failed to retrieve BOM. Status code: {response.status_code}")
            return

        bom_data = response.json()

        # Get folder name from BOM JSON
        assembly_name, version_name = get_assembly_name_and_version(bom_data)
        folder_name = f"{assembly_name}_{version_name}_Thumbnails"
        print(f" Thumbnails will be saved in: {folder_name}")

        # Loop through BOM rows
        for row in bom_data.get("rows", []):
            thumb_info = row.get('itemSource', {}).get('thumbnailInfo', {})
            thumbnail_url = next((s['href'] for s in thumb_info.get('sizes', []) if s['size'] == '300x300'), None)

            if thumbnail_url:
                filename = row['headerIdToValue'].get("57f3fb8efa3416c06701d60f", "default")
                download_thumbnail(thumbnail_url, filename, save_folder=folder_name, auth=auth)
            else:
                print(" No 300x300 thumbnail found for a row.")

        input(" Done. Press Enter to exit...")

    except Exception as e:
        print(f" Unexpected error: {e}")
        input("Press Enter to exit...")

# --- Entry Point ---
if __name__ == "__main__":
    main()
