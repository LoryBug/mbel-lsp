/**
 * TDDAB#26: mbel simulate command tests
 * Predictive architecture simulation for agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  simulateCommand,
  SimulateResult,
  SimulateAction,
  SimulateOptions,
} from '../src/commands/simulate.js';

// Mock QueryService for dependency graph - stateless API: methods take content as first arg
vi.mock('@mbel/lsp', () => ({
  QueryService: vi.fn().mockImplementation(() => ({
    getFeatureDependencies: vi.fn().mockImplementation((_content: string, name: string) => {
      const deps: Record<string, { directDependencies: string[]; transitiveDependencies: string[]; depth: number }> = {
        Lexer: { directDependencies: [], transitiveDependencies: [], depth: 0 },
        Parser: { directDependencies: ['Lexer'], transitiveDependencies: ['Lexer'], depth: 1 },
        Analyzer: { directDependencies: ['Parser'], transitiveDependencies: ['Parser', 'Lexer'], depth: 2 },
        LSPServer: { directDependencies: ['Parser', 'Analyzer'], transitiveDependencies: ['Parser', 'Analyzer', 'Lexer'], depth: 2 },
      };
      return deps[name] ?? null;
    }),
    getAllFeatures: vi.fn().mockImplementation((_content: string) => [
      { name: 'Lexer', files: ['lexer.ts'], depends: [] },
      { name: 'Parser', files: ['parser.ts'], depends: ['Lexer'] },
      { name: 'Analyzer', files: ['analyzer.ts'], depends: ['Parser'] },
      { name: 'LSPServer', files: ['server.ts'], depends: ['Parser', 'Analyzer'] },
    ]),
    getFeatureFiles: vi.fn().mockImplementation((_content: string, name: string) => {
      const features: Record<string, { name: string; files: string[]; depends: string[] }> = {
        Lexer: { name: 'Lexer', files: ['lexer.ts'], depends: [] },
        Parser: { name: 'Parser', files: ['parser.ts'], depends: ['Lexer'] },
        Analyzer: { name: 'Analyzer', files: ['analyzer.ts'], depends: ['Parser'] },
        LSPServer: { name: 'LSPServer', files: ['server.ts'], depends: ['Parser', 'Analyzer'] },
      };
      return features[name] ?? null;
    }),
  })),
}));

describe('TDDAB#26: mbel simulate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('simulateCommand function', () => {
    it('should export simulateCommand function', () => {
      expect(simulateCommand).toBeDefined();
      expect(typeof simulateCommand).toBe('function');
    });

    it('should return SimulateResult type', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('simulation');
    });
  });

  describe('add-dep action', () => {
    it('should simulate adding a dependency', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('add-dep');
    });

    it('should show new transitive dependencies', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result.simulation).toBeDefined();
      expect(result.simulation?.newDependencies).toBeDefined();
    });

    it('should detect circular dependency', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Lexer',
        to: 'Parser',
      });

      expect(result.success).toBe(true);
      expect(result.simulation?.circular).toBe(true);
    });

    it('should calculate impact level', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result.simulation?.impactLevel).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.simulation?.impactLevel);
    });
  });

  describe('remove-dep action', () => {
    it('should simulate removing a dependency', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'remove-dep',
        from: 'Parser',
        to: 'Lexer',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('remove-dep');
    });

    it('should show affected features', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'remove-dep',
        from: 'Parser',
        to: 'Lexer',
      });

      expect(result.simulation?.affectedFeatures).toBeDefined();
      expect(Array.isArray(result.simulation?.affectedFeatures)).toBe(true);
    });

    it('should warn about breaking changes', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'remove-dep',
        from: 'Parser',
        to: 'Lexer',
      });

      expect(result.simulation?.breaking).toBeDefined();
    });
  });

  describe('add-feature action', () => {
    it('should simulate adding a new feature', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-feature',
        feature: 'NewFeature',
        dependsOn: ['Parser'],
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('add-feature');
    });

    it('should show where new feature fits in graph', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-feature',
        feature: 'NewFeature',
        dependsOn: ['Parser'],
      });

      expect(result.simulation?.graphPosition).toBeDefined();
    });

    it('should calculate suggested tests', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-feature',
        feature: 'NewFeature',
        dependsOn: ['Parser', 'Analyzer'],
      });

      expect(result.simulation?.suggestedTests).toBeDefined();
    });
  });

  describe('remove-feature action', () => {
    it('should simulate removing a feature', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'remove-feature',
        feature: 'Analyzer',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('remove-feature');
    });

    it('should show dependents that would break', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'remove-feature',
        feature: 'Parser',
      });

      expect(result.simulation?.breakingDependents).toBeDefined();
      expect(result.simulation?.breakingDependents?.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should return error for unknown from feature', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'UnknownFeature',
        to: 'Parser',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for unknown to feature', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Parser',
        to: 'UnknownFeature',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for invalid MB path', async () => {
      const result = await simulateCommand('nonexistent/path.mbel.md', {
        action: 'add-dep',
        from: 'Parser',
        to: 'Lexer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('SimulateAction type', () => {
    it('should accept valid actions', () => {
      const actions: SimulateAction[] = ['add-dep', 'remove-dep', 'add-feature', 'remove-feature'];
      expect(actions).toContain('add-dep');
      expect(actions).toContain('remove-dep');
      expect(actions).toContain('add-feature');
      expect(actions).toContain('remove-feature');
    });
  });

  describe('SimulateResult type', () => {
    it('should have required fields', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect('success' in result).toBe(true);
      expect('action' in result).toBe(true);
    });
  });

  describe('dry-run behavior', () => {
    it('should not modify any files', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result.simulation?.dryRun).toBe(true);
    });

    it('should provide preview of changes', async () => {
      const result = await simulateCommand('memory-bank/systemPatterns.mbel.md', {
        action: 'add-dep',
        from: 'Analyzer',
        to: 'Lexer',
      });

      expect(result.simulation?.preview).toBeDefined();
    });
  });
});
