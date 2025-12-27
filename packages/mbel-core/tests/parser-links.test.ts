/**
 * TDDAB#9: CrossRefLinks - Parser Tests (RED Phase)
 *
 * Tests for parsing §links section:
 * - LinkDeclaration nodes (@feature, @task)
 * - Arrow clauses (->files, ->tests, ->blueprint, etc.)
 * - File references with markers (TO-CREATE, TO-MODIFY)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type {
  Document,
  Statement,
  LinkDeclaration,
  ArrowClause,
  FileRef,
} from '../src/ast.js';

describe('MbelParser: CrossRefLinks (TDDAB#9)', () => {
  let parser: MbelParser;

  beforeEach(() => {
    parser = new MbelParser();
  });

  // Helper to get first statement
  const firstStatement = (input: string): Statement => {
    const result = parser.parse(input);
    return result.document.statements[0]!;
  };

  // Helper to parse and get document
  const parseDoc = (input: string): Document => {
    const result = parser.parse(input);
    return result.document;
  };

  // Type guard for LinkDeclaration
  const isLinkDeclaration = (stmt: Statement): stmt is LinkDeclaration => {
    return stmt.type === 'LinkDeclaration';
  };

  describe('Link Declaration Parsing', () => {
    it('should parse @feature{Name} as LinkDeclaration', () => {
      const stmt = firstStatement('@feature{GoToDefinition}');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.linkType).toBe('feature');
        expect(stmt.name).toBe('GoToDefinition');
      }
    });

    it('should parse @task{Name} as LinkDeclaration', () => {
      const stmt = firstStatement('@task{RenameSymbol}');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.linkType).toBe('task');
        expect(stmt.name).toBe('RenameSymbol');
      }
    });

    it('should parse link with ->files clause', () => {
      const stmt = firstStatement('@feature{Lexer}->files[src/lexer.ts]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.name).toBe('Lexer');
        expect(stmt.files).toBeDefined();
        expect(stmt.files!.length).toBe(1);
        expect(stmt.files![0]!.path).toBe('src/lexer.ts');
      }
    });

    it('should parse link with multiple files', () => {
      const stmt = firstStatement('@feature{Core}->files[src/a.ts,src/b.ts,src/c.ts]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.files).toBeDefined();
        expect(stmt.files!.length).toBe(3);
        expect(stmt.files![0]!.path).toBe('src/a.ts');
        expect(stmt.files![1]!.path).toBe('src/b.ts');
        expect(stmt.files![2]!.path).toBe('src/c.ts');
      }
    });

    it('should parse link with ->tests clause', () => {
      const stmt = firstStatement('@feature{Parser}->tests[tests/parser.test.ts]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.tests).toBeDefined();
        expect(stmt.tests!.length).toBe(1);
        expect(stmt.tests![0]!.path).toBe('tests/parser.test.ts');
      }
    });

    it('should parse link with ->docs clause', () => {
      const stmt = firstStatement('@feature{API}->docs[docs/api.md]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.docs).toBeDefined();
        expect(stmt.docs!.length).toBe(1);
        expect(stmt.docs![0]!.path).toBe('docs/api.md');
      }
    });

    it('should parse link with ->decisions clause', () => {
      const stmt = firstStatement('@feature{Auth}->decisions[JWTChoice,SessionStrategy]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.decisions).toBeDefined();
        expect(stmt.decisions!.length).toBe(2);
        expect(stmt.decisions![0]).toBe('JWTChoice');
        expect(stmt.decisions![1]).toBe('SessionStrategy');
      }
    });

    it('should parse link with ->related clause', () => {
      const stmt = firstStatement('@feature{FindRefs}->related[GoToDefinition,Hover]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.related).toBeDefined();
        expect(stmt.related!.length).toBe(2);
        expect(stmt.related![0]).toBe('GoToDefinition');
        expect(stmt.related![1]).toBe('Hover');
      }
    });

    it('should parse link with ->entryPoint clause', () => {
      const stmt = firstStatement('@feature{Lexer}->entryPoint{lexer.ts:tokenize:45}');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.entryPoint).toBeDefined();
        expect(stmt.entryPoint!.file).toBe('lexer.ts');
        expect(stmt.entryPoint!.symbol).toBe('tokenize');
        expect(stmt.entryPoint!.line).toBe(45);
      }
    });

    it('should parse link with ->blueprint clause', () => {
      const stmt = firstStatement('@task{AddFeature}->blueprint["Step 1: Create file","Step 2: Add tests"]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.blueprint).toBeDefined();
        expect(stmt.blueprint!.length).toBe(2);
        expect(stmt.blueprint![0]).toBe('Step 1: Create file');
        expect(stmt.blueprint![1]).toBe('Step 2: Add tests');
      }
    });

    it('should parse link with ->depends clause', () => {
      const stmt = firstStatement('@task{Rename}->depends[FindReferences,SymbolTable]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.depends).toBeDefined();
        expect(stmt.depends!.length).toBe(2);
        expect(stmt.depends![0]).toBe('FindReferences');
        expect(stmt.depends![1]).toBe('SymbolTable');
      }
    });
  });

  describe('File Reference Markers', () => {
    it('should parse file with TO-CREATE marker', () => {
      const stmt = firstStatement('@task{NewFeature}->files[src/new.ts{TO-CREATE}]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.files![0]!.path).toBe('src/new.ts');
        expect(stmt.files![0]!.marker).toBe('TO-CREATE');
      }
    });

    it('should parse file with TO-MODIFY marker', () => {
      const stmt = firstStatement('@task{Update}->files[src/existing.ts{TO-MODIFY}]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.files![0]!.path).toBe('src/existing.ts');
        expect(stmt.files![0]!.marker).toBe('TO-MODIFY');
      }
    });

    it('should parse file with line range', () => {
      const stmt = firstStatement('@feature{Handler}->files[src/handler.ts:10-50]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.files![0]!.path).toBe('src/handler.ts');
        expect(stmt.files![0]!.lineRange).toEqual({ start: 10, end: 50 });
      }
    });

    it('should parse glob pattern in files', () => {
      const stmt = firstStatement('@feature{Rules}->files[src/rules/**/*.ts]');

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.files![0]!.path).toBe('src/rules/**/*.ts');
        expect(stmt.files![0]!.isGlob).toBe(true);
      }
    });
  });

  describe('Complex Link Declarations', () => {
    it('should parse link with multiple clauses', () => {
      const input = `@feature{GoToDefinition}
->files[src/features/definition.ts]
->tests[tests/features/definition.test.ts]
->docs[docs/goto.md]
->related[FindReferences,Hover]
->entryPoint{definition.ts:handleDefinition:15}`;

      const stmt = firstStatement(input);

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.name).toBe('GoToDefinition');
        expect(stmt.files).toBeDefined();
        expect(stmt.tests).toBeDefined();
        expect(stmt.docs).toBeDefined();
        expect(stmt.related).toBeDefined();
        expect(stmt.entryPoint).toBeDefined();
      }
    });

    it('should parse task with full blueprint', () => {
      const input = `@task{RenameSymbol}
->files[src/features/rename.ts{TO-CREATE}]
->tests[tests/features/rename.test.ts{TO-CREATE}]
->depends[FindReferences,SymbolTable]
->blueprint["1. Reuse findReferences()","2. Generate WorkspaceEdit","3. Validate name"]`;

      const stmt = firstStatement(input);

      expect(isLinkDeclaration(stmt)).toBe(true);
      if (isLinkDeclaration(stmt)) {
        expect(stmt.linkType).toBe('task');
        expect(stmt.files![0]!.marker).toBe('TO-CREATE');
        expect(stmt.depends!.length).toBe(2);
        expect(stmt.blueprint!.length).toBe(3);
      }
    });
  });

  describe('Links Section Context', () => {
    it('should parse [links] section with multiple link declarations', () => {
      const input = `[links]
@feature{Lexer}->files[src/lexer.ts]
@feature{Parser}->files[src/parser.ts]
@task{NewFeature}->depends[Lexer,Parser]`;

      const doc = parseDoc(input);

      // First statement is SectionDeclaration
      expect(doc.statements[0]!.type).toBe('SectionDeclaration');

      // Following statements should be LinkDeclarations
      expect(doc.statements[1]!.type).toBe('LinkDeclaration');
      expect(doc.statements[2]!.type).toBe('LinkDeclaration');
      expect(doc.statements[3]!.type).toBe('LinkDeclaration');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from malformed link declaration', () => {
      const input = `@feature{Broken->files[
@feature{Valid}->files[src/valid.ts]`;

      const result = parser.parse(input);

      // Should have errors but still parse what it can
      expect(result.errors.length).toBeGreaterThan(0);
      // Should still have parsed some statements
      expect(result.document.statements.length).toBeGreaterThan(0);
    });

    it('should handle missing closing bracket in files list', () => {
      const input = '@feature{Test}->files[src/a.ts,src/b.ts';

      const result = parser.parse(input);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for link declarations', () => {
      const stmt = firstStatement('@feature{Test}');

      expect(stmt.start.line).toBe(1);
      expect(stmt.start.column).toBe(1);
    });

    it('should track positions across multiple lines', () => {
      const input = `@feature{MultiLine}
->files[src/file.ts]`;

      const stmt = firstStatement(input);

      expect(isLinkDeclaration(stmt)).toBe(true);
      expect(stmt.start.line).toBe(1);
      expect(stmt.end.line).toBe(2);
    });
  });
});
