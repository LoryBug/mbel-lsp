/**
 * @mbel/analyzer - MBEL v5 Semantic Analyzer
 *
 * This package provides semantic analysis and diagnostics
 * for MBEL v5 documents.
 */

// Analyzer
export { MbelAnalyzer } from './analyzer.js';

// Types
export type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticSeverity,
  Range,
  RelatedInformation,
  QuickFix,
  TextEdit,
  AnalysisResult,
  AnalyzerOptions,
} from './types.js';
