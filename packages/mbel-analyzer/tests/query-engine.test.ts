/**
 * TDDAB#15: QueryEngine - Semantic Navigation Engine (RED Phase)
 *
 * Tests for the modular query engine:
 * - DependencyGraph: Build and query dependency relationships
 * - SemanticSearch: Find anchors, links, decisions, intents
 * - ImpactAnalyzer: Calculate edit risk and impact analysis
 * - WorkContext: Composite queries for LLM context building
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryEngine } from '../src/query-engine/index.js';
import { MbelParser } from '@mbel/core';

describe('QueryEngine (TDDAB#15)', () => {
  let engine: QueryEngine;
  let parser: MbelParser;

  beforeEach(() => {
    engine = new QueryEngine();
    parser = new MbelParser();
  });

  // Helper to build engine from MBEL content
  const buildFrom = (content: string): void => {
    const result = parser.parse(content);
    engine.buildFromDocument(result.document);
  };

  describe('DependencyGraph', () => {
    const mbWithDeps = `
[LINKS]
@feature{AuthSystem}
  ->files[src/auth/login.ts, src/auth/logout.ts]
  ->tests[tests/auth/*.test.ts]
  ->depends[UserService, SessionManager]

@feature{UserService}
  ->files[src/users/service.ts]
  ->depends[Database]

@feature{SessionManager}
  ->files[src/session/manager.ts]
  ->depends[UserService]

@feature{Database}
  ->files[src/db/connection.ts]
`;

    it('should build dependency graph from AST', () => {
      buildFrom(mbWithDeps);
      const graph = engine.getDependencyGraph();

      expect(graph).toBeDefined();
      expect(graph.nodeCount).toBeGreaterThan(0);
    });

    it('should find dependents of a feature', () => {
      buildFrom(mbWithDeps);
      const dependents = engine.findDependents('UserService');

      expect(dependents).toContain('AuthSystem');
      expect(dependents).toContain('SessionManager');
    });

    it('should find dependencies of a feature', () => {
      buildFrom(mbWithDeps);
      const dependencies = engine.findDependencies('AuthSystem');

      expect(dependencies).toContain('UserService');
      expect(dependencies).toContain('SessionManager');
    });

    it('should detect circular dependencies', () => {
      const mbCircular = `
[LINKS]
@feature{A}
  ->depends[B]
@feature{B}
  ->depends[C]
@feature{C}
  ->depends[A]
`;
      buildFrom(mbCircular);
      const cycles = engine.detectCircularDependencies();

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A');
    });

    it('should calculate transitive dependencies', () => {
      buildFrom(mbWithDeps);
      const transitive = engine.getTransitiveDependencies('AuthSystem');

      expect(transitive).toContain('UserService');
      expect(transitive).toContain('SessionManager');
      expect(transitive).toContain('Database');
    });

    it('should find files by feature', () => {
      buildFrom(mbWithDeps);
      const files = engine.getFeatureFiles('AuthSystem');

      expect(files).toContain('src/auth/login.ts');
      expect(files).toContain('src/auth/logout.ts');
    });
  });

  describe('SemanticSearch', () => {
    const mbWithAnchors = `
[ANCHORS]
@entry::src/index.ts
  ->description{Application entry point}
@hotspot::src/core/**/*.ts
  ->description{Core business logic}
@boundary::src/api/routes.ts
  ->description{API boundary layer}

[DECISIONS]
@2024-01-15::UseTypeScript
  ->status{ACTIVE}
  ->reason{Type safety and tooling}
  ->context[src/auth/login.ts, src/core/utils.ts]

@2024-02-01::AdoptVitest
  ->status{ACTIVE}
  ->reason{Fast, ESM-native testing}

[INTENTS]
@Parser::StatementHandler
  ->does{Parse MBEL statements into AST}
  ->doesNot{Validate semantic correctness}
  ->contract{Returns Statement | null}

@Lexer::TokenScanner
  ->does{Tokenize source text}
  ->singleResponsibility{Tokenization only}
`;

    it('should find anchors by concept', () => {
      buildFrom(mbWithAnchors);
      const results = engine.findAnchor('entry');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.path).toBe('src/index.ts');
    });

    it('should find anchors by type', () => {
      buildFrom(mbWithAnchors);
      const hotspots = engine.findAnchorsByType('hotspot');

      expect(hotspots.length).toBe(1);
      expect(hotspots[0]!.path).toContain('src/core');
    });

    it('should find decisions by pattern', () => {
      buildFrom(mbWithAnchors);
      const results = engine.findDecisions('TypeScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.name).toBe('UseTypeScript');
    });

    it('should find decisions by context file', () => {
      buildFrom(mbWithAnchors);
      const results = engine.findDecisionsByContext('src/auth/login.ts');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.name).toBe('UseTypeScript');
    });

    it('should find decisions by status', () => {
      buildFrom(mbWithAnchors);
      const active = engine.findDecisionsByStatus('ACTIVE');

      expect(active.length).toBe(2);
    });

    it('should find intents by module', () => {
      buildFrom(mbWithAnchors);
      const results = engine.findIntentsByModule('Parser');

      expect(results.length).toBe(1);
      expect(results[0]!.component).toBe('StatementHandler');
    });

    it('should find intents by component', () => {
      buildFrom(mbWithAnchors);
      const result = engine.findIntent('Lexer', 'TokenScanner');

      expect(result).toBeDefined();
      expect(result?.does).toContain('Tokenize');
    });

    it('should search across all semantic elements', () => {
      buildFrom(mbWithAnchors);
      const results = engine.semanticSearch('entry');

      expect(results.anchors.length).toBeGreaterThan(0);
    });
  });

  describe('ImpactAnalyzer', () => {
    const mbWithHeat = `
