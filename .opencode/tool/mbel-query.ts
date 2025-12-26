/**
 * MBEL Query Tool - Custom Tool for OpenCode
 *
 * Exposes MBEL LSP LLM Query methods as an OpenCode tool.
 * The LLM can use this tool to semantically query Memory Bank files.
 */

import { z } from "zod";

export default {
  description: `Query MBEL Memory Bank files semantically. 
Available queries:
- "status": Get aggregated project status (pending, completed, failed, critical, active, recent)
- "pending": Get all pending/planned items (marked with ?)
- "completed": Get all completed items (marked with ✓)
- "failed": Get all failed items (marked with ✗)
- "critical": Get all critical items (marked with !)
- "active": Get all active items (marked with @ or ⚡)
- "recent": Get all recent changes (marked with >)
- "all": Get full project overview`,

  args: {
    query: z
      .enum(["status", "pending", "completed", "failed", "critical", "active", "recent", "all"])
      .describe("Type of semantic query to run on Memory Bank files"),
  },

  async execute(args) {
    // Use Bun shell to run the query script
    const queryScript = `
const { MbelServer } = require('./packages/mbel-lsp/dist/server.js');
const fs = require('fs');
const path = require('path');

const server = new MbelServer();
const mbDir = './memory-bank';

if (!fs.existsSync(mbDir)) {
  console.log('No Memory Bank directory found');
  process.exit(0);
}

const files = fs.readdirSync(mbDir).filter(f => f.endsWith('.mbel.md') || f.endsWith('.mbel'));
const uris = [];

files.forEach(file => {
  const filePath = path.join(mbDir, file);
  const uri = 'file:///' + path.resolve(filePath).split(path.sep).join('/');
  const content = fs.readFileSync(filePath, 'utf8');
  server.onDidOpenTextDocument(uri, 1, content);
  uris.push({ uri, file });
});

const query = '${args.query}';
const results = [];

if (query === 'status' || query === 'all') {
  results.push('## Project Status');
  let total = { pending: 0, completed: 0, failed: 0, critical: 0, active: 0, recent: 0 };
  uris.forEach(({ uri, file }) => {
    const s = server.getProjectStatus(uri);
    results.push(file + ': pending=' + s.pending + ', completed=' + s.completed + ', failed=' + s.failed + ', critical=' + s.critical + ', active=' + s.active + ', recent=' + s.recentChanges);
    total.pending += s.pending;
    total.completed += s.completed;
    total.failed += s.failed;
    total.critical += s.critical;
    total.active += s.active;
    total.recent += s.recentChanges;
  });
  results.push('TOTAL: pending=' + total.pending + ', completed=' + total.completed + ', failed=' + total.failed + ', critical=' + total.critical + ', active=' + total.active + ', recent=' + total.recent);
  results.push('');
}

if (query === 'pending' || query === 'all') {
  results.push('## Pending Items (?)');
  uris.forEach(({ uri, file }) => {
    const items = server.getPendingItems(uri);
    if (items.length) {
      results.push(file + ':');
      items.forEach(i => results.push('  - L' + i.line + ': ' + i.text));
    }
  });
  results.push('');
}

if (query === 'completed' || query === 'all') {
  results.push('## Completed Items (✓)');
  uris.forEach(({ uri, file }) => {
    const items = server.getCompletedItems(uri);
    if (items.length) {
      results.push(file + ': ' + items.length + ' completed items');
    }
  });
  results.push('');
}

if (query === 'failed' || query === 'all') {
  results.push('## Failed Items (✗)');
  let found = false;
  uris.forEach(({ uri, file }) => {
    const items = server.getFailedItems(uri);
    if (items.length) {
      found = true;
      results.push(file + ':');
      items.forEach(i => results.push('  - L' + i.line + ': ' + i.text));
    }
  });
  if (!found) results.push('No failed items found.');
  results.push('');
}

if (query === 'critical' || query === 'all') {
  results.push('## Critical Items (!)');
  let found = false;
  uris.forEach(({ uri, file }) => {
    const items = server.getCriticalItems(uri);
    if (items.length) {
      found = true;
      results.push(file + ':');
      items.forEach(i => results.push('  - L' + i.line + ': ' + i.text));
    }
  });
  if (!found) results.push('No critical items found.');
  results.push('');
}

if (query === 'active' || query === 'all') {
  results.push('## Active Items (@/⚡)');
  uris.forEach(({ uri, file }) => {
    const items = server.getActiveItems(uri);
    if (items.length) {
      results.push(file + ':');
      items.forEach(i => results.push('  - L' + i.line + ': ' + i.text));
    }
  });
  results.push('');
}

if (query === 'recent' || query === 'all') {
  results.push('## Recent Changes (>)');
  uris.forEach(({ uri, file }) => {
    const items = server.getRecentChanges(uri);
    if (items.length) {
      results.push(file + ':');
      items.forEach(i => results.push('  - L' + i.line + ': ' + i.text));
    }
  });
}

console.log(results.join('\\n'));
`;

    const result = await Bun.$`node -e ${queryScript}`.text();
    return result.trim();
  },
};
