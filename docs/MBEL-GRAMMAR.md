# MBEL 6.0 Formal Grammar Specification

**Version:** 6.0
**Status:** Official Specification
**Last Updated:** 2024-12-28

---

## 1. Notation

This grammar uses Extended Backus-Naur Form (EBNF) with the following conventions:

| Notation | Meaning |
|----------|---------|
| `'x'` | Terminal symbol (literal) |
| `A B` | Sequence (A followed by B) |
| `A \| B` | Alternative (A or B) |
| `[A]` | Optional (zero or one A) |
| `{A}` | Repetition (zero or more A) |
| `(A)` | Grouping |
| `/* */` | Comment |

---

## 2. Lexical Grammar

### 2.1 Character Classes

```ebnf
letter          = 'A'..'Z' | 'a'..'z' ;
digit           = '0'..'9' ;
alphanumeric    = letter | digit ;
whitespace      = ' ' | '\t' ;
newline         = '\n' | '\r\n' ;
```

### 2.2 Identifiers and Literals

```ebnf
identifier      = letter { alphanumeric | '_' | '-' } ;
number          = digit { digit } [ '.' digit { digit } ] [ '%' ] ;
path            = identifier { '/' identifier } [ '.' identifier ] [ ':' number [ '-' number ] ] ;
glob_path       = path_segment { '/' path_segment } ;
path_segment    = identifier | '*' | '**' | '{' identifier { ',' identifier } '}' ;
date            = digit digit digit digit '-' digit digit '-' digit digit ;
string          = '"' { any_char - '"' } '"' | "'" { any_char - "'" } "'" ;
```

---

## 3. Operators

### 3.1 Temporal Operators [4]

```ebnf
temporal_op     = '>'           /* past/completed */
                | '@'           /* present/current */
                | '?'           /* future/pending */
                | '≈'           /* approximate */
                ;
```

### 3.2 State Operators [4]

```ebnf
state_op        = '✓'           /* complete/verified */
                | '✗'           /* failed/rejected */
                | '!'           /* critical/important */
                | '⚡'          /* active/in-progress */
                ;
```

### 3.3 Relation Operators [6]

```ebnf
relation_op     = '::'          /* defines/assigns */
                | '→'           /* leads to (flow) */
                | '←'           /* from */
                | '↔'           /* mutual/bidirectional */
                | '+'           /* and/addition */
                | '-'           /* remove/subtraction */
                ;
```

### 3.4 Structure Operators [5]

```ebnf
section_start   = '[' ;
section_end     = ']' ;
metadata_start  = '{' ;
metadata_end    = '}' ;
note_start      = '(' ;
note_end        = ')' ;
variant_start   = '<' ;
variant_end     = '>' ;
or_op           = '|' ;
```

### 3.5 Quantification Operators [3]

```ebnf
quant_op        = '#'           /* count/number */
                | '%'           /* percentage */
                | '~'           /* range/approximate */
                ;
```

### 3.6 Logic Operators [3]

```ebnf
logic_op        = '&'           /* logical AND */
                | '||'          /* logical OR */
                | '¬'           /* logical NOT */
                ;
```

### 3.7 Meta Operators [2]

```ebnf
meta_op         = '©'           /* source/attribution */
                | '§'           /* section/version marker */
                ;
```

### 3.8 Arrow Operators [31] - MBEL v6

```ebnf
/* CrossRefLinks [10] */
arrow_link      = '->files'
                | '->tests'
                | '->docs'
                | '->decisions'
                | '->related'
                | '->entryPoint'
                | '->blueprint'
                | '->depends'
                | '->features'
                | '->why'
                ;

/* SemanticAnchors [1] */
arrow_anchor    = '->descrizione'
                | '->description'   /* English alias */
                ;

/* DecisionLog [7] */
arrow_decision  = '->alternatives'
                | '->reason'
                | '->tradeoff'
                | '->context'
                | '->status'
                | '->revisit'
                | '->supersededBy'
                ;

/* HeatMap [7] */
arrow_heat      = '->dependents'
                | '->untouched'
                | '->changes'
                | '->coverage'
                | '->confidence'
                | '->impact'
                | '->caution'
                ;

/* IntentMarkers [6] */
arrow_intent    = '->does'
                | '->doesNot'
                | '->contract'
                | '->singleResponsibility'
                | '->antiPattern'
                | '->extends'
                ;

arrow_op        = arrow_link | arrow_anchor | arrow_decision | arrow_heat | arrow_intent ;
```

### 3.9 Prefix Operators - MBEL v6

