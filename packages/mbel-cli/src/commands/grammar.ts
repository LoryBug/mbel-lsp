/**
 * mbel grammar - On-demand syntax refresher for agents
 *
 * Provides MBEL grammar in BNF or example format.
 * Designed as a quick reference for LLMs working with MBEL.
 */

/**
 * Grammar output formats
 */
export type GrammarFormat = 'bnf' | 'examples';

/**
 * Grammar command options
 */
export interface GrammarOptions {
  format?: GrammarFormat;
}

/**
 * Result of mbel grammar command
 */
export interface GrammarResult {
  success: boolean;
  format: GrammarFormat;
  content: string;
}

/**
 * BNF grammar content for MBEL v6
 */
const BNF_GRAMMAR = `
MBEL v6.0 Grammar (BNF)
=======================

document     ::= header? section*
header       ::= "§MBEL:" version
version      ::= number "." number

section      ::= "[" section_name "]" statement*
section_name ::= IDENTIFIER

statement    ::= prefix? identifier operator value metadata?
prefix       ::= "@" | "§" | "✓" | "?" | "!" | "⚠"
identifier   ::= IDENTIFIER ( "::" IDENTIFIER )?
operator     ::= "::" | ":" | "→" | "->" | "←" | "↔"
value        ::= simple_value | list | group
simple_value ::= TEXT | NUMBER | IDENTIFIER
list         ::= "[" value ( "," value )* "]"
group        ::= "(" content ")"
metadata     ::= "{" key_value ( "," key_value )* "}"
key_value    ::= IDENTIFIER ( ":" value )?

arrow_props  ::= "->" arrow_name value
arrow_name   ::= "files" | "tests" | "docs" | "depends" | "entryPoint"
               | "descrizione" | "alternatives" | "reason" | "tradeoff"
               | "dependents" | "coverage" | "impact" | "does" | "doesNot"

anchor       ::= anchor_type "::" path
anchor_type  ::= "@entry" | "@hotspot" | "@boundary"

heat_marker  ::= heat_level "::" path
heat_level   ::= "@critical" | "@stable" | "@volatile" | "@hot"
`;

/**
 * Example content for MBEL v6
 */
const EXAMPLES_CONTENT = `
MBEL v6.0 Examples
==================

# Header
§MBEL:6.0

# Section
[SECTION_NAME]

# Feature with links
@feature{Parser}
  ->files[src/parser.ts,src/ast.ts]
  ->tests[tests/parser.test.ts]
  ->entryPoint{parser.ts:MbelParser}
  ->depends[Lexer]

# Semantic anchor
@entry::packages/core/src/index.ts
  ->descrizione::Main entry point

@hotspot::src/parser.ts
  ->descrizione::Frequently modified

# Decision
§decision::TypeScriptOnly{noAny,strict}
  ->reason{type-safety,maintainability}
  ->alternatives[JavaScript,Flow]
  ->tradeoff{learning-curve,stricter-rules}

# Heat markers
@critical::src/lexer.ts
  ->dependents[parser.ts,analyzer.ts]
  ->coverage{96%}

@stable::src/types.ts
  ->coverage{100%}

# Intent
§module::MbelParser
  ->does{parse-MBEL-syntax,build-AST}
  ->doesNot{validate-semantics,analyze-dependencies}
  ->contract{input:string,output:Document}

# Status markers
✓Complete::Item is done
?Pending::Item not started
!Priority::Important item
⚠Blocker::Needs attention
`;

/**
 * Execute the grammar command
 *
 * @param options - Command options
 * @returns GrammarResult with grammar content
 */
export async function grammarCommand(options: GrammarOptions): Promise<GrammarResult> {
  const format: GrammarFormat = options.format ?? 'bnf';

  const content = format === 'bnf' ? BNF_GRAMMAR.trim() : EXAMPLES_CONTENT.trim();

  return {
    success: true,
    format,
    content,
  };
}
