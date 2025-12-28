§MBEL:6.0

[STACK]
@stack::TypeScriptLSP
├─ Runtime::Node.js{>=18}
├─ Language::TypeScript{strict,noAny}
├─ Build::tsc{ESM}
├─ Test::Vitest{coverage%90}
├─ Lint::ESLint{typescript-strict}
└─ Package::npm{workspaces}

[DEPENDENCIES]
@deps::Core
├─ typescript::^5.3.0
├─ vitest::^1.0.0
├─ @vitest/coverage-v8::^1.0.0
├─ eslint::^8.55.0
├─ @typescript-eslint/*::^6.13.0
├─ vscode-languageserver::^9.0.1
└─ vscode-languageclient::^9.0.1

[STRUCTURE]
@structure::Monorepo
(
mbel-lsp/
├── packages/
│   ├── mbel-core/{lexer,parser,ast,types}
│   ├── mbel-analyzer/{analyzer,diagnostics}
│   ├── mbel-lsp/{server,query-service,types,bin}
│   ├── mbel-cli/{cli,commands/*}
│   └── vscode-extension/{extension,syntaxes}
├── .opencode/{commands,tools}
├── memory-bank/{*.mbel.md}
├── package.json
├── tsconfig.json
└── vitest.config.ts
)

[COMMANDS]
@commands::NPM
├─ npm run test::VitestRun
├─ npm run test:coverage::VitestCoverage
├─ npm run build::tsc
├─ npm run lint::ESLint
├─ npm run type-check::tscNoEmit
└─ npm run btlt::Build+TypeCheck+Lint+Test

[MBEL_REFERENCE]
@mbel::v6.0
├─ Operators::#67{Temporal,State,Relation,Structure,Quant,Logic,Meta,Links,Anchors}
├─ Grammar::7rules{NoArticles,CamelCase,ImplicitSubject,OperatorsOnly,Newline,Latest,LeftToRight}
├─ FileExtensions::.mbel,.mbel.md
├─ NewSections::§links,§anchors,§decisions,§heat,§intents
└─ NewTokens::{feature,task,entry,hotspot,boundary,files,tests,depends,entryPoint}
