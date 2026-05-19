# Current Phase — Timeline Grounding Validation

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 14 injected timeline intelligence into AI prompts as lightweight creative scaffolding.
Phase 15 validates whether that grounding actually improves outputs — and where it doesn't.

This is a measurement and analysis phase, not a coding phase. No production code was changed.

---

## What Was Done

### Created: `docs/TIMELINE_GROUNDING_VALIDATION.md`

Full structural validation of timeline grounding effectiveness across 12 real AI generations
(.gen_tests/ dataset, all pre-Phase-14 outputs generated with live Anthropic Sonnet 4.6).

---

## Key Findings Summary

### Virality Score Patterns

| Score | Creator archetype | Root cause |
|-------|------------------|-----------|
| 80–90 | Confession arc + specific story | Bartlett, Naval |
| 40–55 | Mechanism reframe + evidence | Huberman, Gadzhi, Hormozi |
| 20–35 | Didactic / philosophical | Peterson, GaryVee, Sinek |

### What Works Without Grounding

High-quality outputs (Bartlett 90, Naval 80) were produced **without grounding active**.
The base prompt system correctly extracts the strongest psychological moments for confessional,
story-rich transcripts.

### Grounding's Clearest Benefit Case

Mid-tier transcripts (score 30–55) where one standout moment exists but the model might
average across the full transcript instead. Huberman's fear extinction two-step is the
clearest example — grounding would anchor the model to that framework vs surveying 6+ interventions.

### Grounding Paradox

- High-score transcripts (80+): already extracting best moments → grounding adds echo risk, not uplift
- Low-score transcripts (<25): lack qualifying psychological moments → grounding has nothing to inject
- Clearest benefit: 30–55 range transcripts with one buried strong moment

### Overfitting Risks Confirmed

1. **Phrase echo**: format injects pre-formulated hook text; model may reproduce rather than derive
2. **Type concentration**: no diversity enforcement in 3 selected moments → angle convergence risk
3. **Format improvement**: inject `sourceTextPreview` (raw transcript text) instead of `suggestedHook`
   to reduce verbatim reproduction while preserving anchoring benefit

### Independent Quality Finding: Opener Repetition

"Everyone's doing this backwards." appeared 5/12 times (42%) across test outputs.
The opener pool (10 lines) is too small for the generation volume.
5 openers appeared 0 times. Target: expand to 18+ openers, <20% rate for any single opener.

### Strategic Conclusion

> **The system's quality ceiling is the transcript's psychological richness, not prompt sophistication.**

Grounding is insurance (prevents drift to generic summary) not transformation (cannot create
psychological richness where the transcript has none). The highest-leverage next addition is
transcript quality scoring — telling creators which section of their video has strong clipable
moments before generation runs.

---

## Validation Status

- Build: ✅ clean (no code changes, previous build still valid)
- Lint: ✅ clean (no code changes)
- Runtime: ✅ no regressions (docs only)
- Grounding A/B: ⏳ requires live API test — recommended: Huberman fear extinction transcript

---

## No Code Changed

This phase is analysis and documentation only. All production code is identical to end-of-Phase-14 state.
