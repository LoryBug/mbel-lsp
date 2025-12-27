/**
 * TDDAB#13: Lexer Tests for Intent Section Tokens
 *
 * Tests token recognition for the §intents section:
 * - Intent module prefix (@Module::)
 * - Arrow operators for intent properties
 */
import { describe, it, expect } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token } from '../src/types.js';

describe('Lexer: Intent Section (TDDAB#13)', () => {
  const lexer = new MbelLexer();

  const getTokens = (input: string): Token[] => {
    const result = lexer.tokenize(input);
    return result.tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE' && t.type !== 'EOF');
  };

  const getTokenTypes = (input: string): string[] => {
    return getTokens(input).map(t => t.type);
  };

  describe('Intent Module Prefix', () => {
    it('should tokenize @Module:: as INTENT_MODULE', () => {
      const tokens = getTokens('@Parser::StatementHandler');

      expect(tokens[0]?.type).toBe('INTENT_MODULE');
      expect(tokens[0]?.value).toBe('@Parser::');
    });

    it('should tokenize component name after module prefix', () => {
      const tokens = getTokens('@Parser::StatementHandler');

      expect(tokens.length).toBeGreaterThan(1);
      expect(tokens[1]?.type).toBe('IDENTIFIER');
      expect(tokens[1]?.value).toBe('StatementHandler');
    });

    it('should handle various module names', () => {
      const modules = ['@Lexer::', '@Analyzer::', '@Server::', '@QueryService::'];

      for (const module of modules) {
        const tokens = getTokens(module + 'Component');
        expect(tokens[0]?.type).toBe('INTENT_MODULE');
        expect(tokens[0]?.value).toBe(module);
      }
    });

    it('should not confuse with other prefixes', () => {
      // @critical:: is HEAT prefix
      const heatTokens = getTokens('@critical::src/file.ts');
      expect(heatTokens[0]?.type).toBe('HEAT_CRITICAL');

      // @entry:: is ANCHOR prefix
      const anchorTokens = getTokens('@entry::src/index.ts');
      expect(anchorTokens[0]?.type).toBe('ANCHOR_ENTRY');

      // @Parser:: is INTENT_MODULE
      const intentTokens = getTokens('@Parser::Handler');
      expect(intentTokens[0]?.type).toBe('INTENT_MODULE');
    });

    it('should handle CamelCase module names', () => {
      const tokens = getTokens('@QueryService::FeatureHandler');

      expect(tokens[0]?.type).toBe('INTENT_MODULE');
      expect(tokens[0]?.value).toBe('@QueryService::');
      expect(tokens[1]?.value).toBe('FeatureHandler');
    });
  });

  describe('Arrow Operators for Intents', () => {
    it('should tokenize ->does operator', () => {
      const types = getTokenTypes('->does');
      expect(types).toContain('ARROW_DOES');
    });

    it('should tokenize ->doesNot operator', () => {
      const types = getTokenTypes('->doesNot');
      expect(types).toContain('ARROW_DOES_NOT');
    });

    it('should tokenize ->contract operator', () => {
      const types = getTokenTypes('->contract');
      expect(types).toContain('ARROW_CONTRACT');
    });

    it('should tokenize ->singleResponsibility operator', () => {
      const types = getTokenTypes('->singleResponsibility');
      expect(types).toContain('ARROW_SINGLE_RESPONSIBILITY');
    });

    it('should tokenize ->antiPattern operator', () => {
      const types = getTokenTypes('->antiPattern');
      expect(types).toContain('ARROW_ANTI_PATTERN');
    });

    it('should tokenize ->extends operator', () => {
      const types = getTokenTypes('->extends');
      expect(types).toContain('ARROW_EXTENDS');
    });
  });

  describe('Intent with Metadata', () => {
    it('should tokenize intent with does clause', () => {
      const input = '@Parser::StatementHandler->does{Parse statements}';
      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('INTENT_MODULE');
      expect(types).toContain('ARROW_DOES');
      expect(types).toContain('STRUCT_METADATA');
    });

    it('should tokenize intent with doesNot clause', () => {
      const input = '->doesNot{Validate semantics}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_DOES_NOT');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize intent with contract clause', () => {
      const input = '->contract{Returns Statement | null}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_CONTRACT');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize intent with singleResponsibility clause', () => {
      const input = '->singleResponsibility{Statement parsing only}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_SINGLE_RESPONSIBILITY');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize intent with antiPattern clause', () => {
      const input = '->antiPattern{Global state mutation}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_ANTI_PATTERN');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize intent with extends list', () => {
      const input = '->extends[BaseHandler, Serializable]';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_EXTENDS');
      expect(tokens[1]?.type).toBe('STRUCT_LIST');
    });
  });

  describe('Complete Intent Declaration', () => {
    it('should tokenize multiline intent declaration', () => {
      const input = `@Parser::StatementHandler
  ->does{Parse MBEL statements}
  ->doesNot{Validate semantics}
  ->contract{Returns Statement}
  ->singleResponsibility{Parsing only}`;

      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('INTENT_MODULE');
      expect(types).toContain('ARROW_DOES');
      expect(types).toContain('ARROW_DOES_NOT');
      expect(types).toContain('ARROW_CONTRACT');
      expect(types).toContain('ARROW_SINGLE_RESPONSIBILITY');
    });

    it('should preserve position information', () => {
      const input = '@Lexer::TokenScanner';
      const tokens = getTokens(input);

      expect(tokens[0]?.start.line).toBe(1);
      expect(tokens[0]?.start.column).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle module with numbers', () => {
      const tokens = getTokens('@Parser2::Handler');

      expect(tokens[0]?.type).toBe('INTENT_MODULE');
      expect(tokens[0]?.value).toBe('@Parser2::');
    });

    it('should handle single-letter module name', () => {
      const tokens = getTokens('@A::B');

      expect(tokens[0]?.type).toBe('INTENT_MODULE');
      expect(tokens[0]?.value).toBe('@A::');
      expect(tokens[1]?.value).toBe('B');
    });

    it('should not match @lowercase:: as INTENT_MODULE (requires CamelCase)', () => {
      // Lowercase module names are NOT recognized as INTENT_MODULE
      // They fall through to other token patterns
      const tokens = getTokens('@parser::Handler');
      // Should NOT be INTENT_MODULE since it starts with lowercase
      expect(tokens[0]?.type).not.toBe('INTENT_MODULE');
    });
  });
});
