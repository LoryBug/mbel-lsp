/**
 * TDDAB#12: HeatMap - Parser Tests (RED Phase)
 *
 * Tests for parsing §heat section:
 * - HeatDeclaration nodes (@critical::, @stable::, @volatile::, @hot::)
 * - Heat property clauses (->dependents, ->changes, ->coverage, etc.)
 * - Full heat declarations with multiple properties
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type { Document, Statement, HeatDeclaration } from '../src/ast.js';

describe('MbelParser: HeatMap (TDDAB#12)', () => {
  let parser: MbelParser;

  beforeEach(() => {
    parser = new MbelParser();
  });

  // Helper to get first statement
  const firstStatement = (input: string): Statement => {
    const result = parser.parse(input);
    return result.document.statements[0]!;
  };

  // Helper to parse and get document
  const parseDoc = (input: string): Document => {
    const result = parser.parse(input);
    return result.document;
  };

  // Type guard for HeatDeclaration
  const isHeatDeclaration = (stmt: Statement): stmt is HeatDeclaration => {
    return stmt.type === 'HeatDeclaration';
  };

  describe('Heat Declaration Parsing', () => {
    it('should parse @critical:: as HeatDeclaration', () => {
      const stmt = firstStatement('@critical::src/core/engine.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('critical');
        expect(stmt.path).toContain('src');
      }
    });

    it('should parse @stable:: as HeatDeclaration', () => {
      const stmt = firstStatement('@stable::src/utils/constants.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('stable');
      }
    });

    it('should parse @volatile:: as HeatDeclaration', () => {
      const stmt = firstStatement('@volatile::src/features/new-feature.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('volatile');
      }
    });

    it('should parse @hot:: as HeatDeclaration', () => {
      const stmt = firstStatement('@hot::src/api/endpoints.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('hot');
      }
    });

    it('should default all optional fields to null', () => {
      const stmt = firstStatement('@critical::src/core/engine.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.dependents).toBeNull();
        expect(stmt.untouched).toBeNull();
        expect(stmt.changes).toBeNull();
        expect(stmt.coverage).toBeNull();
        expect(stmt.confidence).toBeNull();
        expect(stmt.impact).toBeNull();
        expect(stmt.caution).toBeNull();
      }
    });

    it('should detect glob patterns in paths', () => {
      const stmt = firstStatement('@hot::src/**/*.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.isGlob).toBe(true);
      }
    });

    it('should mark regular paths as non-glob', () => {
      const stmt = firstStatement('@stable::src/utils/constants.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.isGlob).toBe(false);
      }
    });
  });

  describe('Heat with Dependents', () => {
    it('should parse heat with ->dependents list', () => {
      const input = '@critical::src/core/engine.ts\n  ->dependents[ModuleA, ModuleB, ModuleC]';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.dependents).toEqual(['ModuleA', 'ModuleB', 'ModuleC']);
      }
    });

    it('should parse heat with single dependent', () => {
      const input = '@critical::src/core/engine.ts\n  ->dependents[MainModule]';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.dependents).toEqual(['MainModule']);
      }
    });
  });

  describe('Heat with Untouched Duration', () => {
    it('should parse heat with ->untouched clause', () => {
      const input = '@stable::src/utils/constants.ts\n  ->untouched{6months}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.untouched).toBe('6months');
      }
    });

    it('should parse heat with various duration formats', () => {
      const durations = ['1year', '3months', '2weeks', '5days'];
      for (const duration of durations) {
        const input = `@stable::src/file.ts\n  ->untouched{${duration}}`;
        const stmt = firstStatement(input);

        expect(isHeatDeclaration(stmt)).toBe(true);
        if (isHeatDeclaration(stmt)) {
          expect(stmt.untouched).toBe(duration);
        }
      }
    });
  });

  describe('Heat with Changes Count', () => {
    it('should parse heat with ->changes clause', () => {
      const input = '@hot::src/api/endpoints.ts\n  ->changes{42}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.changes).toBe(42);
      }
    });

    it('should parse heat with zero changes', () => {
      const input = '@stable::src/constants.ts\n  ->changes{0}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.changes).toBe(0);
      }
    });
  });

  describe('Heat with Coverage', () => {
    it('should parse heat with ->coverage percentage', () => {
      const input = '@critical::src/core/engine.ts\n  ->coverage{85%}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.coverage).toBe('85%');
      }
    });

    it('should parse heat with full coverage', () => {
      const input = '@stable::src/utils.ts\n  ->coverage{100%}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.coverage).toBe('100%');
      }
    });
  });

  describe('Heat with Confidence', () => {
    it('should parse heat with ->confidence level', () => {
      const input = '@critical::src/core/engine.ts\n  ->confidence{high}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.confidence).toBe('high');
      }
    });

    it('should parse various confidence levels', () => {
      const levels = ['high', 'medium', 'low'];
      for (const level of levels) {
        const input = `@critical::src/file.ts\n  ->confidence{${level}}`;
        const stmt = firstStatement(input);

        expect(isHeatDeclaration(stmt)).toBe(true);
        if (isHeatDeclaration(stmt)) {
          expect(stmt.confidence).toBe(level);
        }
      }
    });
  });

  describe('Heat with Impact', () => {
    it('should parse heat with ->impact level', () => {
      const input = '@critical::src/core/engine.ts\n  ->impact{high}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.impact).toBe('high');
      }
    });
  });

  describe('Heat with Caution', () => {
    it('should parse heat with ->caution message', () => {
      const input = '@critical::src/core/engine.ts\n  ->caution{Requires full regression testing}';
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.caution).toBe('Requires full regression testing');
      }
    });
  });

  describe('Full Heat Declaration', () => {
    it('should parse heat with multiple clauses', () => {
      const input = `@critical::src/core/engine.ts
  ->dependents[ModuleA, ModuleB]
  ->changes{12}
  ->coverage{85%}
  ->confidence{high}`;
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('critical');
        expect(stmt.dependents).toEqual(['ModuleA', 'ModuleB']);
        expect(stmt.changes).toBe(12);
        expect(stmt.coverage).toBe('85%');
        expect(stmt.confidence).toBe('high');
      }
    });

    it('should parse complete heat with all clauses', () => {
      const input = `@volatile::src/features/experimental.ts
  ->dependents[FeatureA]
  ->untouched{2days}
  ->changes{25}
  ->coverage{60%}
  ->confidence{low}
  ->impact{medium}
  ->caution{Experimental feature}`;
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.heatType).toBe('volatile');
        expect(stmt.dependents).toEqual(['FeatureA']);
        expect(stmt.untouched).toBe('2days');
        expect(stmt.changes).toBe(25);
        expect(stmt.coverage).toBe('60%');
        expect(stmt.confidence).toBe('low');
        expect(stmt.impact).toBe('medium');
        expect(stmt.caution).toBe('Experimental feature');
      }
    });
  });

  describe('Multiple Heat Declarations', () => {
    it('should parse multiple heat declarations in sequence', () => {
      const input = `@critical::src/core/engine.ts
@stable::src/utils/constants.ts
@hot::src/api/endpoints.ts`;
      const doc = parseDoc(input);

      const heats = doc.statements.filter(isHeatDeclaration);
      expect(heats.length).toBe(3);
      expect(heats[0]!.heatType).toBe('critical');
      expect(heats[1]!.heatType).toBe('stable');
      expect(heats[2]!.heatType).toBe('hot');
    });

    it('should parse heats within a section', () => {
      const input = `[HEAT]
@critical::src/core/engine.ts
@stable::src/utils/constants.ts`;
      const doc = parseDoc(input);

      const heats = doc.statements.filter(isHeatDeclaration);
      expect(heats.length).toBe(2);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for heat', () => {
      const stmt = firstStatement('@critical::src/core/engine.ts');

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        expect(stmt.start.line).toBe(1);
        expect(stmt.start.column).toBe(1);
      }
    });

    it('should track positions on multiline heat', () => {
      const input = `@critical::src/core/engine.ts
  ->changes{12}
  ->coverage{85%}`;
      const stmt = firstStatement(input);

      expect(isHeatDeclaration(stmt)).toBe(true);
      if (isHeatDeclaration(stmt)) {
        // End should be on line 3 after coverage
        expect(stmt.end.line).toBe(3);
      }
    });
  });
});
