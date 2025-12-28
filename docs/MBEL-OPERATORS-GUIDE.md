# MBEL Operators Guide

**Version:** 6.0
**Purpose:** Clarify operator usage and resolve ambiguities

---

## 1. Arrow Operator Clarification

### The Problem

MBEL uses two similar-looking arrow notations that cause confusion:

| Symbol | Name | Unicode | ASCII |
|--------|------|---------|-------|
| `→` | Flow Arrow | U+2192 | (none) |
| `->` | Reference Arrow | ASCII | `->` |

### The Solution

**Use `->` for ALL cross-references.** Reserve `→` only for data flow diagrams.

```
CORRECT:
  ->files[src/a.ts]           # Reference to files
  ->depends[Lexer]            # Reference to dependency

CORRECT (flow diagrams only):
  Source→Lexer→Parser→AST     # Data flow visualization

AVOID:
  →files[src/a.ts]            # Don't use → for references
```

### When to Use Each

| Use Case | Operator | Example |
|----------|----------|---------|
| File references | `->` | `->files[src/a.ts]` |
| Dependencies | `->` | `->depends[Lexer]` |
| Test links | `->` | `->tests[tests/a.test.ts]` |
| Any arrow clause | `->` | `->reason{explanation}` |
| Data flow diagrams | `→` | `Input→Process→Output` |
| Sequence visualization | `→` | `A→B→C` |

---

## 2. Operator Categories

### Tier 1: Essential (Learn First)

These 10 operators cover 90% of use cases:

| Op | Name | Purpose | Example |
|----|------|---------|---------|
| `@` | Present | Current state | `@status::Active` |
| `>` | Past | Completed | `>done::Task1` |
| `?` | Future | Pending | `?next::Task2` |
| `::` | Defines | Assignment | `name::value` |
| `->` | Reference | Cross-reference | `->files[a.ts]` |
| `{}` | Metadata | Details/properties | `{key:value}` |
| `[]` | List | Array of items | `[item1,item2]` |
| `✓` | Complete | Verified done | `✓Feature::Done` |
| `!` | Critical | Important/blocker | `!Bug::Urgent` |
| `§` | Section | Version/section | `§MBEL:6.0` |

### Tier 2: Common (Learn When Needed)

| Op | Name | Purpose | Example |
|----|------|---------|---------|
| `→` | Flow | Data flow | `A→B→C` |
| `+` | And | Combination | `Lexer+Parser` |
| `-` | Remove | Subtraction | `All-Deprecated` |
| `#` | Count | Number | `#tests::50` |
| `%` | Percent | Percentage | `coverage::95%` |
| `~` | Approx | Approximate | `~100items` |
| `()` | Note | Comment/note | `(see also)` |
| `<>` | Variant | Alternative | `<optional>` |

### Tier 3: Advanced (Domain-Specific)

All 31 arrow operators for specific sections:

**Links:** `->files` `->tests` `->docs` `->decisions` `->related` `->entryPoint` `->blueprint` `->depends` `->features` `->why`

**Anchors:** `->descrizione` `->description`

**Decisions:** `->alternatives` `->reason` `->tradeoff` `->context` `->status` `->revisit` `->supersededBy`

**Heat:** `->dependents` `->untouched` `->changes` `->coverage` `->confidence` `->impact` `->caution`

**Intents:** `->does` `->doesNot` `->contract` `->singleResponsibility` `->antiPattern` `->extends`

---

## 3. Naming Conventions

### Current State (Known Inconsistencies)

| Pattern | Examples | Issue |
|---------|----------|-------|
| Plural | `->files`, `->tests` | Consistent |
| Singular | `->entryPoint`, `->blueprint` | Mixed |
| camelCase | `->entryPoint`, `->doesNot` | Consistent |
| lowercase | `->depends`, `->files` | Inconsistent |

### Recommendation

For future additions, use:
- **camelCase** for multi-word operators: `->entryPoint`, `->doesNot`
- **lowercase** for single-word operators: `->files`, `->tests`
- **Plural** for collections: `->files`, `->dependents`
- **Singular** for single values: `->reason`, `->contract`

---

## 4. Special Characters and Escaping

### Current Behavior

MBEL does **not** have escape sequences. Special characters in values should be:

