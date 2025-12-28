§MBEL:6.0

[FOCUS]
@focus::MBEL6.0{Implementation-Phase2}
>completed::FullLSP{Lexer+Parser+Analyzer+Server+Features+Extension}✓
>completed::OpenCodeIntegration{SlashCommands+CustomTool}✓
>completed::MBEL6.0-Planning{Design-complete}✓
>completed::TDDAB#9::CrossRefLinks{14tokens,79tests,90.32%coverage}✓
>completed::TDDAB#10::SemanticAnchors{4tokens,37tests,90.85%coverage}✓
>completed::TDDAB#17::QueryService{23tests,398total,91.27%coverage}✓
>completed::TDDAB#18::QueryAPI-Anchors{19tests,417total,91.7%coverage}✓
>completed::TDDAB#19::QueryAPI-Dependencies{17tests,434total,92.22%coverage}✓
>completed::TDDAB#11::DecisionLog{8tokens,60tests,494total,92.67%coverage}✓
>completed::TDDAB#12::HeatMap{11tokens,75tests,569total,93.11%coverage}✓
>completed::TDDAB#13::IntentMarkers{7tokens,65tests,634total,93.46%coverage}✓
>completed::TDDAB#14::LLMAPILayer{11methods,50tests,715total,94.16%coverage}✓
>completed::TDDAB#15::QueryEngine{4modules,31tests,665total,93.59%coverage}✓
>completed::TDDAB#16::ToolIntegrations{CodeLens+Hover+getWorkContext,18tests,733total,94.71%coverage}✓

