# MBEL 6.0: LLM-Native Memory Bank Evolution

> **RFC**: Evoluzione di MBEL per Supporto Nativo agli LLM
> **Status**: Draft
> **Created**: 2024-12-27

---

## Executive Summary

Questo documento descrive l'evoluzione di MBEL da "task tracker" a "codebase brain" - un sistema di memoria semantica navigabile ottimizzato per LLM.

**Obiettivo**: Permettere a un LLM di ottenere tutto il contesto necessario per lavorare su qualsiasi parte del codebase con una singola query.

---

## Parte 1: Il Problema Fondamentale

### Come un LLM "vede" un progetto oggi

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT WINDOW (200K tokens)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ File A  │  │ File B  │  │ File C  │  │  ???    │  ...???    │
│  │ (letto) │  │ (letto) │  │ (letto) │  │         │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│       ↓            ↓            ↓            ↓                  │
│    CONOSCO      CONOSCO      CONOSCO      NON SO               │
│                                          CHE ESISTE            │
├─────────────────────────────────────────────────────────────────┤
│  PROBLEMI:                                                      │
│  - Non so cosa NON ho letto                                     │
│  - Non so le RELAZIONI tra i file                               │
│  - Non so PERCHE' il codice e' fatto cosi'                      │
│  - Non so cosa e' CAMBIATO di recente                           │
│  - Non so cosa e' RISCHIOSO toccare                             │
└─────────────────────────────────────────────────────────────────┘
```

### I 5 Gap Cognitivi dell'LLM

| Gap | Descrizione | Conseguenza |
|-----|-------------|-------------|
| **Visibility Gap** | Non so cosa esiste che non ho letto | Reinvento soluzioni gia' presenti |
| **Relationship Gap** | Non vedo le dipendenze tra file | Rompo cose senza saperlo |
| **Intent Gap** | Non so PERCHE' il codice e' cosi' | Faccio modifiche che violano assunzioni |
| **Temporal Gap** | Non so cosa e' cambiato di recente | Non capisco il contesto attuale |
| **Risk Gap** | Non so cosa e' fragile/stabile | Tocco cose pericolose con leggerezza |

---

## Parte 2: Le 6 Proposte

---

### Proposta 1: Semantic Anchors (Ancoraggi Semantici)

#### Il Problema
Quando un LLM deve lavorare su un concetto (es. "autenticazione"), oggi deve:
1. Grep-pare parole chiave -> risultati rumorosi
2. Leggere file a caso -> spreco di context
3. Sperare di trovare il punto giusto -> inefficiente

#### La Soluzione
**Semantic Anchors** = punti di ingresso espliciti per concetti di dominio

#### Sintassi Proposta

```mbel
§anchors
# Formato: @tipo::NomeConcetto{path:linea}->descrizione{testo}

# Entry Points - Dove iniziare per un concetto
@entry::Authentication{src/auth/middleware.ts:15}->descrizione{Token validation entry point}
@entry::UserManagement{src/users/service.ts:1}->descrizione{All user CRUD operations}
@entry::PaymentFlow{src/payments/checkout.ts:42}->descrizione{Stripe integration start}

