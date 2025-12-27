/**
 * TDDAB#13: IntentMarkers - Parser Tests (RED Phase)
 *
 * Tests for parsing §intents section:
 * - IntentDeclaration nodes (@Module::Component)
 * - Intent property clauses (->does, ->doesNot, ->contract, etc.)
 * - Full intent declarations with multiple properties
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type { Document, Statement, IntentDeclaration } from '../src/ast.js';

describe('MbelParser: IntentMarkers (TDDAB#13)', () => {
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

  // Type guard for IntentDeclaration
  const isIntentDeclaration = (stmt: Statement): stmt is IntentDeclaration => {
    return stmt.type === 'IntentDeclaration';
  };

  describe('Intent Declaration Parsing', () => {
    it('should parse @Module::Component as IntentDeclaration', () => {
      const stmt = firstStatement('@Parser::StatementHandler');

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.module).toBe('Parser');
        expect(stmt.component).toBe('StatementHandler');
      }
    });

    it('should parse different module/component names', () => {
      const stmt = firstStatement('@Lexer::TokenScanner');

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.module).toBe('Lexer');
        expect(stmt.component).toBe('TokenScanner');
      }
    });

    it('should default all optional fields to null', () => {
      const stmt = firstStatement('@Parser::StatementHandler');

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.does).toBeNull();
        expect(stmt.doesNot).toBeNull();
        expect(stmt.contract).toBeNull();
        expect(stmt.singleResponsibility).toBeNull();
        expect(stmt.antiPattern).toBeNull();
        expect(stmt.extends).toBeNull();
      }
    });
  });

  describe('Intent with Does', () => {
    it('should parse intent with ->does clause', () => {
      const input = '@Parser::StatementHandler\n  ->does{Parse MBEL statements into AST nodes}';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.does).toBe('Parse MBEL statements into AST nodes');
      }
    });
  });

  describe('Intent with DoesNot', () => {
    it('should parse intent with ->doesNot clause', () => {
      const input = '@Parser::StatementHandler\n  ->doesNot{Validate semantic correctness}';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.doesNot).toBe('Validate semantic correctness');
      }
    });
  });

  describe('Intent with Contract', () => {
    it('should parse intent with ->contract clause', () => {
      const input = '@Parser::StatementHandler\n  ->contract{Returns Statement | null}';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.contract).toBe('Returns Statement | null');
      }
    });
  });

  describe('Intent with SingleResponsibility', () => {
    it('should parse intent with ->singleResponsibility clause', () => {
      const input = '@Parser::StatementHandler\n  ->singleResponsibility{Statement parsing only}';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.singleResponsibility).toBe('Statement parsing only');
      }
    });
  });

  describe('Intent with AntiPattern', () => {
    it('should parse intent with ->antiPattern clause', () => {
      const input = '@Lexer::TokenScanner\n  ->antiPattern{Global state mutation}';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.antiPattern).toBe('Global state mutation');
      }
    });
  });

  describe('Intent with Extends', () => {
    it('should parse intent with ->extends list', () => {
      const input = '@Parser::StatementHandler\n  ->extends[BaseHandler, Serializable]';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.extends).toEqual(['BaseHandler', 'Serializable']);
      }
    });

    it('should parse intent with single extends', () => {
      const input = '@Parser::StatementHandler\n  ->extends[BaseHandler]';
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.extends).toEqual(['BaseHandler']);
      }
    });
  });

  describe('Full Intent Declaration', () => {
    it('should parse intent with multiple clauses', () => {
      const input = `@Parser::StatementHandler
  ->does{Parse MBEL statements}
  ->doesNot{Validate semantics}
  ->contract{Returns Statement}
  ->singleResponsibility{Parsing only}`;
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.module).toBe('Parser');
        expect(stmt.component).toBe('StatementHandler');
        expect(stmt.does).toBe('Parse MBEL statements');
        expect(stmt.doesNot).toBe('Validate semantics');
        expect(stmt.contract).toBe('Returns Statement');
        expect(stmt.singleResponsibility).toBe('Parsing only');
      }
    });

    it('should parse complete intent with all clauses', () => {
      const input = `@Lexer::TokenScanner
  ->does{Tokenize source text}
  ->doesNot{Parse structure}
  ->contract{Returns Token[]}
  ->singleResponsibility{Tokenization}
  ->antiPattern{Mutable state}
  ->extends[BaseScanner]`;
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.does).toBe('Tokenize source text');
        expect(stmt.doesNot).toBe('Parse structure');
        expect(stmt.contract).toBe('Returns Token[]');
        expect(stmt.singleResponsibility).toBe('Tokenization');
        expect(stmt.antiPattern).toBe('Mutable state');
        expect(stmt.extends).toEqual(['BaseScanner']);
      }
    });
  });

  describe('Multiple Intents', () => {
    it('should parse multiple intents in sequence', () => {
      const input = `@Parser::StatementHandler
@Lexer::TokenScanner
@Analyzer::SemanticChecker`;
      const doc = parseDoc(input);

      const intents = doc.statements.filter(isIntentDeclaration);
      expect(intents.length).toBe(3);
      expect(intents[0]!.module).toBe('Parser');
      expect(intents[1]!.module).toBe('Lexer');
      expect(intents[2]!.module).toBe('Analyzer');
    });

    it('should parse intents within a section', () => {
      const input = `[INTENTS]
@Parser::StatementHandler
@Lexer::TokenScanner`;
      const doc = parseDoc(input);

      const intents = doc.statements.filter(isIntentDeclaration);
      expect(intents.length).toBe(2);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for intent', () => {
      const stmt = firstStatement('@Parser::StatementHandler');

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        expect(stmt.start.line).toBe(1);
        expect(stmt.start.column).toBe(1);
      }
    });

    it('should track positions on multiline intent', () => {
      const input = `@Parser::StatementHandler
  ->does{Parse statements}
  ->contract{Returns Statement}`;
      const stmt = firstStatement(input);

      expect(isIntentDeclaration(stmt)).toBe(true);
      if (isIntentDeclaration(stmt)) {
        // End should be on line 3 after contract
        expect(stmt.end.line).toBe(3);
      }
    });
  });
});
