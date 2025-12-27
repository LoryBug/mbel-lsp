# LLM Navigation Improvements for MBEL v6

## Obiettivo
Rendere MBEL v6 uno strumento che l'LLM può **interrogare attivamente** per navigare il progetto, non solo leggere passivamente.

---

## 1. Query API per CrossRefLinks

### 1.1 Forward Lookup (Feature → Files)
```typescript
// Dato il nome di una feature, ottenere tutti i file correlati
getFeatureFiles(featureName: string): FeatureFiles

interface FeatureFiles {
  files: string[];
  tests: string[];
  docs: string[];
  entryPoint: { file: string; symbol: string; line: number } | null;
}
```

**Caso d'uso LLM:**
> "Modifica la feature Parser per supportare X"
> → LLM chiama `getFeatureFiles("Parser")`
> → Ottiene lista precisa di file da leggere/modificare

### 1.2 Reverse Lookup (File → Features)
```typescript
// Dato un file, scoprire a quali feature appartiene
getFileFeatures(filePath: string): string[]
```

**Caso d'uso LLM:**
> LLM sta guardando `src/parser.ts`
> → Chiama `getFileFeatures("src/parser.ts")`
> → Scopre che appartiene a features: ["Parser", "AST", "ErrorRecovery"]
> → Può capire l'impatto delle modifiche

### 1.3 Dependency Graph Query
```typescript
// Ottenere tutte le dipendenze di una feature (transitive)
getFeatureDependencies(featureName: string, transitive?: boolean): string[]

// Ottenere feature che dipendono da questa
getFeatureDependents(featureName: string): string[]
```

**Caso d'uso LLM:**
> "Refactoring del Lexer"
> → `getFeatureDependents("Lexer")` → ["Parser", "Analyzer", "LSP"]
> → LLM sa che deve verificare impatto su queste feature

### 1.4 Entry Point Navigation
```typescript
// Ottenere il punto di ingresso consigliato per una feature
getEntryPoint(featureName: string): EntryPoint | null

// Ottenere tutti gli entry point del progetto
getAllEntryPoints(): Map<string, EntryPoint>
```

**Caso d'uso LLM:**
> "Come funziona il Parser?"
> → `getEntryPoint("Parser")` → `{file: "parser.ts", symbol: "MbelParser", line: 45}`
> → LLM sa esattamente da dove iniziare a leggere

---

## 2. Query API per SemanticAnchors

### 2.1 Anchor Type Query
```typescript
// Ottenere tutti gli anchor di un tipo
getAnchorsByType(type: 'entry' | 'hotspot' | 'boundary'): Anchor[]

interface Anchor {
  type: AnchorType;
  path: string;
  description: string | null;
}
```

**Caso d'uso LLM:**
> "Quali sono i file più importanti del progetto?"
> → `getAnchorsByType('entry')` → Lista di entry point semantici
> → LLM sa dove concentrare l'attenzione

### 2.2 Path-based Anchor Lookup
```typescript
// Dato un file, ottenere i suoi anchor semantici
getFileAnchors(filePath: string): Anchor[]
```

**Caso d'uso LLM:**
> LLM sta per modificare `src/api/external.ts`
> → `getFileAnchors("src/api/external.ts")` → `[{type: 'boundary', ...}]`
> → LLM capisce che è un boundary e deve stare attento alle breaking changes

### 2.3 Hotspot Warning
```typescript
// Verificare se un file è un hotspot
isHotspot(filePath: string): boolean

// Ottenere tutti gli hotspot
getHotspots(): string[]
```

**Caso d'uso LLM:**
> Prima di modificare un file, verificare se è hotspot
> → Se sì, LLM può chiedere conferma o essere più cauto

---

## 3. Analisi Automatica (Non manuale)

### 3.1 Orphan Detection
```typescript
// File nel progetto non linkati a nessuna feature
getOrphanFiles(): string[]

// Feature senza file di implementazione
getOrphanFeatures(): string[]
```

**Caso d'uso LLM:**
> "Analizza la copertura del progetto"
> → `getOrphanFiles()` → Lista di file "dimenticati"
> → LLM può suggerire di aggiungerli a feature esistenti

### 3.2 Test Coverage Gap
```typescript
// Feature con file ma senza test
getFeaturesWithoutTests(): string[]

// File di implementazione senza test corrispondenti
getUntestedFiles(): string[]
```

**Caso d'uso LLM:**
> "Quali aree hanno bisogno di test?"
> → Risposta immediata senza analisi manuale

### 3.3 Blueprint Progress
```typescript
// Ottenere stato di avanzamento di un task con blueprint
getBlueprintProgress(taskName: string): BlueprintStatus

interface BlueprintStatus {
  steps: string[];
  completedSteps: number;
  currentStep: string | null;
}
```

**Caso d'uso LLM:**
> "A che punto siamo con il task X?"
> → Stato preciso senza dover leggere tutto il file

---

## 4. Context-Aware Suggestions

