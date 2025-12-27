/**
 * TDDAB#11: DecisionLog - Analyzer Tests (RED Phase)
 *
 * Tests for validation of §decisions section:
 * - Empty decision name validation
 * - Duplicate decision detection
 * - Invalid status value validation
 * - Superseded without replacement warning
 * - Empty reason/tradeoff warning
 * - Context file path validation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic } from '../src/types.js';

describe('MbelAnalyzer: DecisionLog Validation (TDDAB#11)', () => {
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

  describe('Decision Declaration Validation', () => {
    it('should not produce errors for valid decision declaration', () => {
      const input = '@2024-12-27::UseTypeScript';
      const diagnostics = getDiagnostics(input);

      // Filter for DECISION errors only (not hints or warnings)
      const decisionErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-DECISION') && d.severity === 'error'
      );
      expect(decisionErrors.length).toBe(0);
    });

    it('should produce error for decision with empty name', () => {
      // @2024-12-27:: with nothing after should produce MBEL-DECISION-001
      const input = '@2024-12-27::';

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-001')).toBe(true);
    });

    it('should produce warning for duplicate decision names', () => {
      const input = `@2024-12-27::UseTypeScript
@2024-12-01::UseTypeScript`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-002')).toBe(true);
    });
  });

  describe('Status Validation', () => {
    it('should accept valid ACTIVE status', () => {
      const input = `@2024-12-27::UseTypeScript
  ->status{ACTIVE}`;
      const diagnostics = getDiagnostics(input);

      const statusErrors = diagnostics.filter(d =>
        d.code === 'MBEL-DECISION-010'
      );
      expect(statusErrors.length).toBe(0);
    });

    it('should accept valid SUPERSEDED status', () => {
      const input = `@2024-12-27::UseJavaScript
  ->status{SUPERSEDED}
  ->supersededBy{UseTypeScript}`;
      const diagnostics = getDiagnostics(input);

      const statusErrors = diagnostics.filter(d =>
        d.code === 'MBEL-DECISION-010'
      );
      expect(statusErrors.length).toBe(0);
    });

    it('should accept valid RECONSIDERING status', () => {
      const input = `@2024-12-27::UseReact
  ->status{RECONSIDERING}`;
      const diagnostics = getDiagnostics(input);

      const statusErrors = diagnostics.filter(d =>
        d.code === 'MBEL-DECISION-010'
      );
      expect(statusErrors.length).toBe(0);
    });

    it('should produce error for invalid status value', () => {
      const input = `@2024-12-27::UseTypeScript
  ->status{INVALID}`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-010')).toBe(true);
    });
  });

  describe('SupersededBy Validation', () => {
    it('should produce warning for SUPERSEDED without supersededBy', () => {
      const input = `@2024-12-27::UseJavaScript
  ->status{SUPERSEDED}`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-020')).toBe(true);
    });

    it('should not warn if SUPERSEDED has supersededBy reference', () => {
      const input = `@2024-12-27::UseJavaScript
  ->status{SUPERSEDED}
  ->supersededBy{UseTypeScript}`;
      const diagnostics = getDiagnostics(input);

      const supersededWarnings = diagnostics.filter(d =>
        d.code === 'MBEL-DECISION-020'
      );
      expect(supersededWarnings.length).toBe(0);
    });

    it('should produce warning for supersededBy referencing non-existent decision', () => {
      const input = `@2024-12-27::UseJavaScript
  ->status{SUPERSEDED}
  ->supersededBy{NonExistentDecision}`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-021')).toBe(true);
    });
  });

  describe('Reason and Tradeoff Validation', () => {
    it('should produce hint for decision without reason', () => {
      const input = '@2024-12-27::UseTypeScript';

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-030')).toBe(true);
    });

    it('should not produce hint if decision has reason', () => {
      const input = `@2024-12-27::UseTypeScript
  ->reason{Better type safety}`;
      const diagnostics = getDiagnostics(input);

      const reasonHints = diagnostics.filter(d =>
        d.code === 'MBEL-DECISION-030'
      );
      expect(reasonHints.length).toBe(0);
    });

    it('should produce warning for empty reason', () => {
      const input = `@2024-12-27::UseTypeScript
  ->reason{}`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-031')).toBe(true);
    });

    it('should produce warning for empty tradeoff', () => {
      const input = `@2024-12-27::UseTypeScript
  ->tradeoff{}`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-032')).toBe(true);
    });
  });

  describe('Context Validation', () => {
    it('should accept valid context file paths', () => {
      const input = `@2024-12-27::UseTypeScript
  ->context[src/types.ts, src/config.ts]`;
      const diagnostics = getDiagnostics(input);

      const contextErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-DECISION-04')
      );
      expect(contextErrors.length).toBe(0);
    });

    it('should produce error for context path with spaces', () => {
      const input = `@2024-12-27::UseTypeScript
  ->context[src/path with spaces.ts]`;

      expect(hasDiagnosticCode(input, 'MBEL-DECISION-040')).toBe(true);
    });
  });

  describe('Full Decision Validation', () => {
    it('should validate complete decision without errors', () => {
      const input = `@2024-12-27::UseTypeScript
  ->alternatives["JavaScript", "Python"]
  ->reason{Better type safety and tooling}
  ->tradeoff{Slower compilation}
  ->context[src/types.ts]
  ->status{ACTIVE}`;
      const diagnostics = getDiagnostics(input);

      const decisionErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-DECISION') && d.severity === 'error'
      );
      expect(decisionErrors.length).toBe(0);
    });

    it('should detect multiple validation issues', () => {
      const input = `@2024-12-27::
@2024-12-27::UseTypeScript
  ->status{INVALID}`;

      // Should have empty name error and invalid status error
      expect(hasDiagnosticCode(input, 'MBEL-DECISION-001')).toBe(true);
      expect(hasDiagnosticCode(input, 'MBEL-DECISION-010')).toBe(true);
    });
  });

  describe('Multiple Decisions', () => {
    it('should validate all decisions correctly', () => {
      const input = `@2024-12-27::UseTypeScript
  ->reason{Type safety}
  ->status{ACTIVE}
@2024-12-01::UseVitest
  ->reason{Modern testing}
  ->status{ACTIVE}`;
      const diagnostics = getDiagnostics(input);

      const errors = diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0);
    });
  });
});