```ebnf
/* Anchor Prefixes [3] */
anchor_prefix   = '@entry::'
                | '@hotspot::'
                | '@boundary::'
                ;

/* Heat Prefixes [4] */
heat_prefix     = '@critical::'
                | '@stable::'
                | '@volatile::'
                | '@hot::'
                ;

/* Link Type Markers [2] */
link_marker     = '@feature'
                | '@task'
                ;

/* Decision Date Prefix */
decision_prefix = '@' date '::' ;

/* Intent Prefix */
intent_prefix   = '@' identifier '::' identifier ;
```

---

## 4. Syntactic Grammar

### 4.1 Document Structure

```ebnf
document        = [ version_stmt ] { statement } EOF ;

version_stmt    = '§' identifier ':' number newline ;
                /* e.g., §MBEL:6.0 */

statement       = section_decl
                | attribute_stmt
                | temporal_stmt
                | source_stmt
                | link_decl
                | anchor_decl
                | decision_decl
                | heat_decl
                | intent_decl
                | expression_stmt
                ;
```

### 4.2 Section Declaration

```ebnf
section_decl    = '[' identifier ']' newline ;
                /* e.g., [FOCUS] */
```

### 4.3 Attribute Statement

```ebnf
attribute_stmt  = temporal_op identifier '::' expression [ metadata ] newline ;
                /* e.g., @focus::MBEL6.0{v6-Complete} */
                /* e.g., >status::Complete */
```

### 4.4 Temporal Statement

```ebnf
temporal_stmt   = temporal_op expression newline ;
                /* e.g., ?TASK#1::FormalGrammar */
```

### 4.5 Source Statement

```ebnf
source_stmt     = '©' identifier [ '>' expression ] newline ;
                /* e.g., ©Author>created::Feature */
```

### 4.6 Expression Statement

```ebnf
expression_stmt = expression newline ;
```

---

## 5. MBEL v6 Extensions

### 5.1 Link Declaration (§links section)

```ebnf
link_decl       = link_marker '{' identifier '}' { arrow_clause } newline ;
                /* e.g., @feature{Lexer}->files[src/lexer.ts]->tests[tests/] */

arrow_clause    = arrow_link ( list | metadata | entry_point ) ;

list            = '[' [ list_item { ',' list_item } ] ']' ;
list_item       = file_ref | identifier | string ;

file_ref        = path [ file_marker ] [ line_range ] ;
file_marker     = '{TO-CREATE}' | '{TO-MODIFY}' ;
line_range      = ':' number [ '-' number ] ;

entry_point     = '{' path ':' identifier [ ':' number ] '}' ;
                /* e.g., {lexer.ts:MbelLexer:42} */
```

### 5.2 Anchor Declaration (§anchors section)

```ebnf
anchor_decl     = anchor_prefix path [ arrow_anchor metadata ] newline ;
                /* e.g., @entry::src/index.ts */
                /*       ->descrizione{Main entry point} */
```

### 5.3 Decision Declaration (§decisions section)

```ebnf
decision_decl   = decision_prefix identifier { decision_clause } newline ;
                /* e.g., @2024-12-27::UseTypeScript */
                /*       ->reason{Type safety} */
                /*       ->status{ACTIVE} */

decision_clause = arrow_decision ( list | metadata | status_value ) ;

status_value    = '{' ( 'ACTIVE' | 'SUPERSEDED' | 'RECONSIDERING' ) '}' ;
```

### 5.4 Heat Declaration (§heat section)

```ebnf
heat_decl       = heat_prefix path { heat_clause } newline ;
                /* e.g., @critical::src/core/engine.ts */
                /*       ->dependents[ModuleA,ModuleB] */
                /*       ->coverage{95%} */

heat_clause     = arrow_heat ( list | metadata | number ) ;
```

### 5.5 Intent Declaration (§intents section)

```ebnf
intent_decl     = intent_prefix { intent_clause } newline ;
                /* e.g., @Parser::StatementHandler */
                /*       ->does{Parse statements} */
                /*       ->contract{Statement | null} */

intent_clause   = arrow_intent ( list | metadata ) ;
```

---

## 6. Expressions

### 6.1 Expression Hierarchy

```ebnf
expression      = logic_expr ;

logic_expr      = chain_expr { logic_op chain_expr } ;

chain_expr      = unary_expr { relation_op unary_expr } ;

unary_expr      = [ state_op | '¬' ] primary_expr ;

primary_expr    = identifier
                | number
                | metadata
                | note
                | variant
                | '(' expression ')'
                ;
```

### 6.2 Compound Expressions

