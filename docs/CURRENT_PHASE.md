# Current Phase — Transcript Quality Intelligence

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 15 validated that output quality is bounded by transcript psychological richness.
Phase 16 operationalizes that insight: Virnix now evaluates the transcript itself and
tells creators whether their content has strong clipable moments — before they see the output.

---

## What Changed

### New: `app/lib/timeline/transcript-quality.ts`

`evaluateTranscriptQuality(moments: TimelineMoment[]): TranscriptQualityReport | null`

Uses the already-detected timeline moments to compute:
- `overallScore` (0–100) — composite psychological density, for diagnostics only
- `clipability` ("low" | "medium" | "high") — the creator-facing classification
- `strongestSignals` — top 3 moment types by weighted contribution
- `weaknesses` — honest gaps (shown for medium/low only)
- `creatorFit` — platform recommendations derived from present moment types
- `emotionalDensity`, `educationalDensity`, `psychologicalRichness` — breakdown metrics
- `summary` — creator-native 1–2 sentence honest assessment

Zero new API calls. Zero new transcript parsing. Pure downstream computation on the
already-detected moments. Returns `null` when no moments — no UI rendered.

Type weights: validation_hook=20, emotional_confession=18, mechanism_reframe=16,
transformation_moment=15, story_turning_point=14, contrarian_insight=12, fomo_loss_frame=12,
educational_gem=8, authority_proof=8, quote_moment=6.

Scale factor 2.0 calibrated against Phase 15 gold dataset validation results.

---

### New: `app/components/generation/TranscriptQualityCard.tsx`

Creator-facing quality card rendered **above** the ClipGuide section.

Layout:
```
━━━ Transcript Quality ━━━

🔥 High Clipability          ← or ⚠️ Medium / ○ Low

Strongest signals
  [Validation hook]  [Mechanism reframe]  [Emotional confession]

"Strong emotional arc detected — confession moments and mechanism reframes ground this
transcript in specific psychological tension. High short-form potential."

↳ [weakness, if medium/low]

Best fit: [TikTok] [Twitter] [LinkedIn]
```

Hidden cleanly when `transcriptQuality` is null (mock mode, no moments detected).
Matches existing ClipGuide section header style (fading divider + uppercase label).

---

### Updated: `app/lib/timeline/index.ts`

Exports `evaluateTranscriptQuality` and `TranscriptQualityReport`.

---

### Updated: `app/lib/types/generation.ts`

Added `transcriptQuality?: TranscriptQualityReport` to `GenerateResult`.

---

### Updated: `app/lib/ai/generate.ts`

Calls `evaluateTranscriptQuality(timelineMoments)` after timeline detection.
Adds `transcriptQualityScore` and `clipability` to diagnostics.
Adds `transcriptQuality` to `GenerateResult` return.

---

### Updated: `app/lib/ai/diagnostics.ts`

New fields: `transcriptQualityScore?: number`, `clipability?: "low" | "medium" | "high"`.
Log line includes `qualityScore=N clipability=X` when quality evaluation ran.

---

### Updated: `app/components/DebugPanel.tsx`

Two new rows in AI Diagnostics: `qualityScore` and `clipability`.

---

### Updated: `app/page.tsx`

- Added `transcriptQuality` state
- Renders `<TranscriptQualityCard report={transcriptQuality} />` above `<ClipGuide>`
- Resets `transcriptQuality` to null on handleReset
- Fixed Tailwind v4 canonical class: `h-[560px]` → `h-140`

---

### New: `docs/TRANSCRIPT_QUALITY_SYSTEM.md`

Full documentation: philosophy, signals, weights, metrics, honest limitations,
relationship to timeline moments and creator psychology.

---

## Render Order (phase === "done")

```
TranscriptQualityCard  ← NEW: psychological density assessment
ClipGuide              ← top 3 detected moments with hooks
OutputPanel            ← generated content cards
DebugPanel             ← developer diagnostics
```

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Mock mode: ✅ unaffected — no moments → no quality card rendered
- Fallback: ✅ empty moments → null → no UI
- Integration: moments → evaluator → GenerateResult → page state → component

---

## Positioning

Virnix can now honestly claim:
- "Find out which parts of your content have psychologically strong moments"
- "Detect psychological content density before you generate"
- "Understand where the emotional value is hiding in your transcript"

Cannot yet claim:
- "Predict virality" — explicitly avoided
- "Compare across creators" — score is relative within a transcript only
