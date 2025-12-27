§MBEL:6.0

[VISION]
@vision::MBELLanguageServer{IDE-support,developer-experience}
>problem::MBELFiles{noSyntaxHighlight,noValidation,noCompletion}
→solution::LSP{crossEditor,standardProtocol}

[CORE_VALUE]
@value::DeveloperTooling{writeCorrectMBEL,getFeedback}
├─ SyntaxHighlight::ColorOperators+Structures
├─ Diagnostics::ErrorDetection+Recovery
├─ Completion::OperatorSuggestions+Patterns
├─ Hover::OperatorDescriptions+SemanticInfo
├─ GoToDefinition::NavigateToDeclarations
├─ FindReferences::LocateAllUsages
└─ LLMQueries::SemanticStatusQueries

[TARGET_USERS]
@users::MBELEcosystem
├─ MBELAuthors::WritingMemoryBankFiles
├─ ClaudeCodeUsers::MaintainingMB
├─ AIAgentDevelopers::CustomizingMB
└─ LLMAgents::QueryingProjectStatus

[SUCCESS_CRITERIA]
✓LSPCompliant::FullProtocolSupport
✓FeatureComplete::Diagnostics+Hover+Completion+Symbols+GoTo+References
✓WellTested::#398tests
?VScodeExtension::MarketplacePublish
