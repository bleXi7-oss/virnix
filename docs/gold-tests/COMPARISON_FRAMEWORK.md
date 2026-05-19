# Virnix Output Comparison Framework

Lightweight before/after comparison system. Markdown-only. No tooling required.

Use to compare:
- Same transcript, different prompt versions
- Same transcript, different model/configuration
- Before/after a prompt engineering change
- Before/after intelligence consolidation phases

---

## How to Run a Comparison

1. Pick a transcript from `docs/gold-tests/transcripts/`
2. Generate output with Config A (current/baseline)
3. Generate output with Config B (after change)
4. Fill in the template below for each platform
5. Score independently before looking at both scores
6. Document the delta and the likely cause

---

## Comparison Template

Save to `docs/gold-tests/analysis/compare-[date]-[slug].md`

---

### Comparison: [Config A] vs [Config B]

**Transcript:** `docs/gold-tests/transcripts/[file].md`
**Date:** 
**What changed:**

---

### TikTok Hook Comparison

**Config A hook:**
```
(paste)
```
**Config B hook:**
```
(paste)
```

| Criterion | Config A | Config B |
|-----------|---------|---------|
| Could apply to any video? (lower = better) | yes / no | yes / no |
| Transcript-specific detail | yes / no | yes / no |
| Hook type | | |
| Self-reflection present | yes / no | yes / no |
| "Would I post this?" | yes / maybe / no | yes / maybe / no |
| Score (1–5) | | |

**Winner:** A / B / tie
**Why:**

---

### Twitter Thread Comparison

**Config A first tweet:**
> 

**Config B first tweet:**
>

| Criterion | Config A | Config B |
|-----------|---------|---------|
| Hook strength (1–5) | | |
| Thread arc quality | | |
| Pacing collapse after tweet 3? | yes / no | yes / no |
| Score (1–5) | | |

**Winner:** A / B / tie
**Why:**

---

### LinkedIn Comparison

| Criterion | Config A | Config B |
|-----------|---------|---------|
| Corporate sludge detected | yes / no | yes / no |
| Voice (founder/peer/expert) | | |
| Score (1–5) | | |

**Winner:** A / B / tie

---

### YouTube Titles Comparison

**Config A best title:**
**Config B best title:**

| Criterion | Config A | Config B |
|-----------|---------|---------|
| Formula variety | yes / no | yes / no |
| Specificity | | |
| Score (1–5) | | |

**Winner:** A / B / tie

---

### Diagnostics Comparison

| Metric | Config A | Config B |
|--------|---------|---------|
| viralityScore | | |
| elapsed (ms) | | |
| estimated cost ($) | | |
| retryCount | | |
| parseRepaired | | |

---

### Overall Comparison

| Platform | Winner | Delta |
|----------|--------|-------|
| TikTok | | |
| Twitter | | |
| LinkedIn | | |
| YouTube | | |

**Overall winner:** A / B / comparable

**What drove the improvement (or regression):**

**Should this change be kept?** yes / yes with adjustments / revert / test more

---

## Delta Scoring Guide

Use this to classify how significant a change was:

| Delta | Meaning |
|-------|---------|
| +10 aggregate | Significant improvement — probably a prompt architecture change |
| +5 aggregate | Meaningful improvement — likely a targeted directive |
| +2–4 aggregate | Small improvement — good iteration, verify across more transcripts |
| 0 | No meaningful change |
| -2 to -4 | Possible regression — verify across more transcripts before reverting |
| -5 or more | Clear regression — revert immediately |

---

## Phase-to-Phase Tracking

Use this table to track aggregate quality across development phases.

| Phase | Config Description | Transcript | TikTok | Twitter | LinkedIn | YouTube | Aggregate |
|-------|--------------------|------------|--------|---------|----------|---------|-----------|
| Phase 0 | Mock AI baseline | N/A | N/A | N/A | N/A | N/A | N/A |
| Phase 5 | First real AI generation | Dan Koe / creator economy | ~3 | ~3 | ~4 | ~3 | 13/20 |
| Phase 8 | Intelligence consolidation | Dan Koe / identity memes | ~4 | ~4 | ~4 | ~3 | 15/20 |
| Phase 9+ | (fill as you go) | | | | | | |

---

## Prompt Diff Tracking

When a comparison reveals a meaningful delta, document the exact prompt change:

```
Date: 
File changed: app/lib/prompts/[file].ts
Line(s) changed: [old] → [new]
Transcript tested: 
Score delta: +X on [platform]
Interpretation: 
```

Keep this lightweight — the goal is to build an intuition for what types of prompt changes move the needle, not to maintain a formal changelog.
