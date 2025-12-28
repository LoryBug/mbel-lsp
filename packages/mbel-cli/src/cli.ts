#!/usr/bin/env node
/**
 * MBEL CLI - Agent-First Command Line Interface
 *
 * Designed for machine consumption with JSON output support.
 * All commands return structured data suitable for LLM processing.
 */

import { Command } from 'commander';
import type { CliResult, OutputFormat } from './types.js';
import { checkCommand } from './commands/check.js';
import { impactCommand } from './commands/impact.js';
import { contextCommand } from './commands/context.js';
import { grammarCommand } from './commands/grammar.js';
import { simulateCommand, SimulateAction } from './commands/simulate.js';

const VERSION = '0.1.0';
const DESCRIPTION = 'MBEL CLI - Agent-First Command Line Interface';

/**
 * Create and configure the CLI program
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name('mbel')
    .version(VERSION)
    .description(DESCRIPTION)
    .option('-j, --json', 'Output results in JSON format', false)
    .option('-q, --quiet', 'Suppress non-essential output', false);

  // Add check command
  program
    .command('check <file>')
    .description('Validate an MBEL file')
    .option('--format <format>', 'Output format (json|text)', 'json')
    .action(async (file: string, options: { format: string }) => {
      const parentOpts = program.opts<{ json: boolean; quiet: boolean }>();
      const result = await checkCommand(file, {
        json: options.format === 'json' || parentOpts.json,
        quiet: parentOpts.quiet
      });
      if (result.output) {
        process.stdout.write(result.output + '\n');
      }
      process.exit(result.exitCode ?? 0);
    });

  // Add impact command
  program
    .command('impact <file>')
    .description('Analyze impact of modifying a file')
    .option('--mb <path>', 'Path to Memory Bank directory', 'memory-bank')
    .option('--format <format>', 'Output format (json|text)', 'json')
    .action(async (file: string, options: { mb: string; format: string }) => {
      const parentOpts = program.opts<{ json: boolean; quiet: boolean }>();
      const result = await impactCommand(file, options.mb, {
        json: options.format === 'json' || parentOpts.json,
        quiet: parentOpts.quiet
      });
      if (result.output) {
        process.stdout.write(result.output + '\n');
      }
      process.exit(result.exitCode ?? 0);
    });

  // Add context command
  program
    .command('context <feature>')
    .description('Get token-optimized feature summary')
    .option('--mb <path>', 'Path to Memory Bank file', 'memory-bank/systemPatterns.mbel.md')
    .option('--mode <mode>', 'Output mode (summary|full|compact)', 'summary')
    .action(async (feature: string, options: { mb: string; mode: string }) => {
      const parentOpts = program.opts<{ json: boolean; quiet: boolean }>();
      const result = await contextCommand(feature, options.mb, {
        mode: options.mode as 'summary' | 'full' | 'compact',
        json: parentOpts.json
      });
      const output = JSON.stringify(result, null, parentOpts.quiet ? 0 : 2);
      process.stdout.write(output + '\n');
      process.exit(result.success ? 0 : 1);
    });

  // Add grammar command
  program
    .command('grammar')
    .description('Show MBEL grammar reference')
    .option('--format <format>', 'Output format (bnf|examples)', 'bnf')
    .action(async (options: { format: string }) => {
      const parentOpts = program.opts<{ json: boolean; quiet: boolean }>();
      const result = await grammarCommand({
        format: options.format as 'bnf' | 'examples'
      });
      if (parentOpts.json) {
        process.stdout.write(JSON.stringify(result, null, parentOpts.quiet ? 0 : 2) + '\n');
      } else {
        process.stdout.write(result.content + '\n');
      }
      process.exit(result.success ? 0 : 1);
    });

  // Add simulate command
  program
    .command('simulate')
    .description('Simulate architecture changes (dry-run)')
    .option('--action <action>', 'Simulation action (add-dep|remove-dep|add-feature|remove-feature)', 'add-dep')
    .option('--from <feature>', 'Source feature')
    .option('--to <feature>', 'Target feature')
    .option('--feature <name>', 'Feature name (for add-feature/remove-feature)')
    .option('--depends-on <features>', 'Comma-separated dependencies (for add-feature)')
    .option('--mb <path>', 'Path to Memory Bank file', 'memory-bank/systemPatterns.mbel.md')
    .action(async (options: {
      action: string;
      from?: string;
      to?: string;
      feature?: string;
      dependsOn?: string;
      mb: string;
    }) => {
      const parentOpts = program.opts<{ json: boolean; quiet: boolean }>();
      const simOptions: any = {
        action: options.action as SimulateAction,
        dependsOn: options.dependsOn?.split(',').map(s => s.trim()),
      };
      if (options.from) simOptions.from = options.from;
      if (options.to) simOptions.to = options.to;
      if (options.feature) simOptions.feature = options.feature;

      const result = await simulateCommand(options.mb, simOptions);
      const output = JSON.stringify(result, null, parentOpts.quiet ? 0 : 2);
      process.stdout.write(output + '\n');
      process.exit(result.success ? 0 : 1);
    });

  return program;
}

/**
 * Run the CLI with given arguments
 *
 * @param argv - Command line arguments (including node and script path)
 * @returns CliResult with operation outcome
 */
