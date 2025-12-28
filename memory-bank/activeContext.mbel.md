§MBEL:6.0

[FOCUS]
@focus::MBEL6.0-Phase5{Agent-CLI}
>status::Phase5Complete✓{#20-#26}
>tests::859{~93%coverage,+53-new}
>next::Phase6{Production-Ready}

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

[PENDING_TASKS]
§priority::P1-Critical{before-public-release}
✓TASK#1::FormalGrammar{BNF/EBNF,docs/MBEL-GRAMMAR.md}
  ->completed{2024-12-28}
✓TASK#2::QuickStartCheatsheet{1-page,docs/MBEL-CHEATSHEET.md}
  ->completed{2024-12-28}
✓TASK#3::UnifyArrowOperators{docs/MBEL-OPERATORS-GUIDE.md}
  ->completed{2024-12-28}

§priority::P2-Important{next-version}
?TASK#4::NamingConsistency{camelCase-or-lowercase}
  ->reason{->depends-vs->entryPoint-inconsistent}
  ->effort{medium}
?TASK#5::OperatorTiers{15-essential+42-advanced}
  ->reason{57-operators-too-many}
  ->effort{low}
  ->impact{high}
?TASK#6::EscapeRules{special-chars-handling}
  ->effort{low}

§priority::P3-NiceToHave
?TASK#7::StricterLSPValidation{clear-error-messages}
?TASK#8::CommonErrorExamples{antipatterns-doc}
?TASK#9::ProgressiveOnboarding{MBEL-lite->MBEL-full}

[EVALUATION]
@report::docs/MBEL-LLM-EVALUATION-REPORT.md
@score::6.8/10{publishable-with-improvements}
@tokenSavings::47%{vs-prose}
@effortReduction::3x{vs-direct-exploration}

[METRICS]
@tests::859{total,+53-Phase5}
  ->breakdown::context{19},grammar{13},simulate{21}
@coverage::93%
@packages::5{core,analyzer,lsp,cli,vscode-extension}
