/**
 * mbel context - Token-optimized feature summary for agents
 *
 * Provides feature details in a compact, agent-friendly format.
 * Designed to minimize token usage while maximizing information value.
 */

import * as fs from 'fs';
import { MbelParser } from '@mbel/core';
import { QueryService } from '@mbel/lsp';

/**
 * Context output modes
 */
export type ContextMode = 'summary' | 'full' | 'compact';

/**
 * Context command options
 */
export interface ContextOptions {
  mode?: ContextMode;
  json?: boolean;
}

/**
 * Entry point information
 */
export interface EntryPoint {
  file: string;
  symbol: string;
}

/**
 * Result of mbel context command
 */
export interface ContextResult {
  success: boolean;
  feature: string;
  mode: ContextMode;
  error?: string;
  files?: string[];
  tests?: string[];
  entryPoint?: EntryPoint;
  dependencies?: string[];
  transitiveDependencies?: string[];
  dependencyDepth?: number;
}

/**
 * Execute the context command
 *
 * @param featureName - Name of the feature to get context for
 * @param mbPath - Path to Memory Bank file
 * @param options - Command options
 * @returns ContextResult with feature details
 */
export async function contextCommand(
  featureName: string,
  mbPath: string,
  options: ContextOptions
): Promise<ContextResult> {
  const mode: ContextMode = options.mode ?? 'summary';

  // Check if MB file exists
  if (!fs.existsSync(mbPath)) {
    return {
      success: false,
      feature: featureName,
      mode,
      error: `Memory Bank file not found: ${mbPath}`,
    };
  }

  // Read and parse MB file
  const content = fs.readFileSync(mbPath, 'utf-8');
  const parser = new MbelParser();
  const parseResult = parser.parse(content);

  // Create QueryService
  const queryService = new QueryService(parseResult.document);

  // Get feature info
  const featureInfo = queryService.getFeatureFiles(featureName);

  if (!featureInfo) {
    return {
      success: false,
      feature: featureName,
      mode,
      error: `Feature not found: ${featureName}`,
    };
  }

  // Build result based on mode
  const result: ContextResult = {
    success: true,
    feature: featureName,
    mode,
  };

  // Summary mode: basic feature info
  result.files = featureInfo.files;
  result.tests = featureInfo.tests ?? [];
  result.entryPoint = featureInfo.entryPoint;
  result.dependencies = featureInfo.depends ?? [];

  // Full mode: add transitive dependencies
  if (mode === 'full') {
    const deps = queryService.getFeatureDependencies(featureName);
    if (deps) {
      result.transitiveDependencies = deps.transitive;
      result.dependencyDepth = deps.depth;
    }
  }

  // Compact mode: minimal representation
  if (mode === 'compact') {
    // Remove optional fields if empty
    if (result.tests?.length === 0) {
      delete result.tests;
    }
    if (result.dependencies?.length === 0) {
      delete result.dependencies;
    }
    // Don't include transitive deps in compact mode
    delete result.transitiveDependencies;
    delete result.dependencyDepth;
  }

  return result;
}
