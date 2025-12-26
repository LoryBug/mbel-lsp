§MBEL:5.0

# System Patterns

## Architecture
@pattern::MonorepoLSP
```
mbel-lsp/
├── packages/
│   ├── mbel-core/        ← Lexer+Parser (TDDAB#1-2) ✓
│   ├── mbel-analyzer/    ← Diagnostics (TDDAB#3) ○
│   └── mbel-lsp/         ← LSP Server (TDDAB#4-5) ○
├── vscode-extension/     ← VSCode client ○
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

TDDAB#3::MbelDiagnostics○
├── Scope::ErrorDetection+Warnings+Recovery
├── Dependencies::mbel-core
├── Tests::TBD
└── Status::NotStarted

TDDAB#4::LspServer○
├── Scope::Initialize+TextSync+PublishDiagnostics
├── Dependencies::mbel-core,mbel-analyzer
├── Tests::TBD
└── Status::NotStarted

TDDAB#5::LspFeatures○
├── Scope::Hover+Completion+DocumentSymbols
├── Dependencies::LspServer
├── Tests::TBD
└── Status::NotStarted
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
