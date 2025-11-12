```yaml
#!meta (parametric prompt)

# See README.md for more documentation

knowledge_globs:
  - README.md
  - SPEC.md
  - package.json
  - tsconfig.json
  - nodemon.json
  - notes/PROMPT.md
  - notes/INSTRUCTIONS.md
  - notes/OUTPUT.md
  - notes/RESPONSE.m

base_dir: ""

## File path & content included in prompt
context_globs:
  - notes/TODO.md
  # Current working section
  - src/**/SPEC.min.md
  - public/**/SPEC.min.md
  - src/**/*.ts
  - public/js/app.js
  - public/js/services/*.js
  - public/js/router/*.js
  - public/js/controllers/*.js
  - public/js/views/*.js
  - public/dashboard.html
  - public/index.html
  - public/styles.css

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

model: claude-sonnet-4.5
# model: claude-opus-4.1
# model: gpt-5

## See README.md for more info

## Default Prompt:
# Follow the instructions in `PROMPT.md`

# After completing the tasks follow the workflow from `INSTRUCTIONS.md`

# Make only these specific changes to ensure the code runs without errors.

# Do not remove existing comments, modify them if needed.

# Provide a detailed response as to what was worked on.

# Read the response from `RESPONSE.md`. This is the response from the LLM that last worked on this.

# Read the output from `OUTPUT.md`. Provides context in terms of console logs (frontend and backend).
```

# Follow the instructions in `PROMPT.md`

# After completing the tasks follow the workflow from `INSTRUCTIONS.md`

# Make only these specific changes to ensure the code runs without errors.

# Do not remove existing comments, modify them if needed. Add minimal & concise comments to complex logic.

# Provide a detailed response as to what was worked on.

Read the response from `RESPONSE.md`. This is the response from the LLM that last worked on this.

Read the output from `OUTPUT.md`. Provides context in terms of console logs (frontend and backend).

Context: Task initially comes from `TODO.md` task 8, login/logout is working now, but some other navigation issues appeared.

Issues: Essentially I can only navigate "forward". I can click on a document and open it, I can click on an element from a document (assembly, bom, etc.) and open it. But I can't go back to the document, or go back to the main view using the buttons "Back to Documents" & "Back to Document"

====
