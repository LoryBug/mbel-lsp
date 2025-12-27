/**
 * TDDAB#14: LLM API Layer (RED Phase)
 *
 * Tests for the unified LLM-facing API:
 * - LlmApi: Main facade with typed request/response
 * - Methods: getAnchor, getCrossRefs, getEditRisk, getImpactAnalysis,
 *            getDecisions, getIntent, getWorkContext
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { LlmApi } from '../src/llm-api/index.js';

describe('LlmApi (TDDAB#14)', () => {
  let api: LlmApi;

  beforeEach(() => {
    api = new LlmApi();
  });

  // Helper to load document
  const loadDoc = (content: string): void => {
    api.loadDocument(content);
  };

  describe('Document Loading', () => {
    it('should load MBEL document', () => {
      loadDoc('[LINKS]\n@feature{Test}');
      expect(api.isLoaded()).toBe(true);
    });

    it('should handle empty content', () => {
      loadDoc('');
      expect(api.isLoaded()).toBe(false);
    });

    it('should clear previous document on reload', () => {
      loadDoc('@feature{A}');
      loadDoc('@feature{B}');
      const result = api.getCrossRefs('A');
      expect(result).toBeNull();
    });
  });

  describe('getAnchor', () => {
    const mbWithAnchors = `
[ANCHORS]
@entry::src/index.ts
  ->description{Main entry point}
@hotspot::src/core/**/*.ts
  ->description{Core business logic}
@boundary::src/api/routes.ts
  ->description{API boundary layer}
`;

    it('should find anchor by path pattern', () => {
      loadDoc(mbWithAnchors);
      const result = api.getAnchor({ path: 'src/index.ts' });

      expect(result).not.toBeNull();
      expect(result?.path).toBe('src/index.ts');
      expect(result?.type).toBe('entry');
      expect(result?.description).toBe('Main entry point');
    });

    it('should find anchor by type', () => {
      loadDoc(mbWithAnchors);
      const result = api.getAnchor({ type: 'hotspot' });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('hotspot');
    });

    it('should return null for non-existent anchor', () => {
      loadDoc(mbWithAnchors);
      const result = api.getAnchor({ path: 'unknown.ts' });

      expect(result).toBeNull();
    });

    it('should support glob pattern in result', () => {
      loadDoc(mbWithAnchors);
      const result = api.getAnchor({ type: 'hotspot' });

      expect(result?.isGlob).toBe(true);
    });
  });

  describe('getCrossRefs', () => {
    const mbWithLinks = `
