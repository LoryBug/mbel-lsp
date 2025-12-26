§MBEL:5.0

# Tech Context

## Stack
@stack::TypeScriptLSP
- Runtime::Node.js{>=18}
- Language::TypeScript{strict,noAny}
- Build::tsc{ESM}
- Test::Vitest{coverage%100}
- Lint::ESLint{typescript-strict}
- Package::npm{workspaces}

## Dependencies
@deps::
- typescript::^5.3.0
- vitest::^1.0.0
- @vitest/coverage-v8::^1.0.0
- eslint::^8.55.0
- @typescript-eslint/*::^6.13.0

## Future Dependencies
@futureDeps::
- vscode-languageserver::LSPImplementation
- vscode-languageclient::VSCodeExtension

## Directory Structure
```
mbel-lsp/
├── packages/
│   └── mbel-core/
│       ├── src/
│       │   ├── index.ts      ← exports
│       │   ├── types.ts      ← TokenTypes
│       │   ├── lexer.ts      ← MbelLexer
│       │   ├── ast.ts        ← ASTTypes
│       │   └── parser.ts     ← MbelParser
│       ├── tests/
│       │   ├── lexer.test.ts
│       │   └── parser.test.ts
│       ├── package.json
│       └── tsconfig.json
├── memory-bank/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .eslintrc.json
```

## Commands
@commands::
- npm run test::VitestRun
- npm run test:coverage::VitestCoverage
- npm run build::tsc
- npm run lint::ESLint
- npm run type-check::tscNoEmit
- npm run btlt::Build+TypeCheck+Lint+Test

## MBEL v5 Reference
@mbel::v5.0
- Operators::#27{Temporal,State,Relation,Structure,Quant,Logic,Meta}
- Grammar::7rules{NoArticles,CamelCase,ImplicitSubject,OperatorsOnly,Newline,Latest,LeftToRight}
- Source::memory-bank/README.md{AI-playground}
