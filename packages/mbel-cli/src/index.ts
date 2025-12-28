/**
 * MBEL CLI - Agent-First Command Line Interface
 *
 * @packageDocumentation
 */

export { createCli, runCli, main } from './cli.js';
export type {
  CliResult,
  CliOptions,
  OutputFormat,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SuggestedFix,
  ContextSummary
} from './types.js';

// Commands
export { checkCommand } from './commands/check.js';
export type { CheckOptions, CheckResult, CheckError, CheckWarning } from './commands/check.js';

export { impactCommand } from './commands/impact.js';
export type { ImpactOptions, ImpactResult } from './commands/impact.js';

export { mergeCommand, parseDelta, findInsertionPoint, atomicWrite } from './commands/merge.js';
export type { MergeOptions, MergeResult, ParseResult, InsertionPoint } from './commands/merge.js';

// Orchestrator
export { buildTaskContext, compressContext } from './orchestrator/context-builder.js';
export type { TaskContext, ContextMode } from './orchestrator/context-builder.js';

export { aggregateDeltas, validateDelta, orderDeltasBySection } from './orchestrator/delta-aggregator.js';
export type { AggregationResult, ValidationResult as DeltaValidationResult } from './orchestrator/delta-aggregator.js';
