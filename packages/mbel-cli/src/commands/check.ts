/**
 * mbel check - Pre-commit validation command
 *
 * Validates MBEL files and returns structured diagnostics.
 * Designed for agent consumption with JSON output.
 */

import * as fs from 'fs';
import { MbelAnalyzer } from '@mbel/analyzer';
import type { CliResult, OutputFormat, SuggestedFix } from '../types.js';

/**
 * Check command options
 */
export interface CheckOptions {
  json: boolean;
  quiet?: boolean;
}

/**
 * Individual error in check result
 */
export interface CheckError {
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'error';
  suggestedFix?: SuggestedFix;
}

/**
 * Individual warning in check result
 */
export interface CheckWarning {
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'warning';
}

/**
 * Result of mbel check command
 */
export interface CheckResult {
  valid: boolean;
  file: string;
  errors: CheckError[];
  warnings: CheckWarning[];
}

/**
 * Execute the check command
 *
 * @param filePath - Path to MBEL file to validate
 * @param options - Command options
 * @returns CliResult with validation results
 */
export async function checkCommand(
  filePath: string,
  options: CheckOptions
): Promise<CliResult> {
  const format: OutputFormat = options.json ? 'json' : 'text';

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    const error = `File not found: ${filePath}`;
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

  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');

  // Analyze with MbelAnalyzer
  const analyzer = new MbelAnalyzer({
    grammarChecks: true,
    semanticChecks: true,
    hints: true
  });

  const analysisResult = analyzer.analyzeText(content);

  // Separate errors and warnings
  const errors: CheckError[] = [];
  const warnings: CheckWarning[] = [];

  for (const diagnostic of analysisResult.diagnostics) {
    const base = {
      line: diagnostic.range.start.line,
      column: diagnostic.range.start.column,
      code: diagnostic.code ?? 'UNKNOWN',
      message: diagnostic.message,
    };

    if (diagnostic.severity === 'error') {
      const error: CheckError = {
        ...base,
        severity: 'error',
      };

      // Check for suggested fix from quick fixes
      const quickFix = analysisResult.quickFixes.find(
        qf => qf.diagnostic === diagnostic
      );
      if (quickFix && quickFix.edits.length > 0) {
        const edit = quickFix.edits[0];
        if (edit) {
          error.suggestedFix = {
            find: content.substring(
              lineColToOffset(content, edit.range.start.line, edit.range.start.column),
              lineColToOffset(content, edit.range.end.line, edit.range.end.column)
            ),
            replace: edit.newText
          };
        }
      }

      errors.push(error);
    } else if (diagnostic.severity === 'warning') {
      warnings.push({
        ...base,
        severity: 'warning',
      });
    }
  }

  const checkResult: CheckResult = {
    valid: errors.length === 0,
    file: filePath,
    errors,
    warnings
  };

  // Format output
  if (format === 'json') {
    return {
      success: true,
      output: JSON.stringify(checkResult, null, 2),
      format,
      exitCode: errors.length > 0 ? 1 : 0
    };
  }

  // Text format
  let output: string;
  if (checkResult.valid) {
    output = `${filePath}: valid (${warnings.length} warnings)`;
  } else {
    output = `${filePath}: invalid (${errors.length} errors, ${warnings.length} warnings)\n`;
    for (const err of errors) {
      output += `  ${err.line}:${err.column} error ${err.code}: ${err.message}\n`;
    }
    for (const warn of warnings) {
      output += `  ${warn.line}:${warn.column} warning ${warn.code}: ${warn.message}\n`;
    }
  }

  return {
    success: true,
    output: output.trim(),
    format,
    exitCode: errors.length > 0 ? 1 : 0
  };
}

/**
 * Convert line/column to string offset
 */
function lineColToOffset(content: string, line: number, col: number): number {
  const lines = content.split('\n');
  let offset = 0;
  // line is 1-based, convert to 0-based
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    const currentLine = lines[i];
    if (currentLine !== undefined) {
      offset += currentLine.length + 1; // +1 for newline
    }
  }
  return offset + col - 1; // col is 1-based, convert to 0-based
}
