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
    }));
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
}