export async function runCli(argv: string[]): Promise<CliResult> {
  const program = createCli();

  // Determine if --json flag is present
  const jsonIndex = argv.findIndex(arg => arg === '--json' || arg === '-j');
  const format: OutputFormat = jsonIndex !== -1 ? 'json' : 'text';

  // Handle --version
  if (argv.includes('--version') || argv.includes('-V')) {
    const output = format === 'json'
      ? JSON.stringify({ version: VERSION }, null, 2)
      : VERSION;

    return {
      success: true,
      output,
      format,
      exitCode: 0
    };
  }

  // Handle --help
  if (argv.includes('--help') || argv.includes('-h')) {
    return {
      success: true,
      output: program.helpInformation(),
      format: 'text',
      exitCode: 0
    };
  }

  // Check for unknown commands (skip file arguments for check command)
  const knownFlags = ['--version', '-V', '--help', '-h', '--json', '-j', '--quiet', '-q', '--format'];
  const knownCommands = ['check', 'impact', 'context', 'grammar', 'simulate'];
  const args = argv.slice(2).filter(arg => !arg.startsWith('-'));

  // If first arg is a known command, remaining args are its parameters
  const firstArg = args[0];
  const unknownCommands = firstArg && !knownCommands.includes(firstArg)
    ? [firstArg]
    : [];

  if (unknownCommands.length > 0) {
    const error = `Unknown command: ${unknownCommands[0]}`;
    return {
      success: false,
      output: format === 'json'
        ? JSON.stringify({ error }, null, 2)
        : error,
      format,
      error,
      exitCode: 1
    };
  }

  // No command provided - show help hint
  if (args.length === 0 && !argv.some(arg => knownFlags.includes(arg))) {
    return {
      success: true,
      output: format === 'json'
        ? JSON.stringify({ message: 'Use --help to see available commands' }, null, 2)
        : 'Use --help to see available commands',
      format,
      exitCode: 0
    };
  }

  // Execute commander program
  // Note: Actions will call process.exit(), so this promise might not resolve
  await program.parseAsync(argv);

  return {
    success: true,
    output: '',
    format,
    exitCode: 0
  };
}

/**
 * Main entry point for CLI execution
 */
export async function main(): Promise<void> {
  const result = await runCli(process.argv);

  if (result.output) {
    if (result.success) {
      process.stdout.write(result.output + '\n');
    } else {
      process.stderr.write(result.output + '\n');
    }
  }

  process.exit(result.exitCode ?? (result.success ? 0 : 1));
}

// Execute CLI
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
