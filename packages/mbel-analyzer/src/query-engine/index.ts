/**
 * TDDAB#15: QueryEngine - Semantic Navigation Engine
 *
 * Provides modular query capabilities for MBEL documents:
 * - DependencyGraph: Dependency relationship analysis
 * - SemanticSearch: Finding anchors, decisions, intents
 * - ImpactAnalyzer: Risk assessment and impact analysis
 * - WorkContext: Composite context building for LLMs
 */
import type { Document, LinkDeclaration, AnchorDeclaration, DecisionDeclaration, IntentDeclaration, HeatDeclaration } from '@mbel/core';
import type {
  DependencyGraph,
  DependencyNode,
  AnchorResult,
  DecisionResult,
  IntentResult,
  HeatInfo,
  RiskAssessment,
  ImpactResult,
  SemanticSearchResult,
  WorkContext,
} from './types.js';

export * from './types.js';

/**
 * QueryEngine - Unified semantic query interface
 */
export class QueryEngine {
  private document: Document | null = null;
  private links: LinkDeclaration[] = [];
  private anchors: AnchorDeclaration[] = [];
  private decisions: DecisionDeclaration[] = [];
  private intents: IntentDeclaration[] = [];
  private heats: HeatDeclaration[] = [];
  private _dependencyGraph: DependencyGraph | null = null;

  /**
   * Build the query engine from a parsed MBEL document
   */
  buildFromDocument(document: Document): void {
    this.document = document;
    this.extractStatements();
    this.buildDependencyGraphInternal();
  }

  // =========================================
  // Dependency Graph Methods
  // =========================================

  /**
   * Get the dependency graph
   */
  getDependencyGraph(): DependencyGraph {
    if (!this._dependencyGraph) {
      return { nodeCount: 0, nodes: new Map() };
    }
    return this._dependencyGraph;
  }

  /**
   * Find features that depend on the given feature
   */
  findDependents(featureName: string): string[] {
    const node = this._dependencyGraph?.nodes.get(featureName);
    if (!node) return [];
    return [...node.dependents];
  }

  /**
   * Find features that the given feature depends on
   */
  findDependencies(featureName: string): string[] {
    const node = this._dependencyGraph?.nodes.get(featureName);
    if (!node) return [];
    return [...node.dependencies];
  }

  /**
   * Detect circular dependencies in the graph
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);

      const deps = this.findDependencies(node);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep, [...path, dep]);
        } else if (recursionStack.has(dep)) {
          // Found cycle
          const cycleStart = path.indexOf(dep);
          if (cycleStart >= 0) {
            cycles.push(path.slice(cycleStart));
          } else {
            cycles.push([...path, dep]);
          }
        }
      }

      recursionStack.delete(node);
    };

    if (this._dependencyGraph) {
      for (const nodeName of this._dependencyGraph.nodes.keys()) {
        if (!visited.has(nodeName)) {
          dfs(nodeName, [nodeName]);
        }
      }
    }

    return cycles;
  }

  /**
   * Get all transitive dependencies
   */
  getTransitiveDependencies(featureName: string): string[] {
    const result = new Set<string>();
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const deps = this.findDependencies(name);
      for (const dep of deps) {
        result.add(dep);
        traverse(dep);
      }
    };

