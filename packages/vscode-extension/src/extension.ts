/**
 * MBEL v5 VSCode Extension
 *
 * Language client for the MBEL Language Server.
 */

import * as path from 'path';
import { ExtensionContext, workspace } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  // Path to the server module (bundled with extension)
  const serverModule = context.asAbsolutePath(
    path.join('server', 'bin.js')
  );

  // Server options: run and debug configurations
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: {
        execArgv: ['--nolazy', '--inspect=6009'],
      },
    },
  };

  // Client options: register for MBEL documents
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'mbel' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.mbel'),
    },
  };

  // Create and start the language client
  client = new LanguageClient(
    'mbelLanguageServer',
    'MBEL Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client (also starts the server)
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
