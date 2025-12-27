import type { Token, TokenType, Position, LexerResult, LexerError } from './types.js';

/**
 * MBEL v5 Lexer
 *
 * Tokenizes MBEL v5 source code into a stream of tokens.
 * Recognizes all 27 core operators and follows MBEL grammar rules.
 */
export class MbelLexer {
  private input = '';
  private pos = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];

  // MBEL v6 Arrow operators mapping (->keyword)
  private static readonly ARROW_OPERATORS: ReadonlyMap<string, TokenType> = new Map([
    ['files', 'ARROW_FILES'],
    ['tests', 'ARROW_TESTS'],
    ['docs', 'ARROW_DOCS'],
    ['decisions', 'ARROW_DECISIONS'],
    ['related', 'ARROW_RELATED'],
    ['entryPoint', 'ARROW_ENTRYPOINT'],
    ['blueprint', 'ARROW_BLUEPRINT'],
    ['depends', 'ARROW_DEPENDS'],
    ['features', 'ARROW_FEATURES'],
    ['why', 'ARROW_WHY'],
  ]);

  // Track if last token was an arrow operator (for STRUCT_LIST detection)
  private lastTokenWasArrow = false;

  // Single-char operators mapped to token types
  private static readonly SINGLE_CHAR_OPERATORS: ReadonlyMap<string, TokenType> = new Map([
    // Temporal
    ['>', 'TEMPORAL_PAST'],
    ['@', 'TEMPORAL_PRESENT'],
    ['?', 'TEMPORAL_FUTURE'],
    ['≈', 'TEMPORAL_APPROX'],
    // State
    ['✓', 'STATE_COMPLETE'],
    ['✗', 'STATE_FAILED'],
    ['!', 'STATE_CRITICAL'],
    ['⚡', 'STATE_ACTIVE'],
    // Relation (single char)
    ['+', 'RELATION_AND'],
    ['-', 'RELATION_REMOVE'],
    ['→', 'RELATION_LEADS_TO'],
    ['←', 'RELATION_FROM'],
    ['↔', 'RELATION_MUTUAL'],
    // Structure (single char)
    ['|', 'STRUCT_OR'],
    [',', 'SEPARATOR'],
    ['.', 'DOT'],
    ['/', 'SLASH'],
    ['^', 'CARET'],
    ['*', 'ASTERISK'],
    ['=', 'EQUALS'],
    // Quotes and apostrophes
    ["'", 'APOSTROPHE'],       // ' (ASCII)
    ['\u2018', 'APOSTROPHE'],  // ' (left single quote)
    ['\u2019', 'APOSTROPHE'],  // ' (right single quote)
    ['"', 'QUOTE'],            // " (ASCII)
    ['\u201C', 'QUOTE'],       // " (left double quote)
    ['\u201D', 'QUOTE'],       // " (right double quote)
    // Quantification
    ['#', 'QUANT_NUMBER'],
    ['%', 'QUANT_PERCENT'],
    ['~', 'QUANT_RANGE'],
    // Logic
    ['&', 'LOGIC_AND'],
    ['¬', 'LOGIC_NOT'],
    // Meta
    ['©', 'META_SOURCE'],
    ['§', 'META_VERSION'],
  ]);

  // Opening brackets and their closing counterparts
  private static readonly BRACKETS: ReadonlyMap<string, { close: string; type: TokenType }> = new Map([
    ['[', { close: ']', type: 'STRUCT_SECTION' }],
    ['{', { close: '}', type: 'STRUCT_METADATA' }],
    ['(', { close: ')', type: 'STRUCT_NOTE' }],
    ['<', { close: '>', type: 'STRUCT_VARIANT' }],
  ]);

  /**
   * Tokenize MBEL source code
   */
  tokenize(input: string): LexerResult {
    this.reset(input);

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.addToken('EOF', '');
    return { tokens: this.tokens, errors: this.errors };
  }

  private reset(input: string): void {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
    this.lastTokenWasArrow = false;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input.charAt(this.pos);
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.input.length) return '\0';
    return this.input.charAt(this.pos + 1);
  }

  private peekAt(offset: number): string {
    if (this.pos + offset >= this.input.length) return '\0';
    return this.input.charAt(this.pos + offset);
  }

  private advance(): string {
    const char = this.input.charAt(this.pos);
    this.pos++;

    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  private currentPosition(): Position {
    return {
      line: this.line,
      column: this.column,
      offset: this.pos,
    };
  }

  private addToken(type: TokenType, value: string, start?: Position): void {
    const tokenStart = start ?? {
      line: this.line,
      column: this.column - value.length,
      offset: this.pos - value.length,
    };

    // Calculate end position
    let endLine = tokenStart.line;
    let endColumn = tokenStart.column;
    let endOffset = tokenStart.offset;

    for (const char of value) {
      if (char === '\n') {
        endLine++;
        endColumn = 1;
      } else {
        endColumn++;
      }
      endOffset++;
    }

    this.tokens.push({
      type,
      value,
      start: tokenStart,
      end: { line: endLine, column: endColumn, offset: endOffset },
    });
  }

  private addError(message: string, position?: Position): void {
    this.errors.push({
      message,
      position: position ?? this.currentPosition(),
    });
  }

  private scanToken(): void {
    const start = this.currentPosition();
    const char = this.peek();

    // Skip whitespace (except newlines)
    if (char === ' ' || char === '\t') {
      this.advance();
      return;
    }

    // Handle newlines
    if (char === '\n') {
      this.advance();
      this.addToken('NEWLINE', '\n', start);
      return;
    }

    // Handle CRLF
    if (char === '\r') {
      this.advance();
      if (this.peek() === '\n') {
        this.advance();
      }
      this.addToken('NEWLINE', '\n', start);
      return;
    }

    // Check for code blocks (```)
    if (char === '`' && this.peekNext() === '`' && this.peekAt(2) === '`') {
      this.scanCodeBlock(start);
      return;
    }

    // MBEL v6: Check for arrow operators (->keyword) BEFORE checking for '-'
    if (char === '-' && this.peekNext() === '>') {
      if (this.scanArrowOperator(start)) {
        return;
      }
    }

    // MBEL v6: Check for link markers (@feature, @task) BEFORE checking for '@'
    if (char === '@') {
      if (this.scanLinkMarker(start)) {
        return;
      }
    }

    // Check for two-character operators first
    if (this.matchTwoCharOperator(start)) {
      return;
    }

    // Check for bracket structures
    const bracket = MbelLexer.BRACKETS.get(char);
    if (bracket) {
      // MBEL v6: After arrow operators, [ becomes STRUCT_LIST
      if (char === '[' && this.lastTokenWasArrow) {
        this.scanBracketedContent(']', 'STRUCT_LIST', start);
        this.lastTokenWasArrow = false;
        return;
      }
      this.scanBracketedContent(bracket.close, bracket.type, start);
      return;
    }

    // Check for single-character operators
    const singleOp = MbelLexer.SINGLE_CHAR_OPERATORS.get(char);
    if (singleOp) {
      this.advance();
      this.addToken(singleOp, char, start);
      this.lastTokenWasArrow = false;
      return;
    }

    // Numbers
    if (this.isDigit(char)) {
      this.scanNumber(start);
      return;
    }

    // Identifiers
    if (this.isIdentifierStart(char)) {
      this.scanIdentifier(start);
      return;
    }

    // Unknown character
    this.advance();
    this.addError(`Unknown character: '${char}'`, start);
    this.addToken('UNKNOWN', char, start);
  }

  private matchTwoCharOperator(start: Position): boolean {
    const char = this.peek();
    const next = this.peekNext();

    // :: (RELATION_DEFINES) - two colons
    if (char === ':' && next === ':') {
      this.advance();
      this.advance();
      this.addToken('RELATION_DEFINES', '::', start);
      return true;
    }

    // : (RELATION_DEFINES) - single colon also valid in MBEL (e.g., §MBEL:5.0)
    if (char === ':') {
      this.advance();
      this.addToken('RELATION_DEFINES', ':', start);
      return true;
    }

    // || (LOGIC_OR)
    if (char === '|' && next === '|') {
      this.advance();
      this.advance();
      this.addToken('LOGIC_OR', '||', start);
      return true;
    }

    return false;
  }

  private scanBracketedContent(closeChar: string, type: TokenType, start: Position): void {
    const openChar = this.advance(); // consume opening bracket
    let content = openChar;
    let depth = 1;

    while (!this.isAtEnd() && depth > 0) {
      const char = this.peek();

      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
      }

      content += this.advance();
    }

    if (depth > 0) {
      this.addError(`Unclosed ${openChar}`, start);
    }

    this.addToken(type, content, start);
  }

  private scanNumber(start: Position): void {
    let value = '';

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Check for decimal
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    this.addToken('NUMBER', value, start);
  }

  private scanIdentifier(start: Position): void {
    let value = '';

    while (this.isIdentifierPart(this.peek())) {
      value += this.advance();
    }

    this.addToken('IDENTIFIER', value, start);
    this.lastTokenWasArrow = false;
  }

  /**
   * MBEL v6: Scan arrow operators (->keyword)
   * Returns true if an arrow operator was matched, false otherwise.
   */
  private scanArrowOperator(start: Position): boolean {
    // We already know we're at '->'
    // Look ahead to extract the keyword following '->'
    let keyword = '';
    let offset = 2; // Skip '->'

    // Extract keyword characters
    while (this.isIdentifierPart(this.peekAt(offset))) {
      keyword += this.peekAt(offset);
      offset++;
    }

    // Check if this keyword is a known arrow operator
    const tokenType = MbelLexer.ARROW_OPERATORS.get(keyword);
    if (tokenType) {
      // Consume '->' + keyword
      const value = '->' + keyword;
      for (let i = 0; i < value.length; i++) {
        this.advance();
      }
      this.addToken(tokenType, value, start);
      this.lastTokenWasArrow = true;
      return true;
    }

    // Not a recognized arrow operator
    return false;
  }

  /**
   * MBEL v6: Scan link markers (@feature, @task)
   * Returns true if a link marker was matched, false otherwise.
   */
  private scanLinkMarker(start: Position): boolean {
    // We already know we're at '@'
    // Look ahead to extract the keyword following '@'
    let keyword = '';
    let offset = 1; // Skip '@'

    // Extract keyword characters
    while (this.isIdentifierPart(this.peekAt(offset))) {
      keyword += this.peekAt(offset);
      offset++;
    }

    // Check for @feature or @task
    if (keyword === 'feature') {
      const value = '@feature';
      for (let i = 0; i < value.length; i++) {
        this.advance();
      }
      this.addToken('LINK_FEATURE', value, start);
      this.lastTokenWasArrow = false;
      return true;
    }

    if (keyword === 'task') {
      const value = '@task';
      for (let i = 0; i < value.length; i++) {
        this.advance();
      }
      this.addToken('LINK_TASK', value, start);
      this.lastTokenWasArrow = false;
      return true;
    }

    // Not a recognized link marker
    return false;
  }

  private scanCodeBlock(start: Position): void {
    // Consume opening ```
    let content = this.advance() + this.advance() + this.advance();

    // Skip optional language identifier on same line
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      content += this.advance();
    }

    // Consume content until closing ```
    while (!this.isAtEnd()) {
      // Check for closing ```
      if (this.peek() === '`' && this.peekNext() === '`' && this.peekAt(2) === '`') {
        content += this.advance() + this.advance() + this.advance();
        break;
      }
      content += this.advance();
    }

    this.addToken('CODE_BLOCK', content, start);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  // Unicode operators that should NOT be treated as identifier chars
  private static readonly UNICODE_OPERATORS = new Set([
    '≈', '✓', '✗', '⚡', '→', '←', '↔', '¬', '©', '§',
  ]);

  private isIdentifierStart(char: string): boolean {
    // Exclude Unicode operators
    if (MbelLexer.UNICODE_OPERATORS.has(char)) {
      return false;
    }

    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_' ||
      char.charCodeAt(0) > 127 // Unicode letters (but not operators)
    );
  }

  private isIdentifierPart(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }
}
