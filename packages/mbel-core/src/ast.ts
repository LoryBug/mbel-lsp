import type { Position } from './types.js';

/**
 * MBEL v5 Abstract Syntax Tree Types
 *
 * Represents the parsed structure of MBEL documents.
 */

// Base node interface with location info
export interface AstNode {
  readonly type: string;
  readonly start: Position;
  readonly end: Position;
}

// Document root
export interface Document extends AstNode {
  readonly type: 'Document';
  readonly statements: readonly Statement[];
}

// Statement types
export type Statement =
  | SectionDeclaration
  | AttributeStatement
  | TemporalStatement
  | VersionStatement
  | SourceStatement
  | ExpressionStatement
  | LinkDeclaration
  | AnchorDeclaration     // TDDAB#10: SemanticAnchors
  | DecisionDeclaration   // TDDAB#11: DecisionLog
  | HeatDeclaration;      // TDDAB#12: HeatMap

// [SectionName] - Section declaration
export interface SectionDeclaration extends AstNode {
  readonly type: 'SectionDeclaration';
  readonly name: string;
}

// @name::value{metadata} - Current/present attribute
export interface AttributeStatement extends AstNode {
  readonly type: 'AttributeStatement';
  readonly temporal: 'present' | 'past' | 'future' | 'approx';
  readonly name: Identifier;
  readonly value: Expression | null;
  readonly metadata: Metadata | null;
}

// §MBEL:5.0 - Version declaration
export interface VersionStatement extends AstNode {
  readonly type: 'VersionStatement';
  readonly name: Identifier;
  readonly version: string;
}

// ©Author>action::Target - Source/attribution
export interface SourceStatement extends AstNode {
  readonly type: 'SourceStatement';
  readonly source: Identifier;
  readonly action: Expression | null;
}

// Temporal prefix statements (@, >, ?, ≈)
export interface TemporalStatement extends AstNode {
  readonly type: 'TemporalStatement';
  readonly temporal: 'present' | 'past' | 'future' | 'approx';
  readonly expression: Expression;
}

// Generic expression statement
export interface ExpressionStatement extends AstNode {
  readonly type: 'ExpressionStatement';
  readonly expression: Expression;
}

// Expression types
export type Expression =
  | Identifier
  | NumberLiteral
  | ChainExpression
  | LogicExpression
  | Metadata
  | Note
  | Variant
  | StateExpression;

// CamelCase identifier
export interface Identifier extends AstNode {
  readonly type: 'Identifier';
  readonly name: string;
}

// Numeric literal
export interface NumberLiteral extends AstNode {
  readonly type: 'NumberLiteral';
  readonly value: string;
  readonly unit: string | null;
}

// A::B or A→B or A←B chain
export interface ChainExpression extends AstNode {
  readonly type: 'ChainExpression';
  readonly operator: 'defines' | 'leads_to' | 'from' | 'mutual' | 'and' | 'remove';
  readonly left: Expression;
  readonly right: Expression;
}

// A&B or A||B or ¬A logic expressions
export interface LogicExpression extends AstNode {
  readonly type: 'LogicExpression';
  readonly operator: 'and' | 'or' | 'not';
  readonly left: Expression | null; // null for unary NOT
  readonly right: Expression;
}

// {content} - Metadata block
export interface Metadata extends AstNode {
  readonly type: 'Metadata';
  readonly content: string;
  readonly entries: readonly MetadataEntry[];
}

// Key:value or key%value within metadata
export interface MetadataEntry extends AstNode {
  readonly type: 'MetadataEntry';
  readonly key: string;
  readonly operator: 'defines' | 'percent' | 'number' | 'range';
  readonly value: string;
}

// (content) - Note/comment
export interface Note extends AstNode {
  readonly type: 'Note';
  readonly content: string;
}

// <content> - Variant/template
export interface Variant extends AstNode {
  readonly type: 'Variant';
  readonly content: string;
}

// State prefix (✓, ✗, !, ⚡)
export interface StateExpression extends AstNode {
  readonly type: 'StateExpression';
  readonly state: 'complete' | 'failed' | 'critical' | 'active';
  readonly expression: Expression;
}

// Parser result
export interface ParseError {
  readonly message: string;
  readonly position: Position;
}

export interface ParseResult {
  readonly document: Document;
  readonly errors: readonly ParseError[];
}

// =========================================
// MBEL v6 CrossRefLinks AST Nodes
// =========================================

/**
 * Link type marker
 * @feature for features, @task for tasks
 */
export type LinkType = 'feature' | 'task';

/**
 * File status marker for planned files
 */
export type FileMarker = 'TO-CREATE' | 'TO-MODIFY';

/**
 * Line range within a file (e.g., file.ts:10-50)
 */
export interface LineRange {
  readonly start: number;
  readonly end: number;
}

