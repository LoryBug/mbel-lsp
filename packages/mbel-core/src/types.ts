/**
 * MBEL v5/v6 Token Types
 *
 * Based on the 27 core operators defined in MBEL v5 Grammar
 * Extended with MBEL v6 CrossRefLinks operators
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

// MBEL v6 Arrow operators for CrossRefLinks [10] + SemanticAnchors [1] + Decisions [7]
export type ArrowOperator =
  | '->files'
  | '->tests'
  | '->docs'
  | '->decisions'
  | '->related'
  | '->entryPoint'
  | '->blueprint'
  | '->depends'
  | '->features'
  | '->why'
  | '->descrizione'    // TDDAB#10: SemanticAnchors
  | '->alternatives'   // TDDAB#11: DecisionLog
  | '->reason'         // TDDAB#11: DecisionLog
  | '->tradeoff'       // TDDAB#11: DecisionLog
  | '->context'        // TDDAB#11: DecisionLog
  | '->status'         // TDDAB#11: DecisionLog
  | '->revisit'        // TDDAB#11: DecisionLog
  | '->supersededBy';  // TDDAB#11: DecisionLog

// MBEL v6 Anchor prefixes for SemanticAnchors [3]
export type AnchorPrefix =
  | '@entry::'
  | '@hotspot::'
  | '@boundary::';

export type MbelOperator =
  | TemporalOperator
  | StateOperator
  | RelationOperator
  | StructureOperator
  | QuantificationOperator
  | LogicOperator
  | MetaOperator
  | ArrowOperator
  | AnchorPrefix;

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
  // MBEL v6 CrossRefLinks Arrow Operators
  | 'ARROW_FILES'          // ->files
  | 'ARROW_TESTS'          // ->tests
  | 'ARROW_DOCS'           // ->docs
  | 'ARROW_DECISIONS'      // ->decisions
  | 'ARROW_RELATED'        // ->related
  | 'ARROW_ENTRYPOINT'     // ->entryPoint
  | 'ARROW_BLUEPRINT'      // ->blueprint
  | 'ARROW_DEPENDS'        // ->depends
  | 'ARROW_FEATURES'       // ->features
  | 'ARROW_WHY'            // ->why
  | 'ARROW_DESCRIZIONE'    // ->descrizione (TDDAB#10)
  // MBEL v6 Decision Arrow Operators (TDDAB#11)
  | 'ARROW_ALTERNATIVES'   // ->alternatives
  | 'ARROW_REASON'         // ->reason
  | 'ARROW_TRADEOFF'       // ->tradeoff
  | 'ARROW_CONTEXT'        // ->context
  | 'ARROW_STATUS'         // ->status
  | 'ARROW_REVISIT'        // ->revisit
  | 'ARROW_SUPERSEDED_BY'  // ->supersededBy
  // MBEL v6 Decision Date Prefix (TDDAB#11)
  | 'DECISION_DATE'        // @YYYY-MM-DD::
  // MBEL v6 Link Type Markers
  | 'LINK_FEATURE'         // @feature
  | 'LINK_TASK'            // @task
  // MBEL v6 Anchor Prefixes (TDDAB#10)
  | 'ANCHOR_ENTRY'         // @entry::
  | 'ANCHOR_HOTSPOT'       // @hotspot::
  | 'ANCHOR_BOUNDARY'      // @boundary::
  // MBEL v6 Structure
  | 'STRUCT_LIST'          // [...] for lists (different from STRUCT_SECTION)
  // Literals and identifiers
  | 'IDENTIFIER'           // CamelCase words
  | 'NUMBER'               // Numeric literals
  | 'STRING'               // String content (inside brackets)
  // Punctuation
  | 'SEPARATOR'            // ,
  | 'DOT'                  // .
  | 'SLASH'                // /
  | 'CARET'                // ^
  | 'ASTERISK'             // *
  | 'EQUALS'               // =
  | 'APOSTROPHE'           // ' '
  | 'QUOTE'                // " "
  | 'CODE_BLOCK'           // ``` ... ```
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
