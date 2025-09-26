# What is this file?

Contains an ordered list of bugs and features that have been be added or fixed.
Not sorted in any particular order.
The numbering is just show that it's easier to keep track.

# ✅ DONE

1. Update the list view (default view)
   1. Add selection boxes
   2. Add a "get selected" button to complement the "get all" button
2. Update detailed view
   1. Add a "copy raw json" button
   2. Remove the `Creator` field, will be merged with `Created`
   3. Adjust the following fields:
      1. `Created` (currently unknown, but list view shows creator) and add in `creator`, example:
         1. 2024-Sep-16, 3:59:08 PM [John Smith]
      2. `Modified` should also have a similar output
         1. 2025-Jun-02, 3:59:08 PM [John Smith]
   4. Add the following fields:
      1. `notes`, `tags`, `documentLabels`
   5. Add a copy raw json to child documents within detailed view (e.g. the clickable tiles for types like: partstudio, blob, assembly, billofmaterials)
   6. Update the `copy raw json` button for child documents to copy everything from that child document including metadata.
3. Update project documentation
   1. Create comprehensive ONSHAPE_API.md reference document
   2. Update README.md with new features and current project state
   3. Update ARCHITECTURE.md with detailed architecture overview
   4. Refresh basic-usage.md with latest features and examples

---

_For older completed items, see notes/archives/DONE-XXX.md_
