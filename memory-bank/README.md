§MBEL:6.0

[PROJECT]
@name::MBEL-LSP
@purpose::LanguageServerProtocol{MBELv6}
@vision::CodebaseBrain{LLM-native-memory-bank}
>goal::IDESupport{syntaxHighlight,diagnostics,completion,hover,goToDefinition,findReferences,llmApi}

[READ_ORDER]
@order::
1. productContext.mbel.md::WhyWeAreBuildingThis
2. systemPatterns.mbel.md::Architecture+TDDABPlan
3. techContext.mbel.md::Stack+Commands
4. activeContext.mbel.md::CurrentState+NextSteps
5. progress.mbel.md::DetailedStatus+Metrics

[TDDAB_METHODOLOGY]
@methodology::TestDrivenDevelopmentAtomicBlocks
- RED::WriteFailingTestsFirst
- GREEN::ImplementMinimalCode
- VERIFY::Coverage+Build+Lint+Commit

[CURRENT_STATUS]
@status::V5Complete+V6Phase1Active

§v5-complete{259tests,87%coverage}
✓TDDAB#1::MbelLexer{61tests,100%}
✓TDDAB#2::MbelParser{42tests,91%}
✓TDDAB#3::MbelAnalyzer{48tests,95%}
✓TDDAB#4::LspServer{34tests,99%}
✓TDDAB#5::LspFeatures{29tests,98%}
✓TDDAB#6::GoToDefinition{11tests}
✓TDDAB#7::FindReferences+WorkspaceSymbols{23tests}
✓TDDAB#8::LLMQueryMethods{11tests}

§v6-phase1{1of8-complete,79tests,90.32%coverage}
✓TDDAB#9::CrossRefLinks{79tests,priority:1}
?TDDAB#10::SemanticAnchors{~18tests,priority:2}
?TDDAB#11::DecisionLog{~20tests,priority:4}
?TDDAB#12::HeatMap{~18tests,priority:5}
?TDDAB#13::IntentMarkers{~16tests,priority:6}

§v6-phase2-3-4{pending}
?TDDAB#14::LLMAPILayer{~25tests,priority:3}
?TDDAB#15::QueryEngine{~15tests,priority:3.5}
?TDDAB#16::ToolIntegrations{~10tests,priority:last}

[MBEL_V6_SYNTAX]
@version::6.0
@sections::5{§links,§anchors,§decisions,§heat,§intents}

§operators-base{27-from-v5}
(Temporal:4) > @ ? ≈
(State:4) ✓ ✗ ! ⚡
(Relation:7) :: : → ← ↔ + -
(Structure:5) [] {} () | <>
(Quant:3) # % ~
(Logic:3) & || ¬
(Meta:2) © §

§operators-links{10-new}
->files::ReferencedSourceFiles
->tests::AssociatedTestFiles
->docs::DocumentationLinks
->decisions::LinkedDecisions
->related::RelatedSections
->entrypoint::MainEntryFile
->blueprint::ArchitectureRef
->depends::Dependencies
->features::FeatureLinks
->why::RationaleLinks

§operators-anchors{1-new}
->descrizione::AnchorDescription

§operators-decisions{7-new}
->alternatives::OtherOptions
->reason::WhyChosen
->tradeoff::Compromises
->context::WhenApplies
->status::CurrentState
->revisit::WhenToReview
->supersededBy::ReplacementDecision

§operators-heat{7-new}
->dependents::WhatDependsOnThis
->untouched::NotRecentlyModified
->changes::ModificationHistory
->coverage::TestCoverage
->confidence::ReliabilityScore
->impact::ChangeImpactLevel
->caution::RiskWarnings

§operators-intents{6-new}
->does::WhatItDoes
->doesNot::WhatItDoesNot
->contract::APIContract
->singleResponsibility::CorePurpose
->antiPattern::WhatToAvoid
->extends::InheritedBehavior

§prefixes{7-new}
@entry::::MainEntryPoint
@hotspot::::FrequentlyModified
@boundary::::SystemBoundary
@critical::::HighRisk
@stable::::RarelyChanges
@volatile::::FrequentChanges
@hot::::ActiveDevelopment

§markers{5-new}
@feature::FeatureTag
@task::TaskReference
{TO-CREATE}::FileToCreate
{TO-MODIFY}::FileToModify
[...]::Continuation

[LLM_INSTRUCTIONS]
@purpose::HowToReadWriteMBEL

§reading-mbel
1. StartWith::README.md{orientation}
2. ScanPrefixes::@§✓?⚠{quickStatus}
3. ParseOperators:::{type-value-pairs}
4. FollowArrows::→{dataFlow},->{references}
5. CheckBrackets::{}{details},[]{lists},(){groups}

§writing-mbel
1. UseCompression::MaxInfoPerToken
2. PreferSymbols::✓>>"complete",?>>pending
3. AvoidProse::NoFullSentences
4. StructureFirst::Section→Items→Details
5. ConsistentPatterns::@name::value{metadata}

§compression-examples
@bad::prose
"The MbelLexer module is complete with 61 tests and 100% coverage"
@good::mbel
✓MbelLexer{61tests,100%coverage}

@bad::verbose
"Next step: implement semantic anchors, estimated 18 tests"
@good::mbel
?TDDAB#10::SemanticAnchors{~18tests}

§status-indicators
✓::Complete+Verified
?::Pending+NotStarted
⚠::Blocker+NeedsAttention
!::Important+Priority
→::FlowDirection
->name::CrossReference
~::Approximate
#::Count+Number

[QUICK_RESUME]
@resume::ToContinueWork
1. ReadAllMBFiles::UnderstandState
2. CheckProgress.mbel.md::DetailedStatus
3. CheckActiveContext.mbel.md::CurrentFocus
4. PickNextTask::ByPriority{?items}
5. FollowRED→GREEN→VERIFY::TDDABMethodology
6. UpdateMB::AfterCompletion

[DATA_FLOW]
@pipeline::V6
Source{.mbel}→Lexer{tokens}→Parser{AST}→Analyzer{diagnostics+semantics}→QueryEngine{graphs}→LSP{LLM-API}→Tools{IDE+CLI}

[LOCATION]
@path::C:\Progetti\mbel-lsp
@repo::monorepo{npm-workspaces}
@packages::{mbel-core,mbel-analyzer,mbel-lsp,vscode-extension}
