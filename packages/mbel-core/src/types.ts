/**
 * MBEL v5 Token Types
 *
 * Based on the 27 core operators defined in MBEL v5 Grammar
 */

// Temporal operators [4]
export type TemporalOperator = '>' | '@' | '?' | '≈';

// State operators [4]
export type StateOperator = '✓' | '✗' | '!' | '⚡';

// Relation operators [6]
export type RelationOperator = '::' | '→' | '←' | '↔' | '+' | '-';

// Structure operators [5]
export type StructureOperator = '[]' | '{}' | '()' | '|' | '<>';

// Quantification operators [3]
export type QuantificationOperator = '#' | '%' | '~';

// Logic operators [3]
export type LogicOperator = '&' | '||' | '¬';

// Meta operators [2]
export type MetaOperator = '©' | '§';

export type MbelOperator =
  | TemporalOperator
  | StateOperator
  | RelationOperator
  | StructureOperator
  | QuantificationOperator
  | LogicOperator
  | MetaOperator;

export type TokenType =
  // Operators
  | 'TEMPORAL_PAST'        // >
  | 'TEMPORAL_PRESENT'     // @
  | 'TEMPORAL_FUTURE'      // ?
  | 'TEMPORAL_APPROX'      // ≈
  | 'STATE_COMPLETE'       // ✓
  | 'STATE_FAILED'         // ✗
  | 'STATE_CRITICAL'       // !
  | 'STATE_ACTIVE'         // ⚡
  | 'RELATION_DEFINES'     // ::
  | 'RELATION_LEADS_TO'    // →
  | 'RELATION_FROM'        // ←
  | 'RELATION_MUTUAL'      // ↔
  | 'RELATION_AND'         // +
  | 'RELATION_REMOVE'      // -
  | 'STRUCT_SECTION'       // []
  | 'STRUCT_METADATA'      // {}
  | 'STRUCT_NOTE'          // ()
  | 'STRUCT_OR'            // |
  | 'STRUCT_VARIANT'       // <>
  | 'QUANT_NUMBER'         // #
  | 'QUANT_PERCENT'        // %
  | 'QUANT_RANGE'          // ~
  | 'LOGIC_AND'            // &
  | 'LOGIC_OR'             // ||
  | 'LOGIC_NOT'            // ¬
  | 'META_SOURCE'          // ©
  | 'META_VERSION'         // §
  // Literals and identifiers
  | 'IDENTIFIER'           // CamelCase words
  | 'NUMBER'               // Numeric literals
  | 'STRING'               // String content (inside brackets)
  // Structural
  | 'NEWLINE'              // Statement separator
  | 'WHITESPACE'           // Spaces/tabs (usually skipped)
  | 'EOF'                  // End of file
  | 'UNKNOWN';             // Invalid token

export interface Position {
  readonly line: number;    // 1-based
  readonly column: number;  // 1-based
  readonly offset: number;  // 0-based character offset
}

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly start: Position;
  readonly end: Position;
}

export interface LexerError {
  readonly message: string;
  readonly position: Position;
}

export interface LexerResult {
  readonly tokens: readonly Token[];
  readonly errors: readonly LexerError[];
}
