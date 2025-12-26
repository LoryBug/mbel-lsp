§MBEL:5.0

# Product Context

## Vision
@vision::MBELLanguageServer{IDE-support,developer-experience}
>problem::MBELFiles{noSyntaxHighlight,noValidation,noCompletion}
→solution::LSP{crossEditor,standardProtocol}

## Core Value
@value::DeveloperTooling{writeCorrectMBEL,getFeedback}
- SyntaxHighlight::ColorOperators+Structures
- Diagnostics::ErrorDetection+Recovery
- Completion::OperatorSuggestions+Patterns
- Hover::OperatorDescriptions+SemanticInfo

## Target Users
@users::
- MBELAuthors::WritingMemoryBankFiles
- ClaudeCodeUsers::MaintainingMB
- AIAgentDevelopers::CustomizingMB

## Success Criteria
?LSPCompliant::FullProtocolSupport
?VScodeExtension::MarketplacePublish
?FeatureComplete::Diagnostics+Hover+Completion+Symbols
?WellTested::100%CoverageTDDAB
