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
} from './ast.js';
