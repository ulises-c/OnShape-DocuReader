# What is this file?

Contains an ordered list of bugs and features that should be added or fixed. Not sorted in any particular order. The numbering is just show that it's easier to keep track.

## Instructions for Agent & LLM

1. Read `INSTRUCTIONS.md`
2. **When completing TODO items:**
   1. Complete the actual task/implementation
   2. Move the completed item from `TODO` section to `✅ DONE` section
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

# TODO

1. Update navigation so that going "forward" and "back" recalls where you were
   1. Potentially means adding new pages such as: `detailed`, `document`, `assembly`, etc., but I am unsure. So think about different ways to navigating and recalling navigation
2. Update detailed view
   1. The child documents (the other clickable tiles within a document), should also be updated to have a cleaner layout.
   2. Investigate why "Load Hierarchy Details" returns "No parent hierarchy available" even though there is a parent ID

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
