# What is this file?

Contains an ordered list of bugs and features that should be added or fixed.
Not sorted in any particular order.
The numbering is just show that it's easier to keep track.

## Instructions for Agent & LLM

1. Read `INSTRUCTIONS.md`

# TODO Section

1. Indicators for downloads
   1. bomToCSV takes a while to download and nothing indicates if the download is working as intended or not
   2. May need to implement detailed API usage to track
2. Detailed API usage (keep track per session)
   1. Create infrastructure to later on keep track across sessions
   2. Partially worked on. API call functions were added. Now further implementation is needed (e.g.: visualize the tokens, or announce in console, create usage tracker file, per user & overall)
3. Fix BUG - Clicking child elements in detailed view does not work as intended
   1. Supposed to open up something similar to detailed view, but a child element specific view. Currently does nothing
   2. May be out of scope for this project
4. Update detailed view
   1. The child documents (the other clickable tiles within a document), should also be updated to have a cleaner layout.
   2. Investigate why "Load Hierarchy Details" returns "No parent hierarchy available" even though there is a parent ID
   3. Go through documents and OnShape v12 API to understand document structure and other important things from the API
5. Fix TODO in `public/js/controllers/document-controller.js`
6. Grab all folders via `globaltreenodes`, for root directory it's found via `https://cad.onshape.com/api/globaltreenodes/magic/1` and for more information of folders with a folder ID `fid` more information is found via `https://cad.onshape.com/api/globaltreenodes/folder/[fid]`
   1. Caching via database should also be implemented to reduce API calls and have a more populated database instead of having to retreive data every time.
   2. Pagination should be reworked. Instead of retreiving latest worked documents, documents should be retreived by folders, using tree nodes.
7. Implement caching (redis?) and a longer term database (sql?)
8. Enhance UI during pre-scan
   1. Ability to cancel scan
      1. If partially scanned and canceled ability to continue from last data point
   2. Show live/current stats (total folders scanned, total files found, total file types (assembly, part studio, etc.), current scan directory (absolute path, not relative), total time elapsed during scan)
   3. Since `globaltreenodes/magic` already provides directories in root adding a nice way to visualize parent directory status would be ideal (scanned, scanning, upcoming, ignored, etc.)
9. Double check time-out policy on authentication via `.sessions.json`. May need to extend considering exports take a while.
   1. What I do know is the full export caused me to no longer have access. `Access denied`. May be due to rate limit or some other feature.
      1. Seems to be 24 hours - 1 millisecond (23 hours, 59 minutes, 59.999 seconds), so it's not that.
10. In AggregateBOM, at the end of the export and in the report, list which assemblies failed to export
11. Close button not working in "Get All"
12. Document-detail view "Copy Raw JSON" doing multiple API calls for a single "copy raw json" action
    1. Not Just "Copy Raw JSON" but also "Download BOM CSV" or "Download BOM JSON"
    2. Seems to be exactly 8 times since an original is downloaded and 7 copies are also downloaded
       1. Might be incremented per click done on element buttons
13. Enhance BOM extraction JSON
    1. Add an extra API call for the BOM that gets the version name
    2. In bomSource there is a viewHref, document
14. Integrate AirTable into the OnShape-DocuReader project.
    1. TODO: View bases/tables list (currently uses env config defaults)
    2. TODO: Display Airtable user info (name, email) in upload view
    3. TODO: Better progress tracking of matching & uploading thumbnails phase
15. Dynamic API call throttling (e.g. 5 req/sec for Airtable)
16. Investigate why there are duplicate thumbnails
    1. Seems to be OnShape feature restriction. OnShape takes a snapshot of a part studio. So with multiple parts it gets the same snapshot for the parts shared in that part studio
17. Investigate duplicate file downloads
    1. Am I doing multiple API calls?
    2. Bind a button to a single action. Clicking multiple times does nothing.
    3. The best way to do this is clicking a button (e.g. "Full Extract") opens a new view. This view has progress stats and other things related.
    4. Add the ability to cancel a download.
18. OnShape Export & Airtable Upload progress tracking
    1. Shows duplicate for progress
    2. Does not track correctly either. Everything is at 287/287

```sh
[0] [AirtableThumbnail] Uploading to record recducdKVOftEaDfW, field: "CAD_Thumbnail"
[0] [Airtable API] Uploading attachment via direct base64 upload
[0] [Airtable API]   Base: app1Jrt1BZQs1aVGH, Table: tblWkibasR7pAyxe1, Record: recducdKVOftEaDfW
[0] [Airtable API]   Field Name: CAD_Thumbnail, Filename: PRT-001063_D02-Cradle_Small_Knob_Optical_Sensor_Holder.png
[0] [Airtable API]   Content-Type: image/png, Size: 15842 bytes
[0] [Airtable API] POST https://content.airtable.com/v0/app1Jrt1BZQs1aVGH/recducdKVOftEaDfW/CAD_Thumbnail/uploadAttachment
[0] [Airtable API]   Base64 length: 21124 characters
[0] [Airtable API] Upload successful, record updated
[0] [AirtableThumbnail] Uploaded "thumbnails/PRT-001063_D02-Cradle_Small_Knob_Optical_Sensor_Holder.png" to record recducdKVOftEaDfW
[0] [Airtable API] Progress: 287/287 (uploading)
[0] [Airtable API] Progress: 287/287 (uploading)
[0] [AirtableThumbnail] Uploading to record recm2h27HCk03MVai, field: "CAD_Thumbnail"
[0] [Airtable API] Uploading attachment via direct base64 upload
[0] [Airtable API]   Base: app1Jrt1BZQs1aVGH, Table: tblWkibasR7pAyxe1, Record: recm2h27HCk03MVai
[0] [Airtable API]   Field Name: CAD_Thumbnail, Filename: PRT-001066_LoadCell_MicroBeam_Forsentek_1dof_2to10kg_FMZC.png
[0] [Airtable API]   Content-Type: image/png, Size: 12619 bytes
[0] [Airtable API] POST https://conten
```
