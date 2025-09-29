# What is this file?

Contains comprehensive instructions for Agents and LLMs working on this project.

# Instructions for LLM & Agent

## Core Principles

1. **Read and understand all instructions** before making changes
2. **Do not modify core logic** without explicit permission
3. **Ask for clarification** when prompts are unclear
4. **Professional environment** - limit emoji use
5. **You are a distinguished software engineer** with expertise in this project's technology stack

## File Management Workflow

### Working with TODO Items

When working on tasks from `TODO.md`:

1. **Select a TODO item** from `notes/TODO.md`
2. **Complete the implementation** (code, documentation, testing)
3. **Move the completed item** from `TODO.md` to `DONE.md`
   - Preserve the original numbering and structure
   - Add to the top of DONE.md (reverse chronological)
4. **Update HISTORY.md** following its specific instructions:
   - Append to the existing `[not committed]` section
   - Update the section summary to reflect all work
   - Follow the exact formatting examples provided

### Working with History

When updating `notes/HISTORY.md`:

1. **CRITICAL**: Only ONE `[not committed]` section should exist at any time
2. **Append new work** to the existing `[not committed]` section
3. **Update the section name and summary** to reflect all uncommitted work
4. **Follow the formatting** exactly as shown in the examples
5. **After completing work**, ask for confirmation to commit

### File Structure Overview

```
notes/
├── TODO.md          # Active tasks to be completed
├── DONE.md          # Completed tasks (moved from TODO.md)
├── HISTORY.md       # Detailed work history with commits
├── INSTRUCTIONS.md  # This file - instructions for agents
├── ARCHITECTURE.md  # Project architecture documentation
├── ONSHAPE_API.md   # API reference documentation
├── MAINTENANCE.md   # Maintenance procedures
├── ARCHIVE-INDEX.md # Index of archived files
└── archives/        # Archived files when size limits exceeded
```

## File Size Management

### Automatic Archiving Rules

Monitor file sizes and archive when limits are exceeded:

| File            | Line Limit | Size Limit | Archive Action                           |
| --------------- | ---------- | ---------- | ---------------------------------------- |
| HISTORY.md      | 500 lines  | 50KB       | Archive entire file, keep recent entries |
| DONE.md         | 500 lines  | 50KB       | Archive entire file                      |
| Other .md files | 500 lines  | 50KB       | Archive entire file                      |

**Never archive**: INSTRUCTIONS.md, ARCHITECTURE.md, ONSHAPE_API.md, TODO.md

### Archiving Process

When a file exceeds limits:

1. **Create archive**: Copy to `notes/archives/FILENAME-XXX.md`
   - Use 3-digit numbering: 001, 002, 003, etc.
   - Check existing archives to determine next number
2. **Add archive header** to the archived file:

   ```markdown
   # FILENAME-XXX.md

   **Archive Information**

   - Original File: FILENAME.md
   - Archive Number: XXX
   - Created: YYYY-MM-DD
   - Line Count: ~XXX
   - File Size: ~XXKB
   - Date Range: YYYY-MM-DD to YYYY-MM-DD
   - Next Archive: FILENAME-XXX.md (when created)
   - Previous Archive: FILENAME-XXX.md (if exists)

   ---

   [Original content follows]
   ```

3. **Clean original file**:
   - For HISTORY.md: Keep `[not committed]` section + last 2-3 commits
   - For DONE.md: Clear all content, add reference to archive
   - Add footer: `For older entries, see notes/archives/`
4. **Update ARCHIVE-INDEX.md** with the new archive details

## Documentation Standards

### Consistency Requirements

1. **Headers**: Every file must start with "# What is this file?"
2. **Timestamps**: Use PST, 24-hour format (YYYY-MM-DD HH:MM:SS)
3. **Sections**: Use clear, descriptive section headers
4. **Lists**: Use consistent formatting (numbered for ordered, bullets for unordered)
5. **Code blocks**: Use appropriate language tags for syntax highlighting

### When Making Changes

1. **Code changes**: Update relevant documentation
2. **Architecture changes**: Update `ARCHITECTURE.md`
3. **API usage**: Reference `ONSHAPE_API.md`
4. **New features**: Update `README.md` if user-facing

## Special Instructions

### For TODO Management

- TODO items are **never** marked as complete in TODO.md
- Completed items are **moved** to DONE.md, not marked
- Preserve all formatting and sub-items when moving
- Do not add timestamps to DONE.md; record completion timestamps in HISTORY.md

### For History Management

- Each work session updates the existing `[not committed]` section
- Never create multiple `[not committed]` sections
- Include enough detail for future reference
- Group related changes logically

### Git Commit Process

1. Complete work and update HISTORY.md with `[not committed]`
2. Request confirmation from user to commit
3. After git commit, user provides hash
4. Update `[not committed]` to `[hash]` in HISTORY.md
5. Create new `[not committed]` section for next work

### For Archive Management

- Run maintenance checks periodically (see MAINTENANCE.md)
- Never delete archives
- Always increment archive numbers sequentially
- Verify archive headers are complete and accurate
- Example files in notes/archives (DONE-XXX.md, HISTORY-XXX.md) are templates; do not count them as actual archives

## Context References

When you need additional context:

- Project structure: See `README.md`
- Technical details: See `ARCHITECTURE.md`
- API information: See `ONSHAPE_API.md`
- Usage examples: See `examples/`
- Maintenance tasks: See `MAINTENANCE.md`

## Final Reminders

1. **Quality over speed** - Take time to understand before changing
2. **Test your changes** - Ensure functionality works as intended
3. **Document thoroughly** - Future developers depend on your notes
4. **Ask when uncertain** - Better to clarify than to assume
5. **Follow conventions** - Consistency makes collaboration easier
