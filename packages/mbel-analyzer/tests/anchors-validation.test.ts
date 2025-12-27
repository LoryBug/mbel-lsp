/**
 * TDDAB#10: SemanticAnchors - Analyzer Tests (RED Phase)
 *
 * Tests for validation of §anchors section:
 * - Empty anchor path validation
 * - Invalid path characters validation
 * - Duplicate anchor detection
 * - Empty description warning
 * - Invalid glob pattern detection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic } from '../src/types.js';

describe('MbelAnalyzer: SemanticAnchors Validation (TDDAB#10)', () => {
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

  describe('Anchor Declaration Validation', () => {
    it('should not produce errors for valid anchor declaration', () => {
      const input = '@entry::src/index.ts';
      const diagnostics = getDiagnostics(input);

      const errors = diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0);
    });

    it('should produce error for anchor with empty path', () => {
      // @entry:: with nothing after should produce MBEL-ANCHOR-001
      const input = '@entry::';

      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-001')).toBe(true);
    });

    it('should produce error for anchor path with spaces', () => {
      const input = '@entry::src/path with spaces/file.ts';

      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-002')).toBe(true);
    });

    it('should produce warning for duplicate anchors on same path', () => {
      const input = `@entry::src/index.ts
@hotspot::src/index.ts`;

      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-003')).toBe(true);
    });
  });

  describe('Description Validation', () => {
    it('should produce warning for empty description', () => {
      const input = `@entry::src/index.ts
  ->descrizione::`;

      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-010')).toBe(true);
    });

    it('should accept anchor with valid description', () => {
      const input = `@entry::src/index.ts
  ->descrizione::Main entry point`;
      const diagnostics = getDiagnostics(input);

      // Should have no MBEL-ANCHOR errors
      const anchorErrors = diagnostics.filter(d =>
        d.code && d.code.startsWith('MBEL-ANCHOR')
      );
      expect(anchorErrors.length).toBe(0);
    });
  });

  describe('Glob Pattern Validation', () => {
    it('should accept valid glob pattern', () => {
      const input = '@entry::src/**/*.ts';
      const diagnostics = getDiagnostics(input);

      const errors = diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0);
    });

    it('should produce error for invalid glob pattern (triple asterisk)', () => {
      const input = '@entry::src/***/file.ts';

      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-011')).toBe(true);
    });
  });

  describe('Multiple Anchors', () => {
    it('should validate all anchor types correctly', () => {
      const input = `@entry::src/index.ts
@hotspot::src/parser.ts
@boundary::src/api.ts`;
      const diagnostics = getDiagnostics(input);

      const errors = diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0);
    });

    it('should detect multiple validation issues', () => {
      const input = `@entry::
@hotspot::src/path with spaces.ts`;

      // Should have at least 2 errors
      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-001')).toBe(true);
      expect(hasDiagnosticCode(input, 'MBEL-ANCHOR-002')).toBe(true);
    });
  });
});
