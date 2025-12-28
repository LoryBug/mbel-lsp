# MBEL LSP Verification & Agent Strategy

## 1. Verification Report

This document confirms the capabilities of the MBEL Language Server Protocol (LSP) implementation. We verified that the system performs true semantic analysis rather than simple text processing.

### Test 1: Syntax & Semantic Validation (`mbel check`)
**Command:** `npx tsx packages/mbel-cli/src/cli.ts check memory-bank/activeContext.mbel.md`

**Result:** SUCCESS
The LSP parser successfully identified subtle semantic issues that a text reader would miss:
- **Intelligent Typos:** Detected Unicode arrows (`→`) and suggested the correct ASCII arrow (`->`) with error code `MBEL-TYPO-001`.
- **Logic Validation:** Detected duplicate attributes (`completed`, `effort`, `tests`) within the same scope.

**Output Snippet:**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "MBEL-TYPO-001",
      "message": "Unicode right arrow '→' detected. Did you mean '->'?",
      "suggestedFix": { "find": "→", "replace": "->" }
    }
  ]
}
```

### Test 2: Context Aggregation (`mbel context`)
**Command:** `npx tsx packages/mbel-cli/src/cli.ts context Lexer --mode=summary`

**Result:** SUCCESS
The system successfully traversed the graph to aggregate scattered information about the "Lexer" feature without grepping:
- **Files:** Mapped `packages/mbel-core/src/lexer.ts` and `types.ts`.
- **Tests:** Identified specific test files including `lexer-links.test.ts`.
- **Entry Point:** Resolved `MbelLexer` symbol in `lexer.ts`.

**Output Snippet:**
```json
{
  "feature": "Lexer",
  "files": ["packages/mbel-core/src/lexer.ts", ...],
  "entryPoint": { "file": "lexer.ts", "symbol": "MbelLexer" }
}
```

### Test 3: Impact Analysis (`mbel impact`)
**Command:** `npx tsx packages/mbel-cli/src/cli.ts impact packages/mbel-core/src/lexer.ts --mb memory-bank`

**Result:** SUCCESS
The Graph Engine correctly calculated the ripple effect of changes:
- **Risk Level:** High
- **Direct Dependencies:** Identified `Parser` depends on `Lexer`.
- **Transitive Impact:** Traced impact to `Analyzer`, `LSPServer`, `QueryService`, and `CLI`.

**Output Snippet:**
```json
{
  "riskLevel": "high",
  "affectedFeatures": ["Lexer"],
  "dependentFeatures": ["Parser"],
  "transitiveImpact": ["Analyzer", "LSPServer", "QueryService", "CLI"],
  "suggestion": "Run affected tests... High-impact change"
}
```

---

## 2. Gap Analysis

**Current State:**
The agent currently uses `.opencode/tool/mbel-query.ts`.
- **Mechanism:** It runs a standalone Node.js script that performs basic string parsing/regex.
- **Limitation:** It is unaware of the Semantic Graph, cannot validate logic, and duplicates logic poorly.
- **Risk:** The agent is "flying blind" compared to the CLI users, potentially making decisions that contradict the LSP's impact analysis.

**Desired State:**
The agent should use the exact same logic as the CLI (`@mbel/cli` and `@mbel/lsp`) to ensure consistency.

---

## 3. Agent Integration Strategy (Final)

Replace the legacy `mbel-query` tool with **MBEL Semantic Tool** that exposes ALL CLI capabilities.

### Available Commands

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `check` | Validate MBEL syntax | file path | errors, warnings, suggestions |
| `impact` | Analyze change ripple effects | file path | risk level, affected features, dependents |
| `context` | Get feature summary | feature name | files, tests, entry points, dependencies |
| `grammar` | Show MBEL syntax reference | format (bnf/examples) | grammar rules |
| `simulate` | Dry-run architecture changes | action + params | predicted impact |
| `status` | Quick project overview | - | counts by state |

### Tool Implementation: `.opencode/tool/mbel-semantic.ts`

```typescript
import { z } from "zod";
import { spawn } from "child_process";
import * as path from "path";

const CLI_PATH = path.join(process.cwd(), "packages/mbel-cli/dist/cli.js");

