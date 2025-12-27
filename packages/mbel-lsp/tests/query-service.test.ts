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

  // ===========================================
  // TDDAB#18: QueryAPI-Anchors Extension
  // ===========================================

  describe('analyzeImpact - Impact Analysis (TDDAB#18)', () => {
    const impactContent = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}
  ->files[src/parser.ts, src/ast.ts]
  ->tests[tests/parser.test.ts]
  ->depends[Lexer]
  ->related[Analyzer]

@feature{Lexer}
  ->files[src/lexer.ts, src/tokens.ts]
  ->tests[tests/lexer.test.ts]

@feature{Analyzer}
  ->files[src/analyzer.ts]
  ->tests[tests/analyzer.test.ts]
  ->depends[Parser, Lexer]

@task{RefactorTypes}
  ->files[src/types.ts{TO-MODIFY}]
  ->depends[Parser, Analyzer]

[ANCHORS]
§anchors
@hotspot::src/parser.ts
  ->descrizione::Frequently modified, high complexity
@entry::src/index.ts
@boundary::src/api/external.ts
`;

    it('should return affected features for a file', () => {
      const result = queryService.analyzeImpact(impactContent, 'src/parser.ts');

      expect(result).not.toBeNull();
      expect(result!.filePath).toBe('src/parser.ts');
      expect(result!.affectedFeatures).toContain('Parser');
    });

    it('should find features that depend on affected features', () => {
      const result = queryService.analyzeImpact(impactContent, 'src/lexer.ts');

      expect(result!.dependentFeatures).toContain('Parser'); // Parser depends on Lexer
      expect(result!.dependentFeatures).toContain('Analyzer'); // Analyzer depends on Lexer
    });

    it('should list related tests', () => {
      const result = queryService.analyzeImpact(impactContent, 'src/parser.ts');

      expect(result!.affectedTests).toContain('tests/parser.test.ts');
    });

    it('should identify file as hotspot if anchored', () => {
      const result = queryService.analyzeImpact(impactContent, 'src/parser.ts');

      expect(result!.isHotspot).toBe(true);
      expect(result!.anchorInfo?.type).toBe('hotspot');
    });

    it('should calculate risk level based on impact', () => {
      // High risk: hotspot with many dependents
      const hotspotResult = queryService.analyzeImpact(impactContent, 'src/parser.ts');
      expect(hotspotResult!.riskLevel).toBe('high');

      // Low risk: use a content with a leaf feature (no dependents)
      const leafContent = `
§MBEL:6.0

[LINKS]
§links
@feature{Isolated}->files[src/isolated.ts]->tests[tests/isolated.test.ts]
`;
      const leafResult = queryService.analyzeImpact(leafContent, 'src/isolated.ts');
      expect(leafResult!.riskLevel).toBe('low');
    });

    it('should return null for file not in any feature', () => {
      const result = queryService.analyzeImpact(impactContent, 'unknown/file.ts');

      expect(result).toBeNull();
    });

    it('should include transitive dependencies', () => {
      // Modifying lexer.ts should affect Parser and Analyzer (direct dependents)
      // And also RefactorTypes (depends on Parser and Analyzer)
      const result = queryService.analyzeImpact(impactContent, 'src/lexer.ts');

      expect(result!.transitiveImpact).toContain('RefactorTypes');
    });

    it('should suggest related actions', () => {
      const result = queryService.analyzeImpact(impactContent, 'src/parser.ts');

      expect(result!.suggestions.length).toBeGreaterThan(0);
      // Should suggest running tests
      expect(result!.suggestions.some(s => s.includes('test'))).toBe(true);
    });
  });

  describe('getOrphanFiles - Find Unreferenced Files (TDDAB#18)', () => {
    const orphanContent = `
§MBEL:6.0

[LINKS]
§links
@feature{Parser}
  ->files[src/parser.ts, src/ast.ts]
  ->tests[tests/parser.test.ts]

@feature{Lexer}
  ->files[src/lexer.ts]
  ->tests[tests/lexer.test.ts]

[ANCHORS]
§anchors
@entry::src/index.ts
@hotspot::src/parser.ts
`;

    it('should identify files not referenced in any feature', () => {
      const projectFiles = [
        'src/parser.ts',
        'src/ast.ts',
        'src/lexer.ts',
        'src/orphan.ts',      // Not in any feature
        'src/utils/helper.ts', // Not in any feature
        'tests/parser.test.ts',
        'tests/lexer.test.ts',
      ];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      expect(result.orphans).toContain('src/orphan.ts');
      expect(result.orphans).toContain('src/utils/helper.ts');
    });

    it('should not include files that are in features', () => {
      const projectFiles = ['src/parser.ts', 'src/lexer.ts', 'src/orphan.ts'];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      expect(result.orphans).not.toContain('src/parser.ts');
      expect(result.orphans).not.toContain('src/lexer.ts');
    });

    it('should exclude anchored files from orphans', () => {
      const projectFiles = ['src/index.ts', 'src/orphan.ts'];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      // src/index.ts is an anchor, should not be orphan
      expect(result.orphans).not.toContain('src/index.ts');
      expect(result.orphans).toContain('src/orphan.ts');
    });

    it('should exclude common config files by default', () => {
      const projectFiles = [
        'src/orphan.ts',
        'package.json',
        'tsconfig.json',
        '.eslintrc.js',
        'vitest.config.ts',
        'README.md',
      ];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      expect(result.orphans).not.toContain('package.json');
      expect(result.orphans).not.toContain('tsconfig.json');
      expect(result.orphans).not.toContain('README.md');
      expect(result.orphans).toContain('src/orphan.ts');
    });

    it('should allow custom exclude patterns', () => {
      const projectFiles = [
        'src/orphan.ts',
        'src/generated/types.ts',
        'src/generated/api.ts',
      ];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles, {
        excludePatterns: ['**/generated/**'],
      });

      expect(result.orphans).not.toContain('src/generated/types.ts');
      expect(result.orphans).not.toContain('src/generated/api.ts');
      expect(result.orphans).toContain('src/orphan.ts');
    });

    it('should return statistics about coverage', () => {
      const projectFiles = [
        'src/parser.ts',
        'src/lexer.ts',
        'src/orphan.ts',
        'src/another-orphan.ts',
      ];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      expect(result.stats.totalFiles).toBe(4);
      expect(result.stats.referencedFiles).toBe(2);
      expect(result.stats.orphanCount).toBe(2);
      expect(result.stats.coveragePercent).toBe(50);
    });

    it('should handle empty project files', () => {
      const result = queryService.getOrphanFiles(orphanContent, []);

      expect(result.orphans).toEqual([]);
      expect(result.stats.totalFiles).toBe(0);
    });

    it('should categorize orphans by directory', () => {
      const projectFiles = [
        'src/parser.ts',
        'src/orphan.ts',
        'lib/utils.ts',
        'lib/helpers.ts',
        'utils/common.ts',
      ];

      const result = queryService.getOrphanFiles(orphanContent, projectFiles);

      expect(result.byDirectory['src/']).toContain('src/orphan.ts');
      expect(result.byDirectory['lib/']).toContain('lib/utils.ts');
      expect(result.byDirectory['lib/']).toContain('lib/helpers.ts');
    });
  });

  describe('analyzeImpact & getOrphanFiles - Edge Cases (TDDAB#18)', () => {
    it('analyzeImpact should handle empty content', () => {
      const result = queryService.analyzeImpact('', 'src/file.ts');
      expect(result).toBeNull();
    });

    it('getOrphanFiles should handle empty content', () => {
      const result = queryService.getOrphanFiles('', ['src/file.ts']);
      // With no features defined, all files are orphans
      expect(result.orphans).toContain('src/file.ts');
    });

    it('analyzeImpact should handle file with partial path match', () => {
      const content = `
§MBEL:6.0

[LINKS]
§links
@feature{Test}->files[src/deep/nested/file.ts]
`;
      const result = queryService.analyzeImpact(content, 'file.ts');

      expect(result).not.toBeNull();
      expect(result!.affectedFeatures).toContain('Test');
    });
  });
});
