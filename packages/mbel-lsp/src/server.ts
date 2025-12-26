/**
 * MBEL v5 Language Server
 *
 * Implements the Language Server Protocol for MBEL documents.
 */

import {
  InitializeParams,
  InitializeResult,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  Hover,
  CompletionItem,
  CompletionItemKind,
  DocumentSymbol,
  SymbolKind,
  SymbolInformation,
  Position,
  Range,
  Location,
  MarkupKind,
} from 'vscode-languageserver/node.js';

import { MbelAnalyzer } from '@mbel/analyzer';
import { MbelParser } from '@mbel/core';
import type { Diagnostic } from '@mbel/analyzer';
import type { MbelServerOptions, DocumentState } from './types.js';
import { createInitializeResult } from './types.js';

/**
 * Operator documentation for hover and completion
 */
const OPERATOR_INFO: Record<string, { label: string; description: string; category: string }> = {
  // Temporal
  '@': { label: '@', description: 'Present/current state marker', category: 'Temporal' },
  '>': { label: '>', description: 'Past/completed state marker', category: 'Temporal' },
  '?': { label: '?', description: 'Future/planned state marker', category: 'Temporal' },
  '≈': { label: '≈', description: 'Approximate/estimated state marker', category: 'Temporal' },
  // State
  '✓': { label: '✓', description: 'Complete/done state', category: 'State' },
  '✗': { label: '✗', description: 'Failed/cancelled state', category: 'State' },
  '!': { label: '!', description: 'Critical/important marker', category: 'State' },
  '⚡': { label: '⚡', description: 'Active/in-progress state', category: 'State' },
  // Relation
  '::': { label: '::', description: 'Defines/binds relation', category: 'Relation' },
  ':': { label: ':', description: 'Simple binding (version)', category: 'Relation' },
  '→': { label: '→', description: 'Leads to/causes relation', category: 'Relation' },
  '←': { label: '←', description: 'Comes from/caused by relation', category: 'Relation' },
  '↔': { label: '↔', description: 'Mutual/bidirectional relation', category: 'Relation' },
  '+': { label: '+', description: 'Addition/combination', category: 'Relation' },
  '-': { label: '-', description: 'Removal/subtraction', category: 'Relation' },
  // Structure
  '[': { label: '[...]', description: 'Section declaration', category: 'Structure' },
  '{': { label: '{...}', description: 'Metadata block', category: 'Structure' },
  '(': { label: '(...)', description: 'Note/comment block', category: 'Structure' },
  '<': { label: '<...>', description: 'Variant/template block', category: 'Structure' },
  '|': { label: '|', description: 'Alternative/or separator', category: 'Structure' },
  // Quantification
  '#': { label: '#', description: 'Count/number quantifier', category: 'Quantification' },
  '%': { label: '%', description: 'Percentage quantifier', category: 'Quantification' },
  '~': { label: '~', description: 'Range/approximate quantifier', category: 'Quantification' },
  // Logic
  '&': { label: '&', description: 'Logical AND', category: 'Logic' },
  '||': { label: '||', description: 'Logical OR', category: 'Logic' },
  '¬': { label: '¬', description: 'Logical NOT', category: 'Logic' },
  // Meta
  '§': { label: '§', description: 'Version declaration', category: 'Meta' },
  '©': { label: '©', description: 'Source/attribution', category: 'Meta' },
};

/**
 * MbelServer - Language Server for MBEL v5
 */
export class MbelServer {
  private readonly analyzer: MbelAnalyzer;
  private readonly parser = new MbelParser();
  private readonly documents = new Map<string, DocumentState>();
  private readonly options: Required<MbelServerOptions>;

  constructor(options: MbelServerOptions = {}) {
    this.options = {
      grammarChecks: options.grammarChecks ?? true,
      semanticChecks: options.semanticChecks ?? true,
      hints: options.hints ?? true,
    };
    this.analyzer = new MbelAnalyzer(this.options);
  }

  /**
   * Handle initialize request
   */
  onInitialize(params: InitializeParams): InitializeResult {
    void params;
    return createInitializeResult();
  }

  /**
   * Handle initialized notification
   */
  onInitialized(): void {
    // Server is initialized and ready
  }

  /**
   * Handle document open
   */
  onDidOpenTextDocument(uri: string, version: number, content: string): void {
    this.documents.set(uri, { uri, version, content });
  }

  /**
   * Handle document change
   */
  onDidChangeTextDocument(uri: string, version: number, content: string): void {
    this.documents.set(uri, { uri, version, content });
  }

  /**
   * Handle document close
   */
  onDidCloseTextDocument(uri: string): void {
    this.documents.delete(uri);
  }

  /**
   * Get diagnostics for a document
   */
  getDiagnostics(uri: string): readonly LspDiagnostic[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    const result = this.analyzer.analyzeText(doc.content);
    return result.diagnostics.map(d => this.toLspDiagnostic(d));
  }

  /**
   * Handle shutdown request
   */
  onShutdown(): void {
    this.documents.clear();
  }

