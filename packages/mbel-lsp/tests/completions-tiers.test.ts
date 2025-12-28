/**
 * TDDAB: LSP Completions with Operator Tiers
 *
 * Tests that completions are sorted by tier:
 * - ESSENTIAL operators (sortText: 0-...) appear first
 * - ADVANCED operators (sortText: 1-...) appear second
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelServer } from '../src/server.js';

describe('LSP Completions with Tiers', () => {
  let server: MbelServer;
  const testUri = 'file:///test.mbel';

  beforeEach(() => {
    server = new MbelServer();
    server.onDidOpenTextDocument(testUri, 1, '§MBEL:6.0\n');
  });

  describe('Completion Sorting', () => {
    it('should return completions sorted by tier (ESSENTIAL first)', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      // Find indices of essential vs advanced operators
      const atIndex = completions.findIndex(c => c.label === '@');
      const approxIndex = completions.findIndex(c => c.label === '≈');

      expect(atIndex).toBeGreaterThanOrEqual(0);
      expect(approxIndex).toBeGreaterThanOrEqual(0);
      expect(atIndex).toBeLessThan(approxIndex);
    });

    it('should have lower sortText for ESSENTIAL operators', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      const essentialOp = completions.find(c => c.label === '@');
      const advancedOp = completions.find(c => c.label === '≈');

      expect(essentialOp?.sortText).toMatch(/^0-/);  // 0 = ESSENTIAL
      expect(advancedOp?.sortText).toMatch(/^1-/);  // 1 = ADVANCED
    });
  });

  describe('Completion Details', () => {
    it('should include tier in completion detail', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      const essentialOp = completions.find(c => c.label === '@');
      expect(essentialOp?.detail).toContain('Essential');

      const advancedOp = completions.find(c => c.label === '≈');
      expect(advancedOp?.detail).toContain('Advanced');
    });
  });

  describe('Essential Operators', () => {
    const essentialOps = ['@', '>', '?', '::', '+', '-', '#', '%', '~', '✓', '!', '§'];

    it.each(essentialOps)('should mark %s as Essential', (op) => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });
      const completion = completions.find(c => c.label === op);

      expect(completion).toBeDefined();
      expect(completion?.sortText).toMatch(/^0-/);
      expect(completion?.detail).toContain('Essential');
    });
  });

  describe('Advanced Operators', () => {
    const advancedOps = ['≈', '✗', '⚡', '→', '←', '↔', '|', '&', '||', '¬', '©'];

    it.each(advancedOps)('should mark %s as Advanced', (op) => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });
      const completion = completions.find(c => c.label === op);

      expect(completion).toBeDefined();
      expect(completion?.sortText).toMatch(/^1-/);
      expect(completion?.detail).toContain('Advanced');
    });
  });

  describe('Structure Operators', () => {
    it('should have essential structure operators', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      // [, {, ( are essential (represented as [ { ( in completions)
      const bracket = completions.find(c => c.label === '[');
      const brace = completions.find(c => c.label === '{');
      const paren = completions.find(c => c.label === '(');

      expect(bracket?.sortText).toMatch(/^0-/);
      expect(brace?.sortText).toMatch(/^0-/);
      expect(paren?.sortText).toMatch(/^0-/);
    });

    it('should have advanced structure operators', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      // | and < are advanced
      const pipe = completions.find(c => c.label === '|');
      const angle = completions.find(c => c.label === '<');

      expect(pipe?.sortText).toMatch(/^1-/);
      expect(angle?.sortText).toMatch(/^1-/);
    });
  });

  describe('Arrow Operators', () => {
    const arrowOps = [
      '->files', '->tests', '->docs', '->depends', '->entryPoint',
      '->descrizione', '->description',
      '->reason', '->alternatives', '->tradeoff',
      '->coverage', '->impact', '->caution',
      '->does', '->doesNot', '->contract',
    ];

    it('should include arrow operators in completions', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      expect(completions.some(c => c.label === '->files')).toBe(true);
      expect(completions.some(c => c.label === '->tests')).toBe(true);
      expect(completions.some(c => c.label === '->depends')).toBe(true);
    });

    it.each(arrowOps)('should classify %s as ADVANCED', (op) => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });
      const completion = completions.find(c => c.label === op);

      expect(completion).toBeDefined();
      expect(completion?.sortText).toMatch(/^1-/);
      expect(completion?.detail).toContain('Advanced');
    });

    it('should group arrow operators by purpose', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      const filesOp = completions.find(c => c.label === '->files');
      expect(filesOp?.detail).toContain('Links');

      const reasonOp = completions.find(c => c.label === '->reason');
      expect(reasonOp?.detail).toContain('Decisions');

      const coverageOp = completions.find(c => c.label === '->coverage');
      expect(coverageOp?.detail).toContain('Heat');
    });
  });

  describe('Prefix Operators', () => {
    const anchorPrefixes = ['@entry::', '@hotspot::', '@boundary::'];
    const heatPrefixes = ['@critical::', '@stable::', '@volatile::', '@hot::'];

    it('should include anchor prefixes in completions', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      expect(completions.some(c => c.label === '@entry::')).toBe(true);
      expect(completions.some(c => c.label === '@hotspot::')).toBe(true);
      expect(completions.some(c => c.label === '@boundary::')).toBe(true);
    });

    it('should include heat prefixes in completions', () => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });

      expect(completions.some(c => c.label === '@critical::')).toBe(true);
      expect(completions.some(c => c.label === '@stable::')).toBe(true);
      expect(completions.some(c => c.label === '@volatile::')).toBe(true);
      expect(completions.some(c => c.label === '@hot::')).toBe(true);
    });

    it.each(anchorPrefixes)('should classify %s as ADVANCED', (op) => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });
      const completion = completions.find(c => c.label === op);

      expect(completion).toBeDefined();
      expect(completion?.sortText).toMatch(/^1-/);
      expect(completion?.detail).toContain('Anchors');
    });

    it.each(heatPrefixes)('should classify %s as ADVANCED', (op) => {
      const completions = server.getCompletions(testUri, { line: 1, character: 0 });
      const completion = completions.find(c => c.label === op);

      expect(completion).toBeDefined();
      expect(completion?.sortText).toMatch(/^1-/);
      expect(completion?.detail).toContain('Heat');
    });
  });
});
