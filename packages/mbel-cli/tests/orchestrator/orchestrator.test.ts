/**
 * TDDAB#30: OrchestratorHelpers
 *
 * Tests for orchestrator utility functions:
 * - context-builder: Build and compress context for subagents
 * - delta-aggregator: Aggregate and validate deltas from subagents
 */

import { describe, it, expect } from 'vitest';
import {
  buildTaskContext,
  compressContext,
  type TaskContext,
  type ContextMode,
} from '../../src/orchestrator/context-builder.js';
import {
  aggregateDeltas,
  validateDelta,
  orderDeltasBySection,
  type AggregationResult,
  type ValidationResult,
} from '../../src/orchestrator/delta-aggregator.js';

describe('TDDAB#30: OrchestratorHelpers', () => {
  // =========================================
  // context-builder tests (7 tests)
  // =========================================
  describe('context-builder', () => {
    describe('buildTaskContext', () => {
      // Test 1: minimal mode (solo files)
      it('should extract only files in minimal mode', () => {
        const mbContent = `§MBEL:6.0
[FEATURES]
@feature{Parser}->files[src/parser.ts, src/lexer.ts]->deps[Lexer]->tests[parser.test.ts]
@feature{Analyzer}->files[src/analyzer.ts]->deps[Parser]
`;
        const result = buildTaskContext(mbContent, 'Parser', 'minimal');

        expect(result.files).toContain('src/parser.ts');
        expect(result.files).toContain('src/lexer.ts');
        expect(result.mbSnapshot).toBeDefined();
        // In minimal mode, dependencies should be empty
        expect(result.dependencies).toHaveLength(0);
      });

      // Test 2: full mode (files + deps + tests)
      it('should extract files, deps and tests in full mode', () => {
        const mbContent = `§MBEL:6.0
[FEATURES]
@feature{Parser}->files[src/parser.ts]->deps[Lexer, AST]->tests[parser.test.ts]
`;
        const result = buildTaskContext(mbContent, 'Parser', 'full');

        expect(result.files).toContain('src/parser.ts');
        expect(result.dependencies).toContain('Lexer');
        expect(result.dependencies).toContain('AST');
        expect(result.mbSnapshot).toContain('Parser');
      });

      // Test 3: feature non trovato (empty)
      it('should return empty context when feature not found', () => {
        const mbContent = `§MBEL:6.0
[FEATURES]
@feature{Parser}->files[src/parser.ts]
`;
        const result = buildTaskContext(mbContent, 'NonExistent', 'full');

        expect(result.files).toHaveLength(0);
        expect(result.dependencies).toHaveLength(0);
        expect(result.mbSnapshot).toBe('');
      });

      // Test 6: estrae dependencies
      it('should extract dependencies correctly', () => {
        const mbContent = `§MBEL:6.0
[FEATURES]
@feature{CLI}->files[src/cli.ts]->deps[Parser, Analyzer, Formatter]
`;
        const result = buildTaskContext(mbContent, 'CLI', 'full');

        expect(result.dependencies).toContain('Parser');
        expect(result.dependencies).toContain('Analyzer');
        expect(result.dependencies).toContain('Formatter');
        expect(result.dependencies).toHaveLength(3);
      });

      // Test 7: con multiple features
      it('should handle multiple features and extract correct one', () => {
        const mbContent = `§MBEL:6.0
[FEATURES]
@feature{Parser}->files[src/parser.ts]->deps[Lexer]
@feature{Lexer}->files[src/lexer.ts]->deps[]
@feature{CLI}->files[src/cli.ts]->deps[Parser, Lexer]
`;
        const result = buildTaskContext(mbContent, 'CLI', 'full');

        expect(result.files).toContain('src/cli.ts');
        expect(result.files).not.toContain('src/parser.ts');
        expect(result.dependencies).toContain('Parser');
        expect(result.dependencies).toContain('Lexer');
      });
    });

    describe('compressContext', () => {
      // Test 4: rimuove whitespace extra
      it('should remove extra whitespace', () => {
        const context: TaskContext = {
          mbSnapshot: '@feature{Parser}  \n\n\n  ->files[parser.ts]   ',
          files: ['parser.ts'],
          dependencies: ['Lexer'],
        };

        const compressed = compressContext(context);

        // Should not have multiple consecutive newlines or trailing spaces
        expect(compressed).not.toMatch(/\n{3,}/);
        expect(compressed).not.toMatch(/  +/);
      });

      // Test 5: preserva struttura MBEL
      it('should preserve MBEL structure', () => {
        const context: TaskContext = {
          mbSnapshot: '@feature{Parser}->files[src/parser.ts]->deps[Lexer]',
          files: ['src/parser.ts'],
          dependencies: ['Lexer'],
        };

        const compressed = compressContext(context);

        // Should preserve key MBEL elements
        expect(compressed).toContain('@feature');
        expect(compressed).toContain('Parser');
        expect(compressed).toContain('files');
        expect(compressed).toContain('deps');
      });
    });
  });

  // =========================================
  // delta-aggregator tests (8 tests)
  // =========================================
  describe('delta-aggregator', () => {
    describe('aggregateDeltas', () => {
      // Test 1: due delta senza conflitti
      it('should merge two deltas without conflicts', () => {
        const deltas = [
          '[PROGRESS]\n@task{TDDAB#30}::complete',
          '[PROGRESS]\n@task{TDDAB#31}::complete',
        ];

        const result = aggregateDeltas(deltas);

        expect(result.success).toBe(true);
        expect(result.merged).toContain('TDDAB#30');
        expect(result.merged).toContain('TDDAB#31');
        expect(result.conflicts).toHaveLength(0);
      });

      // Test 2: cinque delta paralleli
      it('should merge five parallel deltas', () => {
        const deltas = [
          '[PROGRESS]\n@task{TDDAB#1}::complete',
          '[PROGRESS]\n@task{TDDAB#2}::complete',
          '[PROGRESS]\n@task{TDDAB#3}::complete',
          '[PROGRESS]\n@task{TDDAB#4}::complete',
          '[PROGRESS]\n@task{TDDAB#5}::complete',
        ];

        const result = aggregateDeltas(deltas);

        expect(result.success).toBe(true);
        expect(result.merged).toContain('TDDAB#1');
        expect(result.merged).toContain('TDDAB#5');
        expect(result.conflicts).toHaveLength(0);
      });

      // Test 3: array vuoto
      it('should handle empty array', () => {
        const result = aggregateDeltas([]);

        expect(result.success).toBe(true);
        expect(result.merged).toBe('');
        expect(result.conflicts).toHaveLength(0);
      });

      // Test 4: singolo delta
      it('should handle single delta', () => {
        const deltas = ['[PROGRESS]\n@task{TDDAB#30}::complete'];

        const result = aggregateDeltas(deltas);

        expect(result.success).toBe(true);
        expect(result.merged).toContain('TDDAB#30');
        expect(result.conflicts).toHaveLength(0);
      });

      // Test 5: rileva conflitti (stesso task ID)
      it('should detect conflicts with same task ID', () => {
        const deltas = [
          '[PROGRESS]\n@task{TDDAB#30}::complete',
          '[PROGRESS]\n@task{TDDAB#30}::blocked', // Same ID, different status
        ];

        const result = aggregateDeltas(deltas);

        expect(result.success).toBe(false);
        expect(result.conflicts.length).toBeGreaterThan(0);
        expect(result.conflicts[0]).toContain('TDDAB#30');
      });
    });

    describe('validateDelta', () => {
      // Test 6: delta valido
      it('should validate a valid delta', () => {
        const mbContent = `§MBEL:6.0
[PROGRESS]
@task{TDDAB#29}::complete
`;
        const delta = '[PROGRESS]\n@task{TDDAB#30}::complete';

        const result = validateDelta(mbContent, delta);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Test 7: delta duplicato in MB
      it('should detect duplicate delta in MB', () => {
        const mbContent = `§MBEL:6.0
[PROGRESS]
@task{TDDAB#30}::complete
`;
        const delta = '[PROGRESS]\n@task{TDDAB#30}::complete';

        const result = validateDelta(mbContent, delta);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('duplicate');
      });
    });

    describe('orderDeltasBySection', () => {
      // Test 8: ordina per sezione [FOCUS], [STATUS], etc.
      it('should order deltas by section priority', () => {
        const deltas = [
          '[PENDING]\n@task{TDDAB#99}::waiting',
          '[FOCUS]\n@current::TDDAB#30',
          '[STATUS]\n@phase::implementation',
          '[PROGRESS]\n@task{TDDAB#30}::complete',
        ];

        const ordered = orderDeltasBySection(deltas);

        // Expected order: FOCUS, STATUS, PROGRESS, PENDING
        expect(ordered[0]).toContain('[FOCUS]');
        expect(ordered[1]).toContain('[STATUS]');
        expect(ordered[2]).toContain('[PROGRESS]');
        expect(ordered[3]).toContain('[PENDING]');
      });
    });
  });

  // =========================================
  // Additional edge case tests for 100% coverage
  // =========================================
  describe('edge cases', () => {
    describe('context-builder edge cases', () => {
      it('should handle feature with no files defined', () => {
        const mbContent = `§MBEL:6.0
@feature{EmptyFeature}->deps[Dep1]
`;
        const result = buildTaskContext(mbContent, 'EmptyFeature', 'full');

        expect(result.files).toHaveLength(0);
        expect(result.dependencies).toContain('Dep1');
      });

      it('should handle feature with no deps defined', () => {
        const mbContent = `§MBEL:6.0
@feature{NoDeps}->files[src/nodeps.ts]
`;
        const result = buildTaskContext(mbContent, 'NoDeps', 'full');

        expect(result.files).toContain('src/nodeps.ts');
        expect(result.dependencies).toHaveLength(0);
      });

      it('should handle empty files array', () => {
        const mbContent = `§MBEL:6.0
@feature{EmptyFiles}->files[]->deps[Dep1]
`;
        const result = buildTaskContext(mbContent, 'EmptyFiles', 'full');

        expect(result.files).toHaveLength(0);
      });

      it('should handle empty deps array', () => {
        const mbContent = `§MBEL:6.0
@feature{EmptyDeps}->files[file.ts]->deps[]
`;
        const result = buildTaskContext(mbContent, 'EmptyDeps', 'full');

        expect(result.dependencies).toHaveLength(0);
      });
    });

    describe('delta-aggregator edge cases', () => {
      it('should handle delta without section header', () => {
        const deltas = [
          '@task{TDDAB#40}::complete',
          '@task{TDDAB#41}::complete',
        ];

        const ordered = orderDeltasBySection(deltas);

        // Deltas without section should be at the end
        expect(ordered).toHaveLength(2);
      });

      it('should handle unknown section', () => {
        const deltas = [
          '[UNKNOWN_SECTION]\n@task{TDDAB#50}::complete',
          '[PROGRESS]\n@task{TDDAB#51}::complete',
        ];

        const ordered = orderDeltasBySection(deltas);

        // PROGRESS should come before UNKNOWN_SECTION
        expect(ordered[0]).toContain('[PROGRESS]');
        expect(ordered[1]).toContain('[UNKNOWN_SECTION]');
      });

      it('should detect warning for task with different value in MB', () => {
        const mbContent = `§MBEL:6.0
[PROGRESS]
@task{TDDAB#60}::inprogress
`;
        const delta = '[PROGRESS]\n@task{TDDAB#60}::complete';

        const result = validateDelta(mbContent, delta);

        // Should be valid (not duplicate) but have warning
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it('should handle same task ID appearing twice with same value', () => {
        const deltas = [
          '[PROGRESS]\n@task{TDDAB#70}::complete',
          '[PROGRESS]\n@task{TDDAB#70}::complete', // Same value - not a conflict
        ];

        const result = aggregateDeltas(deltas);

        // Should succeed because values are identical
        expect(result.success).toBe(true);
      });

      it('should handle deltas with multiple sections', () => {
        const deltas = [
          '[PROGRESS]\n@task{TDDAB#80}::complete',
          '[STATUS]\n@phase::testing',
        ];

        const result = aggregateDeltas(deltas);

        expect(result.success).toBe(true);
        expect(result.merged).toContain('[PROGRESS]');
        expect(result.merged).toContain('[STATUS]');
      });
    });
  });
});
