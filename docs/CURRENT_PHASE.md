# Current Phase — Timeline Intelligence Activation

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 11 (Creator Gold Dataset) established the taste evaluation dataset across 12 real creators.
Phase 12 activates the timeline intelligence that was built-but-dormant since Phase 10.

The key insight from Phase 11: YouTube's transcript API returns segments with `offset` and `duration` metadata that was being discarded. Preserving it enables real timestamp-aware moment detection.

---

## What Changed

### New: `app/lib/timeline/build-timestamped-transcript.ts`

Converts raw `TranscriptResponse[]` from `youtube-transcript` into a timestamped string:

```
00:42 Your brain isn't resisting change.
00:48 It's protecting your identity.
01:14 Most creators think consistency is discipline.
```

Handles both offset formats automatically:
- **srv3 / InnerTube API** (primary): `offset` in milliseconds (integers)
- **Classic XML** (fallback): `offset` in seconds (floats)

Detection logic: checks for decimal parts first, then average duration magnitude.

---

### Updated: `app/lib/ai/transcript.ts`

Added `getTranscriptFull()` returning `{ transcript, timestampedTranscript }`.  
`getTranscript()` kept as a thin wrapper — no callers were broken.

---

### Updated: `app/lib/timeline/moment-scoring.ts`

Scoring improvements informed by gold dataset findings:

| Change | Effect |
|--------|--------|
| New `mechanism_reframe` type (16 pts) | Captures #1 viral pattern: Naval, Huberman, Peterson, Dan Koe |
| Expanded mechanism reframe signals | "it's not", "actually", "not about", "not just", "what you think is" |
| Specificity bonus raised to +20 (was +15) | Rewards "70 rejections", "$2,000/month", "40 years" |
| Motivation penalty −15 | Penalizes Gary Vee pattern: "hustle", "grind", "work harder" |
| Confession weight raised to 18 (was 15) | Strengthens detection of Bartlett/MFM-style failure stories |
| Validation weight raised to 22 (was 20) | Stronger identity-relief detection |

---

### Updated: `app/lib/timeline/moment-detector.ts`

**30-second window grouping** — the critical architectural change:

- YouTube API returns segments every 2–3 seconds
- Scoring 3-second slices produces noise (too little text)
- New `groupIntoWindows(segments, 30)` merges short segments into 30-second windows
- Scorers now see full thoughts and connected sentences
- Result: dramatically better detection quality on real transcripts

---

### Updated: `app/lib/timeline/formatter.ts`

- New `formatMomentsReport()` — full report for all moments
- Improved `formatMomentReport()` — score bar, source preview, platform tags
- `formatTimelineMomentsForPrompt()` — unchanged (ready for future prompt injection)

---

### Updated: `app/lib/types/generation.ts`

`GenerateResult` now includes `timelineMoments?: TimelineMoment[]`.

---

### Updated: `app/lib/ai/diagnostics.ts`

`AIDiagnostics` now includes `timelineMomentsDetected?: number`.  
`[VIRNIX_AI]` log line includes `moments=N` when detection runs.

---

### Updated: `app/lib/ai/generate.ts`

Timeline detection runs on every real AI generation:

```typescript
const timelineMoments = detectTimelineMoments(timestampedTranscript);
```

- Runs after transcript fetch, before AI call
- Zero AI tokens — purely deterministic
- Never throws — generation continues even if detection fails
- Moments included in `GenerateResult` and diagnostics count

---

### Updated: `app/components/DebugPanel.tsx` + `app/page.tsx`

When `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`, the dev panel now shows:

- "AI Diagnostics" section (unchanged)
- "Best Clip Opportunities — N detected" section (new, collapsible)
  - Each moment: timestamp range, type badge, confidence score
  - Source text preview (first 120 chars)
  - Suggested hook quote
  - Platform tags (TikTok / Twitter / LinkedIn etc.)

---

## Integration Status

**Active:** timestamp reconstruction → window detection → moments in result + debug panel  
**Not yet active:** prompt injection (infrastructure ready via `formatTimelineMomentsForPrompt`)  
**Not yet active:** public UI display of clip opportunities

---

## Removal Guarantee

If `app/lib/timeline/` is deleted, only 5 files need minor edits:
- `generate.ts` — remove import + 3 lines
- `transcript.ts` — revert `getTranscriptFull` → `getTranscript`
- `types/generation.ts` — remove `timelineMoments` field
- `diagnostics.ts` — remove `timelineMomentsDetected`
- `DebugPanel.tsx` + `page.tsx` — remove moments prop and panel section

Core generation, prompts, UI cards, provider, parser — all unaffected.

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Behavioral regression: ✅ none — existing generation flow unchanged
- Mock mode: ✅ unaffected (mock result returned before transcript fetch)
- Timeline: ✅ activates on real AI generations, graceful fallback to []
