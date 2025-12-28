---
name: mbel-navigator
description: Navigate and query Memory Bank files using MBEL 6.0 syntax. Use when user asks about features, files, dependencies, entry points, hotspots, anchors, or wants to understand codebase structure from Memory Bank. Also use when user mentions "MB", "Memory Bank", "MBEL", or asks "where is X implemented".
allowed-tools: Read, Bash(node:*)
---

# MBEL Navigator

Navigate and query Memory Bank files to understand codebase structure.

## Quick Start

### 1. Query the Memory Bank (Programmatic)

Use the query script for structured queries:

```bash
node .claude/skills/mbel-navigator/scripts/query-mb.mjs <command> [args]
```

**Available Commands:**

| Command | Args | Description |
|---------|------|-------------|
| `features` | - | List all features with their files |
| `feature` | `<name>` | Get details for a specific feature |
| `file` | `<path>` | Find which features use a file |
| `entries` | - | List all entry points |
| `anchors` | - | List all semantic anchors |
| `anchors-type` | `<type>` | Filter anchors (entry/hotspot/boundary) |
| `deps` | `<name>` | Show dependency tree for a feature |

**Examples:**

```bash
# List all features
node .claude/skills/mbel-navigator/scripts/query-mb.mjs features

# Get Parser feature details
node .claude/skills/mbel-navigator/scripts/query-mb.mjs feature Parser

# Find features using lexer.ts
node .claude/skills/mbel-navigator/scripts/query-mb.mjs file lexer.ts

# Show hotspots
node .claude/skills/mbel-navigator/scripts/query-mb.mjs anchors-type hotspot
```

### 2. Read Memory Bank Directly

For context and status, read files directly:

| File | Purpose |
|------|---------|
| `memory-bank/systemPatterns.mbel.md` | Architecture, features, anchors, code links |
| `memory-bank/activeContext.mbel.md` | Current focus, recent work, next steps |
| `memory-bank/progress.mbel.md` | TDDAB progress, completed tasks |
| `memory-bank/productContext.mbel.md` | Vision, users, success criteria |
| `memory-bank/techContext.mbel.md` | Tech stack, dependencies, commands |

## When to Use What

| User Question | Action |
|---------------|--------|
| "What files implement X?" | `query-mb.mjs feature X` |
| "Where is file Y used?" | `query-mb.mjs file Y` |
| "What are the entry points?" | `query-mb.mjs entries` |
| "Show hotspots" | `query-mb.mjs anchors-type hotspot` |
| "What's the current status?" | Read `activeContext.mbel.md` |
| "What's next to do?" | Read `activeContext.mbel.md` [NEXT] section |
| "How is the project structured?" | Read `systemPatterns.mbel.md` |

## Multi-Agent CLI Commands

The MBEL CLI supports orchestrator/subagent workflows:

```bash
# Get context for subagent (token-optimized)
mbel context <feature> --mode=summary

# Validate task assignment before spawning subagent
mbel task-validate '<json>'
mbel task-validate @path/to/task.json

# Validate result from subagent
mbel result-validate '<json>'
mbel result-validate @path/to/result.json

# Merge delta into Memory Bank (atomic)
mbel merge memory-bank/activeContext.mbel.md --delta "[SECTION]\n..." --dry-run
mbel merge memory-bank/activeContext.mbel.md --delta "[SECTION]\n..."

# Pre-commit validation
mbel check memory-bank/activeContext.mbel.md
```

### Multi-Agent Workflow

```
┌─────────────────────────────────────────────┐
│ ORCHESTRATOR                                │
│ 1. mbel context <feature> --mode=summary    │
│ 2. mbel task-validate '<task-json>'         │
│ 3. Spawn subagent with TaskAssignment       │
│ 4. mbel result-validate '<result-json>'     │
│ 5. mbel merge <file> --delta "..." --dry-run│
│ 6. mbel merge <file> --delta "..."          │
└─────────────────────────────────────────────┘
         │ TaskAssignment        ▲ TaskResult
         ▼                       │
┌─────────────────────────────────────────────┐
│ SUBAGENT                                    │
│ - Receives task + context                   │
│ - Implements 1 TDDAB block                  │
│ - Returns TaskResult with mb_delta          │
└─────────────────────────────────────────────┘
```

### Slash Commands

| Command | Description |
|---------|-------------|
| `/orchestrator` | Activate orchestrator mode |
| `/mb` | Full Memory Bank status query |
| `/mb-pending` | Show pending items |
| `/mb-status` | Quick project status |

## Understanding Results

### Feature Query Result

```json
{
  "name": "Parser",
  "type": "feature",
  "files": ["packages/mbel-core/src/parser.ts", "packages/mbel-core/src/ast.ts"],
  "tests": ["packages/mbel-core/tests/parser.test.ts"],
  "depends": ["Lexer"],
  "entryPoint": { "file": "parser.ts", "symbol": "MbelParser", "line": 45 }
}
```

### Anchor Types

| Type | Meaning |
|------|---------|
| `entry` | Main entry points into the codebase |
| `hotspot` | Frequently modified files |
| `boundary` | System boundaries (APIs, protocols) |

## Reference Documentation

- [SYNTAX.md](./SYNTAX.md) - MBEL 6.0 syntax reference
- [QUERY-API.md](./QUERY-API.md) - QueryService API documentation
