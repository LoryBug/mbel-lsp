# MBEL Agent Experience Enhancement Proposal

**Status:** Draft
**Date:** 2024-12-28
**Based on:** Insights from `MBEL-LLM-EVALUATION-REPORT.md` (v1.1)

---

## 1. Executive Summary

Recent tests conducted by the OpenCode agent demonstrated that integrating the MBEL LSP reduces information retrieval effort by **15x** and eliminates syntax errors compared to standard text-based interaction.

 However, these capabilities are currently locked behind internal APIs (`QueryService`, `Analyzer`) or require custom scripts (like `query-mb.mjs` or `temp-advanced-test.mjs`) to be accessed.

**This proposal aims to democratize these advanced capabilities**, transforming MBEL from a passive documentation format into an active "Agent Operating System" that guides, validates, and safeguards AI development workflows.

---

## 2. Proposal I: Agent-First CLI (`mbel-cli`)

Current agent tools (`mbel-query`) are limited to high-level status checks. We propose exposing the deep logic of the LSP via a standardized CLI designed for machine consumption (JSON output).

### 2.1 `mbel check` (Validation)
**Purpose:** Pre-commit safety check for agents.
**Usage:** `mbel check <file_path> --format=json`
**Output:**
```json
{
  "valid": false,
  "errors": [
    {
      "line": 15,
      "code": "MBEL-LINK-051",
      "message": "Invalid arrow operator '→'. Did you mean '->'?",
      "severity": "error"
    }
  ]
}
```
**Value:** Allows agents to self-correct syntax *before* saving files or attempting builds.

### 2.2 `mbel impact` (Risk Analysis)
**Purpose:** Predictive engineering and refactoring planning.
**Usage:** `mbel impact <file_path>`
**Output:**
```json
{
  "riskLevel": "high",
  "affectedFeatures": ["Lexer", "Parser"],
  "requiredTests": [
    "packages/mbel-core/tests/lexer.test.ts",
    "lexer-links.test.ts"
  ],
  "suggestion": "Critical hotspot modified. Run full regression suite."
}
```
**Value:** Enables agents to generate accurate "Test Plans" instantly, avoiding regression loops.

### 2.3 `mbel context` (Token Optimization)
**Purpose:** Efficiently loading feature context into limited LLM context windows.
**Usage:** `mbel context <feature_name> --mode=summary`
**Output:** A compressed semantic representation of the feature.
- Instead of raw file dumps (expensive), it returns:
    - Exported interfaces/types.
    - Function signatures (no bodies).
    - Key architectural decisions.
    - dependency graph.
**Value:** Reduces context usage by ~70%, allowing agents to reason about larger systems without "forgetting".

---

## 3. Proposal II: Predictive Simulation ("Dry Run")

Agents often discover architectural conflicts (like circular dependencies) only *after* modifying code.

### 3.1 `mbel simulate`
**Purpose:** Test architectural changes virtually.
**Usage:** `mbel simulate --action="add-dep" --from="FeatureA" --to="FeatureB"`
**Output:**
```json
{
  "success": false,
  "error": "Circular dependency detected: FeatureA -> FeatureB -> FeatureC -> FeatureA",
  "path": ["FeatureA", "FeatureB", "FeatureC"]
}
```
**Value:** Prevents agents from pursuing invalid architectural paths, saving huge amounts of wasted tokens and iterations.

---

## 4. Proposal III: Intent-Aware Diagnostics

Standard parser errors ("Unexpected token") are obscure for LLMs. Diagnostics should be "Self-Healing".

### 4.1 "Did you mean?" for Symbols
If the parser detects common "hallucination" characters (like unicode arrows `→`, `⇒` or markdown bullets `-`), the error message should explicitly suggest the correct MBEL operator (`->`).

### 4.2 Structured Fix Suggestions
Diagnostics should include a machine-readable `suggestedFix` field:
```json
"suggestedFix": {
  "find": "→",
  "replace": "->"
}
```
This allows agents to apply fixes programmatically without "guessing".

---

## 5. Proposal IV: Dynamic Grammar Injection

Agents sometimes "forget" specific syntax details.

### 5.1 `mbel grammar`
**Purpose:** On-demand syntax refresher.
**Usage:** `mbel grammar --format=bnf` (or `--format=examples`)
**Value:** Allows an agent to inject the exact syntax rules into its context *just before* writing a complex file, reducing syntax errors to near zero.

---

## 6. Implementation Roadmap

Based on value/effort ratio:

| Priority | Feature | Effort | Value | Justification |
|----------|---------|--------|-------|---------------|
| **P1** | **CLI Expansion (`check`, `impact`)** | Low | **Critical** | Unlocks the power already present in `QueryService`. |
| **P2** | **Intent-Aware Diagnostics** | Medium | High | Drastically reduces agent "retry loops". |
| **P3** | **Context Summary** | Medium | Medium | Optimization for large codebases. |
| **P4** | **Simulation ("Dry Run")** | High | Medium | Advanced feature for architectural refactoring. |

---

## 7. Conclusion

By implementing these proposals, MBEL evolves from a **Language Server for IDEs** (Human-centric) to a **Language Server for Agents** (AI-centric). This ensures that MBEL remains the most robust and efficient way for AI agents to understand and modify software projects.
