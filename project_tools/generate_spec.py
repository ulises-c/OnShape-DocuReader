#!/usr/bin/env python3
"""
SPEC File Generator v3 - Optimized for LLM Context

Generates token-efficient project specifications for LLM consumption.
Focuses on structure, signatures, relationships, and key code snippets.

Key features:
- Full function/method signatures with types
- Interface/type definitions with properties
- Key file code snippets (configurable)
- Dependency graph (internal + external)
- Route extraction with HTTP methods
- TODO/FIXME collection
- File role classification
- Configurable verbosity levels

Usage:
    python generate_spec.py /path/to/project
    python generate_spec.py . -o docs/SPEC.md --verbosity full
    python generate_spec.py . --verbosity minimal --ignore examples notes
"""

import argparse
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Literal
from dataclasses import dataclass, field
from enum import Enum


# =============================================================================
# Configuration
# =============================================================================

DEFAULT_IGNORE = {
    'node_modules', '.git', 'dist', 'build', '.vscode', '.idea',
    '__pycache__', '.DS_Store', 'coverage', '.nyc_output', 'logs',
    '.cache', '.parcel-cache', '.next', '.nuxt', '.turbo',
    'vendor', 'tmp', 'temp', '.env', '.env.local'
}

# Specific files to ignore (not directories)
IGNORE_FILES = {
    'SPEC.min.md', 'SPEC.md', 'AUTO_SPEC.md',
    '.eslintrc.js', '.prettierrc.js', 'jest.config.js'
}

CODE_EXTENSIONS = {'.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'}
CONFIG_FILES = {'package.json', 'tsconfig.json', 'vite.config.ts', 'vite.config.js', '.env.example'}
ENTRY_POINTS = {'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js'}

# Files to always include snippets from (relative path patterns)
SNIPPET_PRIORITY = [
    r'/routes/',
    r'/controllers/',
    r'/config/',
    r'app\.(ts|js)$',
    r'index\.(ts|js)$',
    r'server\.(ts|js)$',
    r'router\.',
]

# File role detection patterns
ROLE_PATTERNS = {
    'controller': [r'/controllers?/', r'controller\.(ts|js)$'],
    'service': [r'/services?/', r'service\.(ts|js)$'],
    'route': [r'/routes?/', r'router?\.(ts|js)$'],
    'view': [r'/views?/', r'view\.(ts|js)$'],
    'model': [r'/models?/', r'model\.(ts|js)$'],
    'util': [r'/utils?/', r'/helpers?/', r'util\.(ts|js)$', r'helper\.(ts|js)$'],
    'type': [r'/types?/', r'\.d\.ts$'],
    'config': [r'/config/', r'config\.(ts|js)$'],
    'middleware': [r'/middleware/', r'middleware\.(ts|js)$'],
    'state': [r'/state/', r'/store/', r'state\.(ts|js)$'],
    'test': [r'/tests?/', r'\.test\.(ts|js)$', r'\.spec\.(ts|js)$'],
}


class Verbosity(Enum):
    MINIMAL = 'minimal'    # Structure + exports only
    STANDARD = 'standard'  # + signatures + brief descriptions
    FULL = 'full'          # + code snippets + all details


# =============================================================================
# Regex Patterns
# =============================================================================

