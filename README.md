# MBEL v5 Language Server

Language Server Protocol (LSP) implementation for **MBEL v5** (Memory Bank Expression Language) - a concise notation language for AI context management.

## Features

- **Syntax Highlighting** - Full support for all 27+ MBEL operators
- **Diagnostics** - Real-time error detection and warnings
- **Hover Information** - Documentation for operators on hover
- **Code Completion** - Operator suggestions with descriptions
- **Document Symbols** - Outline view with sections and attributes
- **Code Blocks** - Support for ``` fenced blocks (diagrams, folder structures)

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
npx @vscode/vsce package --allow-missing-repository --no-dependencies
```

## Project Structure

```
mbel-lsp/
├── packages/
│   ├── mbel-core/          # Lexer + Parser
│   ├── mbel-analyzer/      # Semantic analysis + Diagnostics
│   ├── mbel-lsp/           # LSP Server
│   └── vscode-extension/   # VSCode client
├── memory-bank/            # Example MBEL files
└── package.json            # npm workspaces
```

## MBEL v5 Syntax

### Operators (27+)

| Category | Operators | Description |
|----------|-----------|-------------|
| **Temporal** | `@` `>` `?` `≈` | Present, Past, Future, Approximate |
| **State** | `✓` `✗` `!` `⚡` | Complete, Failed, Critical, Active |
| **Relation** | `::` `:` `→` `←` `↔` `+` `-` | Bindings and relationships |
| **Structure** | `[]` `{}` `()` `<>` `\|` | Sections, metadata, notes, variants |
| **Quantification** | `#` `%` `~` | Count, percentage, range |
| **Logic** | `&` `\|\|` `¬` | AND, OR, NOT |
| **Meta** | `§` `©` | Version, source/attribution |

### Example

```mbel
§MBEL:5.0

[FOCUS]
@current::ImplementingFeature{priority:high}
>completed::PreviousTask✓
?planned::NextStep

[DEPENDENCIES]
@deps::typescript^5.3.0,vitest^1.0.0

[NOTES]
(This is a comment block that won't generate errors)
```

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
| mbel-core | 61 | 100% |
| mbel-analyzer | 48 | 95% |
| mbel-lsp | 63 | 98% |
| **Total** | **214** | **94%** |

## Possible Improvements

### Short-term

- [ ] **Go to Definition** - Navigate to section declarations
- [ ] **Find References** - Find all usages of a section/attribute
- [ ] **Rename Symbol** - Rename sections and attributes across file
- [ ] **Folding Ranges** - Collapse sections and code blocks
- [ ] **Semantic Tokens** - Enhanced syntax highlighting via LSP

### Medium-term

- [ ] **Multi-file Support** - Cross-file references and diagnostics
- [ ] **Quick Fixes** - Auto-fix for common errors (add missing `§`, close brackets)
- [ ] **Code Actions** - Convert between temporal states, wrap in metadata
- [ ] **Formatting** - Auto-format MBEL documents
- [ ] **Snippets** - Common MBEL patterns (section template, attribute template)

### Long-term

- [ ] **Workspace Symbols** - Search symbols across all files
- [ ] **Language Server Index** - Persistent index for large projects
- [ ] **Custom Diagnostics** - User-configurable rules
- [ ] **MBEL Schema** - Define expected structure for validation
- [ ] **Export** - Convert MBEL to JSON/YAML/Markdown

### Extension Improvements

- [ ] **Publish to Marketplace** - Official VSCode extension
- [ ] **Theme Support** - MBEL-specific color themes
- [ ] **Icon Theme** - Custom icons for `.mbel` files
- [ ] **Webview Panel** - Visual MBEL editor/preview
- [ ] **Other Editors** - Neovim, Sublime Text, JetBrains IDEs

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
