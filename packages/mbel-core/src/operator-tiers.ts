/**
 * MBEL Operator Tier Classification
 *
 * Divides 67 operators into two tiers:
 * - ESSENTIAL (15): Core operators for basic MBEL usage
 * - ADVANCED (52): Extended operators for specialized use cases
 */
import { OperatorTier } from './types.js';

/**
 * Set of 15 essential operators that new users should learn first
 */
export const ESSENTIAL_OPERATORS: ReadonlySet<string> = new Set([
  // Temporal (3)
  '@',   // Present state
  '>',   // Past/completed
  '?',   // Future/pending
  // Relation (3)
  '::',  // Defines
  '+',   // And/addition
  '-',   // Remove/subtraction
  // Structure (3)
  '{}',  // Metadata
  '[]',  // List/section
  '()',  // Note
  // State (2)
  '✓',   // Complete
  '!',   // Critical
  // Quantification (3)
  '#',   // Count
  '%',   // Percentage
  '~',   // Range/approximate
  // Meta (1)
  '§',   // Version/section marker
]);

/**
 * Complete mapping of all 67 operators to their tier
 */
export const OPERATOR_TIER_MAP: ReadonlyMap<string, OperatorTier> = new Map([
  // ========== ESSENTIAL (15) ==========
  // Temporal
  ['@', OperatorTier.ESSENTIAL],
  ['>', OperatorTier.ESSENTIAL],
  ['?', OperatorTier.ESSENTIAL],
  // Relation
  ['::', OperatorTier.ESSENTIAL],
  ['+', OperatorTier.ESSENTIAL],
  ['-', OperatorTier.ESSENTIAL],
  // Structure
  ['{}', OperatorTier.ESSENTIAL],
  ['[]', OperatorTier.ESSENTIAL],
  ['()', OperatorTier.ESSENTIAL],
  // State
  ['✓', OperatorTier.ESSENTIAL],
  ['!', OperatorTier.ESSENTIAL],
  // Quantification
  ['#', OperatorTier.ESSENTIAL],
  ['%', OperatorTier.ESSENTIAL],
  ['~', OperatorTier.ESSENTIAL],
  // Meta
  ['§', OperatorTier.ESSENTIAL],

  // ========== ADVANCED (52) ==========
  // Temporal (1)
  ['≈', OperatorTier.ADVANCED],

  // State (2)
  ['✗', OperatorTier.ADVANCED],
  ['⚡', OperatorTier.ADVANCED],

  // Relation (3)
  ['→', OperatorTier.ADVANCED],
  ['←', OperatorTier.ADVANCED],
  ['↔', OperatorTier.ADVANCED],

  // Structure (2)
  ['|', OperatorTier.ADVANCED],
  ['<>', OperatorTier.ADVANCED],

  // Logic (3)
  ['&', OperatorTier.ADVANCED],
  ['||', OperatorTier.ADVANCED],
  ['¬', OperatorTier.ADVANCED],

  // Meta (1)
  ['©', OperatorTier.ADVANCED],

  // Arrow Operators - Links (10)
  ['->files', OperatorTier.ADVANCED],
  ['->tests', OperatorTier.ADVANCED],
  ['->docs', OperatorTier.ADVANCED],
  ['->decisions', OperatorTier.ADVANCED],
  ['->related', OperatorTier.ADVANCED],
  ['->entryPoint', OperatorTier.ADVANCED],
  ['->blueprint', OperatorTier.ADVANCED],
  ['->depends', OperatorTier.ADVANCED],
  ['->features', OperatorTier.ADVANCED],
  ['->why', OperatorTier.ADVANCED],

  // Arrow Operators - Anchors (2)
  ['->descrizione', OperatorTier.ADVANCED],
  ['->description', OperatorTier.ADVANCED],

  // Arrow Operators - Decisions (7)
  ['->alternatives', OperatorTier.ADVANCED],
  ['->reason', OperatorTier.ADVANCED],
  ['->tradeoff', OperatorTier.ADVANCED],
  ['->context', OperatorTier.ADVANCED],
  ['->status', OperatorTier.ADVANCED],
  ['->revisit', OperatorTier.ADVANCED],
  ['->supersededBy', OperatorTier.ADVANCED],

  // Arrow Operators - Heat (7)
  ['->dependents', OperatorTier.ADVANCED],
  ['->untouched', OperatorTier.ADVANCED],
  ['->changes', OperatorTier.ADVANCED],
  ['->coverage', OperatorTier.ADVANCED],
  ['->confidence', OperatorTier.ADVANCED],
  ['->impact', OperatorTier.ADVANCED],
  ['->caution', OperatorTier.ADVANCED],

  // Arrow Operators - Intents (6)
  ['->does', OperatorTier.ADVANCED],
  ['->doesNot', OperatorTier.ADVANCED],
  ['->contract', OperatorTier.ADVANCED],
  ['->singleResponsibility', OperatorTier.ADVANCED],
  ['->antiPattern', OperatorTier.ADVANCED],
  ['->extends', OperatorTier.ADVANCED],

  // Anchor Prefixes (3)
  ['@entry::', OperatorTier.ADVANCED],
  ['@hotspot::', OperatorTier.ADVANCED],
  ['@boundary::', OperatorTier.ADVANCED],

  // Heat Prefixes (4)
  ['@critical::', OperatorTier.ADVANCED],
  ['@stable::', OperatorTier.ADVANCED],
  ['@volatile::', OperatorTier.ADVANCED],
  ['@hot::', OperatorTier.ADVANCED],
]);

/**
 * Complete list of all 67 operators
 */
export const ALL_OPERATORS: readonly string[] = Array.from(OPERATOR_TIER_MAP.keys());

/**
 * Get the tier for a given operator
 * @param operator - The operator string
 * @returns The tier (ESSENTIAL or ADVANCED). Unknown operators default to ADVANCED.
 */
export function getOperatorTier(operator: string): OperatorTier {
  return OPERATOR_TIER_MAP.get(operator) ?? OperatorTier.ADVANCED;
}

/**
 * Get all operators belonging to a specific tier
 * @param tier - The tier to filter by
 * @returns Array of operators in that tier
 */
export function getOperatorsByTier(tier: OperatorTier): readonly string[] {
  return Array.from(OPERATOR_TIER_MAP.entries())
    .filter(([, t]) => t === tier)
    .map(([op]) => op);
}

/**
 * Check if an operator is in the ESSENTIAL tier
 * @param operator - The operator to check
 * @returns true if the operator is essential
 */
export function isEssentialOperator(operator: string): boolean {
  return getOperatorTier(operator) === OperatorTier.ESSENTIAL;
}
