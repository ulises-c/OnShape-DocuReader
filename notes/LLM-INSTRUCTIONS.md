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

When working on tasks from `notes/TODO.md`:

1. **Select a TODO item** from `notes/TODO.md`
2. **Complete the implementation** (code, documentation, testing)

### File Structure Overview

```
OnShape-DocuReader/
├── docs/
│   ├── AUTO_SPEC.md # Auto generated SPEC file on `build`
│   ├── LLM_SPEC.md # LLM generated & edited SPEC file
│   └── SPEC.md 
├── notes/
│   ├── ARCHITECTURE.md # Project architecture documentation
│   ├── CONSOLE-OUTPUT.md # Front end and back end console output, used as context for bug fixing
│   ├── GOALS.md # Overall project goals
│   ├── LLM-INSTRUCTIONS.md # This file - instructions for agents
│   ├── LLM-PROMPT.md # Current prompt for LLM
│   ├── LLM-RESPONSE.md # LLM response for context. Used when continuing a prior task.
│   ├── ONSHAPE_API.md # API reference documentation
│   └── TODO.md # Active tasks to be completed
```

## File Size Management

**Never archive**: INSTRUCTIONS.md, ARCHITECTURE.md, ONSHAPE_API.md, TODO.md

## Documentation Standards

### Consistency Requirements

1. **Headers**: Every file must start with a header explaining what the file does.
2. **Timestamps**: Use PST, 24-hour format (YYYY-MM-DD HH:MM:SS)
3. **Sections**: Use clear, descriptive section headers
4. **Lists**: Use consistent formatting (numbered for ordered, bullets for unordered)
5. **Code blocks**: Use appropriate language tags for syntax highlighting

### When Making Changes

1. **Code changes**: Update relevant documentation
2. **Architecture changes**: Update `docs/LLM_SPEC.md`
3. **API usage**: Reference `ONSHAPE_API.md`
4. **New features**: Update `README.md` if user-facing

## Context References

When you need additional context:

- Project structure: See `README.md`
- Technical details: See `ARCHITECTURE.md`
- API information: See `ONSHAPE_API.md`
- Usage examples: See `examples/`

## Final Reminders

1. **Quality over speed** - Take time to understand before changing
2. **Test your changes** - Ensure functionality works as intended
3. **Document thoroughly** - Future developers depend on your notes
4. **Ask when uncertain** - Better to clarify than to assume
5. **Follow conventions** - Consistency makes collaboration easier
