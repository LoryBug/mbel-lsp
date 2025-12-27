# QueryService API Reference

The QueryService provides programmatic access to navigate MBEL documents.

## Location

```typescript
import { QueryService } from '@mbel/lsp';
// or
import { QueryService } from './packages/mbel-lsp/dist/query-service.js';
```

## Methods

### getAllFeatures(content: string): FeatureFiles[]

Get all features and tasks from the document.

```typescript
const features = qs.getAllFeatures(content);
// Returns: FeatureFiles[]
```

**Returns:**
```typescript
interface FeatureFiles {
  name: string;           // Feature name
  type: 'feature' | 'task';
  files: string[];        // Source files
  tests: string[];        // Test files
  docs: string[];         // Documentation files
  entryPoint: {           // Main entry point (nullable)
    file: string;
    symbol: string | null;
    line: number | null;
  } | null;
  depends: string[];      // Dependencies
  related: string[];      // Related features
}
```

### getFeatureFiles(content: string, featureName: string): FeatureFiles | null

Forward lookup: Get files associated with a feature.

```typescript
const parser = qs.getFeatureFiles(content, 'Parser');
// Returns: FeatureFiles or null if not found
```

### getFileFeatures(content: string, filePath: string): FileFeatureInfo[]

Reverse lookup: Get features that contain a specific file.

```typescript
const features = qs.getFileFeatures(content, 'lexer.ts');
// Returns: FileFeatureInfo[]
```

**Returns:**
```typescript
interface FileFeatureInfo {
  name: string;                    // Feature name
  type: 'feature' | 'task';
  relation: 'file' | 'test' | 'doc';  // How file relates
}
```

**Note:** Supports partial path matching:
- `'lexer.ts'` matches `'packages/mbel-core/src/lexer.ts'`
- `'parser.test.ts'` matches test files

### getEntryPoints(content: string): Map<string, EntryPointInfo>

Get all entry points from the document.

```typescript
const entries = qs.getEntryPoints(content);
for (const [name, ep] of entries) {
  console.log(`${name}: ${ep.file}::${ep.symbol}:${ep.line}`);
}
```

**Returns:**
```typescript
interface EntryPointInfo {
  file: string;
  symbol: string | null;
  line: number | null;
}
```

### getAnchors(content: string): AnchorInfo[]

Get all semantic anchors from the document.

```typescript
const anchors = qs.getAnchors(content);
// Returns: AnchorInfo[]
```

**Returns:**
```typescript
interface AnchorInfo {
  path: string;                           // File path
  type: 'entry' | 'hotspot' | 'boundary';
  description: string | null;
  isGlob: boolean;                        // If path is glob pattern
}
```

### getAnchorsByType(content: string, type: string): AnchorInfo[]

Get anchors filtered by type.

```typescript
const hotspots = qs.getAnchorsByType(content, 'hotspot');
const entries = qs.getAnchorsByType(content, 'entry');
const boundaries = qs.getAnchorsByType(content, 'boundary');
```

## Usage Example

```javascript
import { readFileSync } from 'fs';
import { QueryService } from './packages/mbel-lsp/dist/query-service.js';

const qs = new QueryService();
const content = readFileSync('./memory-bank/systemPatterns.mbel.md', 'utf-8');

// Get all features
const features = qs.getAllFeatures(content);
console.log(`Found ${features.length} features`);

// Find specific feature
const parser = qs.getFeatureFiles(content, 'Parser');
if (parser) {
  console.log('Parser files:', parser.files);
  console.log('Parser depends on:', parser.depends);
}

// Reverse lookup
const usages = qs.getFileFeatures(content, 'lexer.ts');
console.log('lexer.ts is used by:', usages.map(u => u.name));

// Get hotspots
const hotspots = qs.getAnchorsByType(content, 'hotspot');
console.log('Hotspots:', hotspots.map(h => h.path));
```

## Best Practices

1. **Read systemPatterns.mbel.md** for code navigation queries
2. **Use partial paths** for file lookups (e.g., `'parser.ts'` not full path)
3. **Check null returns** - `getFeatureFiles` returns null if not found
4. **Combine with direct reads** - Use QueryService for navigation, Read for context
