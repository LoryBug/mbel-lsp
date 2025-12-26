import { describe, it, expect, beforeEach } from 'vitest';
import { MbelServer, createServer } from '../src/server.js';
import { MBEL_SERVER_CAPABILITIES, createInitializeResult } from '../src/types.js';
import type { InitializeParams } from 'vscode-languageserver';
import { TextDocumentSyncKind } from 'vscode-languageserver';

describe('MbelServer', () => {
  let server: MbelServer;

  beforeEach(() => {
    server = new MbelServer();
  });

  describe('Server Creation', () => {
    it('should create server with default options', () => {
      expect(server).toBeInstanceOf(MbelServer);
    });

    it('should create server with custom options', () => {
      const customServer = new MbelServer({
        grammarChecks: false,
        semanticChecks: false,
        hints: false,
      });
      expect(customServer).toBeInstanceOf(MbelServer);
    });

    it('should create server using factory function', () => {
      const factoryServer = createServer();
      expect(factoryServer).toBeInstanceOf(MbelServer);
    });
  });

  describe('Initialize', () => {
    const initParams: InitializeParams = {
      processId: 1234,
      capabilities: {},
      rootUri: 'file:///test',
    };

    it('should return initialize result with capabilities', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities).toBeDefined();
    });

    it('should support text document sync', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities.textDocumentSync).toBeDefined();
    });

    it('should support incremental sync', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities.textDocumentSync).toBe(TextDocumentSyncKind.Incremental);
    });

    it('should include server info', () => {
      const result = server.onInitialize(initParams);
      expect(result.serverInfo).toBeDefined();
      expect(result.serverInfo?.name).toBe('mbel-lsp');
    });

    it('should support hover provider', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities.hoverProvider).toBe(true);
    });

    it('should support completion provider', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities.completionProvider).toBeDefined();
    });

    it('should support document symbols', () => {
      const result = server.onInitialize(initParams);
      expect(result.capabilities.documentSymbolProvider).toBe(true);
    });
  });

  describe('Text Document Sync', () => {
    const testUri = 'file:///test/document.mbel';
    const testContent = '§MBEL:5.0\n[FOCUS]\n@active::Working';

    it('should handle document open', () => {
      server.onDidOpenTextDocument(testUri, 1, testContent);
      expect(server.hasDocument(testUri)).toBe(true);
    });

    it('should store document content on open', () => {
      server.onDidOpenTextDocument(testUri, 1, testContent);
      const doc = server.getDocument(testUri);
      expect(doc?.content).toBe(testContent);
    });

    it('should store document version on open', () => {
      server.onDidOpenTextDocument(testUri, 1, testContent);
      const doc = server.getDocument(testUri);
      expect(doc?.version).toBe(1);
    });

    it('should handle document change', () => {
      server.onDidOpenTextDocument(testUri, 1, testContent);
      const newContent = '§MBEL:5.0\n[UPDATED]';
      server.onDidChangeTextDocument(testUri, 2, newContent);
      const doc = server.getDocument(testUri);
      expect(doc?.content).toBe(newContent);
      expect(doc?.version).toBe(2);
    });

    it('should handle document close', () => {
      server.onDidOpenTextDocument(testUri, 1, testContent);
      server.onDidCloseTextDocument(testUri);
      expect(server.hasDocument(testUri)).toBe(false);
    });

    it('should track multiple documents', () => {
      const uri1 = 'file:///test/doc1.mbel';
      const uri2 = 'file:///test/doc2.mbel';
      server.onDidOpenTextDocument(uri1, 1, 'content1');
      server.onDidOpenTextDocument(uri2, 1, 'content2');
      expect(server.getOpenDocuments()).toHaveLength(2);
    });
  });

  describe('Diagnostics', () => {
    const testUri = 'file:///test/document.mbel';

    it('should return diagnostics for valid document', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0\n[FOCUS]\n@active::Working');
      const diagnostics = server.getDiagnostics(testUri);
      expect(Array.isArray(diagnostics)).toBe(true);
    });

    it('should detect unknown characters', () => {
      server.onDidOpenTextDocument(testUri, 1, '$invalid');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.some(d => d.code === 'UNKNOWN_CHARACTER')).toBe(true);
    });

    it('should detect unclosed brackets', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics.some(d => d.code === 'UNCLOSED_SECTION')).toBe(true);
    });

    it('should detect article usage', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0\n@focus::the project');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics.some(d => d.code === 'ARTICLE_USAGE')).toBe(true);
    });

    it('should use 0-based line numbers (LSP spec)', () => {
      server.onDidOpenTextDocument(testUri, 1, '$invalid');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics[0]?.range.start.line).toBe(0); // 0-based
    });

    it('should use 0-based character positions (LSP spec)', () => {
      server.onDidOpenTextDocument(testUri, 1, '$invalid');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics[0]?.range.start.character).toBe(0); // 0-based
    });

    it('should include diagnostic source', () => {
      server.onDidOpenTextDocument(testUri, 1, '$invalid');
      const diagnostics = server.getDiagnostics(testUri);
      expect(diagnostics[0]?.source).toBe('mbel');
    });

    it('should return empty array for unknown document', () => {
      const diagnostics = server.getDiagnostics('file:///unknown.mbel');
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('Shutdown', () => {
    it('should handle shutdown request', () => {
      server.onDidOpenTextDocument('file:///test.mbel', 1, 'content');
      expect(() => server.onShutdown()).not.toThrow();
    });

    it('should clear documents on shutdown', () => {
      server.onDidOpenTextDocument('file:///test.mbel', 1, 'content');
      server.onShutdown();
      expect(server.getOpenDocuments()).toHaveLength(0);
    });
  });

  describe('Server Capabilities', () => {
    it('should define text document sync capability', () => {
      expect(MBEL_SERVER_CAPABILITIES.textDocumentSync).toBe(TextDocumentSyncKind.Incremental);
    });

    it('should define completion provider', () => {
      expect(MBEL_SERVER_CAPABILITIES.completionProvider).toBeDefined();
    });

    it('should have trigger characters for completion', () => {
      expect(MBEL_SERVER_CAPABILITIES.completionProvider?.triggerCharacters).toBeDefined();
      expect(MBEL_SERVER_CAPABILITIES.completionProvider?.triggerCharacters).toContain('@');
      expect(MBEL_SERVER_CAPABILITIES.completionProvider?.triggerCharacters).toContain('§');
    });

    it('should define hover provider', () => {
      expect(MBEL_SERVER_CAPABILITIES.hoverProvider).toBe(true);
    });

    it('should define document symbol provider', () => {
      expect(MBEL_SERVER_CAPABILITIES.documentSymbolProvider).toBe(true);
    });
  });

  describe('Initialize Result Helper', () => {
    it('should create valid initialize result', () => {
      const result = createInitializeResult();
      expect(result.capabilities).toBeDefined();
      expect(result.serverInfo).toBeDefined();
    });

    it('should include server name', () => {
      const result = createInitializeResult();
      expect(result.serverInfo?.name).toBe('mbel-lsp');
    });

    it('should include server version', () => {
      const result = createInitializeResult();
      expect(result.serverInfo?.version).toBe('0.1.0');
    });
  });
});
