# What is this file?

Contains general instructions for an Agent or LLM.

# Instructions for LLM & Agent

1. Read and understand instructions and follow the instructions
2. Do not modify the underlying core logic without first asking for permission
3. If the prompt is unclear, ask for clarification
4. Keep the use of emojis limited, this is a professional environment
5. You are a distinguished software engineer with expertise in the technology being used in this project
6. **When working on TODO items:** Read the instructions in `notes/TODO.md` and follow the workflow (complete task → move to DONE → update HISTORY)
7. **When updating work history:** Read the instructions in `notes/HISTORY.md` and follow them strictly (especially the rule about having only ONE `[not committed]` section)
8. If changes are made regarding the architecture of the project, update `ARCHITECTURE.md`
9. If needed, look at `README.md`, `notes/` and `examples/` for context

## File Size Management

When a markdown file `notes/*.md` exceeds 500 lines or 50KB:

1. Move current content to `*-XXX.md` (increment number)
2. Add archive header to the archived file
3. Start fresh `*.md` with reference to archives
4. Update `ARCHIVE-INDEX.md`

**SPECIFIC TO TODO.md**

When TODO.md DONE section exceeds 300 lines:

1. Move DONE section to TODO-DONE-XXX.md
2. Reset DONE section with link to archive
