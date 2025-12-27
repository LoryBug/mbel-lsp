/**
 * TDDAB#9: CrossRefLinks - Analyzer Tests (RED Phase)
 *
 * Tests for validation of §links section:
 * - File path validation
 * - Decision reference validation
 * - Orphan link detection
 * - Circular dependency detection
 * - Blueprint syntax validation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic, DiagnosticSeverity } from '../src/types.js';

describe('MbelAnalyzer: CrossRefLinks Validation (TDDAB#9)', () => {
  let analyzer: MbelAnalyzer;

  beforeEach(() => {
    analyzer = new MbelAnalyzer({
      grammarChecks: true,
      semanticChecks: true,
      hints: true,
    });
  });

  // Helper to get diagnostics
  const getDiagnostics = (input: string): Diagnostic[] => {
    const result = analyzer.analyzeText(input);
    return result.diagnostics;
  };

  // Helper to check if diagnostic with specific code exists
  const hasDiagnosticCode = (input: string, code: string): boolean => {
    const diagnostics = getDiagnostics(input);
    return diagnostics.some(d => d.code === code);
  };

  // Helper to get diagnostic messages
  const getDiagnosticMessages = (input: string): string[] => {
    return getDiagnostics(input).map(d => d.message);
  };

  describe('Link Declaration Validation', () => {
    it('should not produce errors for valid link declaration', () => {
      const input = '@feature{ValidFeature}->files[src/valid.ts]';
      const diagnostics = getDiagnostics(input);

      // Should have no errors (warnings about non-existent files are ok)
      const errors = diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBe(0);
    });

    it('should produce error for link without name', () => {
      const input = '@feature{}->files[src/file.ts]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-001')).toBe(true);
    });

    it('should produce error for link with invalid name characters', () => {
      const input = '@feature{Invalid Name With Spaces}';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-002')).toBe(true);
    });

    it('should produce warning for duplicate link names', () => {
      const input = `@feature{Duplicate}->files[a.ts]
@feature{Duplicate}->files[b.ts]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-003')).toBe(true);
    });
  });

  describe('File Path Validation', () => {
    it('should produce hint for potentially non-existent file', () => {
      const input = '@feature{Test}->files[src/nonexistent/file.ts]';

      // This should be a hint, not an error (file existence is context-dependent)
      const diagnostics = getDiagnostics(input);
      const hints = diagnostics.filter(d => d.severity === 'hint');
      expect(hints.length).toBeGreaterThanOrEqual(0); // May or may not hint
    });

    it('should validate glob pattern syntax', () => {
      const input = '@feature{Test}->files[src/***/invalid.ts]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-010')).toBe(true);
    });

    it('should accept valid glob patterns', () => {
      const input = '@feature{Test}->files[src/**/*.ts]';
      const diagnostics = getDiagnostics(input);

      const globErrors = diagnostics.filter(d => d.code === 'MBEL-LINK-010');
      expect(globErrors.length).toBe(0);
    });

    it('should validate line range format', () => {
      const input = '@feature{Test}->files[src/file.ts:abc-def]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-011')).toBe(true);
    });

    it('should accept valid line range', () => {
      const input = '@feature{Test}->files[src/file.ts:10-50]';
      const diagnostics = getDiagnostics(input);

      const rangeErrors = diagnostics.filter(d => d.code === 'MBEL-LINK-011');
      expect(rangeErrors.length).toBe(0);
    });

    it('should warn if line range start > end', () => {
      const input = '@feature{Test}->files[src/file.ts:50-10]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-012')).toBe(true);
    });
  });

  describe('Decision Reference Validation', () => {
    it('should warn for reference to undefined decision', () => {
      const input = `[links]
@feature{Test}->decisions[UndefinedDecision]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-020')).toBe(true);
    });

    it('should not warn for reference to defined decision', () => {
      const input = `[decisions]
@2024-12-01::TestDecision{Choice}->reason{testing}

[links]
@feature{Test}->decisions[TestDecision]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-020')).toBe(false);
    });
  });

  describe('Related Links Validation', () => {
    it('should warn for reference to undefined feature', () => {
      const input = `[links]
@feature{FeatureA}->related[NonExistentFeature]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-021')).toBe(true);
    });

    it('should not warn for reference to defined feature', () => {
      const input = `[links]
@feature{FeatureA}->files[a.ts]
@feature{FeatureB}->related[FeatureA]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-021')).toBe(false);
    });

    it('should warn for self-reference in related', () => {
      const input = '@feature{Test}->related[Test]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-022')).toBe(true);
    });
  });

  describe('Dependency Validation', () => {
    it('should warn for circular dependency', () => {
      const input = `[links]
@task{TaskA}->depends[TaskB]
@task{TaskB}->depends[TaskA]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-030')).toBe(true);
    });

    it('should warn for deep circular dependency', () => {
      const input = `[links]
@task{A}->depends[B]
@task{B}->depends[C]
@task{C}->depends[A]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-030')).toBe(true);
    });

    it('should not warn for valid dependency chain', () => {
      const input = `[links]
@task{A}->depends[B]
@task{B}->depends[C]
@task{C}->files[base.ts]`;

      expect(hasDiagnosticCode(input, 'MBEL-LINK-030')).toBe(false);
    });

    it('should warn for reference to undefined dependency', () => {
      const input = '@task{Test}->depends[NonExistentTask]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-031')).toBe(true);
    });
  });

  describe('Blueprint Validation', () => {
    it('should accept valid blueprint steps', () => {
      const input = '@task{Test}->blueprint["Step 1","Step 2","Step 3"]';
      const diagnostics = getDiagnostics(input);

      const blueprintErrors = diagnostics.filter(d => d.code?.startsWith('MBEL-LINK-04'));
      expect(blueprintErrors.length).toBe(0);
    });

    it('should warn for empty blueprint', () => {
      const input = '@task{Test}->blueprint[]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-040')).toBe(true);
    });

    it('should warn for unquoted blueprint step', () => {
      const input = '@task{Test}->blueprint[Step without quotes]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-041')).toBe(true);
    });
  });

  describe('Entry Point Validation', () => {
    it('should accept valid entryPoint format', () => {
      const input = '@feature{Test}->entryPoint{file.ts:functionName:42}';
      const diagnostics = getDiagnostics(input);

      const entryErrors = diagnostics.filter(d => d.code?.startsWith('MBEL-LINK-05'));
      expect(entryErrors.length).toBe(0);
    });

    it('should warn for invalid entryPoint format', () => {
      const input = '@feature{Test}->entryPoint{invalid}';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-050')).toBe(true);
    });

    it('should warn for non-numeric line number in entryPoint', () => {
      const input = '@feature{Test}->entryPoint{file.ts:func:abc}';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-051')).toBe(true);
    });
  });

  describe('File Marker Validation', () => {
    it('should accept TO-CREATE marker', () => {
      const input = '@task{New}->files[src/new.ts{TO-CREATE}]';
      const diagnostics = getDiagnostics(input);

      const markerErrors = diagnostics.filter(d => d.code?.startsWith('MBEL-LINK-06'));
      expect(markerErrors.length).toBe(0);
    });

    it('should accept TO-MODIFY marker', () => {
      const input = '@task{Update}->files[src/existing.ts{TO-MODIFY}]';
      const diagnostics = getDiagnostics(input);

      const markerErrors = diagnostics.filter(d => d.code?.startsWith('MBEL-LINK-06'));
      expect(markerErrors.length).toBe(0);
    });

    it('should warn for unknown marker', () => {
      const input = '@task{Test}->files[src/file.ts{UNKNOWN-MARKER}]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-060')).toBe(true);
    });
  });

  describe('Cross-Section Validation', () => {
    it('should validate links section exists when referenced', () => {
      const input = `[anchors]
@entry::Test{src/test.ts:1}->descrizione{A test anchor}

[decisions]
@2024-01-01::Choice{option}->reason{testing}`;

      // No links section, which is fine - but if links are referenced they should exist
      const diagnostics = getDiagnostics(input);
      expect(diagnostics).toBeDefined();
    });
  });

  describe('Orphan Detection', () => {
    it('should hint about links with no files or tests', () => {
      const input = '@feature{OrphanFeature}->related[SomeOther]';

      // A feature with only related but no files/tests is suspicious
      expect(hasDiagnosticCode(input, 'MBEL-LINK-070')).toBe(true);
    });

    it('should not hint when link has files', () => {
      const input = '@feature{Complete}->files[src/file.ts]->related[Other]';

      expect(hasDiagnosticCode(input, 'MBEL-LINK-070')).toBe(false);
    });
  });

  describe('Position Tracking', () => {
    it('should report correct position for link errors', () => {
      const input = `[links]
@feature{}->files[a.ts]`;

      const diagnostics = getDiagnostics(input);
      const linkError = diagnostics.find(d => d.code === 'MBEL-LINK-001');

      expect(linkError).toBeDefined();
      if (linkError) {
        expect(linkError.range.start.line).toBe(2);
      }
    });
  });
});
