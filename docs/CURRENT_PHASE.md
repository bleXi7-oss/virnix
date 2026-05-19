# Current Phase — Prompt Grounding via Timeline Intelligence

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 13 surfaced timeline moments in the public UI as a "Best moments to clip" section.
Phase 14 connects those same moments into the AI prompt as lightweight creative scaffolding —
so the AI generation is grounded in the transcript's actual psychological peak moments.

---

## What Changed

### Updated: `app/lib/timeline/formatter.ts`

**New `selectMomentsForPrompt(moments)`** — exported filter that selects up to 3 moments most effective as prompt anchors:
- High-priority types qualify at confidence ≥25: `validation_hook`, `mechanism_reframe`, `emotional_confession`, `contrarian_insight`, `transformation_moment`, `story_turning_point`, `fomo_loss_frame`
- Low-priority types (`educational_gem`, `authority_proof`, `quote_moment`) only qualify at confidence ≥40 as fallback

**Rewritten `formatTimelineMomentsForPrompt()`** — new hook-text format:
```
TRANSCRIPT HIGHLIGHTS — draw from these moments as creative anchors, don't copy verbatim:
- "You're not failing — Your identity is protecting itself." [validation hook · TikTok/Reels]
- "This isn't what you think. Discipline isn't the answer." [mechanism reframe · Twitter/LinkedIn]
- "I used to believe hard work was enough." [confession · TikTok/Reels]
```
Cap: 3 moments. ~80 tokens total. Returns `""` when no moments qualify.

---

### Updated: `app/lib/timeline/index.ts`

Exports `selectMomentsForPrompt` alongside existing public API.

---

### Updated: `app/lib/prompts/index.ts`

Both `buildPrompt(transcript, timelineContext = "")` and `buildAdvancedPrompt(transcript, timelineContext = "")` now accept an optional pre-formatted context string.

Injection point: appended to the `GENERATION PROFILE` block, **before** "Apply this angle..." line.

```
━━━ GENERATION PROFILE ━━━
[variation]
[context]

TRANSCRIPT HIGHLIGHTS — draw from these moments...   ← NEW (absent if empty string)

Apply this angle to all 5 platforms.
```

When `timelineContext` is `""`: **prompts are byte-for-byte identical to before.**

---

### Updated: `app/lib/ai/generate.ts`

In `realGenerate()`, before the AI call:
```typescript
const timelineContext = formatTimelineMomentsForPrompt(timelineMoments ?? []);
const injectedMoments = timelineContext ? selectMomentsForPrompt(timelineMoments ?? []) : [];
const timelineInjected = injectedMoments.length > 0;
```

`timelineContext` is passed to prompt builders. `timelineInjected` and `injectedMomentCount` are added to diagnostics.

---

### Updated: `app/lib/ai/diagnostics.ts`

Two new optional fields:
- `timelineInjected?: boolean`
- `injectedMomentCount?: number`

`[VIRNIX_AI]` log line now includes `timelineInjected=true(N)` when grounding is active.

---

### Updated: `app/components/DebugPanel.tsx`

New `grounded` row in AI Diagnostics:
- `yes · 3 moments` when injected
- `no` when timeline had no qualifying moments

---

## This is NOT RAG

| RAG | Virnix prompt grounding |
|-----|------------------------|
| Vector retrieval from external store | Deterministic heuristic from same transcript |
| Retrieves relevant chunks | Selects top psychological moments |
| Primary context replacement | Small supplemental block after generation profile |
| New API calls | Zero new calls |
| Adds hundreds of tokens | ~80 tokens |
| Fails if retrieval fails | Falls back to identical prompt |

---

## Fallback Guarantee

If timeline detection returns `[]` or `selectMomentsForPrompt` returns `[]`:
- `timelineContext` = `""`
- Prompt builders receive empty string as default
- Prompts are **identical** to pre-Phase 14 behavior
- `timelineInjected` = `false` in diagnostics

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Mock mode: ✅ unaffected (returns before transcript fetch)
- Fallback: ✅ empty moments → identical prompt
- Integration: timeline detection → filter → format → prompt → AI → output
