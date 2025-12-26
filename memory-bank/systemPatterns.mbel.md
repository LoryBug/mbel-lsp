§MBEL:5.0

[ARCHITECTURE]
@pattern::MonorepoLSP
(
mbel-lsp/
├── packages/
│   ├── mbel-core/{Lexer+Parser}✓
│   ├── mbel-analyzer/{Diagnostics}✓
│   ├── mbel-lsp/{Server+Features}✓
│   └── vscode-extension/{Client}✓
├── memory-bank/{*.mbel.md}
└── package.json{npm-workspaces}
)

[TDDAB_PLAN]
@methodology::TDDAB{TestFirst,Atomic,Verified}

[TDDAB_BLOCKS]
✓TDDAB#1::MbelLexer{scope:Tokenize27Operators,tests:61,coverage:100%}
✓TDDAB#2::MbelParser{scope:BuildAST,tests:42,coverage:91%}
✓TDDAB#3::MbelAnalyzer{scope:Diagnostics,tests:48,coverage:95%}
✓TDDAB#4::LspServer{scope:Initialize+TextSync,tests:34,coverage:99%}
✓TDDAB#5::LspFeatures{scope:Hover+Completion+Symbols,tests:29,coverage:98%}
✓TDDAB#6::GoToDefinition{scope:NavigateToDeclarations,tests:11}
✓TDDAB#7::FindReferences+WorkspaceSymbols{scope:LocateUsages,tests:23}
✓TDDAB#8::LLMQueryMethods{scope:SemanticQueries,tests:11}

[DATA_FLOW]
@flow::Pipeline
Source{.mbel/.mbel.md}→Lexer{tokens}→Parser{AST}→Analyzer{diagnostics}→LSP{features}

[KEY_PATTERNS]
@patterns::
- Lexer::ScannerPattern{peek,advance,tokenize}
- Parser::RecursiveDescentParser{LeftAssociative}
- AST::ImmutableNodes{readonly,Position}
- LSP::EventDriven{didOpen,didChange,didClose}
- LLMQueries::PatternMatching{regex,semantic}
