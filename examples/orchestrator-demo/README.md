# MBEL Orchestrator Demo

This directory demonstrates the multi-agent orchestration workflow using the MBEL CLI.

## Overview

The multi-agent architecture uses an **orchestrator** to coordinate **subagents**:

```
┌─────────────┐    TaskAssignment    ┌───────────┐
│             │ ──────────────────▶  │           │
│ Orchestrator│                      │  Subagent │
│             │ ◀──────────────────  │           │
└─────────────┘     TaskResult       └───────────┘
        │
        │ mbDelta
        ▼
┌─────────────┐
│ Memory Bank │
└─────────────┘
```

## Files

| File | Description |
|------|-------------|
| `sample-task.json` | Example TaskAssignment sent to subagent |
| `sample-result.json` | Example TaskResult returned by subagent |
| `demo.sh` | Shell script demonstrating the full workflow |

## Workflow Steps

### 1. Create TaskAssignment

The orchestrator creates a `TaskAssignment` JSON with:
- **id**: Unique task identifier (e.g., `TDDAB#33`)
- **type**: Task type (`implement`, `refactor`, `test`, `fix`, `document`)
- **target**: Feature or component name
- **context**: MBEL snapshot, relevant files, dependencies
- **acceptance**: List of acceptance criteria
- **constraints**: Limits on files, test commands, timeouts

### 2. Validate TaskAssignment

```bash
node packages/mbel-cli/dist/cli.js task-validate @examples/orchestrator-demo/sample-task.json
```

### 3. Subagent Executes Task

The subagent receives the task and performs the work, then returns a `TaskResult`.

### 4. Validate TaskResult

```bash
node packages/mbel-cli/dist/cli.js result-validate @examples/orchestrator-demo/sample-result.json
```

### 5. Merge mbDelta

The orchestrator merges the `mbDelta` from the result into the Memory Bank:

```bash
node packages/mbel-cli/dist/cli.js merge memory-bank/systemPatterns.mbel.md \
  --delta "[FeatureX] @status=implemented" \
  --dry-run
```

## Running the Demo

```bash
# From project root
chmod +x examples/orchestrator-demo/demo.sh
./examples/orchestrator-demo/demo.sh
```

## Schema Reference

### TaskAssignment

```typescript
interface TaskAssignment {
  id: string;           // e.g., "TDDAB#33"
  type: TaskType;       // "implement" | "refactor" | "test" | "fix" | "document"
  target: string;       // Feature/component name
  description: string;  // What to do
  context: {
    mbSnapshot: string;       // Compressed MBEL context
    files: string[];          // Relevant files
    dependencies: string[];   // Feature dependencies
  };
  acceptance: string[];       // Acceptance criteria
  constraints: {
    maxFiles: number;         // Max files to modify
    testCommand: string;      // Test command to run
    maxTokens?: number;       // Optional token limit
    timeout?: number;         // Optional timeout (ms)
  };
}
```

### TaskResult

```typescript
interface TaskResult {
  taskId: string;       // Must match TaskAssignment.id
  status: ResultStatus; // "completed" | "blocked" | "failed" | "partial"
  filesChanged: {
    path: string;
    action: "created" | "modified" | "deleted";
    linesChanged?: number;
  }[];
  tests: {
    passed: number;
    failed: number;
    skipped: number;
    newTests: number;
  };
  mbDelta: string;      // MBEL fragment to merge
  blockers: string[];   // Blockers if status != completed
  duration: number;     // Execution time in ms
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `task-validate <json>` | Validate TaskAssignment JSON |
| `result-validate <json>` | Validate TaskResult JSON |
| `merge <file> --delta <mbel>` | Merge MBEL delta into Memory Bank |

Use `@filename` syntax to read JSON from a file instead of inline.
