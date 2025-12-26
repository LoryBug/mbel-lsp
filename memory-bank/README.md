§MBEL:5.0

[PROJECT]
@name::MBELv5-LSP
@purpose::LanguageServerProtocol{MBELv5}
>goal::IDESupport{syntaxHighlight,diagnostics,completion,hover,goToDefinition,findReferences}

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
@status::Phase8Complete
✓TDDAB#1::MbelLexer{61tests}
✓TDDAB#2::MbelParser{42tests}
✓TDDAB#3::MbelAnalyzer{48tests}
✓TDDAB#4::LspServer{34tests}
✓TDDAB#5::LspFeatures{29tests}
✓TDDAB#6::GoToDefinition{11tests}
✓TDDAB#7::FindReferences+WorkspaceSymbols{23tests}
✓TDDAB#8::LLMQueryMethods{11tests}

[QUICK_RESUME]
@resume::ToContinueWork
1. ReadAllMBFiles::UnderstandState
2. CheckProgress::SeeWhatsDone
3. PickNextTask::FromActiveContext
4. FollowRED→GREEN→VERIFY::Methodology

[MBEL_REFERENCE]
@operators::27total
(Temporal:4) > @ ? ≈
(State:4) ✓ ✗ ! ⚡
(Relation:7) :: : → ← ↔ + -
(Structure:5) [] {} () | <>
(Quant:3) # % ~
(Logic:3) & || ¬
(Meta:2) © §

[LOCATION]
@path::C:\Progetti\mbel-lsp
