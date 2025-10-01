# Notes Directory Specification `notes/SPEC.md`

## Purpose
Comprehensive development documentation, task tracking, and historical record of project evolution.

## File Structure
````

notes/
├── TODO.md # Active tasks queue
├── DONE.md # Completed tasks (reverse chronological)
├── HISTORY.md # Detailed work history with commits
├── INSTRUCTIONS.md # LLM/Agent guidelines
├── ARCHITECTURE.md # Technical architecture documentation
├── ONSHAPE_API.md # API reference documentation
├── MAINTENANCE.md # File size management procedures
├── ARCHIVE-INDEX.md # Index of archived files
├── PROMPT.md # Current development prompts
├── QUICK-REFERENCE.md # Quick workflow guide
└── archives/ # Archived files when limits exceeded
├── HISTORY-XXX.md # Archived history entries
└── DONE-XXX.md # Archived completed tasks

```

## Workflow Integration

### Task Management Flow
1. Task identified → Added to TODO.md
2. Task completed → Moved to DONE.md
3. Work logged → Updated in HISTORY.md
4. Commit made → Hash added to HISTORY.md

### History Management
- Single `[not committed]` section for active work
- Append new work to existing uncommitted section
- Update section summary for all work
- Commit hash replaces `[not committed]` after git commit

### Archive Management
- Files archived at 500 lines or 50KB
- Sequential numbering (001, 002, 003)
- Original file keeps recent entries
- Archive index updated automatically

## File Purposes

### TODO.md
- Active task queue
- Numbered items with sub-tasks
- Clear completion criteria
- No timestamps (those go in HISTORY.md)

### DONE.md
- Completed tasks from TODO
- Reverse chronological order
- Preserves original numbering
- References archives when full

### HISTORY.md
- Timestamped work entries (PST, 24-hour)
- Git commit hashes
- Detailed change descriptions
- Section summaries

### INSTRUCTIONS.md
- Comprehensive LLM guidelines
- File management workflow
- Documentation standards
- Git commit process

### ARCHITECTURE.md
- System design overview
- Component relationships
- Anti-patterns to avoid
- Planned improvements

### ONSHAPE_API.md
- API endpoint reference
- Data structures
- Rate limiting guidelines
- Security considerations

## Conventions

### Timestamps
- Format: YYYY-MM-DD HH:MM:SS (PST, 24-hour)
- Added to HISTORY.md only
- Not in TODO.md or DONE.md

### Commit Messages
- Descriptive section name
- Summary of all changes
- Reference to detailed entries

### Task Numbering
- Sequential in TODO.md
- Preserved when moved to DONE.md
- Sub-items use decimal notation

## LLM Integration

### AIPACK & PRO CODER
- Structured prompts in PROMPT.md
- Instructions in INSTRUCTIONS.md
- Current work context in HISTORY.md
- Task queue in TODO.md

### Guidelines for Agents
1. Read INSTRUCTIONS.md first
2. Check TODO.md for tasks
3. Update HISTORY.md with work
4. Move completed items to DONE.md
5. Request commit confirmation

## Maintenance

### Size Limits
- 500 lines maximum
- 50KB file size limit
- Automatic archiving when exceeded
- Index maintained in ARCHIVE-INDEX.md

### Archive Process
1. Copy file to archives/
2. Add sequential number
3. Add archive header
4. Clean original file
5. Update index

## Never Archive
- INSTRUCTIONS.md
- ARCHITECTURE.md
- ONSHAPE_API.md
- TODO.md (active tasks)