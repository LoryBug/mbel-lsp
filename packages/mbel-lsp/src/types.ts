/**
 * MBEL v5 LSP Server Types
 */

import {
  TextDocumentSyncKind,
} from 'vscode-languageserver';

import type {
  InitializeResult,
  ServerCapabilities,
} from 'vscode-languageserver';

/**
 * Server configuration options
 */
export interface MbelServerOptions {
  /** Enable grammar checks (article usage, CamelCase) */
  readonly grammarChecks?: boolean;
  /** Enable semantic checks (unused sections, duplicates) */
  readonly semanticChecks?: boolean;
  /** Enable hints for improvements */
  readonly hints?: boolean;
}

/**
 * Document state tracked by the server
 */
export interface DocumentState {
  readonly uri: string;
  readonly version: number;
  readonly content: string;
}

/**
 * Semantic item for LLM queries
 */
export interface SemanticItem {
  readonly line: number;
  readonly text: string;
}

/**
 * Aggregated project status for LLM queries
 */
export interface ProjectStatus {
  readonly pending: number;
  readonly completed: number;
  readonly failed: number;
  readonly critical: number;
  readonly active: number;
  readonly recentChanges: number;
}

/**
 * Server capabilities for MBEL LSP
 */
export const MBEL_SERVER_CAPABILITIES: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  completionProvider: {
    resolveProvider: false,
    triggerCharacters: ['@', '>', '?', '≈', '§', '©', '[', '{', '(', '<'],
  },
  hoverProvider: true,
  documentSymbolProvider: true,
  definitionProvider: true,
  referencesProvider: true,
  workspaceSymbolProvider: true,
};

/**
 * Create initialize result with MBEL capabilities
 */
export function createInitializeResult(): InitializeResult {
  return {
    capabilities: MBEL_SERVER_CAPABILITIES,
    serverInfo: {
      name: 'mbel-lsp',
      version: '0.1.0',
    },
  };
}
