```yaml
#!meta (parametric prompt)

# See README.md for more documentation

knowledge_globs:
  - README.md
  - SPEC.md
  - package.json
  - tsconfig.json
  - nodemon.json
  - notes/LLM-PROMPT.md
  - notes/LLM-CODE-SNIPPET.md
  - notes/LLM-GUIDE.md
  - notes/INSTRUCTIONS.md
  - notes/OUTPUT.md
  - notes/RESPONSE.md
  - notes/TODO.md

base_dir: ""

## File path & content included in prompt
context_globs:
  - notes/TODO.md
  - public/**/SPEC.min.md
  - src/**/SPEC.min.md

  ### Current working section ###

  # Database (does not exist yet)

  # Back-end
  # - src/**/*.ts
  - src/index.ts
  - src/routes/**/*.ts
  - src/services/**/*.ts


  # Front-end JS
  # - public/js/**/*.js
  - public/js/app.js
  - public/js/views/**/*.js
  - public/js/controllers/**/*.js
  - public/js/services/**/*.js

  # Front-end HTML & CSS
  - public/dashboard.html
  - public/index.html
  # - public/css/main.css
  - public/css/**/*.css

## Only matched file paths included in prompt
structure_globs:
  - src/**/*
  - public/**/*

## Working Globs - Create a task per file or file group.
# working_globs:
#   - src/**/*.js
#   - ["css/*.css"]
# input_concurrency: 2

max_files_size_kb: 500

# model_aliases:
#   gpro: gemini-2.5-pro # example

## Set to true to write the files
write_mode: true

# model: claude-sonnet
model: claude-opus
# model: gpt-5-high
# model: gemini-3-pro
## See README.md for more info

## Default Prompt:
# Follow the instructions in `LLM-PROMPT.md`

# After completing the tasks follow the workflow from `INSTRUCTIONS.md`

# Make only these specific changes to ensure the code runs without errors.

# Do not remove existing comments, modify them if needed. Add minimal & concise comments to complex logic.

# Provide a detailed response as to what was worked on.

# If more file access needed, specify which files need write access in response.
```

# Follow instructions in `LLM-PROMPT.md`

# After completing tasks follow workflow from `INSTRUCTIONS.md`

# Make only these specific changes to ensure code runs without errors.

# Do not remove existing comments, modify them if needed. Add minimal comments to complex logic.

# Provide detailed response of what was worked on.

# IMPORTANT: If more file/directory access needed to complete the task, specify which files/directories require write access.

You are an expert frontend developer (vanilla JavaScript ES6 modules) and backend developer (TypeScript/Node.js). 
You write clean, modular, well-structured code with proper error handling, always following existing project patterns and CSP constraints (no inline scripts/styles). 
You do not remove or modify code unrelated to the task.

Task - Export Prefix Filter Feature

====
>   Info: Duration: 2m 35s | ~$0.9934 | Prompt Tokens: 120,970 | Completion Tokens: 15,540 
>  Model: claude-opus-4-5-20251101 | Adapter: Anthropic
>  Files: Context Files: 70 | Working Files: 0 | Knowledge Files: 11
>   Note: write_mode is true, so content below this line will **NOT** be included in next run/prompt.

<suggested_git_command>
git add -A . && git commit -a -m "+ export-filter - Add prefix filter modal for Get All export flow"
</suggested_git_command>

# Export Prefix Filter Feature Implementation

I've implemented the prefix filter modal that appears when clicking the "Get All" button, allowing users to filter the pre-scan to only include root folders matching a specified prefix.

## Summary of Changes

### 1. New Files Created

#### `public/js/views/export-filter-modal.js`
A new modal component for configuring export filters before pre-scan. Features:
- Text input for folder prefix filter
- Keyboard navigation (Enter to submit, Escape to cancel)
- Focus trapping for accessibility
- Promise-based API returning filter options or null on cancel

#### `public/css/views/export-filter-modal.css`
Styles for the filter modal matching the existing export-stats-modal styling:
- Overlay with backdrop blur
- Centered modal card with animations
- Styled input with focus states
- Example section showing filter usage

### 2. Modified Files

#### `public/js/controllers/document-controller.js`
- Added import for `exportFilterModal`
- Modified `exportAggregateBom()` to show filter modal before pre-scan (only for full exports, not partial)
- Pass `filterOptions` through the chain to `_startAggregateBomExport()`
- Updated `_startAggregateBomExport()` to accept `filterOptions` parameter and pass `prefixFilter` to export
- Updated filename generation to include filter info when applicable

#### `public/js/services/document-service.js`
- Updated `getDirectoryStats()` to accept `filterOptions` as third parameter

#### `public/js/services/api-client.js`
- Updated `getDirectoryStats()` to include `prefixFilter` query parameter
- Updated `startAggregateBomStream()` to include `prefixFilter` query parameter

#### `public/js/views/export-stats-modal.js`
- Updated `show()` to accept `prefixFilter` option
- Updated `renderModalContent()` to display active filter badge when filter is applied

#### `src/routes/api.ts`
- Updated `/api/export/directory-stats` to parse and pass `prefixFilter` query param
- Updated `/api/export/aggregate-bom-stream` to parse and pass `prefixFilter` query param

#### `src/services/onshape-api-client.ts`
- Updated `DirectoryStatsOptions` interface to include `prefixFilter`
- Updated `getDirectoryStats()` to filter root folders by prefix before scanning
- Updated `getAggregateBomWithProgress()` to accept and pass through `prefixFilter`

#### `public/css/main.css`
- Added import for the new `export-filter-modal.css`

#### `public/css/views/export.css`
- Added styles for the filter badge displayed in stats modal

---

## File Changes

---

## Testing Checklist

1. Click "Get All" → Filter modal appears
2. Press Escape → Modal closes, no scan starts
3. Click Cancel → Modal closes, no scan starts
4. Leave empty, click Start → Full scan runs (no filter)
5. Enter "600", click Start → Only folders starting with "600" scanned
6. Enter prefix, press Enter → Submits form
7. Verify filtered count in stats modal matches expectation (filter badge visible)
8. Complete export with filter → JSON filename includes filter info (e.g., `aggregate-bom-filtered-600-2025-12-01T...`)
9. Partial export (with selection) → Filter modal should NOT appear
