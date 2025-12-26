# MBEL v5 for Visual Studio Code

Language support for MBEL v5 (Memory Bank Expression Language).

## Features

- **Syntax Highlighting** - Full support for all 27 MBEL operators
- **Diagnostics** - Real-time error and warning detection
- **Hover Information** - Documentation for operators
- **Code Completion** - Operator suggestions with descriptions
- **Document Symbols** - Outline view with sections and attributes

## Supported Operators

| Category | Operators |
|----------|-----------|
| Temporal | `@` `>` `?` `≈` |
| State | `✓` `✗` `!` `⚡` |
| Relation | `::` `:` `→` `←` `↔` `+` `-` |
| Structure | `[` `]` `{` `}` `(` `)` `<` `>` `\|` |
| Quantification | `#` `%` `~` |
| Logic | `&` `\|\|` `¬` |
| Meta | `§` `©` |

## Example

```mbel
§MBEL:5.0

[FOCUS]
@current::WorkingOnFeature{priority:high}
>completed::PreviousTask✓
?planned::NextStep

[NOTES]
(This is a comment block)
```

## Installation

1. Download the `.vsix` file
2. Open VS Code
3. Press `Ctrl+Shift+P` and run "Extensions: Install from VSIX..."
4. Select the downloaded file