/**
 * File reference in a link declaration
 * e.g., src/file.ts, src/file.ts{TO-CREATE}, src/file.ts:10-50, src/**\/*.ts
 */
export interface FileRef extends AstNode {
  readonly type: 'FileRef';
  readonly path: string;
  readonly marker: FileMarker | null;
  readonly lineRange: LineRange | null;
  readonly isGlob: boolean;
}

/**
 * Entry point reference
 * e.g., entryPoint{file.ts:functionName:42}
 */
export interface EntryPoint extends AstNode {
  readonly type: 'EntryPoint';
  readonly file: string;
  readonly symbol: string;
  readonly line: number | null;
}

/**
 * Link declaration - main node for §links section
 * e.g., @feature{Lexer}->files[src/lexer.ts]->tests[tests/lexer.test.ts]
 */
export interface LinkDeclaration extends AstNode {
  readonly type: 'LinkDeclaration';
  readonly linkType: LinkType;
  readonly name: string;
  readonly files: readonly FileRef[] | null;
  readonly tests: readonly FileRef[] | null;
  readonly docs: readonly FileRef[] | null;
  readonly decisions: readonly string[] | null;
  readonly related: readonly string[] | null;
  readonly entryPoint: EntryPoint | null;
  readonly blueprint: readonly string[] | null;
  readonly depends: readonly string[] | null;
}

/**
 * Arrow clause type (for internal parser use)
 */
export type ArrowClauseType =
  | 'files'
  | 'tests'
  | 'docs'
  | 'decisions'
  | 'related'
  | 'entryPoint'
  | 'blueprint'
  | 'depends'
  | 'features'
  | 'why';

/**
 * Arrow clause AST node (intermediate representation)
 */
export interface ArrowClause extends AstNode {
  readonly type: 'ArrowClause';
  readonly clauseType: ArrowClauseType;
  readonly content: string;
}

// =========================================
// MBEL v6 SemanticAnchors AST Nodes (TDDAB#10)
// =========================================

/**
 * Anchor type marker
 * @entry:: for entry points, @hotspot:: for frequently modified, @boundary:: for system boundaries
 */
export type AnchorType = 'entry' | 'hotspot' | 'boundary';

/**
 * Anchor declaration - node for §anchors section
 * e.g., @entry::src/index.ts
 *         ->descrizione::Main entry point
 */
export interface AnchorDeclaration extends AstNode {
  readonly type: 'AnchorDeclaration';
  readonly anchorType: AnchorType;
  readonly path: string;
  readonly isGlob: boolean;
  readonly description: string | null;
}

// =========================================
// MBEL v6 DecisionLog AST Nodes (TDDAB#11)
// =========================================

/**
 * Decision status
 * ACTIVE - currently in effect
 * SUPERSEDED - replaced by another decision
 * RECONSIDERING - under review
 */
export type DecisionStatus = 'ACTIVE' | 'SUPERSEDED' | 'RECONSIDERING';

/**
 * Decision declaration - node for §decisions section
 * e.g., @2024-12-27::UseTypeScript
 *         ->alternatives["JavaScript", "Python"]
 *         ->reason{Type safety}
 *         ->status{ACTIVE}
 */
export interface DecisionDeclaration extends AstNode {
  readonly type: 'DecisionDeclaration';
  readonly date: string;  // ISO format YYYY-MM-DD
  readonly name: string;
  readonly alternatives: readonly string[] | null;
  readonly reason: string | null;
  readonly tradeoff: string | null;
  readonly context: readonly string[] | null;  // file paths
  readonly status: DecisionStatus | null;
  readonly supersededBy: string | null;
  readonly revisit: string | null;
}

// =========================================
// MBEL v6 HeatMap AST Nodes (TDDAB#12)
// =========================================

/**
 * Heat type marker for volatility analysis
 * @critical:: for critical stability paths
 * @stable:: for rarely modified files
 * @volatile:: for frequently changed files
 * @hot:: for recent high-activity areas
 */
export type HeatType = 'critical' | 'stable' | 'volatile' | 'hot';

/**
 * Heat declaration - node for §heat section
 * e.g., @critical::src/core/engine.ts
 *         ->dependents[ModuleA, ModuleB]
 *         ->changes{12}
 *         ->coverage{85%}
 *         ->confidence{high}
 */
export interface HeatDeclaration extends AstNode {
  readonly type: 'HeatDeclaration';
  readonly heatType: HeatType;
  readonly path: string;
  readonly isGlob: boolean;
  readonly dependents: readonly string[] | null;      // files that depend on this
  readonly untouched: string | null;                  // duration since last change (e.g., "6months")
  readonly changes: number | null;                    // number of changes in period
  readonly coverage: string | null;                   // test coverage percentage
  readonly confidence: string | null;                 // confidence level (high/medium/low)
  readonly impact: string | null;                     // impact level if changed
  readonly caution: string | null;                    // warning/caution message
}