PATTERNS = {
    # Exports with full signatures
    'export_function': re.compile(
        r'export\s+(async\s+)?function\s+(\w+)\s*(<[^>]+>)?\s*(\([^)]*\))(?:\s*:\s*([^\n{]+))?',
        re.MULTILINE
    ),
    'export_arrow': re.compile(
        r'export\s+const\s+(\w+)\s*(?::\s*([^=]+))?\s*=\s*(async\s*)?\(([^)]*)\)\s*(?::\s*([^\n=]+))?\s*=>',
        re.MULTILINE
    ),
    'export_class': re.compile(
        r'export\s+(default\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+([\w.<>]+))?(?:\s+implements\s+([\w,\s<>]+))?',
        re.MULTILINE
    ),
    'export_interface': re.compile(
        r'export\s+(interface|type)\s+(\w+)(?:<[^>]+>)?',
        re.MULTILINE
    ),
    'export_const': re.compile(
        r'export\s+const\s+(\w+)\s*(?::\s*([^\n=]+))?\s*=\s*(?!.*=>)',
        re.MULTILINE
    ),
    'export_default': re.compile(
        r'export\s+default\s+(\w+)',
        re.MULTILINE
    ),
    
    # Interface/type body extraction
    'interface_body': re.compile(
        r'(?:export\s+)?(?:interface|type)\s+(\w+)(?:<[^>]+>)?\s*(?:=\s*)?\{([^}]+)\}',
        re.MULTILINE | re.DOTALL
    ),
    
    # Class internals
    'class_method': re.compile(
        r'^\s+(async\s+)?(\w+)\s*(<[^>]+>)?\s*(\([^)]*\))(?:\s*:\s*([^\n{]+))?\s*\{',
        re.MULTILINE
    ),
    'class_property': re.compile(
        r'^\s+(?:private\s+|public\s+|protected\s+|readonly\s+)*(\w+)(\?)?:\s*([^\n;=]+)',
        re.MULTILINE
    ),
    'class_constructor': re.compile(
        r'constructor\s*(\([^)]*\))',
        re.MULTILINE
    ),
    
    # Imports
    'import_statement': re.compile(
        r'import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))\s+from\s+[\'"]([^\'"]+)[\'"]',
        re.MULTILINE
    ),
    
    # Routes (multiple frameworks)
    'express_route': re.compile(
        r'(?:router|app)\.(get|post|put|patch|delete|use|all)\s*\(\s*[\'"`]([^\'"`,]+)[\'"`]',
        re.IGNORECASE
    ),
    'decorator_route': re.compile(
        r'@(Get|Post|Put|Patch|Delete)\s*\(\s*[\'"]([^\'"]+)[\'"]',
        re.IGNORECASE
    ),
    
    # Comments and docs
    'jsdoc_block': re.compile(
        r'/\*\*\s*([\s\S]*?)\s*\*/',
        re.MULTILINE
    ),
    'jsdoc_param': re.compile(
        r'@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*[-–]?\s*(.*)$',
        re.MULTILINE
    ),
    'jsdoc_returns': re.compile(
        r'@returns?\s+(?:\{([^}]+)\}\s+)?(.*)$',
        re.MULTILINE
    ),
    'todo_comment': re.compile(
        r'(?://|/\*)\s*(TODO|FIXME|HACK|XXX|NOTE|OPTIMIZE)[\s:]+(.+?)(?:\*/|\n|$)',
        re.IGNORECASE
    ),
    
    # Specific patterns for state management
    'state_export': re.compile(
        r'export\s+const\s+(\w+State|\w+Store)\s*=',
        re.MULTILINE
    ),
}


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ParamInfo:
    name: str
    type: str = ""
    description: str = ""


@dataclass
class FunctionInfo:
    name: str
    params: list = field(default_factory=list)
    return_type: str = ""
    description: str = ""
    is_async: bool = False
    is_exported: bool = True


@dataclass
class PropertyInfo:
    name: str
    type: str
    optional: bool = False


@dataclass 
class ClassInfo:
    name: str
    extends: str = ""
    implements: str = ""
    constructor_params: str = ""
    methods: list = field(default_factory=list)
    properties: list = field(default_factory=list)
    description: str = ""
    is_default: bool = False


@dataclass
class InterfaceInfo:
    name: str
    kind: str = "interface"  # interface or type
    properties: list = field(default_factory=list)
    description: str = ""


@dataclass
class ImportInfo:
    module: str
    items: list = field(default_factory=list)
    default_import: str = ""
    is_relative: bool = False
    is_type_only: bool = False


@dataclass
class RouteInfo:
    method: str
    path: str
    handler: str = ""


@dataclass
class FileInfo:
    path: Path
    relative_path: str
    role: str = "unknown"
    functions: list = field(default_factory=list)
    classes: list = field(default_factory=list)
    interfaces: list = field(default_factory=list)
    imports: list = field(default_factory=list)
    routes: list = field(default_factory=list)
    todos: list = field(default_factory=list)
    exports: list = field(default_factory=list)
    line_count: int = 0
    description: str = ""
    is_entry_point: bool = False
    snippet: str = ""


@dataclass
class ProjectSpec:
    root: Path
    name: str
    description: str = ""
    files: list = field(default_factory=list)
    structure: str = ""
    scripts: dict = field(default_factory=dict)
    dependencies: list = field(default_factory=list)
    dev_dependencies: list = field(default_factory=list)
    internal_deps: dict = field(default_factory=dict)
    all_routes: list = field(default_factory=list)
    all_todos: list = field(default_factory=list)
    generated_at: str = ""


# =============================================================================
# Extraction Functions
# =============================================================================

def detect_file_role(relative_path: str) -> str:
    """Classify file by its role in the project."""
    path_lower = relative_path.lower()
    for role, patterns in ROLE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, path_lower):
                return role
    return "module"


