# MBEL v6 Language Server

Language Server Protocol (LSP) implementation for **MBEL v6** (Memory Bank Expression Language) - a concise notation language for AI context management.

## Features

### Core LSP Features
- **Syntax Highlighting** - Full support for all 66 MBEL operators (15 essential + 51 advanced)
- **Diagnostics** - Real-time error detection and warnings (35+ diagnostic codes)
- **Hover Information** - Documentation for operators on hover
- **Code Completion** - Operator suggestions with descriptions
- **Document Symbols** - Outline view with sections and attributes
- **Go to Definition** - Navigate to section/attribute declarations
- **Find References** - Find all usages of a symbol
- **Workspace Symbols** - Search symbols across all open files
- **CodeLens** - Visual indicators for features, anchors, decisions, and heat

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

### LlmApi Class (Programmatic LLM Interface)

The `LlmApi` class provides a unified API for LLM clients to query MBEL documents with typed request/response interfaces:

```typescript
import { LlmApi } from '@mbel/lsp';

const api = new LlmApi();
api.loadDocument(mbelContent);

// Feature navigation
const features = api.getAllFeatures();           // Get all feature names
const refs = api.getCrossRefs('Parser');         // Get feature cross-references

// Semantic queries
const anchor = api.getAnchor({ type: 'entry' }); // Find anchor by type/path
const anchors = api.getAllAnchors();             // Get all semantic anchors

// Risk and impact analysis
const risk = api.getEditRisk({ file: 'src/parser.ts' });
const impact = api.getImpactAnalysis({ files: ['src/lexer.ts'] });

// Decision tracking
const decisions = api.getDecisions({ status: 'ACTIVE' });
const allDecisions = api.getAllDecisions();

// Intent and contract queries
const intent = api.getIntent({ module: 'Parser', component: 'Lexer' });
const moduleIntents = api.getIntentsByModule('Parser');

// Complete work context for a feature
const context = api.getWorkContext('Parser');
```

**LlmApi Methods:**
| Method | Description |
|--------|-------------|
| `loadDocument(content)` | Load MBEL document for querying |
| `isLoaded()` | Check if document is loaded |
| `getAllFeatures()` | Get all feature names |
| `getCrossRefs(featureName)` | Get cross-references for a feature |
| `getAnchor(request)` | Find anchor by path or type |
| `getAllAnchors()` | Get all semantic anchors |
| `getEditRisk(request)` | Get edit risk assessment for a file |
| `getImpactAnalysis(request)` | Analyze impact of changing files |
| `getDecisions(request)` | Find decisions by pattern/status/context |
| `getAllDecisions()` | Get all decisions |
| `getIntent(request)` | Get intent for module/component |
| `getIntentsByModule(module)` | Get all intents for a module |
| `getWorkContext(featureName)` | Get complete work context |

### Agent CLI (`@mbel/cli`)

Command-line interface designed for AI agents with JSON output:

```bash
# Validate MBEL file (pre-commit hook)
mbel check memory-bank/progress.mbel.md --format=json

# Analyze impact of modifying a file
mbel impact src/parser.ts --mb memory-bank

# Get token-optimized feature summary
mbel context Parser --mode=summary

# Show MBEL grammar reference
mbel grammar --format=bnf
mbel grammar --format=examples

# Simulate architecture changes (dry-run)
mbel simulate --action=add-dep --from=Analyzer --to=Lexer
mbel simulate --action=remove-feature --feature=OldModule

# Multi-agent architecture commands
mbel merge memory-bank/activeContext.mbel.md --delta "[PROGRESS]\n✓Task::Done" --dry-run
mbel task-validate '{"id":"TDDAB#1","type":"implement",...}'
mbel result-validate '{"taskId":"TDDAB#1","status":"completed",...}'
```

**Commands:**
| Command | Description |
|---------|-------------|
| `check <file>` | Pre-commit validation with suggested fixes |
| `impact <file>` | Risk analysis and affected features |
| `context <feature>` | Token-optimized feature summary |
| `grammar` | On-demand syntax reference (BNF/examples) |
| `simulate` | Predictive architecture simulation |
| `merge <file>` | Atomic merge of MBEL delta into Memory Bank |
| `task-validate <json>` | Validate TaskAssignment for orchestrator |
| `result-validate <json>` | Validate TaskResult from subagent |

