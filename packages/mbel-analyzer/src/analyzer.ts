/**
 * MBEL v5 Semantic Analyzer
 *
 * Analyzes MBEL documents for errors, warnings, and suggestions.
 */

import { MbelParser, MbelLexer } from '@mbel/core';
import type {
  Document,
  ParseResult,
  SectionDeclaration,
  AttributeStatement,
  Token,
  Position,
  // MBEL v6 CrossRefLinks
  LinkDeclaration,
  FileRef,
} from '@mbel/core';
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

      // MBEL v6: Additional source-based link validation
      this.checkEntryPointFromSource(diagnostics);
      this.checkLineRangeFormat(diagnostics);
      this.checkUnknownMarkers(diagnostics);
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

    // MBEL v6: Check link declarations
    diagnostics.push(...this.checkLinkDeclarations(document));

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

  // =========================================
  // MBEL v6 CrossRefLinks Validation
  // =========================================

  /**
   * Check all link declarations for issues
   */
  private checkLinkDeclarations(document: Document): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Collect all link declarations
    const links: LinkDeclaration[] = [];
    const linkNames = new Map<string, LinkDeclaration>();
    const decisionNames = new Set<string>();

    // First pass: collect all declarations and decision names
    for (const stmt of document.statements) {
      if (stmt.type === 'LinkDeclaration') {
        const link = stmt as LinkDeclaration;
        links.push(link);
      }
      // Collect decision names from AttributeStatements (e.g., @2024-01-01::DecisionName)
      if (stmt.type === 'AttributeStatement') {
        const attr = stmt as AttributeStatement;
        if (attr.temporal === 'present' && attr.name.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // This is a decision with date prefix - the value contains the decision name
          // For now, just extract from metadata or value
        }
      }
    }

    // Extract decision names from decision-style statements in source text
    const decisionMatches = this.sourceText.match(/@\d{4}-\d{2}-\d{2}::(\w+)/g);
    if (decisionMatches) {
      for (const m of decisionMatches) {
        const name = m.match(/@\d{4}-\d{2}-\d{2}::(\w+)/)?.[1];
        if (name) {
          decisionNames.add(name);
        }
      }
    }

    // Validate each link declaration
    for (const link of links) {
      // MBEL-LINK-001: Check for empty name
      if (!link.name || link.name.trim() === '') {
        diagnostics.push({
          range: { start: link.start, end: link.end },
          severity: 'error',
          code: 'MBEL-LINK-001',
          message: 'Link declaration is missing a name',
          source: 'mbel',
        });
      }

      // MBEL-LINK-002: Check for invalid name characters (spaces)
      if (link.name && /\s/.test(link.name)) {
        diagnostics.push({
          range: { start: link.start, end: link.end },
          severity: 'error',
          code: 'MBEL-LINK-002',
          message: `Link name "${link.name}" contains invalid characters (spaces)`,
          source: 'mbel',
        });
      }

      // MBEL-LINK-003: Check for duplicate names
      const existingLink = linkNames.get(link.name);
      if (existingLink) {
        diagnostics.push({
          range: { start: link.start, end: link.end },
          severity: 'warning',
          code: 'MBEL-LINK-003',
          message: `Duplicate link name "${link.name}"`,
          source: 'mbel',
          relatedInfo: [{
            location: { start: existingLink.start, end: existingLink.end },
            message: 'First declaration here',
          }],
        });
      } else {
        linkNames.set(link.name, link);
      }

      // Validate file references
      if (link.files) {
        diagnostics.push(...this.validateFileRefs(link.files));
      }
      if (link.tests) {
        diagnostics.push(...this.validateFileRefs(link.tests));
      }
      if (link.docs) {
        diagnostics.push(...this.validateFileRefs(link.docs));
      }

      // MBEL-LINK-020: Check for undefined decision references
      if (link.decisions) {
        for (const decision of link.decisions) {
          if (!decisionNames.has(decision)) {
            diagnostics.push({
              range: { start: link.start, end: link.end },
              severity: 'warning',
              code: 'MBEL-LINK-020',
              message: `Reference to undefined decision "${decision}"`,
              source: 'mbel',
            });
          }
        }
      }

      // MBEL-LINK-021/022: Check related references
      if (link.related) {
        for (const related of link.related) {
          // MBEL-LINK-022: Self-reference
          if (related === link.name) {
            diagnostics.push({
              range: { start: link.start, end: link.end },
              severity: 'warning',
              code: 'MBEL-LINK-022',
              message: `Link "${link.name}" references itself in related`,
              source: 'mbel',
            });
          } else if (!linkNames.has(related) && !links.some(l => l.name === related)) {
            // MBEL-LINK-021: Undefined feature
            diagnostics.push({
              range: { start: link.start, end: link.end },
              severity: 'warning',
              code: 'MBEL-LINK-021',
              message: `Reference to undefined feature "${related}" in related`,
              source: 'mbel',
            });
          }
        }
      }

      // MBEL-LINK-031: Check for undefined dependencies
      if (link.depends) {
        for (const dep of link.depends) {
          if (!linkNames.has(dep) && !links.some(l => l.name === dep)) {
            diagnostics.push({
              range: { start: link.start, end: link.end },
              severity: 'warning',
              code: 'MBEL-LINK-031',
              message: `Reference to undefined dependency "${dep}"`,
              source: 'mbel',
            });
          }
        }
      }

      // MBEL-LINK-040/041: Check blueprint
      if (link.blueprint !== null && link.blueprint !== undefined) {
        if (link.blueprint.length === 0) {
          diagnostics.push({
            range: { start: link.start, end: link.end },
            severity: 'warning',
            code: 'MBEL-LINK-040',
            message: 'Blueprint is empty',
            source: 'mbel',
          });
        }
      }

      // Check for unquoted blueprint steps by looking at source
      this.checkUnquotedBlueprint(link, diagnostics);

      // MBEL-LINK-050/051: Check entryPoint
      if (link.entryPoint) {
        const ep = link.entryPoint;
        // Check format: file:symbol:line
        if (!ep.file || !ep.symbol) {
          diagnostics.push({
            range: { start: ep.start, end: ep.end },
            severity: 'error',
            code: 'MBEL-LINK-050',
            message: 'Invalid entryPoint format - expected file:symbol:line',
            source: 'mbel',
          });
        }
        // Line number validation is handled by the parser (it's parsed as number or null)
      }

      // MBEL-LINK-070: Orphan link (no files or tests)
      if (this.options.hints && (!link.files || link.files.length === 0) && (!link.tests || link.tests.length === 0)) {
        // Only warn if link has some other clause like 'related' but no files/tests
        if (link.related || link.depends || link.decisions) {
          diagnostics.push({
            range: { start: link.start, end: link.end },
            severity: 'hint',
            code: 'MBEL-LINK-070',
            message: `Link "${link.name}" has no files or tests associated`,
            source: 'mbel',
          });
        }
      }
    }

    // MBEL-LINK-030: Check for circular dependencies
    diagnostics.push(...this.checkCircularDependencies(links));

    return diagnostics;
  }

  /**
   * Validate file references for issues
   */
  private validateFileRefs(files: readonly FileRef[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    for (const file of files) {
      // MBEL-LINK-010: Invalid glob pattern
      if (file.isGlob) {
        // Check for invalid patterns like ***
        if (file.path.includes('***')) {
          diagnostics.push({
            range: { start: file.start, end: file.end },
            severity: 'error',
            code: 'MBEL-LINK-010',
            message: `Invalid glob pattern "${file.path}"`,
            source: 'mbel',
          });
        }
      }

      // MBEL-LINK-012: Line range start > end
      if (file.lineRange && file.lineRange.start > file.lineRange.end) {
        diagnostics.push({
          range: { start: file.start, end: file.end },
          severity: 'warning',
          code: 'MBEL-LINK-012',
          message: `Line range start (${file.lineRange.start}) is greater than end (${file.lineRange.end})`,
          source: 'mbel',
        });
      }

      // MBEL-LINK-060: Unknown marker
      // Note: Valid markers are TO-CREATE and TO-MODIFY, checked during parsing
      // This would catch any that slip through
    }

    return diagnostics;
  }

  /**
   * Check for unquoted blueprint steps by examining source text
   */
  private checkUnquotedBlueprint(link: LinkDeclaration, diagnostics: Diagnostic[]): void {
    // Look for ->blueprint[...] in source text
    const blueprintMatch = this.sourceText.match(/->blueprint\[([^\]]*)\]/);
    if (blueprintMatch) {
      const content = blueprintMatch[1];
      // Check if content has unquoted text (not starting with ")
      if (content && content.trim() && !content.trim().startsWith('"')) {
        diagnostics.push({
          range: { start: link.start, end: link.end },
          severity: 'warning',
          code: 'MBEL-LINK-041',
          message: 'Blueprint steps should be quoted strings',
          source: 'mbel',
        });
      }
    }
  }

  /**
   * Check for invalid entryPoint format and line number
   */
  private checkEntryPointFromSource(diagnostics: Diagnostic[]): void {
    // Look for ->entryPoint{...} in source text
    const entryPointMatches = this.sourceText.matchAll(/->entryPoint\{([^}]*)\}/g);
    for (const match of entryPointMatches) {
      const content = match[1];
      if (!content) continue;

      const parts = content.split(':');
      // Must have at least file:symbol
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        // Error already reported in link validation
        continue;
      }

      // Check if line number is non-numeric
      if (parts[2] && isNaN(parseInt(parts[2], 10))) {
        // Find the position in source
        const offset = match.index ?? 0;
        let line = 1;
        let column = 1;
        for (let i = 0; i < offset; i++) {
          if (this.sourceText[i] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }

        diagnostics.push({
          range: {
            start: { line, column, offset },
            end: { line, column: column + content.length, offset: offset + content.length },
          },
          severity: 'error',
          code: 'MBEL-LINK-051',
          message: `Non-numeric line number "${parts[2]}" in entryPoint`,
          source: 'mbel',
        });
      }
    }
  }

  /**
   * Check for unknown file markers in source
   */
  private checkUnknownMarkers(diagnostics: Diagnostic[]): void {
    // Valid markers are TO-CREATE and TO-MODIFY
    const markerPattern = /\{([A-Z]+-[A-Z]+)\}/g;
    let match;
    while ((match = markerPattern.exec(this.sourceText)) !== null) {
      const marker = match[1];
      if (marker !== 'TO-CREATE' && marker !== 'TO-MODIFY') {
        const offset = match.index;
        let line = 1;
        let column = 1;
        for (let i = 0; i < offset; i++) {
          if (this.sourceText[i] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }

        diagnostics.push({
          range: {
            start: { line, column, offset },
            end: { line, column: column + match[0].length, offset: offset + match[0].length },
          },
          severity: 'warning',
          code: 'MBEL-LINK-060',
          message: `Unknown file marker "${marker}". Valid markers are: TO-CREATE, TO-MODIFY`,
          source: 'mbel',
        });
      }
    }
  }

  /**
   * Check for invalid line range format in source
   */
  private checkLineRangeFormat(diagnostics: Diagnostic[]): void {
    // Look for file:abc-def patterns (invalid line range)
    const invalidRangePattern = /\[([^\]]*:[a-zA-Z]+-[a-zA-Z]+[^\]]*)\]/g;
    let match;
    while ((match = invalidRangePattern.exec(this.sourceText)) !== null) {
      const offset = match.index;
      let line = 1;
      let column = 1;
      for (let i = 0; i < offset; i++) {
        if (this.sourceText[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
      }

      diagnostics.push({
        range: {
          start: { line, column, offset },
          end: { line, column: column + match[0].length, offset: offset + match[0].length },
        },
        severity: 'error',
        code: 'MBEL-LINK-011',
        message: 'Invalid line range format - expected numeric range like :10-50',
        source: 'mbel',
      });
    }
  }

  /**
   * Check for circular dependencies between links
   */
  private checkCircularDependencies(links: LinkDeclaration[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Build dependency graph
    const dependencyMap = new Map<string, string[]>();
    for (const link of links) {
      if (link.depends && link.depends.length > 0) {
        dependencyMap.set(link.name, [...link.depends]);
      }
    }

    // DFS to find cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycleNodes = new Set<string>();

    const hasCycle = (node: string, path: string[]): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const deps = dependencyMap.get(node) ?? [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep, [...path, node])) {
            cycleNodes.add(node);
            return true;
          }
        } else if (recursionStack.has(dep)) {
          // Found cycle
          cycleNodes.add(node);
          cycleNodes.add(dep);
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check all nodes
    for (const link of links) {
      if (!visited.has(link.name)) {
        hasCycle(link.name, []);
      }
    }

    // Report cycles
    for (const link of links) {
      if (cycleNodes.has(link.name)) {
        diagnostics.push({
          range: { start: link.start, end: link.end },
          severity: 'warning',
          code: 'MBEL-LINK-030',
          message: `Circular dependency detected involving "${link.name}"`,
          source: 'mbel',
        });
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
