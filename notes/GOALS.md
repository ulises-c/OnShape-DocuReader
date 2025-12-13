# Goals for this application

1. Mass export data about parts (OnShape Export)
   1. Easiest way to do this seems to be to manually crawl through each document and then download BOMs for each assembly found
   2. A large unfiltered JSON seems to be an easy way to export
   3. Next is to create CSV and filter columns/rows based on certain criteria
   4. Filter out results based on which folder they're in
   5. Visual progress for pre-scan and mass-export
2. Individual BOM "Full Extraction" (OnShape Export)
   1. Grab an assembly, export BOM (JSON/CSV), grab thumbnails for all parts in BOM
3. Individual BOM "Full Import" (AirTable Import)
   1. Given the data from "Full Extraction" add the option to import to AirTable
      1. Match AirTable part numbers to OnShape, then upload matching thumbnails.
      2. At the moment, do not add extra parts, but leave option to do so.
4. Low API usage
   1. Cache somethings (e.g. refreshing a page just a few minutes later shouldn't do an entire new GET)
      1. Add a button to force refresh (clear cache)
   2. Track API usage
5. Security
   1. Using OAuth to sign-in and store cookies for X amount of hours

## Strech Goals

1. File explorer and details about documents
2. Periodic automated mass-export
   1. Maybe only download assembly BOM if it hasn't been updated compared to cached/stored version
3. Customized mass-exporter (aggregate & containerized)
   1. Container-ized
      1. Exports a zip, where in there is the entire hierachical folder structure with individual JSON & CSV files for each document (assemblies only?)
