/**
 * TDDAB#12: Lexer Tests for Heat Section Tokens
 *
 * Tests token recognition for the §heat section:
 * - Heat type prefixes (@critical::, @stable::, @volatile::, @hot::)
 * - Arrow operators for heat properties
 */
import { describe, it, expect } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token } from '../src/types.js';

describe('Lexer: Heat Section (TDDAB#12)', () => {
  const lexer = new MbelLexer();

  const getTokens = (input: string): Token[] => {
    const result = lexer.tokenize(input);
    return result.tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE' && t.type !== 'EOF');
  };

  const getTokenTypes = (input: string): string[] => {
    return getTokens(input).map(t => t.type);
  };

  describe('Heat Type Prefixes', () => {
    it('should tokenize @critical:: as HEAT_CRITICAL', () => {
      const tokens = getTokens('@critical::src/core/engine.ts');

      expect(tokens[0]?.type).toBe('HEAT_CRITICAL');
      expect(tokens[0]?.value).toBe('@critical::');
    });

    it('should tokenize @stable:: as HEAT_STABLE', () => {
      const tokens = getTokens('@stable::src/utils/constants.ts');

      expect(tokens[0]?.type).toBe('HEAT_STABLE');
      expect(tokens[0]?.value).toBe('@stable::');
    });

    it('should tokenize @volatile:: as HEAT_VOLATILE', () => {
      const tokens = getTokens('@volatile::src/features/new-feature.ts');

      expect(tokens[0]?.type).toBe('HEAT_VOLATILE');
      expect(tokens[0]?.value).toBe('@volatile::');
    });

    it('should tokenize @hot:: as HEAT_HOT', () => {
      const tokens = getTokens('@hot::src/api/endpoints.ts');

      expect(tokens[0]?.type).toBe('HEAT_HOT');
      expect(tokens[0]?.value).toBe('@hot::');
    });

    it('should tokenize path after heat prefix', () => {
      const tokens = getTokens('@critical::src/core/engine.ts');

      expect(tokens.length).toBeGreaterThan(1);
      // Path segments are tokenized as separate tokens
      expect(tokens.some(t => t.value === 'src')).toBe(true);
    });
  });

  describe('Arrow Operators for Heat', () => {
    it('should tokenize ->dependents operator', () => {
      const types = getTokenTypes('->dependents');
      expect(types).toContain('ARROW_DEPENDENTS');
    });

    it('should tokenize ->untouched operator', () => {
      const types = getTokenTypes('->untouched');
      expect(types).toContain('ARROW_UNTOUCHED');
    });

    it('should tokenize ->changes operator', () => {
      const types = getTokenTypes('->changes');
      expect(types).toContain('ARROW_CHANGES');
    });

    it('should tokenize ->coverage operator', () => {
      const types = getTokenTypes('->coverage');
      expect(types).toContain('ARROW_COVERAGE');
    });

    it('should tokenize ->confidence operator', () => {
      const types = getTokenTypes('->confidence');
      expect(types).toContain('ARROW_CONFIDENCE');
    });

    it('should tokenize ->impact operator', () => {
      const types = getTokenTypes('->impact');
      expect(types).toContain('ARROW_IMPACT');
    });

    it('should tokenize ->caution operator', () => {
      const types = getTokenTypes('->caution');
      expect(types).toContain('ARROW_CAUTION');
    });
  });

  describe('Heat with Metadata', () => {
    it('should tokenize heat with dependents list', () => {
      const input = '@critical::src/core/engine.ts->dependents[ModuleA, ModuleB]';
      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('HEAT_CRITICAL');
      expect(types).toContain('ARROW_DEPENDENTS');
      expect(types).toContain('STRUCT_LIST');
    });

    it('should tokenize heat with changes count', () => {
      const input = '->changes{12}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_CHANGES');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize heat with coverage percentage', () => {
      const input = '->coverage{85%}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_COVERAGE');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize heat with confidence level', () => {
      const input = '->confidence{high}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_CONFIDENCE');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize heat with untouched duration', () => {
      const input = '->untouched{6months}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_UNTOUCHED');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize heat with impact level', () => {
      const input = '->impact{high}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_IMPACT');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });

    it('should tokenize heat with caution message', () => {
      const input = '->caution{Requires full regression testing}';
      const tokens = getTokens(input);

      expect(tokens[0]?.type).toBe('ARROW_CAUTION');
      expect(tokens[1]?.type).toBe('STRUCT_METADATA');
    });
  });

  describe('Complete Heat Declaration', () => {
    it('should tokenize multiline heat declaration', () => {
      const input = `@critical::src/core/engine.ts
  ->dependents[ModuleA, ModuleB]
  ->changes{12}
  ->coverage{85%}
  ->confidence{high}`;

      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('HEAT_CRITICAL');
      expect(types).toContain('ARROW_DEPENDENTS');
      expect(types).toContain('ARROW_CHANGES');
      expect(types).toContain('ARROW_COVERAGE');
      expect(types).toContain('ARROW_CONFIDENCE');
    });

    it('should preserve position information', () => {
      const input = '@hot::src/api/endpoints.ts';
      const tokens = getTokens(input);

      expect(tokens[0]?.start.line).toBe(1);
      expect(tokens[0]?.start.column).toBe(1);
    });

    it('should handle volatile file declaration', () => {
      const input = '@volatile::src/features/experimental.ts->untouched{2days}';
      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('HEAT_VOLATILE');
      expect(types).toContain('ARROW_UNTOUCHED');
    });

    it('should handle stable file declaration', () => {
      const input = '@stable::src/utils/constants.ts->untouched{1year}';
      const tokens = getTokens(input);
      const types = tokens.map(t => t.type);

      expect(types).toContain('HEAT_STABLE');
      expect(types).toContain('ARROW_UNTOUCHED');
    });
  });

  describe('Edge Cases', () => {
    it('should not confuse @critical:: with @entry::', () => {
      const criticalTokens = getTokens('@critical::src/core.ts');
      const entryTokens = getTokens('@entry::src/index.ts');

      expect(criticalTokens[0]?.type).toBe('HEAT_CRITICAL');
      expect(entryTokens[0]?.type).toBe('ANCHOR_ENTRY');
    });

    it('should not confuse @stable:: with @status', () => {
      const stableTokens = getTokens('@stable::src/constants.ts');
      const statusTokens = getTokens('->status{ACTIVE}');

      expect(stableTokens[0]?.type).toBe('HEAT_STABLE');
      expect(statusTokens[0]?.type).toBe('ARROW_STATUS');
    });

    it('should handle glob patterns in paths', () => {
      const tokens = getTokens('@hot::src/**/*.ts');
      expect(tokens[0]?.type).toBe('HEAT_HOT');
    });

    it('should handle all heat prefixes without path', () => {
      const prefixes = ['@critical::', '@stable::', '@volatile::', '@hot::'];
      const expectedTypes = ['HEAT_CRITICAL', 'HEAT_STABLE', 'HEAT_VOLATILE', 'HEAT_HOT'];

      prefixes.forEach((prefix, index) => {
        const tokens = getTokens(prefix);
        expect(tokens[0]?.type).toBe(expectedTypes[index]);
      });
    });
  });
});
