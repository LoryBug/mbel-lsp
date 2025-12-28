/**
 * TDDAB#30: Delta Aggregator for Orchestrator
 *
 * Utilities to aggregate and validate deltas from subagents
 */

/**
 * Result of delta aggregation
 */
export interface AggregationResult {
  /** Whether aggregation succeeded without conflicts */
  readonly success: boolean;
  /** Merged delta content */
  readonly merged: string;
  /** List of conflicts detected */
  readonly conflicts: readonly string[];
}

/**
 * Result of delta validation
 */
export interface ValidationResult {
  /** Whether delta is valid */
  readonly valid: boolean;
  /** List of validation errors */
  readonly errors: readonly string[];
  /** List of validation warnings */
  readonly warnings: readonly string[];
}

/**
 * Section priority mapping for ordering
 * Lower number = higher priority
 */
const SECTION_PRIORITY: Record<string, number> = {
  'FOCUS': 1,
  'STATUS': 2,
  'PROGRESS': 3,
  'PENDING': 4,
};

/**
 * Default priority for sections not in the priority map
 */
const DEFAULT_PRIORITY = 100;

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
 * Extracts task IDs from delta content
 * Pattern: @task{TDDAB#XX}
 */
function extractTaskIds(content: string): Map<string, string> {
  const taskMap = new Map<string, string>();
  const taskPattern = /@task\{([^}]+)\}(::?\S+)?/g;
  let match: RegExpExecArray | null;

  while ((match = taskPattern.exec(content)) !== null) {
    const taskId = match[1];
    const fullMatch = match[0];
    if (taskId) {
      taskMap.set(taskId, fullMatch);
    }
  }

  return taskMap;
}

/**
 * Extracts section name from delta
 * Pattern: [SECTION_NAME]
 */
function extractSection(delta: string): string | null {
  const sectionMatch = delta.match(/\[([A-Z_]+)\]/);
  if (sectionMatch && sectionMatch[1]) {
    return sectionMatch[1];
  }
  return null;
}

/**
 * Gets section priority for ordering
 */
function getSectionPriority(delta: string): number {
  const section = extractSection(delta);
  if (!section) {
    return DEFAULT_PRIORITY;
  }
  return SECTION_PRIORITY[section] ?? DEFAULT_PRIORITY;
}

/**
 * Aggregates multiple deltas from parallel subagents.
 * Detects conflicts when same task ID appears with different values.
 *
 * @param deltas - Array of delta strings to aggregate
 * @returns AggregationResult with merged content or conflicts
 */
export function aggregateDeltas(deltas: readonly string[]): AggregationResult {
  // Handle empty array
  if (deltas.length === 0) {
    return deepFreeze({
      success: true,
      merged: '',
      conflicts: [],
    });
  }

  // Handle single delta
  if (deltas.length === 1) {
    return deepFreeze({
      success: true,
      merged: deltas[0] ?? '',
      conflicts: [],
    });
  }

  // Collect all task IDs and detect conflicts
  const allTasks = new Map<string, string[]>();
  const conflicts: string[] = [];

  for (const delta of deltas) {
    const tasks = extractTaskIds(delta);
    for (const [taskId, fullMatch] of tasks) {
      const existing = allTasks.get(taskId);
      if (existing) {
        existing.push(fullMatch);
      } else {
        allTasks.set(taskId, [fullMatch]);
      }
    }
  }

  // Check for conflicts (same task ID with different values)
  for (const [taskId, matches] of allTasks) {
    if (matches.length > 1) {
      const uniqueMatches = [...new Set(matches)];
      if (uniqueMatches.length > 1) {
        conflicts.push(`Conflict on task ${taskId}: ${uniqueMatches.join(' vs ')}`);
      }
    }
  }

  // If conflicts detected, return failure
  if (conflicts.length > 0) {
    return deepFreeze({
      success: false,
      merged: '',
      conflicts,
    });
  }

  // Merge deltas by section
  const orderedDeltas = orderDeltasBySection(deltas);
  const mergedParts: string[] = [];
  const seenSections = new Set<string>();

  for (const delta of orderedDeltas) {
    const section = extractSection(delta);
    const lines = delta.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      // Skip duplicate section headers
      if (section && line.includes(`[${section}]`)) {
        if (seenSections.has(section)) {
          continue;
        }
        seenSections.add(section);
      }
      mergedParts.push(line);
    }
  }

  return deepFreeze({
    success: true,
    merged: mergedParts.join('\n'),
    conflicts: [],
  });
}

/**
 * Validates that a delta does not create conflicts with existing MB content.
 * Checks for duplicate entries.
 *
 * @param mbContent - Existing Memory Bank content
 * @param delta - Delta to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateDelta(mbContent: string, delta: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract task IDs from both MB and delta
  const mbTasks = extractTaskIds(mbContent);
  const deltaTasks = extractTaskIds(delta);

  // Check for duplicates
  for (const [taskId, deltaMatch] of deltaTasks) {
    const mbMatch = mbTasks.get(taskId);
    if (mbMatch) {
      // Same task exists - check if it's exactly the same (duplicate)
      if (mbMatch === deltaMatch) {
        errors.push(`duplicate: task ${taskId} already exists in MB with same value`);
      } else {
        warnings.push(`task ${taskId} exists in MB with different value`);
      }
    }
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    warnings,
  });
}

/**
 * Orders deltas by section priority for correct merge order.
 * Priority: FOCUS > STATUS > PROGRESS > PENDING > others
 *
 * @param deltas - Array of delta strings
 * @returns Ordered array of deltas
 */
export function orderDeltasBySection(deltas: readonly string[]): string[] {
  // Create array of deltas with their priorities
  const deltasWithPriority = deltas.map(delta => ({
    delta,
    priority: getSectionPriority(delta),
  }));

  // Sort by priority (lower number = higher priority)
  deltasWithPriority.sort((a, b) => a.priority - b.priority);

  // Return just the deltas
  return deltasWithPriority.map(item => item.delta);
}
