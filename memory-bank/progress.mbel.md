§MBEL:6.0

[OVERALL_STATUS]
@status::MBEL-LSP-v6-Complete✓
>tests::733{total}
>coverage::94.71%
>commits::19{TDDAB-driven}

[TDDAB_V5]
@status::Complete✓{259tests}
✓#1::MbelLexer{61tests,100%,commit:62f3370}
✓#2::MbelParser{42tests,91%,commit:0336b13}
✓#3::MbelAnalyzer{48tests,95%,commit:704b9e6}
✓#4::LspServer{34tests,99%,commit:2ee0f5e}
✓#5::LspFeatures{29tests,98%,commit:b4f675f}
✓#6::GoToDefinition{11tests,commit:317c729}
✓#7::FindReferences{23tests,commit:e41ba3a}
✓#8::LLMQueryMethods{11tests,commit:3fe492d}
✓OpenCodeIntegration{SlashCommands+CustomTool,commit:9e671f0}

[TDDAB_V6_PHASE1_LANG]
@status::Complete✓{316tests}
✓#9::CrossRefLinks{79tests,90.32%}
  ↳tokens::14{FILES,TESTS,DOCS,DECISIONS,RELATED,ENTRYPOINT,BLUEPRINT,DEPENDS,FEATURES,WHY,@feature,@task,[...]}
✓#10::SemanticAnchors{37tests,90.85%}
  ↳tokens::4{ANCHOR_ENTRY,ANCHOR_HOTSPOT,ANCHOR_BOUNDARY,ARROW_DESCRIZIONE}
✓#11::DecisionLog{60tests,92.67%}
  ↳tokens::8{DECISION_DATE,ARROW_ALTERNATIVES,ARROW_REASON,ARROW_TRADEOFF,ARROW_CONTEXT,ARROW_STATUS,ARROW_REVISIT,ARROW_SUPERSEDED_BY}
✓#12::HeatMap{75tests,93.11%}
  ↳tokens::11{@critical,@stable,@volatile,@hot,->dependents,->untouched,->changes,->coverage,->confidence,->impact,->caution}
✓#13::IntentMarkers{65tests,93.46%,commit:4bc2ec7}
  ↳tokens::7{INTENT_MODULE,ARROW_DOES,ARROW_DOES_NOT,ARROW_CONTRACT,ARROW_SINGLE_RESPONSIBILITY,ARROW_ANTI_PATTERN,ARROW_EXTENDS}

[TDDAB_V6_PHASE2_INFRA]
@status::Complete✓{59tests}
✓#17::QueryService{23tests,95.05%}
  ↳methods::getFeatureFiles,getFileFeatures,getEntryPoints,getAnchors,getAnchorsByType,getAllFeatures
✓#18::QueryAPI-Anchors{19tests,96.94%}
  ↳methods::analyzeImpact,getOrphanFiles
✓#19::QueryAPI-Dependencies{17tests,97.46%}
  ↳methods::getFeatureDependencies,getBlueprintProgress

[TDDAB_V6_PHASE3_API]
@status::Complete✓{81tests}
✓#14::LLMAPILayer{50tests,94.16%,commit:bf63179}
  ↳methods::getAnchor,getCrossRefs,getEditRisk,getImpactAnalysis,getDecisions,getIntent,getWorkContext,getAllFeatures,getAllAnchors,getAllDecisions,getIntentsByModule
✓#15::QueryEngine{31tests,93.59%,commit:849b8e6}
  ↳modules::DependencyGraph,SemanticSearch,ImpactAnalyzer,WorkContext

[TDDAB_V6_PHASE4_INTEGRATION]
@status::Complete✓{18tests}
✓#16::ToolIntegrations{18tests,94.71%,commit:e7d19de}
  ↳features::CodeLensProvider,ExtendedHover,getWorkContext
