/**
 * TDDAB#11: Lexer Tests for Decision Section Tokens
 *
 * Tests token recognition for the extended §decisions section:
 * - Decision date prefix (@YYYY-MM-DD::)
 * - Arrow operators for decision properties
 */
import { describe, it, expect } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token } from '../src/types.js';

describe('Lexer: Decisions Section Extended (TDDAB#11)', () => {
  const lexer = new MbelLexer();

  const getTokens = (input: string): Token[] => {
    const result = lexer.tokenize(input);
    return result.tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE' && t.type !== 'EOF');
  };

  const getTokenTypes = (input: string): string[] => {
    return getTokens(input).map(t => t.type);
  };

  describe('Decision Date Prefix', () => {
    it('should tokenize @YYYY-MM-DD:: as DECISION_DATE', () => {
      const tokens = getTokens('@2024-12-27::UseTypeScript');

      expect(tokens[0]?.type).toBe('DECISION_DATE');
      expect(tokens[0]?.value).toBe('@2024-12-27::');
    });

    it('should tokenize decision name after date prefix', () => {
      const tokens = getTokens('@2024-12-27::UseTypeScript');

      expect(tokens.length).toBe(2);
      expect(tokens[1]?.type).toBe('IDENTIFIER');
      expect(tokens[1]?.value).toBe('UseTypeScript');
    });

    it('should handle various date formats', () => {
      const dates = ['@2024-01-01::', '@2023-12-31::', '@2025-06-15::'];

      for (const date of dates) {
        const tokens = getTokens(date + 'DecisionName');
        expect(tokens[0]?.type).toBe('DECISION_DATE');
        expect(tokens[0]?.value).toBe(date);
      }
    });

    it('should not tokenize invalid date as DECISION_DATE', () => {
      // Invalid month
      const tokens1 = getTokens('@2024-13-01::Name');
      expect(tokens1[0]?.type).not.toBe('DECISION_DATE');

      // Invalid day
      const tokens2 = getTokens('@2024-12-32::Name');
      expect(tokens2[0]?.type).not.toBe('DECISION_DATE');
    });
  });

  describe('Arrow Operators for Decisions', () => {
    it('should tokenize ->alternatives operator', () => {
      const types = getTokenTypes('->alternatives');
      expect(types).toContain('ARROW_ALTERNATIVES');
    });

    it('should tokenize ->reason operator', () => {
      const types = getTokenTypes('->reason');
      expect(types).toContain('ARROW_REASON');
    });

    it('should tokenize ->tradeoff operator', () => {
      const types = getTokenTypes('->tradeoff');
      expect(types).toContain('ARROW_TRADEOFF');
    });

    it('should tokenize ->context operator', () => {
      const types = getTokenTypes('->context');
      expect(types).toContain('ARROW_CONTEXT');
    });

    it('should tokenize ->status operator', () => {
      const types = getTokenTypes('->status');
      expect(types).toContain('ARROW_STATUS');
    });

    it('should tokenize ->revisit operator', () => {
      const types = getTokenTypes('->revisit');
      expect(types).toContain('ARROW_REVISIT');
    });

    it('should tokenize ->supersededBy operator', () => {
      const types = getTokenTypes('->supersededBy');
      expect(types).toContain('ARROW_SUPERSEDED_BY');
    });
  });

  describe('Decision with Metadata', () => {
    it('should tokenize full decision line', () => {
      const input = '@2024-12-27::UseTypeScript->status{ACTIVE}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('DECISION_DATE');
      expect(tokens[1]?.type).toBe('IDENTIFIER');
      expect(tokens[2]?.type).toBe('ARROW_STATUS');
      expect(tokens[3]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize decision with alternatives list', () => {
      const input = '->alternatives["JavaScript", "Python", "Go"]';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_ALTERNATIVES');
      expect(tokens[1]?.type).toBe('STRUCT_LIST');
    });

    it('should tokenize decision with reason', () => {
      const input = '->reason{Better type safety and tooling}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_REASON');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize decision with context files', () => {
      const input = '->context[src/types.ts, src/config.ts]';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_CONTEXT');
      expect(tokens[1]?.type).toBe('STRUCT_LIST');
    });

    it('should tokenize decision with supersededBy reference', () => {
      const input = '->supersededBy{UseTypeScript5}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_SUPERSEDED_BY');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize decision with revisit condition', () => {
      const input = '->revisit{When Node.js 22 is LTS}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_REVISIT');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });
  });

  describe('Complete Decision Declaration', () => {
    it('should tokenize multiline decision declaration', () => {
      const input = `@2024-12-27::UseTypeScript
  ->alternatives["JavaScript", "Python"]
  ->reason{Better type safety}
  ->status{ACTIVE}`;

      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('DECISION_DATE');
      expect(types).toContain('ARROW_ALTERNATIVES');
      expect(types).toContain('ARROW_REASON');
      expect(types).toContain('ARROW_STATUS');
    });

    it('should preserve position information', () => {
      const input = '@2024-12-27::UseTypeScript';
      const tokens = getTokens(input);

      expect(tokens[0]?.start.line).toBe(1);
      expect(tokens[0]?.start.column).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle decision with hyphenated name', () => {
      const tokens = getTokens('@2024-12-27::Use-TypeScript-Strict');

      expect(tokens[0]?.type).toBe('DECISION_DATE');
      expect(tokens[1]?.value).toContain('Use');
    });

    it('should not confuse @date:: with @entry::', () => {
      const dateTokens = getTokens('@2024-12-27::Decision');
      const entryTokens = getTokens('@entry::src/index.ts');

      expect(dateTokens[0]?.type).toBe('DECISION_DATE');
      expect(entryTokens[0]?.type).toBe('ANCHOR_ENTRY');
    });

    it('should handle status values', () => {
      const statuses = ['ACTIVE', 'SUPERSEDED', 'RECONSIDERING'];

      for (const status of statuses) {
        const tokens = getTokens(`->status{${status}}`);
        expect(tokens[0]?.type).toBe('ARROW_STATUS');
        expect(tokens[1]?.value).toContain(status);
      }
    });
  });
});
