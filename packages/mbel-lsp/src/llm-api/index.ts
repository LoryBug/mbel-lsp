/**
 * TDDAB#14: LLM API Layer
 *
 * Unified API for LLM clients to query MBEL documents.
 * Provides typed request/response interfaces optimized for LLM consumption.
 */
import { MbelParser } from '@mbel/core';
import type { Document, DecisionDeclaration } from '@mbel/core';
import { QueryEngine } from '@mbel/analyzer';
import type {
  GetAnchorRequest,
  GetEditRiskRequest,
  GetImpactAnalysisRequest,
  GetDecisionsRequest,
  GetIntentRequest,
  AnchorResponse,
  CrossRefsResponse,
  EditRiskResponse,
  ImpactAnalysisResponse,
  DecisionResponse,
  IntentResponse,
  WorkContextResponse,
  HeatInfoResponse,
} from './types.js';

export * from './types.js';

/**
 * LLM API - Unified interface for LLM clients
 */
export class LlmApi {
  private readonly parser: MbelParser;
  private readonly engine: QueryEngine;
  private document: Document | null = null;
  private loaded: boolean = false;

  constructor() {
    this.parser = new MbelParser();
    this.engine = new QueryEngine();
  }

  /**
   * Load an MBEL document for querying
   */
  loadDocument(content: string): void {
    if (!content || content.trim() === '') {
      this.document = null;
      this.loaded = false;
      return;
    }

    try {
      const result = this.parser.parse(content);
      this.document = result.document;
      this.engine.buildFromDocument(this.document);
      this.loaded = true;
    } catch {
      this.document = null;
      this.loaded = false;
    }
  }

