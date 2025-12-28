/**
 * TDDAB: Operator Tiers
 *
 * Tests for the operator tier classification system.
 * Operators are divided into ESSENTIAL (15) and ADVANCED (52) tiers
 * to improve discoverability for new users.
 */
import { describe, it, expect } from 'vitest';
import { OperatorTier } from '../src/types.js';
import {
  getOperatorTier,
  getOperatorsByTier,
  isEssentialOperator,
  ESSENTIAL_OPERATORS,
  ALL_OPERATORS,
} from '../src/operator-tiers.js';

describe('OperatorTier', () => {
  it('should have ESSENTIAL tier', () => {
    expect(OperatorTier.ESSENTIAL).toBe('ESSENTIAL');
  });

  it('should have ADVANCED tier', () => {
    expect(OperatorTier.ADVANCED).toBe('ADVANCED');
  });
});

describe('ESSENTIAL_OPERATORS', () => {
  const expectedEssential = [
    '@', '>', '?', '::', '{}', '[]', '()', '✓', '!', '§', '+', '-', '#', '%', '~',
  ];

  it('should have exactly 15 essential operators', () => {
    expect(ESSENTIAL_OPERATORS.size).toBe(15);
  });

  it.each(expectedEssential)('should include %s as essential', (op) => {
    expect(ESSENTIAL_OPERATORS.has(op)).toBe(true);
  });
});

describe('getOperatorTier', () => {
  describe('Essential Operators', () => {
    const essentialOps = [
      '@', '>', '?', '::', '{}', '[]', '()', '✓', '!', '§', '+', '-', '#', '%', '~',
    ];

    it.each(essentialOps)('should classify %s as ESSENTIAL', (op) => {
      expect(getOperatorTier(op)).toBe(OperatorTier.ESSENTIAL);
    });
  });

  describe('Advanced Single-char Operators', () => {
    const advancedSingleChar = ['≈', '✗', '⚡', '→', '←', '↔', '|', '<>', '&', '||', '¬', '©'];

    it.each(advancedSingleChar)('should classify %s as ADVANCED', (op) => {
      expect(getOperatorTier(op)).toBe(OperatorTier.ADVANCED);
    });
  });

  describe('Arrow Operators', () => {
    const arrowOps = [
      '->files', '->tests', '->docs', '->decisions', '->related',
      '->entryPoint', '->blueprint', '->depends', '->features', '->why',
      '->descrizione', '->description',
      '->alternatives', '->reason', '->tradeoff', '->context', '->status', '->revisit', '->supersededBy',
      '->dependents', '->untouched', '->changes', '->coverage', '->confidence', '->impact', '->caution',
      '->does', '->doesNot', '->contract', '->singleResponsibility', '->antiPattern', '->extends',
    ];

    it.each(arrowOps)('should classify %s as ADVANCED', (op) => {
      expect(getOperatorTier(op)).toBe(OperatorTier.ADVANCED);
    });
  });

  describe('Anchor Prefixes', () => {
    const anchorPrefixes = ['@entry::', '@hotspot::', '@boundary::'];

    it.each(anchorPrefixes)('should classify %s as ADVANCED', (op) => {
      expect(getOperatorTier(op)).toBe(OperatorTier.ADVANCED);
    });
  });

  describe('Heat Prefixes', () => {
    const heatPrefixes = ['@critical::', '@stable::', '@volatile::', '@hot::'];

    it.each(heatPrefixes)('should classify %s as ADVANCED', (op) => {
      expect(getOperatorTier(op)).toBe(OperatorTier.ADVANCED);
    });
  });

  describe('Unknown Operators', () => {
    it('should return ADVANCED for unknown operators', () => {
      expect(getOperatorTier('->unknown')).toBe(OperatorTier.ADVANCED);
      expect(getOperatorTier('xyz')).toBe(OperatorTier.ADVANCED);
    });
  });
});

describe('getOperatorsByTier', () => {
  it('should return exactly 15 essential operators', () => {
    const essential = getOperatorsByTier(OperatorTier.ESSENTIAL);
    expect(essential.length).toBe(15);
  });

  it('should return 51 advanced operators', () => {
    const advanced = getOperatorsByTier(OperatorTier.ADVANCED);
    expect(advanced.length).toBe(51);
  });

  it('should return all operators when combining tiers', () => {
    const essential = getOperatorsByTier(OperatorTier.ESSENTIAL);
    const advanced = getOperatorsByTier(OperatorTier.ADVANCED);
    expect(essential.length + advanced.length).toBe(66);
  });
});

describe('isEssentialOperator', () => {
  it('should return true for essential operators', () => {
    expect(isEssentialOperator('@')).toBe(true);
    expect(isEssentialOperator('>')).toBe(true);
    expect(isEssentialOperator('✓')).toBe(true);
  });

  it('should return false for advanced operators', () => {
    expect(isEssentialOperator('≈')).toBe(false);
    expect(isEssentialOperator('->files')).toBe(false);
    expect(isEssentialOperator('@entry::')).toBe(false);
  });
});

describe('ALL_OPERATORS', () => {
  it('should have exactly 66 operators', () => {
    expect(ALL_OPERATORS.length).toBe(66);
  });

  it('should include all essential operators', () => {
    const essential = ['@', '>', '?', '::', '{}', '[]', '()', '✓', '!', '§', '+', '-', '#', '%', '~'];
    for (const op of essential) {
      expect(ALL_OPERATORS).toContain(op);
    }
  });

  it('should include arrow operators', () => {
    expect(ALL_OPERATORS).toContain('->files');
    expect(ALL_OPERATORS).toContain('->tests');
    expect(ALL_OPERATORS).toContain('->depends');
  });

  it('should include anchor prefixes', () => {
    expect(ALL_OPERATORS).toContain('@entry::');
    expect(ALL_OPERATORS).toContain('@hotspot::');
    expect(ALL_OPERATORS).toContain('@boundary::');
  });

  it('should include heat prefixes', () => {
    expect(ALL_OPERATORS).toContain('@critical::');
    expect(ALL_OPERATORS).toContain('@stable::');
    expect(ALL_OPERATORS).toContain('@volatile::');
    expect(ALL_OPERATORS).toContain('@hot::');
  });
});
