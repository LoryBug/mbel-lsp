/**
 * @mbel/analyzer - MBEL v5 Semantic Analyzer
 *
 * This package provides semantic analysis and diagnostics
 * for MBEL v5 documents.
 */

// Analyzer
export { MbelAnalyzer } from './analyzer.js';

// Query Engine (TDDAB#15)
export { QueryEngine } from './query-engine/index.js';
export type {
  DependencyGraph,
  DependencyNode,
  AnchorResult,
  DecisionResult,
  IntentResult,
  HeatInfo,
  RiskAssessment,
  ImpactResult,
  SemanticSearchResult,
  WorkContext,
} from './query-engine/types.js';

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
