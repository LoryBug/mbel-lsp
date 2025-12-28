/**
 * MBEL Semantic Analysis Tool - Custom Tool for OpenCode
 *
 * Replaces the legacy mbel-query tool with full CLI capabilities.
 * Uses @mbel/cli for true semantic analysis via the LSP.
 */

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

  async execute({ command, target, options }: {
    command: "check" | "impact" | "context" | "grammar" | "simulate" | "status";
    target?: string;
    options?: {
      mb?: string;
      mode?: "summary" | "full" | "compact";
      format?: "bnf" | "examples";
      action?: "add-dep" | "remove-dep" | "add-feature" | "remove-feature";
      from?: string;
      to?: string;
      feature?: string;
      dependsOn?: string;
    };
  }) {
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
        // Quick status using MbelServer directly for backward compatibility
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

  const files = fs.readdirSync(mbDir).filter((f: string) =>
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
