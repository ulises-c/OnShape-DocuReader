# What is this file?

Contains an ordered list of bugs and features that should be added or fixed.
Not sorted in any particular order.
The numbering is just show that it's easier to keep track.

## Instructions for Agent & LLM

1. Read `INSTRUCTIONS.md`

# TODO Section

1. Enhance BOM to CSV procedure
   1. Extract filtered BOM
      1. Currently: Extracts flattened BOM
      2. Goal: Extract flattened BOM, with columns filtered by headers, and rows filtered by contents in column (e.g. {"part name": ["PRT", "ASM"]})
   2. Replace calls to getCSV (deprecated) with bomToCSV
      1. Then delete getCSV
   3. Implement massCSVExporter
      1. Exports flattened CSV with default filtering options
   4. Implement user based filtering
      1. Instead of static filtering, allow checkboxes so that a user can define what the columns/rows should be filtered by
2. Indicators for downloads
   1. bomToCSV takes a while to download and nothing indicates if the download is working as intended or not
   2. May need to implement detailed API usage to track
3. Detailed API usage (keep track per session)
   1. Create infrastructure to later on keep track across sessions
   2. Partially worked on. API call functions were added. Now further implementation is needed (e.g.: visualize the tokens, or announce in console, create usage tracker file, per user & overall)
4. Fix BUG - Clicking child elements in detailed view does not work as intended
   1. Supposed to open up something similar to detailed view, but a child element specific view. Currently does nothing
   2. May be out of scope for this project
5. Update detailed view
   1. The child documents (the other clickable tiles within a document), should also be updated to have a cleaner layout.
   2. Investigate why "Load Hierarchy Details" returns "No parent hierarchy available" even though there is a parent ID
   3. Go through documents and OnShape v12 API to understand document structure and other important things from the API
6. Update what `get all`, `get selected` `get document` does
   1. To maintain consistency files should automatically be downloaded to a set folder
      1. `~/OnShape-DocuReader/database/`
   2. Change how the download structure
      1. Understand the draw backs of the current structure
         1. Currently the options are a single JSON file, or a ZIP with organized folders
      2. I want a clean and organized folder structure, with the option to zip it, something like the following:
         1. 1 Large JSON file that is an overview of what was downloaded
            1. This overview file should have hashes for each file (and whatever nested structure there is for a document) or some way to check that what is currently downloaded is up to date
         2. Folders for each document downloaded
            1. Folder should have JSONs for each item downloaded, and their child element JSONs
            2. Thumbnails should also be downloaded within this folder (if selected)
   3. Implement image/thumbnail downloading
7. Fix TODO in `public/js/controllers/document-controller.js`
8. Add page navigation for the main page, currently limited to 20 most recently edited documents.
9. Grab all folders via `globaltreenodes`, for root directory it's found via `https://cad.onshape.com/api/globaltreenodes/magic/1` and for more information of folders with a folder ID `fid` more information is found via `https://cad.onshape.com/api/globaltreenodes/folder/[fid]`
   1. Building on `globaltreenodes`, refresh the main page, split it into `Recently Updated` and `Workspace`, workspace contains all the folders in root, and clicking into the folder should retreive all the files in that folder (same process for nested folders)
   2. Caching via database should also be implemented to reduce API calls and have a more populated database instead of having to retreive data every time.
   3. Pagination should be reworked. Instead of retreiving latest worked documents, documents should be retreived by folders, using tree nodes.
10. Implement caching (redis?) and a longer term database (sql?)
