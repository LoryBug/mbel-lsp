§MBEL:6.0

[ARCHITECTURE]
@pattern::MonorepoLSP
(
mbel-lsp/
├── packages/
│   ├── mbel-core/{Lexer+Parser}✓
│   ├── mbel-analyzer/{Diagnostics+QueryEngine}✓
│   ├── mbel-lsp/{Server+Features+LLM-API}✓
│   ├── mbel-cli/{CLI+Commands}?
│   └── vscode-extension/{Client}✓
├── .opencode/
│   ├── command/{mb.md,mb-pending.md,mb-recent.md}✓
│   └── tool/{mbel-query.ts,mbel-workcontext.ts}
├── memory-bank/{*.mbel.md}
├── opencode.json{lsp-config}
└── package.json{npm-workspaces}
)

[LINKS]
§links
@feature{Lexer}
  ->files[packages/mbel-core/src/lexer.ts,packages/mbel-core/src/types.ts]
  ->tests[packages/mbel-core/tests/lexer.test.ts,lexer-links.test.ts,lexer-anchors.test.ts]
  ->entryPoint{lexer.ts:MbelLexer}

@feature{Parser}
  ->files[packages/mbel-core/src/parser.ts,packages/mbel-core/src/ast.ts]
  ->tests[packages/mbel-core/tests/parser.test.ts,parser-links.test.ts,parser-anchors.test.ts]
  ->entryPoint{parser.ts:MbelParser}
  ->depends[Lexer]

@feature{Analyzer}
  ->files[packages/mbel-analyzer/src/analyzer.ts,packages/mbel-analyzer/src/types.ts]
  ->tests[packages/mbel-analyzer/tests/analyzer.test.ts,links-validation.test.ts,anchors-validation.test.ts]
  ->entryPoint{analyzer.ts:MbelAnalyzer}
  ->depends[Parser]

@feature{LSPServer}
  ->files[packages/mbel-lsp/src/server.ts,types.ts,bin.ts]
  ->tests[packages/mbel-lsp/tests/server.test.ts,features.test.ts]
  ->entryPoint{server.ts:MbelServer}
  ->depends[Parser,Analyzer]

@feature{QueryService}
  ->files[packages/mbel-lsp/src/query-service.ts]
  ->tests[packages/mbel-lsp/tests/query-service.test.ts]
  ->entryPoint{query-service.ts:QueryService}
  ->depends[Parser]

@feature{VSCodeExtension}
  ->files[packages/vscode-extension/src/extension.ts]
  ->depends[LSPServer]

@feature{CLI}
  ->files[packages/mbel-cli/src/cli.ts,index.ts,commands/*.ts]
  ->tests[packages/mbel-cli/tests/*.test.ts,122tests-Phase5✓]
  ->entryPoint{cli.ts:main}
  ->depends[Parser,Analyzer,QueryService]
  ->commands[
    check{pre-commit-validation,15tests},
    impact{risk-analysis,15tests},
    context{token-optimized-summary,19tests},
    grammar{syntax-reference,13tests},
    simulate{predictive-architecture,21tests}
  ]
  ->scope::Agent-Operating-System{democratize-LSP-capabilities}

[ANCHORS]
§anchors
@entry::packages/mbel-core/src/index.ts
  ->descrizione::Core entry (Lexer,Parser,AST)
@entry::packages/mbel-lsp/src/index.ts
  ->descrizione::LSP entry (Server,QueryService)
@entry::packages/mbel-lsp/src/bin.ts
  ->descrizione::CLI entry
@hotspot::packages/mbel-core/src/parser.ts
  ->descrizione::Frequent syntax additions
@hotspot::packages/mbel-analyzer/src/analyzer.ts
  ->descrizione::Frequent validation rules
@boundary::packages/mbel-lsp/src/server.ts
  ->descrizione::LSP protocol boundary

[TDDAB_METHODOLOGY]
@methodology::TDDAB{TestFirst,Atomic,Verified}
@status::Complete✓{733tests,94.71%coverage}

[DATA_FLOW]
@flow::Pipeline
Source{.mbel/.mbel.md}→Lexer{tokens}→Parser{AST}→Analyzer{diagnostics+semantics}→QueryEngine{graphs}→LSP{LLM-API}→Integration{tools}

[KEY_PATTERNS]
@patterns::
- Lexer::ScannerPattern{peek,advance,tokenize}
- Parser::RecursiveDescentParser{LeftAssociative}
- AST::ImmutableNodes{readonly,Position}
- LSP::EventDriven{didOpen,didChange,didClose}
- QueryEngine::DependencyGraph{BuildFromAST}
- LLMAPILayer::RequestResponse{typed-inputs,rich-outputs}
- OpenCode::SlashCommands+CustomTool{zod-schema}
