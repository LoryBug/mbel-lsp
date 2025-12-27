/**
 * @mbel/core - MBEL v5 Lexer and Parser
 *
 * This package provides lexer and parser functionality for the
 * MBEL (Memory Bank Encoding Language) v5 specification.
 */

// Lexer
export { MbelLexer } from './lexer.js';

// Parser
export { MbelParser } from './parser.js';

// Lexer Types
export type {
  Token,
  TokenType,
  Position,
  LexerResult,
  LexerError,
  MbelOperator,
  TemporalOperator,
  StateOperator,
  RelationOperator,
  StructureOperator,
  QuantificationOperator,
  LogicOperator,
  MetaOperator,
  HeatPrefix,  // TDDAB#12: HeatMap
} from './types.js';

// AST Types
export type {
  AstNode,
  Document,
  Statement,
  Expression,
  SectionDeclaration,
  AttributeStatement,
  VersionStatement,
  SourceStatement,
  TemporalStatement,
  ExpressionStatement,
  Identifier,
  NumberLiteral,
  ChainExpression,
  LogicExpression,
  StateExpression,
  Metadata,
  MetadataEntry,
  Note,
  Variant,
  ParseResult,
  ParseError,
  // MBEL v6 CrossRefLinks
  LinkDeclaration,
  LinkType,
  FileRef,
  FileMarker,
  LineRange,
  EntryPoint,
  ArrowClause,
  ArrowClauseType,
  // MBEL v6 SemanticAnchors (TDDAB#10)
  AnchorDeclaration,
  AnchorType,
  // MBEL v6 DecisionLog (TDDAB#11)
  DecisionDeclaration,
  DecisionStatus,
  // MBEL v6 HeatMap (TDDAB#12)
  HeatDeclaration,
  HeatType,
} from './ast.js';
