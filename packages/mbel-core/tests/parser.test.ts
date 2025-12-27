import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type { Document, Statement, SectionDeclaration, AttributeStatement, VersionStatement, ChainExpression, StateExpression } from '../src/ast.js';

describe('MbelParser', () => {
  let parser: MbelParser;

  beforeEach(() => {
    parser = new MbelParser();
  });

  // Helper to parse and get first statement
  const parseFirst = (input: string): Statement => {
    const result = parser.parse(input);
    return result.document.statements[0]!;
  };

  describe('Document Structure', () => {
    it('should parse empty document', () => {
      const result = parser.parse('');
      expect(result.document.type).toBe('Document');
      expect(result.document.statements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse document with multiple statements', () => {
      const result = parser.parse('[FOCUS]\n@active::Working\n✓done::Task');
      expect(result.document.statements).toHaveLength(3);
    });

    it('should ignore empty lines', () => {
      const result = parser.parse('line1\n\n\nline2');
      expect(result.document.statements).toHaveLength(2);
    });
  });

  describe('Section Declarations', () => {
    it('should parse section declaration', () => {
      const stmt = parseFirst('[FOCUS]') as SectionDeclaration;
      expect(stmt.type).toBe('SectionDeclaration');
      expect(stmt.name).toBe('FOCUS');
    });

    it('should parse section with spaces', () => {
      const stmt = parseFirst('[Current Focus]') as SectionDeclaration;
      expect(stmt.type).toBe('SectionDeclaration');
      expect(stmt.name).toBe('Current Focus');
    });

    it('should parse multiple sections', () => {
      const result = parser.parse('[Section1]\n[Section2]');
      expect(result.document.statements).toHaveLength(2);
      expect((result.document.statements[0] as SectionDeclaration).name).toBe('Section1');
      expect((result.document.statements[1] as SectionDeclaration).name).toBe('Section2');
    });
  });

  describe('Version Statements', () => {
    it('should parse version declaration', () => {
      const stmt = parseFirst('§MBEL:5.0') as VersionStatement;
      expect(stmt.type).toBe('VersionStatement');
      expect(stmt.name.name).toBe('MBEL');
      expect(stmt.version).toBe('5.0');
    });

    it('should parse version with double colon', () => {
      const stmt = parseFirst('§API::2.1.3') as VersionStatement;
      expect(stmt.type).toBe('VersionStatement');
      expect(stmt.name.name).toBe('API');
      expect(stmt.version).toBe('2.1.3');
    });
  });

  describe('Attribute Statements', () => {
    it('should parse present attribute', () => {
      const stmt = parseFirst('@focus::Working') as AttributeStatement;
      expect(stmt.type).toBe('AttributeStatement');
      expect(stmt.temporal).toBe('present');
      expect(stmt.name.name).toBe('focus');
    });

    it('should parse past attribute', () => {
      const stmt = parseFirst('>completed::Task') as AttributeStatement;
      expect(stmt.type).toBe('AttributeStatement');
      expect(stmt.temporal).toBe('past');
    });

    it('should parse future attribute', () => {
      const stmt = parseFirst('?planned::Feature') as AttributeStatement;
      expect(stmt.type).toBe('AttributeStatement');
      expect(stmt.temporal).toBe('future');
    });

    it('should parse approximate attribute', () => {
      const stmt = parseFirst('≈estimate::Deadline') as AttributeStatement;
      expect(stmt.type).toBe('AttributeStatement');
      expect(stmt.temporal).toBe('approx');
    });

    it('should parse attribute with metadata', () => {
      // Note: @task is now reserved for MBEL v6 LinkDeclaration, use @item instead
      const stmt = parseFirst('@item{priority:high,status:active}') as AttributeStatement;
      expect(stmt.type).toBe('AttributeStatement');
      expect(stmt.metadata).not.toBeNull();
      expect(stmt.metadata?.content).toContain('priority');
    });
  });

  describe('State Expressions', () => {
    it('should parse complete state', () => {
      const stmt = parseFirst('✓done::Task');
      expect(stmt.type).toBe('ExpressionStatement');
      const expr = (stmt as { expression: StateExpression }).expression;
      expect(expr.type).toBe('StateExpression');
      expect(expr.state).toBe('complete');
    });

    it('should parse failed state', () => {
      const stmt = parseFirst('✗failed::Build');
      const expr = (stmt as { expression: StateExpression }).expression;
      expect(expr.type).toBe('StateExpression');
      expect(expr.state).toBe('failed');
    });

    it('should parse critical state', () => {
      const stmt = parseFirst('!urgent::Fix');
      const expr = (stmt as { expression: StateExpression }).expression;
      expect(expr.type).toBe('StateExpression');
      expect(expr.state).toBe('critical');
    });

    it('should parse active state', () => {
      const stmt = parseFirst('⚡inProgress::Development');
      const expr = (stmt as { expression: StateExpression }).expression;
      expect(expr.type).toBe('StateExpression');
      expect(expr.state).toBe('active');
    });
  });

  describe('Chain Expressions', () => {
    it('should parse defines chain', () => {
      const stmt = parseFirst('Name::Value');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('defines');
    });

    it('should parse leads_to chain', () => {
      const stmt = parseFirst('Cause→Effect');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('leads_to');
    });

    it('should parse from chain', () => {
      const stmt = parseFirst('Result←Source');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('from');
    });

    it('should parse mutual chain', () => {
      const stmt = parseFirst('A↔B');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('mutual');
    });

    it('should parse multiple chains', () => {
      const stmt = parseFirst('A→B→C');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      // Should be left-associative: (A→B)→C
      expect(expr.left.type).toBe('ChainExpression');
    });

    it('should parse and chain', () => {
      const stmt = parseFirst('Feature+Enhancement');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('and');
    });

    it('should parse remove chain', () => {
      const stmt = parseFirst('All-Excluded');
      const expr = (stmt as { expression: ChainExpression }).expression;
      expect(expr.type).toBe('ChainExpression');
      expect(expr.operator).toBe('remove');
    });
  });

  describe('Logic Expressions', () => {
    it('should parse AND logic', () => {
      const stmt = parseFirst('RequireAuth&ValidToken');
      const expr = (stmt as { expression: unknown }).expression;
      expect((expr as { type: string }).type).toBe('LogicExpression');
      expect((expr as { operator: string }).operator).toBe('and');
    });

    it('should parse OR logic', () => {
      const stmt = parseFirst('UseCache||UseDB');
      const expr = (stmt as { expression: unknown }).expression;
      expect((expr as { type: string }).type).toBe('LogicExpression');
      expect((expr as { operator: string }).operator).toBe('or');
    });

    it('should parse NOT logic', () => {
      const stmt = parseFirst('¬Expired');
      const expr = (stmt as { expression: unknown }).expression;
      expect((expr as { type: string }).type).toBe('LogicExpression');
      expect((expr as { operator: string }).operator).toBe('not');
    });

    it('should parse complex logic', () => {
      const stmt = parseFirst('Auth&Token&¬Expired');
      expect((stmt as { expression: unknown }).expression).toBeDefined();
    });
  });

  describe('Metadata Blocks', () => {
    it('should parse simple metadata', () => {
      const stmt = parseFirst('Task{status:done}');
      expect(stmt).toBeDefined();
      expect(stmt.type).toBe('ExpressionStatement');
    });

    it('should parse metadata with percent', () => {
      const stmt = parseFirst('Progress{completion%85}');
      expect(stmt).toBeDefined();
      expect(stmt.type).toBe('ExpressionStatement');
    });

    it('should parse metadata with number', () => {
      const stmt = parseFirst('Count{items#42}');
      expect(stmt).toBeDefined();
      expect(stmt.type).toBe('ExpressionStatement');
    });

    it('should parse nested metadata', () => {
      const stmt = parseFirst('Task{status:done,meta:{nested:true}}');
      expect(stmt).toBeDefined();
    });
  });

  describe('Notes and Variants', () => {
    it('should parse note', () => {
      const stmt = parseFirst('Task(this is a note)');
      expect(stmt).toBeDefined();
    });

    it('should parse variant', () => {
      const stmt = parseFirst('Template<placeholder>');
      expect(stmt).toBeDefined();
    });
  });

  describe('Complex MBEL Expressions', () => {
    it('should parse full MBEL document', () => {
      const input = `§MBEL:5.0
@purpose::AIMemoryEncoding{compression%75}

[FOCUS]
@breakthrough::LivingMemory!
>abandoned::RAG→DNA

[RECENT]
>created::MemomCodex§0.2{namespaces#7}✓
©Zen>designed::GraphGenes

[NEXT]
?Ollama{confidence%90,¬embeddings}!
`;
      const result = parser.parse(input);
      expect(result.errors).toHaveLength(0);
      expect(result.document.statements.length).toBeGreaterThan(0);
    });

    it('should parse evolution chain with metadata', () => {
      const stmt = parseFirst('V1→V2→V3{current}');
      expect(stmt).toBeDefined();
    });

    it('should parse attribution', () => {
      const stmt = parseFirst('©Claude>implemented::Feature');
      expect(stmt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should recover from invalid syntax', () => {
      const result = parser.parse('valid\n^ invalid\nmore');
      expect(result.document.statements.length).toBeGreaterThan(0);
    });

    it('should report unclosed brackets', () => {
      const result = parser.parse('[unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report position in errors', () => {
      const result = parser.parse('line1\n^ error');
      if (result.errors.length > 0) {
        expect(result.errors[0]!.position).toBeDefined();
        expect(result.errors[0]!.position.line).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Position Tracking', () => {
    it('should track statement positions', () => {
      const result = parser.parse('line1\nline2');
      const stmt1 = result.document.statements[0]!;
      const stmt2 = result.document.statements[1]!;
      expect(stmt1.start.line).toBe(1);
      expect(stmt2.start.line).toBe(2);
    });

    it('should track expression positions', () => {
      const stmt = parseFirst('Name::Value');
      expect(stmt.start.column).toBe(1);
    });
  });
});
