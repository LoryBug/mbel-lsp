#!/usr/bin/env node
/**
 * MBEL v5 Language Server - Standalone Entry Point
 *
 * Runs the language server over stdio for VSCode integration.
 */

import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { MbelServer } from './server.js';

// Create connection using stdio
const connection = createConnection(ProposedFeatures.all);

// Create document manager
const documents = new TextDocuments(TextDocument);

// Create MBEL server
const server = new MbelServer();

// Initialize
connection.onInitialize((params) => {
  return server.onInitialize(params);
});

connection.onInitialized(() => {
  server.onInitialized();
});

// Document sync
documents.onDidOpen((event) => {
  server.onDidOpenTextDocument(
    event.document.uri,
    event.document.version,
    event.document.getText()
  );
  validateDocument(event.document.uri);
});

documents.onDidChangeContent((event) => {
  server.onDidChangeTextDocument(
    event.document.uri,
    event.document.version,
    event.document.getText()
  );
  validateDocument(event.document.uri);
});

documents.onDidClose((event) => {
  server.onDidCloseTextDocument(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// Validate and send diagnostics
function validateDocument(uri: string): void {
  const diagnostics = server.getDiagnostics(uri);
  connection.sendDiagnostics({ uri, diagnostics: [...diagnostics] });
}

// Features
connection.onHover((params) => {
  return server.getHover(params.textDocument.uri, params.position);
});

connection.onCompletion((params) => {
  return server.getCompletions(params.textDocument.uri, params.position);
});

connection.onDocumentSymbol((params) => {
  return server.getDocumentSymbols(params.textDocument.uri);
});

connection.onDefinition((params) => {
  return server.getDefinition(params.textDocument.uri, params.position);
});

connection.onReferences((params) => {
  return server.getReferences(params.textDocument.uri, params.position);
});

connection.onWorkspaceSymbol((params) => {
  return server.getWorkspaceSymbols(params.query);
});

connection.onCodeLens((params) => {
  return server.getCodeLenses(params.textDocument.uri);
});

// Shutdown
connection.onShutdown(() => {
  server.onShutdown();
});

// Start listening
documents.listen(connection);
connection.listen();
