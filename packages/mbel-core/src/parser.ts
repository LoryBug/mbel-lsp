import { MbelLexer } from './lexer.js';
import type { Token, TokenType, Position, LexerError } from './types.js';
import type {
  Document,
  Statement,
  Expression,
  ParseResult,
  ParseError,
  SectionDeclaration,
  VersionStatement,
  AttributeStatement,
  ExpressionStatement,
  TemporalStatement,
  SourceStatement,
  Identifier,
  NumberLiteral,
  ChainExpression,
  LogicExpression,
  StateExpression,
  Metadata,
  Note,
  Variant,
} from './ast.js';

/**
 * MBEL v5 Parser
 *
 * Parses MBEL v5 tokens into an Abstract Syntax Tree.
 */
export class MbelParser {
  private lexer = new MbelLexer();
  private tokens: readonly Token[] = [];
  private current = 0;
  private errors: ParseError[] = [];

  /**
   * Parse MBEL source code
   */
  parse(input: string): ParseResult {
    const lexerResult = this.lexer.tokenize(input);

    this.tokens = lexerResult.tokens;
    this.current = 0;
    this.errors = lexerResult.errors.map((e: LexerError) => ({
      message: e.message,
      position: e.position,
    }));

    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      // Skip newlines between statements
      while (this.check('NEWLINE')) {
        this.advance();
      }

      if (this.isAtEnd()) break;

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (error) {
        // Error recovery: skip to next newline
        this.synchronize();
      }
    }

    const document: Document = {
      type: 'Document',
      statements,
      start: { line: 1, column: 1, offset: 0 },
      end: this.previous()?.end ?? { line: 1, column: 1, offset: 0 },
    };

