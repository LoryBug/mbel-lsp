import { describe, it, expect, beforeEach } from 'vitest';
import { MbelServer } from '../src/server.js';
import type { Hover, CompletionItem, DocumentSymbol, Location } from 'vscode-languageserver';
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

  describe('Go to Definition', () => {
    it('should return null for unknown document', () => {
      const definition = server.getDefinition('file:///unknown.mbel', { line: 0, character: 0 });
      expect(definition).toBeNull();
    });

    it('should return null when cursor is not on identifier', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]\n@active::Working');
      // Position on @ operator
      const definition = server.getDefinition(testUri, { line: 1, character: 0 });
      expect(definition).toBeNull();
    });

    it('should go to section declaration from section name', () => {
      const content = '[FOCUS]\n@current::Working\n[NOTES]\n>see::FOCUS';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on FOCUS reference in line 3 (0-indexed)
      const definition = server.getDefinition(testUri, { line: 3, character: 6 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(0); // [FOCUS] is on line 0
    });

    it('should go to attribute definition', () => {
      const content = '[FOCUS]\n@status::Active\n@current::status';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on 'status' reference in line 2
      const definition = server.getDefinition(testUri, { line: 2, character: 11 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(1); // @status is on line 1
    });

    it('should return location with correct URI', () => {
      const content = '[FOCUS]\n@active::Working';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on FOCUS in section declaration
      const definition = server.getDefinition(testUri, { line: 0, character: 2 });
      expect(definition).not.toBeNull();
      expect(definition?.uri).toBe(testUri);
    });

    it('should find section when referenced as standalone word', () => {
      const content = '[TASKS]\n@see::TASKS';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on TASKS in the attribute value
      const definition = server.getDefinition(testUri, { line: 1, character: 7 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(0);
    });

    it('should return null for undefined references', () => {
      const content = '[FOCUS]\n@see::UNKNOWN';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on UNKNOWN which doesn't exist
      const definition = server.getDefinition(testUri, { line: 1, character: 7 });
      expect(definition).toBeNull();
    });

    it('should handle multiple sections', () => {
      const content = '[FIRST]\n@a::1\n[SECOND]\n@b::2\n[THIRD]\n@ref::SECOND';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on SECOND reference
      const definition = server.getDefinition(testUri, { line: 5, character: 7 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(2); // [SECOND] is on line 2
    });

    it('should be case-sensitive for section names', () => {
      const content = '[FOCUS]\n@ref::focus';
      server.onDidOpenTextDocument(testUri, 1, content);
      // 'focus' lowercase should not match 'FOCUS'
      const definition = server.getDefinition(testUri, { line: 1, character: 7 });
      expect(definition).toBeNull();
    });

    it('should find first attribute definition when duplicates exist', () => {
      const content = '@status::First\n@status::Second\n@ref::status';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on status reference
      const definition = server.getDefinition(testUri, { line: 2, character: 7 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(0); // First @status
    });

    it('should work with version statement names', () => {
      const content = '§MBEL:5.0\n@version::MBEL';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on MBEL reference
      const definition = server.getDefinition(testUri, { line: 1, character: 11 });
      expect(definition).not.toBeNull();
      expect(definition?.range.start.line).toBe(0);
    });
  });
});
