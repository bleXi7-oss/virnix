# Current Phase — Timeline Architecture & Module Cleanup

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 9 (Gold Testing Framework) completed the taste evaluation infrastructure.
Phase 10 prepares Virnix for timeline intelligence — the ability to detect the strongest content moments from a timestamped transcript.

Two goals:
1. Clean up the `app/lib/prompts/` structure (consolidate scattered platform modules)
2. Build the isolated `app/lib/timeline/` module — deterministic, no AI calls, no persistence

---

## Structural Change: Prompts Platforms Consolidation

### What Moved

Five scattered platform modules consolidated into `app/lib/prompts/platforms/`:

| Old path | New path |
|----------|----------|
| `app/lib/prompts/hooks/index.ts` | `app/lib/prompts/platforms/tiktok.ts` |
| `app/lib/prompts/twitter/index.ts` | `app/lib/prompts/platforms/twitter.ts` |
| `app/lib/prompts/linkedin/index.ts` | `app/lib/prompts/platforms/linkedin.ts` |
| `app/lib/prompts/instagram/index.ts` | `app/lib/prompts/platforms/instagram.ts` |
| `app/lib/prompts/youtube/index.ts` | `app/lib/prompts/platforms/youtube.ts` |

**Why:**
- The old `prompts/hooks/` folder name collided conceptually with `intelligence/hooks.ts` (both named "hooks" but completely different things — TikTok openers vs. curiosity gap formulas)
- 5 scattered one-file-per-folder modules → 1 flat `platforms/` folder: cleaner, easier to scan
- The only consumer is `prompts/index.ts` — 5 import paths updated, nothing else changed

### What Did NOT Move

- `app/lib/ai/` — 8 files flat, already clean, restructuring would add import churn with no readability benefit
- `app/lib/outputCards.ts` — shared between AI layer and UI, moving it creates dependency awkwardness
- `app/components/` — 5 files, no subfolder needed

---

## New Module: `app/lib/timeline/`

6 files. Completely isolated. Zero imports from core generation, prompts, or UI.

### `types.ts`
- `MomentType`: 9 types (validation_hook, contrarian_insight, emotional_confession, story_turning_point, educational_gem, quote_moment, fomo_loss_frame, authority_proof, transformation_moment)
- `PlatformFit`: 7 platforms (tiktok, reels, shorts, twitter, linkedin, instagram, youtube)
- `TimelineMoment`: full moment descriptor (id, startTime, endTime, title, momentType, platformFit, suggestedHook, whyItWorks, emotionalTrigger, contentUse, confidenceScore, sourceTextPreview)

### `transcript-timestamps.ts`
- `parseTimestamp(ts)` — "MM:SS" or "HH:MM:SS" → seconds
- `formatTimestamp(seconds)` — seconds → "MM:SS" or "HH:MM:SS"
- `detectTimestampedLines(transcript)` — scan transcript for `00:42`, `[1:23]`, `(01:02:15)` etc.
- `groupLinesIntoSegments(lines)` — convert to `TranscriptSegment[]` with start/end times and text

### `moment-scoring.ts`
- `scoreMoment(text)` — deterministic heuristic scoring per segment
- Signal word lists per moment type (validation, contrarian, confession, story, educational, quote, FOMO, authority, transformation)
- Specificity bonus (+15) for numbers, percentages, multipliers, timeframes
- Returns: score (0–100), momentType, emotionalTrigger, platformFit[], reason

### `moment-detector.ts`
- `detectTimelineMoments(transcript)` — main entry point
- Parses timestamps, scores segments, returns top 8 moments above score threshold 10
- **Never throws** — returns `[]` gracefully on any failure or missing timestamps
- **Zero AI calls** — entirely deterministic

### `formatter.ts`
- `formatTimelineMomentsForPrompt(moments)` — compact block for optional future prompt injection
- `formatMomentReport(moment)` — human-readable single-moment report

### `index.ts`
- Public API barrel — all types and functions exported

---

## Integration Status

**Timeline detection is NOT active in generation by default.**

The module exists as ready-to-use infrastructure. Connecting it to generation requires one decision:
- Add `detectTimelineMoments(transcript)` call in `generate.ts`
- Optionally inject `formatTimelineMomentsForPrompt(moments)` into the prompt

This is deferred until the module is validated against real timestamped transcripts (see known limitations in `docs/TIMELINE_MOMENT_DETECTION.md`).

---

## Removal Guarantee

Deleting `app/lib/timeline/` entirely has **zero impact** on:
- Core generation pipeline
- Prompts or intelligence layer
- UI components or output cards
- Provider, parser, or diagnostics
- Any other existing module

No other file imports from `app/lib/timeline/`.

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Behavioral regression: ✅ none — mock mode and real AI generation unchanged
- Timeline module: ✅ TypeScript compiles, isolated, never throws
