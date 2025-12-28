/**
 * mbel impact - Risk analysis command
 *
 * Analyzes the impact of modifying a file based on Memory Bank data.
 * Provides risk assessment, affected features, and required tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import { QueryService } from '@mbel/lsp';
import type { CliResult, OutputFormat } from '../types.js';

/**
 * Impact command options
 */
export interface ImpactOptions {
  json: boolean;
  quiet?: boolean;
}

/**
 * Result of mbel impact command
 */
export interface ImpactResult {
  file: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedFeatures: string[];
  dependentFeatures: string[];
  transitiveImpact: string[];
  requiredTests: string[];
  isHotspot: boolean;
  suggestion: string;
}

/**
 * Execute the impact command
 *
 * @param filePath - Path to file to analyze
 * @param mbPath - Path to Memory Bank directory
 * @param options - Command options
 * @returns CliResult with impact analysis
 */
export async function impactCommand(
  filePath: string,
  mbPath: string,
  options: ImpactOptions
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

  // Find and read Memory Bank files
  const mbContent = readMemoryBank(mbPath);
  if (!mbContent) {
    const error = `Memory Bank not found at: ${mbPath}`;
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

  // Use QueryService to analyze impact
  const queryService = new QueryService();
  const impact = queryService.analyzeImpact(mbContent, filePath);

  // Build result
  const result: ImpactResult = impact ? {
    file: filePath,
    riskLevel: impact.riskLevel,
    affectedFeatures: [...impact.affectedFeatures],
    dependentFeatures: [...impact.dependentFeatures],
    transitiveImpact: [...impact.transitiveImpact],
    requiredTests: [...impact.affectedTests],
    isHotspot: impact.isHotspot,
    suggestion: impact.suggestions.length > 0
      ? impact.suggestions.join('. ')
      : generateSuggestion(impact.riskLevel, impact.isHotspot)
  } : {
    file: filePath,
    riskLevel: 'low',
    affectedFeatures: [],
    dependentFeatures: [],
    transitiveImpact: [],
    requiredTests: [],
    isHotspot: false,
    suggestion: 'File not tracked in Memory Bank. Low risk modification.'
  };

  // Format output
  if (format === 'json') {
    return {
      success: true,
      output: JSON.stringify(result, null, 2),
      format,
      exitCode: 0
    };
  }

  // Text format
  const output = formatTextOutput(result);

  return {
    success: true,
    output,
    format,
    exitCode: 0
  };
}

/**
 * Read and combine Memory Bank files
 */
function readMemoryBank(mbPath: string): string | null {
  if (!fs.existsSync(mbPath)) {
    return null;
  }

  const files = [
    'systemPatterns.mbel.md',
    'activeContext.mbel.md',
    'progress.mbel.md',
    'techContext.mbel.md',
    'productContext.mbel.md'
  ];

  let content = '';
  let found = false;

  for (const file of files) {
    const fullPath = path.join(mbPath, file);
    if (fs.existsSync(fullPath)) {
      content += fs.readFileSync(fullPath, 'utf-8') + '\n';
      found = true;
    }
  }

  return found ? content : null;
}

/**
 * Generate suggestion based on risk level
 */
function generateSuggestion(
  riskLevel: 'low' | 'medium' | 'high',
  isHotspot: boolean
): string {
  if (isHotspot) {
    return 'Critical hotspot modified. Run full regression suite and review carefully.';
  }

  switch (riskLevel) {
    case 'high':
      return 'High-impact file. Run all affected tests and dependent feature tests.';
    case 'medium':
      return 'Moderate impact. Run affected feature tests before committing.';
    case 'low':
      return 'Low risk change. Standard testing recommended.';
  }
}

/**
 * Format result as human-readable text
 */
function formatTextOutput(result: ImpactResult): string {
  const lines: string[] = [];

  lines.push(`Impact Analysis: ${result.file}`);
  lines.push(`Risk Level: ${result.riskLevel.toUpperCase()}${result.isHotspot ? ' (HOTSPOT)' : ''}`);
  lines.push('');

  if (result.affectedFeatures.length > 0) {
    lines.push('Affected Features:');
    for (const feature of result.affectedFeatures) {
      lines.push(`  - ${feature}`);
    }
    lines.push('');
  }

  if (result.dependentFeatures.length > 0) {
    lines.push('Dependent Features:');
    for (const feature of result.dependentFeatures) {
      lines.push(`  - ${feature}`);
    }
    lines.push('');
  }

  if (result.transitiveImpact.length > 0) {
    lines.push('Transitive Impact:');
    for (const feature of result.transitiveImpact) {
      lines.push(`  - ${feature}`);
    }
    lines.push('');
  }

  if (result.requiredTests.length > 0) {
    lines.push('Required Tests:');
    for (const test of result.requiredTests) {
      lines.push(`  - ${test}`);
    }
    lines.push('');
  }

  lines.push(`Suggestion: ${result.suggestion}`);

  return lines.join('\n').trim();
}
