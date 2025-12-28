/**
 * TDDAB#27: TaskSchema
 * Task assignment schema for multi-agent architecture
 *
 * Defines the format for assigning tasks to subagents
 */

/**
 * Available task types for subagent assignments
 */
export type TaskType = 'implement' | 'refactor' | 'test' | 'fix' | 'document';

/**
 * Array of all valid task types
 */
export const TASK_TYPES: readonly TaskType[] = ['implement', 'refactor', 'test', 'fix', 'document'] as const;

/**
 * Context information extracted from Memory Bank for the subagent
 */
export interface TaskContext {
  /** Compressed MBEL snapshot of relevant context */
  readonly mbSnapshot: string;
  /** Files relevant to this task */
  readonly files: readonly string[];
  /** Dependencies (other features) this task depends on */
  readonly dependencies: readonly string[];
}

/**
 * Constraints for task execution
 */
export interface TaskConstraints {
  /** Maximum number of files the subagent can modify */
  readonly maxFiles: number;
  /** Command to run tests */
  readonly testCommand: string;
  /** Optional: Maximum tokens for context (for LLM optimization) */
  readonly maxTokens?: number;
  /** Optional: Timeout in milliseconds */
  readonly timeout?: number;
}

/**
 * Complete task assignment for a subagent
 */
export interface TaskAssignment {
  /** Unique task identifier (e.g., "TDDAB#27") */
  readonly id: string;
  /** Type of task */
  readonly type: TaskType;
  /** Target feature or component */
  readonly target: string;
  /** Human-readable description of what to do */
  readonly description: string;
  /** Context from Memory Bank */
  readonly context: TaskContext;
  /** Acceptance criteria */
  readonly acceptance: readonly string[];
  /** Execution constraints */
  readonly constraints: TaskConstraints;
}

/**
 * Validation result for task assignment
 */
export interface TaskValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Deserialization result
 */
export interface DeserializeResult {
  success: boolean;
  task?: TaskAssignment;
  error?: string;
  errors?: string[];
}

/**
 * Deep freeze an object and all its nested properties
 */
function deepFreeze<T extends object>(obj: T): T {
  // Get all properties
  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;

  // Freeze nested objects first
  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
}

/**
 * Create and freeze a TaskAssignment
 * Returns an immutable task assignment object
 */
export function createTaskAssignment(input: TaskAssignment): TaskAssignment {
  const task: TaskAssignment = {
    id: input.id,
    type: input.type,
    target: input.target,
    description: input.description,
    context: {
      mbSnapshot: input.context.mbSnapshot,
      files: [...input.context.files],
      dependencies: [...input.context.dependencies],
    },
    acceptance: [...input.acceptance],
    constraints: {
      maxFiles: input.constraints.maxFiles,
      testCommand: input.constraints.testCommand,
      ...(input.constraints.maxTokens !== undefined && { maxTokens: input.constraints.maxTokens }),
      ...(input.constraints.timeout !== undefined && { timeout: input.constraints.timeout }),
    },
  };

  return deepFreeze(task);
}

/**
 * Validate a TaskAssignment
 * Returns validation result with list of errors
 */
export function validateTaskAssignment(task: TaskAssignment): TaskValidationResult {
  const errors: string[] = [];

  // Validate id
  if (!task.id || task.id.trim() === '') {
    errors.push('id is required');
  }

  // Validate type
  if (!TASK_TYPES.includes(task.type)) {
    errors.push('type must be one of: implement, refactor, test, fix, document');
  }

  // Validate target
  if (!task.target || task.target.trim() === '') {
    errors.push('target is required');
  }

  // Validate description
  if (!task.description || task.description.trim() === '') {
    errors.push('description is required');
  }

  // Validate constraints
  if (task.constraints.maxFiles <= 0) {
    errors.push('maxFiles must be greater than 0');
  }

  if (!task.constraints.testCommand || task.constraints.testCommand.trim() === '') {
    errors.push('testCommand is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize a TaskAssignment to JSON string
 */
export function serializeTask(task: TaskAssignment): string {
  return JSON.stringify(task, null, 2);
}

/**
 * Deserialize a JSON string to TaskAssignment
 * Validates the task after parsing
 */
export function deserializeTask(json: string): DeserializeResult {
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
  const contextObj = (obj['context'] as Record<string, unknown>) ?? {};
  const constraintsObj = (obj['constraints'] as Record<string, unknown>) ?? {};

  // Build task object with defaults for missing optional fields
  const task: TaskAssignment = {
    id: String(obj['id'] ?? ''),
    type: (obj['type'] as TaskType) ?? 'implement',
    target: String(obj['target'] ?? ''),
    description: String(obj['description'] ?? ''),
    context: {
      mbSnapshot: String(contextObj['mbSnapshot'] ?? ''),
      files: Array.isArray(contextObj['files'])
        ? (contextObj['files'] as string[])
        : [],
      dependencies: Array.isArray(contextObj['dependencies'])
        ? (contextObj['dependencies'] as string[])
        : [],
    },
    acceptance: Array.isArray(obj['acceptance']) ? (obj['acceptance'] as string[]) : [],
    constraints: {
      maxFiles: Number(constraintsObj['maxFiles'] ?? 0),
      testCommand: String(constraintsObj['testCommand'] ?? ''),
      ...(typeof constraintsObj['maxTokens'] === 'number' && {
        maxTokens: constraintsObj['maxTokens'] as number,
      }),
      ...(typeof constraintsObj['timeout'] === 'number' && {
        timeout: constraintsObj['timeout'] as number,
      }),
    },
  };

  // Validate
  const validation = validateTaskAssignment(task);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  // Return frozen task
  return {
    success: true,
    task: createTaskAssignment(task),
  };
}
