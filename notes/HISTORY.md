# What is this file?

Contains timestamped & commit hash section work history if possible. Time stamp is in PST, 24-hour to keep things uniform

## Instructions for Agents & LLM

1. Read `INSTRUCTIONS.md`
2. Update `notes/HISTORY.md` and `notes/TODO.md` after making changes
3. Update the `[not committed]` as work is done
   1. Continue adding to the `[not committed]` section if commits have not been made, but changes have been made
4. Update the tenative section name & update the section summary
5. Take a look at both the `Example` and `Work History` and make sure to match the formatting
6. DO NOT PUSH, but create a commit, and update the hash in the `[not committed]` field

## Example

```
## tenative git commit message [not committed]

**section summary goes here, short message, max 2-3 sentences**

2025-09-24 22:27:16

1. Created `notes/`, and within that directory: `HISTORY.md`, `TODO.md`, `ARCHITECTURE.md`

## updated license details [c407b9c]

**Previously a license was referred to, but there wasn't a license, so one was made.**

2025-09-23 22:25:37

1. Created `LICENSE` & updated `README.md` to reflect that

2025-09-23 22:20:16

**Updated `README.md` to list features and architecture of the project**

1. Added sections and various other parts to `README.md`

```

# Work History

## Detailed view changes: copy raw JSON button, modified created/modified fields, new fields added [4594335]

**Added a convenient "Copy Raw JSON" button to the document detailed view, allowing users to easily copy the complete document data to their clipboard.**

2025-09-24 23:30:00

1. Added "Copy Raw JSON" button to the document detailed view in `public/app.js`
   - Button appears above the Raw JSON display with blue styling and clipboard icon
   - Includes visual feedback (changes to green "✅ Copied!" for 2 seconds)
2. Implemented `copyRawJson()` method with modern Clipboard API support
   - Uses `navigator.clipboard.writeText()` for modern browsers
   - Falls back to `document.execCommand('copy')` for older browsers/non-HTTPS
   - Provides user feedback via success/error messages
3. Added event delegation handling for the copy button in `bindDocumentCardEvents()`
4. Updated TODO.md to move completed item from TODO to DONE section

**Removed the separate Creator field and merged it with the Created and Modified fields, formatting them with user information in a more readable format.**

2025-09-24 23:15:00

1. Removed the separate "Creator" field from the document detailed view in `public/app.js`
2. Updated "Created" field to display format: "2024-Sep-16, 3:59:08 PM [John Smith]" including creator name
3. Updated "Modified" field to display format: "2025-Jun-02, 3:59:08 PM [John Smith]" including modifier name
4. Added `formatDateWithUser` helper function to handle the new date formatting with user information
5. Updated TODO.md to move completed items from TODO to DONE section

**Added new fields to detailed view**

2025-09-24 22:45:00

1. Added `notes`, `tags`, and `documentLabels` fields to the document detailed view in `public/app.js`
   - Added "Notes" field that displays document notes or "No notes" if empty
   - Added "Tags" field that displays tags as styled badges or "No tags" if empty
   - Added "Document Labels" field that displays document labels as styled badges or "No document labels" if empty
2. Added CSS styles in `public/styles.css` for the new badge elements:
   - `.tag-badge` and `.label-badge` classes with blue and purple color schemes respectively
   - Hover effects with opacity and transform transitions
   - Proper padding, margins, and border-radius for clean appearance
3. Updated `.gitignore` after renaming `onshape_document.example.json`
