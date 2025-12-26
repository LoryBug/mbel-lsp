---
description: Show pending items from Memory Bank
---

Show me all pending/planned items from the Memory Bank:

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

console.log('=== PENDING ITEMS (?) ===');
files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const items = server.getPendingItems(uri);
  if (items.length) {
    console.log(file + ':');
    items.forEach(i => console.log('  L' + i.line + ': ' + i.text));
  }
});
"`

List all pending items and suggest which one to work on next. $ARGUMENTS
