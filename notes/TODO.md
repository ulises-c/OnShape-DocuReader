# What is this file?

Contains an ordered list of bugs and features that should be added or fixed. Not sorted in any particular order. The numbering is just show that it's easier to keep track.

## Instructions for Agent & LLM

1. Read `INSTRUCTIONS.md`
2. Move items from the `TODO` section to the `DONE` section after completing the task
3. Read the instructions from `notes/HISTORY.md` and update it after making changes

# TODO

1. Update detailed view
   1. Add a "copy raw json" button
   2. The child documents (the other clickable tiles within a document), should also be updated to have a cleaner layout.

# ✅ DONE

1. Update detailed view
   1. Remove the `Creator` field, will be merged with `Created`
   2. Adjust the following fields:
      1. `Created` (currently unknown, but list view shows creator) and add in `creator`, example:
         1. 2024-Sep-16, 3:59:08 PM [John Smith]
      2. `Modified` should also have a similar output
         1. 2025-Jun-02, 3:59:08 PM [John Smith]
   3. Add the following fields:
      1. `notes`, `tags`, `documentLabels`
