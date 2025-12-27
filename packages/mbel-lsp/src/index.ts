/**
 * @mbel/lsp - MBEL v6 Language Server
 *
 * This package provides Language Server Protocol implementation
 * for MBEL v6 documents.
 */

// Server
export { MbelServer, createServer } from './server.js';

// Query Service (TDDAB#17)
export { QueryService } from './query-service.js';

// Types
export type {
  MbelServerOptions,
  DocumentState,
  // Query API Types (TDDAB#17)
  FeatureFiles,
  FileFeatureInfo,
  EntryPointInfo,
  AnchorInfo,
  QueryResult,
} from './types.js';

export {
  MBEL_SERVER_CAPABILITIES,
  createInitializeResult,
} from './types.js';