    traverse(featureName);
    return [...result];
  }

  /**
   * Get files associated with a feature
   */
  getFeatureFiles(featureName: string): string[] {
    const node = this._dependencyGraph?.nodes.get(featureName);
    if (!node) return [];
    return [...node.files];
  }

  // =========================================
  // Semantic Search Methods
  // =========================================

  /**
   * Find anchors by concept/keyword
   */
  findAnchor(concept: string): AnchorResult[] {
    const lowerConcept = concept.toLowerCase();
    return this.anchors
      .filter(a =>
        a.anchorType.toLowerCase().includes(lowerConcept) ||
        a.path.toLowerCase().includes(lowerConcept) ||
        (a.description?.toLowerCase().includes(lowerConcept) ?? false)
      )
      .map(a => this.toAnchorResult(a));
  }

  /**
   * Find anchors by type
   */
  findAnchorsByType(anchorType: 'entry' | 'hotspot' | 'boundary' | 'test' | 'docs'): AnchorResult[] {
    return this.anchors
      .filter(a => a.anchorType === anchorType)
      .map(a => this.toAnchorResult(a));
  }

  /**
   * Find decisions by pattern/keyword
   */
  findDecisions(pattern: string): DecisionResult[] {
    const lowerPattern = pattern.toLowerCase();
    return this.decisions
      .filter(d =>
        d.name.toLowerCase().includes(lowerPattern) ||
        (d.reason?.toLowerCase().includes(lowerPattern) ?? false)
      )
      .map(d => this.toDecisionResult(d));
  }

  /**
   * Find decisions that affect a specific file
   */
  findDecisionsByContext(filePath: string): DecisionResult[] {
    const normalizedPath = this.normalizePath(filePath);
    return this.decisions
      .filter(d => {
        if (!d.context || d.context.length === 0) return false;
        return d.context.some(ctx => this.pathMatchesPattern(normalizedPath, ctx));
      })
      .map(d => this.toDecisionResult(d));
  }

  /**
   * Find decisions by status
   */
  findDecisionsByStatus(status: 'ACTIVE' | 'SUPERSEDED' | 'RECONSIDERING'): DecisionResult[] {
    return this.decisions
      .filter(d => d.status === status)
      .map(d => this.toDecisionResult(d));
  }

  /**
   * Find intents by module name
   */
  findIntentsByModule(moduleName: string): IntentResult[] {
    return this.intents
      .filter(i => i.module === moduleName)
      .map(i => this.toIntentResult(i));
  }

  /**
   * Find a specific intent by module and component
   */
  findIntent(moduleName: string, componentName: string): IntentResult | null {
    const intent = this.intents.find(
      i => i.module === moduleName && i.component === componentName
    );
    return intent ? this.toIntentResult(intent) : null;
  }

  /**
   * Search across all semantic elements
   */
  semanticSearch(query: string): SemanticSearchResult {
    return {
      anchors: this.findAnchor(query),
      decisions: this.findDecisions(query),
      intents: this.intents
        .filter(i =>
          i.module.toLowerCase().includes(query.toLowerCase()) ||
          i.component.toLowerCase().includes(query.toLowerCase())
        )
        .map(i => this.toIntentResult(i)),
      links: this.links
        .filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
        .map(l => l.name),
    };
  }

  // =========================================
  // Impact Analysis Methods
  // =========================================

  /**
   * Calculate edit risk for a file
   */
  getEditRisk(filePath: string): RiskAssessment {
    const normalizedPath = this.normalizePath(filePath);
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Check heat level
    const heat = this.findHeatForFile(normalizedPath);
    if (heat) {
      if (heat.heatType === 'critical') {
        reasons.push('critical heat level');
        recommendations.push('Run full regression tests');
        if (heat.caution) {
          recommendations.push(heat.caution);
        }
      } else if (heat.heatType === 'volatile' || heat.heatType === 'hot') {
        reasons.push(`${heat.heatType} heat level`);
        recommendations.push('Review recent changes before modifying');
      }
    }

    // Check if in hotspot
    const isHotspot = this.anchors.some(a =>
      a.anchorType === 'hotspot' && this.pathMatchesPattern(normalizedPath, a.path)
    );
    if (isHotspot) {
      reasons.push('hotspot area');
      recommendations.push('Extra code review recommended');
    }

    // Check dependencies
    const affectedFeatures = this.findFeaturesForFile(normalizedPath);
    if (affectedFeatures.length > 0) {
      const allDependents = new Set<string>();
      for (const feature of affectedFeatures) {
        const dependents = this.findDependents(feature);
        dependents.forEach(d => allDependents.add(d));
      }
      if (allDependents.size > 2) {
        reasons.push(`affects ${allDependents.size} dependent features`);
        recommendations.push('Consider impact on dependent features');
      }
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'unknown' = 'low';
    if (heat === null && affectedFeatures.length === 0 && !isHotspot) {
      level = 'unknown';
    } else if (reasons.some(r => r.includes('critical') || r.includes('hotspot'))) {
      level = 'high';
    } else if (reasons.length > 0) {
      level = 'medium';
    }

    if (recommendations.length === 0 && level !== 'unknown') {
      recommendations.push('Standard review process');
    }

    return { level, reasons, recommendations };
  }

  /**
   * Analyze impact of changing files
   */
  getImpactAnalysis(files: string[]): ImpactResult {
    const affectedFiles = new Set<string>();
    const affectedTests = new Set<string>();
    const affectedFeatures = new Set<string>();
    const transitiveImpact = new Set<string>();

    for (const file of files) {
      const normalizedPath = this.normalizePath(file);

      // Find features containing this file
      const features = this.findFeaturesForFile(normalizedPath);
      features.forEach(f => affectedFeatures.add(f));

      // Find dependent files from heat declarations
      const heat = this.findHeatForFile(normalizedPath);
      if (heat?.dependents) {
        heat.dependents.forEach(d => affectedFiles.add(d));
      }

      // Find transitive dependents
      for (const feature of features) {
        const dependents = this.findDependents(feature);
        dependents.forEach(d => {
          affectedFeatures.add(d);
          transitiveImpact.add(d);
        });

        // Collect tests
        const node = this._dependencyGraph?.nodes.get(feature);
        if (node?.tests) {
          node.tests.forEach(t => affectedTests.add(t));
        }
      }
    }

    return {
      affectedFiles: [...affectedFiles],
      affectedTests: [...affectedTests],
      affectedFeatures: [...affectedFeatures],
      transitiveImpact: [...transitiveImpact],
    };
  }

  // =========================================
  // Work Context Methods
  // =========================================

  /**
   * Get complete work context for a feature
   */
  getWorkContext(featureName: string): WorkContext {
    const link = this.links.find(l => l.name === featureName);
    if (!link) {
      return {
        feature: null,
        files: [],
        tests: [],
        blueprint: null,
        decisions: [],
        anchors: [],
        heatInfo: [],
        intents: [],
        dependencies: [],
        dependents: [],
        overallRisk: 'low',
      };
    }

    const files = link.files?.map(f => f.path) ?? [];
    const tests = link.tests?.map(t => t.path) ?? [];
    const blueprint = link.blueprint ?? null;
    const dependencies = link.depends ?? [];
    const dependents = this.findDependents(featureName);

    // Find related decisions
    const relatedDecisions = this.decisions
      .filter(d => {
        if (!d.context || d.context.length === 0) return false;
        const ctx = d.context;
        return files.some(file =>
          ctx.some(c => this.pathMatchesPattern(file, c))
        );
      })
      .map(d => this.toDecisionResult(d));

    // Find related anchors
    const relatedAnchors = this.anchors
      .filter(a =>
        files.some(file => this.pathMatchesPattern(file, a.path))
      )
      .map(a => this.toAnchorResult(a));

    // Find heat info for files
    const heatInfo: HeatInfo[] = [];
    for (const file of files) {
      const heat = this.findHeatForFile(file);
      if (heat) {
        heatInfo.push(this.toHeatInfo(heat));
      }
    }

    // Find related intents (by convention: module names might match feature patterns)
    const relatedIntents = this.intents
      .filter(i =>
        featureName.toLowerCase().includes(i.module.toLowerCase()) ||
        i.module.toLowerCase().includes(featureName.toLowerCase())
      )
      .map(i => this.toIntentResult(i));

    // Calculate overall risk
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (heatInfo.some(h => h.type === 'critical')) {
      overallRisk = 'high';
    } else if (heatInfo.some(h => h.type === 'volatile' || h.type === 'hot')) {
      overallRisk = 'medium';
    } else if (relatedAnchors.some(a => a.anchorType === 'hotspot')) {
      overallRisk = 'medium';
    }

    return {
      feature: featureName,
      files,
      tests,
      blueprint,
      decisions: relatedDecisions,
      anchors: relatedAnchors,
      heatInfo,
      intents: relatedIntents,
      dependencies: [...dependencies],
      dependents,
      overallRisk,
    };
  }

  // =========================================
  // Private Methods
  // =========================================

  private extractStatements(): void {
    if (!this.document) return;

    this.links = [];
    this.anchors = [];
    this.decisions = [];
    this.intents = [];
    this.heats = [];

    for (const stmt of this.document.statements) {
      switch (stmt.type) {
        case 'LinkDeclaration':
          this.links.push(stmt as LinkDeclaration);
          break;
        case 'AnchorDeclaration':
          this.anchors.push(stmt as AnchorDeclaration);
          break;
        case 'DecisionDeclaration':
          this.decisions.push(stmt as DecisionDeclaration);
          break;
        case 'IntentDeclaration':
          this.intents.push(stmt as IntentDeclaration);
          break;
        case 'HeatDeclaration':
          this.heats.push(stmt as HeatDeclaration);
          break;
      }
    }
  }

  private buildDependencyGraphInternal(): void {
    const nodes = new Map<string, DependencyNode>();

    for (const link of this.links) {
      const node: DependencyNode = {
        name: link.name,
        dependencies: link.depends ?? [],
        dependents: [],
        files: link.files?.map(f => f.path) ?? [],
        tests: link.tests?.map(t => t.path) ?? [],
      };
      nodes.set(link.name, node);
    }

    // Build dependents (need mutable version temporarily)
    const mutableNodes = new Map<string, { name: string; dependencies: readonly string[]; dependents: string[]; files: readonly string[]; tests: readonly string[] }>();
    for (const [key, node] of nodes) {
      mutableNodes.set(key, { ...node, dependents: [] });
    }

    for (const link of this.links) {
      if (link.depends) {
        for (const dep of link.depends) {
          const depNode = mutableNodes.get(dep);
          if (depNode) {
            depNode.dependents.push(link.name);
          }
        }
      }
    }

    // Convert back to readonly
    const finalNodes = new Map<string, DependencyNode>();
    for (const [key, node] of mutableNodes) {
      finalNodes.set(key, node as DependencyNode);
    }

    this._dependencyGraph = {
      nodeCount: finalNodes.size,
      nodes: finalNodes,
    };
  }

  private toAnchorResult(anchor: AnchorDeclaration): AnchorResult {
    return {
      path: anchor.path,
      anchorType: anchor.anchorType,
      description: anchor.description,
      isGlob: anchor.isGlob,
    };
  }

  private toDecisionResult(decision: DecisionDeclaration): DecisionResult {
    return {
      name: decision.name,
      date: decision.date,
      status: decision.status,
      reason: decision.reason,
      context: decision.context ?? [],
    };
  }

  private toIntentResult(intent: IntentDeclaration): IntentResult {
    return {
      module: intent.module,
      component: intent.component,
      does: intent.does,
      doesNot: intent.doesNot,
      contract: intent.contract,
      singleResponsibility: intent.singleResponsibility,
      antiPattern: intent.antiPattern,
      extends: intent.extends,
    };
  }

  private toHeatInfo(heat: HeatDeclaration): HeatInfo {
    return {
      path: heat.path,
      type: heat.heatType,
      changes: heat.changes,
      coverage: heat.coverage,
      confidence: heat.confidence,
      caution: heat.caution,
    };
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase();
  }

  private pathMatchesPattern(filePath: string, pattern: string): boolean {
    const normalizedFile = this.normalizePath(filePath);
    const normalizedPattern = this.normalizePath(pattern);

    // Handle glob patterns
    if (normalizedPattern.includes('*')) {
      const regexPattern = normalizedPattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(normalizedFile);
    }

    return normalizedFile.includes(normalizedPattern) || normalizedPattern.includes(normalizedFile);
  }

  private findHeatForFile(filePath: string): HeatDeclaration | null {
    const normalizedPath = this.normalizePath(filePath);
    return this.heats.find(h => this.pathMatchesPattern(normalizedPath, h.path)) ?? null;
  }

  private findFeaturesForFile(filePath: string): string[] {
    const normalizedPath = this.normalizePath(filePath);
    return this.links
      .filter(link =>
        link.files?.some(f => this.pathMatchesPattern(normalizedPath, f.path)) ?? false
      )
      .map(link => link.name);
  }
}
