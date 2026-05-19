# Transcript Quality System

## Philosophy

Virnix already detects the strongest psychological moments in a transcript. This system
goes one level higher: it uses those detected moments to evaluate the transcript itself.

The output answers a creator's real question: **"Does my content actually have strong clipable moments?"**

This is NOT:
- virality prediction
- engagement forecasting
- fake AI scoring with invented numbers
- "probability of going viral"

This IS:
- psychological content density detection
- honest classification of clipability into Low / Medium / High
- signal-based reasoning about where emotional value lives in the transcript
- creator-native summary that feels honest rather than algorithmic

---

## What the Score Means

The `overallScore` (0–100) is a composite of:
- The psychological type weight of each detected moment (`validation_hook` = 20, `emotional_confession` = 18, etc.)
- That moment's confidence score (how many signal words appeared in its 30-second window)
- Normalized across the top-5 moments to reflect density, not length

**This score is shown in developer diagnostics only — not to creators.**

What creators see is the `clipability` bucket: `high`, `medium`, or `low`.
These buckets are calibrated to correspond to creator-intuitive quality levels:

| Bucket | Threshold | Meaning |
|--------|-----------|---------|
| High   | score ≥ 58 | Rich psychological content — strong clip potential across short-form platforms |
| Medium | score ≥ 30 | Solid content but limited emotional contrast — medium repurposing potential |
| Low    | score < 30 | Educational or generic structure — limited short-form clip potential |

**What the score does NOT mean:**
- It is not a predictor of real-world views, shares, or engagement
- It does not compare across creators — only evaluates within the detected moments
- A "Low" score does not mean the content is bad — it means the detected moment types
  have lower short-form clip potential (e.g., educational clarity vs confession arc)

---

## Signals Used

All signals come from the already-detected `TimelineMoment[]` — zero new API calls.

### Moment type weights (psychological value as a clip anchor)

| Moment Type | Weight | Why |
|------------|--------|-----|
| `validation_hook` | 20 | Identity relief → highest short-form resonance |
| `emotional_confession` | 18 | Vulnerability builds trust faster than credentials |
| `mechanism_reframe` | 16 | Paradigm-shift openers drive saves/shares |
| `transformation_moment` | 15 | Identity-level aspiration — strong story arc |
| `story_turning_point` | 14 | Narrative tension drives completion |
| `contrarian_insight` | 12 | Pattern interrupt — strong for Twitter/LinkedIn |
| `fomo_loss_frame` | 12 | Loss aversion 2× stronger than gain framing |
| `educational_gem` | 8 | Save-worthy but limited emotional punch |
| `authority_proof` | 8 | Credibility without emotional engagement |
| `quote_moment` | 6 | Borrowed authority — lowest clip impact |

### Derived metrics

**emotionalDensity** (0–100): share of moments that are validation_hook, emotional_confession,
transformation_moment, or story_turning_point. High emotional density → TikTok/Reels fit.

**educationalDensity** (0–100): share of moments that are educational_gem or authority_proof.
High educational density with low emotional density → long-form only.

**psychologicalRichness** (0–100): diversity of premium moment types.
Each unique premium type adds 20 points (capped at 100). A transcript with 5 different
premium types (validation + confession + reframe + story + contrarian) = 100 richness.
Three mechanism_reframes and nothing else = 20 richness.

**strongestSignals**: top 3 moment types by cumulative weighted contribution.

**creatorFit**: platforms derived from which moment types are present:
- validation_hook / emotional_confession / transformation_moment → TikTok, Reels
- mechanism_reframe / contrarian_insight → Twitter, LinkedIn
- story_turning_point → YouTube, TikTok
- fomo_loss_frame → TikTok, Twitter
- educational_gem / authority_proof → LinkedIn, YouTube
- quote_moment → Instagram

**weaknesses**: surfaces only for Medium and Low transcripts — identifies what's missing
(confession arc, identity tension, mechanism reframes). Not shown for High transcripts.

---

## What It Detects Well

- **Confession arcs** (Bartlett, MFM-style): emotional_confession + story_turning_point
  → clear High clipability
- **Mechanism reframe content** (Huberman, Naval): multiple mechanism_reframe at reasonable
  confidence → High or solid Medium
- **Validation-heavy content** (Ali Abdaal procrastination): validation_hook signals
  → High with strong TikTok/Reels fit
- **Specificity bonus**: moments with numbers, dollar amounts, timeframes score higher
  confidence from the underlying detector → lifts overall score

---

## What It Does NOT Detect Well

- **Implicit emotions**: psychological weight that exists in tone, pacing, or context
  — not in specific signal words. A profound statement with zero signal words scores 0.
- **Non-English content**: signal word lists are English-only. Non-English transcripts
  will score Low regardless of actual quality.
- **Short transcripts**: fewer than 3 moments → limited signal surface. Score will be
  conservative.
- **Keyword near-misses**: "isn't clearing" ≠ "not clearing" in signal matching.
  Contracted forms don't match un-contracted signal words. This is a known limitation
  of heuristic keyword matching.

---

## Relationship to Timeline Moments

The quality system is a pure downstream consumer of `detectTimelineMoments()` output.
It adds no new detection logic, no new API calls, no new transcript parsing.

```
detectTimelineMoments(timestampedTranscript)
  → TimelineMoment[]
      → evaluateTranscriptQuality(moments)   ← this system
          → TranscriptQualityReport
```

If `detectTimelineMoments` returns `[]` (no moments detected), `evaluateTranscriptQuality`
returns `null` and no quality card is shown. The fallback is clean — no broken UI.

---

## Relationship to Creator Psychology

The weights mirror Virnix's gold dataset findings:

1. Confession + specific story = highest virality (Bartlett archetype → High)
2. Mechanism reframe + specificity = strong medium (Hormozi, Huberman → Medium–High)
3. Educational survey = lowest clipability (Peterson, GaryVee → Low–Medium)

This matches real observed output quality from Phase 15 validation across 12 creator transcripts.
The system is calibrated to these archetypes, not to generic engagement metrics.

---

## Honest Limitations Summary

1. The score is relative within a transcript — it does not compare creators
2. High clipability does not guarantee viral performance
3. Low clipability does not mean the content is bad — it means it's harder to clip
4. The underlying signal detection (moment-scoring.ts) is heuristic keyword matching —
   it misses context, misses contracted forms, and can be fooled by dense educational jargon
5. Never describe this as "AI predicts virality" — describe it as
   "detect which parts of your content have psychologically strong moments"

---

## Module Location

```
app/lib/timeline/transcript-quality.ts   ← evaluator + TranscriptQualityReport type
app/components/generation/TranscriptQualityCard.tsx ← UI component
```

Exported via `app/lib/timeline/index.ts` alongside the rest of the public timeline API.

---

## Removal

If this feature needs to be removed:
- Delete `app/lib/timeline/transcript-quality.ts`
- Delete `app/components/generation/TranscriptQualityCard.tsx`
- Remove `evaluateTranscriptQuality`, `TranscriptQualityReport` from `app/lib/timeline/index.ts`
- Remove `transcriptQuality?: TranscriptQualityReport` from `app/lib/types/generation.ts`
- Remove `evaluateTranscriptQuality` import and 4 lines from `app/lib/ai/generate.ts`
- Remove `transcriptQualityScore`, `clipability` from `app/lib/ai/diagnostics.ts`
- Remove `TranscriptQualityCard` import, state, and render from `app/page.tsx`
- Remove `qualityScore` / `clipability` rows from `app/components/DebugPanel.tsx`

No other modules affected. Core generation, prompts, parser, providers — all unchanged.
