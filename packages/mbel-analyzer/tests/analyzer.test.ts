import { describe, it, expect, beforeEach } from 'vitest';
import { MbelAnalyzer } from '../src/analyzer.js';
import type { Diagnostic, QuickFix, AnalysisResult } from '../src/types.js';

describe('MbelAnalyzer', () => {
  let analyzer: MbelAnalyzer;

  beforeEach(() => {
    analyzer = new MbelAnalyzer();
  });

  // Helper to analyze and get first diagnostic
  const analyzeFirst = (input: string): Diagnostic => {
    const result = analyzer.analyzeText(input);
    return result.diagnostics[0]!;
  };

  // Helper to get all diagnostics of a specific code
  const getDiagnosticsOfCode = (result: AnalysisResult, code: string): readonly Diagnostic[] => {
    return result.diagnostics.filter(d => d.code === code);
  };

  describe('Basic Functionality', () => {
    it('should create analyzer with default options', () => {
      expect(analyzer).toBeInstanceOf(MbelAnalyzer);
    });

    it('should analyze empty document without errors', () => {
      const result = analyzer.analyzeText('');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should analyze valid document without errors', () => {
      const result = analyzer.analyzeText('§MBEL:5.0\n[FOCUS]\n@active::Working');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should return source as mbel', () => {
      const result = analyzer.analyzeText('$invalid');
      expect(result.diagnostics[0]?.source).toBe('mbel');
    });
  });

  describe('Unknown Character Errors', () => {
    it('should report unknown character $', () => {
      const diag = analyzeFirst('$invalid');
      expect(diag.code).toBe('UNKNOWN_CHARACTER');
      expect(diag.severity).toBe('error');
      expect(diag.message).toContain('$');
    });

    it('should report unknown character ^', () => {
      const diag = analyzeFirst('^test');
      expect(diag.code).toBe('UNKNOWN_CHARACTER');
      expect(diag.message).toContain('^');
    });

    it('should report unknown character \\', () => {
      const diag = analyzeFirst('test\\value');
      expect(diag.code).toBe('UNKNOWN_CHARACTER');
    });

    it('should report multiple unknown characters', () => {
      const result = analyzer.analyzeText('$first ^second');
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(2);
    });

    it('should include correct position for unknown character', () => {
      const diag = analyzeFirst('valid $invalid');
      expect(diag.range.start.column).toBeGreaterThan(1);
    });
  });

  describe('Unclosed Bracket Errors', () => {
    it('should report unclosed section bracket', () => {
      const diag = analyzeFirst('[FOCUS');
      expect(diag.code).toBe('UNCLOSED_SECTION');
      expect(diag.severity).toBe('error');
    });

    it('should report unclosed metadata brace', () => {
      const diag = analyzeFirst('@attr::value{meta');
      expect(diag.code).toBe('UNCLOSED_METADATA');
      expect(diag.severity).toBe('error');
    });

    it('should report unclosed note parenthesis', () => {
      const diag = analyzeFirst('(incomplete note');
      expect(diag.code).toBe('UNCLOSED_NOTE');
      expect(diag.severity).toBe('error');
    });

    it('should report unclosed variant angle bracket', () => {
      const diag = analyzeFirst('<variant');
      expect(diag.code).toBe('UNCLOSED_VARIANT');
      expect(diag.severity).toBe('error');
    });

    it('should report nested unclosed brackets', () => {
      const result = analyzer.analyzeText('[Section{unclosed');
      const codes = result.diagnostics.map(d => d.code);
      expect(codes).toContain('UNCLOSED_SECTION');
    });
  });

  describe('Grammar Violations - Article Usage', () => {
    it('should warn about article "the"', () => {
      const diag = analyzeFirst('@focus::the project');
      expect(diag.code).toBe('ARTICLE_USAGE');
      expect(diag.severity).toBe('warning');
      expect(diag.message).toContain('the');
    });

    it('should warn about article "a"', () => {
      const diag = analyzeFirst('@item::a task');
      expect(diag.code).toBe('ARTICLE_USAGE');
      expect(diag.message).toContain('a');
    });

    it('should warn about article "an"', () => {
      const diag = analyzeFirst('@item::an example');
      expect(diag.code).toBe('ARTICLE_USAGE');
      expect(diag.message).toContain('an');
    });

    it('should not flag "the" inside a word', () => {
      const result = analyzer.analyzeText('@focus::weather');
      const articleDiags = getDiagnosticsOfCode(result, 'ARTICLE_USAGE');
      expect(articleDiags).toHaveLength(0);
    });

    it('should not flag "a" inside a word', () => {
      const result = analyzer.analyzeText('@focus::area');
      const articleDiags = getDiagnosticsOfCode(result, 'ARTICLE_USAGE');
      expect(articleDiags).toHaveLength(0);
    });

    it('should detect multiple article violations', () => {
      const result = analyzer.analyzeText('@first::the task\n@second::a project');
      const articleDiags = getDiagnosticsOfCode(result, 'ARTICLE_USAGE');
      expect(articleDiags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Grammar Violations - CamelCase', () => {
    it('should warn about non-CamelCase identifier with underscores', () => {
      const result = analyzer.analyzeText('@my_attribute::value');
      const diags = getDiagnosticsOfCode(result, 'NON_CAMEL_CASE');
      expect(diags.length).toBeGreaterThan(0);
    });

    it('should warn about snake_case in attribute value', () => {
      const result = analyzer.analyzeText('@focus::my_value_here');
      const diags = getDiagnosticsOfCode(result, 'NON_CAMEL_CASE');
      expect(diags.length).toBeGreaterThan(0);
    });

    it('should not warn about valid CamelCase', () => {
      const result = analyzer.analyzeText('@myAttribute::ValidValue');
      const diags = getDiagnosticsOfCode(result, 'NON_CAMEL_CASE');
      expect(diags).toHaveLength(0);
    });

    it('should not warn about single lowercase word', () => {
      const result = analyzer.analyzeText('@focus::working');
      const diags = getDiagnosticsOfCode(result, 'NON_CAMEL_CASE');
      expect(diags).toHaveLength(0);
    });
  });

  describe('Semantic Warnings - Unused Sections', () => {
    it('should warn about unused section', () => {
      const result = analyzer.analyzeText('[UNUSED]');
      const diags = getDiagnosticsOfCode(result, 'UNUSED_SECTION');
      expect(diags.length).toBeGreaterThan(0);
      expect(diags[0]?.severity).toBe('warning');
    });

    it('should not warn when section has content', () => {
      const result = analyzer.analyzeText('[FOCUS]\n@active::Working');
      const diags = getDiagnosticsOfCode(result, 'UNUSED_SECTION');
      expect(diags).toHaveLength(0);
    });

    it('should warn about multiple unused sections', () => {
      const result = analyzer.analyzeText('[UNUSED1]\n[UNUSED2]');
      const diags = getDiagnosticsOfCode(result, 'UNUSED_SECTION');
      expect(diags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Semantic Warnings - Duplicate Sections', () => {
    it('should warn about duplicate section names', () => {
      const result = analyzer.analyzeText('[FOCUS]\n@a::b\n[FOCUS]\n@c::d');
      const diags = getDiagnosticsOfCode(result, 'DUPLICATE_SECTION');
      expect(diags.length).toBeGreaterThan(0);
      expect(diags[0]?.severity).toBe('warning');
    });

    it('should not warn about different section names', () => {
      const result = analyzer.analyzeText('[FOCUS]\n[CONTEXT]');
      const diags = getDiagnosticsOfCode(result, 'DUPLICATE_SECTION');
      expect(diags).toHaveLength(0);
    });

    it('should include related info pointing to first occurrence', () => {
      const result = analyzer.analyzeText('[FOCUS]\n@a::b\n[FOCUS]');
      const diags = getDiagnosticsOfCode(result, 'DUPLICATE_SECTION');
      expect(diags[0]?.relatedInfo).toBeDefined();
      expect(diags[0]?.relatedInfo?.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic Warnings - Duplicate Attributes', () => {
    it('should warn about duplicate attribute names', () => {
      const result = analyzer.analyzeText('@focus::A\n@focus::B');
      const diags = getDiagnosticsOfCode(result, 'DUPLICATE_ATTRIBUTE');
      expect(diags.length).toBeGreaterThan(0);
    });

    it('should not warn about different attributes', () => {
      const result = analyzer.analyzeText('@focus::A\n@active::B');
      const diags = getDiagnosticsOfCode(result, 'DUPLICATE_ATTRIBUTE');
      expect(diags).toHaveLength(0);
    });
  });

  describe('Semantic Warnings - Missing Version', () => {
    it('should warn about missing version statement', () => {
      const result = analyzer.analyzeText('[FOCUS]\n@active::Working');
      const diags = getDiagnosticsOfCode(result, 'MISSING_VERSION');
      expect(diags.length).toBeGreaterThan(0);
      expect(diags[0]?.severity).toBe('warning');
    });

    it('should not warn when version is present', () => {
      const result = analyzer.analyzeText('§MBEL:5.0\n[FOCUS]');
      const diags = getDiagnosticsOfCode(result, 'MISSING_VERSION');
      expect(diags).toHaveLength(0);
    });
  });

  describe('Quick Fixes', () => {
    it('should provide quick fix for article removal', () => {
      const result = analyzer.analyzeText('@focus::the project');
      const articleDiag = result.diagnostics.find(d => d.code === 'ARTICLE_USAGE');
      expect(articleDiag).toBeDefined();

      const fixes = analyzer.getQuickFixes(articleDiag!);
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0]?.title).toContain('Remove');
    });

    it('should provide quick fix for unclosed bracket', () => {
      const result = analyzer.analyzeText('[FOCUS');
      const bracketDiag = result.diagnostics.find(d => d.code === 'UNCLOSED_SECTION');
      expect(bracketDiag).toBeDefined();

      const fixes = analyzer.getQuickFixes(bracketDiag!);
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0]?.edits[0]?.newText).toBe(']');
    });

    it('should provide quick fix for unclosed metadata', () => {
      const result = analyzer.analyzeText('@a::b{meta');
      const diag = result.diagnostics.find(d => d.code === 'UNCLOSED_METADATA');
      expect(diag).toBeDefined();

      const fixes = analyzer.getQuickFixes(diag!);
      expect(fixes[0]?.edits[0]?.newText).toBe('}');
    });

    it('should provide quick fix for missing version', () => {
      const result = analyzer.analyzeText('[FOCUS]');
      const diag = result.diagnostics.find(d => d.code === 'MISSING_VERSION');
      expect(diag).toBeDefined();

      const fixes = analyzer.getQuickFixes(diag!);
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0]?.edits[0]?.newText).toContain('§MBEL');
    });

    it('should mark preferred quick fix', () => {
      const result = analyzer.analyzeText('[FOCUS');
      const diag = result.diagnostics.find(d => d.code === 'UNCLOSED_SECTION');
      const fixes = analyzer.getQuickFixes(diag!);
      expect(fixes.some(f => f.isPreferred)).toBe(true);
    });
  });

  describe('Analyzer Options', () => {
    it('should skip grammar checks when disabled', () => {
      const noGrammar = new MbelAnalyzer({ grammarChecks: false });
      const result = noGrammar.analyzeText('@focus::the project');
      const articleDiags = getDiagnosticsOfCode(result, 'ARTICLE_USAGE');
      expect(articleDiags).toHaveLength(0);
    });

    it('should skip semantic checks when disabled', () => {
      const noSemantic = new MbelAnalyzer({ semanticChecks: false });
      const result = noSemantic.analyzeText('[UNUSED]');
      const unusedDiags = getDiagnosticsOfCode(result, 'UNUSED_SECTION');
      expect(unusedDiags).toHaveLength(0);
    });

    it('should skip hints when disabled', () => {
      const noHints = new MbelAnalyzer({ hints: false });
      const result = noHints.analyzeText('@focus::value');
      const hints = result.diagnostics.filter(d => d.severity === 'hint');
      expect(hints).toHaveLength(0);
    });
  });

  describe('Position Accuracy', () => {
    it('should report correct line for multiline document', () => {
      const result = analyzer.analyzeText('line1\nline2\n$invalid');
      const diag = result.diagnostics[0];
      expect(diag?.range.start.line).toBe(3);
    });

    it('should report correct column for error', () => {
      const result = analyzer.analyzeText('@focus::$invalid');
      const diag = result.diagnostics.find(d => d.code === 'UNKNOWN_CHARACTER');
      expect(diag?.range.start.column).toBe(9);
    });

    it('should provide end position for range', () => {
      const diag = analyzeFirst('[FOCUS');
      expect(diag.range.end).toBeDefined();
      expect(diag.range.end.offset).toBeGreaterThanOrEqual(diag.range.start.offset);
    });
  });

  describe('Integration with Parser Errors', () => {
    it('should include parser errors in diagnostics', () => {
      const result = analyzer.analyzeText('@::value'); // Missing identifier
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    it('should include lexer errors in diagnostics', () => {
      const result = analyzer.analyzeText('$$$');
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    it('should combine all error sources', () => {
      const result = analyzer.analyzeText('$invalid\n[FOCUS\nthe article');
      expect(result.diagnostics.length).toBeGreaterThanOrEqual(2);
    });
  });
});