# Hotspots - Aree con alta concentrazione di logica correlata
@hotspot::ErrorHandling{src/errors/**}->descrizione{All custom errors and handlers}
@hotspot::DatabaseModels{src/models/*.ts}->descrizione{Prisma schema mirrors}

# Boundaries - Confini architetturali da non attraversare
@boundary::PublicAPI{src/api/public/**}->descrizione{External-facing, versioned}
@boundary::InternalAPI{src/api/internal/**}->descrizione{Internal only, can change}
```

#### Esempio per MBEL-LSP

```mbel
§anchors
@entry::Lexer{packages/mbel-core/src/lexer.ts:45}->descrizione{tokenize() main function}
@entry::Parser{packages/mbel-core/src/parser.ts:62}->descrizione{parse() returns AST}
@entry::Analyzer{packages/mbel-analyzer/src/analyzer.ts:28}->descrizione{analyze() returns diagnostics}
@entry::LspServer{packages/mbel-lsp/src/server.ts:1}->descrizione{LSP connection setup}

@hotspot::TokenTypes{packages/mbel-core/src/tokens.ts}->descrizione{All 27 token definitions}
@hotspot::AstNodes{packages/mbel-core/src/ast.ts}->descrizione{All AST node interfaces}
@hotspot::DiagnosticRules{packages/mbel-analyzer/src/rules/**}->descrizione{Validation rules}

@boundary::PublicAPI{packages/mbel-core/src/index.ts}->descrizione{Exported public interface}
@boundary::LspProtocol{packages/mbel-lsp/src/handlers/**}->descrizione{LSP message handlers}
```

#### Impatto

| Metrica | Senza Anchors | Con Anchors | Miglioramento |
|---------|---------------|-------------|---------------|
| Token usati per trovare entry point | ~15K | ~2K | **87% meno** |
| File letti inutilmente | 5-10 | 0-1 | **90% meno** |
| Tempo per orientarsi | Alto | Immediato | **Ordini di grandezza** |

---

### Proposta 2: Decision Log (Registro Decisioni)

#### Il Problema
Ogni codebase ha decisioni implicite:
- "Perche' usiamo Redis e non Memcached?"
- "Perche' questa funzione e' cosi' complessa?"
- "Perche' non usiamo l'approccio X che sembra piu' semplice?"

Senza queste informazioni, l'LLM rischia di:
1. **Proporre alternative gia' scartate** -> spreco di tempo
2. **Rompere assunzioni nascoste** -> bug sottili
3. **Semplificare cose complesse per un motivo** -> regressioni

#### La Soluzione
**Decision Log** = registro strutturato del "perche'" con trade-off espliciti

#### Sintassi Proposta

```mbel
§decisions
# Formato: @data::NomeDecisione{scelta}->alternatives[...]->reason{...}->tradeoff{...}

@2024-12-01::TestFramework{Vitest}
  ->alternatives[Jest,Mocha,Ava]
  ->reason{ESM nativo, velocita' 3x, API compatibile Jest}
  ->tradeoff{meno ecosystem plugins}
  ->context[vitest.config.ts,packages/*/tests/**]

@2024-12-10::ParserStrategy{Recursive-Descent}
  ->alternatives[PEG.js,ANTLR,Chevrotain]
  ->reason{controllo totale, no dipendenze, educational value}
  ->tradeoff{piu' codice manuale, no grammar file}
  ->context[packages/mbel-core/src/parser.ts]

@2024-12-15::MonorepoTool{npm-workspaces}
  ->alternatives[Nx,Turborepo,Lerna]
  ->reason{zero config, nativo npm, sufficiente per progetto piccolo}
  ->tradeoff{no caching builds, no task orchestration avanzata}
  ->context[package.json,packages/*/package.json]
```

#### Esempio per MBEL-LSP

```mbel
§decisions

