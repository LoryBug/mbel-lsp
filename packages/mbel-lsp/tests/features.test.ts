import { describe, it, expect, beforeEach } from 'vitest';
import { MbelServer } from '../src/server.js';
import type { Hover, CompletionItem, DocumentSymbol, Location, SymbolInformation } from 'vscode-languageserver';
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

  describe('Find References', () => {
    it('should return empty array for unknown document', () => {
      const refs = server.getReferences('file:///unknown.mbel', { line: 0, character: 0 });
      expect(refs).toHaveLength(0);
    });

    it('should return empty array when cursor is not on identifier', () => {
      server.onDidOpenTextDocument(testUri, 1, '[FOCUS]\n@active::Working');
      // Position on @ operator
      const refs = server.getReferences(testUri, { line: 1, character: 0 });
      expect(refs).toHaveLength(0);
    });

    it('should find all references to a section', () => {
      const content = '[FOCUS]\n@current::Working\n@see::FOCUS\n>done::FOCUS';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on FOCUS in section declaration
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs).toHaveLength(3); // declaration + 2 references
    });

    it('should find section references from a reference position', () => {
      const content = '[TASKS]\n@ref::TASKS\n>see::TASKS';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on TASKS reference in line 1
      const refs = server.getReferences(testUri, { line: 1, character: 7 });
      expect(refs).toHaveLength(3); // declaration + 2 references
    });

    it('should find all references to an attribute', () => {
      const content = '@status::Active\n@current::status\n@see::status';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on 'status' in attribute definition
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs).toHaveLength(3); // definition + 2 references
    });

    it('should return locations with correct URI', () => {
      const content = '[FOCUS]\n@see::FOCUS';
      server.onDidOpenTextDocument(testUri, 1, content);
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs.every(r => r.uri === testUri)).toBe(true);
    });

    it('should return locations with correct line numbers', () => {
      const content = '[SECTION]\n@a::1\n@ref::SECTION\n@see::SECTION';
      server.onDidOpenTextDocument(testUri, 1, content);
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      const lines = refs.map(r => r.range.start.line).sort((a, b) => a - b);
      expect(lines).toEqual([0, 2, 3]);
    });

    it('should be case-sensitive', () => {
      const content = '[FOCUS]\n@see::focus\n@ref::FOCUS';
      server.onDidOpenTextDocument(testUri, 1, content);
      // 'FOCUS' uppercase
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs).toHaveLength(2); // [FOCUS] and @ref::FOCUS, not @see::focus
    });

    it('should find references to version name', () => {
      const content = '§MBEL:5.0\n@version::MBEL\n@check::MBEL';
      server.onDidOpenTextDocument(testUri, 1, content);
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs).toHaveLength(3);
    });

    it('should handle identifiers with numbers', () => {
      const content = '[TDDAB1]\n@ref::TDDAB1\n@see::TDDAB1';
      server.onDidOpenTextDocument(testUri, 1, content);
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      expect(refs).toHaveLength(3);
    });

    it('should not match partial words', () => {
      const content = '[TASK]\n@see::TASKS\n@ref::TASK';
      server.onDidOpenTextDocument(testUri, 1, content);
      const refs = server.getReferences(testUri, { line: 0, character: 2 });
      // Should only find [TASK] and @ref::TASK, not TASKS
      expect(refs).toHaveLength(2);
    });

    it('should return empty for undefined symbol', () => {
      const content = '[FOCUS]\n@see::UNKNOWN';
      server.onDidOpenTextDocument(testUri, 1, content);
      // Position on UNKNOWN which is never defined
      const refs = server.getReferences(testUri, { line: 1, character: 7 });
      // Should still return the reference itself
      expect(refs).toHaveLength(1);
    });
  });

  describe('Workspace Symbols', () => {
    const uri1 = 'file:///project/file1.mbel';
    const uri2 = 'file:///project/file2.mbel';
    const uri3 = 'file:///project/file3.mbel';

    it('should return empty array when no documents are open', () => {
      const symbols = server.getWorkspaceSymbols('');
      expect(symbols).toHaveLength(0);
    });

    it('should find symbols across multiple documents', () => {
      server.onDidOpenTextDocument(uri1, 1, '[FOCUS]\n@active::Working');
      server.onDidOpenTextDocument(uri2, 1, '[TASKS]\n@status::Done');
      const symbols = server.getWorkspaceSymbols('');
      expect(symbols.length).toBeGreaterThanOrEqual(4); // 2 sections + 2 attributes
    });

    it('should filter symbols by query', () => {
      server.onDidOpenTextDocument(uri1, 1, '[FOCUS]\n@active::Working');
      server.onDidOpenTextDocument(uri2, 1, '[TASKS]\n@status::Done');
      const symbols = server.getWorkspaceSymbols('FOCUS');
      expect(symbols.some(s => s.name === 'FOCUS')).toBe(true);
      expect(symbols.some(s => s.name === 'TASKS')).toBe(false);
    });

    it('should perform case-insensitive filtering', () => {
      server.onDidOpenTextDocument(uri1, 1, '[FOCUS]\n@active::Working');
      const symbols = server.getWorkspaceSymbols('focus');
      expect(symbols.some(s => s.name === 'FOCUS')).toBe(true);
    });

    it('should include document URI in symbol location', () => {
      server.onDidOpenTextDocument(uri1, 1, '[SECTION1]');
      server.onDidOpenTextDocument(uri2, 1, '[SECTION2]');
      const symbols = server.getWorkspaceSymbols('SECTION');
      const uris = symbols.map(s => s.location.uri);
      expect(uris).toContain(uri1);
      expect(uris).toContain(uri2);
    });

    it('should return SymbolInformation with correct kind', () => {
      server.onDidOpenTextDocument(uri1, 1, '[FOCUS]\n@active::Working\n§MBEL:5.0');
      const symbols = server.getWorkspaceSymbols('');
      const section = symbols.find(s => s.name === 'FOCUS');
      const attr = symbols.find(s => s.name === 'active');
      const version = symbols.find(s => s.name === 'MBEL');
      expect(section?.kind).toBe(SymbolKind.Module);
      expect(attr?.kind).toBe(SymbolKind.Property);
      expect(version?.kind).toBe(SymbolKind.Constant);
    });

    it('should support partial query matching', () => {
      server.onDidOpenTextDocument(uri1, 1, '[AUTHENTICATION]\n@activeSession::true');
      const symbols = server.getWorkspaceSymbols('AUTH');
      expect(symbols.some(s => s.name === 'AUTHENTICATION')).toBe(true);
    });

    it('should update when documents change', () => {
      server.onDidOpenTextDocument(uri1, 1, '[OLD]');
      let symbols = server.getWorkspaceSymbols('OLD');
      expect(symbols.some(s => s.name === 'OLD')).toBe(true);

      server.onDidChangeTextDocument(uri1, 2, '[NEW]');
      symbols = server.getWorkspaceSymbols('OLD');
      expect(symbols.some(s => s.name === 'OLD')).toBe(false);
      symbols = server.getWorkspaceSymbols('NEW');
      expect(symbols.some(s => s.name === 'NEW')).toBe(true);
    });

    it('should remove symbols when document closes', () => {
      server.onDidOpenTextDocument(uri1, 1, '[TEMPORARY]');
      let symbols = server.getWorkspaceSymbols('TEMPORARY');
      expect(symbols).toHaveLength(1);

      server.onDidCloseTextDocument(uri1);
      symbols = server.getWorkspaceSymbols('TEMPORARY');
      expect(symbols).toHaveLength(0);
    });

    it('should return symbols with containerName for nested symbols', () => {
      server.onDidOpenTextDocument(uri1, 1, '[FOCUS]\n@active::Working');
      const symbols = server.getWorkspaceSymbols('active');
      const attr = symbols.find(s => s.name === 'active');
      expect(attr?.containerName).toBe('FOCUS');
    });

    it('should handle empty query returning all symbols', () => {
      server.onDidOpenTextDocument(uri1, 1, '[A]\n@x::1');
      server.onDidOpenTextDocument(uri2, 1, '[B]\n@y::2');
      server.onDidOpenTextDocument(uri3, 1, '[C]\n@z::3');
      const symbols = server.getWorkspaceSymbols('');
      expect(symbols.length).toBeGreaterThanOrEqual(6); // 3 sections + 3 attributes
    });
  });
});
