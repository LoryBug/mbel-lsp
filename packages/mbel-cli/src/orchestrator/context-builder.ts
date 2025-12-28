/**
 * TDDAB#30: Context Builder for Orchestrator
 *
 * Utilities to build and compress context for subagents
 */

/**
 * Task context extracted from Memory Bank
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
 * Context extraction mode
 */
export type ContextMode = 'minimal' | 'full';

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
 * Extracts file list from feature definition
 * Pattern: ->files[file1, file2]
 */
function extractFiles(featureLine: string): string[] {
  const filesMatch = featureLine.match(/->files\[([^\]]*)\]/);
  if (!filesMatch || !filesMatch[1]) {
    return [];
  }

  return filesMatch[1]
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

/**
 * Extracts dependency list from feature definition
 * Pattern: ->deps[dep1, dep2]
 */
function extractDependencies(featureLine: string): string[] {
  const depsMatch = featureLine.match(/->deps\[([^\]]*)\]/);
  if (!depsMatch || !depsMatch[1]) {
    return [];
  }

  return depsMatch[1]
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

/**
 * Finds the feature line in MB content
 * Pattern: @feature{FeatureName}
 */
function findFeatureLine(mbContent: string, feature: string): string | null {
  const lines = mbContent.split('\n');
  const featurePattern = new RegExp(`@feature\\{${feature}\\}`);

  for (const line of lines) {
    if (featurePattern.test(line)) {
      return line;
    }
  }

  return null;
}

/**
 * Builds task context by extracting relevant information from Memory Bank
 * for a specific feature.
 *
 * @param mbContent - Full Memory Bank content
 * @param feature - Feature name to extract context for
 * @param mode - 'minimal' (only files) or 'full' (files + deps + tests)
 * @returns TaskContext with extracted information
 */
export function buildTaskContext(
  mbContent: string,
  feature: string,
  mode: ContextMode
): TaskContext {
  const featureLine = findFeatureLine(mbContent, feature);

  // Feature not found - return empty context
  if (!featureLine) {
    return deepFreeze({
      mbSnapshot: '',
      files: [],
      dependencies: [],
    });
  }

  const files = extractFiles(featureLine);

  // In minimal mode, only extract files
  if (mode === 'minimal') {
    return deepFreeze({
      mbSnapshot: featureLine,
      files,
      dependencies: [],
    });
  }

  // In full mode, extract files + dependencies
  const dependencies = extractDependencies(featureLine);

  return deepFreeze({
    mbSnapshot: featureLine,
    files,
    dependencies,
  });
}

/**
 * Compresses context to reduce token usage.
 * Removes extra whitespace while preserving MBEL structure.
 *
 * @param context - TaskContext to compress
 * @returns Compressed string representation
 */
export function compressContext(context: TaskContext): string {
  let compressed = context.mbSnapshot;

  // Remove trailing whitespace from each line
  compressed = compressed
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  // Replace multiple consecutive newlines with double newline
  compressed = compressed.replace(/\n{3,}/g, '\n\n');

  // Replace multiple consecutive spaces with single space
  compressed = compressed.replace(/ {2,}/g, ' ');

  // Trim overall string
  compressed = compressed.trim();

  return compressed;
}
