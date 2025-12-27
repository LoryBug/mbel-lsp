/**
 * TDDAB#11: DecisionLog - Parser Tests (RED Phase)
 *
 * Tests for parsing §decisions section:
 * - DecisionDeclaration nodes (@YYYY-MM-DD::Name)
 * - Decision property clauses (->alternatives, ->reason, ->status, etc.)
 * - Full decision declarations with multiple properties
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type { Document, Statement, DecisionDeclaration } from '../src/ast.js';

describe('MbelParser: DecisionLog (TDDAB#11)', () => {
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

  // Type guard for DecisionDeclaration
  const isDecisionDeclaration = (stmt: Statement): stmt is DecisionDeclaration => {
    return stmt.type === 'DecisionDeclaration';
  };

  describe('Decision Declaration Parsing', () => {
    it('should parse @date::Name as DecisionDeclaration', () => {
      const stmt = firstStatement('@2024-12-27::UseTypeScript');

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.date).toBe('2024-12-27');
        expect(stmt.name).toBe('UseTypeScript');
      }
    });

    it('should parse decision with different date', () => {
      const stmt = firstStatement('@2023-01-15::UseMongoDB');

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.date).toBe('2023-01-15');
        expect(stmt.name).toBe('UseMongoDB');
      }
    });

    it('should default all optional fields to null', () => {
      const stmt = firstStatement('@2024-12-27::UseTypeScript');

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.alternatives).toBeNull();
        expect(stmt.reason).toBeNull();
        expect(stmt.tradeoff).toBeNull();
        expect(stmt.context).toBeNull();
        expect(stmt.status).toBeNull();
        expect(stmt.supersededBy).toBeNull();
        expect(stmt.revisit).toBeNull();
      }
    });
  });

  describe('Decision with Alternatives', () => {
    it('should parse decision with ->alternatives list', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->alternatives["JavaScript", "Python", "Go"]';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.alternatives).toEqual(['JavaScript', 'Python', 'Go']);
      }
    });

    it('should parse decision with single alternative', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->alternatives["JavaScript"]';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.alternatives).toEqual(['JavaScript']);
      }
    });
  });

  describe('Decision with Reason', () => {
    it('should parse decision with ->reason clause', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->reason{Better type safety and tooling}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.reason).toBe('Better type safety and tooling');
      }
    });
  });

  describe('Decision with Tradeoff', () => {
    it('should parse decision with ->tradeoff clause', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->tradeoff{Slower compilation, steeper learning curve}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.tradeoff).toBe('Slower compilation, steeper learning curve');
      }
    });
  });

  describe('Decision with Context', () => {
    it('should parse decision with ->context file list', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->context[src/types.ts, src/config.ts]';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.context).toEqual(['src/types.ts', 'src/config.ts']);
      }
    });
  });

  describe('Decision with Status', () => {
    it('should parse decision with ->status{ACTIVE}', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->status{ACTIVE}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.status).toBe('ACTIVE');
      }
    });

    it('should parse decision with ->status{SUPERSEDED}', () => {
      const input = '@2024-12-27::UseJavaScript\n  ->status{SUPERSEDED}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.status).toBe('SUPERSEDED');
      }
    });

    it('should parse decision with ->status{RECONSIDERING}', () => {
      const input = '@2024-12-27::UseReact\n  ->status{RECONSIDERING}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.status).toBe('RECONSIDERING');
      }
    });
  });

  describe('Decision with SupersededBy', () => {
    it('should parse decision with ->supersededBy reference', () => {
      const input = '@2024-01-01::UseJavaScript\n  ->supersededBy{UseTypeScript}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.supersededBy).toBe('UseTypeScript');
      }
    });
  });

  describe('Decision with Revisit', () => {
    it('should parse decision with ->revisit condition', () => {
      const input = '@2024-12-27::UseTypeScript\n  ->revisit{When Node.js 22 is LTS}';
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.revisit).toBe('When Node.js 22 is LTS');
      }
    });
  });

  describe('Full Decision Declaration', () => {
    it('should parse decision with multiple clauses', () => {
      const input = `@2024-12-27::UseTypeScript
  ->alternatives["JavaScript", "Python"]
  ->reason{Better type safety}
  ->status{ACTIVE}`;
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.date).toBe('2024-12-27');
        expect(stmt.name).toBe('UseTypeScript');
        expect(stmt.alternatives).toEqual(['JavaScript', 'Python']);
        expect(stmt.reason).toBe('Better type safety');
        expect(stmt.status).toBe('ACTIVE');
      }
    });

    it('should parse complete decision with all clauses', () => {
      const input = `@2024-12-27::UseTypeScript
  ->alternatives["JavaScript"]
  ->reason{Type safety}
  ->tradeoff{Build time}
  ->context[src/index.ts]
  ->status{ACTIVE}
  ->revisit{After TS 6.0 release}`;
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.alternatives).toEqual(['JavaScript']);
        expect(stmt.reason).toBe('Type safety');
        expect(stmt.tradeoff).toBe('Build time');
        expect(stmt.context).toEqual(['src/index.ts']);
        expect(stmt.status).toBe('ACTIVE');
        expect(stmt.revisit).toBe('After TS 6.0 release');
      }
    });
  });

  describe('Multiple Decisions', () => {
    it('should parse multiple decisions in sequence', () => {
      const input = `@2024-12-27::UseTypeScript
@2024-12-01::UseVitest
@2024-11-15::UseMonorepo`;
      const doc = parseDoc(input);

      const decisions = doc.statements.filter(isDecisionDeclaration);
      expect(decisions.length).toBe(3);
      expect(decisions[0]!.name).toBe('UseTypeScript');
      expect(decisions[1]!.name).toBe('UseVitest');
      expect(decisions[2]!.name).toBe('UseMonorepo');
    });

    it('should parse decisions within a section', () => {
      const input = `[DECISIONS]
@2024-12-27::UseTypeScript
@2024-12-01::UseVitest`;
      const doc = parseDoc(input);

      const decisions = doc.statements.filter(isDecisionDeclaration);
      expect(decisions.length).toBe(2);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for decision', () => {
      const stmt = firstStatement('@2024-12-27::UseTypeScript');

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        expect(stmt.start.line).toBe(1);
        expect(stmt.start.column).toBe(1);
      }
    });

    it('should track positions on multiline decision', () => {
      const input = `@2024-12-27::UseTypeScript
  ->reason{Type safety}
  ->status{ACTIVE}`;
      const stmt = firstStatement(input);

      expect(isDecisionDeclaration(stmt)).toBe(true);
      if (isDecisionDeclaration(stmt)) {
        // End should be on line 3 after status
        expect(stmt.end.line).toBe(3);
      }
    });
  });
});