  /**
   * Get document state
   */
  getDocument(uri: string): DocumentState | undefined {
    return this.documents.get(uri);
  }

  /**
   * Check if document is open
   */
  hasDocument(uri: string): boolean {
    return this.documents.has(uri);
  }

  /**
   * Get all open documents
   */
  getOpenDocuments(): readonly string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Get hover info at position
   */
  getHover(uri: string, position: Position): Hover | null {
    const doc = this.documents.get(uri);
    if (!doc) {
      return null;
    }

    const lines = doc.content.split('\n');
    const line = lines[position.line];
    if (!line) {
      return null;
    }

    // Check for operator at position
    const char = line.charAt(position.character);
    const twoChar = line.substring(position.character, position.character + 2);

    // Check two-char operators first
    if (twoChar === '::' || twoChar === '||') {
      const info = OPERATOR_INFO[twoChar];
      if (info) {
        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `**${info.label}** - ${info.category}\n\n${info.description}`,
          },
        };
      }
    }

    // Check single-char operators
    const info = OPERATOR_INFO[char];
    if (info) {
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: `**${info.label}** - ${info.category}\n\n${info.description}`,
        },
      };
    }

    return null;
  }

  /**
   * Get completions at position
   */
  getCompletions(uri: string, position: Position): CompletionItem[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    // Position can be used for context-aware completions in the future
    void position;

    // Return all operators as completions
    const completions: CompletionItem[] = [];

    for (const [op, info] of Object.entries(OPERATOR_INFO)) {
      completions.push({
        label: op,
        kind: CompletionItemKind.Operator,
        documentation: {
          kind: MarkupKind.Markdown,
          value: `**${info.category}**: ${info.description}`,
        },
        detail: info.category,
      });
    }

    return completions;
  }

  /**
   * Get document symbols
   */
  getDocumentSymbols(uri: string): DocumentSymbol[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    const parseResult = this.parser.parse(doc.content);
    const symbols: DocumentSymbol[] = [];
    let currentSection: DocumentSymbol | null = null;

    for (const stmt of parseResult.document.statements) {
      if (stmt.type === 'SectionDeclaration') {
        // Save previous section if exists
        if (currentSection) {
          symbols.push(currentSection);
        }

        // Create new section symbol
        currentSection = {
          name: stmt.name,
          kind: SymbolKind.Module,
          range: this.toLspRange(stmt.start, stmt.end),
          selectionRange: this.toLspRange(stmt.start, stmt.end),
          children: [],
        };
      } else if (stmt.type === 'VersionStatement') {
        const symbol: DocumentSymbol = {
          name: stmt.name.name,
          kind: SymbolKind.Constant,
          range: this.toLspRange(stmt.start, stmt.end),
          selectionRange: this.toLspRange(stmt.name.start, stmt.name.end),
          detail: stmt.version,
        };

        if (currentSection) {
          currentSection.children?.push(symbol);
        } else {
          symbols.push(symbol);
        }
      } else if (stmt.type === 'AttributeStatement') {
        const symbol: DocumentSymbol = {
          name: stmt.name.name,
          kind: SymbolKind.Property,
          range: this.toLspRange(stmt.start, stmt.end),
          selectionRange: this.toLspRange(stmt.name.start, stmt.name.end),
        };

        if (currentSection) {
          currentSection.children?.push(symbol);
        } else {
          symbols.push(symbol);
        }
      }
    }

    // Don't forget the last section
    if (currentSection) {
      symbols.push(currentSection);
    }

    return symbols;
  }

  /**
   * Get definition location for identifier at position
   */
  getDefinition(uri: string, position: Position): Location | null {
    const doc = this.documents.get(uri);
    if (!doc) {
      return null;
    }

    // Get the word at the cursor position
    const word = this.getWordAtPosition(doc.content, position);
    if (!word) {
      return null;
    }

    // Parse the document to find definitions
    const parseResult = this.parser.parse(doc.content);

    // Search for section declaration [WORD]
    for (const stmt of parseResult.document.statements) {
      if (stmt.type === 'SectionDeclaration' && stmt.name === word) {
        return {
          uri,
          range: this.toLspRange(stmt.start, stmt.end),
        };
      }
    }

    // Search for attribute definition @word::
    for (const stmt of parseResult.document.statements) {
      if (stmt.type === 'AttributeStatement' && stmt.name.name === word) {
        return {
          uri,
          range: this.toLspRange(stmt.name.start, stmt.name.end),
        };
      }
    }

    // Search for version statement §WORD:
    for (const stmt of parseResult.document.statements) {
      if (stmt.type === 'VersionStatement' && stmt.name.name === word) {
        return {
          uri,
          range: this.toLspRange(stmt.start, stmt.end),
        };
      }
    }

    return null;
  }

  /**
   * Find all references to the symbol at the given position
   */
  getReferences(uri: string, position: Position): Location[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    // Get the word at the cursor position
    const word = this.getWordAtPosition(doc.content, position);
    if (!word) {
      return [];
    }

    // Find all occurrences of the word in the document
    return this.findWordOccurrences(uri, doc.content, word);
  }

  /**
   * Find all occurrences of a word in content
   */
  private findWordOccurrences(uri: string, content: string, word: string): Location[] {
    const locations: Location[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) {
        continue;
      }
      let searchStart = 0;

      while (searchStart < line.length) {
        const index = line.indexOf(word, searchStart);
        if (index === -1) {
          break;
        }

        // Check word boundaries - must be a complete word
        const charBefore = index > 0 ? line.charAt(index - 1) : '';
        const charAfter = index + word.length < line.length ? line.charAt(index + word.length) : '';

        const isWordBoundaryBefore = !this.isIdentifierChar(charBefore);
        const isWordBoundaryAfter = !this.isIdentifierChar(charAfter);

        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          locations.push({
            uri,
            range: {
              start: { line: lineIndex, character: index },
              end: { line: lineIndex, character: index + word.length },
            },
          });
        }

        searchStart = index + 1;
      }
    }

    return locations;
  }

  /**
   * Get workspace symbols matching a query
   */
  getWorkspaceSymbols(query: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [docUri, doc] of this.documents) {
      const parseResult = this.parser.parse(doc.content);
      let currentSectionName: string | null = null;

      for (const stmt of parseResult.document.statements) {
        if (stmt.type === 'SectionDeclaration') {
          currentSectionName = stmt.name;

          // Check if matches query
          if (query === '' || stmt.name.toLowerCase().includes(lowerQuery)) {
            symbols.push({
              name: stmt.name,
              kind: SymbolKind.Module,
              location: {
                uri: docUri,
                range: this.toLspRange(stmt.start, stmt.end),
              },
            });
          }
        } else if (stmt.type === 'AttributeStatement') {
          // Check if matches query
          if (query === '' || stmt.name.name.toLowerCase().includes(lowerQuery)) {
            const symbolInfo: SymbolInformation = {
              name: stmt.name.name,
              kind: SymbolKind.Property,
              location: {
                uri: docUri,
                range: this.toLspRange(stmt.start, stmt.end),
              },
            };
            if (currentSectionName) {
              symbolInfo.containerName = currentSectionName;
            }
            symbols.push(symbolInfo);
          }
        } else if (stmt.type === 'VersionStatement') {
          // Check if matches query
          if (query === '' || stmt.name.name.toLowerCase().includes(lowerQuery)) {
            const symbolInfo: SymbolInformation = {
              name: stmt.name.name,
              kind: SymbolKind.Constant,
              location: {
                uri: docUri,
                range: this.toLspRange(stmt.start, stmt.end),
              },
            };
            if (currentSectionName) {
              symbolInfo.containerName = currentSectionName;
            }
            symbols.push(symbolInfo);
          }
        }
      }
    }

    return symbols;
  }

  /**
   * Get the word (identifier) at a given position
   */
  private getWordAtPosition(content: string, position: Position): string | null {
    const lines = content.split('\n');
    const line = lines[position.line];
    if (!line) {
      return null;
    }

    // Find word boundaries
    let start = position.character;
    let end = position.character;

    // Expand left
    while (start > 0 && this.isIdentifierChar(line.charAt(start - 1))) {
      start--;
    }

    // Expand right
    while (end < line.length && this.isIdentifierChar(line.charAt(end))) {
      end++;
    }

    if (start === end) {
      return null;
    }

    return line.substring(start, end);
  }

  /**
   * Check if character is valid identifier character
   */
  private isIdentifierChar(char: string): boolean {
    return /[A-Za-z0-9_]/.test(char);
  }

  /**
   * Convert analyzer diagnostic to LSP diagnostic
   */
  private toLspDiagnostic(diag: Diagnostic): LspDiagnostic {
    return {
      range: {
        start: {
          line: diag.range.start.line - 1,
          character: diag.range.start.column - 1,
        },
        end: {
          line: diag.range.end.line - 1,
          character: diag.range.end.column - 1,
        },
      },
      severity: this.toLspSeverity(diag.severity),
      code: diag.code,
      source: diag.source,
      message: diag.message,
    };
  }

  /**
   * Convert severity to LSP severity
   */
  private toLspSeverity(severity: string): DiagnosticSeverity {
    switch (severity) {
      case 'error': return DiagnosticSeverity.Error;
      case 'warning': return DiagnosticSeverity.Warning;
      case 'information': return DiagnosticSeverity.Information;
      case 'hint': return DiagnosticSeverity.Hint;
      default: return DiagnosticSeverity.Information;
    }
  }

  /**
   * Convert position to LSP range
   */
  private toLspRange(start: { line: number; column: number }, end: { line: number; column: number }): Range {
    return {
      start: { line: start.line - 1, character: start.column - 1 },
      end: { line: end.line - 1, character: end.column - 1 },
    };
  }
}

/**
 * Create and start the language server
 */
export function createServer(options?: MbelServerOptions): MbelServer {
  return new MbelServer(options);
}