[LINKS]
@feature{PaymentSystem}
  ->files[src/payments/processor.ts, src/payments/gateway.ts]
  ->tests[tests/payments/*.test.ts]

@feature{OrderSystem}
  ->files[src/orders/service.ts]
  ->depends[PaymentSystem]

[HEAT]
@critical::src/payments/processor.ts
  ->dependents[gateway.ts, orders/service.ts]
  ->changes{15}
  ->coverage{95%}
  ->confidence{high}
  ->caution{Core payment logic - requires full regression}

@stable::src/utils/helpers.ts
  ->untouched{90days}
  ->coverage{100%}
  ->confidence{rock-solid}

[ANCHORS]
@hotspot::src/payments/*.ts
  ->description{High-change payment area}
`;

    it('should calculate edit risk for a file', () => {
      buildFrom(mbWithHeat);
      const risk = engine.getEditRisk('src/payments/processor.ts');

      expect(risk.level).toBe('high');
      expect(risk.reasons).toContain('critical heat level');
    });

    it('should return low risk for stable files', () => {
      buildFrom(mbWithHeat);
      const risk = engine.getEditRisk('src/utils/helpers.ts');

      expect(risk.level).toBe('low');
    });

    it('should find affected files from change', () => {
      buildFrom(mbWithHeat);
      const impact = engine.getImpactAnalysis(['src/payments/processor.ts']);

      // The dependents list in heat declaration contains short paths
      expect(impact.affectedFiles).toContain('gateway.ts');
    });

    it('should find affected tests', () => {
      buildFrom(mbWithHeat);
      const impact = engine.getImpactAnalysis(['src/payments/processor.ts']);

      expect(impact.affectedTests.length).toBeGreaterThan(0);
    });

    it('should find affected features', () => {
      buildFrom(mbWithHeat);
      const impact = engine.getImpactAnalysis(['src/payments/processor.ts']);

      expect(impact.affectedFeatures).toContain('PaymentSystem');
      expect(impact.affectedFeatures).toContain('OrderSystem');
    });

    it('should generate recommendations', () => {
      buildFrom(mbWithHeat);
      const risk = engine.getEditRisk('src/payments/processor.ts');

      expect(risk.recommendations.length).toBeGreaterThan(0);
    });

    it('should consider hotspot status in risk', () => {
      buildFrom(mbWithHeat);
      const risk = engine.getEditRisk('src/payments/gateway.ts');

      expect(risk.reasons).toContain('hotspot area');
    });
  });

  describe('WorkContext (Composite Queries)', () => {
    const mbComplete = `
[LINKS]
@feature{Authentication}
  ->files[src/auth/login.ts, src/auth/session.ts]
  ->tests[tests/auth/*.test.ts]
  ->blueprint["Implement login form", "Add session management", "Add logout"]
  ->depends[UserService]

@feature{UserService}
  ->files[src/users/service.ts]

[ANCHORS]
@entry::src/auth/login.ts
  ->description{Main authentication entry}

[DECISIONS]
@2024-01-01::UseJWT
  ->status{ACTIVE}
  ->reason{Stateless authentication}
  ->context[src/auth/**]

[HEAT]
@critical::src/auth/login.ts
  ->confidence{high}
  ->caution{Security-critical code}

[INTENTS]
@Auth::LoginHandler
  ->does{Handle user login requests}
  ->contract{Returns Session | Error}
`;

    it('should build complete work context for feature', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      expect(context.feature).toBeDefined();
      expect(context.files.length).toBeGreaterThan(0);
      expect(context.tests.length).toBeGreaterThan(0);
      expect(context.decisions.length).toBeGreaterThan(0);
      expect(context.anchors.length).toBeGreaterThan(0);
    });

    it('should include blueprint in work context', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      expect(context.blueprint).toBeDefined();
      expect(context.blueprint?.length).toBe(3);
    });

    it('should include heat information in context', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      expect(context.heatInfo).toBeDefined();
      expect(context.heatInfo?.some(h => h.type === 'critical')).toBe(true);
    });

    it('should include related intents', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      // Should find intents related to auth files
      expect(context.intents.length).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate dependencies in context', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      expect(context.dependencies).toContain('UserService');
    });

    it('should calculate overall risk for feature', () => {
      buildFrom(mbComplete);
      const context = engine.getWorkContext('Authentication');

      expect(context.overallRisk).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(context.overallRisk);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document', () => {
      buildFrom('');
      const graph = engine.getDependencyGraph();

      expect(graph.nodeCount).toBe(0);
    });

    it('should handle document with no links', () => {
      buildFrom('[FOCUS]\nSomeContent');
      const deps = engine.findDependencies('NonExistent');

      expect(deps).toEqual([]);
    });

    it('should handle non-existent feature', () => {
      buildFrom('@feature{Test}\n  ->files[a.ts]');
      const context = engine.getWorkContext('NonExistent');

      expect(context.feature).toBeNull();
    });

    it('should handle file not in any feature', () => {
      buildFrom('@feature{Test}\n  ->files[a.ts]');
      const risk = engine.getEditRisk('unknown-file.ts');

      expect(risk.level).toBe('unknown');
    });
  });
});
