# What is this file?

Contains an ordered list of bugs and features that should be added or fixed.
Not sorted in any particular order.
The numbering is just show that it's easier to keep track.

## Instructions for Agent & LLM

1. Read `INSTRUCTIONS.md`
2. **When completing TODO items:**
   1. Complete the actual task/implementation
   2. Move the completed item from `TODO` section to `DONE.md`
   3. Update `notes/HISTORY.md` following its specific instructions (append to existing `[not committed]` section)
   4. Preserve the original numbering and sub-item structure when moving items
3. **When adding new TODO items:**
   1. Add to the `TODO` section with the next sequential number
   2. Use clear, actionable language
   3. Break down complex tasks into numbered sub-items when appropriate
4. **Completion criteria:** A TODO item is considered complete when:
   1. All code changes are implemented and functional
   2. Any related documentation is updated
   3. The feature/fix works as intended (manual verification recommended)

# TODO Section

1. Detailed API usage (keep track per session)
2. Automatic redirect after signing in
3. Update detailed view
   1. The child documents (the other clickable tiles within a document), should also be updated to have a cleaner layout.
   2. Investigate why "Load Hierarchy Details" returns "No parent hierarchy available" even though there is a parent ID
   3. Go through documents and OnShape v12 API to understand document structure and other important things from the API
4. Update what `get all`, `get selected` `get document` does
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
5. Fix TODO in `public/js/controllers/document-controller.js`

# ✅ DONE

See `DONE.md`
