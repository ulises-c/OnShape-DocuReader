# Maintenance Guide

## File Size Monitoring

### Quick Check Commands

```bash
# Check line counts
wc -l notes/*.md

# Check file sizes
ls -lh notes/*.md

# Check if any files need archiving
find notes -name "*.md" -type f -exec sh -c 'lines=$(wc -l < "$1"); size=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1"); if [ $lines -gt 500 ] || [ $size -gt 51200 ]; then echo "$1: $lines lines, $size bytes - NEEDS ARCHIVING"; fi' _ {} \;
```

## Archiving Process

### For HISTORY.md

```bash
# 1. Check current size
wc -l notes/HISTORY.md

# 2. If over 500 lines, create archive
cp notes/HISTORY.md notes/archives/HISTORY-001.md

# 3. Edit HISTORY.md to keep only recent entries
# 4. Add archive header to HISTORY-001.md
# 5. Update ARCHIVE-INDEX.md
```

### For TODO.md DONE section

```bash
# 1. Count lines in DONE section
# 2. If over 300 lines, move to archive
# 3. Update references in TODO.md
```

## Archive Numbering

- Always use 3-digit numbering: 001, 002, 003, etc.
- Check existing archives before creating new ones
- Never overwrite existing archives

## Monthly Maintenance Checklist

- [ ] Check all file sizes in notes/
- [ ] Archive any files exceeding limits
- [ ] Update ARCHIVE-INDEX.md
- [ ] Verify all archive headers are correct
- [ ] Remove any temporary files
- [ ] Update this maintenance log

## Maintenance Log

**EXAMPLE**

```
| Date       | Action        | Files Affected       | Performed By |
| ---------- | ------------- | -------------------- | ------------ |
| 2025-09-26 | Initial setup | TODO-DONE.md created | Setup        |
```
