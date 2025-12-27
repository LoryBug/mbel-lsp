#!/usr/bin/env node
/**
 * MBEL Memory Bank Query Script
 *
 * Usage: node query-mb.mjs <command> [args]
 *
 * Commands:
 *   features              List all features
 *   feature <name>        Get feature details
 *   file <path>           Find features using a file
 *   entries               List all entry points
 *   anchors               List all anchors
 *   anchors-type <type>   Filter anchors by type (entry/hotspot/boundary)
 *   deps <name>           Show dependency tree
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Find project root (where package.json is)
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..', '..', '..');

// Import QueryService (use pathToFileURL for Windows compatibility)
const queryServicePath = join(projectRoot, 'packages/mbel-lsp/dist/query-service.js');
const { QueryService } = await import(pathToFileURL(queryServicePath).href);

const MB_PATH = join(projectRoot, 'memory-bank');
const SYSTEM_PATTERNS = join(MB_PATH, 'systemPatterns.mbel.md');

// Check if systemPatterns exists
if (!existsSync(SYSTEM_PATTERNS)) {
  console.error('Error: systemPatterns.mbel.md not found');
  console.error('Expected at:', SYSTEM_PATTERNS);
  process.exit(1);
}

const qs = new QueryService();
const content = readFileSync(SYSTEM_PATTERNS, 'utf-8');

const [,, command, ...args] = process.argv;

function printJSON(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function printFeature(f) {
  console.log(`\n[${f.type.toUpperCase()}] ${f.name}`);
  if (f.files.length) console.log(`  files: ${f.files.join(', ')}`);
  if (f.tests.length) console.log(`  tests: ${f.tests.join(', ')}`);
  if (f.docs.length) console.log(`  docs: ${f.docs.join(', ')}`);
  if (f.depends.length) console.log(`  depends: ${f.depends.join(', ')}`);
  if (f.related.length) console.log(`  related: ${f.related.join(', ')}`);
  if (f.entryPoint) {
    console.log(`  entryPoint: ${f.entryPoint.file}::${f.entryPoint.symbol || ''}${f.entryPoint.line ? ':' + f.entryPoint.line : ''}`);
  }
}

function printDeps(name, visited = new Set(), indent = 0) {
  if (visited.has(name)) {
    console.log('  '.repeat(indent) + `${name} (circular)`);
    return;
  }
  visited.add(name);

  const feature = qs.getFeatureFiles(content, name);
  if (!feature) {
    console.log('  '.repeat(indent) + `${name} (not found)`);
    return;
  }

  const prefix = indent === 0 ? '' : '└─ ';
  console.log('  '.repeat(indent) + `${prefix}${name}`);

  for (const dep of feature.depends) {
    printDeps(dep, visited, indent + 1);
  }
}

switch (command) {
  case 'features': {
    const features = qs.getAllFeatures(content);
    console.log(`Found ${features.length} features:\n`);
    for (const f of features) {
      printFeature(f);
    }
    break;
  }

  case 'feature': {
    const name = args[0];
    if (!name) {
      console.error('Usage: query-mb.mjs feature <name>');
      process.exit(1);
    }
    const feature = qs.getFeatureFiles(content, name);
    if (feature) {
      printJSON(feature);
    } else {
      console.error(`Feature "${name}" not found`);
      const all = qs.getAllFeatures(content);
      console.log('Available features:', all.map(f => f.name).join(', '));
      process.exit(1);
    }
    break;
  }

  case 'file': {
    const path = args[0];
    if (!path) {
      console.error('Usage: query-mb.mjs file <path>');
      process.exit(1);
    }
    const features = qs.getFileFeatures(content, path);
    if (features.length) {
      console.log(`File "${path}" is used by:\n`);
      for (const f of features) {
        console.log(`  [${f.type}] ${f.name} (${f.relation})`);
      }
    } else {
      console.log(`File "${path}" not found in any feature`);
    }
    break;
  }

  case 'entries': {
    const entries = qs.getEntryPoints(content);
    console.log(`Found ${entries.size} entry points:\n`);
    for (const [name, ep] of entries) {
      console.log(`  ${name}: ${ep.file}::${ep.symbol || ''}${ep.line ? ':' + ep.line : ''}`);
    }
    break;
  }

  case 'anchors': {
    const anchors = qs.getAnchors(content);
    console.log(`Found ${anchors.length} anchors:\n`);
    for (const a of anchors) {
      console.log(`  [${a.type}] ${a.path}`);
      if (a.description) console.log(`      "${a.description}"`);
    }
    break;
  }

  case 'anchors-type': {
    const type = args[0];
    if (!type || !['entry', 'hotspot', 'boundary'].includes(type)) {
      console.error('Usage: query-mb.mjs anchors-type <entry|hotspot|boundary>');
      process.exit(1);
    }
    const anchors = qs.getAnchorsByType(content, type);
    console.log(`Found ${anchors.length} ${type} anchors:\n`);
    for (const a of anchors) {
      console.log(`  ${a.path}`);
      if (a.description) console.log(`    "${a.description}"`);
    }
    break;
  }

  case 'deps': {
    const name = args[0];
    if (!name) {
      console.error('Usage: query-mb.mjs deps <name>');
      process.exit(1);
    }
    console.log(`Dependency tree for "${name}":\n`);
    printDeps(name);
    break;
  }

  default: {
    console.log(`MBEL Memory Bank Query Tool

Usage: node query-mb.mjs <command> [args]

Commands:
  features              List all features with their files
  feature <name>        Get details for a specific feature
  file <path>           Find which features use a file
  entries               List all entry points
  anchors               List all semantic anchors
  anchors-type <type>   Filter anchors (entry/hotspot/boundary)
  deps <name>           Show dependency tree for a feature

Examples:
  node query-mb.mjs features
  node query-mb.mjs feature Parser
  node query-mb.mjs file lexer.ts
  node query-mb.mjs anchors-type hotspot
  node query-mb.mjs deps LSPServer
`);
    break;
  }
}
