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
  CodeLens,
} from 'vscode-languageserver/node.js';

import { MbelAnalyzer } from '@mbel/analyzer';
import { MbelParser, OperatorTier } from '@mbel/core';
import type { Diagnostic } from '@mbel/analyzer';
import type {
  MbelServerOptions,
  DocumentState,
  SemanticItem,
  ProjectStatus,
  FeatureFiles,
  FileFeatureInfo,
  EntryPointInfo,
  AnchorInfo,
  WorkContext,
} from './types.js';
import { createInitializeResult } from './types.js';
import { QueryService } from './query-service.js';
import { LlmApi } from './llm-api/index.js';

/**
 * Operator documentation for hover and completion
 * Includes tier classification: ESSENTIAL (15) or ADVANCED
 */
interface OperatorInfoEntry {
  readonly label: string;
  readonly description: string;
  readonly category: string;
  readonly tier: typeof OperatorTier.ESSENTIAL | typeof OperatorTier.ADVANCED;
}

const OPERATOR_INFO: Record<string, OperatorInfoEntry> = {
  // Temporal - ESSENTIAL: @, >, ? | ADVANCED: ≈
  '@': { label: '@', description: 'Present/current state marker', category: 'Temporal', tier: OperatorTier.ESSENTIAL },
  '>': { label: '>', description: 'Past/completed state marker', category: 'Temporal', tier: OperatorTier.ESSENTIAL },
  '?': { label: '?', description: 'Future/planned state marker', category: 'Temporal', tier: OperatorTier.ESSENTIAL },
  '≈': { label: '≈', description: 'Approximate/estimated state marker', category: 'Temporal', tier: OperatorTier.ADVANCED },
  // State - ESSENTIAL: ✓, ! | ADVANCED: ✗, ⚡
  '✓': { label: '✓', description: 'Complete/done state', category: 'State', tier: OperatorTier.ESSENTIAL },
  '✗': { label: '✗', description: 'Failed/cancelled state', category: 'State', tier: OperatorTier.ADVANCED },
  '!': { label: '!', description: 'Critical/important marker', category: 'State', tier: OperatorTier.ESSENTIAL },
  '⚡': { label: '⚡', description: 'Active/in-progress state', category: 'State', tier: OperatorTier.ADVANCED },
  // Relation - ESSENTIAL: ::, +, - | ADVANCED: →, ←, ↔
  '::': { label: '::', description: 'Defines/binds relation', category: 'Relation', tier: OperatorTier.ESSENTIAL },
  ':': { label: ':', description: 'Simple binding (version)', category: 'Relation', tier: OperatorTier.ADVANCED },
  '→': { label: '→', description: 'Leads to/causes relation', category: 'Relation', tier: OperatorTier.ADVANCED },
  '←': { label: '←', description: 'Comes from/caused by relation', category: 'Relation', tier: OperatorTier.ADVANCED },
  '↔': { label: '↔', description: 'Mutual/bidirectional relation', category: 'Relation', tier: OperatorTier.ADVANCED },
  '+': { label: '+', description: 'Addition/combination', category: 'Relation', tier: OperatorTier.ESSENTIAL },
  '-': { label: '-', description: 'Removal/subtraction', category: 'Relation', tier: OperatorTier.ESSENTIAL },
  // Structure - ESSENTIAL: [, {, ( | ADVANCED: <, |
  '[': { label: '[...]', description: 'Section declaration', category: 'Structure', tier: OperatorTier.ESSENTIAL },
  '{': { label: '{...}', description: 'Metadata block', category: 'Structure', tier: OperatorTier.ESSENTIAL },
  '(': { label: '(...)', description: 'Note/comment block', category: 'Structure', tier: OperatorTier.ESSENTIAL },
  '<': { label: '<...>', description: 'Variant/template block', category: 'Structure', tier: OperatorTier.ADVANCED },
  '|': { label: '|', description: 'Alternative/or separator', category: 'Structure', tier: OperatorTier.ADVANCED },
  // Quantification - ALL ESSENTIAL: #, %, ~
  '#': { label: '#', description: 'Count/number quantifier', category: 'Quantification', tier: OperatorTier.ESSENTIAL },
  '%': { label: '%', description: 'Percentage quantifier', category: 'Quantification', tier: OperatorTier.ESSENTIAL },
  '~': { label: '~', description: 'Range/approximate quantifier', category: 'Quantification', tier: OperatorTier.ESSENTIAL },
  // Logic - ALL ADVANCED: &, ||, ¬
  '&': { label: '&', description: 'Logical AND', category: 'Logic', tier: OperatorTier.ADVANCED },
  '||': { label: '||', description: 'Logical OR', category: 'Logic', tier: OperatorTier.ADVANCED },
  '¬': { label: '¬', description: 'Logical NOT', category: 'Logic', tier: OperatorTier.ADVANCED },
  // Meta - ESSENTIAL: § | ADVANCED: ©
  '§': { label: '§', description: 'Version declaration', category: 'Meta', tier: OperatorTier.ESSENTIAL },
  '©': { label: '©', description: 'Source/attribution', category: 'Meta', tier: OperatorTier.ADVANCED },

  // ========== ARROW OPERATORS (ALL ADVANCED) ==========
  // Links group
  '->files': { label: '->files', description: 'Reference source files', category: 'Links', tier: OperatorTier.ADVANCED },
  '->tests': { label: '->tests', description: 'Reference test files', category: 'Links', tier: OperatorTier.ADVANCED },
  '->docs': { label: '->docs', description: 'Reference documentation', category: 'Links', tier: OperatorTier.ADVANCED },
  '->decisions': { label: '->decisions', description: 'Reference decisions', category: 'Links', tier: OperatorTier.ADVANCED },
  '->related': { label: '->related', description: 'Related features', category: 'Links', tier: OperatorTier.ADVANCED },
  '->entryPoint': { label: '->entryPoint', description: 'Mark entry point', category: 'Links', tier: OperatorTier.ADVANCED },
  '->blueprint': { label: '->blueprint', description: 'Blueprint/plan reference', category: 'Links', tier: OperatorTier.ADVANCED },
  '->depends': { label: '->depends', description: 'Declare dependencies', category: 'Links', tier: OperatorTier.ADVANCED },
  '->features': { label: '->features', description: 'Associated features', category: 'Links', tier: OperatorTier.ADVANCED },
  '->why': { label: '->why', description: 'Rationale/explanation', category: 'Links', tier: OperatorTier.ADVANCED },
  // Anchors group
  '->descrizione': { label: '->descrizione', description: 'Anchor description (IT)', category: 'Anchors', tier: OperatorTier.ADVANCED },
  '->description': { label: '->description', description: 'Anchor description (EN)', category: 'Anchors', tier: OperatorTier.ADVANCED },
  // Decisions group
  '->alternatives': { label: '->alternatives', description: 'Decision alternatives', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->reason': { label: '->reason', description: 'Decision rationale', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->tradeoff': { label: '->tradeoff', description: 'Trade-offs involved', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->context': { label: '->context', description: 'Decision context', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->status': { label: '->status', description: 'Decision status', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->revisit': { label: '->revisit', description: 'Revisit date/condition', category: 'Decisions', tier: OperatorTier.ADVANCED },
  '->supersededBy': { label: '->supersededBy', description: 'Superseded by another decision', category: 'Decisions', tier: OperatorTier.ADVANCED },
  // Heat group
  '->dependents': { label: '->dependents', description: 'Dependent modules', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->untouched': { label: '->untouched', description: 'Duration since last change', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->changes': { label: '->changes', description: 'Number of changes in period', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->coverage': { label: '->coverage', description: 'Test coverage percentage', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->confidence': { label: '->confidence', description: 'Confidence level', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->impact': { label: '->impact', description: 'Impact if changed', category: 'Heat', tier: OperatorTier.ADVANCED },
  '->caution': { label: '->caution', description: 'Warning/caution notes', category: 'Heat', tier: OperatorTier.ADVANCED },
  // Intents group
  '->does': { label: '->does', description: 'What component does', category: 'Intents', tier: OperatorTier.ADVANCED },
  '->doesNot': { label: '->doesNot', description: 'What component does NOT do', category: 'Intents', tier: OperatorTier.ADVANCED },
  '->contract': { label: '->contract', description: 'Component contract', category: 'Intents', tier: OperatorTier.ADVANCED },
  '->singleResponsibility': { label: '->singleResponsibility', description: 'Single responsibility', category: 'Intents', tier: OperatorTier.ADVANCED },
  '->antiPattern': { label: '->antiPattern', description: 'Anti-patterns to avoid', category: 'Intents', tier: OperatorTier.ADVANCED },
  '->extends': { label: '->extends', description: 'Extended contracts', category: 'Intents', tier: OperatorTier.ADVANCED },

  // ========== PREFIX OPERATORS (ALL ADVANCED) ==========
  // Anchor prefixes
  '@entry::': { label: '@entry::', description: 'Entry point anchor', category: 'Anchors', tier: OperatorTier.ADVANCED },
  '@hotspot::': { label: '@hotspot::', description: 'Frequently modified area', category: 'Anchors', tier: OperatorTier.ADVANCED },
  '@boundary::': { label: '@boundary::', description: 'System boundary', category: 'Anchors', tier: OperatorTier.ADVANCED },
  // Heat prefixes
  '@critical::': { label: '@critical::', description: 'Critical stability path', category: 'Heat', tier: OperatorTier.ADVANCED },
  '@stable::': { label: '@stable::', description: 'Rarely modified', category: 'Heat', tier: OperatorTier.ADVANCED },
  '@volatile::': { label: '@volatile::', description: 'Frequently changed', category: 'Heat', tier: OperatorTier.ADVANCED },
  '@hot::': { label: '@hot::', description: 'Recent high-activity area', category: 'Heat', tier: OperatorTier.ADVANCED },
};

/**
 * MbelServer - Language Server for MBEL v5
 */
export class MbelServer {
  private readonly analyzer: MbelAnalyzer;
  private readonly parser = new MbelParser();
  private readonly queryService = new QueryService();
  private readonly llmApi = new LlmApi();
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

    // Check for semantic elements first (TDDAB#16: Extended Hover)
    const semanticHover = this.getSemanticHover(doc.content, position);
    if (semanticHover) {
      return semanticHover;
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
   * Get semantic hover for MBEL v6 constructs
   */
  private getSemanticHover(content: string, position: Position): Hover | null {
    // Parse to find statement at position
    const parseResult = this.parser.parse(content);

    for (const stmt of parseResult.document.statements) {
      // Check if position is on this statement's line
      if (stmt.start.line - 1 !== position.line) continue;

      if (stmt.type === 'LinkDeclaration') {
        // @feature or @task hover
        const typeLabel = stmt.linkType === 'feature' ? '📦 Feature' : '📋 Task';
        const files = stmt.files?.map(f => f.path).join(', ') ?? 'none';
        const tests = stmt.tests?.map(t => t.path).join(', ') ?? 'none';
        const deps = stmt.depends?.join(', ') ?? 'none';

        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `## ${typeLabel}: ${stmt.name}\n\n` +
                   `**Files:** ${files}\n\n` +
                   `**Tests:** ${tests}\n\n` +
                   `**Dependencies:** ${deps}`,
          },
        };
      }

      if (stmt.type === 'AnchorDeclaration') {
        // @entry, @hotspot, @boundary hover
        const icon = stmt.anchorType === 'entry' ? '🚪' :
                     stmt.anchorType === 'hotspot' ? '⚠️' : '🔒';
        const desc = stmt.description ?? 'No description';

        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `## ${icon} Anchor: ${stmt.anchorType}\n\n` +
                   `**Path:** \`${stmt.path}\`\n\n` +
                   `**Description:** ${desc}\n\n` +
                   (stmt.isGlob ? '_This is a glob pattern_' : ''),
          },
        };
      }

      if (stmt.type === 'DecisionDeclaration') {
        // Decision hover
        const status = stmt.status ?? 'ACTIVE';
        const alternatives = stmt.alternatives?.join(', ') ?? 'none';

        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `## 📝 Decision: ${stmt.name}\n\n` +
                   `**Date:** ${stmt.date}\n\n` +
                   `**Status:** ${status}\n\n` +
                   `**Reason:** ${stmt.reason ?? 'Not specified'}\n\n` +
                   `**Alternatives:** ${alternatives}`,
          },
        };
      }

      if (stmt.type === 'IntentDeclaration') {
        // Intent hover
        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `## 🎯 Intent: @${stmt.module}::${stmt.component}\n\n` +
                   `**Does:** ${stmt.does ?? 'Not specified'}\n\n` +
                   `**Does Not:** ${stmt.doesNot ?? 'Not specified'}\n\n` +
                   `**Contract:** ${stmt.contract ?? 'Not specified'}`,
          },
        };
      }

      if (stmt.type === 'HeatDeclaration') {
        // Heat hover
        const icon = stmt.heatType === 'critical' ? '🔥' :
                    stmt.heatType === 'hot' ? '🌡️' :
                    stmt.heatType === 'volatile' ? '⚡' : '❄️';

        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: `## ${icon} Heat: ${stmt.heatType}\n\n` +
                   `**Path:** \`${stmt.path}\`\n\n` +
                   `**Coverage:** ${stmt.coverage ?? 'N/A'}\n\n` +
                   `**Confidence:** ${stmt.confidence ?? 'N/A'}\n\n` +
                   `**Caution:** ${stmt.caution ?? 'None'}`,
          },
        };
      }
    }

    return null;
  }

  /**
   * Get completions at position
   * Completions are sorted by tier: ESSENTIAL (0-) first, ADVANCED (1-) second
   */
  getCompletions(uri: string, position: Position): CompletionItem[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    // Position can be used for context-aware completions in the future
    void position;

    // Return all operators as completions, sorted by tier
    const completions: CompletionItem[] = [];

    for (const [op, info] of Object.entries(OPERATOR_INFO)) {
      const tierLabel = info.tier === OperatorTier.ESSENTIAL ? 'Essential' : 'Advanced';
      const sortPrefix = info.tier === OperatorTier.ESSENTIAL ? '0' : '1';

      completions.push({
        label: op,
        kind: CompletionItemKind.Operator,
        sortText: `${sortPrefix}-${op}`,
        documentation: {
          kind: MarkupKind.Markdown,
          value: `**${info.category}** (${tierLabel})\n\n${info.description}`,
        },
        detail: `${info.category} (${tierLabel})`,
      });
    }

    // Sort by sortText to ensure ESSENTIAL operators appear first
    completions.sort((a, b) => (a.sortText ?? '').localeCompare(b.sortText ?? ''));

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

  // ============================================
  // LLM Query Methods - Semantic queries for AI agents
  // ============================================

  /**
   * Get all pending/planned items (marked with ?)
   */
  getPendingItems(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /^\s*\?/);
  }

  /**
   * Get all completed items (marked with ✓)
   */
  getCompletedItems(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /✓/);
  }

  /**
   * Get all failed items (marked with ✗)
   */
  getFailedItems(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /✗/);
  }

  /**
   * Get all critical items (marked with !)
   */
  getCriticalItems(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /^\s*!/);
  }

  /**
   * Get all active items (marked with @ or ⚡)
   */
  getActiveItems(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /^\s*@|⚡/);
  }

  /**
   * Get all recent changes (marked with >)
   */
  getRecentChanges(uri: string): SemanticItem[] {
    return this.findItemsByPattern(uri, /^\s*>/);
  }

  /**
   * Get aggregated project status
   */
  getProjectStatus(uri: string): ProjectStatus {
    return {
      pending: this.getPendingItems(uri).length,
      completed: this.getCompletedItems(uri).length,
      failed: this.getFailedItems(uri).length,
      critical: this.getCriticalItems(uri).length,
      active: this.getActiveItems(uri).length,
      recentChanges: this.getRecentChanges(uri).length,
    };
  }

  /**
   * Find items matching a pattern
   */
  private findItemsByPattern(uri: string, pattern: RegExp): SemanticItem[] {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    const items: SemanticItem[] = [];
    const lines = doc.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && pattern.test(line)) {
        items.push({
          line: i + 1, // 1-based
          text: line.trim(),
        });
      }
    }

    return items;
  }

  // ============================================
  // CrossRef Query Methods (TDDAB#17) - LLM Navigation API
  // ============================================

  /**
   * Get files associated with a feature (forward lookup)
   * @param uri - Document URI
   * @param featureName - Name of the feature or task
   */
  getFeatureFiles(uri: string, featureName: string): FeatureFiles | null {
    const doc = this.documents.get(uri);
    if (!doc) return null;
    return this.queryService.getFeatureFiles(doc.content, featureName);
  }

  /**
   * Get features that contain a specific file (reverse lookup)
   * @param uri - Document URI
   * @param filePath - File path to search for
   */
  getFileFeatures(uri: string, filePath: string): FileFeatureInfo[] {
    const doc = this.documents.get(uri);
    if (!doc) return [];
    return this.queryService.getFileFeatures(doc.content, filePath);
  }

  /**
   * Get all entry points from the document
   * @param uri - Document URI
   */
  getEntryPoints(uri: string): Map<string, EntryPointInfo> {
    const doc = this.documents.get(uri);
    if (!doc) return new Map();
    return this.queryService.getEntryPoints(doc.content);
  }

  /**
   * Get all semantic anchors from the document
   * @param uri - Document URI
   */
  getAnchors(uri: string): AnchorInfo[] {
    const doc = this.documents.get(uri);
    if (!doc) return [];
    return this.queryService.getAnchors(doc.content);
  }

  /**
   * Get anchors filtered by type
   * @param uri - Document URI
   * @param type - Anchor type to filter by
   */
  getAnchorsByType(uri: string, type: 'entry' | 'hotspot' | 'boundary'): AnchorInfo[] {
    const doc = this.documents.get(uri);
    if (!doc) return [];
    return this.queryService.getAnchorsByType(doc.content, type);
  }

  /**
   * Get all features and tasks from the document
   * @param uri - Document URI
   */
  getAllFeatures(uri: string): FeatureFiles[] {
    const doc = this.documents.get(uri);
    if (!doc) return [];
    return this.queryService.getAllFeatures(doc.content);
  }

  // ============================================
  // TDDAB#16: Tool Integrations - CodeLens, WorkContext
  // ============================================

  /**
   * Get CodeLens for semantic elements in the document
   */
  getCodeLenses(uri: string): CodeLens[] {
    const doc = this.documents.get(uri);
    if (!doc) return [];

    const codeLenses: CodeLens[] = [];
    const parseResult = this.parser.parse(doc.content);

    for (const stmt of parseResult.document.statements) {
      const range = this.toLspRange(stmt.start, stmt.end);

      if (stmt.type === 'LinkDeclaration') {
        // Feature/Task link
        const typeIcon = stmt.linkType === 'feature' ? '📦' : '📋';
        const fileCount = stmt.files?.length ?? 0;
        const testCount = stmt.tests?.length ?? 0;
        codeLenses.push({
          range,
          command: {
            title: `${typeIcon} ${stmt.name} (${fileCount} files, ${testCount} tests)`,
            command: 'mbel.showFeatureContext',
            arguments: [uri, stmt.name],
          },
        });
      } else if (stmt.type === 'AnchorDeclaration') {
        // Semantic anchor
        const icon = stmt.anchorType === 'entry' ? '🚪' :
                     stmt.anchorType === 'hotspot' ? '⚠️' : '🔒';
        const label = stmt.anchorType === 'hotspot' ? `⚠ ${stmt.anchorType}` : stmt.anchorType;
        codeLenses.push({
          range,
          command: {
            title: `${icon} ${label}: ${stmt.path}`,
            command: 'mbel.showAnchor',
            arguments: [uri, stmt.path],
          },
        });
      } else if (stmt.type === 'DecisionDeclaration') {
        // Decision
        const statusIcon = stmt.status === 'ACTIVE' ? '✅' :
                          stmt.status === 'SUPERSEDED' ? '🔄' : '📝';
        codeLenses.push({
          range,
          command: {
            title: `${statusIcon} ${stmt.name} [${stmt.status ?? 'ACTIVE'}]`,
            command: 'mbel.showDecision',
            arguments: [uri, stmt.name],
          },
        });
      } else if (stmt.type === 'HeatDeclaration') {
        // Heat map entry
        const heatIcon = stmt.heatType === 'critical' ? '🔥' :
                        stmt.heatType === 'hot' ? '🌡️' :
                        stmt.heatType === 'volatile' ? '⚡' : '❄️';
        codeLenses.push({
          range,
          command: {
            title: `${heatIcon} ${stmt.heatType}: ${stmt.path}`,
            command: 'mbel.showHeat',
            arguments: [uri, stmt.path],
          },
        });
      } else if (stmt.type === 'IntentDeclaration') {
        // Intent marker
        codeLenses.push({
          range,
          command: {
            title: `🎯 @${stmt.module}::${stmt.component}`,
            command: 'mbel.showIntent',
            arguments: [uri, stmt.module, stmt.component],
          },
        });
      }
    }

    return codeLenses;
  }

  /**
   * Get work context for a feature (TDDAB#16: mbel-workcontext tool)
   * @param uri - Document URI
   * @param featureName - Name of the feature to get context for
   */
  getWorkContext(uri: string, featureName: string): WorkContext | null {
    const doc = this.documents.get(uri);
    if (!doc) return null;

    // Load document into LLM API and get work context
    this.llmApi.loadDocument(doc.content);
    const context = this.llmApi.getWorkContext(featureName);

    if (!context || !context.feature) return null;

    // Convert to WorkContext type
    return {
      feature: context.feature,
      files: [...context.files],
      tests: [...context.tests],
      blueprint: context.blueprint ? [...context.blueprint] : null,
      decisions: context.decisions.map(d => ({
        name: d.name,
        date: d.date,
        status: d.status,
        reason: d.reason,
        alternatives: [...d.alternatives],
        context: [...d.context],
      })),
      anchors: context.anchors.map(a => ({
        path: a.path,
        type: a.type as 'entry' | 'hotspot' | 'boundary',
        description: a.description,
        isGlob: a.isGlob,
      })),
      heatInfo: context.heatInfo.map(h => ({
        path: h.path,
        type: h.type,
        changes: h.changes,
        coverage: h.coverage,
        confidence: h.confidence,
        caution: h.caution,
      })),
      intents: context.intents.map(i => ({
        module: i.module,
        component: i.component,
        does: i.does,
        doesNot: i.doesNot,
        contract: i.contract,
        singleResponsibility: i.singleResponsibility,
        antiPattern: i.antiPattern,
        extends: i.extends ? [...i.extends] : null,
      })),
      dependencies: [...context.dependencies],
      dependents: [...context.dependents],
      overallRisk: context.overallRisk,
    };
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
