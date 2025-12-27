/**
 * TDDAB#14: LLM API Types
 *
 * Request/Response types for the LLM-facing API.
 */

// =========================================
// Request Types
// =========================================

/**
 * Request to find an anchor
 */
export interface GetAnchorRequest {
  readonly path?: string;
  readonly type?: 'entry' | 'hotspot' | 'boundary' | 'test' | 'docs';
}

/**
 * Request for edit risk analysis
 */
export interface GetEditRiskRequest {
  readonly file: string;
}

/**
 * Request for impact analysis
 */
export interface GetImpactAnalysisRequest {
  readonly files: readonly string[];
}

/**
 * Request to find decisions
 */
export interface GetDecisionsRequest {
  readonly pattern?: string;
  readonly status?: 'ACTIVE' | 'SUPERSEDED' | 'RECONSIDERING';
  readonly contextFile?: string;
}

/**
 * Request to find an intent
 */
export interface GetIntentRequest {
  readonly module: string;
  readonly component: string;
}

// =========================================
// Response Types
// =========================================

/**
 * Anchor information response
 */
export interface AnchorResponse {
  readonly path: string;
  readonly type: 'entry' | 'hotspot' | 'boundary' | 'test' | 'docs';
  readonly description: string | null;
  readonly isGlob: boolean;
}

/**
 * Cross-reference response
 */
export interface CrossRefsResponse {
  readonly name: string;
  readonly type: 'feature' | 'task';
  readonly files: readonly string[];
  readonly tests: readonly string[];
  readonly docs: readonly string[];
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly related: readonly string[];
  readonly entryPoint: {
    readonly file: string;
    readonly symbol: string | null;
    readonly line: number | null;
  } | null;
}

/**
 * Edit risk response
 */
export interface EditRiskResponse {
  readonly level: 'low' | 'medium' | 'high' | 'unknown';
  readonly reasons: readonly string[];
  readonly recommendations: readonly string[];
  readonly affectedTests: readonly string[];
}

/**
 * Impact analysis response
 */
export interface ImpactAnalysisResponse {
  readonly affectedFeatures: readonly string[];
  readonly affectedTests: readonly string[];
  readonly affectedFiles: readonly string[];
  readonly transitiveImpact: readonly string[];
}

/**
 * Decision response
 */
export interface DecisionResponse {
  readonly name: string;
  readonly date: string;
  readonly status: string | null;
  readonly reason: string | null;
  readonly alternatives: readonly string[];
  readonly context: readonly string[];
}

/**
 * Intent response
 */
export interface IntentResponse {
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
export interface HeatInfoResponse {
  readonly path: string;
  readonly type: 'critical' | 'stable' | 'volatile' | 'hot';
  readonly changes: number | null;
  readonly coverage: string | null;
  readonly confidence: string | null;
  readonly caution: string | null;
}

/**
 * Work context response
 */
export interface WorkContextResponse {
  readonly feature: string | null;
  readonly files: readonly string[];
  readonly tests: readonly string[];
  readonly blueprint: readonly string[] | null;
  readonly decisions: readonly DecisionResponse[];
  readonly anchors: readonly AnchorResponse[];
  readonly heatInfo: readonly HeatInfoResponse[];
  readonly intents: readonly IntentResponse[];
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly overallRisk: 'low' | 'medium' | 'high';
}
