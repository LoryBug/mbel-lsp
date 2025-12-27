/**
 * TDDAB#15: QueryEngine Types
 *
 * Type definitions for the semantic query engine.
 */

/**
 * Dependency graph node
 */
export interface DependencyNode {
  readonly name: string;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly files: readonly string[];
  readonly tests: readonly string[];
}

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  readonly nodeCount: number;
  readonly nodes: ReadonlyMap<string, DependencyNode>;
}

/**
 * Anchor search result
 */
export interface AnchorResult {
  readonly path: string;
  readonly anchorType: 'entry' | 'hotspot' | 'boundary' | 'test' | 'docs';
  readonly description: string | null;
  readonly isGlob: boolean;
}

/**
 * Decision search result
 */
export interface DecisionResult {
  readonly name: string;
  readonly date: string;
  readonly status: string | null;
  readonly reason: string | null;
  readonly context: readonly string[];
}

/**
 * Intent search result
 */
export interface IntentResult {
  readonly module: string;
  readonly component: string;
  readonly does: string | null;
  readonly doesNot: string | null;
  readonly contract: string | null;
  readonly singleResponsibility: string | null;
  readonly antiPattern: string | null;
  readonly extends: readonly string[] | null;
}

/**
 * Heat information
 */
export interface HeatInfo {
  readonly path: string;
  readonly type: 'critical' | 'stable' | 'volatile' | 'hot';
  readonly changes: number | null;
  readonly coverage: string | null;
  readonly confidence: string | null;
  readonly caution: string | null;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  readonly level: 'low' | 'medium' | 'high' | 'unknown';
  readonly reasons: readonly string[];
  readonly recommendations: readonly string[];
}

/**
 * Impact analysis result
 */
export interface ImpactResult {
  readonly affectedFiles: readonly string[];
  readonly affectedTests: readonly string[];
  readonly affectedFeatures: readonly string[];
  readonly transitiveImpact: readonly string[];
}

/**
 * Semantic search result
 */
export interface SemanticSearchResult {
  readonly anchors: readonly AnchorResult[];
  readonly decisions: readonly DecisionResult[];
  readonly intents: readonly IntentResult[];
  readonly links: readonly string[];
}

/**
 * Work context for a feature
 */
export interface WorkContext {
  readonly feature: string | null;
  readonly files: readonly string[];
  readonly tests: readonly string[];
  readonly blueprint: readonly string[] | null;
  readonly decisions: readonly DecisionResult[];
  readonly anchors: readonly AnchorResult[];
  readonly heatInfo: readonly HeatInfo[];
  readonly intents: readonly IntentResult[];
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly overallRisk: 'low' | 'medium' | 'high';
}
