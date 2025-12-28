/**
 * mbel simulate - Predictive architecture simulation for agents
 *
 * Simulates changes to the dependency graph without modifying files.
 * Provides impact analysis, circular dependency detection, and change preview.
 */

import * as fs from 'fs';
import { MbelParser } from '@mbel/core';
import { QueryService } from '@mbel/lsp';

/**
 * Simulation action types
 */
export type SimulateAction = 'add-dep' | 'remove-dep' | 'add-feature' | 'remove-feature';

/**
 * Impact level
 */
export type ImpactLevel = 'low' | 'medium' | 'high';

/**
 * Simulation command options
 */
export interface SimulateOptions {
  action: SimulateAction;
  from?: string;
  to?: string;
  feature?: string;
  dependsOn?: string[];
}

/**
 * Simulation details
 */
export interface SimulationDetails {
  dryRun: boolean;
  preview: string;
  newDependencies?: string[];
  affectedFeatures?: string[];
  breakingDependents?: string[];
  circular?: boolean;
  breaking?: boolean;
  impactLevel?: ImpactLevel;
  graphPosition?: string;
  suggestedTests?: string[];
}

/**
 * Result of mbel simulate command
 */
export interface SimulateResult {
  success: boolean;
  action: SimulateAction;
  error?: string;
  simulation?: SimulationDetails;
}

/**
 * Build a virtual dependency graph from features
 */
function buildDependencyGraph(features: Array<{ name: string; depends?: string[] }>): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const feature of features) {
    graph.set(feature.name, new Set(feature.depends ?? []));
  }

  return graph;
}

/**
 * Check for circular dependencies in graph
 */
function hasCircular(graph: Map<string, Set<string>>, from: string, to: string): boolean {
  // Check if adding from -> to would create a cycle
  // A cycle exists if 'to' can reach 'from' through existing edges
  const visited = new Set<string>();
  const stack = [to];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    if (current === from) {
      return true; // Found a path back to 'from'
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const deps = graph.get(current);
    if (deps) {
      for (const dep of deps) {
        stack.push(dep);
      }
    }
  }

  return false;
}

/**
 * Find all features that depend on a given feature (transitive)
 */
function findDependents(graph: Map<string, Set<string>>, feature: string): string[] {
  const dependents: string[] = [];

  for (const [name, deps] of graph) {
    if (deps.has(feature)) {
      dependents.push(name);
    }
  }

  return dependents;
}

/**
 * Find transitive dependencies of a feature
 */
function findTransitiveDeps(graph: Map<string, Set<string>>, feature: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const stack = Array.from(graph.get(feature) ?? []);

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    result.push(current);

    const deps = graph.get(current);
    if (deps) {
      for (const dep of deps) {
        stack.push(dep);
      }
    }
  }

  return result;
}

/**
 * Calculate impact level based on affected features
 */
function calculateImpactLevel(affectedCount: number, totalCount: number): ImpactLevel {
  const ratio = affectedCount / totalCount;
  if (ratio > 0.5) return 'high';
  if (ratio > 0.2) return 'medium';
  return 'low';
}

/**
 * Execute the simulate command
 *
 * @param mbPath - Path to Memory Bank file
 * @param options - Simulation options
 * @returns SimulateResult with simulation details
 */
export async function simulateCommand(
  mbPath: string,
  options: SimulateOptions
): Promise<SimulateResult> {
  const { action, from, to, feature, dependsOn } = options;

  // Check if MB file exists
  if (!fs.existsSync(mbPath)) {
    return {
      success: false,
      action,
      error: `Memory Bank file not found: ${mbPath}`,
    };
  }

  // Read and parse MB file
  const content = fs.readFileSync(mbPath, 'utf-8');
  // Parser not strictly needed here as QueryService handles it, but kept if validation needed later
  // const parser = new MbelParser();
  // const parseResult = parser.parse(content);

  // Create QueryService
  const queryService = new QueryService();
  const rawFeatures = queryService.getAllFeatures(content);

  // Convert FeatureFiles[] to the structure expected by simulate (mutable arrays)
  const allFeatures = rawFeatures.map(f => ({
    name: f.name,
    depends: f.depends ? [...f.depends] : []
  }));

  // Build virtual graph
  const graph = buildDependencyGraph(allFeatures);

  // Handle each action type
  switch (action) {
    case 'add-dep':
      if (!from || !to) {
        return { success: false, action, error: 'add-dep requires --from and --to' };
      }
      return simulateAddDep(graph, allFeatures, from, to);

    case 'remove-dep':
      if (!from || !to) {
        return { success: false, action, error: 'remove-dep requires --from and --to' };
      }
      return simulateRemoveDep(graph, allFeatures, from, to);

    case 'add-feature':
      if (!feature) {
        return { success: false, action, error: 'add-feature requires --feature' };
      }
      return simulateAddFeature(graph, allFeatures, feature, dependsOn ?? []);

    case 'remove-feature':
      if (!feature) {
        return { success: false, action, error: 'remove-feature requires --feature' };
      }
      return simulateRemoveFeature(graph, allFeatures, feature);

    default:
      return {
        success: false,
        action,
        error: `Unknown action: ${action}`,
      };
  }
}

