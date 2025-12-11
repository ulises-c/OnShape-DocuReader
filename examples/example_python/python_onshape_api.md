This document contains guidance, code snippets, setup instructions, and final scripts related to using the **Onshape API** for bill of materials (BOM) data extraction and thumbnail downloading. Please follow each section in order to fully configure your environment and understand the purpose of the tools provided.

### Table of Contents:

### 1\. Overview

These Python scripts leverage the Onshape REST API to:

- **Script 1**: Export part numbers and version names from an Onshape assembly BOM to a CSV.
- **Script 2**: Download **300x300 thumbnail images** for each part in an Onshape assembly.

These scripts are built for use with versioned Onshape assembly links and assume valid developer access to the Onshape API.

### 2\. Setup Instructions

1.  Install VS Code

Download and install: [https://code.visualstudio.com/](https://code.visualstudio.com/ "https://code.visualstudio.com/")

Optional extensions:

- Python (by Microsoft)
- .env support (optional)

2.  Python Environment Set-up

Install Python from [Download Python](https://www.python.org/downloads/)

Follow the instructions here to setup python environment in VS Code here: [https://code.visualstudio.com/docs/python/python-tutorial](https://code.visualstudio.com/docs/python/python-tutorial "https://code.visualstudio.com/docs/python/python-tutorial")

3.  Install Required Libraries and Packages:

In VS Code, open a terminal and run:

```bash
pip install requests
```

### 3\. Onshape API Keys:

- Sign in to the Onshape Developer Portal: [App Store - Onshape](https://dev-portal.onshape.com/keys)

- Go to API keys and press Create new Api key to Generate your **Access Key** and **Secret Key**.

- Save your access key and secret key somewhere on your device. Never share keys publicly. Treat them like passwords.

💡 Access and secret keys can be included in the scripts for development purposes. To create scripts and executable files to be shared with the team, remove the keys from the scripts and instead prompt the user to input their keys. For scripts 1 and 2, you'll be prompted to enter your API credentials.

### 4\. Onshape API and Glassworks info:

- Read Onshape API documentation and go through the video courses to get an idea of how it works here: [Introduction to the Onshape REST API](https://onshape-public.github.io/docs/api-intro/)
- How the quick start code works: [Quick Start](https://onshape-public.github.io/docs/api-intro/quickstart/) , Public Document example:[Onshape](https://cad.onshape.com/documents/e60c4803eaf2ac8be492c18e/w/d2558da712764516cc9fec62/e/6bed6b43463f6a46a37b4a22)

In this example, the purpose here is to get information on the public document example above:

1.  Go to the Glassworks explorer section and find the documents section[Glassworks API Explorer](https://cad.onshape.com/glassworks/explorer/#/) :

2.  Expand on the desired API call which is the endpoint GET Retrieve document by document id

3.  Copy and Paste the Onshape public document above into the Onshape URL section and press Auto-fill then execute

4.  a. The requested URL for this API call is given in the picture above which is: Base URL (always the same communicating to onshape Servers) “`https://cad.onshape.com/api/v10`" + Fixed URL which in this case is /documents/{did} “`/documents/e60c4803eaf2ac8be492c18e`". This results to Requested URL = “`https://cad.onshape.com/api/v10/documents/e60c4803eaf2ac8be492c18e`"

b. Make note of the json response from the api call to get the required information from the script

c. Make note of the media type for the header of the api call, in this case it is : “application/json;charset=UTF-8; qs=0.09”

5.  Now we are ready to write the script and run it shown below:

- Run the Quick start snippet code successfully while understanding how the code works, the code should return `"Onshape API Guide"`

```py
import requests
import json

# Assemble the URL for the API call
api_url = "https://cad.onshape.com/api/v10/documents/e60c4803eaf2ac8be492c18e"

# Optional query parameters can be assigned
params = {}

# Use the keys from the developer portal
access_key = "ACCESS_KEY"
secret_key = "SECRET_KEY"

# Define the header for the request
headers = {'Accept': 'application/json;charset=UTF-8;qs=0.09',
           'Content-Type': 'application/json'}

# Putting everything together to make the API request
response = requests.get(api_url,
                        params=params,
                        auth=(access_key, secret_key),
                        headers=headers)

# Convert the response to formatted JSON and print the `name` property
print(json.dumps(response.json()["name"], indent=4))

```

- Head over to the Glassworks API Explorer to go through all the API Endpoints: [Glassworks API Explorer](https://cad.onshape.com/glassworks/explorer/#/)
- Test a few API calls using the Galssworks and try to reproduce them in VS Code to solidify understanding

### 5\. Script 1: Export Part Number + Their Respective Versions (of An Assembly) into a CSV

What it does and How it works:

1.  When the script is run, it asks the user to input the versioned assembly link to run the script on, it then asks the user to input their access key and then finally their secret key

2.  Next, it transforms the assembly link into an api call URL to get the bill of materials of this assembly using the function build_bom_api_url_from_version_link

c. From the Glassworks page and putting the versioned link we get this Requested URL: `https://cad.onshape.com/api/v10/assemblies/d/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/16d4c51863440c36a4c6cc52/bom?indented=true&multiLevel=false&generateIfAbsent=false&includeItemMicroversions=false&includeTopLevelAssemblyRow=false&thumbnail=false`

d. So we need to extract the {did}, {vid}, and {eid} from the versioned link, and replace them in tthe requested URL for every new input link.

e. If it is an error that means it is **NOT A VERSIONED ASSEMBLY LINK. MAKE SURE IT IS A VERSION.**

3.  We are now ready to call the fet_bom function which calls the Bill of Materials API: This function will return the Bill of materials in a json format. The json returned can be viewed in the Glassworks once executed. The auth variable which is a combination of the access and secret keys as well as the header values are initialized in the beginning of the script which is shown in the end of this document.

4.  This function parses through the json BOM and for every row extracts the part number and it’s associated version number. The part numbers of all parts can be accessed through the BOM but not their version. So we will call on another METADATA API for each part using the get_metadata_name Function also show below. It will use the view_href link to get the Requested URL for the API call which is found in the Glassworks shown below, parse through the json to find where the version number lies and extract that.

Bom_json body example:

```json
 {
      "itemSource": {
        "fullConfiguration": "default",
        "viewHref": "https://cad.onshape.com/documents/b1ccc492931eb2b5e91cd69c/v/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee?configuration=default",
        "configuration": "default",
        "documentId": "b1ccc492931eb2b5e91cd69c",
        "elementId": "aad897b274c5831712b910ee",
        "partId": "",
        "wvmType": "v",
        "wvmId": "27bc59a840ecccd079af0dab",
        "href": "https://cad.onshape.com/api/assemblies/d/b1ccc492931eb2b5e91cd69c/v/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee?configuration=default",
        "isStandardContent": false,
        "sourceElementMicroversionId": "9c6cca5afdbfa22a9acaf05a"
      },
      "rowId": "3e7adea2d249657a30eacd6c",
      "indentLevel": 0,
      "relatedOccurrences": [
        "MFoTRFSHmbPpd3QTz.MQLPVKIlmGPWM8N24"
      ],
      "headerIdToValue": {
        "57f3fb8efa3416c06701d617": null,
        "57f3fb8efa3416c06701d628": null,
        "57f3fb8efa3416c06701d618": null,
        "57f3fb8efa3416c06701d60d": "MotherBoard_ASUS-Pro-WS-W790-SAGE-SE",
        "57f3fb8efa3416c06701d61e": false,
        "57f3fb8efa3416c06701d60e": "MotherBoard, ASUS, Pro WS W790 SAGE SE",
        "57f3fb8efa3416c06701d60c": "N/A",
        "57f3fb8efa3416c06701d61d": false,
        "57f3fb8efa3416c06701d60f": "ASM-000333",
        "5ace8269c046ad612c65a0ba": "2",
        "57f3fb8efa3416c06701d615": "N/A",
        "57f3fb8efa3416c06701d626": "0.8 kg",
        "57f3fb8efa3416c06701d616": "90MB1C20-M0AAY0",
        "57f3fb8efa3416c06701d627": null,
        "5ace8269c046ad612c65a0bb": "N/A",
        "57f3fb8efa3416c06701d613": null,
        "5ace84d3c046ad611c65a0dd": 1,
        "57f3fb8efa3416c06701d614": null,
        "57f3fb8efa3416c06701d625": [
```

The first viewhref in the BOM for example is the mother board assembly: `https://cad.onshape.com/documents/b1ccc492931eb2b5e91cd69c/v/27bc59a840ecccd079af0dab/e/aad897b274c5831712b910ee?configuration=default`

Test the metadata request URL for individual parts in the Glassworks with the link above we get the requested URL and the json response body where we can see the version number of the part/assembly:

So we build out the get_metadata_name function here:

We now have a list of all the part/Assembly numbers and their associated versions in a variable called parts

1.  Next we will use the function get_assembly_name_and_version to save the file to a csv with it’s associated assembly name and version number as file name. This information is found in the bom json response

2.  Finally, we save the list of part number and their versions to a csv with the save_to_csv function

3.  Press enter to exit script and you will find the csv file from the same directory as wehre the script was run

### 6\. Script 2: Extract all Thumbnails of parts and Assemblies in a Versioned assembly and save them to a folder

What it does and How it works:

1.  When the script is run, it asks the user to input the versioned assembly link to run the script on, it then asks the user to input their access key and then finally their secret key

2.  Next, it transforms the assembly link into an api call URL to get the bill of materials of this assembly using the function build_bom_api_url (Reasoning and details in script 1)

3.  Next, the BOM api call is requested in line 78 and converts it to a readable json
4.  Next, the assembly and version name of the BOM is retrieved from the json to name the folder where all the thumbnails will be saved

Using the same example link from script 1:

The json response last row gives name and version of the BOM:

```json
 "bomSource": {
    "viewHref": "https://cad.onshape.com/documents/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/16d4c51863440c36a4c6cc52?configuration=current",
    "version": {
      "id": "5c5d737b2946d5898b27a9c2",
      "name": "V130"
    },
    "document": {
      "id": "0f0a03f39e2b0f4e29330f44",
      "name": "D01-Cart"
    },
    "element": {
      "configuration": "current",
      "headerIdToValue": {
        "57f3fb8efa3416c06701d617": null,
        "57f3fb8efa3416c06701d628": null,
        "57f3fb8efa3416c06701d618": null,
        "57f3fb8efa3416c06701d60d": "D01-Cart_Base",
        "57f3fb8efa3416c06701d61e": false,
        "57f3fb8efa3416c06701d60e": "D01 Cart, Base",
        "57f3fb8efa3416c06701d60c": null,
        "57f3fb8efa3416c06701d61d": false,
        "57f3fb8efa3416c06701d60f": "ASM-000309",
        "5ace8269c046ad612c65a0ba": null,
        "57f3fb8efa3416c06701d615": null,
        "57f3fb8efa3416c06701d626": null,
        "57f3fb8efa3416c06701d616": null,
        "57f3fb8efa3416c06701d627": null,
        "5ace8269c046ad612c65a0bb": "Auto",
        "57f3fb8efa3416c06701d613": null,
        "5ace84d3c046ad611c65a0dd": null,
        "57f3fb8efa3416c06701d614": null,
        "57f3fb8efa3416c06701d625": [
          {
            "memberCategoryIds": [
              "5877a03ebe4c21163b49dce3"
            ],
            "memberCategories": [
              {
                "ownerType": 2,
                "description": "Category created by upgrade",
                "ownerId": "556f3109e4b00b3fee9a3f4a",
                "objectTypes": [
                  3
                ],
                "publishState": 1,
                "defaultObjectType": 3,
                "id": "5877a03ebe4c21163b49dce3",
                "name": "Onshape Assembly",
                "href": null
              }
            ],
            "ownerType": 1,
            "description": "Default category for object type Assembly",
            "ownerId": "65d6514f4470995a28a8386a",
            "objectTypes": [
              3
            ],
            "publishState": 1,
            "defaultObjectType": 3,
            "id": "65d651504470995a28a838ee",
            "name": "Assembly",
            "href": null
          }
        ],
        "57f3fb8efa3416c06701d633": "Show Assembly and components",
        "57f3fb8efa3416c06701d611": "In progress",
        "57f3fb8efa3416c06701d612": null,
        "57f3fb8efa3416c06701d623": "Each",
        "57f3fb8efa3416c06701d610": null
      },
      "id": "16d4c51863440c36a4c6cc52",
      "name": "D01-Cart_Base"
    },
    "thumbnailInfo": {
      "sizes": [
        {
          "sheetName": "",
          "size": "600x340",
          "uniqueId": "",
          "mediaType": "image/png",
          "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/600x340",
          "viewOrientation": "",
          "renderMode": ""
        },
        {
          "sheetName": "",
          "size": "300x300",
          "uniqueId": "",
          "mediaType": "image/png",
          "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/300x300",
          "viewOrientation": "",
          "renderMode": ""
        },
        {
          "sheetName": "",
          "size": "70x40",
          "uniqueId": "",
          "mediaType": "image/png",
          "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/70x40",
          "viewOrientation": "",
          "renderMode": ""
        },
        {
          "sheetName": "",
          "size": "300x170",
          "uniqueId": "",
          "mediaType": "image/png",
          "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/300x170",
          "viewOrientation": "",
          "renderMode": ""
        }
      ],
      "secondarySizes": [],
      "id": "4146717b6fb626f112878bcf15c3b2154a923710",
      "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710?t=1746490015559"
    },
    "href": "https://cad.onshape.com/api/assemblies/d/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/16d4c51863440c36a4c6cc52?configuration=current"
  },
  "type": "multiLevel",
  "createdAt": "2025-05-14T18:57:06.300Z",
  "topLevelAssemblyRow": {
    "itemSource": {
      "viewHref": "https://cad.onshape.com/documents/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/16d4c51863440c36a4c6cc52?configuration=default",
      "configuration": "default",
      "documentId": "0f0a03f39e2b0f4e29330f44",
      "elementId": "16d4c51863440c36a4c6cc52",
      "partId": "",
      "wvmType": "v",
      "wvmId": "5c5d737b2946d5898b27a9c2",
      "sourceElementMicroversionId": "c6b6dbd3e76a299bf0916fcb",
      "href": "https://cad.onshape.com/api/assemblies/d/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/16d4c51863440c36a4c6cc52",
      "isStandardContent": false,
      "thumbnailInfo": {
        "sizes": [
          {
            "sheetName": "",
            "size": "600x340",
            "uniqueId": "",
            "mediaType": "image/png",
            "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/600x340",
            "viewOrientation": "",
            "renderMode": ""
          },
          {
            "sheetName": "",
            "size": "300x300",
            "uniqueId": "",
            "mediaType": "image/png",
            "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/300x300",
            "viewOrientation": "",
            "renderMode": ""
          },
          {
            "sheetName": "",
            "size": "70x40",
            "uniqueId": "",
            "mediaType": "image/png",
            "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/70x40",
            "viewOrientation": "",
            "renderMode": ""
          },
          {
            "sheetName": "",
            "size": "300x170",
            "uniqueId": "",
            "mediaType": "image/png",
            "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710/s/300x170",
            "viewOrientation": "",
            "renderMode": ""
          }
        ],
        "secondarySizes": [],
        "id": "4146717b6fb626f112878bcf15c3b2154a923710",
        "href": "https://cad.onshape.com/api/thumbnails/4146717b6fb626f112878bcf15c3b2154a923710?t=1746490015559"
      },
      "versionMetadataWorkspaceMicroversionId": "c6b6dbd3e76a299bf0916fcb"
    },
    "rowId": "d9719ee3896b8b61c5790fbb",
    "indentLevel": 0,
    "relatedOccurrences": [
      "assemblyRoot"
    ],
    "headerIdToValue": {
      "57f3fb8efa3416c06701d617": null,
      "57f3fb8efa3416c06701d628": null,
      "57f3fb8efa3416c06701d618": null,
      "57f3fb8efa3416c06701d60d": "D01-Cart_Base",
      "57f3fb8efa3416c06701d61e": false,
      "57f3fb8efa3416c06701d60e": "D01 Cart, Base",
      "57f3fb8efa3416c06701d60c": "N/A",
      "57f3fb8efa3416c06701d61d": false,
      "57f3fb8efa3416c06701d60f": "ASM-000309",
      "5ace8269c046ad612c65a0ba": "D01-Cart_Base",
      "57f3fb8efa3416c06701d615": "N/A",
      "57f3fb8efa3416c06701d626": null,
      "57f3fb8efa3416c06701d616": null,
      "57f3fb8efa3416c06701d627": null,
      "5ace8269c046ad612c65a0bb": "N/A",
      "57f3fb8efa3416c06701d613": null,
      "5ace84d3c046ad611c65a0dd": 1,
      "57f3fb8efa3416c06701d614": null,
      "57f3fb8efa3416c06701d625": [
```

1.  Next, to download thumbnail image for each part, we will loop through each row (line 91) in the json and extract the href link in the thumbnail info for 300x300 size. The link correponds to the requested url for this specific thumbnail of the part in this row. The json below corresponds to the first row

```json
{
  "rows": [
    {
      "itemSource": {
        "fullConfiguration": "default",
        "viewHref": "https://cad.onshape.com/documents/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/ba0185b9e40b7bc4960e8dfa?configuration=default",
        "configuration": "default",
        "documentId": "0f0a03f39e2b0f4e29330f44",
        "elementId": "ba0185b9e40b7bc4960e8dfa",
        "partId": "",
        "wvmType": "v",
        "wvmId": "5c5d737b2946d5898b27a9c2",
        "sourceElementMicroversionId": "f54a63907ee7c6d1de8f0b57",
        "href": "https://cad.onshape.com/api/assemblies/d/0f0a03f39e2b0f4e29330f44/v/5c5d737b2946d5898b27a9c2/e/ba0185b9e40b7bc4960e8dfa?configuration=default",
        "isStandardContent": false,
        "thumbnailInfo": {
          "sizes": [
            {
              "sheetName": "",
              "size": "600x340",
              "uniqueId": "",
              "mediaType": "image/png",
              "href": "https://cad.onshape.com/api/thumbnails/8dca2c673f5b12d50a42caa1637383a2893367a4/s/600x340",
              "viewOrientation": "",
              "renderMode": ""
            },
            {
              "sheetName": "",
              "size": "300x300",
              "uniqueId": "",
              "mediaType": "image/png",
              "href": "https://cad.onshape.com/api/thumbnails/8dca2c673f5b12d50a42caa1637383a2893367a4/s/300x300",
              "viewOrientation": "",
              "renderMode": ""
            },
            {
              "sheetName": "",
              "size": "70x40",
              "uniqueId": "",
              "mediaType": "image/png",
              "href": "https://cad.onshape.com/api/thumbnails/8dca2c673f5b12d50a42caa1637383a2893367a4/s/70x40",
              "viewOrientation": "",
              "renderMode": ""
            },
            {
              "sheetName": "",
              "size": "300x170",
              "uniqueId": "",
              "mediaType": "image/png",
              "href": "https://cad.onshape.com/api/thumbnails/8dca2c673f5b12d50a42caa1637383a2893367a4/s/300x170",
              "viewOrientation": "",
              "renderMode": ""
            }
          ],
          "secondarySizes": [],
          "id": "8dca2c673f5b12d50a42caa1637383a2893367a4",
          "href": "https://cad.onshape.com/api/thumbnails/8dca2c673f5b12d50a42caa1637383a2893367a4?t=1746489990797"
        },
        "versionMetadataWorkspaceMicroversionId": "f54a63907ee7c6d1de8f0b57"
      },
      "rowId": "af8b30194ebb2966b680277d",
      "indentLevel": 0,
      "relatedOccurrences": [
        "Mz5C6h0svDOuUhVZZ"
      ],
      "headerIdToValue": {
        "57f3fb8efa3416c06701d617": null,
        "57f3fb8efa3416c06701d628": null,
        "57f3fb8efa3416c06701d618": null,
        "57f3fb8efa3416c06701d60d": "D01-Cart_ChassisAsm",
        "57f3fb8efa3416c06701d61e": false,
        "57f3fb8efa3416c06701d60e": "D01 Cart, Chassis Assembly",
        "57f3fb8efa3416c06701d60c": "N/A",
        "57f3fb8efa3416c06701d61d": false,
        "57f3fb8efa3416c06701d60f": "ASM-000310",
        "5ace8269c046ad612c65a0ba": "1",
        "57f3fb8efa3416c06701d615": "N/A",
        "57f3fb8efa3416c06701d626": "31.894 kg",
        "57f3fb8efa3416c06701d616": null,
        "57f3fb8efa3416c06701d627": null,
        "5ace8269c046ad612c65a0bb": "N/A",
        "57f3fb8efa3416c06701d613": null,
        "5ace84d3c046ad611c65a0dd": 1,
        "57f3fb8efa3416c06701d614": null,
        "57f3fb8efa3416c06701d625": [
          {
            "memberCategoryIds": [
```

2.  Then the download thumbnail function is executed to call on the thumbnail api end point for each row

### 7\. Python Scripts:

Script 1 - `bom_to_csv.py`:

```py
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
```

Script 2 - `extract_thumbnails.py`:

```py
import requests
import os

# --- Constants ---
HEADERS_JSON = {'Accept': 'application/json;charset=UTF-8; qs=0.09', 'Content-Type': 'application/json'}
HEADERS_IMAGE = {'Accept': 'image/*'}
BASE_BOM_URL = "https://cad.onshape.com/api/v10/assemblies"

# --- User Input ---
def get_user_input():
    link = input("Paste your versioned Onshape assembly link: ").strip()
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
```
