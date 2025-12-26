/**
 * MBEL v5 Semantic Analyzer
 *
 * Analyzes MBEL documents for errors, warnings, and suggestions.
 */

import { MbelParser, MbelLexer } from '@mbel/core';
import type { Document, ParseResult, SectionDeclaration, AttributeStatement, Token, Position } from '@mbel/core';
import type { AnalysisResult, AnalyzerOptions, Diagnostic, DiagnosticCode, QuickFix, TextEdit, RelatedInformation } from './types.js';

/**
 * MbelAnalyzer - Analyzes parsed MBEL documents for issues
 */
export class MbelAnalyzer {
  private readonly options: Required<AnalyzerOptions>;
  private readonly parser = new MbelParser();
  private readonly lexer = new MbelLexer();

  // Track source text for quick fix generation
  private sourceText = '';
  private diagnosticsWithContext: Map<Diagnostic, { source: string }> = new Map();

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      grammarChecks: options.grammarChecks ?? true,
      semanticChecks: options.semanticChecks ?? true,
      hints: options.hints ?? true,
    };
  }

  /**
   * Analyze a parsed document and return diagnostics
   */
  analyze(parseResult: ParseResult): AnalysisResult {
    const diagnostics: Diagnostic[] = [];
    const quickFixes: QuickFix[] = [];

    // Convert parser errors to diagnostics
    for (const error of parseResult.errors) {
      diagnostics.push(this.errorToDiagnostic(error.message, error.position));
    }

    // Analyze the AST
    if (this.options.grammarChecks) {
      diagnostics.push(...this.checkGrammar(parseResult.document));
    }

    if (this.options.semanticChecks) {
      diagnostics.push(...this.checkSemantics(parseResult.document));
    }

    return { diagnostics, quickFixes };
  }

  /**
   * Analyze source text directly (convenience method)
   */
  analyzeText(source: string): AnalysisResult {
    this.sourceText = source;
    this.diagnosticsWithContext.clear();

    const diagnostics: Diagnostic[] = [];
    const quickFixes: QuickFix[] = [];

    // First, run the lexer to get lexer errors
    const lexerResult = this.lexer.tokenize(source);
    for (const error of lexerResult.errors) {
      const diag = this.errorToDiagnostic(error.message, error.position);
      diagnostics.push(diag);
      this.diagnosticsWithContext.set(diag, { source });
    }

    // Check for unclosed brackets in tokens
    diagnostics.push(...this.checkUnclosedBrackets(lexerResult.tokens));

    // Parse and analyze
    const parseResult = this.parser.parse(source);

    // Add parser-specific errors (that weren't from lexer)
    for (const error of parseResult.errors) {
      // Skip duplicates from lexer
      const isDuplicate = diagnostics.some(d =>
        d.range.start.line === error.position.line &&
        d.range.start.column === error.position.column
      );
      if (!isDuplicate) {
        const diag = this.errorToDiagnostic(error.message, error.position);
        diagnostics.push(diag);
        this.diagnosticsWithContext.set(diag, { source });
      }
    }

    // Analyze the AST
    if (this.options.grammarChecks) {
      const grammarDiags = this.checkGrammar(parseResult.document);
      for (const diag of grammarDiags) {
        diagnostics.push(diag);
        this.diagnosticsWithContext.set(diag, { source });
      }
    }

    if (this.options.semanticChecks) {
      const semanticDiags = this.checkSemantics(parseResult.document);
      for (const diag of semanticDiags) {
        diagnostics.push(diag);
        this.diagnosticsWithContext.set(diag, { source });
      }
    }

    return { diagnostics, quickFixes };
  }

  /**
   * Get quick fixes for a specific diagnostic
   */
  getQuickFixes(diagnostic: Diagnostic): readonly QuickFix[] {
    const fixes: QuickFix[] = [];

    switch (diagnostic.code) {
      case 'ARTICLE_USAGE':
        fixes.push(this.createArticleRemovalFix(diagnostic));
        break;
      case 'UNCLOSED_SECTION':
        fixes.push(this.createClosingBracketFix(diagnostic, ']'));
        break;
      case 'UNCLOSED_METADATA':
        fixes.push(this.createClosingBracketFix(diagnostic, '}'));
        break;
      case 'UNCLOSED_NOTE':
        fixes.push(this.createClosingBracketFix(diagnostic, ')'));
        break;
      case 'UNCLOSED_VARIANT':
        fixes.push(this.createClosingBracketFix(diagnostic, '>'));
        break;
      case 'MISSING_VERSION':
        fixes.push(this.createVersionInsertFix(diagnostic));
        break;
    }

    return fixes;
  }

  // --- Private methods ---

  private errorToDiagnostic(message: string, position: Position): Diagnostic {
    let code: DiagnosticCode = 'UNEXPECTED_TOKEN';

    if (message.includes('Unknown character')) {
      code = 'UNKNOWN_CHARACTER';
    } else if (message.includes('Unclosed [')) {
      code = 'UNCLOSED_SECTION';
    } else if (message.includes('Unclosed {')) {
      code = 'UNCLOSED_METADATA';
    } else if (message.includes('Unclosed (')) {
      code = 'UNCLOSED_NOTE';
    } else if (message.includes('Unclosed <')) {
      code = 'UNCLOSED_VARIANT';
    }

    return {
      range: {
        start: position,
        end: { ...position, column: position.column + 1, offset: position.offset + 1 },
      },
      severity: 'error',
      code,
      message,
      source: 'mbel',
    };
  }

  private checkUnclosedBrackets(tokens: readonly Token[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const token of tokens) {
      // Check for unclosed section brackets [
      if (token.type === 'STRUCT_SECTION' && !token.value.endsWith(']')) {
        diagnostics.push({
          range: { start: token.start, end: token.end },
          severity: 'error',
          code: 'UNCLOSED_SECTION',
          message: 'Unclosed section bracket - missing ]',
          source: 'mbel',
        });
      }

      // Check for unclosed metadata braces {
      if (token.type === 'STRUCT_METADATA' && !token.value.endsWith('}')) {
        diagnostics.push({
          range: { start: token.start, end: token.end },
          severity: 'error',
          code: 'UNCLOSED_METADATA',
          message: 'Unclosed metadata brace - missing }',
          source: 'mbel',
        });
      }

      // Check for unclosed notes (
      if (token.type === 'STRUCT_NOTE' && !token.value.endsWith(')')) {
        diagnostics.push({
          range: { start: token.start, end: token.end },
          severity: 'error',
          code: 'UNCLOSED_NOTE',
          message: 'Unclosed note parenthesis - missing )',
          source: 'mbel',
        });
      }

      // Check for unclosed variants <
      if (token.type === 'STRUCT_VARIANT' && !token.value.endsWith('>')) {
        diagnostics.push({
          range: { start: token.start, end: token.end },
          severity: 'error',
          code: 'UNCLOSED_VARIANT',
          message: 'Unclosed variant bracket - missing >',
          source: 'mbel',
        });
      }
    }

    return diagnostics;
  }

  private checkGrammar(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Check for article usage in the source text
    diagnostics.push(...this.checkArticleUsage());

    // Check for CamelCase violations
    diagnostics.push(...this.checkCamelCase(document));

    return diagnostics;
  }

  private checkArticleUsage(): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const articlePattern = /\b(the|a|an)\s+/gi;
    const lines = this.sourceText.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line) continue;

      let match;
      while ((match = articlePattern.exec(line)) !== null) {
        const article = match[1];
        if (!article) continue;

        const column = match.index + 1;

        // Calculate offset
        let offset = 0;
        for (let i = 0; i < lineIdx; i++) {
          const prevLine = lines[i];
          offset += (prevLine?.length ?? 0) + 1; // +1 for newline
        }
        offset += match.index;

        diagnostics.push({
          range: {
            start: { line: lineIdx + 1, column, offset },
            end: { line: lineIdx + 1, column: column + article.length, offset: offset + article.length },
          },
          severity: 'warning',
          code: 'ARTICLE_USAGE',
          message: `Article "${article}" should be avoided in MBEL - use direct references`,
          source: 'mbel',
        });
      }
    }

    return diagnostics;
  }

  private checkCamelCase(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const underscorePattern = /_/;

    const checkIdentifier = (name: string, start: Position, end: Position): void => {
      if (underscorePattern.test(name)) {
        diagnostics.push({
          range: { start, end },
          severity: 'warning',
          code: 'NON_CAMEL_CASE',
          message: `Identifier "${name}" should use CamelCase instead of underscores`,
          source: 'mbel',
        });
      }
    };

    // Recursively check expressions for identifiers with underscores
    const checkExpression = (expr: unknown): void => {
      if (!expr || typeof expr !== 'object') return;

      const node = expr as { type?: string; name?: string; start?: Position; end?: Position; left?: unknown; right?: unknown; expression?: unknown };

      if (node.type === 'Identifier' && node.name && node.start && node.end) {
        checkIdentifier(node.name, node.start, node.end);
      }

      if (node.left) checkExpression(node.left);
      if (node.right) checkExpression(node.right);
      if (node.expression) checkExpression(node.expression);
    };

    for (const stmt of document.statements) {
      if (stmt.type === 'AttributeStatement') {
        const attr = stmt as AttributeStatement;

        // Check attribute name for underscores
        checkIdentifier(attr.name.name, attr.name.start, attr.name.end);

        // Check attribute value expression
        if (attr.value) {
          checkExpression(attr.value);
        }
      }
    }

    return diagnostics;
  }

  private checkSemantics(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Check for missing version statement
    diagnostics.push(...this.checkMissingVersion(document));

    // Check for unused sections
    diagnostics.push(...this.checkUnusedSections(document));

    // Check for duplicate sections
    diagnostics.push(...this.checkDuplicateSections(document));

    // Check for duplicate attributes
    diagnostics.push(...this.checkDuplicateAttributes(document));

    return diagnostics;
  }

  private checkMissingVersion(document: Document): Diagnostic[] {
    const hasVersion = document.statements.some(
      stmt => stmt.type === 'VersionStatement'
    );

    if (!hasVersion && document.statements.length > 0) {
      return [{
        range: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
        severity: 'warning',
        code: 'MISSING_VERSION',
        message: 'Document is missing version statement (e.g., §MBEL:5.0)',
        source: 'mbel',
      }];
    }

    return [];
  }

  private checkUnusedSections(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const sections: SectionDeclaration[] = [];
    let currentSectionHasContent = false;

    for (const stmt of document.statements) {
      if (stmt.type === 'SectionDeclaration') {
        // Check if the previous section was empty
        const lastSection = sections[sections.length - 1];
        if (lastSection && !currentSectionHasContent) {
          diagnostics.push({
            range: { start: lastSection.start, end: lastSection.end },
            severity: 'warning',
            code: 'UNUSED_SECTION',
            message: `Section "${lastSection.name}" has no content`,
            source: 'mbel',
          });
        }

        sections.push(stmt as SectionDeclaration);
        currentSectionHasContent = false;
      } else {
        // Non-section content found
        currentSectionHasContent = true;
      }
    }

    // Check the last section
    const lastSection = sections[sections.length - 1];
    if (lastSection && !currentSectionHasContent) {
      diagnostics.push({
        range: { start: lastSection.start, end: lastSection.end },
        severity: 'warning',
        code: 'UNUSED_SECTION',
        message: `Section "${lastSection.name}" has no content`,
        source: 'mbel',
      });
    }

    return diagnostics;
  }

  private checkDuplicateSections(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const sectionMap = new Map<string, SectionDeclaration>();

    for (const stmt of document.statements) {
      if (stmt.type === 'SectionDeclaration') {
        const section = stmt as SectionDeclaration;
        const existing = sectionMap.get(section.name);

        if (existing) {
          const relatedInfo: RelatedInformation[] = [{
            location: { start: existing.start, end: existing.end },
            message: 'First declaration here',
          }];

          diagnostics.push({
            range: { start: section.start, end: section.end },
            severity: 'warning',
            code: 'DUPLICATE_SECTION',
            message: `Duplicate section "${section.name}"`,
            source: 'mbel',
            relatedInfo,
          });
        } else {
          sectionMap.set(section.name, section);
        }
      }
    }

    return diagnostics;
  }

  private checkDuplicateAttributes(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const attrMap = new Map<string, AttributeStatement>();

    for (const stmt of document.statements) {
      if (stmt.type === 'AttributeStatement') {
        const attr = stmt as AttributeStatement;
        const existing = attrMap.get(attr.name.name);

        if (existing) {
          diagnostics.push({
            range: { start: attr.start, end: attr.end },
            severity: 'warning',
            code: 'DUPLICATE_ATTRIBUTE',
            message: `Duplicate attribute "${attr.name.name}"`,
            source: 'mbel',
          });
        } else {
          attrMap.set(attr.name.name, attr);
        }
      }
    }

    return diagnostics;
  }

  // --- Quick Fix Generators ---

  private createArticleRemovalFix(diagnostic: Diagnostic): QuickFix {
    const edit: TextEdit = {
      range: {
        start: diagnostic.range.start,
        end: {
          ...diagnostic.range.end,
          column: diagnostic.range.end.column + 1, // Include trailing space
          offset: diagnostic.range.end.offset + 1,
        },
      },
      newText: '',
    };

    return {
      title: 'Remove article',
      diagnostic,
      edits: [edit],
      isPreferred: true,
    };
  }

  private createClosingBracketFix(diagnostic: Diagnostic, bracket: string): QuickFix {
    const edit: TextEdit = {
      range: {
        start: diagnostic.range.end,
        end: diagnostic.range.end,
      },
      newText: bracket,
    };

    return {
      title: `Add closing ${bracket}`,
      diagnostic,
      edits: [edit],
      isPreferred: true,
    };
  }

  private createVersionInsertFix(diagnostic: Diagnostic): QuickFix {
    const edit: TextEdit = {
      range: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
      },
      newText: '§MBEL:5.0\n',
    };

    return {
      title: 'Add version statement',
      diagnostic,
      edits: [edit],
      isPreferred: true,
    };
  }
}
