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
?TDDAB#10::SemanticAnchors{scope:§anchors,tokens:~5,tests:18,priority:2}
  ↳new-operators::{->descrizione}
  ↳new-tokens::{@entry::,@hotspot::,@boundary::}
  ↳files-to-create::{anchors-rules.ts}
?TDDAB#11::DecisionLog{scope:§decisions-extended,tokens:~8,tests:20,priority:4}
  ↳new-operators::{->alternatives,->reason,->tradeoff,->context,->status,->revisit,->supersededBy}
  ↳new-tokens::{@date::}
  ↳files-to-create::{decisions-rules.ts}
?TDDAB#12::HeatMap{scope:§heat,tokens:~10,tests:18,priority:5}
  ↳new-operators::{->dependents,->untouched,->changes,->coverage,->confidence,->impact,->caution}
  ↳new-tokens::{@critical::,@stable::,@volatile::,@hot::}
  ↳files-to-create::{heat-rules.ts}
?TDDAB#13::IntentMarkers{scope:§intents,tokens:~8,tests:16,priority:6}
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
