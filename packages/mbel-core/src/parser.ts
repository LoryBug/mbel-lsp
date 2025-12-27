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
  // MBEL v6 CrossRefLinks
  LinkDeclaration,
  LinkType,
  FileRef,
  FileMarker,
  EntryPoint,
  LineRange,
  // MBEL v6 SemanticAnchors (TDDAB#10)
  AnchorDeclaration,
  AnchorType,
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

    // MBEL v6: Link declarations (@feature, @task)
    if (token.type === 'LINK_FEATURE' || token.type === 'LINK_TASK') {
      return this.parseLinkDeclaration();
    }

    // MBEL v6: Anchor declarations (@entry::, @hotspot::, @boundary::) - TDDAB#10
    if (this.isAnchorToken(token.type)) {
      return this.parseAnchorDeclaration();
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

  // =========================================
  // MBEL v6 CrossRefLinks Parsing
  // =========================================

  /**
   * Parse link declaration: @feature{Name}->files[...]->tests[...]...
   */
  private parseLinkDeclaration(): LinkDeclaration {
    const start = this.peek().start;
    const linkTypeToken = this.advance();
    const linkType: LinkType = linkTypeToken.type === 'LINK_FEATURE' ? 'feature' : 'task';

    // Parse name from following STRUCT_METADATA {Name}
    let name = '';
    if (this.check('STRUCT_METADATA')) {
      const metadataToken = this.advance();
      name = metadataToken.value.slice(1, -1); // Remove { and }
    } else {
      this.addError('Expected link name in braces', this.peek().start);
    }

    // Initialize all clause values
    let files: FileRef[] | null = null;
    let tests: FileRef[] | null = null;
    let docs: FileRef[] | null = null;
    let decisions: string[] | null = null;
    let related: string[] | null = null;
    let entryPoint: EntryPoint | null = null;
    let blueprint: string[] | null = null;
    let depends: string[] | null = null;

    // Parse arrow clauses (may span multiple lines)
    let hasMoreArrows = true;
    while (hasMoreArrows) {
      // Skip newlines between arrow clauses
      while (this.check('NEWLINE')) {
        this.advance();
      }

      if (!this.isArrowOperator(this.peek().type)) {
        hasMoreArrows = false;
        continue;
      }

      const arrowToken = this.advance();

      switch (arrowToken.type) {
        case 'ARROW_FILES':
          if (this.check('STRUCT_LIST')) {
            files = this.parseFileRefList();
          }
          break;

        case 'ARROW_TESTS':
          if (this.check('STRUCT_LIST')) {
            tests = this.parseFileRefList();
          }
          break;

        case 'ARROW_DOCS':
          if (this.check('STRUCT_LIST')) {
            docs = this.parseFileRefList();
          }
          break;

        case 'ARROW_DECISIONS':
          if (this.check('STRUCT_LIST')) {
            decisions = this.parseStringList();
          }
          break;

        case 'ARROW_RELATED':
          if (this.check('STRUCT_LIST')) {
            related = this.parseStringList();
          }
          break;

        case 'ARROW_ENTRYPOINT':
          if (this.check('STRUCT_METADATA')) {
            entryPoint = this.parseEntryPoint();
          }
          break;

        case 'ARROW_BLUEPRINT':
          if (this.check('STRUCT_LIST')) {
            blueprint = this.parseQuotedStringList();
          }
          break;

        case 'ARROW_DEPENDS':
          if (this.check('STRUCT_LIST')) {
            depends = this.parseStringList();
          }
          break;

        case 'ARROW_FEATURES':
        case 'ARROW_WHY':
          // Skip these for now, just consume the list if present
          if (this.check('STRUCT_LIST')) {
            this.advance();
          }
          break;
      }
    }

    return {
      type: 'LinkDeclaration',
      linkType,
      name,
      files,
      tests,
      docs,
      decisions,
      related,
      entryPoint,
      blueprint,
      depends,
      start,
      end: this.previous()?.end ?? start,
    };
  }

  /**
   * Parse file reference list from STRUCT_LIST token
   * e.g., [src/a.ts,src/b.ts{TO-CREATE}]
   */
  private parseFileRefList(): FileRef[] {
    const listToken = this.advance();
    const content = listToken.value.slice(1, -1); // Remove [ and ]
    const files: FileRef[] = [];

    if (!content.trim()) {
      return files;
    }

    // Split by comma, but be careful with commas inside braces
    const parts = this.splitByComma(content);

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        files.push(this.parseFileRef(trimmed, listToken.start));
      }
    }

    return files;
  }

  /**
   * Parse a single file reference
   * e.g., src/file.ts, src/file.ts{TO-CREATE}, src/file.ts:10-50, src/**\/*.ts
   */
  private parseFileRef(input: string, position: Position): FileRef {
    let path = input;
    let marker: FileMarker | null = null;
    let lineRange: LineRange | null = null;
    let isGlob = false;

    // Check for marker {TO-CREATE} or {TO-MODIFY}
    const markerMatch = input.match(/\{(TO-CREATE|TO-MODIFY)\}$/);
    if (markerMatch) {
      marker = markerMatch[1] as FileMarker;
      path = input.slice(0, -markerMatch[0].length);
    }

    // Check for line range :start-end (but not glob pattern colons)
    const lineRangeMatch = path.match(/:(\d+)-(\d+)$/);
    if (lineRangeMatch && lineRangeMatch[1] && lineRangeMatch[2]) {
      lineRange = {
        start: parseInt(lineRangeMatch[1], 10),
        end: parseInt(lineRangeMatch[2], 10),
      };
      path = path.slice(0, -lineRangeMatch[0].length);
    }

    // Check for glob patterns
    if (path.includes('*') || path.includes('?')) {
      isGlob = true;
    }

    return {
      type: 'FileRef',
      path,
      marker,
      lineRange,
      isGlob,
      start: position,
      end: position,
    };
  }

  /**
   * Parse string list from STRUCT_LIST token
   * e.g., [ItemA,ItemB,ItemC]
   */
  private parseStringList(): string[] {
    const listToken = this.advance();
    const content = listToken.value.slice(1, -1); // Remove [ and ]

    if (!content.trim()) {
      return [];
    }

    return this.splitByComma(content).map(s => s.trim()).filter(s => s);
  }

  /**
   * Parse quoted string list from STRUCT_LIST token
   * e.g., ["Step 1: Create","Step 2: Test"]
   */
  private parseQuotedStringList(): string[] {
    const listToken = this.advance();
    const content = listToken.value.slice(1, -1); // Remove [ and ]
    const strings: string[] = [];

    // Match quoted strings
    const regex = /"([^"]*)"(?:,|$)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1] !== undefined) {
        strings.push(match[1]);
      }
    }

    return strings;
  }

  /**
   * Parse entry point from STRUCT_METADATA token
   * e.g., {file.ts:functionName:42}
   */
  private parseEntryPoint(): EntryPoint {
    const token = this.advance();
    const content = token.value.slice(1, -1); // Remove { and }
    const parts = content.split(':');

    return {
      type: 'EntryPoint',
      file: parts[0] ?? '',
      symbol: parts[1] ?? '',
      line: parts[2] ? parseInt(parts[2], 10) : null,
      start: token.start,
      end: token.end,
    };
  }

  /**
   * Split string by comma, respecting braces
   */
  private splitByComma(input: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of input) {
      if (char === '{') {
        depth++;
        current += char;
      } else if (char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  /**
   * Check if token is an arrow operator
   */
  private isArrowOperator(type: TokenType): boolean {
    return [
      'ARROW_FILES',
      'ARROW_TESTS',
      'ARROW_DOCS',
      'ARROW_DECISIONS',
      'ARROW_RELATED',
      'ARROW_ENTRYPOINT',
      'ARROW_BLUEPRINT',
      'ARROW_DEPENDS',
      'ARROW_FEATURES',
      'ARROW_WHY',
    ].includes(type);
  }

  // =========================================
  // MBEL v6 SemanticAnchors Parsing (TDDAB#10)
  // =========================================

  /**
   * Check if token is an anchor prefix (@entry::, @hotspot::, @boundary::)
   */
  private isAnchorToken(type: TokenType): boolean {
    return ['ANCHOR_ENTRY', 'ANCHOR_HOTSPOT', 'ANCHOR_BOUNDARY'].includes(type);
  }

  /**
   * Get anchor type from token type
   */
  private getAnchorType(type: TokenType): AnchorType {
    switch (type) {
      case 'ANCHOR_ENTRY': return 'entry';
      case 'ANCHOR_HOTSPOT': return 'hotspot';
      case 'ANCHOR_BOUNDARY': return 'boundary';
      default: return 'entry';
    }
  }

  /**
   * Parse anchor declaration
   * e.g., @entry::src/index.ts
   *         ->descrizione::Main entry point
   */
  private parseAnchorDeclaration(): AnchorDeclaration {
    const start = this.peek().start;
    const anchorToken = this.advance(); // ANCHOR_ENTRY | ANCHOR_HOTSPOT | ANCHOR_BOUNDARY
    const anchorType = this.getAnchorType(anchorToken.type);

    // Parse path (everything until newline, ->descrizione, or end)
    // Preserve original spacing by checking token positions
    let path = '';
    let lastEnd: Position | null = null;
    while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('ARROW_DESCRIZIONE')) {
      const token = this.advance();
      // Check if there was whitespace between tokens (offset gap)
      if (lastEnd !== null && token.start.offset > lastEnd.offset) {
        path += ' '; // There was actual whitespace in original
      }
      path += token.value;
      lastEnd = token.end;
    }
    path = path.trim();

    // Check if path is a glob pattern
    const isGlob = /[*?]/.test(path);

    // Optional: parse ->descrizione clause
    let description: string | null = null;
    let end = this.previous()?.end ?? start;

    // Skip newlines and check for ->descrizione
    while (this.check('NEWLINE')) {
      this.advance();
    }

    if (this.check('ARROW_DESCRIZIONE')) {
      this.advance(); // consume ->descrizione

      // Expect :: after ->descrizione
      if (this.check('RELATION_DEFINES')) {
        this.advance(); // consume ::

        // Collect description text until newline or end
        // Use spaces between tokens to preserve whitespace
        const descTokens: string[] = [];
        while (!this.isAtEnd() && !this.check('NEWLINE')) {
          const token = this.advance();
          descTokens.push(token.value);
        }
        description = descTokens.join(' ').trim();
        end = this.previous()?.end ?? end;
      }
    }

    return {
      type: 'AnchorDeclaration',
      anchorType,
      path,
      isGlob,
      description,
      start,
      end,
    };
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