@2024-11-20::TokenDesign{Enum-over-Strings}
  ->alternatives[string-literals,symbol]
  ->reason{type safety, autocomplete, refactoring sicuro}
  ->tradeoff{piu' verboso, enum non tree-shakeable}
  ->context[packages/mbel-core/src/tokens.ts]
  ->status{ACTIVE}

@2024-11-25::AstImmutability{Mutable-AST}
  ->alternatives[immutable.js,immer,frozen-objects]
  ->reason{performance parsing, semplicita', no overhead}
  ->tradeoff{mutazioni accidentali possibili, no undo nativo}
  ->context[packages/mbel-core/src/ast.ts,packages/mbel-core/src/parser.ts]
  ->status{ACTIVE}
  ->revisit{se serve undo/redo in editor}

@2024-12-05::ErrorRecovery{Panic-Mode}
  ->alternatives[phrase-level,global-correction]
  ->reason{semplice da implementare, sufficiente per MBEL}
  ->tradeoff{recovery meno granulare}
  ->context[packages/mbel-core/src/parser.ts:parseSection]
  ->status{ACTIVE}
```

#### Caso d'Uso: Prevenzione Errori

```
USER: "Perche' non usiamo un parser generator come PEG.js?"

LLM SENZA Decision Log:
- Potrebbe suggerire di migrare a PEG.js
- Non sa che e' gia' stato considerato e scartato

LLM CON Decision Log:
1. Query: getDecision("Parser*")
2. Trova: ParserStrategy{Recursive-Descent}
3. Risponde: "E' stato scelto recursive descent per controllo totale
   e zero dipendenze. PEG.js era tra le alternative ma richiedeva
   dipendenza esterna. Vuoi riconsiderare questa decisione?"
```

---

### Proposta 3: Dependency Heat Map

#### Il Problema
Non tutti i file sono uguali:
- Alcuni sono **critici**: toccarli causa cascate di cambiamenti
- Alcuni sono **stabili**: non cambiano da mesi, sono affidabili
- Alcuni sono **volatili**: cambiano spesso, potrebbero avere bug

L'LLM non ha modo di saperlo senza analizzare la git history.

#### La Soluzione
**Heat Map** = mappa visiva del "rischio" e "attivita'" del codice

#### Sintassi Proposta

```mbel
§heat
# Formato: @livello::Pattern{metriche}->impact{descrizione}

# CRITICAL - Toccare questi ha effetti a cascata
@critical::CoreTypes{packages/mbel-core/src/types.ts}
  ->dependents{23}
  ->impact{Modifica qui richiede update in 23 file}
  ->lastChange{2024-12-01}
  ->changeFreq{rare}

@critical::PublicAPI{packages/*/src/index.ts}
  ->dependents{external}
  ->impact{Breaking change per utenti}
  ->semver{major}

# STABLE - Affidabili, testati, non toccare senza motivo
@stable::Lexer{packages/mbel-core/src/lexer.ts}
  ->untouched{45days}
  ->tests{61}
  ->coverage{100%}
  ->confidence{high}

# VOLATILE - Cambia spesso, attenzione
@volatile::FeatureHandlers{packages/mbel-lsp/src/features/**}
  ->changes{12-in-30days}
  ->reason{active-development}
  ->caution{verificare test dopo modifiche}

# HOT - Attivamente in sviluppo ORA
@hot::OpenCodeIntegration{.opencode/**}
  ->changes{5-in-7days}
  ->status{in-progress}
```

#### Visualizzazione

```
+------------------- HEAT MAP -------------------+
|                                                |
|  CRITICAL (touch with care)                    |
|  |-- parser.ts (23 dependents)                 |
|  +-- analyzer.ts (LSP integration)             |
|                                                |
|  STABLE (safe, well-tested)                    |
|  |-- tokens.ts (100% cov, 60d untouched)       |
|  |-- lexer.ts (100% cov, 45d untouched)        |
|  +-- utils.ts (100% cov, 90d untouched)        |
|                                                |
|  VOLATILE (changing frequently)                |
|  +-- handlers/** (8 changes in 14d)            |
|                                                |
|  HOT (active development now)                  |
|  +-- llm-queries.ts (current sprint)           |
|                                                |
+------------------------------------------------+
```

---

### Proposta 4: Intent Markers (Marcatori di Intento)

#### Il Problema
Il codice dice COSA fa, non COSA DOVREBBE fare (o NON fare).

Esempio: una funzione `validateUser()`
- Cosa FA: controlla email e password
- Cosa DOVREBBE fare: solo validazione formato
- Cosa NON dovrebbe fare: chiamare il database, creare sessioni

Senza questo, l'LLM potrebbe "migliorare" la funzione aggiungendo logica che viola il design.

#### La Soluzione
**Intent Markers** = contratti espliciti su scopo e confini

#### Sintassi Proposta

```mbel
§intents
# Formato: @Modulo::Componente->does{...}->doesNot[...]->contract{...}

@Lexer::tokenize
  ->does{converte stringa in array di token}
  ->doesNot[validazione semantica, error recovery, AST building]
  ->contract{output sempre valido, no eccezioni, token.position accurato}
  ->singleResponsibility{solo tokenizzazione}

@Parser::parse
  ->does{converte token in AST}
  ->doesNot[validazione semantica, type checking, symbol resolution]
  ->contract{AST ben formato anche con errori, errors array popolato}
  ->singleResponsibility{solo struttura sintattica}

@Analyzer::analyze
  ->does{validazione semantica, diagnostics, symbol table}
  ->doesNot[modifica AST, side effects, I/O]
  ->contract{puro, deterministico, idempotente}
  ->singleResponsibility{solo analisi statica}
```

#### Anti-Pattern Espliciti

```mbel
§intents

@Lexer::tokenize
  ->antiPattern{
    NO-database-calls,
    NO-file-system,
    NO-network,
    NO-global-state,
    NO-caching
  }

@Parser::parse
  ->antiPattern{
    NO-semantic-validation,
    NO-symbol-resolution,
    NO-type-inference,
    NO-external-dependencies
  }
```

#### Caso d'Uso: Prevenzione Violazioni

```
USER: "Aggiungi caching al lexer per performance"

LLM CON INTENT MARKERS:
1. Query: getIntent("Lexer")
2. Trova: doesNot[caching], contract{puro, no-side-effects}
3. AVVISA: "Il Lexer ha un contratto 'no-side-effects'.
   Il caching violerebbe questo invariante.

   Alternative che rispettano il contratto:
   1. Caching a livello DocumentManager (layer sopra)
   2. Caching a livello LspServer (gia' ha stato)
   3. Memoization esterna wrappando tokenize()

   Quale preferisci?"
```

---

### Proposta 5: Cross-Reference Links (IL GAME CHANGER)

#### Il Problema
Oggi MBEL traccia lo **stato** dei task, ma non **linka al codice**.

Quando un LLM vede:
```mbel
@GoToDefinition::COMPLETE{11tests}
```

Non sa:
- Quali file implementano questa feature?
- Quali test la coprono?
- Quale documentazione la descrive?
- Quali decisioni l'hanno influenzata?

#### La Soluzione
**Cross-Reference Links** = collegamenti bidirezionali tra task, codice, test, docs

#### Sintassi Proposta

```mbel
§links
# Formato: @tipo{nome}->files[...]->tests[...]->docs[...]->decisions[...]

@feature{GoToDefinition}
  ->files[
    packages/mbel-lsp/src/features/definition.ts,
    packages/mbel-lsp/src/handlers/textDocument.ts:45-67
  ]
  ->tests[
    packages/mbel-lsp/tests/features/definition.test.ts
  ]
  ->docs[
    docs/features/go-to-definition.md
  ]
  ->decisions[
    ParserStrategy,
    SymbolTableDesign
  ]
  ->related[FindReferences, WorkspaceSymbols]
  ->entryPoint{definition.ts:handleDefinition}

@feature{Diagnostics}
  ->files[
    packages/mbel-analyzer/src/analyzer.ts,
    packages/mbel-analyzer/src/rules/**
  ]
  ->tests[
    packages/mbel-analyzer/tests/**
  ]
  ->decisions[
    DiagnosticSeverityMapping,
    ErrorRecovery
  ]
  ->related[Parser, Lexer]
  ->entryPoint{analyzer.ts:analyze}

# Task pendenti con blueprint
@task{RenameSymbol}
  ->files[
    packages/mbel-lsp/src/features/rename.ts{TO-CREATE},
    packages/mbel-lsp/src/handlers/textDocument.ts{TO-MODIFY}
  ]
  ->tests[
    packages/mbel-lsp/tests/features/rename.test.ts{TO-CREATE}
  ]
  ->depends[FindReferences, SymbolTable]
  ->blueprint[
    "1. Reuse findReferences() to locate all occurrences",
    "2. Generate WorkspaceEdit with all changes",
    "3. Validate new name is valid identifier",
    "4. Handle cross-file renames"
  ]
```

#### Query Potente

```typescript
// Query: "Dammi tutto su GoToDefinition"
const result = await lsp.query('mbel/getCrossRefs', {
  feature: 'GoToDefinition'
});

// Risultato strutturato
{
  feature: 'GoToDefinition',
  implementation: {
    files: ['packages/mbel-lsp/src/features/definition.ts'],
    entryPoint: 'definition.ts:handleDefinition',
  },
  testing: {
    files: ['packages/mbel-lsp/tests/features/definition.test.ts'],
    testCount: 11,
    coverage: '100%'
  },
  dependencies: {
    uses: ['Parser', 'SymbolTable'],
    usedBy: ['FindReferences']
  },
  decisions: [
    { name: 'SymbolTableDesign', summary: '...' }
  ]
}
```

#### Confronto

| Azione | Senza Cross-Refs | Con Cross-Refs |
|--------|------------------|----------------|
| Trovare file rilevanti | 5-10 grep + letture | 1 query |
| Capire cosa testare | Indovinare | Lista esplicita |
| Trovare pattern da seguire | Cercare esempi | Link a related |
| Sapere le dipendenze | Analisi manuale | Dichiarato |
| Avere un piano | Inventare | Blueprint pronto |

---

### Proposta 6: LLM-Native LSP API

#### Nuovi Metodi LSP

```typescript
// SEMANTIC NAVIGATION
'mbel/getAnchor': (params: {
  concept: string;
  type?: 'entry' | 'hotspot' | 'boundary';
}) => AnchorResult[];

'mbel/getCrossRefs': (params: {
  feature?: string;
  task?: string;
  file?: string;
}) => CrossRefResult;

// RISK ASSESSMENT
'mbel/getEditRisk': (params: {
  file: string;
}) => {
  risk: 'low' | 'medium' | 'high' | 'critical';
  heatLevel: 'stable' | 'volatile' | 'hot' | 'critical';
  dependents: number;
  coverage: number;
  recommendations: string[];
};

'mbel/getImpactAnalysis': (params: {
  files: string[];
  changeType: 'add' | 'modify' | 'delete' | 'refactor';
}) => {
  affectedFiles: string[];
  affectedTests: string[];
  breakingChange: boolean;
  requiredUpdates: string[];
};

// DECISION SUPPORT
'mbel/getDecisions': (params: {
  pattern?: string;
  file?: string;
  status?: 'ACTIVE' | 'SUPERSEDED';
}) => Decision[];

'mbel/checkDecisionConflict': (params: {
  proposal: string;
  files: string[];
}) => DecisionConflict[];

// INTENT VALIDATION
'mbel/getIntent': (params: {
  module?: string;
  component?: string;
}) => Intent[];

'mbel/validateChange': (params: {
  file: string;
  proposedChange: string;
}) => ValidationResult;

// TEMPORAL QUERIES
'mbel/getRecentActivity': (params: {
  days: number;
  scope?: string;
}) => {
  modifiedFiles: FileChange[];
  newDecisions: Decision[];
  completedTasks: Task[];
  activeWork: Task[];
};

// COMPOSITE QUERY - La piu' potente
'mbel/getWorkContext': (params: {
  target: string;  // feature, task, o concetto
}) => {
  startHere: { file: string; line: number; description: string; };
  files: {
    core: string[];
    tests: string[];
    config: string[];
    related: string[];
  };
  decisions: Decision[];
  intents: Intent[];
  risk: RiskAssessment;
  blueprint?: string[];
  dependencies: {
    requires: string[];
    requiredBy: string[];
  };
};
```

#### Esempio Workflow Completo

```
USER: "Implementa FoldingRanges per MBEL"

LLM STEP 1 - Ottieni contesto completo:
Query: mbel/getWorkContext({ target: "FoldingRanges" })

Response:
{
  startHere: {
    file: "packages/mbel-lsp/src/features/folding.ts",
    line: 0,  // TO CREATE
    description: "New feature file"
  },
  files: {
    core: ["features/folding.ts (CREATE)"],
    tests: ["tests/features/folding.test.ts (CREATE)"],
    config: ["handlers/textDocument.ts (MODIFY)"],
    related: ["features/definition.ts (PATTERN)"]
  },
  decisions: [{
    name: "AstBasedFeatures",
    choice: "Use AST traversal for all semantic features"
  }],
  intents: [{
    module: "LspFeatures",
    doesNot: ["parse directly", "maintain state"],
    contract: ["use analyzer output", "pure functions"]
  }],
  risk: { level: "low", reason: "New file, no existing code to break" },
  blueprint: [
    "1. Create folding.ts with getFoldingRanges()",
    "2. Traverse AST to find Section nodes",
    "3. Return FoldingRange for each section",
    "4. Register handler in textDocument.ts",
    "5. Add tests for nested sections, empty sections"
  ]
}

LLM ora sa ESATTAMENTE cosa fare!
```

---

## Parte 3: Roadmap Implementativa

### Fase 1: Estensioni Linguaggio MBEL

```
+-------------------------------------------------------------+
| FASE 1: FONDAMENTA                                          |
+-------------------------------------------------------------+
|                                                             |
|  1.1 Nuove Sezioni MBEL                                     |
|  |-- §anchors   -> entry points semantici                   |
|  |-- §decisions -> registro decisioni                       |
|  |-- §heat      -> mappa rischio/stabilita'                 |
|  |-- §intents   -> contratti moduli                         |
|  +-- §links     -> cross-reference code<->task              |
|                                                             |
|  1.2 Nuovi Token                                            |
|  |-- ->files[...]      -> lista file                        |
|  |-- ->tests[...]      -> lista test                        |
|  |-- ->decisions[...]  -> riferimenti decisioni             |
|  |-- ->contract{...}   -> vincoli                           |
|  +-- ->blueprint[...]  -> step implementativi               |
|                                                             |
|  1.3 Impatto Stimato                                        |
|  |-- Lexer: ~5 nuovi token                                  |
|  |-- Parser: ~5 nuove regole produzione                     |
|  |-- AST: ~5 nuovi tipi nodo                                |
|  +-- Test: ~30 nuovi test                                   |
|                                                             |
+-------------------------------------------------------------+
```

### Fase 2: Analyzer Enhancements

```
+-------------------------------------------------------------+
| FASE 2: ANALISI SEMANTICA                                   |
+-------------------------------------------------------------+
|                                                             |
|  2.1 Validazione Nuove Sezioni                              |
|  |-- Anchors: file esistono? linee valide?                  |
|  |-- Decisions: riferimenti validi?                         |
|  |-- Heat: pattern glob validi?                             |
|  |-- Intents: moduli esistono?                              |
|  +-- Links: file/test esistono?                             |
|                                                             |
|  2.2 Cross-Reference Resolution                             |
|  |-- Costruire grafo dipendenze                             |
|  |-- Validare riferimenti incrociati                        |
|  +-- Rilevare link orfani/rotti                             |
|                                                             |
|  2.3 Impatto Stimato                                        |
|  |-- Analyzer: nuove regole validazione                     |
|  |-- Symbol Table: nuovi tipi simbolo                       |
|  +-- Test: ~20 nuovi test                                   |
|                                                             |
+-------------------------------------------------------------+
```

### Fase 3: LSP Methods for LLM

```
+-------------------------------------------------------------+
| FASE 3: LLM API LAYER                                       |
+-------------------------------------------------------------+
|                                                             |
|  3.1 Metodi Base                                            |
|  |-- mbel/getAnchor        -> trova entry point             |
|  |-- mbel/getDecisions     -> trova decisioni               |
|  |-- mbel/getHeatMap       -> mappa rischio                 |
|  |-- mbel/getIntent        -> contratti modulo              |
|  +-- mbel/getCrossRefs     -> collegamenti                  |
|                                                             |
|  3.2 Metodi Analisi                                         |
|  |-- mbel/getEditRisk      -> rischio modifica              |
|  |-- mbel/getImpactAnalysis -> analisi impatto              |
|  |-- mbel/checkDecisionConflict -> conflitti                |
|  +-- mbel/validateChange   -> validazione intent            |
|                                                             |
|  3.3 Metodi Compositi                                       |
|  |-- mbel/getWorkContext   -> tutto per lavorare su X       |
|  |-- mbel/getRecentActivity -> cosa e' cambiato             |
|  +-- mbel/getHistory       -> storia di X                   |
|                                                             |
|  3.4 Impatto Stimato                                        |
|  |-- LSP Server: ~12 nuovi handler                          |
|  |-- Query Engine: nuovo modulo                             |
|  +-- Test: ~40 nuovi test                                   |
|                                                             |
+-------------------------------------------------------------+
```

### Fase 4: Integrations

```
+-------------------------------------------------------------+
| FASE 4: INTEGRATIONS                                        |
+-------------------------------------------------------------+
|                                                             |
|  4.1 OpenCode Integration                                   |
|  |-- Nuovi slash command per query semantiche               |
|  |-- Custom tool mbel-context per getWorkContext            |
|  +-- Auto-suggest basato su intent violations               |
|                                                             |
|  4.2 Claude Code Integration                                |
|  |-- MCP server per accesso a tutte le query                |
|  |-- Skill per navigazione semantica                        |
|  +-- Hook per validazione pre-commit                        |
|                                                             |
|  4.3 VSCode Extension                                       |
|  |-- CodeLens per anchors                                   |
|  |-- Hover per decisions/intents                            |
|  +-- Tree view per cross-refs                               |
|                                                             |
+-------------------------------------------------------------+
```

---

## Parte 4: Priorita' e Rationale

### Ordine di Implementazione

| # | Feature | Valore | Sforzo | Perche' Prima |
|---|---------|--------|--------|---------------|
| 1 | **Cross-Reference Links** | Alto | Medio | Game changer, abilita tutto il resto |
| 2 | **Semantic Anchors** | Alto | Basso | Quick win, impatto immediato |
| 3 | **getWorkContext API** | Alto | Medio | Combina tutto, UX rivoluzionaria |
| 4 | **Decision Log** | Medio | Basso | Previene errori, educativo |
| 5 | **Heat Map** | Medio | Medio | Risk mitigation |
| 6 | **Intent Markers** | Medio | Medio | Architectural guardrails |

### Rationale dell'Ordine

```
1. CROSS-REFS PRIMA
   Perche': senza collegamenti, le altre feature sono isolate
   Con i link, ogni nuova feature si integra automaticamente

2. ANCHORS SUBITO DOPO
   Perche': implementazione semplice (solo parsing + lookup)
   Ma impatto enorme (navigazione 10x piu' veloce)

3. getWorkContext TERZO
   Perche': combina cross-refs + anchors in una super-query
   E' il "prodotto finito" che gli LLM useranno

4. DECISIONS POI
   Perche': richiede disciplina di documentazione
   Ma paga dividendi enormi in prevenzione errori

5. HEAT MAP DOPO
   Perche': richiede integrazione con git history
   Valore alto ma implementazione piu' complessa

6. INTENTS ULTIMO
   Perche': il piu' astratto, richiede maturita' del progetto
   Ma diventa cruciale per progetti grandi
```

---

## Parte 5: Visione Finale

### MBEL 6.0: Da Task Tracker a "Codebase Brain"

```
+-------------------------------------------------------------+
|                                                             |
|                    OGGI: MBEL 5.0                           |
|                                                             |
|     +---------+                                             |
|     |  Task   |  "GoToDefinition e' completato"             |
|     |  State  |                                             |
|     +---------+                                             |
|         |                                                   |
|         v                                                   |
|     LLM deve cercare tutto il resto                         |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                    DOMANI: MBEL 6.0                         |
|                                                             |
|     +---------+     +---------+     +---------+             |
|     | Anchors |---->|  Links  |---->| Intents |             |
|     +---------+     +---------+     +---------+             |
|          |               |               |                  |
|          v               v               v                  |
|     +---------+     +---------+     +---------+             |
|     |Decisions|---->|Heat Map |---->| Context |             |
|     +---------+     +---------+     +---------+             |
|                           |                                 |
|                           v                                 |
|                   +---------------+                         |
|                   |getWorkContext |                         |
|                   | "Dammi tutto" |                         |
|                   +---------------+                         |
|                           |                                 |
|                           v                                 |
|         LLM ha TUTTO per lavorare efficacemente             |
|                                                             |
+-------------------------------------------------------------+
```

### Risultato Finale

Un LLM con MBEL 6.0 sara' capace di:

1. **Navigare istantaneamente** -> "Dove parto per X?" -> risposta immediata
2. **Capire il perche'** -> "Perche' e' fatto cosi'?" -> decisioni documentate
3. **Valutare i rischi** -> "E' sicuro toccare questo?" -> heat map
4. **Rispettare i confini** -> "Cosa posso/non posso fare?" -> intents
5. **Vedere le connessioni** -> "Cosa e' collegato?" -> cross-refs
6. **Lavorare con contesto completo** -> "Dammi tutto" -> getWorkContext

---

## Appendice: Checklist Implementazione

### Fase 1 Checklist
- [ ] Definire grammatica per §anchors
- [ ] Definire grammatica per §decisions
- [ ] Definire grammatica per §heat
- [ ] Definire grammatica per §intents
- [ ] Definire grammatica per §links
- [ ] Aggiungere token al Lexer
- [ ] Aggiungere regole al Parser
- [ ] Aggiungere nodi AST
- [ ] Scrivere test per ogni nuova sezione

### Fase 2 Checklist
- [ ] Validazione path file in anchors/links
- [ ] Validazione riferimenti in decisions
- [ ] Costruzione grafo cross-reference
- [ ] Rilevamento link orfani
- [ ] Test di integrazione

### Fase 3 Checklist
- [ ] Implementare mbel/getAnchor
- [ ] Implementare mbel/getDecisions
- [ ] Implementare mbel/getHeatMap
- [ ] Implementare mbel/getIntent
- [ ] Implementare mbel/getCrossRefs
- [ ] Implementare mbel/getEditRisk
- [ ] Implementare mbel/getImpactAnalysis
- [ ] Implementare mbel/getWorkContext
- [ ] Test per ogni metodo LSP

### Fase 4 Checklist
- [ ] OpenCode slash commands
- [ ] OpenCode custom tool
- [ ] Claude Code MCP server
- [ ] VSCode CodeLens
- [ ] VSCode Hover providers
- [ ] VSCode Tree view

---

*Documento generato: 2024-12-27*
*Versione: 1.0*