1. **Quoted** for strings with special chars:
   ```mbel
   ->reason{"Value with {braces} and [brackets]"}
   ```

2. **Avoided** in identifiers:
   ```mbel
   # CORRECT
   @feature{AuthService}

   # AVOID
   @feature{Auth-Service}   # Hyphen in identifier
   @feature{Auth.Service}   # Dot in identifier
   ```

### Path Handling

File paths allow these characters without escaping:
- `/` - Path separator
- `.` - File extension
- `-` `_` - Common in filenames
- `*` `**` - Glob patterns
- `:` - Line number separator

```mbel
->files[src/my-file.ts, src/**/*.test.ts]
->entryPoint{src/index.ts:MainClass:42}
```

---

## 5. Unicode vs ASCII

### Unicode Operators (Preferred)

| Unicode | Meaning |
|---------|---------|
| `✓` | Complete |
| `✗` | Failed |
| `⚡` | Active |
| `→` | Flow (diagrams only) |
| `←` | From |
| `↔` | Mutual |
| `≈` | Approximate |
| `¬` | Not |
| `©` | Source |
| `§` | Section |

### ASCII Fallbacks

For systems without Unicode support:

| Unicode | ASCII | Context |
|---------|-------|---------|
| `✓` | `[x]` | Status |
| `✗` | `[-]` | Status |
| `⚡` | `[*]` | Status |
| `→` | `->` | Flow |
| `←` | `<-` | Flow |
| `↔` | `<->` | Flow |
| `≈` | `~=` | Approx |
| `¬` | `!` | Logic |

**Important:** The `->` ASCII arrow is the ONLY form for reference operators. There is no Unicode equivalent for `->files`, `->tests`, etc.

---

## 6. Common Mistakes

### Mistake 1: Using `→` for references
```mbel
# WRONG
@feature{Parser}
  →files[src/parser.ts]    # Should be ->

# CORRECT
@feature{Parser}
  ->files[src/parser.ts]
```

### Mistake 2: Missing section marker
```mbel
# WRONG - in [LINKS] section without §links
[LINKS]
@feature{Parser}->files[...]

# CORRECT
[LINKS]
§links
@feature{Parser}->files[...]
```

### Mistake 3: Wrong bracket type
```mbel
# WRONG
->files{src/a.ts}          # {} is for single values
->reason[Because X]        # [] is for lists

# CORRECT
->files[src/a.ts]          # [] for file lists
->reason{Because X}        # {} for single value
```

### Mistake 4: Invalid status value
```mbel
# WRONG
->status{active}           # lowercase
->status{Done}             # invalid value

# CORRECT
->status{ACTIVE}           # uppercase, valid value
->status{SUPERSEDED}
->status{RECONSIDERING}
```

---

## 7. Operator Precedence

When multiple operators appear together:

| Priority | Operators | Association | Example |
|----------|-----------|-------------|---------|
| 1 (high) | `¬` | Right | `¬A` |
| 2 | `::` `→` `←` `↔` | Left | `A::B::C = (A::B)::C` |
| 3 | `+` `-` | Left | `A+B-C = (A+B)-C` |
| 4 | `&` | Left | `A&B&C = (A&B)&C` |
| 5 (low) | `\|\|` | Left | `A\|\|B` |

---

## 8. Quick Decision Guide

**"Which operator should I use?"**

```
Need to reference a file?        → ->files[path]
Need to link dependencies?       → ->depends[name]
Need to describe something?      → ->descrizione{text} or ->reason{text}
Need to show completion?         → ✓ or status::Complete
Need to show pending?            → ? or status::Pending
Need to show importance?         → !
Need to group metadata?          → {key:value}
Need to list items?              → [item1,item2]
Need to show data flow?          → A→B→C
Need to assign value?            → name::value
```

---

## Summary

1. **Use `->` for all references** (files, tests, depends, etc.)
2. **Use `→` only for flow diagrams** (data flow visualization)
3. **Use `{}` for single values**, `[]` for lists
4. **Learn Tier 1 operators first** (10 operators cover 90% of use)
5. **Follow naming conventions** (camelCase for multi-word, lowercase for single-word)

---

*For full grammar specification, see `docs/MBEL-GRAMMAR.md`*
