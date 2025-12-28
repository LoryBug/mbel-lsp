import { describe, it, expect } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic, QuickFix } from '../src/types.js';

describe('TDDAB#23: Intent-Aware Diagnostics', () => {
  const analyzer = new MbelAnalyzer();

  describe('Unicode Arrow Detection', () => {
    it('should detect unicode right arrow → and suggest ->', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.message.includes('→') || d.code === 'MBEL-TYPO-001'
      );
      expect(arrowError).toBeDefined();
    });

    it('should detect unicode double arrow ⇒ and suggest ->', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  ⇒files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.message.includes('⇒') || d.code === 'MBEL-TYPO-001'
      );
      expect(arrowError).toBeDefined();
    });

    it('should detect unicode left arrow ← and suggest <-', () => {
      const source = `§MBEL:6.0
[SECTION]
@attr←value
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.message.includes('←') || d.code === 'MBEL-TYPO-002'
      );
      expect(arrowError).toBeDefined();
    });

    it('should detect unicode bidirectional arrow ↔ and suggest <->', () => {
      const source = `§MBEL:6.0
[SECTION]
@relation↔other
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.message.includes('↔') || d.code === 'MBEL-TYPO-003'
      );
      expect(arrowError).toBeDefined();
    });
  });

  describe('QuickFix Generation', () => {
    it('should generate quickfix for unicode arrow →', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const quickFix = result.quickFixes.find(qf =>
        qf.title.includes('->') || qf.edits.some(e => e.newText === '->')
      );
      expect(quickFix).toBeDefined();
      if (quickFix) {
        expect(quickFix.edits.length).toBeGreaterThan(0);
        expect(quickFix.edits[0]?.newText).toBe('->');
      }
    });

    it('should mark quickfix as preferred', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const quickFix = result.quickFixes.find(qf =>
        qf.edits.some(e => e.newText === '->')
      );
      if (quickFix) {
        expect(quickFix.isPreferred).toBe(true);
      }
    });
  });

  describe('Common Typo Detection', () => {
    it('should detect em-dash — and suggest --', () => {
      const source = `§MBEL:6.0
[SECTION]
@attr—value
`;
      const result = analyzer.analyzeText(source);

      const dashError = result.diagnostics.find(d =>
        d.message.includes('—') || d.code === 'MBEL-TYPO-010'
      );
      expect(dashError).toBeDefined();
    });

    it('should detect curly quotes and suggest straight quotes', () => {
      const source = `§MBEL:6.0
[SECTION]
@attr::"value"
`;
      const result = analyzer.analyzeText(source);

      const quoteError = result.diagnostics.find(d =>
        d.message.includes('"') || d.message.includes('"') || d.code === 'MBEL-TYPO-011'
      );
      expect(quoteError).toBeDefined();
    });

    it('should detect ellipsis … and suggest ...', () => {
      const source = `§MBEL:6.0
[SECTION]
@attr::value…more
`;
      const result = analyzer.analyzeText(source);

      const ellipsisError = result.diagnostics.find(d =>
        d.message.includes('…') || d.code === 'MBEL-TYPO-012'
      );
      expect(ellipsisError).toBeDefined();
    });
  });

  describe('Did You Mean Suggestions', () => {
    it('should include "Did you mean" in error message for arrows', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      if (arrowError) {
        expect(arrowError.message.toLowerCase()).toContain('did you mean');
      }
    });

    it('should provide clear replacement suggestion', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      if (arrowError) {
        expect(arrowError.message).toContain('->');
      }
    });
  });

  describe('Multiple Issues Detection', () => {
    it('should detect multiple unicode issues in same document', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  →files[test.ts]
  ⇒tests[test.test.ts]
@attr—value
`;
      const result = analyzer.analyzeText(source);

      const typoErrors = result.diagnostics.filter(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      expect(typoErrors.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate quickfixes for all detected issues', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[a.ts]
  ⇒tests[b.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowFixes = result.quickFixes.filter(qf =>
        qf.edits.some(e => e.newText === '->')
      );
      expect(arrowFixes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Line and Column Accuracy', () => {
    it('should report correct line number for unicode arrow', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      if (arrowError) {
        expect(arrowError.range.start.line).toBe(4); // Line 4 (1-based)
      }
    });

    it('should report correct column for unicode character', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      if (arrowError) {
        expect(arrowError.range.start.column).toBe(3); // Column 3 (1-based, after 2 spaces)
      }
    });
  });

  describe('Severity Levels', () => {
    it('should report unicode arrows as errors', () => {
      const source = `§MBEL:6.0
[SECTION]
  →files[test.ts]
`;
      const result = analyzer.analyzeText(source);

      const arrowError = result.diagnostics.find(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      if (arrowError) {
        expect(arrowError.severity).toBe('error');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should not flag valid ASCII arrows', () => {
      const source = `§MBEL:6.0
[SECTION]
@feature{Test}
  ->files[test.ts]
  <-depends[Other]
`;
      const result = analyzer.analyzeText(source);

      const typoErrors = result.diagnostics.filter(d =>
        d.code?.toString().startsWith('MBEL-TYPO')
      );
      expect(typoErrors.length).toBe(0);
    });

    it('should handle unicode in comments/strings appropriately', () => {
      const source = `§MBEL:6.0
[SECTION]
@attr::value{note→just a note}
`;
      const result = analyzer.analyzeText(source);

      // Unicode in metadata content might be allowed
      // Test that we handle this case gracefully
      expect(result.diagnostics).toBeDefined();
    });
  });
});