**Intent-Aware Diagnostics:**
- Detects Unicode arrows (→) and suggests ASCII (`->`)
- Fixes curly quotes ("") to straight quotes (`""`)
- Converts ellipsis (…) to three dots (`...`)
- Provides `suggestedFix` with find/replace for auto-correction

### Claude Code Skill (`mbel-navigator`)

Built-in skill for Claude Code that enables LLM navigation of Memory Bank:

```bash
# List all features
node .claude/skills/mbel-navigator/scripts/query-mb.mjs features

# Get feature details
node .claude/skills/mbel-navigator/scripts/query-mb.mjs feature Parser

# Find features using a file
node .claude/skills/mbel-navigator/scripts/query-mb.mjs file lexer.ts

# Show dependency tree
node .claude/skills/mbel-navigator/scripts/query-mb.mjs deps LSPServer

# List hotspots
node .claude/skills/mbel-navigator/scripts/query-mb.mjs anchors-type hotspot
```

**Automatic Activation**: Claude automatically uses this skill when you ask:
- "Where is X implemented?"
- "What files does feature Y use?"
- "Show me the entry points"
- "What are the hotspots?"

**Documentation**:
- `SKILL.md` - Main instructions
- `SYNTAX.md` - MBEL 6.0 syntax reference
- `QUERY-API.md` - QueryService API documentation

### QueryService API

Programmatic API for navigating MBEL documents:

```typescript
import { QueryService } from '@mbel/lsp';

const qs = new QueryService();
const content = readFileSync('memory-bank/systemPatterns.mbel.md', 'utf-8');

// Forward lookup: feature → files
const parser = qs.getFeatureFiles(content, 'Parser');

// Reverse lookup: file → features
const features = qs.getFileFeatures(content, 'lexer.ts');

// Get all entry points
const entries = qs.getEntryPoints(content);

// Get anchors by type
const hotspots = qs.getAnchorsByType(content, 'hotspot');
```

### OpenCode Integration

