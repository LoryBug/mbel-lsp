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
  | 'PREFER_OPERATOR'         // Could use operator instead of text
  // MBEL v6 CrossRefLinks validation
  | 'MBEL-LINK-001'           // Link without name
  | 'MBEL-LINK-002'           // Link with invalid name characters
  | 'MBEL-LINK-003'           // Duplicate link names
  | 'MBEL-LINK-010'           // Invalid glob pattern syntax
  | 'MBEL-LINK-011'           // Invalid line range format
  | 'MBEL-LINK-012'           // Line range start > end
  | 'MBEL-LINK-020'           // Reference to undefined decision
  | 'MBEL-LINK-021'           // Reference to undefined feature in related
  | 'MBEL-LINK-022'           // Self-reference in related
  | 'MBEL-LINK-030'           // Circular dependency
  | 'MBEL-LINK-031'           // Reference to undefined dependency
  | 'MBEL-LINK-040'           // Empty blueprint
  | 'MBEL-LINK-041'           // Unquoted blueprint step
  | 'MBEL-LINK-050'           // Invalid entryPoint format
  | 'MBEL-LINK-051'           // Non-numeric line number in entryPoint
  | 'MBEL-LINK-060'           // Unknown file marker
  | 'MBEL-LINK-070'           // Orphan link (no files or tests)
  // MBEL v6 SemanticAnchors validation (TDDAB#10)
  | 'MBEL-ANCHOR-001'         // Empty anchor path
  | 'MBEL-ANCHOR-002'         // Invalid path characters (spaces)
  | 'MBEL-ANCHOR-003'         // Duplicate anchor for same path
  | 'MBEL-ANCHOR-010'         // Empty description
  | 'MBEL-ANCHOR-011';        // Invalid glob pattern (like ***)

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