def clean_type(type_str: str) -> str:
    """Clean up type string, removing extra whitespace and truncating if needed."""
    if not type_str:
        return ""
    
    # Normalize whitespace
    cleaned = ' '.join(type_str.split()).strip()
    
    # Remove trailing semicolons/commas
    cleaned = cleaned.rstrip(';,')
    
    # If it contains template literals, it's probably not a type
    if '${' in cleaned or '`' in cleaned:
        return ""
    
    # Truncate overly long types
    if len(cleaned) > 60:
        # Try to find a good break point
        if '|' in cleaned[:50]:
            cleaned = cleaned[:cleaned.rfind('|', 0, 50)] + ' | ...'
        elif ',' in cleaned[:50]:
            cleaned = cleaned[:cleaned.rfind(',', 0, 50)] + ', ...>'
        else:
            cleaned = cleaned[:57] + '...'
    
    return cleaned


def parse_jsdoc(jsdoc: str) -> tuple[str, list[ParamInfo], str]:
    """Parse JSDoc comment into description, params, and return type."""
    if not jsdoc:
        return "", [], ""
    
    # Clean up JSDoc formatting
    lines = []
    for line in jsdoc.split('\n'):
        line = re.sub(r'^\s*\*\s?', '', line).strip()
        if line:
            lines.append(line)
    
    description_parts = []
    params = []
    return_type = ""
    
    for line in lines:
        if line.startswith('@param'):
            match = PATTERNS['jsdoc_param'].match(line)
            if match:
                params.append(ParamInfo(
                    name=match.group(2),
                    type=match.group(1) or "",
                    description=match.group(3) or ""
                ))
        elif line.startswith('@return'):
            match = PATTERNS['jsdoc_returns'].match(line)
            if match:
                return_type = match.group(1) or ""
        elif not line.startswith('@'):
            description_parts.append(line)
    
    description = ' '.join(description_parts)[:200]
    return description, params, return_type


def extract_jsdoc_before(content: str, pos: int) -> str:
    """Extract JSDoc comment that appears immediately before a given position."""
    before = content[:pos]
    
    # Look for the last /** ... */ block before this position
    # But only if it's close (within 200 chars of whitespace/code)
    # This prevents picking up JSDoc from a previous function
    
    # Find the last */ before the position
    last_close = before.rfind('*/')
    if last_close == -1:
        return ""
    
    # Check that there's only whitespace between */ and the function
    between = before[last_close + 2:]
    if between.strip() and not between.strip().startswith('export'):
        # There's code between the JSDoc and this function - skip
        return ""
    
    # Now find the matching /** for this */
    # Search backwards from last_close for /**
    search_start = max(0, last_close - 2000)  # Don't search too far back
    jsdoc_start = before.rfind('/**', search_start, last_close)
    if jsdoc_start == -1:
        return ""
    
    # Extract just this JSDoc block
    jsdoc_content = before[jsdoc_start + 3:last_close]
    return jsdoc_content


def extract_interface_properties(content: str, interface_name: str) -> list[PropertyInfo]:
    """Extract properties from an interface or type definition."""
    properties = []
    
    # Find the start of the interface
    pattern = rf'(?:export\s+)?(?:interface|type)\s+{re.escape(interface_name)}(?:<[^>]+>)?\s*(?:=\s*)?\{{'
    match = re.search(pattern, content)
    
    if not match:
        return properties
    
    # Extract body using brace counting
    start = match.end() - 1  # Include the opening brace
    brace_count = 0
    body_start = None
    body_end = None
    
    for i, char in enumerate(content[start:], start):
        if char == '{':
            if brace_count == 0:
                body_start = i + 1
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                body_end = i
                break
    
    if body_start is None or body_end is None:
        return properties
    
    body = content[body_start:body_end]
    
    # Parse properties - capture at depth 0 before any nested braces
    lines = body.split('\n')
    current_depth = 0
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//'):
            current_depth += line.count('{') - line.count('}')
            continue
        
        # At depth 0, try to match a property definition
        if current_depth == 0:
            # Match: propertyName?: typeOrOpenBrace
            prop_match = re.match(r'^(\w+)(\?)?\s*:\s*(.*)$', stripped)
            if prop_match:
                prop_name = prop_match.group(1)
                optional = prop_match.group(2) == '?'
                type_part = prop_match.group(3).strip()
                
                # Determine the type representation
                if type_part.startswith('{') or type_part == '{':
                    prop_type = '{...}'
                elif 'Array<{' in type_part:
                    prop_type = 'Array<{...}>'
                elif type_part.startswith('[{'):
                    prop_type = '[{...}]'
                elif '<{' in type_part:
                    base = type_part.split('<')[0]
                    prop_type = f'{base}<{{...}}>'
                else:
                    prop_type = type_part.rstrip(';,')
                    if len(prop_type) > 50:
                        prop_type = prop_type[:47] + '...'
                
                properties.append(PropertyInfo(
                    name=prop_name,
                    type=clean_type(prop_type),
                    optional=optional
                ))
        
        # Update depth after processing the line
        current_depth += line.count('{') - line.count('}')
    
    return properties[:15]



