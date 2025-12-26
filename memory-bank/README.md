§MBEL:5.0

# MBEL v5 LSP - Memory Bank

## Project Purpose
@purpose::LanguageServerProtocol{MBELv5}
>goal::IDESupport{syntaxHighlight,diagnostics,completion,hover}

## Read Order
@readOrder::
1. productContext.md::WhyWeAreBuildingThis
2. systemPatterns.md::Architecture+TDDABPlan
3. techContext.md::Stack+Commands
4. activeContext.md::CurrentState+NextSteps
5. progress.md::DetailedStatus+Metrics

## TDDAB Methodology
@methodology::TestDrivenDevelopmentAtomicBlocks
- RED::WriteFailingTestsFirst
- GREEN::ImplementMinimalCode
- VERIFY::Coverage+Build+Lint+Commit

## Current Status
@status::Phase2of5Complete
✓TDDAB#1::MbelLexer{61tests}
✓TDDAB#2::MbelParser{42tests}
○TDDAB#3::MbelDiagnostics
○TDDAB#4::LspServer
○TDDAB#5::LspFeatures

## Quick Resume
@resume::ToContiuneWork
1. ReadAllMBFiles::UnderstandState
2. CheckProgress.md::SeeWhatsDone
3. PickNextTDDAB::FromSystemPatterns
4. FollowRED→GREEN→VERIFY::Methodology

## MBEL v5 Quick Reference
@operators::27total
```
[Temporal:4] > @ ? ≈
[State:4]    ✓ ✗ ! ⚡
[Relation:6] :: → ← ↔ + -
[Structure:5] [] {} () | <>
[Quant:3]    # % ~
[Logic:3]    & || ¬
[Meta:2]     © §
```

## Project Location
@path::C:\Progetti\mbel-lsp
