# MBEL 6.0 Syntax Reference

## Version Declaration

```mbel
§MBEL:6.0
```

## Sections

```mbel
[SECTION_NAME]
```

Sections group related content. Use SCREAMING_SNAKE_CASE.

## Attributes

```mbel
@attribute::Value
@attribute::Value{metadata}
```

## Tree Structure

```mbel
@root::Name
├─ Child1::Value
├─ Child2::Value
└─ LastChild::Value
```

Use `├─` for intermediate items, `└─` for last item.

## Status Markers

| Marker | Meaning |
|--------|---------|
| `✓` | Completed |
| `?` | Pending/Question |
| `!` | Priority/Important |
| `>` | In progress |

## Links Section (§links)

### Feature/Task Declaration

```mbel
§links
@feature{FeatureName}
  ->files[path/to/file.ts, another/file.ts]
  ->tests[path/to/test.ts]
  ->docs[path/to/doc.md]
  ->entryPoint{file.ts:ClassName:lineNumber}
  ->depends[OtherFeature, AnotherFeature]
  ->related[RelatedFeature]

@task{TaskName}
  ->files[file.ts{TO-MODIFY}]
  ->blueprint[design.md]
```

### Arrow Operators

| Operator | Purpose |
|----------|---------|
| `->files` | Source files for this feature |
| `->tests` | Test files |
| `->docs` | Documentation files |
| `->entryPoint` | Main entry point (file:symbol:line) |
| `->depends` | Dependencies on other features |
| `->related` | Related features |
| `->blueprint` | Design/planning documents |
| `->decisions` | Decision log references |
| `->why` | Rationale |

### File Markers

```mbel
->files[file.ts{TO-CREATE}]    # File to be created
->files[file.ts{TO-MODIFY}]    # File to be modified
->files[src/**/*.ts]           # Glob pattern
->files[file.ts:10-50]         # Line range
```

## Anchors Section (§anchors)

```mbel
§anchors
@entry::path/to/file.ts
  ->descrizione::Main entry point description

@hotspot::path/to/frequently-changed.ts
  ->descrizione::Why this file changes often

@boundary::path/to/api.ts
  ->descrizione::External API boundary
```

### Anchor Types

| Type | Purpose |
|------|---------|
| `@entry` | Entry points into the codebase |
| `@hotspot` | Frequently modified files |
| `@boundary` | System boundaries (APIs, protocols) |

## Decisions Section (§decisions)

```mbel
§decision::DecisionName
  ↳rationale::Why we made this decision
  ↳approach::How we implement it
```

## Common Patterns

### Progress Tracking

```mbel
[TDDAB#1]
✓ComponentName
├─ RED::42tests{allFailing}✓
├─ GREEN::Implementation{lines}✓
├─ VERIFY::Coverage%95+Lint+Build✓
├─ Commit::abc1234
└─ Features::Feature1+Feature2+Feature3
```

### Next Steps

```mbel
[NEXT]
!PRIORITY::TaskName{highest}
?PendingTask::Description{estimated-duration}
```

### Notes

```mbel
[NOTES]
@note::Key::#Value{details}
```

## Grammar Rules

1. **No articles** - Skip "the", "a", "an"
2. **CamelCase** - Use for identifiers
3. **Implicit subject** - Context determines subject
4. **Operators only** - Use MBEL operators, not prose
5. **Newline separation** - One statement per line
6. **Latest state** - Show current state, not history
7. **Left-to-right** - Read expressions left to right