def extract_class_details(content: str, class_match) -> ClassInfo:
    """Extract comprehensive class information."""
    is_default = bool(class_match.group(1))
    class_name = class_match.group(2)
    extends = class_match.group(3) or ""
    implements = class_match.group(4) or ""
    
    # Get JSDoc before class
    jsdoc = extract_jsdoc_before(content, class_match.start())
    description, _, _ = parse_jsdoc(jsdoc)
    
    # Find class body
    start = class_match.end()
    brace_count = 0
    class_body = ""
    in_class = False
    
    for i, char in enumerate(content[start:], start):
        if char == '{':
            brace_count += 1
            in_class = True
        elif char == '}':
            brace_count -= 1
        
        if in_class:
            class_body += char
            if brace_count == 0:
                break
    
    # Extract constructor
    constructor_params = ""
    ctor_match = PATTERNS['class_constructor'].search(class_body)
    if ctor_match:
        constructor_params = ctor_match.group(1)
    
    # Extract methods (excluding constructor and common non-methods)
    methods = []
    skip_names = {'constructor', 'if', 'for', 'while', 'switch', 'catch', 'return'}
    for match in PATTERNS['class_method'].finditer(class_body):
        method_name = match.group(2)
        if method_name not in skip_names:
            methods.append(FunctionInfo(
                name=method_name,
                params=[ParamInfo(name=p.strip()) for p in (match.group(4) or "()")[1:-1].split(',') if p.strip()],
                return_type=clean_type(match.group(5) or ""),
                is_async=bool(match.group(1))
            ))
    
    # Extract properties - only match actual class properties, not object literals
    properties = []
    # Look for properties with type annotations at the class level (2-space indent typical)
    # Must either have access modifier OR be followed by semicolon/type annotation
    prop_pattern = re.compile(
        r'^  (?:(?:private|public|protected|readonly|static)\s+)*(\w+)(\?)?\s*:\s*([^;{\n]+)\s*;',
        re.MULTILINE
    )
    for match in prop_pattern.finditer(class_body):
        prop_name = match.group(1)
        prop_type = match.group(3).strip()
        
        # Skip if it looks like an object property (lowercase start, short name in quotes context)
        if prop_name in skip_names or prop_name.startswith('_'):
            continue
        # Skip if type contains template literals or function calls (likely inside a method)
        if '${' in prop_type or '`' in prop_type:
            continue
        # Truncate long types
        if len(prop_type) > 40:
            prop_type = prop_type[:37] + '...'
            
        properties.append(PropertyInfo(
            name=prop_name,
            type=clean_type(prop_type),
            optional=match.group(2) == '?'
        ))
    
    return ClassInfo(
        name=class_name,
        extends=clean_type(extends),
        implements=clean_type(implements),
        constructor_params=constructor_params,
        methods=methods[:12],
        properties=properties[:10],
        description=description,
        is_default=is_default
    )


