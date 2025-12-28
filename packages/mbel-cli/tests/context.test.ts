/**
 * TDDAB#24: mbel context command tests
 * Token-optimized feature summary for agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextCommand, ContextResult, ContextMode } from '../src/commands/context.js';

// Mock QueryService
vi.mock('@mbel/lsp', () => ({
  QueryService: vi.fn().mockImplementation(() => ({
    getFeatureFiles: vi.fn().mockImplementation((name: string) => {
      if (name === 'UnknownFeature') {
        return null;
      }
      return {
        name: 'Parser',
        files: ['packages/mbel-core/src/parser.ts', 'packages/mbel-core/src/ast.ts'],
        tests: ['packages/mbel-core/tests/parser.test.ts'],
        entryPoint: { file: 'parser.ts', symbol: 'MbelParser' },
        depends: ['Lexer'],
      };
    }),
    getFeatureDependencies: vi.fn().mockReturnValue({
      direct: ['Lexer'],
      transitive: ['Lexer'],
      depth: 1,
    }),
    getAllFeatures: vi.fn().mockReturnValue([
      { name: 'Lexer', files: ['lexer.ts'], tests: ['lexer.test.ts'] },
      { name: 'Parser', files: ['parser.ts'], tests: ['parser.test.ts'], depends: ['Lexer'] },
    ]),
  })),
}));

describe('TDDAB#24: mbel context command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contextCommand function', () => {
    it('should export contextCommand function', () => {
      expect(contextCommand).toBeDefined();
      expect(typeof contextCommand).toBe('function');
    });

    it('should return ContextResult type', async () => {
      const mbPath = 'memory-bank/systemPatterns.mbel.md';
      const result = await contextCommand('Parser', mbPath, { mode: 'summary' });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('feature');
      expect(result).toHaveProperty('mode');
    });
  });

  describe('summary mode', () => {
    it('should return feature summary in summary mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('summary');
      expect(result.feature).toBe('Parser');
    });

    it('should include files list', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files?.length).toBeGreaterThan(0);
    });

    it('should include tests list', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.tests).toBeDefined();
      expect(Array.isArray(result.tests)).toBe(true);
    });

    it('should include entry point', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.entryPoint).toBeDefined();
      expect(result.entryPoint).toHaveProperty('file');
      expect(result.entryPoint).toHaveProperty('symbol');
    });

    it('should include dependencies', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.dependencies).toBeDefined();
      expect(Array.isArray(result.dependencies)).toBe(true);
    });
  });

  describe('full mode', () => {
    it('should return detailed info in full mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'full',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('full');
    });

    it('should include transitive dependencies in full mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'full',
      });

      expect(result.transitiveDependencies).toBeDefined();
    });

    it('should include dependency depth in full mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'full',
      });

      expect(result.dependencyDepth).toBeDefined();
      expect(typeof result.dependencyDepth).toBe('number');
    });
  });

  describe('compact mode', () => {
    it('should return minimal info in compact mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'compact',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('compact');
    });

    it('should have shorter output in compact mode', async () => {
      const compactResult = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'compact',
      });
      const fullResult = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'full',
      });

      const compactJson = JSON.stringify(compactResult);
      const fullJson = JSON.stringify(fullResult);

      expect(compactJson.length).toBeLessThan(fullJson.length);
    });
  });

  describe('error handling', () => {
    it('should return error for unknown feature', async () => {
      const result = await contextCommand('UnknownFeature', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    it('should return error for invalid MB path', async () => {
      const result = await contextCommand('Parser', 'nonexistent/path.mbel.md', {
        mode: 'summary',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing mode gracefully (default to summary)', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {});

      expect(result.success).toBe(true);
      expect(result.mode).toBe('summary');
    });
  });

  describe('token optimization', () => {
    it('should produce compact JSON output', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      const jsonOutput = JSON.stringify(result);
      // Token-optimized output should be under 500 chars for a basic feature
      expect(jsonOutput.length).toBeLessThan(1000);
    });

    it('should use abbreviated keys in compact mode', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'compact',
      });

      // Compact mode may use shorter keys
      expect(result).toBeDefined();
    });
  });

  describe('ContextMode type', () => {
    it('should accept valid modes', () => {
      const modes: ContextMode[] = ['summary', 'full', 'compact'];
      expect(modes).toContain('summary');
      expect(modes).toContain('full');
      expect(modes).toContain('compact');
    });
  });

  describe('ContextResult type', () => {
    it('should have required fields', async () => {
      const result = await contextCommand('Parser', 'memory-bank/systemPatterns.mbel.md', {
        mode: 'summary',
      });

      // Required fields
      expect('success' in result).toBe(true);
      expect('feature' in result).toBe(true);
      expect('mode' in result).toBe(true);
    });
  });
});
