/**
 * TDDAB#10: SemanticAnchors - Lexer Tests (RED Phase)
 *
 * Tests for new tokens supporting §anchors section:
 * - Arrow operator: ->descrizione
 * - Anchor prefixes: @entry::, @hotspot::, @boundary::
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token, TokenType } from '../src/types.js';

describe('MbelLexer: SemanticAnchors (TDDAB#10)', () => {
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

  describe('Arrow Operator for Anchors', () => {
    it('should tokenize ->descrizione as ARROW_DESCRIZIONE', () => {
      const token = firstToken('->descrizione');
      expect(token.type).toBe('ARROW_DESCRIZIONE');
      expect(token.value).toBe('->descrizione');
    });

    it('should tokenize ->descrizione followed by value', () => {
      const tokens = allTokens('->descrizione::Main entry point');
      expect(tokens[0]!.type).toBe('ARROW_DESCRIZIONE');
      expect(tokens[1]!.type).toBe('RELATION_DEFINES'); // :: is RELATION_DEFINES in MBEL
    });
  });

  describe('Anchor Prefix Tokens', () => {
    it('should tokenize @entry:: as ANCHOR_ENTRY', () => {
      const token = firstToken('@entry::');
      expect(token.type).toBe('ANCHOR_ENTRY');
      expect(token.value).toBe('@entry::');
    });

    it('should tokenize @hotspot:: as ANCHOR_HOTSPOT', () => {
      const token = firstToken('@hotspot::');
      expect(token.type).toBe('ANCHOR_HOTSPOT');
      expect(token.value).toBe('@hotspot::');
    });

    it('should tokenize @boundary:: as ANCHOR_BOUNDARY', () => {
      const token = firstToken('@boundary::');
      expect(token.type).toBe('ANCHOR_BOUNDARY');
      expect(token.value).toBe('@boundary::');
    });
  });

  describe('Anchor with Path', () => {
    it('should tokenize @entry:: followed by path', () => {
      const tokens = allTokens('@entry::src/index.ts');
      expect(tokens[0]!.type).toBe('ANCHOR_ENTRY');
      expect(tokens[0]!.value).toBe('@entry::');
      // Path follows as identifier or path token
      expect(tokens.length).toBeGreaterThanOrEqual(2);
    });

    it('should tokenize @hotspot:: followed by path', () => {
      const tokens = allTokens('@hotspot::src/core/parser.ts');
      expect(tokens[0]!.type).toBe('ANCHOR_HOTSPOT');
      expect(tokens.length).toBeGreaterThanOrEqual(2);
    });

    it('should tokenize anchor with glob pattern path', () => {
      const tokens = allTokens('@entry::src/**/*.ts');
      expect(tokens[0]!.type).toBe('ANCHOR_ENTRY');
      expect(tokens.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Complete Anchor Declarations', () => {
    it('should tokenize full anchor with description', () => {
      const input = '@entry::src/index.ts\n  ->descrizione::Main application entry';
      const tokens = allTokens(input);

      const anchorToken = tokens.find(t => t.type === 'ANCHOR_ENTRY');
      const descToken = tokens.find(t => t.type === 'ARROW_DESCRIZIONE');

      expect(anchorToken).toBeDefined();
      expect(descToken).toBeDefined();
    });

    it('should tokenize multiple anchors in sequence', () => {
      const input = '@entry::src/a.ts\n@hotspot::src/b.ts\n@boundary::src/c.ts';
      const tokens = allTokens(input);

      const entryTokens = tokens.filter(t => t.type === 'ANCHOR_ENTRY');
      const hotspotTokens = tokens.filter(t => t.type === 'ANCHOR_HOTSPOT');
      const boundaryTokens = tokens.filter(t => t.type === 'ANCHOR_BOUNDARY');

      expect(entryTokens.length).toBe(1);
      expect(hotspotTokens.length).toBe(1);
      expect(boundaryTokens.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should not confuse @entry with @entry:: (requires ::)', () => {
      const tokens = allTokens('@entry');
      // Without ::, should NOT be ANCHOR_ENTRY
      expect(tokens[0]!.type).not.toBe('ANCHOR_ENTRY');
    });

    it('should handle @entry:: case-sensitively', () => {
      const tokens1 = allTokens('@entry::');
      const tokens2 = allTokens('@ENTRY::');

      expect(tokens1[0]!.type).toBe('ANCHOR_ENTRY');
      // @ENTRY:: should NOT be ANCHOR_ENTRY (case sensitive)
      expect(tokens2[0]!.type).not.toBe('ANCHOR_ENTRY');
    });

    it('should not tokenize @entrypoint:: as ANCHOR_ENTRY', () => {
      const tokens = allTokens('@entrypoint::');
      // Different keyword, should not match
      expect(tokens[0]!.type).not.toBe('ANCHOR_ENTRY');
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for anchor tokens', () => {
      const token = firstToken('@entry::');
      expect(token.start.line).toBe(1);
      expect(token.start.column).toBe(1);
      expect(token.end.column).toBe(9); // @entry:: is 8 chars, end is exclusive
    });

    it('should track positions in multiline input', () => {
      const input = '[ANCHORS]\n@entry::src/index.ts';
      const tokens = allTokens(input);

      const anchorToken = tokens.find(t => t.type === 'ANCHOR_ENTRY');
      expect(anchorToken).toBeDefined();
      expect(anchorToken!.start.line).toBe(2);
      expect(anchorToken!.start.column).toBe(1);
    });
  });
});
