#!/usr/bin/env python3
"""
SPEC File Generator for TypeScript/JavaScript Projects
Generates a consolidated SPEC.md file for LLM context.

Usage:
    python generate_spec.py /path/to/project
    python generate_spec.py /path/to/project --output CONTEXT.md
    python generate_spec.py /path/to/project --depth 3
"""

import argparse
import os
import re
from pathlib import Path
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field


# =============================================================================
# Configuration
# =============================================================================

DEFAULT_IGNORE = {
    'node_modules', '.git', 'dist', 'build', '.vscode', '.idea',
    '__pycache__', '.DS_Store', 'coverage', '.nyc_output', 'logs'
}

CODE_EXTENSIONS = {'.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'}
DOC_EXTENSIONS = {'.md', '.txt', '.json'}
STYLE_EXTENSIONS = {'.css', '.scss', '.less'}

# Regex patterns for JS/TS extraction
PATTERNS = {
    'export_function': re.compile(r'export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)'),
    'export_const_fn': re.compile(r'export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>'),
    'export_const': re.compile(r'export\s+const\s+(\w+)\s*='),
    'export_class': re.compile(r'export\s+(?:default\s+)?class\s+(\w+)'),
    'export_interface': re.compile(r'export\s+(?:interface|type)\s+(\w+)'),
    'export_default': re.compile(r'export\s+default\s+(?:function\s+)?(\w+)'),
    'import_from': re.compile(r'import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+[\'"]([^\'"]+)[\'"]'),
    'class_def': re.compile(r'class\s+(\w+)(?:\s+extends\s+(\w+))?'),
    'function_def': re.compile(r'(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)'),
    'arrow_fn': re.compile(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>'),
    'method_def': re.compile(r'^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*{', re.MULTILINE),
}


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class FileInfo:
    path: Path
    relative_path: str
    exports: list = field(default_factory=list)
    imports: list = field(default_factory=list)
    classes: list = field(default_factory=list)
    functions: list = field(default_factory=list)
    line_count: int = 0
    description: str = ""


@dataclass
class ProjectSpec:
    root: Path
    name: str
    files: list = field(default_factory=list)
    structure: str = ""
    generated_at: str = ""


# =============================================================================
# Core Functions
# =============================================================================

def should_ignore(path: Path, ignore_patterns: set) -> bool:
    """Check if path should be ignored."""
    return any(part in ignore_patterns for part in path.parts)


def generate_tree(root: Path, ignore_patterns: set, max_depth: int = 4, prefix: str = "") -> str:
    """Generate directory tree structure."""
    if max_depth < 0:
        return ""
    
    entries = sorted(root.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    tree_str = ""
    
    # Filter entries
    entries = [e for e in entries if e.name not in ignore_patterns and not e.name.startswith('.')]
    
    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        connector = "└── " if is_last else "├── "
        
        if entry.is_file():
            tree_str += f"{prefix}{connector}{entry.name}\n"
        else:
            tree_str += f"{prefix}{connector}{entry.name}/\n"
            extension = "    " if is_last else "│   "
            tree_str += generate_tree(entry, ignore_patterns, max_depth - 1, prefix + extension)
    
    return tree_str


def extract_file_info(file_path: Path, root: Path) -> Optional[FileInfo]:
    """Extract exports, imports, classes, and functions from a JS/TS file."""
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return None
    
    info = FileInfo(
        path=file_path,
        relative_path=str(file_path.relative_to(root)),
        line_count=len(content.splitlines())
    )
    
    # Extract first comment block as description
    doc_match = re.search(r'^/\*\*?\s*(.*?)\s*\*/', content, re.DOTALL)
    if doc_match:
        desc = doc_match.group(1).strip()
        # Clean up comment formatting
        desc = re.sub(r'\n\s*\*\s*', ' ', desc)
        desc = desc[:200] + '...' if len(desc) > 200 else desc
        info.description = desc
    
    # Extract exports
    for pattern_name, pattern in PATTERNS.items():
        if pattern_name.startswith('export'):
            for match in pattern.finditer(content):
                export_name = match.group(1)
                if export_name and export_name not in info.exports:
                    info.exports.append(export_name)
    
    # Extract imports (external modules only)
    for match in PATTERNS['import_from'].finditer(content):
        module = match.group(1)
        if not module.startswith('.') and module not in info.imports:
            info.imports.append(module)
    
    # Extract classes
    for match in PATTERNS['class_def'].finditer(content):
        class_name = match.group(1)
        extends = match.group(2)
        class_str = f"{class_name}" + (f" extends {extends}" if extends else "")
        if class_str not in info.classes:
            info.classes.append(class_str)
    
    # Extract top-level functions (non-exported)
    for match in PATTERNS['function_def'].finditer(content):
        fn_name = match.group(1)
        if fn_name not in info.exports and fn_name not in info.functions:
            info.functions.append(fn_name)
    
    for match in PATTERNS['arrow_fn'].finditer(content):
        fn_name = match.group(1)
        if fn_name not in info.exports and fn_name not in info.functions:
            info.functions.append(fn_name)
    
    return info


def scan_project(root: Path, ignore_patterns: set) -> list[FileInfo]:
    """Scan project and extract info from all code files."""
    files = []
    
    for file_path in root.rglob('*'):
        if file_path.is_file() and not should_ignore(file_path, ignore_patterns):
            if file_path.suffix in CODE_EXTENSIONS:
                info = extract_file_info(file_path, root)
                if info:
                    files.append(info)
    
    # Sort by path
    files.sort(key=lambda x: x.relative_path)
    return files


def generate_spec(project: ProjectSpec) -> str:
    """Generate the SPEC markdown content."""
    lines = [
        f"# {project.name} - Project Specification",
        "",
        f"> Auto-generated: {project.generated_at}",
        "",
        "## Directory Structure",
        "",
        "```",
        f"{project.name}/",
        project.structure,
        "```",
        "",
    ]
    
    # Group files by directory
    dirs: dict[str, list[FileInfo]] = {}
    for file in project.files:
        dir_path = str(Path(file.relative_path).parent)
        if dir_path not in dirs:
            dirs[dir_path] = []
        dirs[dir_path].append(file)
    
    lines.extend([
        "## Module Overview",
        "",
        f"Total files: {len(project.files)}",
        f"Total lines: {sum(f.line_count for f in project.files):,}",
        "",
    ])
    
    # Generate module documentation
    for dir_path in sorted(dirs.keys()):
        dir_files = dirs[dir_path]
        dir_name = dir_path if dir_path != '.' else 'Root'
        
        lines.extend([
            f"### {dir_name}",
            "",
        ])
        
        for file in dir_files:
            lines.append(f"#### `{Path(file.relative_path).name}` ({file.line_count} lines)")
            
            if file.description:
                lines.extend(["", f"_{file.description}_", ""])
            
            if file.exports:
                lines.append(f"- **Exports:** `{', '.join(file.exports)}`")
            
            if file.classes:
                lines.append(f"- **Classes:** `{', '.join(file.classes)}`")
            
            if file.functions:
                # Only show first 5 functions to keep it concise
                fns = file.functions[:5]
                if len(file.functions) > 5:
                    fns.append(f"+{len(file.functions) - 5} more")
                lines.append(f"- **Functions:** `{', '.join(fns)}`")
            
            if file.imports:
                # Only show external dependencies
                lines.append(f"- **Dependencies:** `{', '.join(file.imports[:8])}`")
            
            lines.append("")
    
    # Add dependency summary
    all_imports = set()
    for file in project.files:
        all_imports.update(file.imports)
    
    if all_imports:
        lines.extend([
            "## External Dependencies",
            "",
            ", ".join(sorted(all_imports)),
            "",
        ])
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate SPEC.md for LLM context from JS/TS projects"
    )
    parser.add_argument("path", help="Project root directory")
    parser.add_argument("-o", "--output", default="SPEC.md", help="Output file name")
    parser.add_argument("-d", "--depth", type=int, default=4, help="Tree depth")
    parser.add_argument("--ignore", nargs="*", default=[], help="Additional dirs to ignore")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout instead of file")
    
    args = parser.parse_args()
    
    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Error: Path '{root}' does not exist")
        return 1
    
    ignore_patterns = DEFAULT_IGNORE | set(args.ignore)
    
    # Build project spec
    project = ProjectSpec(
        root=root,
        name=root.name,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    print(f"Scanning {root}...")
    project.structure = generate_tree(root, ignore_patterns, args.depth)
    project.files = scan_project(root, ignore_patterns)
    
    print(f"Found {len(project.files)} code files")
    
    spec_content = generate_spec(project)
    
    if args.stdout:
        print(spec_content)
    else:
        output_path = root / args.output
        output_path.write_text(spec_content, encoding='utf-8')
        print(f"Generated: {output_path}")
        print(f"Size: {len(spec_content):,} characters")
    
    return 0


if __name__ == "__main__":
    exit(main())