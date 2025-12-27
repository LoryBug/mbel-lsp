/**
 * MBEL v5 LSP Server Types
 */

import {
  TextDocumentSyncKind,
} from 'vscode-languageserver';

import type {
  InitializeResult,
  ServerCapabilities,
} from 'vscode-languageserver';

/**
 * Server configuration options
 */
export interface MbelServerOptions {
  /** Enable grammar checks (article usage, CamelCase) */
  readonly grammarChecks?: boolean;
  /** Enable semantic checks (unused sections, duplicates) */
  readonly semanticChecks?: boolean;
  /** Enable hints for improvements */
  readonly hints?: boolean;
}

/**
 * Document state tracked by the server
 */
export interface DocumentState {
  readonly uri: string;
  readonly version: number;
  readonly content: string;
}

/**
 * Semantic item for LLM queries
 */
export interface SemanticItem {
  readonly line: number;
  readonly text: string;
}

/**
 * Aggregated project status for LLM queries
 */
export interface ProjectStatus {
  readonly pending: number;
  readonly completed: number;
  readonly failed: number;
  readonly critical: number;
  readonly active: number;
  readonly recentChanges: number;
}

// =========================================
// MBEL v6 Query API Types (TDDAB#17)
// =========================================

/**
 * Entry point information for a feature
 */
export interface EntryPointInfo {
  readonly file: string;
  readonly symbol: string;
  readonly line: number | null;
}

/**
 * Files associated with a feature (forward lookup result)
 */
export interface FeatureFiles {
  readonly name: string;
  readonly type: 'feature' | 'task';
  readonly files: readonly string[];
  readonly tests: readonly string[];
  readonly docs: readonly string[];
  readonly entryPoint: EntryPointInfo | null;
  readonly depends: readonly string[];
  readonly related: readonly string[];
}

/**
 * Feature info for reverse lookup (file → features)
 */
export interface FileFeatureInfo {
  readonly name: string;
  readonly type: 'feature' | 'task';
  readonly relation: 'file' | 'test' | 'doc';
}

/**
 * Anchor information for navigation
 */
export interface AnchorInfo {
  readonly path: string;
  readonly type: 'entry' | 'hotspot' | 'boundary';
  readonly description: string | null;
  readonly isGlob: boolean;
}

/**
 * Query result wrapper for LLM-friendly output
 */
export interface QueryResult<T> {
  readonly success: boolean;
  readonly query: string;
  readonly result: T;
  readonly suggestion?: string;
}

// =========================================
// MBEL v6 QueryAPI-Anchors Types (TDDAB#18)
// =========================================

/**
 * Impact analysis result for a file modification
 */
export interface ImpactAnalysis {
  /** The file path being analyzed */
  readonly filePath: string;
  /** Features directly containing this file */
  readonly affectedFeatures: readonly string[];
  /** Features that depend on affected features */
  readonly dependentFeatures: readonly string[];
  /** Transitive impact (features depending on dependents) */
  readonly transitiveImpact: readonly string[];
  /** Test files that should be run */
  readonly affectedTests: readonly string[];
  /** Whether this file is marked as a hotspot */
  readonly isHotspot: boolean;
  /** Anchor information if file is anchored */
  readonly anchorInfo: AnchorInfo | null;
  /** Risk level for modifying this file */
  readonly riskLevel: 'low' | 'medium' | 'high';
  /** Suggested actions based on impact */
  readonly suggestions: readonly string[];
}

/**
 * Options for orphan file detection
 */
export interface OrphanFilesOptions {
  /** Glob patterns to exclude from orphan detection */
  readonly excludePatterns?: readonly string[];
}

/**
 * Statistics about file coverage
 */
export interface OrphanFilesStats {
  /** Total files analyzed */
  readonly totalFiles: number;
  /** Files referenced in features/anchors */
  readonly referencedFiles: number;
  /** Number of orphan files */
  readonly orphanCount: number;
  /** Coverage percentage (0-100) */
  readonly coveragePercent: number;
}

/**
 * Result of orphan file detection
 */
export interface OrphanFilesResult {
  /** List of orphan file paths */
  readonly orphans: readonly string[];
  /** Orphans grouped by directory */
  readonly byDirectory: Readonly<Record<string, readonly string[]>>;
  /** Coverage statistics */
  readonly stats: OrphanFilesStats;
}

// =========================================
// MBEL v6 QueryAPI-Dependencies Types (TDDAB#19)
// =========================================

/**
 * Feature dependency information
 */
export interface FeatureDependencies {
  /** Feature name */
  readonly name: string;
  /** Feature type */
  readonly type: 'feature' | 'task';
  /** Direct dependencies (features this one depends on) */
  readonly directDependencies: readonly string[];
  /** Transitive dependencies (indirect, through direct deps) */
  readonly transitiveDependencies: readonly string[];
  /** Features that depend on this one */
  readonly dependents: readonly string[];
  /** Related features */
  readonly related: readonly string[];
  /** Depth in dependency tree (0 = no deps) */
  readonly depth: number;
  /** Whether circular dependency detected */
  readonly hasCircularDependency: boolean;
  /** Path of circular dependency if detected */
  readonly circularPath: readonly string[];
}

/**
 * Task progress information for blueprints
 */
export interface TaskProgress {
  /** Task name */
  readonly name: string;
  /** Files marked TO-CREATE */
  readonly filesToCreate: readonly string[];
  /** Files marked TO-MODIFY */
  readonly filesToModify: readonly string[];
  /** Blueprint steps */
  readonly blueprintSteps: readonly string[];
  /** Task dependencies */
  readonly depends: readonly string[];
}

/**
 * Summary of blueprint progress across all tasks
 */
export interface BlueprintSummary {
  /** Total number of tasks */
  readonly totalTasks: number;
  /** Total files to create across all tasks */
  readonly totalFilesToCreate: number;
  /** Total files to modify across all tasks */
  readonly totalFilesToModify: number;
  /** Total blueprint steps */
  readonly totalSteps: number;
}

/**
 * Result of blueprint progress query
 */
export interface BlueprintProgress {
  /** All tasks with their progress */
  readonly tasks: readonly TaskProgress[];
  /** Overall summary */
  readonly summary: BlueprintSummary;
}

/**
 * Server capabilities for MBEL LSP
 */
export const MBEL_SERVER_CAPABILITIES: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  completionProvider: {
    resolveProvider: false,
    triggerCharacters: ['@', '>', '?', '≈', '§', '©', '[', '{', '(', '<'],
  },
  hoverProvider: true,
  documentSymbolProvider: true,
  definitionProvider: true,
  referencesProvider: true,
  workspaceSymbolProvider: true,
};

/**
 * Create initialize result with MBEL capabilities
 */
export function createInitializeResult(): InitializeResult {
  return {
    capabilities: MBEL_SERVER_CAPABILITIES,
    serverInfo: {
      name: 'mbel-lsp',
      version: '0.1.0',
    },
  };
}
