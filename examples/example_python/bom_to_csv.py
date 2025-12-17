import requests 
import csv
import json
import os

#Assemble the URL for the API call 
api_url = ""

csv_output = "bom_parts_with_versions.csv"

#Use the keys from the developer portal
access_key = ""
secret_key = ""
AUTH = ()

HEADERS = {
    'Accept': 'application/json;charset=UTF-8; qs=0.09',
    'Content-Type': 'application/json'
}

METADATA_BASE_URL = "https://cad.onshape.com/api/v10/metadata"

def build_bom_api_url_from_version_link(version_link):
    try:
        parts = version_link.strip().split('/')
        doc_index = parts.index("documents")
        document_id = parts[doc_index + 1]
        version_id = parts[doc_index + 3]  # since it's '/v/{versionId}'
        element_id = parts[doc_index + 5]

        bom_api_url = (
            f"https://cad.onshape.com/api/v10/assemblies/d/{document_id}/v/{version_id}/e/{element_id}/bom"
            "?indented=false&generateIfAbsent=false&onlyVisibleColumns=false"
            "&ignoreSubassemblyBomBehavior=false&includeItemMicroversions=true"
            "&includeTopLevelAssemblyRow=false&thumbnail=false"
        )

        return bom_api_url

    except Exception as e:
        print(f"Error parsing versioned Onshape link: {e}")
        return None


# --- Functions ---
def fetch_bom():
    response = requests.get(api_url, auth=AUTH, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to retrieve BOM. Status code: {response.status_code}")


def get_metadata_name(view_href):
    """Convert a viewHref URL to a metadata API call and return the 'value' of the 'Name' property."""
    try:
        # Extract doc ID and version ID from viewHref
        parts = view_href.split('/')
        doc_index = parts.index('documents')
        doc_id = parts[doc_index + 1]
        version_id = parts[doc_index + 3]

        metadata_url = f"{METADATA_BASE_URL}/d/{doc_id}/v/{version_id}"
        params = {
            "inferMetadataOwner": "false",
            "depth": 1,
            "includeComputedProperties": "true",
            "includeComputedAssemblyProperties": "false",
            "thumbnail": "false"
        }

        response = requests.get(metadata_url, auth=AUTH, headers=HEADERS, params=params)
        if response.status_code != 200:
            print(f"Failed metadata call for {doc_id}. Status code: {response.status_code}")
            return "Unknown"

        metadata = response.json()

        #Extract the 'value' of the property named 'Name'
        for prop in metadata.get("properties", []):
            if prop.get("name") == "Name":
                return prop.get("value", "Unnamed")

        return "Unnamed"

    except Exception as e:
        print(f"Metadata fetch error: {e}")
        return "Error"


def extract_part_and_metadata(json_data):
    parts = []
    for row in json_data.get("rows", []):
        header = row.get("headerIdToValue", {})
        view_href = row.get("itemSource", {}).get("viewHref", "")

        part_number = header.get("57f3fb8efa3416c06701d60f", "N/A")
        version_name = get_metadata_name(view_href)

        parts.append({
            "Part Number": part_number,
            "Version Name": version_name
        })

    return parts


def get_assembly_name_and_version(json_data):
    doc_name = json_data.get("bomSource", {}).get("document", {}).get("name", "Assembly")
    version_name = json_data.get("bomSource", {}).get("version", {}).get("name", "v1")
    return doc_name, version_name


def save_to_csv(data, assembly_name, version_name):
    filename = f"{assembly_name}_{version_name}_partversionnumbers.csv"
    filepath = os.path.join(os.getcwd(), filename)

    if os.path.exists(filepath):
        os.remove(filepath)
        print(f"Existing file '{filename}' deleted.")

    with open(filepath, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=["Part Number", "Version Name"])
        writer.writeheader()
        writer.writerows(data)

    print(f"CSV saved to: {filepath}")


# --- Main ---
def main():
    try:
        global api_url, AUTH

        versioned_link = input("Enter the Onshape URL Link of the VERSIONED ASSEMBLY here:").strip()
        access_key = input("Enter your Onshape Access Key here:").strip()
        secret_key = input("Enter your Onshape Secret Key here:").strip()

        AUTH = (access_key, secret_key)
        api_url = build_bom_api_url_from_version_link(versioned_link)

        if not api_url:
            print("Invalid Onshape Link. Please ensure it includes '/v/versionID/'.")
            return

        bom_json = fetch_bom()
        parts = extract_part_and_metadata(bom_json)
        assembly_name, version_name = get_assembly_name_and_version(bom_json)
        save_to_csv(parts, assembly_name, version_name)

    except Exception as e:
        print(f"Error: {e}")

    input("Press enter to Exit...")


if __name__ == "__main__":
    main()