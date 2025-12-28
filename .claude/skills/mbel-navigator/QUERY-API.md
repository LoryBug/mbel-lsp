# QueryService API Reference

The QueryService provides programmatic access to navigate MBEL documents.

## Location

```typescript
import { QueryService } from '@mbel/lsp';
// or
import { QueryService } from './packages/mbel-lsp/dist/query-service.js';
```

## Methods

### getAllFeatures(content: string): FeatureFiles[]

Get all features and tasks from the document.

```typescript
const features = qs.getAllFeatures(content);
// Returns: FeatureFiles[]
```

**Returns:**
```typescript
interface FeatureFiles {
  name: string;           // Feature name
  type: 'feature' | 'task';
  files: string[];        // Source files
  tests: string[];        // Test files
  docs: string[];         // Documentation files
  entryPoint: {           // Main entry point (nullable)
    file: string;
    symbol: string | null;
    line: number | null;
  } | null;
  depends: string[];      // Dependencies
  related: string[];      // Related features
}
```

### getFeatureFiles(content: string, featureName: string): FeatureFiles | null

Forward lookup: Get files associated with a feature.

```typescript
const parser = qs.getFeatureFiles(content, 'Parser');
// Returns: FeatureFiles or null if not found
```

### getFileFeatures(content: string, filePath: string): FileFeatureInfo[]

Reverse lookup: Get features that contain a specific file.

```typescript
const features = qs.getFileFeatures(content, 'lexer.ts');
// Returns: FileFeatureInfo[]
```

**Returns:**
```typescript
interface FileFeatureInfo {
  name: string;                    // Feature name
  type: 'feature' | 'task';
  relation: 'file' | 'test' | 'doc';  // How file relates
}
```

**Note:** Supports partial path matching:
- `'lexer.ts'` matches `'packages/mbel-core/src/lexer.ts'`
- `'parser.test.ts'` matches test files

### getEntryPoints(content: string): Map<string, EntryPointInfo>

Get all entry points from the document.

```typescript
const entries = qs.getEntryPoints(content);
for (const [name, ep] of entries) {
  console.log(`${name}: ${ep.file}::${ep.symbol}:${ep.line}`);
}
```

**Returns:**
```typescript
interface EntryPointInfo {
  file: string;
  symbol: string | null;
  line: number | null;
}
```

### getAnchors(content: string): AnchorInfo[]

Get all semantic anchors from the document.

```typescript
const anchors = qs.getAnchors(content);
// Returns: AnchorInfo[]
```

**Returns:**
```typescript
interface AnchorInfo {
  path: string;                           // File path
  type: 'entry' | 'hotspot' | 'boundary';
  description: string | null;
  isGlob: boolean;                        // If path is glob pattern
}
```

### getAnchorsByType(content: string, type: string): AnchorInfo[]

Get anchors filtered by type.

```typescript
const hotspots = qs.getAnchorsByType(content, 'hotspot');
const entries = qs.getAnchorsByType(content, 'entry');
const boundaries = qs.getAnchorsByType(content, 'boundary');
```

## Usage Example

```javascript
import { readFileSync } from 'fs';
import { QueryService } from './packages/mbel-lsp/dist/query-service.js';

const qs = new QueryService();
const content = readFileSync('./memory-bank/systemPatterns.mbel.md', 'utf-8');

// Get all features
const features = qs.getAllFeatures(content);
console.log(`Found ${features.length} features`);

// Find specific feature
const parser = qs.getFeatureFiles(content, 'Parser');
if (parser) {
  console.log('Parser files:', parser.files);
  console.log('Parser depends on:', parser.depends);
}

// Reverse lookup
const usages = qs.getFileFeatures(content, 'lexer.ts');
console.log('lexer.ts is used by:', usages.map(u => u.name));

// Get hotspots
const hotspots = qs.getAnchorsByType(content, 'hotspot');
console.log('Hotspots:', hotspots.map(h => h.path));
```

## Best Practices

1. **Read systemPatterns.mbel.md** for code navigation queries
2. **Use partial paths** for file lookups (e.g., `'parser.ts'` not full path)
3. **Check null returns** - `getFeatureFiles` returns null if not found
4. **Combine with direct reads** - Use QueryService for navigation, Read for context

---

# Multi-Agent Schemas

The CLI exports schemas for orchestrator/subagent communication.

## Location

```typescript
import {
  // Task Schema
  createTaskAssignment,
  validateTaskAssignment,
  serializeTask,
  deserializeTask,
  TASK_TYPES,

  // Result Schema
  createTaskResult,
  validateTaskResult,
  serializeResult,
  deserializeResult,
  aggregateTestSummaries,
  RESULT_STATUSES,
  FILE_ACTIONS,

  // Orchestrator Helpers
  buildTaskContext,
  compressContext,
  aggregateDeltas,
  validateDelta,
  orderDeltasBySection,
} from '@mbel/cli';
```

## TaskAssignment Schema

```typescript
interface TaskAssignment {
  id: string;                    // e.g., "TDDAB#31"
  type: TaskType;                // implement|refactor|test|fix|document
  target: string;                // Feature name
  description: string;           // What to do
  context: {
    mbSnapshot: string;          // Compressed MBEL context
    files: string[];             // Relevant files
    dependencies: string[];      // Feature dependencies
  };
  acceptance: string[];          // Acceptance criteria
  constraints: {
    maxFiles: number;            // Max files to modify
    testCommand: string;         // e.g., "npm test"
    maxTokens?: number;          // Optional token limit
    timeout?: number;            // Optional timeout (ms)
  };
}

type TaskType = 'implement' | 'refactor' | 'test' | 'fix' | 'document';
```

## TaskResult Schema

```typescript
interface TaskResult {
  taskId: string;                // Matches TaskAssignment.id
  status: ResultStatus;          // completed|blocked|failed|partial
  filesChanged: FileChange[];    // What was modified
  tests: TestSummary;            // Test execution results
  mbDelta: string;               // MBEL fragment for MB update
  blockers: string[];            // Blockers if status != completed
  duration: number;              // Execution time (ms)
}

interface FileChange {
  path: string;
  action: 'created' | 'modified' | 'deleted';
  linesChanged?: number;
}

interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
  newTests: number;
}

type ResultStatus = 'completed' | 'blocked' | 'failed' | 'partial';
```

## Orchestrator Helpers

### buildTaskContext(mbContent, feature, mode)

Build context for subagent from Memory Bank content.

```typescript
const context = buildTaskContext(
  mbContent,           // Raw MB file content
  'Parser',            // Feature name
  'summary'            // Mode: summary|full|compact
);
// Returns: TaskContext { mbSnapshot, files, dependencies }
```

### aggregateDeltas(deltas)

Combine multiple deltas from parallel subagents.

```typescript
const result = aggregateDeltas([delta1, delta2, delta3]);
// Returns: { combined: string, sections: string[], duplicates: string[] }
```

### validateDelta(mbContent, delta)

Check if delta is valid for merge into MB.

```typescript
const validation = validateDelta(mbContent, delta);
// Returns: { valid: boolean, errors: string[], warnings: string[] }
```

## CLI Commands

```bash
# Validate TaskAssignment
mbel task-validate '{"id":"TDDAB#1",...}'
mbel task-validate @task.json

# Validate TaskResult
mbel result-validate '{"taskId":"TDDAB#1",...}'
mbel result-validate @result.json

# Merge delta atomically
mbel merge <file> --delta "..." [--dry-run]
```
