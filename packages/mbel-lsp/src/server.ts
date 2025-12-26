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
} from 'vscode-languageserver/node.js';

import { MbelAnalyzer } from '@mbel/analyzer';
import type { Diagnostic } from '@mbel/analyzer';
import type { MbelServerOptions, DocumentState } from './types.js';
import { createInitializeResult } from './types.js';

/**
 * MbelServer - Language Server for MBEL v5
 */
export class MbelServer {
  private readonly analyzer: MbelAnalyzer;
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
    // Store capabilities from client for future use
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
   * Convert analyzer diagnostic to LSP diagnostic
   */
  private toLspDiagnostic(diag: Diagnostic): LspDiagnostic {
    return {
      range: {
        start: {
          line: diag.range.start.line - 1, // LSP is 0-based
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
}

/**
 * Create and start the language server
 */
export function createServer(options?: MbelServerOptions): MbelServer {
  return new MbelServer(options);
}