  /**
   * Check if a document is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Find an anchor by path or type
   */
  getAnchor(request: GetAnchorRequest): AnchorResponse | null {
    if (!this.loaded) return null;

    // Search by type first if specified
    if (request.type) {
      const anchors = this.engine.findAnchorsByType(request.type);
      const anchor = anchors[0];
      if (anchor) {
        return {
          path: anchor.path,
          type: anchor.anchorType,
          description: anchor.description,
          isGlob: anchor.isGlob,
        };
      }
    }

    // Search by path - use flexible matching by iterating all anchor types
    if (request.path) {
      const searchPath = request.path.toLowerCase();
      const types: Array<'entry' | 'hotspot' | 'boundary' | 'test' | 'docs'> = ['entry', 'hotspot', 'boundary', 'test', 'docs'];
      for (const type of types) {
        const anchors = this.engine.findAnchorsByType(type);
        const match = anchors.find(a => {
          const anchorPath = a.path.toLowerCase();
          return anchorPath === searchPath ||
                 anchorPath.endsWith('/' + searchPath) ||
                 searchPath.endsWith('/' + anchorPath) ||
                 anchorPath.includes(searchPath);
        });
        if (match) {
          return {
            path: match.path,
            type: match.anchorType,
            description: match.description,
            isGlob: match.isGlob,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get cross-references for a feature
   */
  getCrossRefs(featureName: string): CrossRefsResponse | null {
    if (!this.loaded || !this.document) return null;

    // Find the feature in the dependency graph
    const graph = this.engine.getDependencyGraph();
    const node = graph.nodes.get(featureName);

    if (!node) return null;

    // Find the LinkDeclaration for more details
    const link = this.document.statements.find(
      s => s.type === 'LinkDeclaration' && s.name === featureName
    );

    if (!link || link.type !== 'LinkDeclaration') return null;

    // Get dependents
    const dependents = this.engine.findDependents(featureName);

    return {
      name: featureName,
      type: link.linkType,
      files: node.files as string[],
      tests: node.tests as string[],
      docs: link.docs?.map(d => d.path) ?? [],
      dependencies: node.dependencies as string[],
      dependents,
      related: link.related ?? [],
      entryPoint: link.entryPoint
        ? {
            file: link.entryPoint.file,
            symbol: link.entryPoint.symbol,
            line: link.entryPoint.line,
          }
        : null,
    };
  }

  /**
   * Get edit risk assessment for a file
   */
  getEditRisk(request: GetEditRiskRequest): EditRiskResponse | null {
    if (!this.loaded) return null;

    const risk = this.engine.getEditRisk(request.file);
    const impact = this.engine.getImpactAnalysis([request.file]);

    return {
      level: risk.level,
      reasons: risk.reasons as string[],
      recommendations: risk.recommendations as string[],
      affectedTests: impact.affectedTests as string[],
    };
  }

  /**
   * Analyze impact of changing files
   */
  getImpactAnalysis(request: GetImpactAnalysisRequest): ImpactAnalysisResponse | null {
    if (!this.loaded) return null;

    const impact = this.engine.getImpactAnalysis([...request.files]);

    return {
      affectedFeatures: impact.affectedFeatures as string[],
      affectedTests: impact.affectedTests as string[],
      affectedFiles: impact.affectedFiles as string[],
      transitiveImpact: impact.transitiveImpact as string[],
    };
  }

  /**
   * Find decisions matching criteria
   */
  getDecisions(request: GetDecisionsRequest): DecisionResponse[] {
    const doc = this.document;
    if (!this.loaded || !doc) return [];

    let decisions: ReturnType<typeof this.engine.findDecisions> = [];

    if (request.pattern) {
      decisions = this.engine.findDecisions(request.pattern);
    } else if (request.status) {
      decisions = this.engine.findDecisionsByStatus(request.status);
    } else if (request.contextFile) {
      decisions = this.engine.findDecisionsByContext(request.contextFile);
    } else {
      // Get all decisions if no criteria specified
      decisions = this.engine.findDecisions('');
    }

    // Get full decision data from document
    return decisions.map(d => {
      const fullDecision = doc.statements.find(
        s => s.type === 'DecisionDeclaration' && s.name === d.name
      ) as DecisionDeclaration | undefined;

      return {
        name: d.name,
        date: d.date,
        status: d.status,
        reason: d.reason,
        alternatives: fullDecision?.alternatives ?? [],
        context: d.context as string[],
      };
    });
  }

  /**
   * Get intent for a module/component
   */
  getIntent(request: GetIntentRequest): IntentResponse | null {
    if (!this.loaded) return null;

    const intent = this.engine.findIntent(request.module, request.component);
    if (!intent) return null;

    return {
      module: intent.module,
      component: intent.component,
      does: intent.does,
      doesNot: intent.doesNot,
      contract: intent.contract,
      singleResponsibility: intent.singleResponsibility,
      antiPattern: intent.antiPattern,
      extends: intent.extends ? [...intent.extends] : null,
    };
  }

  /**
   * Get all intents for a module
   */
  getIntentsByModule(moduleName: string): IntentResponse[] {
    if (!this.loaded) return [];

    const intents = this.engine.findIntentsByModule(moduleName);

    return intents.map(i => ({
      module: i.module,
      component: i.component,
      does: i.does,
      doesNot: i.doesNot,
      contract: i.contract,
      singleResponsibility: i.singleResponsibility,
      antiPattern: i.antiPattern,
      extends: i.extends ? [...i.extends] : null,
    }));
  }

  /**
   * Get complete work context for a feature
   */
  getWorkContext(featureName: string): WorkContextResponse | null {
    const doc = this.document;
    if (!this.loaded || !doc) return null;

    const context = this.engine.getWorkContext(featureName);

    // Convert heat info
    const heatInfo: HeatInfoResponse[] = context.heatInfo.map(h => ({
      path: h.path,
      type: h.type,
      changes: h.changes,
      coverage: h.coverage,
      confidence: h.confidence,
      caution: h.caution,
    }));

    // Convert decisions
    const decisions: DecisionResponse[] = context.decisions.map(d => {
      const fullDecision = doc.statements.find(
        s => s.type === 'DecisionDeclaration' && s.name === d.name
      ) as DecisionDeclaration | undefined;

      return {
        name: d.name,
        date: d.date,
        status: d.status,
        reason: d.reason,
        alternatives: fullDecision?.alternatives ?? [],
        context: d.context as string[],
      };
    });

    // Convert anchors
    const anchors: AnchorResponse[] = context.anchors.map(a => ({
      path: a.path,
      type: a.anchorType,
      description: a.description,
      isGlob: a.isGlob,
    }));

    // Convert intents
    const intents: IntentResponse[] = context.intents.map(i => ({
      module: i.module,
      component: i.component,
      does: i.does,
      doesNot: i.doesNot,
      contract: i.contract,
      singleResponsibility: i.singleResponsibility,
      antiPattern: i.antiPattern,
      extends: i.extends ? [...i.extends] : null,
    }));

    return {
      feature: context.feature,
      files: context.files as string[],
      tests: context.tests as string[],
      blueprint: context.blueprint ? [...context.blueprint] : null,
      decisions,
      anchors,
      heatInfo,
      intents,
      dependencies: context.dependencies as string[],
      dependents: context.dependents as string[],
      overallRisk: context.overallRisk,
    };
  }

  /**
   * Get all feature names
   */
  getAllFeatures(): string[] {
    if (!this.loaded) return [];

    const graph = this.engine.getDependencyGraph();
    return [...graph.nodes.keys()];
  }

  /**
   * Get all anchors
   */
  getAllAnchors(): AnchorResponse[] {
    if (!this.loaded) return [];

    const types: Array<'entry' | 'hotspot' | 'boundary' | 'test' | 'docs'> = ['entry', 'hotspot', 'boundary', 'test', 'docs'];
    const anchors: AnchorResponse[] = [];

    for (const type of types) {
      const found = this.engine.findAnchorsByType(type);
      for (const anchor of found) {
        anchors.push({
          path: anchor.path,
          type: anchor.anchorType,
          description: anchor.description,
          isGlob: anchor.isGlob,
        });
      }
    }

    return anchors;
  }

  /**
   * Get all decisions
   */
  getAllDecisions(): DecisionResponse[] {
    if (!this.loaded || !this.document) return [];

    // Get all decisions from document
    const decisions = this.document.statements.filter(
      s => s.type === 'DecisionDeclaration'
    ) as DecisionDeclaration[];

    return decisions.map(d => ({
      name: d.name,
      date: d.date,
      status: d.status,
      reason: d.reason,
      alternatives: d.alternatives ?? [],
      context: d.context ?? [],
    }));
  }
}
