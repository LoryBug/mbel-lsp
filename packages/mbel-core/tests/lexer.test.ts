import { describe, it, expect, beforeEach } from 'vitest';
import { MbelLexer } from '../src/lexer.js';
import type { Token, TokenType } from '../src/types.js';

describe('MbelLexer', () => {
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

  describe('Temporal Operators [4]', () => {
    it('should tokenize > as TEMPORAL_PAST', () => {
      const token = firstToken('>');
      expect(token.type).toBe('TEMPORAL_PAST');
      expect(token.value).toBe('>');
    });

    it('should tokenize @ as TEMPORAL_PRESENT', () => {
      const token = firstToken('@');
      expect(token.type).toBe('TEMPORAL_PRESENT');
      expect(token.value).toBe('@');
    });

    it('should tokenize ? as TEMPORAL_FUTURE', () => {
      const token = firstToken('?');
      expect(token.type).toBe('TEMPORAL_FUTURE');
      expect(token.value).toBe('?');
    });

    it('should tokenize ≈ as TEMPORAL_APPROX', () => {
      const token = firstToken('≈');
      expect(token.type).toBe('TEMPORAL_APPROX');
      expect(token.value).toBe('≈');
    });
  });

  describe('State Operators [4]', () => {
    it('should tokenize ✓ as STATE_COMPLETE', () => {
      const token = firstToken('✓');
      expect(token.type).toBe('STATE_COMPLETE');
      expect(token.value).toBe('✓');
    });

    it('should tokenize ✗ as STATE_FAILED', () => {
      const token = firstToken('✗');
      expect(token.type).toBe('STATE_FAILED');
      expect(token.value).toBe('✗');
    });

    it('should tokenize ! as STATE_CRITICAL', () => {
      const token = firstToken('!');
      expect(token.type).toBe('STATE_CRITICAL');
      expect(token.value).toBe('!');
    });

    it('should tokenize ⚡ as STATE_ACTIVE', () => {
      const token = firstToken('⚡');
      expect(token.type).toBe('STATE_ACTIVE');
      expect(token.value).toBe('⚡');
    });
  });

  describe('Relation Operators [6]', () => {
    it('should tokenize :: as RELATION_DEFINES', () => {
      const token = firstToken('::');
      expect(token.type).toBe('RELATION_DEFINES');
      expect(token.value).toBe('::');
    });

    it('should tokenize → as RELATION_LEADS_TO', () => {
      const token = firstToken('→');
      expect(token.type).toBe('RELATION_LEADS_TO');
      expect(token.value).toBe('→');
    });

    it('should tokenize ← as RELATION_FROM', () => {
      const token = firstToken('←');
      expect(token.type).toBe('RELATION_FROM');
      expect(token.value).toBe('←');
    });

    it('should tokenize ↔ as RELATION_MUTUAL', () => {
      const token = firstToken('↔');
      expect(token.type).toBe('RELATION_MUTUAL');
      expect(token.value).toBe('↔');
    });

    it('should tokenize + as RELATION_AND', () => {
      const token = firstToken('+');
      expect(token.type).toBe('RELATION_AND');
      expect(token.value).toBe('+');
    });

    it('should tokenize - as RELATION_REMOVE', () => {
      const token = firstToken('-');
      expect(token.type).toBe('RELATION_REMOVE');
      expect(token.value).toBe('-');
    });
  });

  describe('Structure Operators [5]', () => {
    it('should tokenize [] as STRUCT_SECTION with content', () => {
      const result = lexer.tokenize('[Section]');
      expect(result.tokens[0]!.type).toBe('STRUCT_SECTION');
      expect(result.tokens[0]!.value).toBe('[Section]');
    });

    it('should tokenize {} as STRUCT_METADATA with content', () => {
      const result = lexer.tokenize('{meta:value}');
      expect(result.tokens[0]!.type).toBe('STRUCT_METADATA');
      expect(result.tokens[0]!.value).toBe('{meta:value}');
    });

    it('should tokenize () as STRUCT_NOTE with content', () => {
      const result = lexer.tokenize('(note here)');
      expect(result.tokens[0]!.type).toBe('STRUCT_NOTE');
      expect(result.tokens[0]!.value).toBe('(note here)');
    });

    it('should tokenize | as STRUCT_OR', () => {
      const token = firstToken('|');
      expect(token.type).toBe('STRUCT_OR');
      expect(token.value).toBe('|');
    });

    it('should tokenize <> as STRUCT_VARIANT with content', () => {
      const result = lexer.tokenize('<template>');
      expect(result.tokens[0]!.type).toBe('STRUCT_VARIANT');
      expect(result.tokens[0]!.value).toBe('<template>');
    });
  });

  describe('Quantification Operators [3]', () => {
    it('should tokenize # as QUANT_NUMBER', () => {
      const token = firstToken('#');
      expect(token.type).toBe('QUANT_NUMBER');
      expect(token.value).toBe('#');
    });

    it('should tokenize % as QUANT_PERCENT', () => {
      const token = firstToken('%');
      expect(token.type).toBe('QUANT_PERCENT');
      expect(token.value).toBe('%');
    });

    it('should tokenize ~ as QUANT_RANGE', () => {
      const token = firstToken('~');
      expect(token.type).toBe('QUANT_RANGE');
      expect(token.value).toBe('~');
    });
  });

  describe('Logic Operators [3]', () => {
    it('should tokenize & as LOGIC_AND', () => {
      const token = firstToken('&');
      expect(token.type).toBe('LOGIC_AND');
      expect(token.value).toBe('&');
    });

    it('should tokenize || as LOGIC_OR', () => {
      const token = firstToken('||');
      expect(token.type).toBe('LOGIC_OR');
      expect(token.value).toBe('||');
    });

    it('should tokenize ¬ as LOGIC_NOT', () => {
      const token = firstToken('¬');
      expect(token.type).toBe('LOGIC_NOT');
      expect(token.value).toBe('¬');
    });
  });

  describe('Meta Operators [2]', () => {
    it('should tokenize © as META_SOURCE', () => {
      const token = firstToken('©');
      expect(token.type).toBe('META_SOURCE');
      expect(token.value).toBe('©');
    });

    it('should tokenize § as META_VERSION', () => {
      const token = firstToken('§');
      expect(token.type).toBe('META_VERSION');
      expect(token.value).toBe('§');
    });
  });

  describe('Identifiers (CamelCase)', () => {
    it('should tokenize CamelCase identifiers', () => {
      const token = firstToken('UserService');
      expect(token.type).toBe('IDENTIFIER');
      expect(token.value).toBe('UserService');
    });

    it('should tokenize simple identifiers', () => {
      const token = firstToken('name');
      expect(token.type).toBe('IDENTIFIER');
      expect(token.value).toBe('name');
    });

    it('should tokenize identifiers with numbers', () => {
      const token = firstToken('version2');
      expect(token.type).toBe('IDENTIFIER');
      expect(token.value).toBe('version2');
    });
  });

  describe('Numbers', () => {
    it('should tokenize integers', () => {
      const token = firstToken('42');
      expect(token.type).toBe('NUMBER');
      expect(token.value).toBe('42');
    });

    it('should tokenize decimals', () => {
      const token = firstToken('3.14');
      expect(token.type).toBe('NUMBER');
      expect(token.value).toBe('3.14');
    });

    it('should tokenize numbers with units', () => {
      const result = lexer.tokenize('150ms');
      expect(result.tokens[0]!.type).toBe('NUMBER');
      expect(result.tokens[0]!.value).toBe('150');
      expect(result.tokens[1]!.type).toBe('IDENTIFIER');
      expect(result.tokens[1]!.value).toBe('ms');
    });
  });

  describe('Newlines as Statement Separators', () => {
    it('should tokenize newlines as NEWLINE', () => {
      const result = lexer.tokenize('line1\nline2');
      const types = result.tokens.map(t => t.type);
      expect(types).toContain('NEWLINE');
    });

    it('should handle multiple newlines', () => {
      const result = lexer.tokenize('a\n\nb');
      const newlineCount = result.tokens.filter(t => t.type === 'NEWLINE').length;
      expect(newlineCount).toBe(2);
    });

    it('should handle CRLF', () => {
      const result = lexer.tokenize('a\r\nb');
      const types = result.tokens.map(t => t.type);
      expect(types).toContain('NEWLINE');
    });
  });

  describe('Whitespace Handling', () => {
    it('should skip whitespace between tokens', () => {
      const result = lexer.tokenize('@focus :: value');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types).not.toContain('WHITESPACE');
    });

    it('should preserve token positions across whitespace', () => {
      const result = lexer.tokenize('a   b');
      const bToken = result.tokens.find(t => t.value === 'b');
      expect(bToken?.start.column).toBe(5);
    });
  });

  describe('Complex MBEL Expressions', () => {
    it('should tokenize version declaration', () => {
      const result = lexer.tokenize('§MBEL:5.0');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types).toEqual(['META_VERSION', 'IDENTIFIER', 'RELATION_DEFINES', 'NUMBER']);
    });

    it('should tokenize attribute with metadata', () => {
      const result = lexer.tokenize('@purpose::AIMemoryEncoding{compression%75}');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types).toContain('TEMPORAL_PRESENT');
      expect(types).toContain('RELATION_DEFINES');
      expect(types).toContain('STRUCT_METADATA');
    });

    it('should tokenize state with section', () => {
      const result = lexer.tokenize('[FOCUS]\n✓completed::Task');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types).toContain('STRUCT_SECTION');
      expect(types).toContain('NEWLINE');
      expect(types).toContain('STATE_COMPLETE');
    });

    it('should tokenize logic expression', () => {
      const result = lexer.tokenize('RequireAuth&ValidToken&¬Expired');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types).toContain('LOGIC_AND');
      expect(types).toContain('LOGIC_NOT');
    });

    it('should tokenize evolution chain', () => {
      const result = lexer.tokenize('V1→V2→V3{current}');
      const arrowCount = result.tokens.filter(t => t.type === 'RELATION_LEADS_TO').length;
      expect(arrowCount).toBe(2);
    });

    it('should tokenize attribution', () => {
      const result = lexer.tokenize('©Claude>implemented::Feature');
      const types = result.tokens.map(t => t.type).filter(t => t !== 'EOF');
      expect(types[0]).toBe('META_SOURCE');
      expect(types).toContain('TEMPORAL_PAST');
      expect(types).toContain('RELATION_DEFINES');
    });
  });

  describe('Position Tracking', () => {
    it('should track line numbers correctly', () => {
      const result = lexer.tokenize('line1\nline2\nline3');
      const tokens = result.tokens.filter(t => t.type === 'IDENTIFIER');
      expect(tokens[0]!.start.line).toBe(1);
      expect(tokens[1]!.start.line).toBe(2);
      expect(tokens[2]!.start.line).toBe(3);
    });

    it('should track column numbers correctly', () => {
      const result = lexer.tokenize('abc def ghi');
      const tokens = result.tokens.filter(t => t.type === 'IDENTIFIER');
      expect(tokens[0]!.start.column).toBe(1);
      expect(tokens[1]!.start.column).toBe(5);
      expect(tokens[2]!.start.column).toBe(9);
    });

    it('should track offset correctly', () => {
      const result = lexer.tokenize('ab cd');
      const tokens = result.tokens.filter(t => t.type === 'IDENTIFIER');
      expect(tokens[0]!.start.offset).toBe(0);
      expect(tokens[1]!.start.offset).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should report unknown characters', () => {
      const result = lexer.tokenize('valid $ invalid');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!.message).toContain('Unknown character');
    });

    it('should continue lexing after errors', () => {
      const result = lexer.tokenize('valid $ more');
      const identifiers = result.tokens.filter(t => t.type === 'IDENTIFIER');
      expect(identifiers.length).toBe(2);
    });

    it('should report unclosed brackets', () => {
      const result = lexer.tokenize('[unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!.message).toContain('Unclosed');
    });

    it('should report unclosed braces', () => {
      const result = lexer.tokenize('{unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report unclosed parentheses', () => {
      const result = lexer.tokenize('(unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report unclosed angle brackets', () => {
      const result = lexer.tokenize('<unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('EOF Token', () => {
    it('should always end with EOF', () => {
      const result = lexer.tokenize('anything');
      const lastToken = result.tokens[result.tokens.length - 1];
      expect(lastToken?.type).toBe('EOF');
    });

    it('should have EOF for empty input', () => {
      const result = lexer.tokenize('');
      expect(result.tokens.length).toBe(1);
      expect(result.tokens[0]!.type).toBe('EOF');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = lexer.tokenize('');
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1); // Just EOF
    });

    it('should handle only whitespace', () => {
      const result = lexer.tokenize('   \t  ');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle only newlines', () => {
      const result = lexer.tokenize('\n\n\n');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle nested structures', () => {
      const result = lexer.tokenize('Task{status:done,meta:{nested:true}}');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle consecutive operators', () => {
      const result = lexer.tokenize('→→→');
      const arrows = result.tokens.filter(t => t.type === 'RELATION_LEADS_TO');
      expect(arrows.length).toBe(3);
    });

    it('should handle unicode in identifiers', () => {
      // MBEL uses CamelCase, but should handle unicode gracefully
      const result = lexer.tokenize('naïve');
      expect(result.errors).toHaveLength(0);
    });
  });
});
