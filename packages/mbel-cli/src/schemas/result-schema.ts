/**
 * TDDAB#28: ResultSchema
 * Task result schema for multi-agent architecture
 *
 * Defines the format for results returned by subagents to orchestrator
 */

/**
 * Available result statuses
 */
export type ResultStatus = 'completed' | 'blocked' | 'failed' | 'partial';

/**
 * Array of all valid result statuses
 */
export const RESULT_STATUSES: readonly ResultStatus[] = ['completed', 'blocked', 'failed', 'partial'] as const;

/**
 * File action types
 */
export type FileAction = 'created' | 'modified' | 'deleted';

/**
 * Array of all valid file actions
 */
export const FILE_ACTIONS: readonly FileAction[] = ['created', 'modified', 'deleted'] as const;

/**
 * Represents a file change made by the subagent
 */
export interface FileChange {
  /** Path to the changed file */
  readonly path: string;
  /** Type of change */
  readonly action: FileAction;
  /** Optional: Number of lines changed (for modified files) */
  readonly linesChanged?: number;
}

/**
 * Summary of test execution
 */
export interface TestSummary {
  /** Number of passing tests */
  readonly passed: number;
  /** Number of failing tests */
  readonly failed: number;
  /** Number of skipped tests */
  readonly skipped: number;
  /** Number of new tests added */
  readonly newTests: number;
}

/**
 * Complete result from a subagent task
 */
export interface TaskResult {
  /** ID of the completed task */
  readonly taskId: string;
  /** Completion status */
  readonly status: ResultStatus;
  /** Files that were changed */
  readonly filesChanged: readonly FileChange[];
  /** Test execution summary */
  readonly tests: TestSummary;
  /** MBEL fragment to merge into Memory Bank */
  readonly mbDelta: string;
  /** List of blockers (if status is blocked/failed/partial) */
  readonly blockers: readonly string[];
  /** Duration in milliseconds */
  readonly duration: number;
}

/**
 * Validation result for task result
 */
export interface ResultValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Deserialization result
 */
export interface DeserializeResultOutput {
  success: boolean;
  result?: TaskResult;
  error?: string;
  errors?: string[];
}

/**
 * Deep freeze an object and all its nested properties
 */
function deepFreeze<T extends object>(obj: T): T {
  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;

  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
}

/**
 * Create and freeze a TaskResult
 * Returns an immutable task result object
 */
export function createTaskResult(input: TaskResult): TaskResult {
  const result: TaskResult = {
    taskId: input.taskId,
    status: input.status,
    filesChanged: input.filesChanged.map((fc) => ({
      path: fc.path,
      action: fc.action,
      ...(fc.linesChanged !== undefined && { linesChanged: fc.linesChanged }),
    })),
    tests: {
      passed: input.tests.passed,
      failed: input.tests.failed,
      skipped: input.tests.skipped,
      newTests: input.tests.newTests,
    },
    mbDelta: input.mbDelta,
    blockers: [...input.blockers],
    duration: input.duration,
  };

  return deepFreeze(result);
}

/**
 * Validate a TaskResult
 * Returns validation result with errors and warnings
 */
export function validateTaskResult(result: TaskResult): ResultValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate taskId
  if (!result.taskId || result.taskId.trim() === '') {
    errors.push('taskId is required');
  }

  // Validate status
  if (!RESULT_STATUSES.includes(result.status)) {
    errors.push('status must be one of: completed, blocked, failed, partial');
  }

  // Validate duration
  if (result.duration < 0) {
    errors.push('duration must be non-negative');
  }

  // Validate test counts
  const { passed, failed, skipped, newTests } = result.tests;
  if (passed < 0 || failed < 0 || skipped < 0 || newTests < 0) {
    errors.push('test counts must be non-negative');
  }

  // Validate file changes
  for (const fc of result.filesChanged) {
    if (!fc.path || fc.path.trim() === '') {
      errors.push('file path is required');
    }
    if (!FILE_ACTIONS.includes(fc.action)) {
      errors.push(`invalid file action: ${fc.action}`);
    }
  }

  // Warning: blocked but no blockers
  if (result.status === 'blocked' && result.blockers.length === 0) {
    warnings.push('blocked status but no blockers listed');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Serialize a TaskResult to JSON string
 */
export function serializeResult(result: TaskResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Deserialize a JSON string to TaskResult
 * Validates the result after parsing
 */
export function deserializeResult(json: string): DeserializeResultOutput {
  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      success: false,
      error: 'Invalid JSON: could not parse input',
    };
  }

  // Basic structure check
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Invalid structure: expected object',
    };
  }

  const obj = parsed as Record<string, unknown>;
  const testsObj = (obj['tests'] as Record<string, unknown>) ?? {};
  const filesChangedArr = Array.isArray(obj['filesChanged']) ? obj['filesChanged'] : [];

  // Build result object
  const result: TaskResult = {
    taskId: String(obj['taskId'] ?? ''),
    status: (obj['status'] as ResultStatus) ?? 'failed',
    filesChanged: filesChangedArr.map((fc: unknown) => {
      const fileChange = fc as Record<string, unknown>;
      return {
        path: String(fileChange['path'] ?? ''),
        action: (fileChange['action'] as FileAction) ?? 'modified',
        ...(typeof fileChange['linesChanged'] === 'number' && {
          linesChanged: fileChange['linesChanged'] as number,
        }),
      };
    }),
    tests: {
      passed: Number(testsObj['passed'] ?? 0),
      failed: Number(testsObj['failed'] ?? 0),
      skipped: Number(testsObj['skipped'] ?? 0),
      newTests: Number(testsObj['newTests'] ?? 0),
    },
    mbDelta: String(obj['mbDelta'] ?? ''),
    blockers: Array.isArray(obj['blockers'])
      ? (obj['blockers'] as string[])
      : [],
    duration: Number(obj['duration'] ?? 0),
  };

  // Validate
  const validation = validateTaskResult(result);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // Return frozen result
  return {
    success: true,
    result: createTaskResult(result),
  };
}

/**
 * Aggregate multiple test summaries into one
 */
export function aggregateTestSummaries(summaries: readonly TestSummary[]): TestSummary {
  return {
    passed: summaries.reduce((sum, s) => sum + s.passed, 0),
    failed: summaries.reduce((sum, s) => sum + s.failed, 0),
    skipped: summaries.reduce((sum, s) => sum + s.skipped, 0),
    newTests: summaries.reduce((sum, s) => sum + s.newTests, 0),
  };
}
