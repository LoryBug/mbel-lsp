§MBEL:5.0

[FOCUS]
@focus::OpenCodeIntegration{Complete}
>completed::FullLSP{Lexer+Parser+Analyzer+Server+Features+Extension}✓
>completed::OpenCodeIntegration{SlashCommands+CustomTool}✓

[DONE]
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

[RECENT]
>added::OpenCodeSlashCommands{/mb,/mb-pending,/mb-recent}
>added::OpenCodeCustomTool{mbel-query}
>fixed::opencode.json{lsp-config-format}
>converted::MemoryBankFiles{##→[SECTION]}
>added::LLMQueryMethods{getPending,getCompleted,getFailed,getCritical,getActive,getRecentChanges,getProjectStatus}

[DECISIONS]
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

[NEXT]
?RenameSymbol::RefactorSupport
?FoldingRanges::CollapseSections
?CodeActions::QuickFixes{auto-apply}
?PublishMarketplace::OfficialExtension

[BLOCKERS]
∅None

[NOTES]
@note::TotalTests::#259{lexer:61,parser:42,analyzer:48,server:34,features:74}
@note::Coverage::%87{overall}
@note::AllTDDABBlocksComplete::✓
@note::LLMQueryMethods::getPending,getCompleted,getFailed,getCritical,getActive,getRecentChanges,getProjectStatus
@note::OpenCodeCommands::/mb{full-status},/mb-pending{pending-items},/mb-recent{recent-changes}
@note::OpenCodeTool::mbel-query{semantic-queries-for-llm}
