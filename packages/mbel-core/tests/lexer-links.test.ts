/**
 * TDDAB#9: CrossRefLinks - Lexer Tests (RED Phase)
 *
 * Tests for new tokens supporting §links section:
 * - Arrow operators: ->files, ->tests, ->docs, ->decisions, ->related
 * - Arrow operators: ->entryPoint, ->blueprint, ->depends
 * - Link markers: @feature{}, @task{}, {TO-CREATE}, {TO-MODIFY}
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token, TokenType } from '../src/types.js';

describe('MbelLexer: CrossRefLinks (TDDAB#9)', () => {
  let lexer: MbelLexer;

  beforeEach(() => {
    lexer = new MbelLexer();
  });

  // Helper to get token types from result
  const tokenTypes = (input: string): TokenType[] => {
    const result = lexer.tokenize(input);
    return result.tokens.map(t => t.type);
  };

  // Helper to get first token
  const firstToken = (input: string): Token => {
    const result = lexer.tokenize(input);
    return result.tokens[0]!;
  };

  // Helper to get all tokens except EOF
  const allTokens = (input: string): Token[] => {
    const result = lexer.tokenize(input);
    return result.tokens.filter(t => t.type !== 'EOF');
  };

  describe('Arrow Operators for Links', () => {
    it('should tokenize ->files as ARROW_FILES', () => {
      const token = firstToken('->files');
      expect(token.type).toBe('ARROW_FILES');
      expect(token.value).toBe('->files');
    });

    it('should tokenize ->tests as ARROW_TESTS', () => {
      const token = firstToken('->tests');
      expect(token.type).toBe('ARROW_TESTS');
      expect(token.value).toBe('->tests');
    });

    it('should tokenize ->docs as ARROW_DOCS', () => {
      const token = firstToken('->docs');
      expect(token.type).toBe('ARROW_DOCS');
      expect(token.value).toBe('->docs');
    });

    it('should tokenize ->decisions as ARROW_DECISIONS', () => {
      const token = firstToken('->decisions');
      expect(token.type).toBe('ARROW_DECISIONS');
      expect(token.value).toBe('->decisions');
    });

    it('should tokenize ->related as ARROW_RELATED', () => {
      const token = firstToken('->related');
      expect(token.type).toBe('ARROW_RELATED');
      expect(token.value).toBe('->related');
    });

    it('should tokenize ->entryPoint as ARROW_ENTRYPOINT', () => {
      const token = firstToken('->entryPoint');
      expect(token.type).toBe('ARROW_ENTRYPOINT');
      expect(token.value).toBe('->entryPoint');
    });

    it('should tokenize ->blueprint as ARROW_BLUEPRINT', () => {
      const token = firstToken('->blueprint');
      expect(token.type).toBe('ARROW_BLUEPRINT');
      expect(token.value).toBe('->blueprint');
    });

    it('should tokenize ->depends as ARROW_DEPENDS', () => {
      const token = firstToken('->depends');
      expect(token.type).toBe('ARROW_DEPENDS');
      expect(token.value).toBe('->depends');
    });

    it('should tokenize ->features as ARROW_FEATURES', () => {
      const token = firstToken('->features');
      expect(token.type).toBe('ARROW_FEATURES');
      expect(token.value).toBe('->features');
    });

    it('should tokenize ->why as ARROW_WHY', () => {
      const token = firstToken('->why');
      expect(token.type).toBe('ARROW_WHY');
      expect(token.value).toBe('->why');
    });
  });

  describe('Arrow with Brackets', () => {
    it('should tokenize ->files[...] as ARROW_FILES followed by STRUCT_LIST', () => {
      const tokens = allTokens('->files[src/index.ts]');
      expect(tokens.length).toBe(2);
      expect(tokens[0]!.type).toBe('ARROW_FILES');
      expect(tokens[1]!.type).toBe('STRUCT_LIST');
      expect(tokens[1]!.value).toBe('[src/index.ts]');
    });

    it('should tokenize ->tests[...] with multiple paths', () => {
      const tokens = allTokens('->tests[tests/a.test.ts,tests/b.test.ts]');
      expect(tokens.length).toBe(2);
      expect(tokens[0]!.type).toBe('ARROW_TESTS');
      expect(tokens[1]!.type).toBe('STRUCT_LIST');
    });

    it('should tokenize ->blueprint[...] with string items', () => {
      const tokens = allTokens('->blueprint["Step 1","Step 2"]');
      expect(tokens.length).toBe(2);
      expect(tokens[0]!.type).toBe('ARROW_BLUEPRINT');
      expect(tokens[1]!.type).toBe('STRUCT_LIST');
    });
  });

  describe('Link Type Markers', () => {
    it('should tokenize @feature as LINK_FEATURE', () => {
      const tokens = allTokens('@feature{GoToDefinition}');
      expect(tokens[0]!.type).toBe('LINK_FEATURE');
      expect(tokens[0]!.value).toBe('@feature');
    });

    it('should tokenize @task as LINK_TASK', () => {
      const tokens = allTokens('@task{RenameSymbol}');
      expect(tokens[0]!.type).toBe('LINK_TASK');
      expect(tokens[0]!.value).toBe('@task');
    });
  });

  describe('File Status Markers', () => {
    it('should recognize TO-CREATE marker in metadata', () => {
      const tokens = allTokens('{TO-CREATE}');
      expect(tokens.length).toBe(1);
      expect(tokens[0]!.type).toBe('STRUCT_METADATA');
      expect(tokens[0]!.value).toContain('TO-CREATE');
    });

    it('should recognize TO-MODIFY marker in metadata', () => {
      const tokens = allTokens('{TO-MODIFY}');
      expect(tokens.length).toBe(1);
      expect(tokens[0]!.type).toBe('STRUCT_METADATA');
      expect(tokens[0]!.value).toContain('TO-MODIFY');
    });
  });

  describe('Complex Link Declarations', () => {
    it('should tokenize complete feature link', () => {
      const input = '@feature{Lexer}->files[src/lexer.ts]->tests[tests/lexer.test.ts]';
      const tokens = allTokens(input);

      expect(tokens[0]!.type).toBe('LINK_FEATURE');
      expect(tokens[1]!.type).toBe('STRUCT_METADATA');
      expect(tokens[2]!.type).toBe('ARROW_FILES');
      expect(tokens[3]!.type).toBe('STRUCT_LIST');
      expect(tokens[4]!.type).toBe('ARROW_TESTS');
      expect(tokens[5]!.type).toBe('STRUCT_LIST');
    });

    it('should tokenize task link with blueprint', () => {
      const input = '@task{AddFeature}->depends[OtherFeature]->blueprint["Step 1"]';
      const tokens = allTokens(input);

      expect(tokens[0]!.type).toBe('LINK_TASK');
      expect(tokens[1]!.type).toBe('STRUCT_METADATA');
      expect(tokens[2]!.type).toBe('ARROW_DEPENDS');
      expect(tokens[3]!.type).toBe('STRUCT_LIST');
      expect(tokens[4]!.type).toBe('ARROW_BLUEPRINT');
      expect(tokens[5]!.type).toBe('STRUCT_LIST');
    });
  });

  describe('Edge Cases', () => {
    it('should not confuse -> with RELATION_LEADS_TO (→)', () => {
      const tokens = allTokens('A→B');
      expect(tokens[1]!.type).toBe('RELATION_LEADS_TO');
      expect(tokens[1]!.value).toBe('→');
    });

    it('should handle -> followed by unknown keyword as separate tokens', () => {
      const tokens = allTokens('->unknown');
      // Should tokenize as RELATION_REMOVE (-) then TEMPORAL_PAST (>) then IDENTIFIER
      // OR as ARROW_UNKNOWN if we want to be flexible
      expect(tokens.length).toBeGreaterThanOrEqual(1);
    });

    it('should tokenize arrow operators case-sensitively', () => {
      const tokens1 = allTokens('->files');
      const tokens2 = allTokens('->FILES');

      expect(tokens1[0]!.type).toBe('ARROW_FILES');
      // ->FILES should NOT be ARROW_FILES (case sensitive)
      expect(tokens2[0]!.type).not.toBe('ARROW_FILES');
    });

    it('should handle whitespace between -> and keyword', () => {
      const tokens = allTokens('-> files');
      // With space, should be separate tokens, not ARROW_FILES
      expect(tokens[0]!.type).not.toBe('ARROW_FILES');
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for arrow operators', () => {
      const token = firstToken('->files');
      expect(token.start.column).toBe(1);
      expect(token.end.column).toBe(8); // ->files is 7 chars, end is exclusive
    });

    it('should track positions in multiline input', () => {
      const input = '@feature{Test}\n->files[a.ts]';
      const tokens = allTokens(input);

      const arrowToken = tokens.find(t => t.type === 'ARROW_FILES');
      expect(arrowToken).toBeDefined();
      expect(arrowToken!.start.line).toBe(2);
      expect(arrowToken!.start.column).toBe(1);
    });
  });
});
