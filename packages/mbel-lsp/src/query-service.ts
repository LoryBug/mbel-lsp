/**
 * TDDAB#17: Query Service for LLM Navigation
 *
 * Provides query methods to navigate MBEL documents programmatically:
 * - getFeatureFiles: Forward lookup (feature → files)
 * - getFileFeatures: Reverse lookup (file → features)
 * - getEntryPoints: All entry points
 * - getAnchors: All semantic anchors
 */
import { MbelParser } from '@mbel/core';
import type { LinkDeclaration, AnchorDeclaration, Document } from '@mbel/core';
import type {
  FeatureFiles,
  FileFeatureInfo,
  EntryPointInfo,
  AnchorInfo,
  ImpactAnalysis,
  OrphanFilesResult,
  OrphanFilesOptions,
} from './types.js';

/**
 * Query service for navigating MBEL documents
 */
export class QueryService {
  private readonly parser: MbelParser;

  constructor() {
    this.parser = new MbelParser();
  }

  /**
   * Forward lookup: Get files associated with a feature/task
   * @param content - MBEL document content
   * @param featureName - Name of the feature or task
   * @returns FeatureFiles or null if not found
   */
  getFeatureFiles(content: string, featureName: string): FeatureFiles | null {
    const document = this.parseDocument(content);
    if (!document) return null;

    const links = this.getLinks(document);
    const link = links.find(l => l.name === featureName);

    if (!link) return null;

    return {
      name: link.name,
      type: link.linkType,
      files: link.files?.map(f => this.formatFilePath(f.path, f.marker)) ?? [],
      tests: link.tests?.map(f => f.path) ?? [],
      docs: link.docs?.map(f => f.path) ?? [],
      entryPoint: link.entryPoint
        ? {
            file: link.entryPoint.file,
            symbol: link.entryPoint.symbol,
            line: link.entryPoint.line,
          }
        : null,
      depends: link.depends ?? [],
      related: link.related ?? [],
    };
  }

  /**
   * Reverse lookup: Get features that contain a specific file
   * @param content - MBEL document content
   * @param filePath - File path to search for
   * @returns Array of features containing the file
   */
  getFileFeatures(content: string, filePath: string): FileFeatureInfo[] {
    const document = this.parseDocument(content);
    if (!document) return [];

    const links = this.getLinks(document);
    const result: FileFeatureInfo[] = [];

    for (const link of links) {
      // Check files
      if (this.pathMatches(link.files?.map(f => f.path) ?? [], filePath)) {
        result.push({
          name: link.name,
          type: link.linkType,
          relation: 'file',
        });
        continue; // Don't add same feature twice
      }

      // Check tests
      if (this.pathMatches(link.tests?.map(f => f.path) ?? [], filePath)) {
        result.push({
          name: link.name,
          type: link.linkType,
          relation: 'test',
        });
        continue;
      }

      // Check docs
      if (this.pathMatches(link.docs?.map(f => f.path) ?? [], filePath)) {
        result.push({
          name: link.name,
          type: link.linkType,
          relation: 'doc',
        });
      }
    }

    return result;
  }

  /**
   * Get all entry points from the document
   * @param content - MBEL document content
   * @returns Map of feature name to entry point
   */
  getEntryPoints(content: string): Map<string, EntryPointInfo> {
    const document = this.parseDocument(content);
    if (!document) return new Map();

    const links = this.getLinks(document);
    const result = new Map<string, EntryPointInfo>();

    for (const link of links) {
      if (link.entryPoint) {
        result.set(link.name, {
          file: link.entryPoint.file,
          symbol: link.entryPoint.symbol,
          line: link.entryPoint.line,
        });
      }
    }

    return result;
  }

  /**
   * Get all semantic anchors from the document
   * @param content - MBEL document content
   * @returns Array of anchor information
   */
  getAnchors(content: string): AnchorInfo[] {
    const document = this.parseDocument(content);
    if (!document) return [];

    const anchors = this.getAnchorDeclarations(document);

    return anchors.map(anchor => ({
      path: anchor.path,
      type: anchor.anchorType,
      description: anchor.description,
      isGlob: anchor.isGlob,
    }));
  }

  /**
   * Get anchors filtered by type
   * @param content - MBEL document content
   * @param type - Anchor type to filter by
   * @returns Array of anchors matching the type
   */
  getAnchorsByType(
    content: string,
    type: 'entry' | 'hotspot' | 'boundary'
  ): AnchorInfo[] {
    const anchors = this.getAnchors(content);
    return anchors.filter(a => a.type === type);
  }

