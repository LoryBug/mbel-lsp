# MBEL 6.0 TDDAB Implementation Plan

> **Methodology**: Test-Driven Development with Acceptance-Based Blocks
> **Status**: Planning
> **Blocks**: 8 new blocks (TDDAB#9 - TDDAB#16)

---

## Overview

Questa e' la continuazione del piano TDDAB esistente (TDDAB#1-#8 completati).
MBEL 6.0 aggiunge funzionalita' LLM-native al linguaggio e all'LSP.

```
MBEL 5.0 (COMPLETE)          MBEL 6.0 (PLANNED)
+-------------------+        +------------------------+
| TDDAB#1 Lexer     |        | TDDAB#9  CrossRefs     |
| TDDAB#2 Parser    |   -->  | TDDAB#10 Anchors       |
| TDDAB#3 Analyzer  |        | TDDAB#11 Decisions     |
| TDDAB#4 LspServer |        | TDDAB#12 HeatMap       |
| TDDAB#5 Features  |        | TDDAB#13 Intents       |
| TDDAB#6 GotoDef   |        | TDDAB#14 LLM-API       |
| TDDAB#7 FindRefs  |        | TDDAB#15 QueryEngine   |
| TDDAB#8 LLMQuery  |        | TDDAB#16 Integrations  |
+-------------------+        +------------------------+
```

---

## TDDAB#9: Cross-Reference Links

**Priority**: 1 (Game Changer - abilita tutto il resto)
**Scope**: Parser e Analyzer per la nuova sezione §links

### RED Phase - Tests First

```typescript
// packages/mbel-core/tests/lexer-links.test.ts
describe('Lexer: Links Section', () => {
  // Token Recognition
  it('should tokenize SECTION_LINKS keyword', () => {});
  it('should tokenize ARROW_FILES operator ->files', () => {});
  it('should tokenize ARROW_TESTS operator ->tests', () => {});
  it('should tokenize ARROW_DOCS operator ->docs', () => {});
  it('should tokenize ARROW_DECISIONS operator ->decisions', () => {});
  it('should tokenize ARROW_RELATED operator ->related', () => {});
  it('should tokenize ARROW_ENTRYPOINT operator ->entryPoint', () => {});
  it('should tokenize ARROW_BLUEPRINT operator ->blueprint', () => {});
  it('should tokenize ARROW_DEPENDS operator ->depends', () => {});

  // Path Parsing
  it('should tokenize file paths in brackets', () => {});
  it('should tokenize glob patterns', () => {});
  it('should tokenize line ranges {file.ts:10-20}', () => {});
  it('should tokenize TO-CREATE marker', () => {});
  it('should tokenize TO-MODIFY marker', () => {});
});

// packages/mbel-core/tests/parser-links.test.ts
describe('Parser: Links Section', () => {
  it('should parse @feature{Name} declaration', () => {});
  it('should parse @task{Name} declaration', () => {});
  it('should parse ->files[...] with multiple paths', () => {});
  it('should parse ->tests[...] with glob patterns', () => {});
  it('should parse ->blueprint[...] with string items', () => {});
  it('should parse nested link structure', () => {});
  it('should handle multiline link declarations', () => {});
  it('should recover from malformed links', () => {});
});

// packages/mbel-analyzer/tests/links-validation.test.ts
describe('Analyzer: Links Validation', () => {
  it('should validate file paths exist', () => {});
  it('should warn on non-existent files', () => {});
  it('should validate decision references', () => {});
  it('should detect orphan links', () => {});
  it('should detect circular dependencies', () => {});
  it('should validate blueprint syntax', () => {});
});
```

**Expected Tests**: ~25
**Files to Create/Modify**:
- `packages/mbel-core/src/tokens.ts` (add ~8 new tokens)
- `packages/mbel-core/src/lexer.ts` (add token recognition)
- `packages/mbel-core/src/ast.ts` (add LinkNode, FeatureLink, TaskLink)
- `packages/mbel-core/src/parser.ts` (add parseLinksSection)
- `packages/mbel-analyzer/src/analyzer.ts` (add links validation)
- `packages/mbel-analyzer/src/rules/links-rules.ts` (new)

### GREEN Phase - Implementation

```typescript
// New AST Nodes
interface LinkNode extends BaseNode {
  kind: 'link';
  linkType: 'feature' | 'task';
  name: string;
  files?: FilePath[];
  tests?: FilePath[];
  docs?: FilePath[];
  decisions?: string[];
  related?: string[];
  entryPoint?: EntryPointRef;
  blueprint?: string[];
  depends?: string[];
}

interface FilePath {
  path: string;
  lineRange?: { start: number; end: number };
  marker?: 'TO-CREATE' | 'TO-MODIFY';
  glob?: boolean;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 25 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Existing tests still pass (259)

---

## TDDAB#10: Semantic Anchors

**Priority**: 2 (Quick Win)
**Scope**: Parser e Analyzer per la nuova sezione §anchors

### RED Phase - Tests First

```typescript
// packages/mbel-core/tests/lexer-anchors.test.ts
describe('Lexer: Anchors Section', () => {
  it('should tokenize SECTION_ANCHORS keyword', () => {});
  it('should tokenize @entry:: prefix', () => {});
  it('should tokenize @hotspot:: prefix', () => {});
  it('should tokenize @boundary:: prefix', () => {});
  it('should tokenize ARROW_DESCRIZIONE operator', () => {});
  it('should tokenize file:line references', () => {});
  it('should tokenize glob patterns in hotspots', () => {});
});

// packages/mbel-core/tests/parser-anchors.test.ts
describe('Parser: Anchors Section', () => {
  it('should parse @entry anchor with file:line', () => {});
  it('should parse @hotspot anchor with glob', () => {});
  it('should parse @boundary anchor', () => {});
  it('should parse ->descrizione{...}', () => {});
  it('should handle multiple anchors', () => {});
});

// packages/mbel-analyzer/tests/anchors-validation.test.ts
describe('Analyzer: Anchors Validation', () => {
  it('should validate anchor file exists', () => {});
  it('should validate line number in range', () => {});
  it('should warn on duplicate anchor names', () => {});
  it('should validate glob patterns', () => {});
});
```

**Expected Tests**: ~18
**Files to Create/Modify**:
- `packages/mbel-core/src/tokens.ts` (add ~5 new tokens)
- `packages/mbel-core/src/lexer.ts` (add token recognition)
- `packages/mbel-core/src/ast.ts` (add AnchorNode)
- `packages/mbel-core/src/parser.ts` (add parseAnchorsSection)
- `packages/mbel-analyzer/src/rules/anchors-rules.ts` (new)

### GREEN Phase - Implementation

```typescript
interface AnchorNode extends BaseNode {
  kind: 'anchor';
  anchorType: 'entry' | 'hotspot' | 'boundary';
  name: string;
  location: {
    file: string;
    line?: number;
    pattern?: string; // for glob
  };
  description: string;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 18 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#11: Decision Log

**Priority**: 4 (High Value, Low Effort)
**Scope**: Parser e Analyzer per la nuova sezione §decisions estesa

### RED Phase - Tests First

```typescript
// packages/mbel-core/tests/lexer-decisions.test.ts
describe('Lexer: Decisions Section Extended', () => {
  it('should tokenize @date::DecisionName format', () => {});
  it('should tokenize ->alternatives[...] operator', () => {});
  it('should tokenize ->reason{...} operator', () => {});
  it('should tokenize ->tradeoff{...} operator', () => {});
  it('should tokenize ->context[...] operator', () => {});
  it('should tokenize ->status{...} operator', () => {});
  it('should tokenize ->revisit{...} operator', () => {});
  it('should tokenize ->supersededBy{...} operator', () => {});
});

// packages/mbel-core/tests/parser-decisions.test.ts
describe('Parser: Decisions Section', () => {
  it('should parse full decision declaration', () => {});
  it('should parse decision with alternatives array', () => {});
  it('should parse decision status ACTIVE/SUPERSEDED', () => {});
  it('should parse multiline decision', () => {});
  it('should link to context files', () => {});
});

// packages/mbel-analyzer/tests/decisions-validation.test.ts
describe('Analyzer: Decisions Validation', () => {
  it('should validate date format', () => {});
  it('should validate context file paths', () => {});
  it('should warn on superseded without replacement', () => {});
  it('should detect decision conflicts', () => {});
});
```

**Expected Tests**: ~20
**Files to Create/Modify**:
- `packages/mbel-core/src/tokens.ts` (add ~8 new tokens)
- `packages/mbel-core/src/ast.ts` (add DecisionNode)
- `packages/mbel-core/src/parser.ts` (add parseDecisionsSection)
- `packages/mbel-analyzer/src/rules/decisions-rules.ts` (new)

### GREEN Phase - Implementation

```typescript
interface DecisionNode extends BaseNode {
  kind: 'decision';
  date: string; // ISO format
  name: string;
  choice: string;
  alternatives?: string[];
  reason: string;
  tradeoff?: string;
  context?: string[]; // file paths
  status: 'ACTIVE' | 'SUPERSEDED' | 'RECONSIDERING';
  supersededBy?: string;
  revisitCondition?: string;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 20 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#12: Heat Map

**Priority**: 5 (Medium Value, Medium Effort)
**Scope**: Parser e Analyzer per la nuova sezione §heat

### RED Phase - Tests First

```typescript
// packages/mbel-core/tests/lexer-heat.test.ts
describe('Lexer: Heat Section', () => {
  it('should tokenize SECTION_HEAT keyword', () => {});
  it('should tokenize @critical:: prefix', () => {});
  it('should tokenize @stable:: prefix', () => {});
  it('should tokenize @volatile:: prefix', () => {});
  it('should tokenize @hot:: prefix', () => {});
  it('should tokenize ->dependents{...} operator', () => {});
  it('should tokenize ->untouched{...} operator', () => {});
  it('should tokenize ->changes{...} operator', () => {});
  it('should tokenize ->coverage{...} operator', () => {});
  it('should tokenize ->confidence{...} operator', () => {});
});

// packages/mbel-core/tests/parser-heat.test.ts
describe('Parser: Heat Section', () => {
  it('should parse @critical heat entry', () => {});
  it('should parse @stable heat entry', () => {});
  it('should parse metrics ->dependents{23}', () => {});
  it('should parse time-based metrics ->untouched{45days}', () => {});
  it('should parse change frequency ->changes{12-in-30days}', () => {});
});

// packages/mbel-analyzer/tests/heat-validation.test.ts
describe('Analyzer: Heat Validation', () => {
  it('should validate heat file paths', () => {});
  it('should validate metric formats', () => {});
  it('should warn on conflicting heat levels', () => {});
});
```

**Expected Tests**: ~18
**Files to Create/Modify**:
- `packages/mbel-core/src/tokens.ts` (add ~10 new tokens)
- `packages/mbel-core/src/ast.ts` (add HeatNode)
- `packages/mbel-core/src/parser.ts` (add parseHeatSection)
- `packages/mbel-analyzer/src/rules/heat-rules.ts` (new)

### GREEN Phase - Implementation

```typescript
interface HeatNode extends BaseNode {
  kind: 'heat';
  level: 'critical' | 'stable' | 'volatile' | 'hot';
  name: string;
  pattern: string; // file path or glob
  metrics: {
    dependents?: number | 'external';
    untouchedDays?: number;
    changesInPeriod?: { count: number; days: number };
    tests?: number;
    coverage?: number;
    confidence?: 'low' | 'medium' | 'high' | 'very-high' | 'rock-solid';
  };
  impact?: string;
  caution?: string;
  status?: string;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 18 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#13: Intent Markers

**Priority**: 6 (Architectural Guardrails)
**Scope**: Parser e Analyzer per la nuova sezione §intents

### RED Phase - Tests First

```typescript
// packages/mbel-core/tests/lexer-intents.test.ts
describe('Lexer: Intents Section', () => {
  it('should tokenize SECTION_INTENTS keyword', () => {});
  it('should tokenize @Module::Component format', () => {});
  it('should tokenize ->does{...} operator', () => {});
  it('should tokenize ->doesNot[...] operator', () => {});
  it('should tokenize ->contract{...} operator', () => {});
  it('should tokenize ->singleResponsibility{...} operator', () => {});
  it('should tokenize ->antiPattern{...} operator', () => {});
  it('should tokenize ->extends{...} operator', () => {});
});

// packages/mbel-core/tests/parser-intents.test.ts
describe('Parser: Intents Section', () => {
  it('should parse module::component reference', () => {});
  it('should parse does clause', () => {});
  it('should parse doesNot array', () => {});
  it('should parse contract statements', () => {});
  it('should parse antiPattern block', () => {});
});

// packages/mbel-analyzer/tests/intents-validation.test.ts
describe('Analyzer: Intents Validation', () => {
  it('should validate module references', () => {});
  it('should warn on duplicate intents', () => {});
  it('should validate contract syntax', () => {});
});
```

**Expected Tests**: ~16
**Files to Create/Modify**:
- `packages/mbel-core/src/tokens.ts` (add ~8 new tokens)
- `packages/mbel-core/src/ast.ts` (add IntentNode)
- `packages/mbel-core/src/parser.ts` (add parseIntentsSection)
- `packages/mbel-analyzer/src/rules/intents-rules.ts` (new)

### GREEN Phase - Implementation

```typescript
interface IntentNode extends BaseNode {
  kind: 'intent';
  module: string;
  component: string;
  does: string[];
  doesNot: string[];
  contract: string[];
  singleResponsibility?: string;
  antiPatterns?: string[];
  extends?: string;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 16 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#14: LLM API Layer

**Priority**: 3 (Combines everything)
**Scope**: Nuovi metodi LSP per query semantiche

### RED Phase - Tests First

```typescript
// packages/mbel-lsp/tests/llm-api.test.ts
describe('LSP: LLM API Methods', () => {
  // Anchor queries
  describe('mbel/getAnchor', () => {
    it('should find anchor by concept name', () => {});
    it('should filter by anchor type', () => {});
    it('should return empty for unknown concept', () => {});
  });

  // CrossRef queries
  describe('mbel/getCrossRefs', () => {
    it('should get cross-refs by feature name', () => {});
    it('should get cross-refs by task name', () => {});
    it('should get cross-refs by file path', () => {});
    it('should include related features', () => {});
  });

  // Risk assessment
  describe('mbel/getEditRisk', () => {
    it('should return low risk for new files', () => {});
    it('should return high risk for critical files', () => {});
    it('should include recommendations', () => {});
  });

  // Impact analysis
  describe('mbel/getImpactAnalysis', () => {
    it('should find affected files', () => {});
    it('should find affected tests', () => {});
    it('should detect breaking changes', () => {});
  });

  // Decision queries
  describe('mbel/getDecisions', () => {
    it('should find decisions by pattern', () => {});
    it('should find decisions by file context', () => {});
    it('should filter by status', () => {});
  });

  // Intent queries
  describe('mbel/getIntent', () => {
    it('should get intent by module', () => {});
    it('should get intent by component', () => {});
  });

  // Composite query
  describe('mbel/getWorkContext', () => {
    it('should return complete context for feature', () => {});
    it('should return complete context for task', () => {});
    it('should include blueprint for pending tasks', () => {});
  });
});
```

**Expected Tests**: ~25
**Files to Create/Modify**:
- `packages/mbel-lsp/src/llm-api/index.ts` (new)
- `packages/mbel-lsp/src/llm-api/anchor-handler.ts` (new)
- `packages/mbel-lsp/src/llm-api/crossref-handler.ts` (new)
- `packages/mbel-lsp/src/llm-api/risk-handler.ts` (new)
- `packages/mbel-lsp/src/llm-api/decision-handler.ts` (new)
- `packages/mbel-lsp/src/llm-api/intent-handler.ts` (new)
- `packages/mbel-lsp/src/llm-api/workcontext-handler.ts` (new)
- `packages/mbel-lsp/src/server.ts` (register handlers)

### GREEN Phase - Implementation

```typescript
// Handler registration
connection.onRequest('mbel/getAnchor', handleGetAnchor);
connection.onRequest('mbel/getCrossRefs', handleGetCrossRefs);
connection.onRequest('mbel/getEditRisk', handleGetEditRisk);
connection.onRequest('mbel/getImpactAnalysis', handleGetImpactAnalysis);
connection.onRequest('mbel/getDecisions', handleGetDecisions);
connection.onRequest('mbel/getIntent', handleGetIntent);
connection.onRequest('mbel/getWorkContext', handleGetWorkContext);
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 25 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#15: Query Engine

**Priority**: 3.5 (Infrastructure for API)
**Scope**: Motore di query interno per navigazione semantica

### RED Phase - Tests First

```typescript
// packages/mbel-analyzer/tests/query-engine.test.ts
describe('Query Engine', () => {
  describe('Dependency Graph', () => {
    it('should build dependency graph from AST', () => {});
    it('should find dependents of a file', () => {});
    it('should find dependencies of a file', () => {});
    it('should detect circular dependencies', () => {});
  });

  describe('Semantic Search', () => {
    it('should find anchors by concept', () => {});
    it('should find links by feature name', () => {});
    it('should find decisions by context', () => {});
    it('should find intents by module', () => {});
  });

  describe('Impact Analysis', () => {
    it('should calculate edit risk', () => {});
    it('should find affected files', () => {});
    it('should find affected tests', () => {});
  });

  describe('Composite Queries', () => {
    it('should build work context', () => {});
    it('should aggregate related information', () => {});
  });
});
```

**Expected Tests**: ~15
**Files to Create/Modify**:
- `packages/mbel-analyzer/src/query-engine/index.ts` (new)
- `packages/mbel-analyzer/src/query-engine/dependency-graph.ts` (new)
- `packages/mbel-analyzer/src/query-engine/semantic-search.ts` (new)
- `packages/mbel-analyzer/src/query-engine/impact-analyzer.ts` (new)

### GREEN Phase - Implementation

```typescript
export class QueryEngine {
  private dependencyGraph: DependencyGraph;
  private semanticIndex: SemanticIndex;

  buildFromDocument(doc: MbelDocument): void;

  // Query methods
  findAnchor(concept: string, type?: AnchorType): AnchorResult[];
  findCrossRefs(target: string): CrossRefResult;
  getEditRisk(file: string): RiskAssessment;
  getImpactAnalysis(files: string[]): ImpactResult;
  findDecisions(pattern: string): Decision[];
  findIntent(module: string, component?: string): Intent[];
  getWorkContext(target: string): WorkContext;
}
```

### VERIFY Phase - Acceptance Criteria

- [ ] All 15 tests pass
- [ ] Coverage >= 95%
- [ ] Type check passes
- [ ] Build succeeds

---

## TDDAB#16: Tool Integrations

**Priority**: Last (Depends on all previous)
**Scope**: Integrazione con OpenCode, Claude Code, VSCode

### RED Phase - Tests First

```typescript
// Integration tests
describe('OpenCode Integration', () => {
  it('should expose /mb-context command', () => {});
  it('should expose /mb-risk command', () => {});
  it('should expose mbel-workcontext tool', () => {});
});

describe('VSCode Extension', () => {
  it('should show CodeLens for anchors', () => {});
  it('should show hover for decisions', () => {});
  it('should provide TreeView for cross-refs', () => {});
});
```

**Expected Tests**: ~10
**Files to Create/Modify**:
- `.opencode/slash-commands/mb-context.md` (new)
- `.opencode/slash-commands/mb-risk.md` (new)
- `.opencode/tools/mbel-workcontext.md` (new)
- `packages/vscode-extension/src/codelens-provider.ts` (new)
- `packages/vscode-extension/src/hover-provider.ts` (modify)
- `packages/vscode-extension/src/tree-view.ts` (new)

### VERIFY Phase - Acceptance Criteria

- [ ] All integration tests pass
- [ ] VSCode extension builds
- [ ] OpenCode commands work
- [ ] Manual testing passes

---

## Summary

### Total New Tests: ~147

| Block | Tests | Priority |
|-------|-------|----------|
| TDDAB#9 CrossRefs | 25 | 1 |
| TDDAB#10 Anchors | 18 | 2 |
| TDDAB#11 Decisions | 20 | 4 |
| TDDAB#12 HeatMap | 18 | 5 |
| TDDAB#13 Intents | 16 | 6 |
| TDDAB#14 LLM-API | 25 | 3 |
| TDDAB#15 QueryEngine | 15 | 3.5 |
| TDDAB#16 Integrations | 10 | Last |
| **Total** | **147** | |

### Execution Order

```
Phase 1: Language Extensions (Sequential)
  TDDAB#9  -> TDDAB#10 -> TDDAB#11 -> TDDAB#12 -> TDDAB#13
  (CrossRefs) (Anchors)  (Decisions) (HeatMap)  (Intents)

Phase 2: Infrastructure (After Phase 1)
  TDDAB#15 QueryEngine

Phase 3: API Layer (After Phase 2)
  TDDAB#14 LLM-API

Phase 4: Integrations (After Phase 3)
  TDDAB#16 Integrations
```

### New Tokens Summary (~40)

```
§links, §anchors, §decisions, §heat, §intents
->files, ->tests, ->docs, ->decisions, ->related
->entryPoint, ->blueprint, ->depends, ->descrizione
->alternatives, ->reason, ->tradeoff, ->context
->status, ->revisit, ->supersededBy
->dependents, ->untouched, ->changes, ->coverage, ->confidence
->impact, ->caution
->does, ->doesNot, ->contract, ->singleResponsibility
->antiPattern, ->extends
@entry::, @hotspot::, @boundary::
@critical::, @stable::, @volatile::, @hot::
@feature{}, @task{}
{TO-CREATE}, {TO-MODIFY}
```

### Projected Final State

```
MBEL 6.0 Complete:
- Total Tests: 259 + 147 = 406
- New Tokens: ~40
- New AST Nodes: ~8
- New LSP Methods: ~10
- Coverage Target: >= 90%
```