```ebnf
metadata        = '{' [ content ] '}' ;
content         = entry { ',' entry } ;
entry           = identifier [ ( ':' | '#' | '%' | '~' ) value ] ;
value           = identifier | number | string ;

note            = '(' text ')' ;

variant         = '<' text '>' ;
```

---

## 7. Operator Precedence

| Precedence | Operators | Associativity | Description |
|------------|-----------|---------------|-------------|
| 1 (highest) | `¬` | Right | Logical NOT |
| 2 | `::` `→` `←` `↔` | Left | Relations |
| 3 | `+` `-` | Left | Addition/Removal |
| 4 | `&` | Left | Logical AND |
| 5 (lowest) | `\|\|` | Left | Logical OR |

**Note:** Chain expressions are left-associative: `A→B→C` parses as `(A→B)→C`.

---

## 8. Semantic Constraints

### 8.1 Section Validity

- `§links` section may only contain `link_decl` statements
- `§anchors` section may only contain `anchor_decl` statements
- `§decisions` section may only contain `decision_decl` statements
- `§heat` section may only contain `heat_decl` statements
- `§intents` section may only contain `intent_decl` statements

### 8.2 Path Validation

- File paths in `->files`, `->tests`, `->docs` should exist (warning if not)
- Glob patterns (`*`, `**`, `{a,b}`) are valid in paths
- Line ranges must have `start <= end`

### 8.3 Status Values

Valid status values for `->status`:
- `ACTIVE` - Decision currently in effect
- `SUPERSEDED` - Replaced by another decision
- `RECONSIDERING` - Under review

### 8.4 Heat Types

- `@critical::` - Critical stability path, high risk if changed
- `@stable::` - Rarely modified, well-tested
- `@volatile::` - Frequently changed, needs monitoring
- `@hot::` - Recent high-activity area

---

## 9. Examples

### 9.1 Complete Document

```mbel
§MBEL:6.0

[FOCUS]
@focus::ProjectStatus{complete}
>tests::100{95%coverage}
?next::Documentation

[STATUS]
✓Feature1::Implemented{v1.0}
✓Feature2::Tested
?Feature3::Planned

[LINKS]
§links
@feature{Parser}
  ->files[src/parser.ts,src/ast.ts]
  ->tests[tests/parser.test.ts]
  ->entryPoint{parser.ts:MbelParser}
  ->depends[Lexer]

[ANCHORS]
§anchors
@entry::src/index.ts
  ->descrizione{Main entry point}
@hotspot::src/parser.ts
  ->descrizione{Frequent changes}

[DECISIONS]
§decisions
@2024-12-27::UseTypeScript
  ->alternatives["JavaScript","Go"]
  ->reason{Type safety and tooling}
  ->status{ACTIVE}

[HEAT]
§heat
@critical::src/core/engine.ts
  ->dependents[ModuleA,ModuleB]
  ->coverage{95%}
  ->impact{high}

[INTENTS]
§intents
@Parser::StatementHandler
  ->does{Parse MBEL statements into AST}
  ->doesNot{Validate semantics}
  ->contract{Statement | null}
```

### 9.2 Minimal Document

```mbel
§MBEL:6.0

[STATUS]
@status::Active
>progress::50%
```

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 6.0 | 2024-12 | Added Links, Anchors, Decisions, Heat, Intents |
| 5.0 | 2024-10 | Base 27 operators, sections, metadata |

---

## Appendix A: Complete Operator Reference

### A.1 Summary Table

| Category | Count | Operators |
|----------|-------|-----------|
| Temporal | 4 | `>` `@` `?` `≈` |
| State | 4 | `✓` `✗` `!` `⚡` |
| Relation | 6 | `::` `→` `←` `↔` `+` `-` |
| Structure | 5 | `[]` `{}` `()` `<>` `\|` |
| Quantification | 3 | `#` `%` `~` |
| Logic | 3 | `&` `\|\|` `¬` |
| Meta | 2 | `©` `§` |
| **v5 Total** | **27** | |
| Arrow (v6) | 31 | `->files` `->tests` ... |
| Prefix (v6) | 9 | `@entry::` `@critical::` ... |
| **v6 Total** | **67** | |

### A.2 ASCII Alternatives

For environments without Unicode support:

| Unicode | ASCII | Meaning |
|---------|-------|---------|
| `→` | `->` | Leads to (in flow context) |
| `←` | `<-` | From |
| `↔` | `<->` | Mutual |
| `≈` | `~=` | Approximate |
| `✓` | `[x]` | Complete |
| `✗` | `[-]` | Failed |
| `⚡` | `[!]` | Active |
| `¬` | `!` | Not (in logic context) |

---

*End of MBEL 6.0 Grammar Specification*
