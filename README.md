# MBEL v6 Language Server

Language Server Protocol (LSP) implementation for **MBEL v6** (Memory Bank Expression Language) - a concise notation language for AI context management.

## Features

### Core LSP Features
- **Syntax Highlighting** - Full support for all 35+ MBEL operators
- **Diagnostics** - Real-time error detection and warnings
- **Hover Information** - Documentation for operators on hover
- **Code Completion** - Operator suggestions with descriptions
- **Document Symbols** - Outline view with sections and attributes
- **Go to Definition** - Navigate to section/attribute declarations
- **Find References** - Find all usages of a symbol
- **Workspace Symbols** - Search symbols across all open files

### LLM Query Methods (AI Agent API)
Specialized methods for AI agents to query project status efficiently:

| Method | Marker | Description |
|--------|--------|-------------|
| `getPendingItems()` | `?` | Get all planned/future tasks |
| `getCompletedItems()` | `✓` | Get all completed items |
| `getFailedItems()` | `✗` | Get all failed items |
| `getCriticalItems()` | `!` | Get all critical/urgent items |
| `getActiveItems()` | `@` `⚡` | Get all active/in-progress items |
| `getRecentChanges()` | `>` | Get all recent changes |
| `getProjectStatus()` | - | Get aggregated counts |

### OpenCode Integration

