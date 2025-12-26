/**
 * @mbel/lsp - MBEL v5 Language Server
 *
 * This package provides Language Server Protocol implementation
 * for MBEL v5 documents.
 */

// Server
export { MbelServer, createServer } from './server.js';

// Types
export type {
  MbelServerOptions,
  DocumentState,
} from './types.js';

export {
  MBEL_SERVER_CAPABILITIES,
  createInitializeResult,
} from './types.js';
