# Current Phase — Real AI Quality Test Kit

Phase started: 2026-05-19
Status: complete and pushed

---

## What Was Done in This Phase

### 1. Test Fixtures (`docs/test-fixtures/`)

Three original short transcripts for local quality testing:

- `creator-business-short.md` — Creator-economy business advice, ~280 words.
  Trust vs. audience-size, product launch contrast, revenue outcome.
- `podcast-story-short.md` — Personal burnout and transformation story, ~290 words.
  Emotional arc, before/after contrast, strong first-person voice.
- `educational-short.md` — Compound attention concept explanation, ~270 words.
  Data-backed, clear metaphor, creator-growth framing.

Each fixture includes realistic content density with numbers, contrast, and specificity — the same qualities the prompt system tries to generate. Use them as:
- Reference when choosing a real YouTube video to test
- Input for the local smoke test script (`scripts/test-real-ai.ts`)

### 2. Output Quality Checklist (`docs/OUTPUT_QUALITY_CHECKLIST.md`)

Human review checklist for all 8 output types:
- TikTok Hook, Twitter Thread, LinkedIn Post, Instagram Caption, YouTube Titles
- Short-Form Script, YouTube Timestamps, Blog Summary (advanced outputs)

Per-card scoring: 7 criteria × 5 max = 35 points per card.

Criteria: curiosity, specificity, emotional pull, platform-native tone, clarity, non-generic language, usefulness.

Each card section includes specific red-flag checks (platform-specific anti-patterns).

Includes an overall session summary table with a slot for diagnostics values from the debug panel.

### 3. First Real AI Test Plan (`docs/FIRST_REAL_AI_TEST_PLAN.md`)

10-phase step-by-step guide for the first controlled real AI run:
1. Local environment setup (`.env.local` configuration)
2. Local smoke test (zero cost)
3. Dev server startup and pre-flight check
4. Test video selection guidance (with fixture references)
5. First generation run
6. Terminal log inspection with expected values per field
7. Debug panel inspection
8. Output quality review (references checklist)
9. Advanced outputs test (optional, gated on core passing)
10. Cost check (Anthropic dashboard link)

Includes rollback instructions (local and Vercel) and a known-issues table.

---

## Next Recommended Phase

**Real AI First Run + Output Iteration**

Follow `docs/FIRST_REAL_AI_TEST_PLAN.md` exactly.

1. Set `ANTHROPIC_API_KEY` in `.env.local`
2. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true`
3. Keep `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`
4. Run `npm.cmd run dev`
5. Test with a short YouTube video (< 5 min)
6. Score output using `docs/OUTPUT_QUALITY_CHECKLIST.md`
7. Check `[VIRNIX_AI]` log line for diagnostics
8. Only iterate the prompt after 3 runs establish a pattern
9. Only then test advanced outputs