def extract_file_info(file_path: Path, root: Path, include_snippet: bool = False, max_snippet_lines: int = 40) -> Optional[FileInfo]:
    """Extract comprehensive information from a JS/TS file."""
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return None
    
    relative = str(file_path.relative_to(root)).replace('\\', '/')
    lines = content.splitlines()
    
    info = FileInfo(
        path=file_path,
        relative_path=relative,
        role=detect_file_role(relative),
        line_count=len(lines),
        is_entry_point=file_path.name in ENTRY_POINTS
    )
    
    # File-level description from first JSDoc
    first_jsdoc = PATTERNS['jsdoc_block'].search(content)
    if first_jsdoc and first_jsdoc.start() < 500:  # Only if near start of file
        desc, _, _ = parse_jsdoc(first_jsdoc.group(1))
        info.description = desc
    
    # Extract exported functions
    for match in PATTERNS['export_function'].finditer(content):
        is_async = bool(match.group(1))
        name = match.group(2)
        params_str = match.group(4) or "()"
        return_type = clean_type(match.group(5) or "")
        
        jsdoc = extract_jsdoc_before(content, match.start())
        desc, jsdoc_params, jsdoc_return = parse_jsdoc(jsdoc)
        
        # Parse params from signature
        sig_params = []
        param_content = params_str[1:-1]
        if param_content:
            for p in param_content.split(','):
                p = p.strip()
                if ':' in p:
                    pname, ptype = p.split(':', 1)
                    sig_params.append(ParamInfo(name=pname.strip(), type=clean_type(ptype)))
                elif p:
                    sig_params.append(ParamInfo(name=p.split('=')[0].strip()))
        
        # Use signature params if available, fall back to JSDoc only if signature is empty
        # This prevents JSDoc params from wrong functions bleeding in
        if sig_params:
            params = sig_params
        elif jsdoc_params:
            params = jsdoc_params
        else:
            params = []
        
        info.functions.append(FunctionInfo(
            name=name,
            params=params,
            return_type=return_type or jsdoc_return,
            description=desc,
            is_async=is_async
        ))
        info.exports.append(name)
    
    # Arrow function exports
    for match in PATTERNS['export_arrow'].finditer(content):
        name = match.group(1)
        is_async = bool(match.group(3))
        params_str = match.group(4) or ""
        return_type = clean_type(match.group(5) or match.group(2) or "")
        
        params = []
        if params_str:
            for p in params_str.split(','):
                p = p.strip()
                if ':' in p:
                    pname, ptype = p.split(':', 1)
                    params.append(ParamInfo(name=pname.strip(), type=clean_type(ptype)))
                elif p:
                    params.append(ParamInfo(name=p.split('=')[0].strip()))
        
        jsdoc = extract_jsdoc_before(content, match.start())
        desc, _, _ = parse_jsdoc(jsdoc)
        
        info.functions.append(FunctionInfo(
            name=name,
            params=params,
            return_type=return_type,
            description=desc,
            is_async=is_async
        ))
        info.exports.append(name)
    
    # Classes
    for match in PATTERNS['export_class'].finditer(content):
        class_info = extract_class_details(content, match)
        info.classes.append(class_info)
        info.exports.append(class_info.name)
    
    # Interfaces and types
    for match in PATTERNS['export_interface'].finditer(content):
        kind = match.group(1)
        name = match.group(2)
        
        jsdoc = extract_jsdoc_before(content, match.start())
        desc, _, _ = parse_jsdoc(jsdoc)
        
        properties = extract_interface_properties(content, name)
        
        info.interfaces.append(InterfaceInfo(
            name=name,
            kind=kind,
            properties=properties,
            description=desc
        ))
        info.exports.append(name)
    
    # Const exports
    for match in PATTERNS['export_const'].finditer(content):
        name = match.group(1)
        if name not in info.exports:
            info.exports.append(name)
    
    # Default exports
    for match in PATTERNS['export_default'].finditer(content):
        name = match.group(1)
        if name not in info.exports:
            info.exports.append(f"{name} (default)")
    
    # Imports
    for match in PATTERNS['import_statement'].finditer(content):
        named = match.group(1)
        default_imp = match.group(2)
        namespace = match.group(3)
        module = match.group(4)
        
        items = []
        if named:
            items = [i.strip().split(' as ')[0].strip() for i in named.split(',')]
        
        info.imports.append(ImportInfo(
            module=module,
            items=items,
            default_import=default_imp or namespace or "",
            is_relative=module.startswith('.'),
            is_type_only='type' in content[match.start():match.start()+20]
        ))
    
    # Routes
    for match in PATTERNS['express_route'].finditer(content):
        info.routes.append(RouteInfo(
            method=match.group(1).upper(),
            path=match.group(2)
        ))
    
    for match in PATTERNS['decorator_route'].finditer(content):
        info.routes.append(RouteInfo(
            method=match.group(1).upper(),
            path=match.group(2)
        ))
    
    # TODOs
    for match in PATTERNS['todo_comment'].finditer(content):
        tag = match.group(1).upper()
        text = match.group(2).strip()[:80]
        info.todos.append(f"{tag}: {text}")
    
    # Code snippet for priority files
    if include_snippet and any(re.search(p, relative) for p in SNIPPET_PRIORITY):
        # Get first N non-empty, non-comment lines after imports
        snippet_lines = []
        past_imports = False
        for line in lines:
            stripped = line.strip()
            if not past_imports:
                if stripped and not stripped.startswith('import') and not stripped.startswith('//'):
                    past_imports = True
            if past_imports:
                if stripped and not stripped.startswith('//'):
                    snippet_lines.append(line)
                if len(snippet_lines) >= max_snippet_lines:
                    break
        info.snippet = '\n'.join(snippet_lines)
    
    return info


def parse_package_json(root: Path) -> dict:
    """Extract relevant info from package.json."""
    pkg_path = root / 'package.json'
    if not pkg_path.exists():
        return {}
    
    try:
        with open(pkg_path) as f:
            pkg = json.load(f)
        return {
            'name': pkg.get('name', ''),
            'description': pkg.get('description', ''),
            'scripts': pkg.get('scripts', {}),
            'dependencies': list(pkg.get('dependencies', {}).keys()),
            'devDependencies': list(pkg.get('devDependencies', {}).keys()),
        }
    except Exception:
        return {}