[DONE_V5]
✓ProjectSetup::MonorepoStructure{npmWorkspaces}
✓TypeScriptConfig::StrictMode{noAny,noImplicitReturns}
✓VitestConfig::Coverage%100{thresholds}
✓ESLintConfig::TypeScriptStrict
✓TDDAB#1::MbelLexer{61tests,%100coverage}
✓TDDAB#2::MbelParser{42tests,%91coverage}
✓TDDAB#3::MbelAnalyzer{48tests,%95coverage}
✓TDDAB#4::LspServer{34tests,%99coverage}
✓TDDAB#5::LspFeatures{29tests,%98coverage}
✓VSCodeExtension::mbel-vscode{textmate,languageClient}
✓Documentation::README{installation,improvements}
✓TDDAB#6::GoToDefinition{11tests,sections+attributes+versions}
✓TDDAB#7::FindReferences+WorkspaceSymbols{23tests}
✓TDDAB#8::LLMQueryMethods{11tests,semantic-queries}
✓FileExtension::.mbel.md{dual-support}
✓MBELSyntax::ConvertToSectionBrackets{[SECTION]instead-of-##}
✓OpenCodeSlashCommands::/mb,/mb-pending,/mb-recent
✓OpenCodeCustomTool::mbel-query{status,pending,completed,failed,critical,active,recent,all}
✓OpenCodeConfig::opencode.json{lsp-integration}

[DONE_V6_PLANNING]
✓MBEL6.0-PlanCreated{8blocks,147tests,~40tokens}
✓ArchitectureReview{Phase1-Lang,Phase2-Infra,Phase3-API,Phase4-Tools}
✓MemoryBankUpdated{systemPatterns,progress,activeContext}

[DONE_V6_PHASE1]
✓TDDAB#9::CrossRefLinks{14tokens,79tests,90.32%coverage}
  ↳lexer::10arrows{FILES,TESTS,DOCS,DECISIONS,RELATED,ENTRYPOINT,BLUEPRINT,DEPENDS,FEATURES,WHY}
  ↳lexer::2links{@feature,@task}+1struct{[...]}
  ↳ast::LinkDeclaration+FileRef+EntryPoint+LinkType+FileMarker+LineRange+ArrowClauseType
  ↳analyzer::17codes{MBEL-LINK-001→070,empty-name,invalid-chars,duplicates,glob,line-range,circular-dep,orphan}
  ↳tests::25lexer+22parser+32analyzer{338total}
  ↳files-modified::types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,index.ts
  ↳files-created::lexer-links.test.ts,parser-links.test.ts,links-validation.test.ts
  ↳all-checks::build✓,lint✓,tests✓,coverage✓

✓TDDAB#10::SemanticAnchors{4tokens,37tests,90.85%coverage}
  ↳lexer::4tokens{ARROW_DESCRIZIONE,ANCHOR_ENTRY,ANCHOR_HOTSPOT,ANCHOR_BOUNDARY}
  ↳ast::AnchorDeclaration{anchorType,path,isGlob,description}
  ↳analyzer::5codes{MBEL-ANCHOR-001→011}
  ↳tests::15lexer+12parser+10analyzer{375total}
  ↳patterns::AnchorPrefixMap{likeARROW_OPERATORS},PositionWhitespaceDetection{pathvalidation},TypeFilteredStatementCheck
  ↳all-checks::build✓,lint✓,tests✓,coverage✓

✓TDDAB#11::DecisionLog{8tokens,60tests,92.67%coverage}
  ↳lexer::8tokens{DECISION_DATE,ARROW_ALTERNATIVES,ARROW_REASON,ARROW_TRADEOFF,ARROW_CONTEXT,ARROW_STATUS,ARROW_REVISIT,ARROW_SUPERSEDED_BY}
  ↳ast::DecisionDeclaration{date,name,alternatives,reason,tradeoff,context,status,supersededBy,revisit}+DecisionStatus
  ↳analyzer::9codes{MBEL-DECISION-001→040,empty-name,duplicate,invalid-status,superseded-missing-ref,no-reason,empty-reason,empty-tradeoff,context-spaces}
  ↳tests::22lexer+19parser+19analyzer{494total}
  ↳files-modified::types.ts,lexer.ts,ast.ts,parser.ts,analyzer.ts,types.ts{analyzer},index.ts
  ↳files-created::lexer-decisions.test.ts,parser-decisions.test.ts,decisions-validation.test.ts
  ↳all-checks::build✓,lint✓,tests✓,coverage✓

[RECENT]

>completed::TDDAB#16{ToolIntegrations,18tests,733tests-total,94.71%coverage}
>created::tool-integrations.test.ts{18tests}
>modified::server.ts{getCodeLenses,getWorkContext,getSemanticHover}
>modified::types.ts{WorkContext,DecisionInfo,HeatInfo,IntentInfo,codeLensProvider}
>features::CodeLensProvider{all-semantic-elements},ExtendedHover{rich-semantic-info},getWorkContext{Opencode-integration}
>committed::e7d19de{TDDAB#16-Complete}
>completed::TDDAB#15{QueryEngine,31tests,665tests-total,93.59%coverage}
>created::query-engine/types.ts{TypeDefinitions}
>created::query-engine/index.ts{QueryEngineClass}
>created::query-engine.test.ts{31tests}
>features::DependencyGraph{circular-detection,transitive-deps},SemanticSearch{anchors,decisions,intents},ImpactAnalyzer{edit-risk,impact},WorkContext{composite-context}
>committed::849b8e6{TDDAB#15-Complete}

[DECISIONS_V5]
§decision::TypeScriptOnly{noAny,strict}
§decision::Vitest>Jest{modern,faster}
§decision::ESM{type:module}
§decision::MonorepoWorkspaces{packages/*}
§decision::ImmutableAST{readonly-properties}
§decision::LeftAssociativeChains{A→B→C=(A→B)→C}
§decision::LSPDiagnosticCodes{16types,hierarchical}
§decision::ProjectReferences{composite:true}
§decision::IncrementalSync{TextDocumentSyncKind.Incremental}
§decision::NestedDocumentSymbols{attributesUnderSections}
§decision::SectionBrackets{[SECTION]not##Title}
§decision::OpenCodeIntegration{SlashCommands+CustomTool>MCP}

[DECISIONS_V6]
§decision::MBEL6.0-LLM-Native-Evolution
  ↳rationale::CodebaseBrain{semantic-storage,native-language-support}
  ↳approach::IncrementalPhases{Lang-Extensions→Infrastructure→API→Tools}
  ↳priority-order::1-CrossRefs,2-Anchors,3-LLM-API,3.5-QueryEngine,4-Decisions,5-HeatMap,6-Intents,Last-Integration
§decision::NewTokensStrategy
  ↳semantic-sections::5{§links,§anchors,§decisions,§heat,§intents}
  ↳operators::25{navigation,reference,analysis,intent}
  ↳prefixes::7{entry,hotspot,boundary,critical,stable,volatile,hot}
§decision::QueryEngineArchitecture
  ↳approach::DependencyGraph+SemanticIndex{buildfromAST}
  ↳queries::Semantic+Composite{support-LLM-integration}
§decision::LLMAPIStandalone
  ↳methods::7{getAnchor,getCrossRefs,getEditRisk,getImpactAnalysis,getDecisions,getIntent,getWorkContext}
  ↳design::RequestResponse{typed-inputs,rich-outputs}
§decision::LLM-Active-Navigation{2024-12-27}
  ↳rationale::MBEL-data-needs-queryable-API{not-just-readable-files}
  ↳requirements::getFeatureFiles,getFileFeatures,getEntryPoints,analyzeImpact,getOrphans
  ↳success-metrics::50%reduction-in-file-reads,zero-forgotten-files
  ↳design-doc::docs/LLM-NAVIGATION-IMPROVEMENTS.md

[NEXT]
!PRIORITY::LLM-APILayer{highest,depends-on-QueryEngine}
✓TDDAB#17::QueryService{priority:P0,23tests,95.05%coverage}
  ↳methods::getFeatureFiles,getFileFeatures,getEntryPoints,getAnchors,getAnchorsByType,getAllFeatures
  ↳depends::TDDAB#9✓,#10✓
  ↳enables::LLM-active-codebase-navigation
✓TDDAB#18::QueryAPI-Anchors{priority:P1,19tests,96.94%coverage}
  ↳methods::analyzeImpact,getOrphanFiles
  ↳depends::TDDAB#17✓
  ↳enables::impact-analysis,orphan-detection,risk-assessment
✓TDDAB#19::QueryAPI-Dependencies{priority:P2,17tests,97.46%coverage}
  ↳methods::getFeatureDependencies,getBlueprintProgress
  ↳depends::TDDAB#17✓,#18✓
  ↳enables::dependency-graph,blueprint-tracking,circular-detection
✓TDDAB#11::DecisionLog{priority:4,60tests,92.67%coverage}
  ↳depends::TDDAB#9✓,#10✓
  ↳completed::2024-12-27
✓TDDAB#12::HeatMap{priority:5,75tests,569total,93.11%coverage}
✓TDDAB#13::IntentMarkers{priority:6,65tests,634total,93.46%coverage}
✓TDDAB#15::QueryEngine{priority:3.5,31tests,665total,93.59%coverage}
  ↳modules::DependencyGraph,SemanticSearch,ImpactAnalyzer,WorkContext
  ↳depends::TDDAB#9✓,#10✓,#17✓,#18✓,#19✓
  ↳enables::LLM-APILayer,semantic-navigation,composite-queries
✓TDDAB#14::LLMAPILayer{priority:3,11methods,50tests,715total,94.16%coverage}
  ↳files::llm-api/index.ts{LlmApi-class},llm-api/types.ts{Request/Response-types},llm-api.test.ts{50-tests}
  ↳modified::analyzer/index.ts{QueryEngine-export},lexer.ts{ARROW_DESCRIPTION-token},types.ts{ARROW_DESCRIPTION-type},parser.ts{formats}
  ↳methods::getAnchor,getCrossRefs,getEditRisk,getImpactAnalysis,getDecisions,getIntent,getWorkContext,getAllFeatures,getAllAnchors,getAllDecisions,getIntentsByModule
  ↳commit::bf63179
  ↳depends::TDDAB#15✓

[HEAT]
@critical::packages/mbel-core/src/lexer.ts
  ->dependents[parser.ts, analyzer.ts, server.ts, query-service.ts]
  ->changes{25}
  ->coverage{96%}
  ->confidence{high}
  ->caution{Foundation of all parsing - requires full regression}

@critical::packages/mbel-core/src/parser.ts
  ->dependents[analyzer.ts, server.ts, query-service.ts]
  ->changes{18}
  ->coverage{93%}
  ->confidence{high}

@hot::packages/mbel-analyzer/src/analyzer.ts
  ->changes{30}
  ->coverage{97%}
  ->confidence{high}
  ->impact{high}

@stable::packages/mbel-core/src/types.ts
  ->untouched{2weeks}
  ->coverage{100%}
  ->confidence{high}

@volatile::packages/mbel-lsp/src/query-service.ts
  ->changes{15}
  ->coverage{97%}
  ->confidence{medium}
  ->caution{New API - still evolving}

@hot::packages/mbel-core/src/ast.ts
  ->changes{12}
  ->dependents[parser.ts, analyzer.ts, query-service.ts]

@stable::memory-bank/**/*.mbel.md
  ->untouched{1day}
  ->confidence{high}

[BLOCKERS]
!OpenCodeLSP::AutoActivation{commands-work,lsp-not-auto-started}

[NOTES]
@note::TotalTests-V5::#259{lexer:61,parser:42,analyzer:48,server:34,features:74}
@note::TotalTests-V6-So-Far::#634{V5:259+TDDAB#9:79+TDDAB#10:37+TDDAB#17:23+TDDAB#18:19+TDDAB#19:17+TDDAB#11:60+TDDAB#12:75+TDDAB#13:65}
@note::TotalTests-Projected::#429{V5:259+V6:170}
@note::Coverage-Current::%93.46{TDDAB#13-full}
@note::Coverage-Target-V6::%90{exceeded}
@note::NewTokens::#66{sections:5,operators:46,prefixes:11,markers:3,decision:1}
@note::NewASTNodes::#11{LinkNode,AnchorNode,DecisionNode,DecisionStatus,HeatNode,HeatDeclaration,HeatType,IntentNode,...}
@note::Phases::{Phase1:Lang-Ext,Phase2:Infra,Phase3:API,Phase4:Integration}
@note::PlanReference::tasks/MBEL-6.0-TDDAB-PLAN.md
