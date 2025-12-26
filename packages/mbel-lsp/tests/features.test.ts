import { describe, it, expect, beforeEach } from 'vitest';
import { MbelServer } from '../src/server.js';
import type { Hover, CompletionItem, DocumentSymbol } from 'vscode-languageserver';
import { SymbolKind, CompletionItemKind } from 'vscode-languageserver';

describe('LSP Features', () => {
  let server: MbelServer;
  const testUri = 'file:///test/document.mbel';

  beforeEach(() => {
    server = new MbelServer();
  });

  describe('Hover', () => {
    it('should provide hover info for temporal operator @', () => {
      server.onDidOpenTextDocument(testUri, 1, '@focus::Working');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();
    });

    it('should provide hover info for temporal operator >', () => {
      server.onDidOpenTextDocument(testUri, 1, '>completed::Task');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      expect(hover).toBeDefined();
    });

    it('should provide hover info for temporal operator ?', () => {
      server.onDidOpenTextDocument(testUri, 1, '?planned::Feature');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      expect(hover).toBeDefined();
    });

    it('should provide hover info for state operator ✓', () => {
      server.onDidOpenTextDocument(testUri, 1, '✓done::Task');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      expect(hover).toBeDefined();
    });

    it('should provide hover info for relation operator ::', () => {
      server.onDidOpenTextDocument(testUri, 1, '@name::value');
      const hover = server.getHover(testUri, { line: 0, character: 5 });
      expect(hover).toBeDefined();
    });

    it('should provide hover info for relation operator →', () => {
      server.onDidOpenTextDocument(testUri, 1, 'A→B');
      const hover = server.getHover(testUri, { line: 0, character: 1 });
      expect(hover).toBeDefined();
    });

    it('should provide hover info for meta operator §', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      expect(hover).toBeDefined();
    });

    it('should return null for non-operator positions', () => {
      server.onDidOpenTextDocument(testUri, 1, '@focus::Working');
      const hover = server.getHover(testUri, { line: 0, character: 10 });
      expect(hover).toBeNull();
    });

    it('should return null for unknown document', () => {
      const hover = server.getHover('file:///unknown.mbel', { line: 0, character: 0 });
      expect(hover).toBeNull();
    });

    it('should include operator description in hover', () => {
      server.onDidOpenTextDocument(testUri, 1, '@focus::Working');
      const hover = server.getHover(testUri, { line: 0, character: 0 });
      const contents = typeof hover?.contents === 'string' ? hover.contents :
                       (hover?.contents as { value: string })?.value;
      expect(contents?.toLowerCase()).toContain('present');
    });
  });

  describe('Completion', () => {
    it('should provide completions for @ trigger', () => {
      server.onDidOpenTextDocument(testUri, 1, '@');
      const completions = server.getCompletions(testUri, { line: 0, character: 1 });
      expect(completions.length).toBeGreaterThan(0);
    });

    it('should include temporal operators in completions', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      const labels = completions.map(c => c.label);
      expect(labels).toContain('@');
      expect(labels).toContain('>');
      expect(labels).toContain('?');
    });

    it('should include state operators in completions', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      const labels = completions.map(c => c.label);
      expect(labels).toContain('✓');
      expect(labels).toContain('✗');
    });

    it('should include structure operators in completions', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      const labels = completions.map(c => c.label);
      expect(labels).toContain('[');
      expect(labels).toContain('{');
    });

    it('should include meta operators in completions', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      const labels = completions.map(c => c.label);
      expect(labels).toContain('§');
      expect(labels).toContain('©');
    });

    it('should have proper completion item kind', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      expect(completions.every(c => c.kind === CompletionItemKind.Operator)).toBe(true);
    });

    it('should include documentation for completions', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const completions = server.getCompletions(testUri, { line: 0, character: 0 });
      expect(completions.every(c => c.documentation !== undefined)).toBe(true);
    });

    it('should return empty array for unknown document', () => {
      const completions = server.getCompletions('file:///unknown.mbel', { line: 0, character: 0 });
      expect(completions).toHaveLength(0);
    });
  });

  describe('Document Symbols', () => {
    it('should return sections as symbols', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]\n@active::Working');
      const symbols = server.getDocumentSymbols(testUri);
      expect(symbols.some(s => s.name === 'FOCUS')).toBe(true);
    });

    it('should use Module kind for sections', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]');
      const symbols = server.getDocumentSymbols(testUri);
      const section = symbols.find(s => s.name === 'FOCUS');
      expect(section?.kind).toBe(SymbolKind.Module);
    });

    it('should return attributes as symbols', () => {
      server.onDidOpenTextDocument(testUri, 1, '@focus::Working');
      const symbols = server.getDocumentSymbols(testUri);
      expect(symbols.some(s => s.name === 'focus')).toBe(true);
    });

    it('should use Property kind for attributes', () => {
      server.onDidOpenTextDocument(testUri, 1, '@focus::Working');
      const symbols = server.getDocumentSymbols(testUri);
      const attr = symbols.find(s => s.name === 'focus');
      expect(attr?.kind).toBe(SymbolKind.Property);
    });

    it('should return version statement as symbol', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0');
      const symbols = server.getDocumentSymbols(testUri);
      expect(symbols.some(s => s.name === 'MBEL')).toBe(true);
    });

    it('should use Constant kind for version', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0');
      const symbols = server.getDocumentSymbols(testUri);
      const version = symbols.find(s => s.name === 'MBEL');
      expect(version?.kind).toBe(SymbolKind.Constant);
    });

    it('should return multiple symbols', () => {
      server.onDidOpenTextDocument(testUri, 1, '§MBEL:5.0\n[FOCUS]\n@active::Working\n@status::Done');
      const symbols = server.getDocumentSymbols(testUri);
      // Top level: version + section (with nested children)
      expect(symbols.length).toBeGreaterThanOrEqual(2);
      // Section should have children
      const section = symbols.find(s => s.name === 'FOCUS');
      expect(section?.children?.length).toBeGreaterThanOrEqual(2);
    });

    it('should include symbol ranges', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]');
      const symbols = server.getDocumentSymbols(testUri);
      const section = symbols.find(s => s.name === 'FOCUS');
      expect(section?.range).toBeDefined();
      expect(section?.selectionRange).toBeDefined();
    });

    it('should return empty array for unknown document', () => {
      const symbols = server.getDocumentSymbols('file:///unknown.mbel');
      expect(symbols).toHaveLength(0);
    });

    it('should return empty array for empty document', () => {
      server.onDidOpenTextDocument(testUri, 1, '');
      const symbols = server.getDocumentSymbols(testUri);
      expect(symbols).toHaveLength(0);
    });

    it('should nest attributes under sections', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]\n@active::Working');
      const symbols = server.getDocumentSymbols(testUri);
      const section = symbols.find(s => s.name === 'FOCUS');
      expect(section?.children).toBeDefined();
      expect(section?.children?.some(c => c.name === 'active')).toBe(true);
    });
  });
});