def build_dependency_graph(files: list[FileInfo]) -> dict[str, list[str]]:
    """Build internal dependency graph showing what imports what."""
    # Map file stems/paths to their FileInfo
    file_map = {}
    for f in files:
        # Store by various possible import paths
        stem = f.path.stem
        rel_no_ext = f.relative_path.rsplit('.', 1)[0]
        file_map[stem] = f.relative_path
        file_map[rel_no_ext] = f.relative_path
        file_map['./' + rel_no_ext] = f.relative_path
        file_map['/' + rel_no_ext] = f.relative_path
    
    graph = {}  # target -> [importers]
    
    for file in files:
        for imp in file.imports:
            if imp.is_relative:
                # Try to resolve the import
                for key in file_map:
                    if imp.module.endswith(key) or key.endswith(imp.module.lstrip('./')):
                        target = file_map[key]
                        if target != file.relative_path:
                            if target not in graph:
                                graph[target] = []
                            if file.relative_path not in graph[target]:
                                graph[target].append(file.relative_path)
                        break
    
    return graph


# =============================================================================
# Tree Generation
# =============================================================================

def generate_tree(root: Path, ignore_patterns: set, max_depth: int = 4, prefix: str = "") -> str:
    """Generate directory tree structure."""
    if max_depth < 0:
        return ""
    
    try:
        entries = sorted(root.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    except PermissionError:
        return ""
    
    entries = [e for e in entries if e.name not in ignore_patterns and not e.name.startswith('.')]
    tree_str = ""
    
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


# =============================================================================
# Markdown Generation
# =============================================================================

def format_params(params: list[ParamInfo]) -> str:
    """Format parameter list."""
    if not params:
        return "()"
    parts = []
    for p in params:
        if p.type:
            parts.append(f"{p.name}: {p.type}")
        else:
            parts.append(p.name)
    return f"({', '.join(parts)})"


def format_function(fn: FunctionInfo, verbosity: Verbosity) -> str:
    """Format a function signature."""
    async_prefix = "async " if fn.is_async else ""
    params = format_params(fn.params)
    ret = f" -> {fn.return_type}" if fn.return_type else ""
    
    sig = f"{async_prefix}{fn.name}{params}{ret}"
    
    # Truncate overly long signatures
    if len(sig) > 80:
        # Try to show function name + first few params
        if len(fn.params) > 3:
            short_params = format_params(fn.params[:3])
            sig = f"{async_prefix}{fn.name}{short_params[:-1]}, ...)"
            if fn.return_type:
                sig += f" -> {fn.return_type}"
        else:
            sig = sig[:77] + "..."
    
    result = f"- `{sig}`"
    
    if verbosity == Verbosity.FULL and fn.description:
        result += f" - {fn.description}"
    
    return result


def format_class(cls: ClassInfo, verbosity: Verbosity) -> list[str]:
    """Format class information."""
    lines = []
    
    # Class declaration
    decl = f"class {cls.name}"
    if cls.extends:
        decl += f" extends {cls.extends}"
    if cls.implements:
        decl += f" implements {cls.implements}"
    lines.append(f"**{decl}**")
    
    if verbosity != Verbosity.MINIMAL and cls.description:
        lines.append(f"  {cls.description}")
    
    # Constructor
    if cls.constructor_params and cls.constructor_params != "()":
        lines.append(f"  constructor{cls.constructor_params}")
    
    # Properties (standard and full only) - filter out empty/invalid types
    if verbosity != Verbosity.MINIMAL and cls.properties:
        valid_props = [p for p in cls.properties if p.type and p.name]
        if valid_props:
            props = []
            for p in valid_props[:6]:
                opt = "?" if p.optional else ""
                props.append(f"{p.name}{opt}: {p.type}")
            lines.append(f"  Properties: {', '.join(props)}")
    
    # Methods
    if cls.methods:
        lines.append("  Methods:")
        for m in cls.methods[:8]:
            async_p = "async " if m.is_async else ""
            params = format_params(m.params)
            ret = f" -> {m.return_type}" if m.return_type else ""
            lines.append(f"    - {async_p}{m.name}{params}{ret}")
    
    return lines


def format_interface(iface: InterfaceInfo, verbosity: Verbosity) -> list[str]:
    """Format interface/type information."""
    lines = []
    
    kind = "type" if iface.kind == "type" else "interface"
    
    if not iface.properties:
        # For types without properties, just show the name
        lines.append(f"**{kind} {iface.name}**")
        return lines
    
    if verbosity == Verbosity.MINIMAL:
        # Single line format
        props = [f"{p.name}{'?' if p.optional else ''}: {p.type}" for p in iface.properties[:6]]
        lines.append(f"**{kind} {iface.name}** {{ {', '.join(props)} }}")
    else:
        # Multi-line format
        lines.append(f"**{kind} {iface.name}** {{")
        for p in iface.properties[:10]:
            opt = "?" if p.optional else ""
            lines.append(f"  {p.name}{opt}: {p.type}")
        lines.append("}")
    
    return lines


def generate_spec(project: ProjectSpec, verbosity: Verbosity) -> str:
    """Generate the SPEC markdown content."""
    lines = [
        f"# {project.name}",
        "",
        f"Generated: {project.generated_at}",
    ]
    
    if project.description:
        lines.extend(["", project.description])
    
    lines.append("")
    
    # Scripts (if any)
    if project.scripts and verbosity != Verbosity.MINIMAL:
        lines.extend(["## Scripts", ""])
        for name, cmd in list(project.scripts.items())[:8]:
            cmd_short = cmd[:60] + "..." if len(cmd) > 60 else cmd
            lines.append(f"- `{name}`: {cmd_short}")
        lines.append("")
    
    # Directory structure
    lines.extend([
        "## Structure",
        "",
        "```",
        f"{project.name}/",
        project.structure.rstrip(),
        "```",
        "",
    ])
    
    # Quick stats
    total_lines = sum(f.line_count for f in project.files)
    lines.extend([
        "## Stats",
        "",
        f"Files: {len(project.files)} | Lines: {total_lines:,} | Routes: {len(project.all_routes)} | TODOs: {len(project.all_todos)}",
        "",
    ])
    
    # Routes
    if project.all_routes:
        lines.extend(["## Routes", ""])
        for route in project.all_routes[:25]:
            lines.append(f"- {route.method} {route.path}")
        if len(project.all_routes) > 25:
            lines.append(f"- ... +{len(project.all_routes) - 25} more")
        lines.append("")
    
    # TODOs (condensed)
    if project.all_todos and verbosity != Verbosity.MINIMAL:
        lines.extend(["## TODOs", ""])
        for todo, filepath in project.all_todos[:12]:
            lines.append(f"- [{Path(filepath).name}] {todo}")
        if len(project.all_todos) > 12:
            lines.append(f"- ... +{len(project.all_todos) - 12} more")
        lines.append("")
    
    # Group files by role then by directory
    roles_order = ['config', 'route', 'controller', 'service', 'model', 'state', 'view', 'util', 'type', 'middleware', 'module']
    files_by_role: dict[str, list[FileInfo]] = {}
    
    for f in project.files:
        role = f.role if f.role in roles_order else 'module'
        if role not in files_by_role:
            files_by_role[role] = []
        files_by_role[role].append(f)
    
    # Modules section
    lines.extend(["## Modules", ""])
    
    for role in roles_order:
        if role not in files_by_role:
            continue
        
        role_files = files_by_role[role]
        role_title = role.title() + "s" if not role.endswith('s') else role.title()
        
        lines.extend([f"### {role_title}", ""])
        
        for file in sorted(role_files, key=lambda f: f.relative_path):
            # File header
            entry_mark = " [entry]" if file.is_entry_point else ""
            lines.append(f"#### {file.relative_path}{entry_mark}")
            lines.append("")
            
            if file.description and verbosity != Verbosity.MINIMAL:
                lines.append(f"{file.description}")
                lines.append("")
            
            # Classes
            for cls in file.classes:
                lines.extend(format_class(cls, verbosity))
                lines.append("")
            
            # Interfaces (full verbosity only, or if no classes)
            if file.interfaces and (verbosity == Verbosity.FULL or not file.classes):
                for iface in file.interfaces[:5]:
                    lines.extend(format_interface(iface, verbosity))
                    lines.append("")
            
            # Standalone functions
            fn_names_in_classes = set()
            for cls in file.classes:
                for m in cls.methods:
                    fn_names_in_classes.add(m.name)
            
            standalone_fns = [fn for fn in file.functions if fn.name not in fn_names_in_classes]
            if standalone_fns:
                lines.append("Functions:")
                for fn in standalone_fns[:10]:
                    lines.append(format_function(fn, verbosity))
                if len(standalone_fns) > 10:
                    lines.append(f"- ... +{len(standalone_fns) - 10} more")
                lines.append("")
            
            # Routes for this file
            if file.routes:
                routes_str = ", ".join(f"{r.method} {r.path}" for r in file.routes[:5])
                lines.append(f"Routes: {routes_str}")
                lines.append("")
            
            # External dependencies - deduplicated
            external = list(dict.fromkeys(imp.module for imp in file.imports if not imp.is_relative))
            if external and verbosity != Verbosity.MINIMAL:
                lines.append(f"Imports: {', '.join(external[:8])}")
                lines.append("")
            
            # Code snippet
            if file.snippet and verbosity == Verbosity.FULL:
                lines.extend([
                    "```typescript",
                    file.snippet,
                    "```",
                    ""
                ])
    
    # Dependencies summary
    if project.dependencies:
        lines.extend([
            "## Dependencies",
            "",
            ", ".join(sorted(project.dependencies)),
            "",
        ])
    
    # Internal dependency graph
    if project.internal_deps and verbosity != Verbosity.MINIMAL:
        lines.extend([
            "## Internal Imports",
            "",
            "File <- Imported by:",
            "",
        ])
        for target, importers in sorted(project.internal_deps.items())[:20]:
            importers_short = [Path(i).name for i in importers[:3]]
            more = f" +{len(importers) - 3}" if len(importers) > 3 else ""
            lines.append(f"- {target} <- {', '.join(importers_short)}{more}")
        lines.append("")
    
    return '\n'.join(lines)


# =============================================================================
# Main
# =============================================================================

def scan_project(root: Path, ignore_patterns: set, include_snippets: bool, max_snippet_lines: int) -> list[FileInfo]:
    """Scan project and extract info from all code files."""
    files = []
    
    for file_path in root.rglob('*'):
        if file_path.is_file():
            # Skip ignored directories
            if any(p in file_path.parts for p in ignore_patterns):
                continue
            # Skip ignored files
            if file_path.name in IGNORE_FILES:
                continue
            if file_path.suffix in CODE_EXTENSIONS:
                info = extract_file_info(file_path, root, include_snippets, max_snippet_lines)
                if info:
                    # Skip empty files (no meaningful content to document)
                    has_content = (
                        info.exports or 
                        info.functions or 
                        info.classes or 
                        info.interfaces or 
                        info.routes
                    )
                    if has_content:
                        files.append(info)
    
    return sorted(files, key=lambda x: x.relative_path)


def main():
    parser = argparse.ArgumentParser(
        description="Generate SPEC.md optimized for LLM context"
    )
    parser.add_argument("path", help="Project root directory")
    parser.add_argument("-o", "--output", default="SPEC.md", help="Output file name")
    parser.add_argument("-d", "--depth", type=int, default=4, help="Tree depth")
    parser.add_argument("--ignore", nargs="*", default=[], help="Additional dirs to ignore")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout")
    parser.add_argument(
        "-v", "--verbosity",
        choices=['minimal', 'standard', 'full'],
        default='standard',
        help="Output verbosity level"
    )
    parser.add_argument("--max-snippet-lines", type=int, default=40, help="Max lines per code snippet")
    
    args = parser.parse_args()
    
    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Error: Path '{root}' does not exist")
        return 1
    
    ignore_patterns = DEFAULT_IGNORE | set(args.ignore)
    verbosity = Verbosity(args.verbosity)
    include_snippets = verbosity == Verbosity.FULL
    
    print(f"Scanning {root} (verbosity: {args.verbosity})...")
    
    # Parse package.json
    pkg = parse_package_json(root)
    
    # Build project spec
    project = ProjectSpec(
        root=root,
        name=pkg.get('name') or root.name,
        description=pkg.get('description', ''),
        scripts=pkg.get('scripts', {}),
        dependencies=pkg.get('dependencies', []),
        dev_dependencies=pkg.get('devDependencies', []),
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    
    project.structure = generate_tree(root, ignore_patterns, args.depth)
    project.files = scan_project(root, ignore_patterns, include_snippets, args.max_snippet_lines)
    project.internal_deps = build_dependency_graph(project.files)
    
    # Collect routes and TODOs (deduplicate routes)
    seen_routes = set()
    for file in project.files:
        for route in file.routes:
            route_key = f"{route.method} {route.path}"
            if route_key not in seen_routes:
                seen_routes.add(route_key)
                project.all_routes.append(route)
        for todo in file.todos:
            project.all_todos.append((todo, file.relative_path))
    
    print(f"Found {len(project.files)} files, {len(project.all_routes)} routes, {len(project.all_todos)} TODOs")
    
    spec_content = generate_spec(project, verbosity)
    
    if args.stdout:
        print(spec_content)
    else:
        output_path = root / args.output
        output_path.write_text(spec_content, encoding='utf-8')
        print(f"Generated: {output_path}")
        print(f"Size: {len(spec_content):,} chars (~{len(spec_content)//4:,} tokens)")
    
    return 0


if __name__ == "__main__":
    exit(main())