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

export { contextCommand } from './commands/context.js';

export { grammarCommand } from './commands/grammar.js';

export { simulateCommand } from './commands/simulate.js';
export type { SimulateAction, SimulateOptions, SimulateResult } from './commands/simulate.js';

export { mergeCommand, parseDelta, findInsertionPoint, atomicWrite } from './commands/merge.js';
export type { MergeOptions, MergeResult, ParseResult, InsertionPoint } from './commands/merge.js';

// Schemas (Multi-Agent Architecture)
export {
  createTaskAssignment,
  validateTaskAssignment,
  serializeTask,
  deserializeTask,
  TASK_TYPES,
} from './schemas/task-schema.js';
export type {
  TaskType,
  TaskContext as TaskAssignmentContext,
  TaskConstraints,
  TaskAssignment,
  TaskValidationResult,
  DeserializeResult as TaskDeserializeResult,
} from './schemas/task-schema.js';

export {
  createTaskResult,
  validateTaskResult,
  serializeResult,
  deserializeResult,
  aggregateTestSummaries,
  RESULT_STATUSES,
  FILE_ACTIONS,
} from './schemas/result-schema.js';
export type {
  ResultStatus,
  FileAction,
  FileChange,
  TestSummary,
  TaskResult,
  ResultValidationResult,
  DeserializeResultOutput,
} from './schemas/result-schema.js';

// Orchestrator
export { buildTaskContext, compressContext } from './orchestrator/context-builder.js';
export type { TaskContext, ContextMode } from './orchestrator/context-builder.js';

export { aggregateDeltas, validateDelta, orderDeltasBySection } from './orchestrator/delta-aggregator.js';
export type { AggregationResult, ValidationResult as DeltaValidationResult } from './orchestrator/delta-aggregator.js';