  /**
   * Get all features and tasks from the document
   * @param content - MBEL document content
   * @returns Array of feature/task info
   */
  getAllFeatures(content: string): FeatureFiles[] {
    const document = this.parseDocument(content);
    if (!document) return [];

    const links = this.getLinks(document);

    return links.map(link => ({
      name: link.name,
      type: link.linkType,
      files: link.files?.map(f => this.formatFilePath(f.path, f.marker)) ?? [],
      tests: link.tests?.map(f => f.path) ?? [],
      docs: link.docs?.map(f => f.path) ?? [],
      entryPoint: link.entryPoint
        ? {
            file: link.entryPoint.file,
            symbol: link.entryPoint.symbol,
            line: link.entryPoint.line,
          }
        : null,
      depends: link.depends ?? [],
      related: link.related ?? [],
    }));
  }

  // =========================================
  // TDDAB#18: QueryAPI-Anchors Extension
  // =========================================

  /**
   * Analyze the impact of modifying a file
   * @param content - MBEL document content
   * @param filePath - File path to analyze
   * @returns Impact analysis or null if file not found
   */
  analyzeImpact(content: string, filePath: string): ImpactAnalysis | null {
    const document = this.parseDocument(content);
    if (!document) return null;

    const links = this.getLinks(document);
    const anchors = this.getAnchorDeclarations(document);

    // Find features containing this file
    const affectedFeatures = this.findAffectedFeatures(links, filePath);
    if (affectedFeatures.length === 0) return null;

    // Find dependent features (features that depend on affected features)
    const dependentFeatures = this.findDependentFeatures(
      links,
      affectedFeatures
    );

    // Find transitive impact (features depending on dependents)
    const transitiveImpact = this.findTransitiveImpact(
      links,
      dependentFeatures,
      new Set([...affectedFeatures, ...dependentFeatures])
    );

    // Collect affected tests
    const affectedTests = this.collectAffectedTests(links, affectedFeatures);

    // Check if file is an anchor
    const anchor = this.findAnchorForFile(anchors, filePath);
    const isHotspot = anchor?.anchorType === 'hotspot';

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      isHotspot,
      dependentFeatures.length,
      transitiveImpact.length
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      affectedTests,
      isHotspot,
      riskLevel,
      dependentFeatures
    );

