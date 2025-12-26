/**
 * MBEL v5 Diagnostic Types
 *
 * Based on LSP diagnostic conventions for error reporting.
 */

import type { Position } from '@mbel/core';

/**
 * Diagnostic severity levels (matching LSP spec)
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'information' | 'hint';

/**
 * Diagnostic codes for categorizing issues
 */
export type DiagnosticCode =
  // Lexer errors
  | 'UNKNOWN_CHARACTER'       // Invalid/unknown character
  | 'INVALID_NUMBER'          // Malformed number literal
  // Parser errors
  | 'UNCLOSED_BRACKET'        // Missing closing bracket
  | 'UNCLOSED_SECTION'        // Missing ] in section
  | 'UNCLOSED_METADATA'       // Missing } in metadata
  | 'UNCLOSED_NOTE'           // Missing ) in note
  | 'UNCLOSED_VARIANT'        // Missing > in variant
  | 'UNEXPECTED_TOKEN'        // Unexpected token
  | 'EXPECTED_IDENTIFIER'     // Expected identifier
  | 'EXPECTED_EXPRESSION'     // Expected expression
  // Grammar violations
  | 'ARTICLE_USAGE'           // Article used (a, an, the)
  | 'NON_CAMEL_CASE'          // Identifier not in CamelCase
  | 'LOWERCASE_SECTION'       // Section name should be uppercase
  // Semantic warnings
  | 'UNUSED_SECTION'          // Section declared but never referenced
  | 'DUPLICATE_SECTION'       // Section declared multiple times
  | 'DUPLICATE_ATTRIBUTE'     // Same attribute defined twice
  | 'MISSING_VERSION'         // No version statement in document
  // Hints
  | 'PREFER_OPERATOR';        // Could use operator instead of text

/**
 * Range in source document
 */
export interface Range {
  readonly start: Position;
  readonly end: Position;
}

/**
 * A diagnostic message with location and severity
 */
export interface Diagnostic {
  readonly range: Range;
  readonly severity: DiagnosticSeverity;
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly source: 'mbel';
  readonly relatedInfo?: readonly RelatedInformation[];
}

/**
 * Related information for a diagnostic
 */
export interface RelatedInformation {
  readonly location: Range;
  readonly message: string;
}

/**
 * A quick fix suggestion
 */
export interface QuickFix {
  readonly title: string;
  readonly diagnostic: Diagnostic;
  readonly edits: readonly TextEdit[];
  readonly isPreferred?: boolean;
}

/**
 * A text edit operation
 */
export interface TextEdit {
  readonly range: Range;
  readonly newText: string;
}

/**
 * Result of analyzing a document
 */
export interface AnalysisResult {
  readonly diagnostics: readonly Diagnostic[];
  readonly quickFixes: readonly QuickFix[];
}

/**
 * Analyzer configuration options
 */
export interface AnalyzerOptions {
  /** Check for grammar violations like article usage */
  readonly grammarChecks?: boolean;
  /** Check for semantic issues like unused sections */
  readonly semanticChecks?: boolean;
  /** Provide hints for improvements */
  readonly hints?: boolean;
}
