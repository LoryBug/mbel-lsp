---
description: Show recent changes from Memory Bank
---

Show me all recent changes from the Memory Bank:

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

console.log('=== RECENT CHANGES (>) ===');
files.forEach(file => {
  const uri = 'file:///' + path.resolve(mbDir, file).split(path.sep).join('/');
  const items = server.getRecentChanges(uri);
  if (items.length) {
    console.log(file + ':');
    items.forEach(i => console.log('  L' + i.line + ': ' + i.text));
  }
});
"`

Summarize the recent changes. $ARGUMENTS
