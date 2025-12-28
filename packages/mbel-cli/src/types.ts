/**
 * MBEL CLI Types
 * Agent-First Command Line Interface type definitions
 */

/**
 * Output format for CLI results
 */
export type OutputFormat = 'json' | 'text';

/**
 * Global CLI options available to all commands
 */
export interface CliOptions {
  /** Output results in JSON format (machine-readable) */
  json: boolean;
  /** Suppress non-essential output */
  quiet: boolean;
}

/**
 * Result returned by CLI operations
 * Designed for both human and LLM consumption
 */
export interface CliResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Output content (JSON string if format is 'json') */
  output: string;
  /** Output format used */
  format: OutputFormat;
  /** Error message if success is false */
  error?: string;
  /** Exit code (0 for success, non-zero for errors) */
  exitCode?: number;
}

/**
 * Validation result for mbel check command
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  file: string;
}

/**
 * Validation error with location and fix suggestion
 */
export interface ValidationError {
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'error';
  suggestedFix?: SuggestedFix;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'warning';
}

/**
 * Suggested fix for self-healing diagnostics
 */
export interface SuggestedFix {
  find: string;
  replace: string;
}

/**
 * Context summary for token optimization
 */
export interface ContextSummary {
  feature: string;
  exports: string[];
  signatures: string[];
  decisions: string[];
  dependencies: string[];
}
