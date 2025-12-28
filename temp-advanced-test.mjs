import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';

// Setup paths
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();
const queryServicePath = join(projectRoot, 'packages/mbel-lsp/dist/query-service.js');
const analyzerPath = join(projectRoot, 'packages/mbel-analyzer/dist/analyzer.js');

// Dynamic import
const { QueryService } = await import(pathToFileURL(queryServicePath).href);
const { MbelAnalyzer } = await import(pathToFileURL(analyzerPath).href);

// Initialize
const qs = new QueryService();
const analyzer = new MbelAnalyzer();

// Load Context
const MB_PATH = join(projectRoot, 'memory-bank');
const content = readFileSync(join(MB_PATH, 'activeContext.mbel.md'), 'utf-8');
const systemPatterns = readFileSync(join(MB_PATH, 'systemPatterns.mbel.md'), 'utf-8');

console.log("=== TEST 5: IMPACT ANALYSIS (Lexer) ===");
// Simulate asking: "What happens if I change the Lexer?"
// We expect: dependents (Parser, Analyzer, Server), risk level, etc.
const impact = qs.analyzeImpact(systemPatterns, 'packages/mbel-core/src/lexer.ts');
console.log(JSON.stringify(impact, null, 2));

console.log("\n=== TEST 6: VALIDATION (Ambiguity Check) ===");
// Simulate a common error: using '→' (arrow char) instead of '->' (dash-arrow)
const badCode = `
[SECTION]
@feature{BadFeature}
  →depends[Lexer]  <-- Error here, wrong arrow
`;

const diagnosticsResult = analyzer.analyzeText(badCode);
console.log("Input with error: '→depends[Lexer]'");
console.log("Diagnostics found:", diagnosticsResult.diagnostics.length);
if (diagnosticsResult.diagnostics.length > 0) {
    console.log("First Error:", diagnosticsResult.diagnostics[0].message);
    console.log("Error Code:", diagnosticsResult.diagnostics[0].code);
}
