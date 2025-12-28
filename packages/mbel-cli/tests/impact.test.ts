import { describe, it, expect, beforeEach, vi } from 'vitest';
import { impactCommand, ImpactResult } from '../src/commands/impact.js';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const SAMPLE_MB_CONTENT = `§MBEL:6.0

[LINKS]
§links
@feature{Lexer}
  ->files[packages/mbel-core/src/lexer.ts]
  ->tests[packages/mbel-core/tests/lexer.test.ts]
  ->entryPoint{lexer.ts:MbelLexer}

@feature{Parser}
  ->files[packages/mbel-core/src/parser.ts]
  ->tests[packages/mbel-core/tests/parser.test.ts]
  ->depends[Lexer]

@feature{Analyzer}
  ->files[packages/mbel-analyzer/src/analyzer.ts]
  ->tests[packages/mbel-analyzer/tests/analyzer.test.ts]
  ->depends[Parser]

[ANCHORS]
§anchors
@hotspot::packages/mbel-core/src/lexer.ts
  ->descrizione::Frequently modified lexer

@entry::packages/mbel-core/src/index.ts
  ->descrizione::Core entry point
`;

describe('TDDAB#22: mbel impact command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('impactCommand', () => {
    it('should return error when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await impactCommand('nonexistent.ts', 'memory-bank/', { json: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when memory bank not found', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('memory-bank')) return false;
        return true;
      });

      const result = await impactCommand('src/file.ts', 'memory-bank/', { json: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Memory Bank');
    });

    it('should return impact analysis for tracked file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      expect(result.success).toBe(true);
      const data = JSON.parse(result.output) as ImpactResult;
      expect(data).toHaveProperty('riskLevel');
      expect(data).toHaveProperty('affectedFeatures');
      expect(data).toHaveProperty('requiredTests');
      expect(data).toHaveProperty('suggestion');
    });

    it('should identify affected features correctly', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(data.affectedFeatures).toContain('Lexer');
    });

    it('should include dependent features in impact', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      // Parser depends on Lexer, so should be in dependentFeatures
      expect(data.dependentFeatures).toContain('Parser');
    });

    it('should include required tests', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(data.requiredTests.length).toBeGreaterThan(0);
      expect(data.requiredTests.some(t => t.includes('lexer.test.ts'))).toBe(true);
    });

    it('should detect hotspot and set high risk', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(data.isHotspot).toBe(true);
      expect(['medium', 'high']).toContain(data.riskLevel);
    });

    it('should return low risk for untracked file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'some/untracked/file.ts',
        'memory-bank/',
        { json: true }
      );

      expect(result.success).toBe(true);
      const data = JSON.parse(result.output) as ImpactResult;
      expect(data.riskLevel).toBe('low');
      expect(data.affectedFeatures).toHaveLength(0);
    });

    it('should include suggestion based on risk level', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(typeof data.suggestion).toBe('string');
      expect(data.suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('ImpactResult structure', () => {
    it('should have riskLevel as enum', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(['low', 'medium', 'high', 'critical']).toContain(data.riskLevel);
    });

    it('should have file path in result', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(data.file).toBe('packages/mbel-core/src/lexer.ts');
    });

    it('should have arrays for features and tests', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      expect(Array.isArray(data.affectedFeatures)).toBe(true);
      expect(Array.isArray(data.dependentFeatures)).toBe(true);
      expect(Array.isArray(data.requiredTests)).toBe(true);
    });
  });

  describe('text output format', () => {
    it('should return human-readable text when json=false', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: false }
      );

      expect(result.format).toBe('text');
      expect(() => JSON.parse(result.output)).toThrow();
    });

    it('should include risk level in text output', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: false }
      );

      expect(result.output).toMatch(/risk|Risk/i);
    });
  });

  describe('transitive impact', () => {
    it('should include transitive dependencies', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_MB_CONTENT);

      const result = await impactCommand(
        'packages/mbel-core/src/lexer.ts',
        'memory-bank/',
        { json: true }
      );

      const data = JSON.parse(result.output) as ImpactResult;
      // Analyzer depends on Parser which depends on Lexer
      expect(data.transitiveImpact).toContain('Analyzer');
    });
  });
});