### 4.1 Related Files Suggestion
```typescript
// Dato un file che sto modificando, suggerire altri file da considerare
getRelatedFiles(filePath: string): RelatedFile[]

interface RelatedFile {
  path: string;
  relation: 'test' | 'implementation' | 'dependency' | 'related';
  reason: string;
}
```

**Caso d'uso LLM:**
> Modifico `parser.ts`
> → Suggerimenti: "Considera anche parser.test.ts (test), ast.ts (dependency)"

### 4.2 Impact Analysis
```typescript
// Prima di modificare, stimare l'impatto
analyzeImpact(filePath: string): ImpactAnalysis

interface ImpactAnalysis {
  directlyAffected: string[];      // File che importano questo
  transitivelyAffected: string[];  // Impatto a cascata
  testsToRun: string[];            // Test da eseguire
  features: string[];               // Feature impattate
}
```

**Caso d'uso LLM:**
> "Sto per modificare lexer.ts, qual è l'impatto?"
> → Lista completa di cosa verificare dopo

---

## 5. Natural Language Queries

### 5.1 Semantic Search
```typescript
// Query in linguaggio naturale
queryProject(question: string): QueryResult

// Esempi:
// "Quali file gestiscono il parsing?"
// "Dove sono definiti i token?"
// "Come funziona la validazione?"
```

**Implementazione:** Basato su embedding delle descrizioni MBEL + file content

### 5.2 Task-Oriented Queries
```typescript
// "Voglio aggiungere un nuovo operatore"
getTaskGuidance(task: string): TaskGuidance

interface TaskGuidance {
  relevantFeatures: string[];
  filesToModify: string[];
  testsToAdd: string[];
  suggestedBlueprint: string[];
}
```

---

## 6. Integrazione Git (per Hotspot reali)

### 6.1 Change Frequency Analysis
```typescript
// Calcolare hotspot basati su storia git
calculateHotspots(days?: number): HotspotAnalysis

interface HotspotAnalysis {
  files: Array<{
    path: string;
    changeCount: number;
    lastModified: Date;
    suggestAsHotspot: boolean;
  }>;
}
```

### 6.2 Auto-Update Anchors
```typescript
// Suggerire aggiornamenti agli anchor basati su git
suggestAnchorUpdates(): AnchorSuggestion[]

// Es: "src/new-critical.ts ha avuto 50 commit questo mese, considerare come hotspot?"
```

---

## 7. LSP Methods da Aggiungere

### Custom Request Methods
```typescript
// Nuovi metodi LSP custom
'mbel/getFeatureFiles'
'mbel/getFileFeatures'
'mbel/getEntryPoints'
'mbel/getAnchorsByType'
'mbel/analyzeImpact'
'mbel/getOrphans'
'mbel/queryProject'
```

### Workflow tipico LLM
```
1. User: "Aggiungi validazione al parser"
2. LLM: mbel/getFeatureFiles("Parser")
   → {files: ["parser.ts"], tests: ["parser.test.ts"], entryPoint: {...}}
3. LLM: mbel/analyzeImpact("parser.ts")
   → {affected: ["analyzer.ts", "lsp.ts"], tests: [...]}
4. LLM: Legge solo i file necessari
5. LLM: Implementa con contesto preciso
6. LLM: Sa quali test eseguire
```

---

## 8. Priorità Implementazione

| Priorità | Feature | TDDAB | Effort |
|----------|---------|-------|--------|
| P0 | `getFeatureFiles` | #17 | S |
| P0 | `getFileFeatures` | #17 | S |
| P0 | `getEntryPoints` | #17 | S |
| P1 | `getAnchorsByType` | #18 | S |
| P1 | `analyzeImpact` | #18 | M |
| P1 | `getOrphanFiles` | #18 | S |
| P2 | `getFeatureDependencies` | #19 | M |
| P2 | `getBlueprintProgress` | #19 | S |
| P3 | Git integration | #20 | L |
| P3 | Natural language query | #21 | XL |

---

## 9. Formato Output per LLM

Ogni query dovrebbe ritornare in formato **LLM-friendly**:

```json
{
  "success": true,
  "query": "getFeatureFiles",
  "params": {"feature": "Parser"},
  "result": {
    "files": ["src/parser.ts", "src/ast.ts"],
    "tests": ["tests/parser.test.ts"],
    "entryPoint": {
      "file": "src/parser.ts",
      "symbol": "MbelParser",
      "line": 45
    }
  },
  "suggestion": "Start reading from parser.ts:45 (MbelParser class)"
}
```

---

## 10. Metriche di Successo

L'implementazione è utile se:

1. **Riduzione file letti:** LLM legge solo file rilevanti (target: -50% file reads)
2. **Precisione modifiche:** Meno errori di "file dimenticati"
3. **Velocità onboarding:** Nuovo progetto navigabile in <5 query
4. **Test coverage:** LLM sa sempre quali test eseguire

---

## Note Implementative

- Tutti i metodi devono essere **stateless** (no cache complessa)
- Output sempre **JSON serializzabile**
- Errori con messaggi **actionable** per LLM
- Documentazione inline per ogni metodo
