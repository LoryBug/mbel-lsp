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
  | ExpressionStatement;

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
