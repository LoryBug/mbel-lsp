# MBEL 6.0 Quick Reference Cheatsheet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MBEL 6.0 CHEATSHEET                               │
│                    Memory Bank Expression Language                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Document Structure

```mbel
§MBEL:6.0                    # Version declaration (required)

[SECTION_NAME]               # Section header
@name::value{metadata}       # Attribute with metadata
>past::value                 # Past/completed item
?future::value               # Future/pending item
```

---

## Essential Operators (Learn These First)

| Operator | Name | Usage | Example |
|:--------:|------|-------|---------|
| `@` | Present | Current state | `@status::Active` |
| `>` | Past | Completed | `>done::Feature1` |
| `?` | Future | Pending | `?next::Feature2` |
| `::` | Defines | Assignment | `name::value` |
| `->` | Reference | Cross-ref | `->files[a.ts]` |
| `{}` | Metadata | Details | `{key:value}` |
| `[]` | List | Array | `[item1,item2]` |
| `✓` | Complete | Verified | `✓Task::Done` |
| `?` | Pending | Not started | `?Task::Todo` |
| `!` | Important | Priority | `!Blocker::Issue` |

---

## State Markers

```
✓  Complete/Verified     ✓Feature::Done{tested}
✗  Failed/Rejected       ✗Build::Error{timeout}
!  Critical/Important    !Blocker::Urgent
⚡ Active/In-Progress    ⚡Task::Working
```

---

## Sections (MBEL v6)

### Basic Section
```mbel
[SECTION_NAME]
@attribute::value
>completed::item
?pending::item
```

### Links Section (§links)
```mbel
[LINKS]
§links
@feature{FeatureName}
  ->files[src/file.ts,src/other.ts]
  ->tests[tests/file.test.ts]
  ->entryPoint{file.ts:ClassName}
  ->depends[OtherFeature]
```

### Anchors Section (§anchors)
```mbel
[ANCHORS]
§anchors
@entry::src/index.ts
  ->descrizione{Main entry point}
@hotspot::src/parser.ts
  ->descrizione{Frequently modified}
@boundary::src/api/server.ts
  ->descrizione{External API boundary}
```

### Decisions Section (§decisions)
```mbel
[DECISIONS]
§decisions
@2024-12-28::DecisionName
  ->alternatives["Option1","Option2"]
  ->reason{Why we chose this}
  ->status{ACTIVE}
```

### Heat Section (§heat)
```mbel
[HEAT]
§heat
@critical::src/core/engine.ts
  ->dependents[ModuleA,ModuleB]
  ->coverage{95%}
@volatile::src/api/routes.ts
  ->caution{API still evolving}
```

### Intents Section (§intents)
```mbel
[INTENTS]
§intents
@Module::Component
  ->does{What it does}
  ->doesNot{What it doesn't do}
  ->contract{Input -> Output}
```

---

## Arrow Operators Reference

### Links (->)
| Arrow | Purpose | Example |
|-------|---------|---------|
| `->files` | Source files | `->files[src/a.ts]` |
| `->tests` | Test files | `->tests[tests/a.test.ts]` |
| `->docs` | Documentation | `->docs[docs/README.md]` |
| `->depends` | Dependencies | `->depends[Lexer,Parser]` |
| `->entryPoint` | Entry point | `->entryPoint{file:Class}` |

### Anchors (->)
| Arrow | Purpose | Example |
|-------|---------|---------|
| `->descrizione` | Description | `->descrizione{Main entry}` |

### Decisions (->)
| Arrow | Purpose | Example |
|-------|---------|---------|
| `->reason` | Rationale | `->reason{Type safety}` |
| `->alternatives` | Options | `->alternatives["A","B"]` |
| `->status` | Current state | `->status{ACTIVE}` |
| `->tradeoff` | Trade-offs | `->tradeoff{Speed vs safety}` |

### Heat (->)
| Arrow | Purpose | Example |
|-------|---------|---------|
| `->coverage` | Test coverage | `->coverage{95%}` |
| `->dependents` | What depends | `->dependents[A,B]` |
| `->impact` | Change impact | `->impact{high}` |
| `->caution` | Warnings | `->caution{Fragile}` |

### Intents (->)
| Arrow | Purpose | Example |
|-------|---------|---------|
| `->does` | Responsibility | `->does{Parse tokens}` |
| `->doesNot` | Non-goals | `->doesNot{Validate}` |
| `->contract` | Interface | `->contract{In->Out}` |

---

## Prefixes

### Anchor Types
```
@entry::path      # Main entry point
@hotspot::path    # Frequently modified
@boundary::path   # System boundary
```

### Heat Types
```
@critical::path   # High-risk if changed
@stable::path     # Rarely changes
@volatile::path   # Frequently changes
@hot::path        # Currently active
```

---

## Common Patterns

### Project Status
```mbel
§MBEL:6.0

[FOCUS]
@focus::ProjectName{v1.0}
>tests::150{92%coverage}
?next::Documentation

[STATUS]
✓Feature1::Complete
✓Feature2::Complete
?Feature3::Pending
!Blocker::NeedsAttention
```

### Feature Mapping
```mbel
[LINKS]
§links
@feature{Authentication}
  ->files[src/auth/*.ts]
  ->tests[tests/auth/*.test.ts]
  ->entryPoint{auth/index.ts:AuthService}
  ->depends[Database,Crypto]
```

### Decision Log Entry
```mbel
[DECISIONS]
§decisions
@2024-12-28::UseTypeScript
  ->alternatives["JavaScript","Go","Rust"]
  ->reason{Strong typing, ecosystem, tooling}
  ->tradeoff{Compilation step required}
  ->status{ACTIVE}
```

---

## Quick Tips

1. **Start simple**: Use only `@`, `>`, `?`, `::`, `{}`, `[]`
2. **Add sections**: `[SECTION]` organizes content
3. **Use markers**: `✓` `?` `!` for quick status
4. **Reference files**: `->files[path]` for code links
5. **Document decisions**: `@DATE::Name` in §decisions

---

## Minimal Template

```mbel
§MBEL:6.0

[STATUS]
@project::MyProject{active}
>completed::InitialSetup
?pending::NextFeature

[LINKS]
§links
@feature{Core}
  ->files[src/index.ts]
  ->tests[tests/index.test.ts]

[NOTES]
@updated::2024-12-28
```

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Full documentation: docs/MBEL-GRAMMAR.md                                   │
│  Evaluation report:  docs/MBEL-LLM-EVALUATION-REPORT.md                     │
└─────────────────────────────────────────────────────────────────────────────┘
```