export default {
  description: `MBEL Semantic Analysis Tool - Query and validate Memory Bank files.

Commands:
- check <file>: Validate MBEL syntax, detect errors
- impact <file>: Analyze change impact, find dependents
- context <feature>: Get feature files, tests, entry points
- grammar: Show MBEL syntax reference
- simulate: Dry-run architecture changes
- status: Quick project status overview

ALWAYS use this tool instead of manually reading Memory Bank files.`,

  args: {
    command: z.enum(["check", "impact", "context", "grammar", "simulate", "status"])
      .describe("Semantic operation to perform"),
    target: z.string().optional()
      .describe("File path (check/impact) or feature name (context)"),
    options: z.object({
      mb: z.string().optional().describe("Memory Bank path"),
      mode: z.enum(["summary", "full", "compact"]).optional(),
      format: z.enum(["bnf", "examples"]).optional(),
      action: z.enum(["add-dep", "remove-dep", "add-feature", "remove-feature"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      feature: z.string().optional(),
      dependsOn: z.string().optional(),
    }).optional(),
  },

  async execute({ command, target, options }) {
    const args: string[] = ["--json"];

    switch (command) {
      case "check":
        if (!target) return { error: "check requires a file path" };
        args.push("check", target);
        break;

      case "impact":
        if (!target) return { error: "impact requires a file path" };
        args.push("impact", target);
        if (options?.mb) args.push("--mb", options.mb);
        break;

      case "context":
        if (!target) return { error: "context requires a feature name" };
        args.push("context", target);
        if (options?.mb) args.push("--mb", options.mb);
        if (options?.mode) args.push("--mode", options.mode);
        break;

      case "grammar":
        args.push("grammar");
        if (options?.format) args.push("--format", options.format);
        break;

      case "simulate":
        args.push("simulate");
        if (options?.action) args.push("--action", options.action);
        if (options?.from) args.push("--from", options.from);
        if (options?.to) args.push("--to", options.to);
        if (options?.feature) args.push("--feature", options.feature);
        if (options?.dependsOn) args.push("--depends-on", options.dependsOn);
        if (options?.mb) args.push("--mb", options.mb);
        break;

      case "status":
        // Quick status using MbelServer directly
        return await getProjectStatus();
    }

    return await runCli(args);
  },
};

async function runCli(args: string[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data; });
    proc.stderr.on("data", (data) => { stderr += data; });

    proc.on("close", (code) => {
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ output: stdout, error: stderr, exitCode: code });
      }
    });

    proc.on("error", reject);
  });
}

async function getProjectStatus(): Promise<unknown> {
  // Import server dynamically to avoid bundle issues
  const { MbelServer } = await import("@mbel/lsp");
  const fs = await import("fs");
  const pathMod = await import("path");

  const server = new MbelServer();
  const mbDir = "./memory-bank";

  if (!fs.existsSync(mbDir)) {
    return { error: "No Memory Bank directory found" };
  }

  const files = fs.readdirSync(mbDir).filter(f =>
    f.endsWith(".mbel.md") || f.endsWith(".mbel")
  );

  const totals = { pending: 0, completed: 0, failed: 0, critical: 0, active: 0, recent: 0 };
  const byFile: Record<string, unknown> = {};

  for (const file of files) {
    const filePath = pathMod.join(mbDir, file);
    const uri = "file:///" + pathMod.resolve(filePath).split(pathMod.sep).join("/");
    const content = fs.readFileSync(filePath, "utf8");
    server.onDidOpenTextDocument(uri, 1, content);

    const s = server.getProjectStatus(uri);
    byFile[file] = s;
    totals.pending += s.pending;
    totals.completed += s.completed;
    totals.failed += s.failed;
    totals.critical += s.critical;
    totals.active += s.active;
    totals.recent += s.recentChanges;
  }

  return { totals, byFile };
}
```

### Enforcement Plan

1. **Deprecate:** Rename `.opencode/tool/mbel-query.ts` → `.opencode/tool/mbel-query.ts.deprecated`
2. **Implement:** Create `.opencode/tool/mbel-semantic.ts` as above
3. **Build:** Ensure `@mbel/cli` is built before using tool
4. **Instruct:** Update agent prompts with these rules:

**Pre-Edit Rules:**
```
Before editing ANY file in packages/*, run:
  mbel-semantic { command: "impact", target: "<file>" }
If riskLevel is "high", warn user and list affected features.
```

**Post-Edit Rules:**
```
After editing ANY .mbel or .mbel.md file, run:
  mbel-semantic { command: "check", target: "<file>" }
Fix any errors before proceeding.
```

**Context Loading:**
```
When asked about a feature, run:
  mbel-semantic { command: "context", target: "<feature>" }
Use the returned files, tests, and entry points.
```

### Migration Path

| Phase | Action |
|-------|--------|
| 1 | Create `mbel-semantic.ts` alongside `mbel-query.ts` |
| 2 | Test both tools in parallel |
| 3 | Remove `mbel-query.ts` after validation |
| 4 | Update `.opencode/prompt.md` with new rules |
