# MBEL Multi-Agent Architecture Guide

This guide explains how to use MBEL and Memory Bank (MB) in a multi-agent architecture where an **orchestrator agent** coordinates **subagents** for implementing features.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (Claude Opus/Sonnet)                           │
│ - Reads MB summary: mbel context <feature> --mode=summary   │
│ - Plans TDDAB blocks                                        │
│ - Spawns subagents with TaskAssignment JSON                 │
│ - Receives TaskResult JSON with mb_delta                    │
│ - Merges delta atomically: mbel merge <file> --delta "..."  │
│ - SINGLE WRITER to Memory Bank                              │
└─────────────────────────────────────────────────────────────┘
         │ TaskAssignment                    ▲ TaskResult
         ▼                                   │
┌─────────────────────────────────────────────────────────────┐
│ SUBAGENT (Claude Sonnet/Haiku)                              │
│ - Receives: task JSON + MBEL context                        │
│ - Implements: 1 TDDAB block                                 │
│ - Validates: mbel check <file>                              │
│ - Returns: TaskResult with mb_delta                         │
│ - READ-ONLY access to MB                                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Single Writer Pattern**: Only the orchestrator writes to Memory Bank
2. **Subagent Isolation**: Subagents receive context snapshot, return deltas
3. **Atomic Merges**: Use `mbel merge` with temp-file+rename for crash safety
4. **Token Efficiency**: MBEL notation saves ~47% tokens vs prose

## CLI Commands for Multi-Agent Workflow

### 1. Get Context for Subagent

```bash
# Summary mode (recommended for subagent context)
mbel context Parser --mode=summary

# Full mode (all details)
mbel context Parser --mode=full

# Compact mode (ultra-compressed)
mbel context Parser --mode=compact
```

### 2. Validate Task Assignment

```bash
# Validate JSON directly
mbel task-validate '{"id":"TDDAB#31",...}'

# Validate from file
mbel task-validate @task.json
```

### 3. Validate Task Result

```bash
# Validate JSON directly
mbel result-validate '{"taskId":"TDDAB#31",...}'

# Validate from file
mbel result-validate @result.json
```

### 4. Merge Delta into Memory Bank

```bash
# Merge with dry-run preview
mbel merge memory-bank/activeContext.mbel.md --delta "[PROGRESS]
✓TDDAB#31::NewFeature{completed}" --dry-run

# Actual merge (atomic write)
mbel merge memory-bank/activeContext.mbel.md --delta "[PROGRESS]
✓TDDAB#31::NewFeature{completed}"
```

### 5. Pre-commit Validation

```bash
# Validate MBEL syntax before committing
mbel check memory-bank/activeContext.mbel.md
```

## Schemas

### TaskAssignment (Orchestrator → Subagent)

```json
{
  "id": "TDDAB#31",
  "type": "implement",
  "target": "NewFeature",
  "description": "Implement X functionality with Y behavior",
  "context": {
    "mbSnapshot": "[FOCUS]\\n@focus::NewFeature{...}",
    "files": ["src/new-feature.ts"],
    "dependencies": ["Parser", "Lexer"]
  },
  "acceptance": [
    "All tests pass",
    "100% coverage on new code",
    "No lint errors"
  ],
  "constraints": {
    "maxFiles": 5,
    "testCommand": "npm test",
    "maxTokens": 8000,
    "timeout": 300000
  }
}
```

**Task Types**: `implement`, `refactor`, `test`, `fix`, `document`

### TaskResult (Subagent → Orchestrator)

```json
{
  "taskId": "TDDAB#31",
  "status": "completed",
  "filesChanged": [
    {"path": "src/new-feature.ts", "action": "created", "linesChanged": 150},
    {"path": "tests/new-feature.test.ts", "action": "created", "linesChanged": 80}
  ],
  "tests": {
    "passed": 25,
    "failed": 0,
    "skipped": 0,
    "newTests": 25
  },
  "mbDelta": "[PROGRESS]\n✓TDDAB#31::NewFeature{completed}\n  ->files[src/new-feature.ts]\n  ->tests{25,100%coverage}",
  "blockers": [],
  "duration": 45000
}
```

