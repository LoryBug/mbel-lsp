§MBEL:6.0

[ARCHITECTURE]
@pattern::MonorepoLSP
(
mbel-lsp/
├── packages/
│   ├── mbel-core/{Lexer+Parser}✓
│   ├── mbel-analyzer/{Diagnostics+QueryEngine}✓
│   ├── mbel-lsp/{Server+Features+LLM-API}✓
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
  ->files[packages/mbel-core/src/lexer.ts, packages/mbel-core/src/types.ts]
  ->tests[packages/mbel-core/tests/lexer.test.ts, packages/mbel-core/tests/lexer-links.test.ts, packages/mbel-core/tests/lexer-anchors.test.ts]
  ->entryPoint{lexer.ts:MbelLexer}
  ->related[Parser, Analyzer]

@feature{Parser}
  ->files[packages/mbel-core/src/parser.ts, packages/mbel-core/src/ast.ts]
  ->tests[packages/mbel-core/tests/parser.test.ts, packages/mbel-core/tests/parser-links.test.ts, packages/mbel-core/tests/parser-anchors.test.ts]
  ->entryPoint{parser.ts:MbelParser}
  ->depends[Lexer]
  ->related[Analyzer]

@feature{Analyzer}
  ->files[packages/mbel-analyzer/src/analyzer.ts, packages/mbel-analyzer/src/types.ts]
  ->tests[packages/mbel-analyzer/tests/analyzer.test.ts, packages/mbel-analyzer/tests/links-validation.test.ts, packages/mbel-analyzer/tests/anchors-validation.test.ts]
  ->entryPoint{analyzer.ts:MbelAnalyzer}
  ->depends[Parser]

@feature{LSPServer}
  ->files[packages/mbel-lsp/src/server.ts, packages/mbel-lsp/src/types.ts, packages/mbel-lsp/src/bin.ts]
  ->tests[packages/mbel-lsp/tests/server.test.ts, packages/mbel-lsp/tests/features.test.ts]
  ->entryPoint{server.ts:MbelServer}
  ->depends[Parser, Analyzer]

@feature{QueryService}
  ->files[packages/mbel-lsp/src/query-service.ts]
  ->tests[packages/mbel-lsp/tests/query-service.test.ts]
  ->entryPoint{query-service.ts:QueryService}
  ->depends[Parser]
  ->related[LSPServer]

@feature{VSCodeExtension}
  ->files[packages/vscode-extension/src/extension.ts]
  ->docs[packages/vscode-extension/README.md]
  ->depends[LSPServer]

[ANCHORS]
§anchors
@entry::packages/mbel-core/src/index.ts
  ->descrizione::Core package entry point (exports Lexer, Parser, AST types)
@entry::packages/mbel-lsp/src/index.ts
  ->descrizione::LSP package entry point (exports Server, QueryService)
@entry::packages/mbel-lsp/src/bin.ts
  ->descrizione::CLI entry point for LSP server
@hotspot::packages/mbel-core/src/parser.ts
  ->descrizione::Frequently modified when adding new syntax
@hotspot::packages/mbel-analyzer/src/analyzer.ts
  ->descrizione::Frequently modified when adding validation rules
@boundary::packages/mbel-lsp/src/server.ts
  ->descrizione::LSP protocol boundary

[TDDAB_PLAN_V5]
@methodology::TDDAB{TestFirst,Atomic,Verified}
@status::Complete✓{259tests,coverage%87}

[TDDAB_BLOCKS_V5]
✓TDDAB#1::MbelLexer{scope:Tokenize27Operators,tests:61,coverage:100%}
✓TDDAB#2::MbelParser{scope:BuildAST,tests:42,coverage:91%}
✓TDDAB#3::MbelAnalyzer{scope:Diagnostics,tests:48,coverage:95%}
✓TDDAB#4::LspServer{scope:Initialize+TextSync,tests:34,coverage:99%}
✓TDDAB#5::LspFeatures{scope:Hover+Completion+Symbols,tests:29,coverage:98%}
✓TDDAB#6::GoToDefinition{scope:NavigateToDeclarations,tests:11}
✓TDDAB#7::FindReferences+WorkspaceSymbols{scope:LocateUsages,tests:23}
✓TDDAB#8::LLMQueryMethods{scope:SemanticQueries,tests:11}

[TDDAB_PLAN_V6]
@methodology::TDDAB{LLM-Native,SemanticStorage,Integrations}
@status::Phase1-Active{1of8-complete}
@vision::CodebaseBrain{LLM-native-memory-bank}

[TDDAB_BLOCKS_V6_PHASE1_LANG_EXT]
§focus::LanguageExtensions{Sequential}
✓TDDAB#9::CrossRefLinks{scope:§links,tokens:14,tests:79,coverage:90.32%,priority:1}
  ↳new-operators::{->files,->tests,->docs,->decisions,->related,->entrypoint,->blueprint,->depends,->features,->why}
  ↳new-tokens::{@feature,@task,{TO-CREATE},{TO-MODIFY},[...]}
  ↳ast-nodes::{LinkDeclaration,FileRef,EntryPoint,LinkType,FileMarker,LineRange,ArrowClauseType}
  ↳analyzer-codes::17{MBEL-LINK-001→070}
  ↳test-files::{lexer-links.test.ts,parser-links.test.ts,links-validation.test.ts}
  ↳modified-files::{types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,index.ts}
  ↳status::Complete✓{build✓,lint✓,tests✓,coverage✓}

✓TDDAB#10::SemanticAnchors{scope:§anchors,tokens:4,tests:37,coverage:90.85%,priority:2}
  ↳new-tokens::{ARROW_DESCRIZIONE,ANCHOR_ENTRY,ANCHOR_HOTSPOT,ANCHOR_BOUNDARY}
  ↳ast-nodes::{AnchorDeclaration{anchorType,path,isGlob,description}}
  ↳analyzer-codes::5{MBEL-ANCHOR-001→011}
  ↳patterns::{AnchorPrefixMap:similar-to-ARROW_OPERATORS,PositionWhitespaceDetection:for-path-validation,TypeFilteredStatementCheck:anchor-specific}
  ↳test-files::{lexer-anchors.test.ts,parser-anchors.test.ts,anchors-validation.test.ts}
  ↳modified-files::{types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,index.ts}
  ↳status::Complete✓{build✓,lint✓,tests✓,coverage✓}

✓TDDAB#11::DecisionLog{scope:§decisions-extended,tokens:8,tests:60,priority:4}
  ↳new-operators::{->alternatives,->reason,->tradeoff,->context,->status,->revisit,->supersededBy}
  ↳new-tokens::{DECISION_DATE}
  ↳ast-nodes::{DecisionDeclaration{date,name,alternatives,reason,tradeoff,context,status,supersededBy,revisit},DecisionStatus}
  ↳analyzer-codes::9{MBEL-DECISION-001→040}
  ↳test-files::{lexer-decisions.test.ts,parser-decisions.test.ts,decisions-validation.test.ts}
  ↳modified-files::{types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,index.ts}
  ↳status::Complete✓{build✓,lint✓,tests✓,coverage✓}

✓TDDAB#12::HeatMap{scope:§heat,tokens:11,tests:75,priority:5}
  ↳new-operators::{->dependents,->untouched,->changes,->coverage,->confidence,->impact,->caution}
  ↳new-tokens::{@critical::,@stable::,@volatile::,@hot::}
  ↳ast-nodes::{HeatDeclaration{date,name,components,analysis,prefixes},HeatType}
  ↳analyzer-codes::70{MBEL-HEAT-001→070}
  ↳test-files::{lexer-heat.test.ts,parser-heat.test.ts,heat-validation.test.ts}
  ↳modified-files::{types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,index.ts}
  ↳status::Complete✓{build✓,lint✓,tests✓,coverage✓}

?TDDAB#13::IntentMarkers{scope:§intents,tokens:~8,tests:~16,priority:6}
  ↳new-operators::{->does,->doesNot,->contract,->singleResponsibility,->antiPattern,->extends}
  ↳new-tokens::{@Module::Component}
  ↳files-to-create::{intents-rules.ts}

[TDDAB_BLOCKS_V6_PHASE2_INFRA]
§focus::Infrastructure{QueryEngine}
?TDDAB#15::QueryEngine{scope:semantic-navigation,tests:15,priority:3.5}
  ↳new-modules::{query-engine/index.ts,dependency-graph.ts,semantic-search.ts,impact-analyzer.ts}
  ↳capabilities::{DependencyGraph,SemanticIndex,ImpactAnalysis,CompositeQueries}

[TDDAB_BLOCKS_V6_PHASE3_API]
§focus::APILayer{LLM-Native}
?TDDAB#14::LLMAPILayer{scope:lsp-methods,tests:25,priority:3}
  ↳methods::{getAnchor,getCrossRefs,getEditRisk,getImpactAnalysis,getDecisions,getIntent,getWorkContext}
  ↳new-modules::{llm-api/index.ts,anchor-handler.ts,crossref-handler.ts,risk-handler.ts,decision-handler.ts,intent-handler.ts,workcontext-handler.ts}

[TDDAB_BLOCKS_V6_PHASE4_INTEGRATION]
§focus::Integration{Tools+Commands}
?TDDAB#16::ToolIntegrations{scope:opencode+vscode,tests:10,priority:last}
  ↳opencode::{/mb-context,/mb-risk,mbel-workcontext-tool}
  ↳vscode::{codelens-provider,hover-provider-ext,tree-view}

[NEW_TOKENS_V6]
@tokens::Section{§links,§anchors,§decisions,§heat,§intents}
@tokens::Operators-Links{->files,->tests,->docs,->decisions,->related,->entrypoint,->blueprint,->depends,->features,->why}
@tokens::Operators-Anchors{->descrizione}
@tokens::Operators-Decisions{->alternatives,->reason,->tradeoff,->context,->status,->revisit,->supersededBy}
@tokens::Operators-Heat{->dependents,->untouched,->changes,->coverage,->confidence,->impact,->caution}
@tokens::Operators-Intents{->does,->doesNot,->contract,->singleResponsibility,->antiPattern,->extends}
@tokens::Prefixes{@entry::,@hotspot::,@boundary::,@critical::,@stable::,@volatile::,@hot::}
@tokens::Markers{@feature,@task,{TO-CREATE},{TO-MODIFY},@date::,@Module::Component,[...]}

[DATA_FLOW]
@flow::Pipeline-V5
Source{.mbel/.mbel.md}→Lexer{tokens}→Parser{AST}→Analyzer{diagnostics}→LSP{features}
@flow::Pipeline-V6
Source{.mbel/.mbel.md}→Lexer{tokens}→Parser{AST}→Analyzer{diagnostics+semantics}→QueryEngine{graphs+index}→LSP{LLM-API}→Integration{tools}

[KEY_PATTERNS]
@patterns::
- Lexer::ScannerPattern{peek,advance,tokenize}
- Parser::RecursiveDescentParser{LeftAssociative}
- AST::ImmutableNodes{readonly,Position}
- LSP::EventDriven{didOpen,didChange,didClose}
- LLMQueries::PatternMatching{regex,semantic}
- OpenCodeIntegration::SlashCommands{!shell-injection}+CustomTool{zod-schema}
- QueryEngine::DependencyGraph{BuildFromAST,NavigateSemantics}
- LLMAPILayer::RequestResponse{typed-inputs,rich-outputs}
