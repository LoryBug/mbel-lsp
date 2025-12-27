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

// MBEL v6 Arrow operators for CrossRefLinks [10] + SemanticAnchors [1] + Decisions [7] + HeatMap [7] + IntentMarkers [6]
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
  | '->supersededBy'   // TDDAB#11: DecisionLog
  | '->dependents'     // TDDAB#12: HeatMap
  | '->untouched'      // TDDAB#12: HeatMap
  | '->changes'        // TDDAB#12: HeatMap
  | '->coverage'       // TDDAB#12: HeatMap
  | '->confidence'     // TDDAB#12: HeatMap
  | '->impact'         // TDDAB#12: HeatMap
  | '->caution'        // TDDAB#12: HeatMap
  | '->does'           // TDDAB#13: IntentMarkers
  | '->doesNot'        // TDDAB#13: IntentMarkers
  | '->contract'       // TDDAB#13: IntentMarkers
  | '->singleResponsibility'  // TDDAB#13: IntentMarkers
  | '->antiPattern'    // TDDAB#13: IntentMarkers
  | '->extends';       // TDDAB#13: IntentMarkers

// MBEL v6 Anchor prefixes for SemanticAnchors [3]
export type AnchorPrefix =
  | '@entry::'
  | '@hotspot::'
  | '@boundary::';

// MBEL v6 Heat prefixes for HeatMap [4] (TDDAB#12)
export type HeatPrefix =
  | '@critical::'
  | '@stable::'
  | '@volatile::'
  | '@hot::';

// MBEL v6 Intent prefix pattern (TDDAB#13)
// Format: @Module::Component where Module and Component are identifiers
export type IntentPrefix = '@${string}::${string}';

export type MbelOperator =
  | TemporalOperator
  | StateOperator
  | RelationOperator
  | StructureOperator
  | QuantificationOperator
  | LogicOperator
  | MetaOperator
  | ArrowOperator
  | AnchorPrefix
  | HeatPrefix;

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
  | 'ARROW_DESCRIPTION'    // ->description (TDDAB#14 English alias)
  // MBEL v6 Decision Arrow Operators (TDDAB#11)
  | 'ARROW_ALTERNATIVES'   // ->alternatives
  | 'ARROW_REASON'         // ->reason
  | 'ARROW_TRADEOFF'       // ->tradeoff
  | 'ARROW_CONTEXT'        // ->context
  | 'ARROW_STATUS'         // ->status
  | 'ARROW_REVISIT'        // ->revisit
  | 'ARROW_SUPERSEDED_BY'  // ->supersededBy
  // MBEL v6 Heat Arrow Operators (TDDAB#12)
  | 'ARROW_DEPENDENTS'     // ->dependents
  | 'ARROW_UNTOUCHED'      // ->untouched
  | 'ARROW_CHANGES'        // ->changes
  | 'ARROW_COVERAGE'       // ->coverage
  | 'ARROW_CONFIDENCE'     // ->confidence
  | 'ARROW_IMPACT'         // ->impact
  | 'ARROW_CAUTION'        // ->caution
  // MBEL v6 Intent Arrow Operators (TDDAB#13)
  | 'ARROW_DOES'           // ->does
  | 'ARROW_DOES_NOT'       // ->doesNot
  | 'ARROW_CONTRACT'       // ->contract
  | 'ARROW_SINGLE_RESPONSIBILITY'  // ->singleResponsibility
  | 'ARROW_ANTI_PATTERN'   // ->antiPattern
  | 'ARROW_EXTENDS'        // ->extends
  // MBEL v6 Decision Date Prefix (TDDAB#11)
  | 'DECISION_DATE'        // @YYYY-MM-DD::
  // MBEL v6 Link Type Markers
  | 'LINK_FEATURE'         // @feature
  | 'LINK_TASK'            // @task
  // MBEL v6 Anchor Prefixes (TDDAB#10)
  | 'ANCHOR_ENTRY'         // @entry::
  | 'ANCHOR_HOTSPOT'       // @hotspot::
  | 'ANCHOR_BOUNDARY'      // @boundary::
  // MBEL v6 Heat Prefixes (TDDAB#12)
  | 'HEAT_CRITICAL'        // @critical::
  | 'HEAT_STABLE'          // @stable::
  | 'HEAT_VOLATILE'        // @volatile::
  | 'HEAT_HOT'             // @hot::
  // MBEL v6 Intent Prefix (TDDAB#13)
  | 'INTENT_MODULE'        // @Module:: (dynamic module name)
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