/**
 * Simulate adding a dependency
 */
function simulateAddDep(
  graph: Map<string, Set<string>>,
  allFeatures: Array<{ name: string; depends?: string[] }>,
  from: string,
  to: string
): SimulateResult {
  // Validate features exist
  if (!graph.has(from)) {
    return {
      success: false,
      action: 'add-dep',
      error: `Feature not found: ${from}`,
    };
  }
  if (!graph.has(to)) {
    return {
      success: false,
      action: 'add-dep',
      error: `Feature not found: ${to}`,
    };
  }

  // Check for circular dependency
  const circular = hasCircular(graph, from, to);

  // Calculate new transitive dependencies
  const toTransitive = findTransitiveDeps(graph, to);
  const newDeps = [to, ...toTransitive];

  // Find affected features (dependents of 'from')
  const affected = findDependents(graph, from);

  // Calculate impact
  const impactLevel = calculateImpactLevel(affected.length + 1, allFeatures.length);

  return {
    success: true,
    action: 'add-dep',
    simulation: {
      dryRun: true,
      preview: `Adding dependency: ${from} -> ${to}`,
      newDependencies: newDeps,
      affectedFeatures: [from, ...affected],
      circular,
      impactLevel,
    },
  };
}

/**
 * Simulate removing a dependency
 */
function simulateRemoveDep(
  graph: Map<string, Set<string>>,
  allFeatures: Array<{ name: string; depends?: string[] }>,
  from: string,
  to: string
): SimulateResult {
  // Validate features exist
  if (!graph.has(from)) {
    return {
      success: false,
      action: 'remove-dep',
      error: `Feature not found: ${from}`,
    };
  }

  const fromDeps = graph.get(from) ?? new Set<string>();
  const breaking = fromDeps.has(to);

  // Find affected features
  const affected = findDependents(graph, from);

  return {
    success: true,
    action: 'remove-dep',
    simulation: {
      dryRun: true,
      preview: `Removing dependency: ${from} -> ${to}`,
      affectedFeatures: [from, ...affected],
      breaking,
    },
  };
}

/**
 * Simulate adding a new feature
 */
function simulateAddFeature(
  graph: Map<string, Set<string>>,
  allFeatures: Array<{ name: string; depends?: string[] }>,
  feature: string,
  dependsOn: string[]
): SimulateResult {
  // Check if feature already exists
  if (graph.has(feature)) {
    return {
      success: false,
      action: 'add-feature',
      error: `Feature already exists: ${feature}`,
    };
  }

  // Validate dependencies exist
  for (const dep of dependsOn) {
    if (!graph.has(dep)) {
      return {
        success: false,
        action: 'add-feature',
        error: `Dependency not found: ${dep}`,
      };
    }
  }

  // Calculate graph position
  let maxDepth = 0;
  for (const dep of dependsOn) {
    const transitive = findTransitiveDeps(graph, dep);
    maxDepth = Math.max(maxDepth, transitive.length + 1);
  }
  const graphPosition = `Layer ${maxDepth + 1} (depends on: ${dependsOn.join(', ') || 'none'})`;

  // Suggest tests based on dependencies
  const suggestedTests = dependsOn.map(dep => `${feature}-${dep}-integration.test.ts`);
  suggestedTests.unshift(`${feature.toLowerCase()}.test.ts`);

  return {
    success: true,
    action: 'add-feature',
    simulation: {
      dryRun: true,
      preview: `Adding feature: ${feature} with dependencies [${dependsOn.join(', ')}]`,
      graphPosition,
      suggestedTests,
    },
  };
}

/**
 * Simulate removing a feature
 */
function simulateRemoveFeature(
  graph: Map<string, Set<string>>,
  allFeatures: Array<{ name: string; depends?: string[] }>,
  feature: string
): SimulateResult {
  // Validate feature exists
  if (!graph.has(feature)) {
    return {
      success: false,
      action: 'remove-feature',
      error: `Feature not found: ${feature}`,
    };
  }

  // Find all dependents that would break
  const breakingDependents = findDependents(graph, feature);

  return {
    success: true,
    action: 'remove-feature',
    simulation: {
      dryRun: true,
      preview: `Removing feature: ${feature}`,
      breakingDependents,
      breaking: breakingDependents.length > 0,
    },
  };
}