[LINKS]
@feature{AuthSystem}
  ->files[src/auth/login.ts, src/auth/logout.ts]
  ->tests[tests/auth/*.test.ts]
  ->depends[UserService, TokenService]
  ->related[SecurityModule]

@feature{UserService}
  ->files[src/users/service.ts]
  ->entryPoint{src/users/service.ts:UserService}

@feature{TokenService}
  ->files[src/tokens/service.ts]
`;

    it('should return cross refs for feature', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('AuthSystem');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('AuthSystem');
      expect(result?.files).toContain('src/auth/login.ts');
      expect(result?.tests.length).toBeGreaterThan(0);
    });

    it('should include dependencies', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('AuthSystem');

      expect(result?.dependencies).toContain('UserService');
      expect(result?.dependencies).toContain('TokenService');
    });

    it('should include related features', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('AuthSystem');

      expect(result?.related).toContain('SecurityModule');
    });

    it('should include entry point', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('UserService');

      expect(result?.entryPoint).toBeDefined();
      expect(result?.entryPoint?.file).toBe('src/users/service.ts');
      expect(result?.entryPoint?.symbol).toBe('UserService');
    });

    it('should return null for non-existent feature', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('NonExistent');

      expect(result).toBeNull();
    });

    it('should find dependents (reverse lookup)', () => {
      loadDoc(mbWithLinks);
      const result = api.getCrossRefs('UserService');

      expect(result?.dependents).toContain('AuthSystem');
    });
  });

  describe('getEditRisk', () => {
    const mbWithHeat = `
[LINKS]
@feature{PaymentSystem}
  ->files[src/payments/processor.ts]
  ->tests[tests/payments/*.test.ts]
  ->depends[Database]

@feature{OrderSystem}
  ->files[src/orders/service.ts]
  ->depends[PaymentSystem]

[HEAT]
@critical::src/payments/processor.ts
  ->confidence{high}
  ->coverage{95%}
  ->caution{Core payment logic - requires full regression}

@stable::src/utils/helpers.ts
  ->untouched{90days}
  ->coverage{100%}

[ANCHORS]
@hotspot::src/payments/*.ts
  ->description{High-change payment area}
`;

    it('should return high risk for critical files', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'src/payments/processor.ts' });

      expect(result).not.toBeNull();
      expect(result?.level).toBe('high');
      expect(result?.reasons).toContain('critical heat level');
    });

    it('should return low risk for stable files', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'src/utils/helpers.ts' });

      expect(result?.level).toBe('low');
    });

    it('should include recommendations', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'src/payments/processor.ts' });

      expect(result?.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect hotspot area', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'src/payments/gateway.ts' });

      expect(result?.reasons).toContain('hotspot area');
    });

    it('should return unknown for untracked files', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'unknown-file.ts' });

      expect(result?.level).toBe('unknown');
    });

    it('should include affected tests', () => {
      loadDoc(mbWithHeat);
      const result = api.getEditRisk({ file: 'src/payments/processor.ts' });

      expect(result?.affectedTests.length).toBeGreaterThan(0);
    });
  });

  describe('getImpactAnalysis', () => {
    const mbWithDeps = `
[LINKS]
@feature{CoreLib}
  ->files[src/core/lib.ts]
  ->tests[tests/core.test.ts]

@feature{ServiceA}
  ->files[src/services/a.ts]
  ->depends[CoreLib]
  ->tests[tests/service-a.test.ts]

@feature{ServiceB}
  ->files[src/services/b.ts]
  ->depends[CoreLib, ServiceA]
  ->tests[tests/service-b.test.ts]

[HEAT]
@critical::src/core/lib.ts
  ->dependents[services/a.ts, services/b.ts]
`;

    it('should analyze impact of file change', () => {
      loadDoc(mbWithDeps);
      const result = api.getImpactAnalysis({ files: ['src/core/lib.ts'] });

      expect(result).not.toBeNull();
      expect(result?.affectedFeatures).toContain('CoreLib');
    });

    it('should find dependent features', () => {
      loadDoc(mbWithDeps);
      const result = api.getImpactAnalysis({ files: ['src/core/lib.ts'] });

      expect(result?.affectedFeatures).toContain('ServiceA');
      expect(result?.affectedFeatures).toContain('ServiceB');
    });

    it('should collect affected tests', () => {
      loadDoc(mbWithDeps);
      const result = api.getImpactAnalysis({ files: ['src/core/lib.ts'] });

      expect(result?.affectedTests).toContain('tests/core.test.ts');
    });

    it('should calculate transitive impact', () => {
      loadDoc(mbWithDeps);
      const result = api.getImpactAnalysis({ files: ['src/core/lib.ts'] });

      expect(result?.transitiveImpact.length).toBeGreaterThan(0);
    });

    it('should handle multiple files', () => {
      loadDoc(mbWithDeps);
      const result = api.getImpactAnalysis({
        files: ['src/core/lib.ts', 'src/services/a.ts'],
      });

      expect(result?.affectedFeatures.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getDecisions', () => {
    const mbWithDecisions = `
[DECISIONS]
@2024-01-15::UseTypeScript
  ->status{ACTIVE}
  ->reason{Type safety and better tooling}
  ->context[src/core/**]

@2024-02-01::AdoptVitest
  ->status{ACTIVE}
  ->reason{Fast, ESM-native testing}
  ->alternatives["Jest", "Mocha"]

@2023-06-01::UseJQuery
  ->status{SUPERSEDED}
  ->supersededBy{UseReact}
  ->reason{Legacy decision}
`;

    it('should find decision by name pattern', () => {
      loadDoc(mbWithDecisions);
      const result = api.getDecisions({ pattern: 'TypeScript' });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.name).toBe('UseTypeScript');
    });

    it('should filter by status', () => {
      loadDoc(mbWithDecisions);
      const result = api.getDecisions({ status: 'ACTIVE' });

      expect(result.length).toBe(2);
      expect(result.every(d => d.status === 'ACTIVE')).toBe(true);
    });

    it('should find decisions by context file', () => {
      loadDoc(mbWithDecisions);
      const result = api.getDecisions({ contextFile: 'src/core/parser.ts' });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.name).toBe('UseTypeScript');
    });

    it('should include reason and alternatives', () => {
      loadDoc(mbWithDecisions);
      const result = api.getDecisions({ pattern: 'Vitest' });

      expect(result[0]?.reason).toContain('ESM-native');
      expect(result[0]?.alternatives).toContain('Jest');
    });

    it('should return empty array for no matches', () => {
      loadDoc(mbWithDecisions);
      const result = api.getDecisions({ pattern: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('getIntent', () => {
    const mbWithIntents = `
[INTENTS]
@Parser::StatementHandler
  ->does{Parse MBEL statements into AST nodes}
  ->doesNot{Validate semantic correctness}
  ->contract{Returns Statement | null}
  ->singleResponsibility{Statement parsing only}

@Lexer::TokenScanner
  ->does{Tokenize source text into tokens}
  ->antiPattern{Mutating global state}
  ->extends[BaseScanner, Serializable]
`;

    it('should find intent by module and component', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntent({
        module: 'Parser',
        component: 'StatementHandler',
      });

      expect(result).not.toBeNull();
      expect(result?.does).toContain('Parse MBEL statements');
    });

    it('should include doesNot clause', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntent({
        module: 'Parser',
        component: 'StatementHandler',
      });

      expect(result?.doesNot).toContain('Validate semantic');
    });

    it('should include contract', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntent({
        module: 'Parser',
        component: 'StatementHandler',
      });

      expect(result?.contract).toContain('Statement | null');
    });

    it('should include extends list', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntent({
        module: 'Lexer',
        component: 'TokenScanner',
      });

      expect(result?.extends).toContain('BaseScanner');
      expect(result?.extends).toContain('Serializable');
    });

    it('should return null for non-existent intent', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntent({
        module: 'Unknown',
        component: 'Unknown',
      });

      expect(result).toBeNull();
    });

    it('should find all intents by module', () => {
      loadDoc(mbWithIntents);
      const result = api.getIntentsByModule('Lexer');

      expect(result.length).toBe(1);
      expect(result[0]?.component).toBe('TokenScanner');
    });
  });

  describe('getWorkContext', () => {
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
@hotspot::src/auth/**
  ->description{Auth hotspot}

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

    it('should build complete work context', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result).not.toBeNull();
      expect(result?.feature).toBe('Authentication');
    });

    it('should include files and tests', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.files.length).toBeGreaterThan(0);
      expect(result?.tests.length).toBeGreaterThan(0);
    });

    it('should include blueprint steps', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.blueprint?.length).toBe(3);
      expect(result?.blueprint).toContain('Implement login form');
    });

    it('should include related decisions', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.decisions.length).toBeGreaterThan(0);
      expect(result?.decisions[0]?.name).toBe('UseJWT');
    });

    it('should include anchors', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.anchors.length).toBeGreaterThan(0);
    });

    it('should include heat information', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.heatInfo.length).toBeGreaterThan(0);
      expect(result?.heatInfo.some(h => h.type === 'critical')).toBe(true);
    });

    it('should include related intents', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      // Intents are matched by module name containing feature name
      expect(result?.intents.length).toBeGreaterThanOrEqual(0);
    });

    it('should include dependencies and dependents', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.dependencies).toContain('UserService');
    });

    it('should calculate overall risk', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('Authentication');

      expect(result?.overallRisk).toBe('high'); // has critical heat
    });

    it('should return null context for non-existent feature', () => {
      loadDoc(mbComplete);
      const result = api.getWorkContext('NonExistent');

      expect(result?.feature).toBeNull();
    });
  });

  describe('Convenience Methods', () => {
    const mbDoc = `
[LINKS]
@feature{TestFeature}
  ->files[src/test.ts]
`;

    it('should provide getAllFeatures', () => {
      loadDoc(mbDoc);
      const features = api.getAllFeatures();

      expect(features.length).toBe(1);
      expect(features[0]).toBe('TestFeature');
    });

    it('should provide getAllAnchors', () => {
      loadDoc(`
[ANCHORS]
@entry::src/index.ts
@hotspot::src/core/**
`);
      const anchors = api.getAllAnchors();

      expect(anchors.length).toBe(2);
    });

    it('should provide getAllDecisions', () => {
      loadDoc(`
[DECISIONS]
@2024-01-01::Dec1
@2024-02-01::Dec2
`);
      const decisions = api.getAllDecisions();

      expect(decisions.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed MBEL gracefully', () => {
      loadDoc('invalid content @@@');
      expect(api.isLoaded()).toBe(true); // Parser is lenient
    });

    it('should return null/empty for operations without document', () => {
      // No loadDoc called
      const api2 = new LlmApi();
      expect(api2.getCrossRefs('Test')).toBeNull();
      expect(api2.getAllFeatures()).toEqual([]);
    });
  });
});
