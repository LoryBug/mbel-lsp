/**
 * TDDAB#17: Query API Tests (RED Phase)
 *
 * Tests for the QueryService that enables LLM navigation:
 * - getFeatureFiles: Forward lookup (feature → files)
 * - getFileFeatures: Reverse lookup (file → features)
 * - getEntryPoints: All entry points
 * - getAnchors: All semantic anchors
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryService } from '../src/query-service.js';
import type { FeatureFiles, FileFeatureInfo, EntryPointInfo, AnchorInfo } from '../src/types.js';

describe('QueryService (TDDAB#17)', () => {
  let queryService: QueryService;

  beforeEach(() => {
    queryService = new QueryService();
  });

  describe('getFeatureFiles - Forward Lookup', () => {
    const linkContent = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}
  ->files[src/parser.ts, src/ast.ts]
  ->tests[tests/parser.test.ts]
  ->docs[docs/parser.md]
  ->entryPoint{parser.ts:MbelParser:45}

@feature{Lexer}
  ->files[src/lexer.ts]
  ->tests[tests/lexer.test.ts]

@task{RefactorAnalyzer}
  ->files[src/analyzer.ts{TO-MODIFY}]
  ->depends[Parser, Lexer]
`;

    it('should return files for existing feature', () => {
      const result = queryService.getFeatureFiles(linkContent, 'Parser');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Parser');
      expect(result!.type).toBe('feature');
      expect(result!.files).toContain('src/parser.ts');
      expect(result!.files).toContain('src/ast.ts');
      expect(result!.tests).toContain('tests/parser.test.ts');
      expect(result!.docs).toContain('docs/parser.md');
    });

    it('should return entry point information', () => {
      const result = queryService.getFeatureFiles(linkContent, 'Parser');

      expect(result!.entryPoint).not.toBeNull();
      expect(result!.entryPoint!.file).toBe('parser.ts');
      expect(result!.entryPoint!.symbol).toBe('MbelParser');
      expect(result!.entryPoint!.line).toBe(45);
    });

    it('should return null for non-existent feature', () => {
      const result = queryService.getFeatureFiles(linkContent, 'NonExistent');

      expect(result).toBeNull();
    });

    it('should find task by name', () => {
      const result = queryService.getFeatureFiles(linkContent, 'RefactorAnalyzer');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('task');
      expect(result!.files).toContain('src/analyzer.ts{TO-MODIFY}');
    });

    it('should handle feature without entry point', () => {
      const result = queryService.getFeatureFiles(linkContent, 'Lexer');

      expect(result).not.toBeNull();
      expect(result!.entryPoint).toBeNull();
    });
  });

  describe('getFileFeatures - Reverse Lookup', () => {
    const linkContent = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}->files[src/parser.ts, src/ast.ts]->tests[tests/parser.test.ts]
@feature{Analyzer}->files[src/analyzer.ts]->tests[tests/analyzer.test.ts]
@task{Refactor}->files[src/parser.ts, src/analyzer.ts]
`;

    it('should find all features containing a file', () => {
      const result = queryService.getFileFeatures(linkContent, 'src/parser.ts');

      expect(result.length).toBe(2);
      expect(result.map(r => r.name)).toContain('Parser');
      expect(result.map(r => r.name)).toContain('Refactor');
    });

    it('should indicate relation type (file/test/doc)', () => {
      const result = queryService.getFileFeatures(linkContent, 'tests/parser.test.ts');

      expect(result.length).toBe(1);
      const first = result[0];
      expect(first).toBeDefined();
      expect(first!.name).toBe('Parser');
      expect(first!.relation).toBe('test');
    });

    it('should return empty array for unknown file', () => {
      const result = queryService.getFileFeatures(linkContent, 'unknown/file.ts');

      expect(result).toEqual([]);
    });

    it('should match partial paths', () => {
      // If user queries "parser.ts", should match "src/parser.ts"
      const result = queryService.getFileFeatures(linkContent, 'parser.ts');

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getEntryPoints - All Entry Points', () => {
    const content = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}->files[src/parser.ts]->entryPoint{parser.ts:MbelParser:45}
@feature{Lexer}->files[src/lexer.ts]->entryPoint{lexer.ts:MbelLexer:10}
@feature{Analyzer}->files[src/analyzer.ts]
`;

    it('should return all entry points', () => {
      const result = queryService.getEntryPoints(content);

      expect(result.size).toBe(2);
      expect(result.has('Parser')).toBe(true);
      expect(result.has('Lexer')).toBe(true);
    });

    it('should not include features without entry points', () => {
      const result = queryService.getEntryPoints(content);

      expect(result.has('Analyzer')).toBe(false);
    });

    it('should return correct entry point details', () => {
      const result = queryService.getEntryPoints(content);

      const parserEntry = result.get('Parser');
      expect(parserEntry!.file).toBe('parser.ts');
      expect(parserEntry!.symbol).toBe('MbelParser');
      expect(parserEntry!.line).toBe(45);
    });
  });

  describe('getAnchors - Semantic Anchors', () => {
    const anchorContent = `
§MBEL:6.0

[ANCHORS]
§anchors
@entry::src/index.ts
  ->descrizione::Main application entry point
@hotspot::src/parser.ts
  ->descrizione::Frequently modified
@boundary::src/api/external.ts
`;

    it('should return all anchors', () => {
      const result = queryService.getAnchors(anchorContent);

      expect(result.length).toBe(3);
    });

    it('should include anchor type information', () => {
      const result = queryService.getAnchors(anchorContent);

      const entry = result.find(a => a.type === 'entry');
      const hotspot = result.find(a => a.type === 'hotspot');
      const boundary = result.find(a => a.type === 'boundary');

      expect(entry).toBeDefined();
      expect(hotspot).toBeDefined();
      expect(boundary).toBeDefined();
    });

    it('should include path and description', () => {
      const result = queryService.getAnchors(anchorContent);

      const entry = result.find(a => a.path === 'src/index.ts');
      expect(entry).toBeDefined();
      expect(entry!.description).toBe('Main application entry point');
    });

    it('should handle anchor without description', () => {
      const result = queryService.getAnchors(anchorContent);

      const boundary = result.find(a => a.path === 'src/api/external.ts');
      expect(boundary).toBeDefined();
      expect(boundary!.description).toBeNull();
    });
  });

  describe('getAnchorsByType - Filtered Anchors', () => {
    const anchorContent = `
§MBEL:6.0

[ANCHORS]
§anchors
@entry::src/index.ts
@entry::src/cli.ts
@hotspot::src/parser.ts
@boundary::src/api/external.ts
`;

    it('should filter anchors by type', () => {
      const entries = queryService.getAnchorsByType(anchorContent, 'entry');

      expect(entries.length).toBe(2);
      expect(entries.every(a => a.type === 'entry')).toBe(true);
    });

    it('should return empty array for type with no anchors', () => {
      const content = `@entry::src/index.ts`;
      const hotspots = queryService.getAnchorsByType(content, 'hotspot');

      expect(hotspots).toEqual([]);
    });
  });

  describe('getAllFeatures - List All Features', () => {
    const content = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}->files[src/parser.ts]
@feature{Lexer}->files[src/lexer.ts]
@task{Refactor}->files[src/analyzer.ts]
`;

    it('should return all features and tasks', () => {
      const result = queryService.getAllFeatures(content);

      expect(result.length).toBe(3);
      expect(result.map(f => f.name)).toContain('Parser');
      expect(result.map(f => f.name)).toContain('Lexer');
      expect(result.map(f => f.name)).toContain('Refactor');
    });

    it('should distinguish between features and tasks', () => {
      const result = queryService.getAllFeatures(content);

      const features = result.filter(f => f.type === 'feature');
      const tasks = result.filter(f => f.type === 'task');

      expect(features.length).toBe(2);
      expect(tasks.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      expect(queryService.getFeatureFiles('', 'Parser')).toBeNull();
      expect(queryService.getFileFeatures('', 'file.ts')).toEqual([]);
      expect(queryService.getAnchors('')).toEqual([]);
      expect(queryService.getEntryPoints('').size).toBe(0);
    });

    it('should handle content without links section', () => {
      const noLinks = `
§MBEL:6.0

[FOCUS]
@current::Something
`;
      expect(queryService.getFeatureFiles(noLinks, 'Parser')).toBeNull();
      expect(queryService.getAllFeatures(noLinks)).toEqual([]);
    });

    it('should handle malformed content gracefully', () => {
      const malformed = `@feature{Incomplete`;

      // Should not throw, just return empty/null
      expect(() => queryService.getFeatureFiles(malformed, 'Test')).not.toThrow();
    });
  });
});