    return {
      filePath,
      affectedFeatures,
      dependentFeatures,
      transitiveImpact,
      affectedTests,
      isHotspot,
      anchorInfo: anchor
        ? {
            path: anchor.path,
            type: anchor.anchorType,
            description: anchor.description,
            isGlob: anchor.isGlob,
          }
        : null,
      riskLevel,
      suggestions,
    };
  }

  /**
   * Find orphan files not referenced in any feature or anchor
   * @param content - MBEL document content
   * @param projectFiles - List of all project files
   * @param options - Optional configuration
   * @returns Orphan files result with statistics
   */
  getOrphanFiles(
    content: string,
    projectFiles: string[],
    options?: OrphanFilesOptions
  ): OrphanFilesResult {
    if (projectFiles.length === 0) {
      return {
        orphans: [],
        byDirectory: {},
        stats: {
          totalFiles: 0,
          referencedFiles: 0,
          orphanCount: 0,
          coveragePercent: 100,
        },
      };
    }

    const document = this.parseDocument(content);

    // Collect all referenced files
    const referencedFiles = new Set<string>();

    if (document) {
      const links = this.getLinks(document);
      const anchors = this.getAnchorDeclarations(document);

      // Add files from features
      for (const link of links) {
        for (const file of link.files ?? []) {
          referencedFiles.add(this.normalizePath(file.path));
        }
        for (const test of link.tests ?? []) {
          referencedFiles.add(this.normalizePath(test.path));
        }
        for (const doc of link.docs ?? []) {
          referencedFiles.add(this.normalizePath(doc.path));
        }
      }

      // Add anchored files
      for (const anchor of anchors) {
        if (!anchor.isGlob) {
          referencedFiles.add(this.normalizePath(anchor.path));
        }
      }
    }

    // Default exclude patterns for config files
    const defaultExcludes = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tsconfig.*.json',
      '.eslintrc.*',
      'eslint.config.*',
      'vitest.config.*',
      'jest.config.*',
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      '.gitignore',
      '.npmrc',
    ];

    const excludePatterns = [
      ...defaultExcludes,
      ...(options?.excludePatterns ?? []),
    ];

    // Filter orphans
    const orphans: string[] = [];
    const byDirectory: Record<string, string[]> = {};

    for (const file of projectFiles) {
      const normalizedFile = this.normalizePath(file);

      // Check if file matches any exclude pattern
      if (this.matchesExcludePattern(file, excludePatterns)) {
        continue;
      }

      // Check if file is referenced
      if (this.isFileReferenced(normalizedFile, referencedFiles)) {
        continue;
      }

      // File is orphan
      orphans.push(file);

      // Group by directory
      const dir = this.getDirectory(file);
      if (!byDirectory[dir]) {
        byDirectory[dir] = [];
      }
      byDirectory[dir].push(file);
    }

    // Calculate stats (exclude config files from total)
    const nonConfigFiles = projectFiles.filter(
      f => !this.matchesExcludePattern(f, defaultExcludes)
    );
    const referencedCount = nonConfigFiles.length - orphans.length;

    return {
      orphans,
      byDirectory,
      stats: {
        totalFiles: nonConfigFiles.length,
        referencedFiles: referencedCount,
        orphanCount: orphans.length,
        coveragePercent:
          nonConfigFiles.length > 0
            ? Math.round((referencedCount / nonConfigFiles.length) * 100)
            : 100,
      },
    };
  }

  // =========================================
  // Private Helper Methods
  // =========================================

  /**
   * Parse document content safely
   */
  private parseDocument(content: string): Document | null {
    if (!content || content.trim() === '') return null;

    try {
      const result = this.parser.parse(content);
      return result.document;
    } catch {
      return null;
    }
  }

  /**
   * Extract LinkDeclaration nodes from document
   */
  private getLinks(document: Document): LinkDeclaration[] {
    return document.statements.filter(
      (stmt): stmt is LinkDeclaration => stmt.type === 'LinkDeclaration'
    );
  }

  /**
   * Extract AnchorDeclaration nodes from document
   */
  private getAnchorDeclarations(document: Document): AnchorDeclaration[] {
    return document.statements.filter(
      (stmt): stmt is AnchorDeclaration => stmt.type === 'AnchorDeclaration'
    );
  }

  /**
   * Check if any path in the array matches the search path
   * Supports partial matching (e.g., "parser.ts" matches "src/parser.ts")
   */
  private pathMatches(paths: string[], searchPath: string): boolean {
    const normalizedSearch = this.normalizePath(searchPath);

    return paths.some(path => {
      const normalizedPath = this.normalizePath(path);
      // Exact match or ends with search path
      return (
        normalizedPath === normalizedSearch ||
        normalizedPath.endsWith('/' + normalizedSearch) ||
        normalizedPath.endsWith('\\' + normalizedSearch)
      );
    });
  }

  /**
   * Normalize path separators
   */
  private normalizePath(path: string): string {
    // Remove markers like {TO-MODIFY} from path for comparison
    return path.replace(/\{[^}]+\}/g, '').trim();
  }

  /**
   * Format file path with optional marker
   */
  private formatFilePath(path: string, marker: string | null): string {
    if (marker) {
      return `${path}{${marker}}`;
    }
    return path;
  }

  // =========================================
  // TDDAB#18 Private Helpers
  // =========================================

  /**
   * Find features containing a file (direct or partial match)
   */
  private findAffectedFeatures(
    links: LinkDeclaration[],
    filePath: string
  ): string[] {
    const affected: string[] = [];

    for (const link of links) {
      const allPaths = [
        ...(link.files?.map(f => f.path) ?? []),
        ...(link.tests?.map(f => f.path) ?? []),
        ...(link.docs?.map(f => f.path) ?? []),
      ];

      if (this.pathMatches(allPaths, filePath)) {
        affected.push(link.name);
      }
    }

    return affected;
  }

  /**
   * Find features that depend on the given features
   */
  private findDependentFeatures(
    links: LinkDeclaration[],
    featureNames: string[]
  ): string[] {
    const featureSet = new Set(featureNames);
    const dependents: string[] = [];

    for (const link of links) {
      if (featureSet.has(link.name)) continue;

      const deps = link.depends ?? [];
      if (deps.some(dep => featureSet.has(dep))) {
        dependents.push(link.name);
      }
    }

    return dependents;
  }

  /**
   * Find transitive dependencies (2nd level and beyond)
   */
  private findTransitiveImpact(
    links: LinkDeclaration[],
    directDependents: string[],
    alreadyProcessed: Set<string>
  ): string[] {
    const transitive: string[] = [];
    const dependentSet = new Set(directDependents);

    for (const link of links) {
      if (alreadyProcessed.has(link.name)) continue;

      const deps = link.depends ?? [];
      if (deps.some(dep => dependentSet.has(dep))) {
        transitive.push(link.name);
      }
    }

    return transitive;
  }

  /**
   * Collect tests from affected features
   */
  private collectAffectedTests(
    links: LinkDeclaration[],
    featureNames: string[]
  ): string[] {
    const featureSet = new Set(featureNames);
    const tests: string[] = [];

    for (const link of links) {
      if (featureSet.has(link.name)) {
        for (const test of link.tests ?? []) {
          if (!tests.includes(test.path)) {
            tests.push(test.path);
          }
        }
      }
    }

    return tests;
  }

  /**
   * Find anchor for a file path
   */
  private findAnchorForFile(
    anchors: AnchorDeclaration[],
    filePath: string
  ): AnchorDeclaration | null {
    const normalizedSearch = this.normalizePath(filePath);

    for (const anchor of anchors) {
      if (anchor.isGlob) continue;

      const normalizedAnchor = this.normalizePath(anchor.path);
      if (
        normalizedAnchor === normalizedSearch ||
        normalizedAnchor.endsWith('/' + normalizedSearch) ||
        normalizedAnchor.endsWith('\\' + normalizedSearch) ||
        normalizedSearch.endsWith('/' + normalizedAnchor) ||
        normalizedSearch.endsWith('\\' + normalizedAnchor)
      ) {
        return anchor;
      }
    }

    return null;
  }

  /**
   * Calculate risk level based on impact factors
   */
  private calculateRiskLevel(
    isHotspot: boolean,
    dependentCount: number,
    transitiveCount: number
  ): 'low' | 'medium' | 'high' {
    // High risk: hotspot or many dependents
    if (isHotspot || dependentCount >= 2 || transitiveCount >= 2) {
      return 'high';
    }

    // Medium risk: some dependents
    if (dependentCount >= 1 || transitiveCount >= 1) {
      return 'medium';
    }

    // Low risk: no dependents
    return 'low';
  }

  /**
   * Generate suggestions based on impact analysis
   */
  private generateSuggestions(
    affectedTests: string[],
    isHotspot: boolean,
    riskLevel: 'low' | 'medium' | 'high',
    dependentFeatures: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (affectedTests.length > 0) {
      suggestions.push(`Run affected tests: ${affectedTests.join(', ')}`);
    }

    if (isHotspot) {
      suggestions.push('This is a hotspot - review changes carefully');
    }

    if (riskLevel === 'high') {
      suggestions.push('High-impact change - consider thorough review');
    }

    if (dependentFeatures.length > 0) {
      suggestions.push(
        `Check dependent features: ${dependentFeatures.join(', ')}`
      );
    }

    return suggestions;
  }

  /**
   * Check if file matches any exclude pattern
   */
  private matchesExcludePattern(
    filePath: string,
    patterns: string[]
  ): boolean {
    const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? filePath;

    for (const pattern of patterns) {
      // Handle glob patterns
      if (pattern.includes('*')) {
        // Convert glob to regex
        const regexStr = pattern
          .replace(/\*\*/g, '{{GLOBSTAR}}')
          .replace(/\*/g, '[^/\\\\]*')
          .replace(/{{GLOBSTAR}}/g, '.*')
          .replace(/\./g, '\\.');
        const regex = new RegExp(regexStr);

        if (regex.test(filePath) || regex.test(fileName)) {
          return true;
        }
      } else {
        // Exact match on filename
        if (fileName === pattern) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if file is referenced (supports partial path matching)
   */
  private isFileReferenced(
    normalizedFile: string,
    referencedFiles: Set<string>
  ): boolean {
    // Direct match
    if (referencedFiles.has(normalizedFile)) {
      return true;
    }

    // Partial match (file is suffix of referenced path)
    for (const ref of referencedFiles) {
      if (
        ref.endsWith('/' + normalizedFile) ||
        ref.endsWith('\\' + normalizedFile) ||
        normalizedFile.endsWith('/' + ref) ||
        normalizedFile.endsWith('\\' + ref)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get directory from file path
   */
  private getDirectory(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    if (parts.length <= 1) {
      return './';
    }
    return parts.slice(0, -1).join('/') + '/';
  }
}