Full integration with [OpenCode](https://opencode.ai) AI coding assistant:

**Slash Commands** - Type these in OpenCode TUI:
| Command | Description |
|---------|-------------|
| `/mb` | Full Memory Bank status query |
| `/mb-pending` | Show pending items (?) |
| `/mb-recent` | Show recent changes (>) |

**Custom Tool** - The LLM can call `mbel-query` directly:
```
mbel-query(query: "status")   # Get project status counts
mbel-query(query: "pending")  # Get pending items
mbel-query(query: "all")      # Full project overview
```

**LSP Integration** - Configure in `opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "mbel": {
      "command": ["node", "path/to/mbel-lsp/dist/bin.js", "--stdio"],
      "extensions": [".mbel", ".mbel.md"]
    }
  }
}
```

## File Extensions

The LSP supports two file extensions:
- `.mbel` - Pure MBEL files
- `.mbel.md` - MBEL files with Markdown compatibility

## Installation

### VSCode Extension (Local)

1. Download the latest `.vsix` from `packages/vscode-extension/`
2. Open VSCode
3. Press `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
4. Select `mbel-vscode-0.1.0.vsix`
5. Reload VSCode

**Or via command line:**
```bash
code --install-extension packages/vscode-extension/mbel-vscode-0.1.0.vsix
```

### Build from Source

```bash
# Clone repository
git clone <repo-url>
cd mbel-lsp

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Package VSCode extension
cd packages/vscode-extension
npx @vscode/vsce package --allow-missing-repository
```

## Project Structure

```
mbel-lsp/
├── packages/
│   ├── mbel-core/          # Lexer + Parser
│   ├── mbel-analyzer/      # Semantic analysis + Diagnostics
│   ├── mbel-lsp/           # LSP Server
│   └── vscode-extension/   # VSCode client
├── .opencode/
│   ├── command/            # Slash commands (/mb, /mb-pending, /mb-recent)
│   └── tool/               # Custom tools (mbel-query)
├── memory-bank/            # Example MBEL files
├── opencode.json           # OpenCode LSP config
└── package.json            # npm workspaces
```

## MBEL v6 Syntax

### Core Operators (27+)

| Category | Operators | Description |
|----------|-----------|-------------|
| **Temporal** | `@` `>` `?` `≈` | Present, Past, Future, Approximate |
| **State** | `✓` `✗` `!` `⚡` | Complete, Failed, Critical, Active |
| **Relation** | `::` `:` `→` `←` `↔` `+` `-` | Bindings and relationships |
| **Structure** | `[]` `{}` `()` `<>` `\|` | Sections, metadata, notes, variants |
| **Quantification** | `#` `%` `~` | Count, percentage, range |
| **Logic** | `&` `\|\|` `¬` | AND, OR, NOT |
| **Meta** | `§` `©` | Version, source/attribution |

### MBEL v6 Extensions

#### CrossRefLinks (`§links` section)
Bidirectional linking system connecting features to implementation files:

```mbel
[LINKS]
§links
@feature{Parser}
  ->files[src/parser.ts, src/ast.ts]
  ->tests[tests/parser.test.ts]
  ->docs[docs/parser.md]
  ->entryPoint{parser.ts:MbelParser:45}

@task{RefactorLexer}
  ->files[src/lexer.ts{TO-MODIFY}]
  ->depends[Parser, Analyzer]
  ->blueprint["1.Update tokens", "2.Add tests", "3.Refactor"]
```

**Arrow Clauses:**
| Clause | Description |
|--------|-------------|
| `->files[...]` | Implementation files (supports glob: `src/**/*.ts`) |
| `->tests[...]` | Test files |
| `->docs[...]` | Documentation files |
| `->entryPoint{file:symbol:line}` | Main entry point |
| `->depends[...]` | Dependencies on other features |
| `->related[...]` | Related features |
| `->decisions[...]` | Architectural decisions |
| `->blueprint[...]` | Implementation steps |

**File Markers:**
- `{TO-CREATE}` - File needs to be created
- `{TO-MODIFY}` - File needs modification
- `:10-50` - Line range (lines 10 to 50)

#### SemanticAnchors (`§anchors` section)
Semantic entry points marking important code locations:

```mbel
[ANCHORS]
§anchors
@entry::src/index.ts
  ->descrizione::Main application entry point
@hotspot::src/core/parser.ts
  ->descrizione::Frequently modified, high change rate
@boundary::src/api/external.ts
  ->descrizione::System boundary for external API
```

**Anchor Types:**
| Type | Description |
|------|-------------|
| `@entry::` | Application entry points |
| `@hotspot::` | Frequently modified files (high churn) |
| `@boundary::` | System boundaries (APIs, integrations) |

### Basic Example

```mbel
§MBEL:6.0

[FOCUS]
@current::ImplementingFeature{priority:high}
>completed::PreviousTask✓
?planned::NextStep

[DEPENDENCIES]
@deps::typescript^5.3.0,vitest^1.0.0

[LINKS]
§links
@feature{Core}->files[src/index.ts]->tests[tests/index.test.ts]

[ANCHORS]
§anchors
@entry::src/index.ts
  ->descrizione::Main entry

[NOTES]
(This is a comment block that won't generate errors)
```

## Diagnostics

### CrossRefLinks Validation (MBEL-LINK-*)
| Code | Severity | Description |
|------|----------|-------------|
| MBEL-LINK-001 | Error | Link without name |
| MBEL-LINK-002 | Error | Invalid name characters |
| MBEL-LINK-003 | Warning | Duplicate link names |
| MBEL-LINK-010 | Error | Invalid glob pattern |
| MBEL-LINK-011 | Error | Invalid line range format |
| MBEL-LINK-020 | Warning | Reference to undefined decision |
| MBEL-LINK-030 | Warning | Circular dependency |
| MBEL-LINK-070 | Hint | Orphan link (no files or tests) |

### SemanticAnchors Validation (MBEL-ANCHOR-*)
| Code | Severity | Description |
|------|----------|-------------|
| MBEL-ANCHOR-001 | Error | Empty anchor path |
| MBEL-ANCHOR-002 | Error | Path contains spaces |
| MBEL-ANCHOR-003 | Warning | Duplicate anchor for same path |
| MBEL-ANCHOR-010 | Warning | Empty description |
| MBEL-ANCHOR-011 | Error | Invalid glob pattern (e.g., `***`) |

## Development

### Commands

```bash
npm run build        # Build all packages
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript check
npm run btlt         # Build + Type-check + Lint + Test
```

### Test Coverage

| Package | Tests | Coverage |
|---------|-------|----------|
| mbel-core | 177 | 92% |
| mbel-analyzer | 90 | 96% |
| mbel-lsp | 108 | 98% |
| **Total** | **375** | **91%** |

## Roadmap

### MBEL v6 Phase 1 (In Progress)
- [x] **TDDAB#9: CrossRefLinks** - Bidirectional feature-to-file linking
- [x] **TDDAB#10: SemanticAnchors** - Semantic code entry points
- [ ] **TDDAB#11: DecisionLog** - Architectural decision records
- [ ] **TDDAB#12: BlueprintSteps** - Implementation step tracking
- [ ] **TDDAB#13: ContextWindow** - Token budget management
- [ ] **TDDAB#14: MetricsBlock** - Project metrics tracking
- [ ] **TDDAB#15: DependencyGraph** - Visual dependency mapping
- [ ] **TDDAB#16: ChangeHistory** - Temporal change tracking

### Core Features (Completed)
- [x] **OpenCode Integration** - Slash commands + Custom tools
- [x] **LLM Query Methods** - Semantic queries for AI agents
- [x] **Go to Definition** - Navigate to declarations
- [x] **Find References** - Find all usages
- [x] **Workspace Symbols** - Cross-file symbol search

### Future
- [ ] **Rename Symbol** - Rename sections/attributes across file
- [ ] **Folding Ranges** - Collapse sections and code blocks
- [ ] **Code Actions** - Quick fixes for common errors
- [ ] **Multi-file Support** - Cross-file references and diagnostics
- [ ] **Formatting** - Auto-format MBEL documents
- [ ] **Publish to Marketplace** - Official VSCode extension

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript (strict mode)
- **Build**: tsc + esbuild
- **Test**: Vitest
- **LSP**: vscode-languageserver

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following TDDAB methodology (Test-first, Atomic blocks)
4. Ensure all tests pass (`npm run btlt`)
5. Submit a pull request