**Result Statuses**: `completed`, `blocked`, `failed`, `partial`

**File Actions**: `created`, `modified`, `deleted`

## Orchestrator Workflow

### Step 1: Read Memory Bank Summary

```bash
mbel context "*" --mode=summary --mb memory-bank/systemPatterns.mbel.md
```

This returns a compressed view of the current project state.

### Step 2: Plan Tasks

Based on MB summary, decompose work into TDDAB blocks:
- Each block = 1 atomic unit of work
- Follows RED→GREEN→VERIFY pattern
- Has clear acceptance criteria

### Step 3: Create TaskAssignment

```javascript
const task = {
  id: "TDDAB#31",
  type: "implement",
  target: "NewFeature",
  description: "...",
  context: buildTaskContext(mbContent, "NewFeature", "summary"),
  acceptance: ["Tests pass", "Coverage 100%"],
  constraints: {
    maxFiles: 5,
    testCommand: "npm test"
  }
};

// Validate before sending
const validation = mbel task-validate '<json>';
```

### Step 4: Spawn Subagent

Provide subagent with:
1. TaskAssignment JSON
2. Relevant file contents
3. Test patterns

### Step 5: Receive and Validate Result

```bash
mbel result-validate '<result-json>'
```

### Step 6: Merge Delta

```bash
# Always dry-run first
mbel merge memory-bank/activeContext.mbel.md --delta "<mb_delta>" --dry-run

# Then apply
mbel merge memory-bank/activeContext.mbel.md --delta "<mb_delta>"
```

## Subagent Guidelines

1. **READ Memory Bank** at start via context provided in TaskAssignment
2. **IMPLEMENT** the assigned task following TDDAB methodology
3. **RUN TESTS** using the specified testCommand
4. **GENERATE mb_delta** in MBEL format documenting what was done
5. **RETURN TaskResult** with status, files, tests, and delta

### mb_delta Format

```mbel
[PROGRESS]
✓TDDAB#31::FeatureName{status}
  ->files[path1.ts,path2.ts]
  ->tests{passed,coverage%}
  ->completed{date}
```

## Error Handling

### Blocked Status

If subagent encounters blockers:

```json
{
  "taskId": "TDDAB#31",
  "status": "blocked",
  "blockers": [
    "Missing dependency: @some/package",
    "Unclear requirement: how should X handle Y?"
  ],
  "mbDelta": "[BLOCKERS]\n!TDDAB#31::FeatureName{blocked}\n  ->reason{missing-dependency}",
  ...
}
```

### Partial Completion

If subagent completes part of the work:

```json
{
  "taskId": "TDDAB#31",
  "status": "partial",
  "blockers": ["Time constraint: completed 3/5 acceptance criteria"],
  "mbDelta": "[PROGRESS]\n?TDDAB#31::FeatureName{partial}\n  ->completed{3/5}",
  ...
}
```

## Benefits

1. **Context Isolation**: Orchestrator stays lean, subagents disposable
2. **No Autocompact Risk**: Subagents can be terminated without losing state
3. **Atomic MB Updates**: No conflicts with single-writer pattern
4. **Token Efficiency**: 47% savings via MBEL compression
5. **Audit Trail**: Every change tracked in MB with timestamps

## Integration with Claude Code

### As Orchestrator Prompt

Add to system prompt:
```
You are an orchestrator agent. Use MBEL CLI commands:
- mbel context: Get feature context for subagents
- mbel task-validate: Validate task assignments
- mbel result-validate: Validate subagent results
- mbel merge: Atomically update Memory Bank

Always validate before send/merge. Always dry-run before actual merge.
```

### As Subagent Instructions

Include in subagent spawn:
```
You are implementing TDDAB block {{task.id}}.
Your context: {{task.context.mbSnapshot}}
Files to modify: {{task.context.files}}
Acceptance criteria: {{task.acceptance}}

Return a TaskResult JSON with your changes and mb_delta.
```
