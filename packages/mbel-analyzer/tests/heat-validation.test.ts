/**
 * TDDAB#12: HeatMap - Analyzer Tests (RED Phase)
 *
 * Tests for validation of §heat section:
 * - Empty heat path validation
 * - Duplicate heat path detection
 * - Invalid path characters (spaces)
 * - Invalid glob pattern validation
 * - Invalid confidence/impact levels
 * - Invalid changes value (non-numeric)
 * - Empty metadata fields
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic } from '../src/types.js';

describe('MbelAnalyzer: HeatMap Validation (TDDAB#12)', () => {
  let analyzer: MbelAnalyzer;

  beforeEach(() => {
    analyzer = new MbelAnalyzer({
      grammarChecks: true,
      semanticChecks: true,
      hints: true,
    });
  });

  // Helper to get diagnostics
  const getDiagnostics = (input: string): readonly Diagnostic[] => {
    const result = analyzer.analyzeText(input);
    return result.diagnostics;
  };

  // Helper to check if diagnostic with specific code exists
  const hasDiagnosticCode = (input: string, code: string): boolean => {
    const diagnostics = getDiagnostics(input);
    return diagnostics.some(d => d.code === code);
  };

  describe('Heat Declaration Validation', () => {
    it('should not produce errors for valid heat declaration', () => {
      const input = '@critical::src/core/engine.ts';
      const diagnostics = getDiagnostics(input);

      // Filter for HEAT errors only (not hints or warnings)
      const heatErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT') && d.severity === 'error'
      );
      expect(heatErrors.length).toBe(0);
    });

    it('should produce error for heat with empty path', () => {
      // @critical:: with nothing after should produce MBEL-HEAT-001
      const input = '@critical::';

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-001')).toBe(true);
    });

    it('should produce warning for duplicate heat paths', () => {
      const input = `@critical::src/core/engine.ts
@stable::src/core/engine.ts`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-003')).toBe(true);
    });

    it('should produce error for path with spaces', () => {
      const input = '@critical::src/my file.ts';

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-002')).toBe(true);
    });
  });

  describe('Glob Pattern Validation', () => {
    it('should accept valid glob patterns', () => {
      const input = '@hot::src/**/*.ts';
      const diagnostics = getDiagnostics(input);

      const globErrors = diagnostics.filter(d =>
        d.code === 'MBEL-HEAT-011'
      );
      expect(globErrors.length).toBe(0);
    });

    it('should produce error for invalid glob pattern', () => {
      const input = '@hot::src/***/file.ts';

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-011')).toBe(true);
    });
  });

  describe('Dependents Validation', () => {
    it('should accept valid dependents list', () => {
      const input = `@critical::src/core/engine.ts
  ->dependents[ModuleA, ModuleB]`;
      const diagnostics = getDiagnostics(input);

      const dependentsErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT-02')
      );
      expect(dependentsErrors.length).toBe(0);
    });

    it('should produce warning for empty dependents list', () => {
      const input = `@critical::src/core/engine.ts
  ->dependents[]`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-020')).toBe(true);
    });
  });

  describe('Changes Validation', () => {
    it('should accept valid numeric changes', () => {
      const input = `@hot::src/api/endpoints.ts
  ->changes{42}`;
      const diagnostics = getDiagnostics(input);

      const changesErrors = diagnostics.filter(d =>
        d.code === 'MBEL-HEAT-030'
      );
      expect(changesErrors.length).toBe(0);
    });

    it('should produce error for non-numeric changes', () => {
      const input = `@hot::src/api/endpoints.ts
  ->changes{many}`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-030')).toBe(true);
    });

    it('should accept zero changes', () => {
      const input = `@stable::src/constants.ts
  ->changes{0}`;
      const diagnostics = getDiagnostics(input);

      const changesErrors = diagnostics.filter(d =>
        d.code === 'MBEL-HEAT-030'
      );
      expect(changesErrors.length).toBe(0);
    });
  });

  describe('Coverage Validation', () => {
    it('should accept valid coverage percentage', () => {
      const input = `@critical::src/core/engine.ts
  ->coverage{85%}`;
      const diagnostics = getDiagnostics(input);

      const coverageErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT-04')
      );
      expect(coverageErrors.length).toBe(0);
    });

    it('should produce warning for empty coverage', () => {
      const input = `@critical::src/core/engine.ts
  ->coverage{}`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-040')).toBe(true);
    });
  });

  describe('Confidence Validation', () => {
    it('should accept valid confidence levels', () => {
      const levels = ['high', 'medium', 'low'];
      for (const level of levels) {
        const input = `@critical::src/core/engine.ts
  ->confidence{${level}}`;
        const diagnostics = getDiagnostics(input);

        const confidenceErrors = diagnostics.filter(d =>
          d.code === 'MBEL-HEAT-050'
        );
        expect(confidenceErrors.length).toBe(0);
      }
    });

    it('should produce warning for empty confidence', () => {
      const input = `@critical::src/core/engine.ts
  ->confidence{}`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-051')).toBe(true);
    });
  });

  describe('Impact Validation', () => {
    it('should accept valid impact levels', () => {
      const input = `@critical::src/core/engine.ts
  ->impact{high}`;
      const diagnostics = getDiagnostics(input);

      const impactErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT-06')
      );
      expect(impactErrors.length).toBe(0);
    });

    it('should produce warning for empty impact', () => {
      const input = `@critical::src/core/engine.ts
  ->impact{}`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-060')).toBe(true);
    });
  });

  describe('Caution Validation', () => {
    it('should accept valid caution message', () => {
      const input = `@critical::src/core/engine.ts
  ->caution{Requires full regression testing}`;
      const diagnostics = getDiagnostics(input);

      const cautionErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT-07')
      );
      expect(cautionErrors.length).toBe(0);
    });

    it('should produce warning for empty caution', () => {
      const input = `@critical::src/core/engine.ts
  ->caution{}`;

      expect(hasDiagnosticCode(input, 'MBEL-HEAT-070')).toBe(true);
    });
  });

  describe('Full Heat Validation', () => {
    it('should validate complete heat without errors', () => {
      const input = `@critical::src/core/engine.ts
  ->dependents[ModuleA, ModuleB]
  ->changes{12}
  ->coverage{85%}
  ->confidence{high}
  ->impact{high}
  ->caution{Requires full regression testing}`;
      const diagnostics = getDiagnostics(input);

      const heatErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT') && d.severity === 'error'
      );
      expect(heatErrors.length).toBe(0);
    });

    it('should detect multiple validation issues', () => {
      const input = `@critical::
@critical::src/my file.ts
  ->changes{invalid}`;

      // Should have empty path error, spaces error, and invalid changes error
      expect(hasDiagnosticCode(input, 'MBEL-HEAT-001')).toBe(true);
      expect(hasDiagnosticCode(input, 'MBEL-HEAT-002')).toBe(true);
      expect(hasDiagnosticCode(input, 'MBEL-HEAT-030')).toBe(true);
    });
  });

  describe('Multiple Heats', () => {
    it('should validate all heats correctly', () => {
      const input = `@critical::src/core/engine.ts
  ->changes{5}
  ->confidence{high}
@stable::src/utils/constants.ts
  ->untouched{1year}
@hot::src/api/endpoints.ts
  ->changes{50}`;
      const diagnostics = getDiagnostics(input);

      const errors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-HEAT') && d.severity === 'error'
      );
      expect(errors.length).toBe(0);
    });
  });

  describe('Heat Types', () => {
    it('should accept all heat types', () => {
      const types = [
        '@critical::src/a.ts',
        '@stable::src/b.ts',
        '@volatile::src/c.ts',
        '@hot::src/d.ts',
      ];

      for (const typeInput of types) {
        const diagnostics = getDiagnostics(typeInput);
        const heatErrors = diagnostics.filter(d =>
          d.code && d.code.startsWith('MBEL-HEAT') && d.severity === 'error'
        );
        expect(heatErrors.length).toBe(0);
      }
    });
  });
});
