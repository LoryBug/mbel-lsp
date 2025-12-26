---
description: Query Memory Bank status using MBEL LSP
---

Read and analyze the Memory Bank files to understand the current project state.

Here is the current Memory Bank status from the MBEL LSP server:

!`node -e "
const { MbelServer } = require('./packages/mbel-lsp/dist/server.js');
const fs = require('fs');
const path = require('path');

const server = new MbelServer();
const mbDir = './memory-bank';
const files = fs.readdirSync(mbDir).filter(f => f.endsWith('.mbel.md'));

files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const content = fs.readFileSync(path.join(mbDir, file), 'utf8');
  server.onDidOpenTextDocument(uri, 1, content);
});

console.log('=== PROJECT STATUS ===');
let total = { pending: 0, completed: 0, failed: 0, critical: 0, active: 0, recent: 0 };
files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const s = server.getProjectStatus(uri);
  console.log(file + ': pending=' + s.pending + ', completed=' + s.completed + ', failed=' + s.failed + ', critical=' + s.critical + ', active=' + s.active + ', recent=' + s.recentChanges);
  total.pending += s.pending;
  total.completed += s.completed;
  total.failed += s.failed;
  total.critical += s.critical;
  total.active += s.active;
  total.recent += s.recentChanges;
});
console.log('TOTAL: pending=' + total.pending + ', completed=' + total.completed + ', failed=' + total.failed + ', critical=' + total.critical + ', active=' + total.active + ', recent=' + total.recent);

console.log('');
console.log('=== PENDING ITEMS (?) ===');
files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const items = server.getPendingItems(uri);
  if (items.length) {
    console.log(file + ':');
    items.forEach(i => console.log('  - ' + i.text));
  }
});

console.log('');
console.log('=== RECENT CHANGES (>) ===');
files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const items = server.getRecentChanges(uri);
  if (items.length) {
    console.log(file + ':');
    items.forEach(i => console.log('  - ' + i.text));
  }
});
"`

Based on this Memory Bank data, provide a summary of:
1. Current project status
2. What's pending/planned
3. Recent changes
4. Any blockers or critical items

$ARGUMENTS