    return { document, errors: this.errors };
  }

  private parseStatement(): Statement | null {
    const token = this.peek();

    // Section declaration: [SectionName]
    if (token.type === 'STRUCT_SECTION') {
      return this.parseSectionDeclaration();
    }

    // Version statement: §NAME:version
    if (token.type === 'META_VERSION') {
      return this.parseVersionStatement();
    }

    // Source statement: ©Author>...
    if (token.type === 'META_SOURCE') {
      return this.parseSourceStatement();
    }

    // Temporal prefix statements: @ > ? ≈
    if (this.isTemporalOperator(token.type)) {
      return this.parseTemporalStatement();
    }

    // State prefix expressions: ✓ ✗ ! ⚡
    if (this.isStateOperator(token.type)) {
      return this.parseExpressionStatement();
    }

    // Logic NOT expression: ¬
    if (token.type === 'LOGIC_NOT') {
      return this.parseExpressionStatement();
    }

    // Other expressions
    if (token.type === 'IDENTIFIER' || token.type === 'NUMBER') {
      return this.parseExpressionStatement();
    }

    // Unknown token - skip
    this.advance();
    return null;
  }

  private parseSectionDeclaration(): SectionDeclaration {
    const token = this.advance();
    // Extract content between [ and ]
    const content = token.value.slice(1, -1);

    return {
      type: 'SectionDeclaration',
      name: content,
      start: token.start,
      end: token.end,
    };
  }

  private parseVersionStatement(): VersionStatement {
    const start = this.peek().start;
    this.advance(); // consume §

    // Handle §0.2 (version without name) vs §MBEL:5.0 (version with name)
    let name: Identifier;
    let version = '';

    if (this.check('NUMBER')) {
      // Version without name - just a version number like §0.2
      name = {
        type: 'Identifier',
        name: '',
        start,
        end: start,
      };
      // Parse version number directly
      while (
        this.check('NUMBER') ||
        this.check('DOT') ||
        (this.check('UNKNOWN') && this.peek().value === '.')
      ) {
        version += this.advance().value;
      }
    } else if (this.check('IDENTIFIER')) {
      name = this.parseIdentifier();

      // Check for : or :: (optional for inline versions like Codex§0.2)
      if (this.check('RELATION_DEFINES')) {
        this.advance();
        // Parse version number - consume all parts including dots
        while (
          this.check('NUMBER') ||
          this.check('IDENTIFIER') ||
          this.check('DOT') ||
          (this.check('UNKNOWN') && this.peek().value === '.')
        ) {
          version += this.advance().value;
          if (this.check('RELATION_DEFINES')) {
            version += this.advance().value;
          }
        }
      }
    } else {
      // Unexpected token after §
      name = {
        type: 'Identifier',
        name: '',
        start,
        end: start,
      };
    }

    return {
      type: 'VersionStatement',
      name,
      version,
      start,
      end: this.previous()?.end ?? start,
    };
  }

  private parseSourceStatement(): SourceStatement {
    const start = this.peek().start;
    this.advance(); // consume ©

    const source = this.parseIdentifier();

    let action: Expression | null = null;
    if (!this.isAtEnd() && !this.check('NEWLINE')) {
      action = this.parseExpression();
    }

    return {
      type: 'SourceStatement',
      source,
      action,
      start,
      end: this.previous()?.end ?? start,
    };
  }

  private parseTemporalStatement(): AttributeStatement | TemporalStatement {
    const start = this.peek().start;
    const temporalToken = this.advance();
    const temporal = this.tokenToTemporal(temporalToken.type);

    // Check if this is a simple temporal expression or an attribute
    if (this.check('IDENTIFIER')) {
      const name = this.parseIdentifier();

      // Check for :: (attribute pattern)
      if (this.check('RELATION_DEFINES')) {
        this.advance();
        const value = this.check('NEWLINE') || this.isAtEnd() ? null : this.parseExpression();
        const metadata = this.check('STRUCT_METADATA') ? this.parseMetadata() : null;

        return {
          type: 'AttributeStatement',
          temporal,
          name,
          value,
          metadata,
          start,
          end: this.previous()?.end ?? start,
        };
      }

      // Check for metadata without ::
      if (this.check('STRUCT_METADATA')) {
        const metadata = this.parseMetadata();
        return {
          type: 'AttributeStatement',
          temporal,
          name,
          value: null,
          metadata,
          start,
          end: this.previous()?.end ?? start,
        };
      }

      // It's a temporal expression
      const expr = this.continueExpression(name);
      return {
        type: 'TemporalStatement',
        temporal,
        expression: expr,
        start,
        end: this.previous()?.end ?? start,
      };
    }

    // Parse as expression
    const expression = this.parseExpression();
    return {
      type: 'TemporalStatement',
      temporal,
      expression,
      start,
      end: this.previous()?.end ?? start,
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const start = this.peek().start;
    const expression = this.parseExpression();

    return {
      type: 'ExpressionStatement',
      expression,
      start,
      end: this.previous()?.end ?? start,
    };
  }

  private parseExpression(): Expression {
    return this.parseLogicOr();
  }

  private parseLogicOr(): Expression {
    let left = this.parseLogicAnd();

    while (this.check('LOGIC_OR')) {
      this.advance();
      const right = this.parseLogicAnd();
      left = {
        type: 'LogicExpression',
        operator: 'or',
        left,
        right,
        start: left.start,
        end: right.end,
      } as LogicExpression;
    }

    return left;
  }

  private parseLogicAnd(): Expression {
    let left = this.parseChain();

    while (this.check('LOGIC_AND')) {
      this.advance();
      const right = this.parseChain();
      left = {
        type: 'LogicExpression',
        operator: 'and',
        left,
        right,
        start: left.start,
        end: right.end,
      } as LogicExpression;
    }

    return left;
  }

  private parseChain(): Expression {
    let left = this.parseUnary();

    while (this.isChainOperator(this.peek().type)) {
      const op = this.advance();
      const operator = this.tokenToChainOperator(op.type);
      const right = this.parseUnary();
      left = {
        type: 'ChainExpression',
        operator,
        left,
        right,
        start: left.start,
        end: right.end,
      } as ChainExpression;
    }

    return left;
  }

  private parseUnary(): Expression {
    // NOT operator
    if (this.check('LOGIC_NOT')) {
      const op = this.advance();
      const right = this.parseUnary();
      return {
        type: 'LogicExpression',
        operator: 'not',
        left: null,
        right,
        start: op.start,
        end: right.end,
      } as LogicExpression;
    }

    // State operators
    if (this.isStateOperator(this.peek().type)) {
      return this.parseStateExpression();
    }

    return this.parsePrimary();
  }

  private parseStateExpression(): StateExpression {
    const token = this.advance();
    const state = this.tokenToState(token.type);
    const expression = this.parseChain();

    return {
      type: 'StateExpression',
      state,
      expression,
      start: token.start,
      end: expression.end,
    };
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    if (token.type === 'IDENTIFIER') {
      return this.parseIdentifierWithSuffix();
    }

    if (token.type === 'NUMBER') {
      return this.parseNumberLiteral();
    }

    if (token.type === 'STRUCT_METADATA') {
      return this.parseMetadata();
    }

    if (token.type === 'STRUCT_NOTE') {
      return this.parseNote();
    }

    if (token.type === 'STRUCT_VARIANT') {
      return this.parseVariant();
    }

    // Default: create an identifier from the token value
    this.advance();
    return {
      type: 'Identifier',
      name: token.value,
      start: token.start,
      end: token.end,
    } as Identifier;
  }

  private parseIdentifierWithSuffix(): Expression {
    const id = this.parseIdentifier();

    // Check for metadata suffix
    if (this.check('STRUCT_METADATA')) {
      const metadata = this.parseMetadata();
      // Return chain expression with metadata
      return {
        type: 'ChainExpression',
        operator: 'defines',
        left: id,
        right: metadata,
        start: id.start,
        end: metadata.end,
      } as ChainExpression;
    }

    // Check for note suffix
    if (this.check('STRUCT_NOTE')) {
      const note = this.parseNote();
      return {
        type: 'ChainExpression',
        operator: 'defines',
        left: id,
        right: note,
        start: id.start,
        end: note.end,
      } as ChainExpression;
    }

    // Check for variant suffix
    if (this.check('STRUCT_VARIANT')) {
      const variant = this.parseVariant();
      return {
        type: 'ChainExpression',
        operator: 'defines',
        left: id,
        right: variant,
        start: id.start,
        end: variant.end,
      } as ChainExpression;
    }

    return id;
  }

  private parseIdentifier(): Identifier {
    const token = this.advance();
    return {
      type: 'Identifier',
      name: token.value,
      start: token.start,
      end: token.end,
    };
  }

  private parseNumberLiteral(): NumberLiteral {
    const token = this.advance();
    let unit: string | null = null;

    if (this.check('IDENTIFIER')) {
      unit = this.advance().value;
    }

    return {
      type: 'NumberLiteral',
      value: token.value,
      unit,
      start: token.start,
      end: this.previous()?.end ?? token.end,
    };
  }

  private parseMetadata(): Metadata {
    const token = this.advance();
    const content = token.value.slice(1, -1); // Remove { and }

    // Parse metadata entries (simplified - just store raw content)
    const entries: Array<{ type: 'MetadataEntry'; key: string; operator: 'defines' | 'percent' | 'number' | 'range'; value: string; start: Position; end: Position }> = [];

    return {
      type: 'Metadata',
      content,
      entries,
      start: token.start,
      end: token.end,
    };
  }

  private parseNote(): Note {
    const token = this.advance();
    const content = token.value.slice(1, -1); // Remove ( and )

    return {
      type: 'Note',
      content,
      start: token.start,
      end: token.end,
    };
  }

  private parseVariant(): Variant {
    const token = this.advance();
    const content = token.value.slice(1, -1); // Remove < and >

    return {
      type: 'Variant',
      content,
      start: token.start,
      end: token.end,
    };
  }

  private continueExpression(left: Expression): Expression {
    while (this.isChainOperator(this.peek().type)) {
      const op = this.advance();
      const operator = this.tokenToChainOperator(op.type);
      const right = this.parseUnary();
      left = {
        type: 'ChainExpression',
        operator,
        left,
        right,
        start: left.start,
        end: right.end,
      } as ChainExpression;
    }
    return left;
  }

  // Helper methods
  private isTemporalOperator(type: TokenType): boolean {
    return ['TEMPORAL_PRESENT', 'TEMPORAL_PAST', 'TEMPORAL_FUTURE', 'TEMPORAL_APPROX'].includes(type);
  }

  private isStateOperator(type: TokenType): boolean {
    return ['STATE_COMPLETE', 'STATE_FAILED', 'STATE_CRITICAL', 'STATE_ACTIVE'].includes(type);
  }

  private isChainOperator(type: TokenType): boolean {
    return ['RELATION_DEFINES', 'RELATION_LEADS_TO', 'RELATION_FROM', 'RELATION_MUTUAL', 'RELATION_AND', 'RELATION_REMOVE'].includes(type);
  }

  private tokenToTemporal(type: TokenType): 'present' | 'past' | 'future' | 'approx' {
    switch (type) {
      case 'TEMPORAL_PRESENT': return 'present';
      case 'TEMPORAL_PAST': return 'past';
      case 'TEMPORAL_FUTURE': return 'future';
      case 'TEMPORAL_APPROX': return 'approx';
      default: return 'present';
    }
  }

  private tokenToState(type: TokenType): 'complete' | 'failed' | 'critical' | 'active' {
    switch (type) {
      case 'STATE_COMPLETE': return 'complete';
      case 'STATE_FAILED': return 'failed';
      case 'STATE_CRITICAL': return 'critical';
      case 'STATE_ACTIVE': return 'active';
      default: return 'complete';
    }
  }

  private tokenToChainOperator(type: TokenType): 'defines' | 'leads_to' | 'from' | 'mutual' | 'and' | 'remove' {
    switch (type) {
      case 'RELATION_DEFINES': return 'defines';
      case 'RELATION_LEADS_TO': return 'leads_to';
      case 'RELATION_FROM': return 'from';
      case 'RELATION_MUTUAL': return 'mutual';
      case 'RELATION_AND': return 'and';
      case 'RELATION_REMOVE': return 'remove';
      default: return 'defines';
    }
  }

  private peek(): Token {
    return this.tokens[this.current] ?? { type: 'EOF', value: '', start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 0 } };
  }

  private previous(): Token | undefined {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous() ?? this.peek();
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private addError(message: string, position: Position): void {
    this.errors.push({ message, position });
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous()?.type === 'NEWLINE') {
        return;
      }
      if (this.check('NEWLINE')) {
        this.advance();
        return;
      }
      this.advance();
    }
  }
}
