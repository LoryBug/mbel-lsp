§MBEL:5.0

# System Patterns

## Architecture
@pattern::MonorepoLSP
```
mbel-lsp/
├── packages/
│   ├── mbel-core/        ← Lexer+Parser (TDDAB#1-2) ✓
│   ├── mbel-analyzer/    ← Diagnostics (TDDAB#3) ✓
│   └── mbel-lsp/         ← LSP Server+Features (TDDAB#4-5) ✓
├── vscode-extension/     ← VSCode client (complete) ✓
├── memory-bank/          ← ThisMB
└── package.json          ← npm workspaces
```

## TDDAB Plan
@methodology::TDDAB{TestFirst,Atomic,Verified}

### Block Definitions
```
TDDAB#1::MbelLexer✓
├── Scope::Tokenize27Operators+Identifiers+Numbers
├── Tests::#61
├── Coverage::%100
└── Status::Complete

TDDAB#2::MbelParser✓
├── Scope::BuildAST+AllStatementTypes+AllExpressions
├── Tests::#42
├── Coverage::%91
└── Status::Complete

TDDAB#3::MbelDiagnostics✓
├── Scope::ErrorDetection+Warnings+QuickFixes
├── Dependencies::mbel-core
├── Tests::#48
├── Coverage::%95
└── Status::Complete

TDDAB#4::LspServer✓
├── Scope::Initialize+TextSync+PublishDiagnostics+Shutdown
├── Dependencies::mbel-core,mbel-analyzer,vscode-languageserver
├── Tests::#34
├── Coverage::%99
└── Status::Complete

TDDAB#5::LspFeatures✓
├── Scope::Hover+Completion+DocumentSymbols
├── Dependencies::LspServer
├── Tests::#29
├── Coverage::%98
└── Status::Complete
```

## Component Flow
@flow::DataPipeline
```
Source(.mbel) → Lexer(tokens) → Parser(AST) → Analyzer(diagnostics) → LSP(features)
```

## Key Patterns
@patterns::
- Lexer::ScannerPattern{peek,advance,tokenize}
- Parser::RecursiveDescentParser{LeftAssociative}
- AST::ImmutableNodes{readonly,Position}
- LSP::EventDriven{didOpen,didChange,didClose}