Full integration with [OpenCode](https://opencode.ai) AI coding assistant:

**Slash Commands** - Type these in OpenCode TUI:
| Command | Description |
|---------|-------------|
| `/mb` | Full Memory Bank status query |
| `/mb-pending` | Show pending items (?) |
| `/mb-recent` | Show recent changes (>) |

**Custom Tool** - The LLM can call `mbel-semantic` directly:
```
mbel-semantic(query: "status")   # Get project status counts
mbel-semantic(query: "pending")  # Get pending items
mbel-semantic(query: "all")      # Full project overview
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

### Multi-Agent Architecture

MBEL supports orchestrator + subagent patterns for AI coding assistants:

```
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (Claude Opus/Sonnet)                           │
│ - Reads MB: mbel context <feature> --mode=summary           │
│ - Plans TDDAB blocks                                        │
│ - Spawns subagents with TaskAssignment JSON                 │
│ - Merges deltas: mbel merge <file> --delta "..."            │
│ - SINGLE WRITER to Memory Bank                              │
└─────────────────────────────────────────────────────────────┘
         │ TaskAssignment                    ▲ TaskResult
         ▼                                   │
┌─────────────────────────────────────────────────────────────┐
│ SUBAGENT (Claude Sonnet/Haiku)                              │
│ - Receives task + MBEL context                              │
│ - Implements 1 TDDAB block                                  │
│ - Returns TaskResult with mb_delta                          │
│ - READ-ONLY access to MB                                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- **Context Isolation** - Orchestrator stays lean, subagents disposable
- **No Autocompact Risk** - Subagents can be terminated without state loss
- **Atomic MB Updates** - Single-writer pattern prevents conflicts
- **Token Efficiency** - 47% savings via MBEL compression

**TaskAssignment Schema:**
```json
{
  "id": "TDDAB#31",
  "type": "implement|refactor|test|fix|document",
  "target": "FeatureName",
  "description": "What to implement",
  "context": { "mbSnapshot": "...", "files": [...], "dependencies": [...] },
  "acceptance": ["Tests pass", "100% coverage"],
  "constraints": { "maxFiles": 5, "testCommand": "npm test" }
}
```

**TaskResult Schema:**
```json
{
  "taskId": "TDDAB#31",
  "status": "completed|blocked|failed|partial",
  "filesChanged": [{"path": "...", "action": "created|modified|deleted"}],
  "tests": {"passed": 25, "failed": 0, "skipped": 0, "newTests": 25},
  "mbDelta": "[PROGRESS]\n✓TDDAB#31::Feature{completed}",
  "blockers": [],
  "duration": 45000
}
```

**Documentation:** See `docs/MBEL-MULTIAGENT-GUIDE.md` for full workflow details.

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
│   ├── mbel-core/          # Lexer + Parser + Operator Tiers
│   ├── mbel-analyzer/      # Semantic analysis + Diagnostics
│   ├── mbel-lsp/           # LSP Server + QueryService + LLM API
│   ├── mbel-cli/           # Agent CLI (8 commands + multi-agent schemas)
│   │   ├── commands/       # check, impact, context, grammar, simulate, merge
│   │   ├── schemas/        # TaskAssignment, TaskResult
│   │   └── orchestrator/   # Context builder, Delta aggregator
│   └── vscode-extension/   # VSCode client
├── .claude/
│   ├── commands/           # Slash commands (/orchestrator, /mb, etc.)
│   └── skills/
│       └── mbel-navigator/ # Claude Code skill for MB navigation
├── .opencode/
│   ├── command/            # Slash commands (/mb, /mb-pending, /mb-recent)
│   └── tool/               # Custom tools (mbel-semantic)
├── docs/                   # Documentation
│   ├── MBEL-GRAMMAR.md
│   ├── MBEL-CHEATSHEET.md
│   ├── MBEL-OPERATORS-GUIDE.md
│   └── MBEL-MULTIAGENT-GUIDE.md
├── memory-bank/            # MBEL Memory Bank files
├── opencode.json           # OpenCode LSP config
└── package.json            # npm workspaces
```

## MBEL v6 Syntax

### Core Operators (66 total: 15 Essential + 51 Advanced)

**Operator Tier System:**
MBEL operators are classified into two tiers for improved IDE completions:

- **ESSENTIAL (15 operators)** - Core operators for basic MBEL documents. Appear first in completions.
- **ADVANCED (51 operators)** - Extended operators for v6 features. Appear after Essential operators.

The tier-aware completion system sorts suggestions to show Essential operators first, helping new users learn the core syntax before advanced features.

| Category | Operators | Description |
|----------|-----------|-------------|
| **Temporal** | `@` `>` `?` `≈` | Present, Past, Future, Approximate |
| **State** | `✓` `✗` `!` `⚡` | Complete, Failed, Critical, Active |
| **Relation** | `::` `:` `→` `←` `↔` `+` `-` | Bindings and relationships |
| **Structure** | `[]` `{}` `()` `<>` `\|` | Sections, metadata, notes, variants |
| **Quantification** | `#` `%` `~` | Count, percentage, range |
| **Logic** | `&` `\|\|` `¬` | AND, OR, NOT |
| **Meta** | `§` `©` | Version, source/attribution |
| **Anchors** | `@entry::` `@hotspot::` `@boundary::` | Semantic entry points |
| **Heat** | `@critical::` `@hot::` `@stable::` `@volatile::` | File change tracking |
| **Decisions** | `@YYYY-MM-DD::` | Date-indexed decisions |

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

#### DecisionLog (`§decisions` section)
Architectural decision records with rationale tracking:

```mbel
[DECISIONS]
§decisions
@2024-12-27::UseTypeScript
  ->reason{Type safety and better IDE support}
  ->alternatives{JavaScript, Flow, ReScript}
  ->tradeoff{Build step required, learning curve}
  ->context{src/core, src/api}
  ->status{ACTIVE}

@2024-12-20::AdoptMonorepo
  ->reason{Shared code between packages}
  ->status{SUPERSEDED}
  ->supersededBy{UseNxWorkspace}
```

**Decision Clauses:**
| Clause | Description |
|--------|-------------|
| `->reason{...}` | Why this decision was made |
| `->alternatives{...}` | Options that were considered |
| `->tradeoff{...}` | Trade-offs of this decision |
| `->context{...}` | Files/areas affected |
| `->status{ACTIVE\|SUPERSEDED\|RECONSIDERING}` | Current status |
| `->supersededBy{DecisionName}` | Link to replacement decision |
| `->revisit{YYYY-MM-DD}` | When to reconsider |

#### HeatMap (`§heatmap` section)
File change frequency and risk assessment:

```mbel
[HEATMAP]
§heatmap
@critical::src/security/auth.ts
  ->dependents[UserService, SessionManager]
  ->changes{45}
  ->coverage{98%}
  ->confidence{high}
  ->impact{high}
  ->caution{security-sensitive}

@hot::src/core/parser.ts
  ->changes{23}
  ->coverage{92%}

@stable::src/utils/helpers.ts
  ->changes{2}
  ->coverage{100%}
  ->confidence{high}

@volatile::src/experimental/beta.ts
  ->changes{67}
  ->coverage{45%}
  ->caution{breaking-changes-expected}
```

**Heat Levels:**
| Level | Description |
|-------|-------------|
| `@critical::` | Security-sensitive, high-impact files |
| `@hot::` | Frequently modified (high churn) |
| `@stable::` | Rarely changed, well-tested |
| `@volatile::` | Experimental, expect changes |

**Heat Clauses:**
| Clause | Description |
|--------|-------------|
| `->dependents[...]` | Files that depend on this |
| `->changes{N}` | Number of changes (numeric) |
| `->coverage{N%}` | Test coverage percentage |
| `->confidence{high\|medium\|low}` | Confidence level |
| `->impact{high\|medium\|low}` | Impact if broken |
| `->caution{...}` | Warning message |

#### IntentMarkers (`§intents` section)
Document code intent and responsibility:

```mbel
[INTENTS]
§intents
@Parser::Lexer
  ->does{Tokenizes MBEL source into token stream}
  ->doesNot{Parse tokens into AST, validate semantics}
  ->contract{Input: string, Output: Token[]}
  ->singleResponsibility{Lexical analysis only}

@Core::Analyzer
  ->does{Validates AST and produces diagnostics}
  ->extends{BaseValidator, DiagnosticProducer}
  ->antiPattern{God object, circular dependencies}
```

**Intent Clauses:**
| Clause | Description |
|--------|-------------|
| `->does{...}` | Primary responsibility |
| `->doesNot{...}` | Boundary definition |
| `->contract{...}` | API contract |
| `->singleResponsibility{...}` | SOLID SRP tracking |
| `->extends{...}` | Inheritance/composition |
| `->antiPattern{...}` | Patterns to avoid |

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

### DecisionLog Validation (MBEL-DECISION-*)
| Code | Severity | Description |
|------|----------|-------------|
| MBEL-DECISION-001 | Error | Empty decision name |
| MBEL-DECISION-002 | Warning | Duplicate decision names |
| MBEL-DECISION-010 | Error | Invalid status value |
| MBEL-DECISION-020 | Warning | SUPERSEDED without supersededBy |
| MBEL-DECISION-021 | Warning | Reference to undefined decision |
| MBEL-DECISION-030 | Hint | Decision without reason |
| MBEL-DECISION-031 | Warning | Empty reason clause |
| MBEL-DECISION-032 | Warning | Empty tradeoff clause |
| MBEL-DECISION-040 | Error | Context path with spaces |

### HeatMap Validation (MBEL-HEAT-*)
| Code | Severity | Description |
|------|----------|-------------|
| MBEL-HEAT-001 | Error | Empty heat path |
| MBEL-HEAT-002 | Error | Path with spaces |
| MBEL-HEAT-003 | Warning | Duplicate heat for same path |
| MBEL-HEAT-011 | Error | Invalid glob pattern (e.g., `***`) |
| MBEL-HEAT-020 | Warning | Empty dependents list |
| MBEL-HEAT-030 | Error | Non-numeric changes value |
| MBEL-HEAT-040 | Warning | Empty coverage |
| MBEL-HEAT-050 | Warning | Invalid confidence level |
| MBEL-HEAT-051 | Warning | Empty confidence |
| MBEL-HEAT-060 | Warning | Empty impact |
| MBEL-HEAT-070 | Warning | Empty caution |

### IntentMarkers Validation (MBEL-INTENT-*)
| Code | Severity | Description |
|------|----------|-------------|
| MBEL-INTENT-001 | Error | Empty module name |
| MBEL-INTENT-002 | Error | Empty component name |
| MBEL-INTENT-003 | Warning | Duplicate intent (same module::component) |
| MBEL-INTENT-010 | Warning | Empty ->does clause |
| MBEL-INTENT-011 | Warning | Empty ->doesNot clause |
| MBEL-INTENT-020 | Warning | Empty ->contract clause |
| MBEL-INTENT-030 | Warning | Empty ->singleResponsibility clause |
| MBEL-INTENT-040 | Warning | Empty ->antiPattern clause |
| MBEL-INTENT-050 | Warning | Empty ->extends list |
| MBEL-INTENT-051 | Warning | Invalid ->extends item |

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
| mbel-core | 500+ | 94% |
| mbel-analyzer | 220+ | 97% |
| mbel-lsp | 180+ | 97% |
| mbel-cli | 263 | 95% |
| **Total** | **1150** | **~93%** |

## Roadmap

### MBEL v6 Phase 1 (Complete)
- [x] **TDDAB#9: CrossRefLinks** - Bidirectional feature-to-file linking
- [x] **TDDAB#10: SemanticAnchors** - Semantic code entry points
- [x] **TDDAB#11: DecisionLog** - Architectural decision records
- [x] **TDDAB#12: HeatMap** - File change frequency tracking
- [x] **TDDAB#13: IntentMarkers** - Code intent documentation
- [x] **TDDAB#16: ToolIntegrations** - CodeLens provider + OpenCode tools
- [x] **TDDAB#17: QueryService** - Programmatic API for LLM navigation

### MBEL v6 Phase 2 (Complete)
- [x] **TDDAB#14: LLMAPILayer** - LSP semantic methods for external tools
- [x] **TDDAB#15: QueryEngine** - Cross-file semantic navigation

### MBEL v6 Phase 5: Agent CLI (Complete)
- [x] **TDDAB#20: CLIScaffolding** - Base CLI framework with Commander.js (21 tests)
- [x] **TDDAB#21: MbelCheck** - Pre-commit validation command (15 tests)
- [x] **TDDAB#22: MbelImpact** - Risk analysis command (15 tests)
- [x] **TDDAB#23: IntentAwareDiagnostics** - Self-healing error messages (18 tests)
- [x] **TDDAB#24: MbelContext** - Token-optimized feature summary (19 tests)
- [x] **TDDAB#25: MbelGrammar** - On-demand syntax refresher (13 tests)
- [x] **TDDAB#26: MbelSimulate** - Predictive architecture simulation (21 tests)

### Core Features (Completed)
- [x] **OpenCode Integration** - Slash commands + Custom tools
- [x] **LLM Query Methods** - Semantic queries for AI agents
- [x] **Go to Definition** - Navigate to declarations
- [x] **Find References** - Find all usages
- [x] **Workspace Symbols** - Cross-file symbol search
- [x] **Claude Code Skill** - mbel-navigator for MB navigation
- [x] **Agent CLI** - 8 commands (check, impact, context, grammar, simulate, merge, task-validate, result-validate)
- [x] **Operator Tiers** - 66 operators classified (15 essential + 51 advanced) with tier-aware completions

### MBEL v6 Phase 6: Multi-Agent Architecture (Complete)
- [x] **TDDAB#27: TaskSchema** - Task assignment format for orchestrator→subagent (43 tests)
- [x] **TDDAB#28: ResultSchema** - Result format for subagent→orchestrator (44 tests)
- [x] **TDDAB#29: MbelMerge** - Atomic delta merge into Memory Bank (30 tests)
- [x] **TDDAB#30: OrchestratorHelpers** - Context builder + delta aggregator (24 tests)
- [x] **CLI Integration** - merge, task-validate, result-validate commands
- [x] **Documentation** - MBEL-MULTIAGENT-GUIDE.md + Claude Code commands

### MBEL v6 Phase 7: Production Polish (Next)
- [ ] **Naming Consistency** - Standardize camelCase/lowercase conventions
- [ ] **Escape Rules** - Special character handling
- [ ] **Stricter LSP Validation** - Clear error messages
- [ ] **OpenCode LSP Auto-Activation** - Fix auto-start issue
- [ ] **Real-world Testing** - Orchestrator + subagent workflow validation

### Future
- [ ] **Rename Symbol** - Rename sections/attributes across file
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
