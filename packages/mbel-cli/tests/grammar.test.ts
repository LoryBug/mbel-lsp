/**
 * TDDAB#25: mbel grammar command tests
 * On-demand syntax refresher for agents
 */

import { describe, it, expect } from 'vitest';
import { grammarCommand, GrammarResult, GrammarFormat } from '../src/commands/grammar.js';

describe('TDDAB#25: mbel grammar command', () => {
  describe('grammarCommand function', () => {
    it('should export grammarCommand function', () => {
      expect(grammarCommand).toBeDefined();
      expect(typeof grammarCommand).toBe('function');
    });

    it('should return GrammarResult type', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('content');
    });
  });

  describe('BNF format', () => {
    it('should return BNF grammar in bnf format', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect(result.success).toBe(true);
      expect(result.format).toBe('bnf');
      expect(result.content).toBeDefined();
    });

    it('should include document production rule', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect(result.content).toContain('document');
    });

    it('should include section production rule', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect(result.content).toContain('section');
    });

    it('should include statement production rule', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect(result.content).toContain('statement');
    });
  });

  describe('examples format', () => {
    it('should return examples in examples format', async () => {
      const result = await grammarCommand({ format: 'examples' });

      expect(result.success).toBe(true);
      expect(result.format).toBe('examples');
      expect(result.content).toBeDefined();
    });

    it('should include section example', async () => {
      const result = await grammarCommand({ format: 'examples' });

      expect(result.content).toContain('[');
      expect(result.content).toContain(']');
    });

    it('should include feature example', async () => {
      const result = await grammarCommand({ format: 'examples' });

      expect(result.content).toContain('@feature');
    });

    it('should include arrow operator example', async () => {
      const result = await grammarCommand({ format: 'examples' });

      expect(result.content).toContain('->');
    });
  });

  describe('default format', () => {
    it('should default to bnf format when not specified', async () => {
      const result = await grammarCommand({});

      expect(result.format).toBe('bnf');
    });
  });

  describe('GrammarFormat type', () => {
    it('should accept valid formats', () => {
      const formats: GrammarFormat[] = ['bnf', 'examples'];
      expect(formats).toContain('bnf');
      expect(formats).toContain('examples');
    });
  });

  describe('GrammarResult type', () => {
    it('should have required fields', async () => {
      const result = await grammarCommand({ format: 'bnf' });

      expect('success' in result).toBe(true);
      expect('format' in result).toBe(true);
      expect('content' in result).toBe(true);
    });
  });
});
