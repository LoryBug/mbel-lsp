§MBEL:6.0

[FOCUS]
@focus::MBEL6.0{v6-Complete}
>status::AllTDDABComplete{#1-#19}✓
>tests::733{94.71%coverage}
>next::ProductionReadiness{docs,marketplace}

[STATUS_SUMMARY]
✓CoreLanguage::Lexer+Parser+Analyzer+LSP{v5}
✓MBEL6Extensions::Links+Anchors+Decisions+Heat+Intents
✓QueryInfrastructure::QueryService+QueryEngine
✓LLMIntegration::LLM-API+ToolIntegrations
✓OpenCodeIntegration::SlashCommands+CustomTools

[DECISIONS]
§decision::TypeScriptOnly{noAny,strict}
§decision::Vitest>Jest{modern,faster}
§decision::ESM{type:module}
§decision::MonorepoWorkspaces{packages/*}
§decision::ImmutableAST{readonly-properties}
§decision::LeftAssociativeChains{A→B→C=(A→B)→C}
§decision::SectionBrackets{[SECTION]not##Title}
§decision::OpenCodeIntegration{SlashCommands+CustomTool>MCP}
§decision::MBEL6.0-LLM-Native{IncrementalPhases,SemanticStorage}
§decision::QueryEngineArchitecture{DependencyGraph+SemanticIndex}
§decision::LLMAPIStandalone{7methods,RequestResponse}

[HEAT]
@critical::packages/mbel-core/src/lexer.ts
  ->dependents[parser.ts,analyzer.ts,server.ts]
  ->coverage{96%}

@critical::packages/mbel-core/src/parser.ts
  ->dependents[analyzer.ts,server.ts]
  ->coverage{93%}

@hot::packages/mbel-analyzer/src/analyzer.ts
  ->coverage{97%}
  ->impact{high}

@stable::packages/mbel-core/src/types.ts
  ->coverage{100%}

@volatile::packages/mbel-lsp/src/query-service.ts
  ->coverage{97%}
  ->caution{API-still-evolving}

[BLOCKERS]
!OpenCodeLSP::AutoActivation{commands-work,lsp-not-auto-started}

[METRICS]
@tests::733{total}
@coverage::94.71%
@packages::4{core,analyzer,lsp,vscode-extension}
