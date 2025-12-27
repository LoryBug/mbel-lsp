/**
 * TDDAB#10: SemanticAnchors - Parser Tests (RED Phase)
 *
 * Tests for parsing §anchors section:
 * - AnchorDeclaration nodes (@entry::, @hotspot::, @boundary::)
 * - Description clause (->descrizione)
 * - Path handling (simple paths and glob patterns)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MbelParser } from '../src/parser.js';
import type { Document, Statement, AnchorDeclaration } from '../src/ast.js';

describe('MbelParser: SemanticAnchors (TDDAB#10)', () => {
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

  // Type guard for AnchorDeclaration
  const isAnchorDeclaration = (stmt: Statement): stmt is AnchorDeclaration => {
    return stmt.type === 'AnchorDeclaration';
  };

  describe('Anchor Declaration Parsing', () => {
    it('should parse @entry::path as AnchorDeclaration', () => {
      const stmt = firstStatement('@entry::src/index.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.anchorType).toBe('entry');
        expect(stmt.path).toBe('src/index.ts');
      }
    });

    it('should parse @hotspot::path as AnchorDeclaration', () => {
      const stmt = firstStatement('@hotspot::src/core/parser.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.anchorType).toBe('hotspot');
        expect(stmt.path).toBe('src/core/parser.ts');
      }
    });

    it('should parse @boundary::path as AnchorDeclaration', () => {
      const stmt = firstStatement('@boundary::src/api/external.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.anchorType).toBe('boundary');
        expect(stmt.path).toBe('src/api/external.ts');
      }
    });
  });

  describe('Anchor with Description', () => {
    it('should parse anchor with ->descrizione clause', () => {
      const input = '@entry::src/index.ts\n  ->descrizione::Main entry point';
      const stmt = firstStatement(input);

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.anchorType).toBe('entry');
        expect(stmt.path).toBe('src/index.ts');
        expect(stmt.description).toBe('Main entry point');
      }
    });

    it('should parse anchor without description (description is null)', () => {
      const stmt = firstStatement('@entry::src/index.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.description).toBeNull();
      }
    });
  });

  describe('Anchor with Glob Patterns', () => {
    it('should parse anchor with glob pattern and set isGlob true', () => {
      const stmt = firstStatement('@entry::src/**/*.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.path).toBe('src/**/*.ts');
        expect(stmt.isGlob).toBe(true);
      }
    });

    it('should parse anchor with simple path and set isGlob false', () => {
      const stmt = firstStatement('@entry::src/index.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.path).toBe('src/index.ts');
        expect(stmt.isGlob).toBe(false);
      }
    });

    it('should detect glob with question mark pattern', () => {
      const stmt = firstStatement('@hotspot::src/?.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.isGlob).toBe(true);
      }
    });
  });

  describe('Multiple Anchors', () => {
    it('should parse multiple anchors in sequence', () => {
      const input = `@entry::src/a.ts
@hotspot::src/b.ts
@boundary::src/c.ts`;
      const doc = parseDoc(input);

      const anchors = doc.statements.filter(isAnchorDeclaration);
      expect(anchors.length).toBe(3);
      expect(anchors[0]!.anchorType).toBe('entry');
      expect(anchors[1]!.anchorType).toBe('hotspot');
      expect(anchors[2]!.anchorType).toBe('boundary');
    });

    it('should parse anchors within a section', () => {
      const input = `[ANCHORS]
@entry::src/index.ts
@hotspot::src/parser.ts`;
      const doc = parseDoc(input);

      const anchors = doc.statements.filter(isAnchorDeclaration);
      expect(anchors.length).toBe(2);
    });
  });

  describe('Position Tracking', () => {
    it('should track correct positions for anchor', () => {
      const stmt = firstStatement('@entry::src/index.ts');

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        expect(stmt.start.line).toBe(1);
        expect(stmt.start.column).toBe(1);
      }
    });

    it('should track positions on multiline anchor', () => {
      const input = '@entry::src/index.ts\n  ->descrizione::Main entry';
      const stmt = firstStatement(input);

      expect(isAnchorDeclaration(stmt)).toBe(true);
      if (isAnchorDeclaration(stmt)) {
        // End should be on line 2 after the description
        expect(stmt.end.line).toBe(2);
      }
    });
  });
});
