# Virnix — Phase History

Chronological log of completed development phases.

---

## Phase 0 — Foundation (pre-2026-05-19)

**Commits up to:** `62cfc8c`

### What Was Built
- Next.js App Router + Tailwind CSS + Vercel deployment
- Premium dark/light-mode landing page
- Mock AI flow (hardcoded demo cards, zero cost, zero API)
- YouTube transcript fetch via `youtube-transcript`
- Modular prompt engine (platform-specific tone/format modules)
- Creator psychology system (storytelling patterns, anti-generic rules)
- Variation engine (6 emotional angles × multiple style combos)
- Feature flag system (`NEXT_PUBLIC_FLAG_*`)
- Analytics event tracking stub (typed, no provider connected)
- ErrorBoundary system
- Provider abstraction (`AIProvider` interface)
- AnthropicProvider (raw fetch, no SDK)
- Safe JSON parser with `coerceCoreOutput` fallback
- Transcript chunking helpers
- Intelligence layer (hooks, psychology, platforms, emotions, retention, storytelling)
- Prompt-context connector (injects story arc, hook formula, retention rule)
- Advanced outputs (blog, timestamps, short-form — behind flag)

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- Real AI: ⏳ not yet tested with live key

---

## Phase 1 — Real AI Runtime Readiness (2026-05-19)

**Commit:** `982bc3a` — "Validate real AI runtime readiness"

### What Was Done
- `npm.cmd install` → build → lint all confirmed clean
- `.env.example` updated with feature flag vars and correct localhost port
- `.gitignore` updated to exclude `.claude/` session data
- `docs/REAL_AI_TESTING.md` updated:
  - Windows `npm.cmd` instructions added
  - Local `.env.local` example added
  - Local mock test steps added
  - Local real AI test steps added
  - Rollback instructions expanded
  - Stale "no runtime testing done" note removed

### No Code Changes Were Needed
All AI layer code (provider, parser, schemas, generate, chunker, intelligence) passed
validation review without modifications. Architecture was already production-ready.

---

## Phase 2 — Real AI Execution Hardening (2026-05-19)

**Commit:** (see git log for hash)

### What Was Built
1. **AI diagnostics** (`app/lib/ai/diagnostics.ts`)
   — `AIDiagnostics` interface + `logDiagnostics()` → `[VIRNIX_AI]` log line

2. **Retry + timeout resilience** (`app/lib/ai/provider.ts`)
   — 45s `AbortController` timeout, 2-retry exponential backoff (1s → 2s)
   — `CompletionResult` return type with retryCount + stopReason

3. **Improved JSON extraction** (`app/lib/ai/parser.ts`)
   — `extractJSON()` now uses bracket counting (not `lastIndexOf`)
   — `extractLargestJsonObject()` — deep-scan fallback, exported for testing
   — `ParseOutcome` return type with `parseRepaired` + `coercionUsed` flags

4. **Quality scoring** (`app/lib/intelligence/quality.ts`)
   — `hasStrongHook()`, `hasCuriosityGap()`, `hasPlatformLanguage()`, `hasEmotionalWords()`
   — `estimateViralityScore()` → 0–100 composite heuristic

5. **Best-output selection** (`app/lib/ai/generate.ts`, `app/lib/ai/schemas.ts`)
   — Advanced prompt now requests `tiktok_alt` and `youtube_alt`
   — Both scored; stronger one used in final cards
   — One API call, ~300–500 extra output tokens

6. **Developer debug panel** (`app/components/DebugPanel.tsx`)
   — Collapsible panel below output cards
   — Gated by `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`
   — Shows all `AIDiagnostics` fields, no sensitive info

7. **Smart segment selection** (`app/lib/ai/chunker.ts`)
   — `selectBestSegment()` now scores 500-word segments for content density
   — Prefers questions, signal words, specificity; penalizes sponsor/filler

8. **Local smoke test** (`scripts/test-real-ai.ts`)
   — Tests parser, quality scorer, chunker with hardcoded sample data
   — Zero API calls, zero cost

9. **Feature flags** — `dev_debug` added to `flags.ts`

10. **Type updates**
    — `GenerateResult.diagnostics?: AIDiagnostics`
    — `AIProvider.complete()` → `CompletionResult`
    — `parseAnthropicResponse()` → `ParseOutcome`

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Real AI: ⏳ requires ANTHROPIC_API_KEY
- Browser UI: ⏳ manual check required

---

## Phase 3 — Real AI Quality Test Kit (2026-05-19)

**Commit:** (see git log for hash)

### What Was Done

No code changes. Documentation and test fixtures only.

1. **Test fixtures** (`docs/test-fixtures/`)
   — `creator-business-short.md`: creator/business advice, ~280 words, trust vs. audience size theme
   — `podcast-story-short.md`: personal transformation story, ~290 words, burnout arc
   — `educational-short.md`: compound attention concept, ~270 words, data-backed explanation

2. **Output quality checklist** (`docs/OUTPUT_QUALITY_CHECKLIST.md`)
   — 8 output types: TikTok, Twitter, LinkedIn, Instagram, YouTube Titles, Short-Form, Timestamps, Blog
   — 7 scoring criteria × 5 max = 35 points per card
   — Platform-specific red-flag checks per section
   — Overall session summary table with diagnostics slots

3. **First real AI test plan** (`docs/FIRST_REAL_AI_TEST_PLAN.md`)
   — 10-phase step-by-step guide from env setup through output review
   — Exact terminal log field expectations with concern thresholds
   — Rollback instructions (local + Vercel)
   — Known issues table

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- Real AI: ⏳ requires ANTHROPIC_API_KEY
- Test fixtures: ✅ 3 original transcripts ready

---

## Phase 4 — Mock Runtime QA (2026-05-19)

**Commit:** (see git log for hash)

### What Was Done

No new features. Targeted fixes from code + API review.

**API tested (mock mode):**
- HTTP 200 on valid YouTube URL → 5 cards, correct diagnostics shape
- HTTP 400 on empty URL, invalid URL, missing field — all with `ok: false` + descriptive error

**Mock content reviewed:**
All 5 cards pass quality bar — strong hooks, platform-native tone, numbers, curiosity gaps, no generic language.

**Fixes applied:**

1. `DebugPanel` moved outside `ErrorBoundary` in `app/page.tsx`
   — Prevents a debug panel crash from hiding the output panel via the error boundary

2. Tailwind v4 canonical class updates in `app/page.tsx`
   — `bg-gradient-to-{b,r,l}` → `bg-linear-to-{b,r,l}`
   — `duration-[2400ms]` → `duration-2400`

3. `charCount` labels corrected in `app/lib/outputCards.ts`
   — TikTok: `~280` → `~240`, Twitter: `~1,800` → `~1,400`, Instagram: `~390` → `~430`, YouTube: `~295` → `~280`

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- API (mock): ✅ all paths verified
- Real AI: ⏳ requires ANTHROPIC_API_KEY

---

## Phase 5 — Prompt Quality Polish (2026-05-19)

**Commit:** (see git log for hash)

### What Was Done

No new features, no dependencies, no architecture changes.
Targeted prompt quality improvements across 6 files.

1. **Twitter** (`app/lib/prompts/twitter/index.ts`)
   — Added middle-tweet renewal directive to TWITTER_TONE
   — Tweet 1 format: "withholds the proof" made explicit

2. **LinkedIn** (`app/lib/prompts/linkedin/index.ts`)
   — Added founder/operator voice directive to LINKEDIN_TONE
   — Added passive-observer phrase avoidance to LINKEDIN_FORMAT

3. **Instagram** (`app/lib/prompts/instagram/index.ts`)
   — Added "new idea = new line" spacing rule to INSTAGRAM_FORMAT
   — Extended never-close-with to include 'Tag a friend!'

4. **YouTube** (`app/lib/prompts/youtube/index.ts`)
   — Added formula-diversification rule to YOUTUBE_TITLE_RULES

5. **Cleanup** (`app/lib/prompts/cleanup/index.ts`)
   — Added contrast-creates-tension rule to CLEANUP_RULES
   — Activates the most impactful VIRAL_FORMATTING_RULES technique

6. **Prompt assembler** (`app/lib/prompts/index.ts`)
   — TikTok section (buildPrompt + buildAdvancedPrompt): 2 lines → 5 lines
   — Short-Form: added filler-transition removal + momentum rule
   — Blog: added skimmability + no-SEO-filler rules

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- Real AI: ⏳ requires ANTHROPIC_API_KEY

---

## Phase 8 — Intelligence Consolidation (2026-05-19)

**Commit:** (see git log for hash)

### Context

Notion research analysis (Phase 7 — analysis only, no commits) found most Notion intelligence was already implemented in the current architecture, but the codebase had accumulated dead code: 3 entire intelligence modules never imported, 14 unused exports, and 3 missing high-leverage mechanisms confirmed across 12+ creator profiles.

### What Was Removed
- `intelligence/emotions.ts` — deleted (4 exports, zero runtime use)
- `intelligence/psychology.ts` — deleted (4 exports, zero runtime use)
- `intelligence/platforms.ts` — deleted (4 exports, zero runtime use)
- 11 dead exports trimmed from hooks.ts, retention.ts, storytelling.ts
- `CURIOSITY_TRIGGERS`, `CTA_PATTERNS` from psychology/index.ts (not imported)
- `HOOK_PATTERNS` from hooks/index.ts (not imported)
- `VIRAL_FORMATTING_RULES` from cleanup/index.ts (not imported)

### What Was Added
- 3 new TIKTOK_OPENING_LINES: validation hook, FOMO/loss framing, withheld knowledge
- Anti-fake-motivation rule to ANTI_GENERIC_RULES
- Self-reflection trigger in both TikTok prompt sections
- `hasSpecificDetail()`, `hasSelfReflection()`, `hasHumanTone()` in quality.ts
- Expanded EMOTIONAL_WORDS with anxiety, broken, death, fear, threat, danger

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Real AI: ✅ tested — validation hooks and self-reflection confirmed present in output

---

## Phase 6 — AI Cost and Latency Optimization (2026-05-19)

**Commit:** (see git log for hash)

### Context

First real AI generation (Phase 5 test) succeeded:
- provider=anthropic, elapsed=26158ms, ~4944 estimated input tokens
- Estimated ~$0.3814 (Opus pricing), score=70, retries=0
- Twitter/LinkedIn quality strong; TikTok hook slightly generic

### What Was Changed

1. **Model** (`app/lib/ai/provider.ts`)
   — `claude-opus-4-7` → `claude-sonnet-4-6` (~5x cheaper, ~2x faster)

2. **Timeout** (`app/lib/ai/provider.ts`)
   — 45s → 30s (Sonnet responds faster)

3. **maxTokens** (`app/lib/ai/generate.ts`)
   — Core: 4096 → 2048 (actual output ~900-1200 tokens)
   — Advanced: 6144 → 3500 (actual output ~2000-2500 tokens)

4. **Pricing constants** (`app/lib/ai/chunker.ts`)
   — Input: $15/M → $3/M; Output: $75/M → $15/M (Sonnet rates)

5. **TikTok opener** (`app/lib/prompts/hooks/index.ts`)
   — Replaced "Stop scrolling. This one's different." (ad-language)
   — With "Everyone's doing this backwards." (tension + knowledge gap)

6. **Deduplication** (`app/lib/prompts/cleanup/index.ts`)
   — Removed "Replace vague with specific" — duplicate of ANTI_GENERIC_RULES

7. **TikTok specificity** (`app/lib/prompts/index.ts`)
   — Added "Name something specific from this transcript — no claim that could apply to any video."
   — Applied to both buildPrompt and buildAdvancedPrompt

8. **Blog SEO filler** (`app/lib/prompts/index.ts`)
   — Removed 'In today's world' from advanced blog filler list (duplicate of ANTI_GENERIC_RULES)

### Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Estimated cost (core) | ~$0.38 | ~$0.05 |
| Expected latency | ~26s | ~8–12s |
| TikTok hook | generic risk | transcript-specific |

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- Real AI: ⏳ requires re-run to verify with ANTHROPIC_API_KEY

---

## Phase 9 — Gold Testing & Taste Framework (2026-05-19)

**Commit:** (see git log for hash)

### What Was Done

No code changes. Documentation and evaluation framework only.

**Created `docs/gold-tests/` folder structure:**
- `EVALUATION_TEMPLATE.md` — per-generation quality evaluation template (transcript metadata, per-output scoring, emotional resonance map, platform winner, "Would I post this?" judgment)
- `COMPARISON_FRAMEWORK.md` — markdown-only before/after comparison system with delta scoring guide and phase-to-phase tracking table
- `transcripts/`, `results/`, `analysis/` — empty folders ready for gold dataset population

**Created pattern libraries:**
- `docs/GOLD_PATTERNS.md` — 9 recurring winning patterns with evidence and signal hierarchy ("Virnix taste manual")
- `docs/FAILURE_PATTERNS.md` — 10 failure patterns with severity ratings, fix status, and detection checklist

**Created targeting and test planning docs:**
- `docs/CREATOR_SEGMENTS.md` — 3-tier creator type → output quality map with quick selector and targeting implications
- `docs/TEST_TRANSCRIPT_IDEAS.md` — curated test list (Priority 1–4 creators, danger transcripts, dream tests, scoring matrix)

**Created strategic analysis:**
- `docs/STRATEGIC_REPORT.md` — brutally honest assessment of strengths, moat, failures, what to optimize, what not to touch, taste moat summary

### Validation Status at End of Phase
- Build: ✅ clean
- Lint: ✅ clean
- Gold dataset: ⏳ 0 entries — framework ready, transcripts not yet added

---

## Phase 10 — Timeline Architecture & Module Cleanup (2026-05-19)

**Commit:** (see git log for hash)

### What Was Done

**Prompts folder consolidation:**
- 5 scattered platform prompt folders (`hooks/`, `twitter/`, `linkedin/`, `instagram/`, `youtube/`) → single `platforms/` subfolder
- Resolved name collision between `prompts/hooks/` (TikTok openers) and `intelligence/hooks.ts` (curiosity gap formulas)
- `prompts/index.ts` imports updated — only consumer, 5 paths changed, zero behavior change

**New isolated timeline module (`app/lib/timeline/`):**
- `types.ts` — TimelineMoment, MomentType (9 types), PlatformFit (7 platforms)
- `transcript-timestamps.ts` — timestamp parsing (MM:SS, HH:MM:SS, brackets, parens), segment grouping
- `moment-scoring.ts` — deterministic heuristic scoring with 9 signal word lists, specificity bonus, platform fit lookup
- `moment-detector.ts` — `detectTimelineMoments()`: never throws, returns [] if no timestamps, top 8 moments
- `formatter.ts` — `formatTimelineMomentsForPrompt()`, `formatMomentReport()`
- `index.ts` — public API barrel

**Timeline NOT active in generation** — module exists as isolated infrastructure. No prompts injected yet.

**New doc:** `docs/TIMELINE_MOMENT_DETECTION.md` — full feature spec, how it works, known limitations, future roadmap.

**Updated:** `docs/ARCHITECTURE.md` — added Platforms and Timeline modules, added Folder Structure section.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Behavioral regression: ✅ none — existing generation unchanged
- Timeline module: ✅ compiles, isolated, never throws

---

## Phase 12 — Timeline Intelligence Activation

**Date:** 2026-05-19
**Commit:** (pending)

### Context

Phase 10 built the timeline module but left it dormant — YouTube transcript segments with `offset`/`duration` metadata were being discarded. Phase 12 activates real timestamp-aware moment detection using that metadata.

### What Was Built

**New file: `app/lib/timeline/build-timestamped-transcript.ts`**
- `buildTimestampedTranscript(RawSegment[])` — converts raw YouTube segments to `"MM:SS text\n..."` format
- Auto-detects offset unit (milliseconds vs seconds) by checking float decimals + average duration magnitude
- Handles both srv3 (InnerTube/ms) and classic XML (seconds) formats from youtube-transcript library

**Updated: `app/lib/ai/transcript.ts`**
- Added `getTranscriptFull()` returning `{ transcript, timestampedTranscript }`
- `getTranscript()` kept as thin wrapper — no callers broken

**Updated: `app/lib/timeline/moment-scoring.ts`** (gold dataset improvements)
- New `mechanism_reframe` moment type — the #1 viral pattern from Phase 11 gold dataset
- Mechanism reframe signals: "it's not", "actually", "not about", "not just", "what you think is"
- Specificity bonus raised: +20 (was +15)
- Motivation penalty: −15 for hustle/mindset content (Gary Vee pattern)
- Confession weight: 18 (was 15), Validation weight: 22 (was 20)

**Updated: `app/lib/timeline/moment-detector.ts`**
- Added `groupIntoWindows(segments, 30s)` — merges 3-second YouTube segments into 30-second scoring windows
- Scoring now operates on full thoughts instead of 3-second slices
- Dramatically improved detection quality on real transcripts

**Updated: `app/lib/timeline/formatter.ts`**
- New `formatMomentsReport()` — full multi-moment report
- Improved `formatMomentReport()` — score bar, source preview, platform tags

**Updated: types, diagnostics, generate.ts**
- `GenerateResult.timelineMoments?: TimelineMoment[]`
- `AIDiagnostics.timelineMomentsDetected?: number`
- `generate.ts` calls `detectTimelineMoments(timestampedTranscript)` after transcript fetch
- Detection runs on every real AI generation — zero extra tokens, zero extra latency

**Updated: DebugPanel + page.tsx**
- Dev panel (NEXT_PUBLIC_FLAG_DEV_DEBUG=true) now shows "Best Clip Opportunities" section
- Each moment: timestamp, type badge, confidence, source preview, suggested hook, platform tags

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Behavioral regression: ✅ none — generation, prompts, UI cards all unchanged
- Timeline: ✅ active on real AI generations, graceful [] fallback

---

## Phase 13 — Clip Guide UI

**Date:** 2026-05-19
**Commit:** (pending)

### Context

Phase 12 built the detection pipeline and exposed moments in the dev debug panel. Phase 13 surfaces that intelligence as the first public-facing creator feature — psychological moment discovery visible to all users.

### What Was Built

**New: `app/components/generation/ClipMomentCard.tsx`**
- Renders a single detected moment with timestamp, type badge, confidence indicator, hook, why-it-works, platform tags, source preview
- Left border accent per moment type (amber/violet/rose/sky/emerald/cyan/zinc)
- Badge background tint per type for visual distinction without dashboard chaos
- Confidence dot: emerald (≥70) / amber (40–69) / zinc (<40) + text label
- `opacity-0 + animate-[fade-in-up]` with staggered `animationDelay` per rank

**New: `app/components/generation/ClipGuide.tsx`**
- Section container: divider-header ("Best moments to clip") matching OutputPanel style
- Shows top 3 moments in a single `rounded-xl border` card with thin `h-px` dividers between moments
- Footer: "{N} moments detected · ranked by psychological impact"
- Returns `null` when no moments — no layout shift

**Updated: `app/page.tsx`**
- `ClipGuide` imported and rendered above `OutputPanel` in `phase === "done"` block
- Guard: `timelineMoments && timelineMoments.length > 0`
- No new state, no new props

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Behavioral regression: ✅ none — mock mode unaffected, no moments = no section
- Mobile: ✅ flex-wrap meta row, line-clamp preview

---

## Phase 14 — Prompt Grounding via Timeline Intelligence

**Date:** 2026-05-19
**Commit:** (pending)

### Context

Phase 13 showed detected clip moments in the public UI. Phase 14 connects those moments into the AI prompt as lightweight creative scaffolding — grounding generation in the transcript's actual psychological peak moments.

### What Was Built

**Updated: `app/lib/timeline/formatter.ts`**
- New `selectMomentsForPrompt(moments)` — filters moments to ≤3 most prompt-worthy; priority types qualify at confidence ≥25, generic types only at ≥40 as fallback
- Rewrote `formatTimelineMomentsForPrompt()` — hook-text format: `"suggested hook" [type · Platform/Platform]`; returns "" when no moments qualify

**Updated: `app/lib/timeline/index.ts`**
- Exports `selectMomentsForPrompt`

**Updated: `app/lib/prompts/index.ts`**
- `buildPrompt(transcript, timelineContext = "")` and `buildAdvancedPrompt(transcript, timelineContext = "")` accept optional pre-formatted context string
- Injected after GENERATION PROFILE block, before "Apply this angle..." directive
- Empty string default: prompts are byte-for-byte identical to before when no moments

**Updated: `app/lib/ai/generate.ts`**
- Calls `formatTimelineMomentsForPrompt(timelineMoments)` before AI call
- Passes resulting string to prompt builders
- Tracks `timelineInjected` and `injectedMomentCount` in diagnostics

**Updated: `app/lib/ai/diagnostics.ts`**
- New fields: `timelineInjected?: boolean`, `injectedMomentCount?: number`
- Log line includes `timelineInjected=true(N)` when active

**Updated: `app/components/DebugPanel.tsx`**
- New `grounded` row: "yes · N moments" or "no"

### Token Impact

~80 tokens added when 3 moments inject. On a ~5000-token call, ~1.6% increase.

### Fallback Guarantee

Empty moments → `timelineContext = ""` → prompt builders receive default `""` → prompt identical to Phase 13 behavior.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Fallback: ✅ no moments = identical prompt
- Behavioral regression: ✅ none — mock mode unaffected

---

## Phase 15 — Timeline Grounding Validation

**Date:** 2026-05-19
**Commit:** (pending)

### Context

Phase 14 activated prompt grounding. Phase 15 measures whether it actually improves outputs.
This is an analysis-only phase — no production code changes.

### Method

12 real AI generations analyzed from `.gen_tests/` (generated with live Anthropic Sonnet 4.6 API, pre-Phase-14 outputs).

**Critical note**: all 12 outputs were generated before Phase 14 was pushed — no `timelineInjected` field in any diagnostics. Direct A/B comparison is not possible. Validation is structural and pattern-based.

### Creators Analyzed

Bartlett, Naval, Gadzhi, Hormozi, Ali Abdaal (×2), Huberman, Sinek, Dan Koe, MFM/Sam Parr, GaryVee, Peterson.

### Virality Score Distribution

| Score | Creator examples |
|-------|-----------------|
| 80–90 | Bartlett (90), Naval (80) |
| 40–55 | Gadzhi (55), Hormozi (50), Huberman/Sinek/Ali Abdaal (45) |
| 20–35 | Ali Abdaal passive (30), Dan Koe (30), MFM (30), GaryVee (25), Peterson (20) |

### Key Findings

1. **Base system is already strong for confessional transcripts.** Bartlett (90) and Naval (80) were produced without grounding — the model correctly identified the strongest psychological moments.

2. **Grounding's clearest benefit**: mid-tier transcripts (30–55) with one buried strong moment the model might otherwise average away (Huberman, MFM).

3. **Grounding paradox**: high-score transcripts (80+) don't need it; low-score transcripts (<25) lack qualifying moments to inject.

4. **Overfitting risks confirmed**: phrase echo (suggestedHook format creates verbatim anchor), type concentration (no diversity enforcement), no moment variety guarantee.

5. **Critical independent finding**: "Everyone's doing this backwards." appeared in 5/12 outputs (42%). TikTok opener pool (10 lines, 5 never used) needs expansion before user-visible repetition becomes a quality issue.

6. **Most important insight**: the quality ceiling is the transcript's psychological richness, not prompt sophistication. Grounding is insurance, not transformation.

### Created

`docs/TIMELINE_GROUNDING_VALIDATION.md` — full analysis with before/after hypotheses, risk inventory, format analysis, strategic conclusions.

### Validation Status at End of Phase
- Build: ✅ clean (no code changes)
- Lint: ✅ clean (no code changes)
- Runtime: ✅ no regressions
- Grounding A/B: ⏳ requires live API test on same transcript with grounding ON vs OFF

---

## Phase QA-A — Content System Full Audit

**Date:** 2026-05-20

### Context

After completing the UI surface polish phases (18–20), this phase audits the entire Virnix content generation system before Creator Energy Selection is added. The audit covers TikTok opener rotation, hook archetype coverage, all platform outputs, timeline/clip guide consistency, content intelligence honesty, grounding/hallucination risk, tonal mismatch risk, and architecture cleanliness.

### What Was Analyzed

Complete static review of all prompt engine, intelligence layer, timeline detection, AI generation, parser, and schema files. Existing smoke test run. New QA audit script created.

### Key Findings

**P0 (must fix before Creator Energy Selection):**
1. 9/26 (35%) of TikTok openers are creator-growth-specific — will cause severe tonal mismatch on medical, historical, educational, and non-creator content
2. Forced TikTok ending "Here's the exact system..." presupposes every transcript has a system — wrong for confessional, philosophical, or narrative content

**P1 (should fix soon):**
3. YouTube title formula vs. rules contradiction: "Nobody Talks About" appears as both a recommended formula AND a phrase to avoid
4. YouTube Timestamps (advanced): AI fabricates chapter positions — potential trust issue if users copy to YouTube
5. `selectBestOutputs()` in `generate.ts` uses `lastIndexOf("}")` approach — less robust than `extractJSON` from parser.ts

**P2 (polish):**
6. `viralityScore` naming inconsistent with "never describe as virality prediction" stance
7. "Stakes Escalation" story arc (STORY_ARC_FRAMEWORKS index 5) never mapped to any angle — dead code
8. False-positive detection signals in timeline: "i thought", "and then", "actually" too generic
9. Creator-specific hook prefix in `buildSuggestedHook`: "After working with hundreds of creators:"
10. Near-duplicate openers (after deduplication check — actually 0 true duplicates after stopword filtering)

**Architecture:** Clean. Modular. No coupling violations. No file overload. All changes achievable without architecture redesign.

### What Was Created

- `docs/qa/CONTENT_SYSTEM_QA_A.md` — comprehensive audit report with priority table and fix recommendations
- `scripts/qa/opener-audit.ts` — isolated QA script; checks opener pool size, creator-domain risk ratio, near-duplicates, YouTube contradiction, story arc dead code, and anti-generic rule coverage

### Test Results

- Existing `scripts/test-real-ai.ts`: ✅ PASS (parser, chunker, quality scorer, diagnostics)
- New `scripts/qa/opener-audit.ts`: ✅ Runs correctly — exits with failure when real issues present (P0 creator-domain ratio, P1 YouTube contradiction), clean passes on all other checks

### Safe to Proceed Verdict

**NO — fix P0 opener issues first, then proceed with Creator Energy Selection.**

Reasoning: Adding Creator Energy Selection on top of the current creator-domain-locked openers would create a three-layer mismatch (opener + ending + energy) on any non-creator transcript. P0 fixes are a half-day of focused work in `tiktok.ts`.

### Validation
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- No production code changed

---

## Phase 20 — Hero Glass Surface (UI-FIX-D)

**Date:** 2026-05-20

### Context

Phase 19 made the banner atmosphere clearly visible around the hero card. The card itself was still fully opaque (solid white / solid `#0a0a0a`), covering the atmosphere completely. This phase makes the hero card a premium frosted-glass surface so the banner is subtly visible both around AND through the card.

### What Changed

**`app/page.tsx` — hero card surface only**

| Property | Before | After |
|----------|--------|-------|
| Light fill | `bg-white` (opaque) | `bg-white/75` (75% opacity) |
| Light border | `border-zinc-200` | `border-zinc-200/70` (softened) |
| Dark fill | `dark:bg-[#0a0a0a]` (opaque) | `dark:bg-[#0a0a0a]/80` (80% opacity) |
| Dark border | `dark:border-zinc-800/60` | `dark:border-zinc-700/40` (softened) |
| Blur | none | `backdrop-blur-xl` (both modes, 24px) |

Shadow, inset highlight, and all other classes unchanged.

Surface hierarchy (light):
- Page: pearl `#f8f8f6`
- Banner: silver chrome at 22% opacity
- Hero card: frosted `bg-white/75 backdrop-blur-xl` — banner shows at ~25% through card
- Input: `bg-white` fully opaque — readable surface within frosted card
- Button: `bg-zinc-900` — strong chrome black, full contrast

### Visual Result

**Light mode**: banner silver-chrome atmosphere is now visible through the hero card, not just around it. The card reads as a pearl frosted glass panel sitting on the cinematic background. Text remains highly readable — 75% fill is above the threshold for legible contrast.

**Dark mode**: card has 20% see-through with blur. On a near-black background with 10% banner, the visual contribution is subtle but the `backdrop-blur-xl` creates the correct frosted material feel. Borders softened from `zinc-800/60` to `zinc-700/40` for a lighter chrome edge.

### Why This Is Premium, Not Cheap Glassmorphism

Cheap glassmorphism: low opacity, excessive blur, colorful gradient background, low readability.

This implementation: high opacity (75%/80%), controlled blur (24px), neutral pearl/chrome background, text contrast maintained, no colorful gradients, preserves all shadow and inset chrome highlights.

### Bottom-Left Icon Status

Moved to bottom-right in Phase 19 via `devIndicators: { position: "bottom-right" }`. Bottom-left is clear.

### Validation Status
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Dark mode: ✅ no regressions — dark shadow, inset highlight, input/button all unchanged

---

## Phase 19 — Visible Chrome Atmosphere (UI-FIX-C)

**Date:** 2026-05-20

### Context

Phase 18 improved light mode technically but the pearl atmosphere was barely visible in real screenshots (7% radial opacity). Light theme still read as plain off-white SaaS. This phase makes the atmosphere clearly visible and adds consistent depth hierarchy across hero card, atmospheric layer, and output cards.

### What Changed

**`next.config.ts`**
- `devIndicators: { position: "bottom-right" }` — moves the Next.js dev overlay button away from the bottom-left corner where it appeared as an unexplained stray UI element in screenshots. (Next.js 16 only accepts `position` in this config; it does not appear in production builds.)

**`app/page.tsx` — atmospheric layer**
- Replaced single weak pearl bloom (`rgba(160,160,175,0.07)`) with three-layer light-mode atmosphere wrapped in `dark:hidden`:
  - Primary silver radial bloom: `rgba(170,170,200,0.22)` — 3× more visible than previous 7%
  - Secondary crown bloom: `rgba(200,200,225,0.14)` — focused depth at the very top
  - Chrome edge line: `rgba(155,155,195,0.55)` 1px horizontal gradient at page top
  - `banner.png` shown in light mode with `[filter:grayscale(1)_brightness(1.8)] opacity-[0.22] mix-blend-multiply` — renders as silver/pearl chrome wave texture on pearl background
- Separated dark-mode banner into its own `hidden dark:block` div — clean light/dark split with no `opacity-0/dark:opacity` hack

**`app/page.tsx` — hero card shadow**
- Light-mode shadow deepened: `0_2px_4px/.04, 0_12px_40px/.08` → `0_2px_8px/.06, 0_16px_56px/.13` — card lifts more clearly from atmospheric background
- Dark-mode shadow unchanged

**`app/components/OutputCard.tsx`**
- Added resting light-mode shadow: `shadow-[0_1px_6px_rgba(0,0,0,0.05)]` — output cards now have visible depth on pearl background, not just on hover
- Hover shadow bumped from `.06` → `.08` intensity to maintain the lift contrast
- Dark-mode shadows unchanged

### Visual Delta

| Element | Before | After |
|---------|--------|-------|
| Light atmosphere | 7% radial bloom (invisible in screenshots) | 22% multi-layer bloom + silver banner texture |
| Banner in light | Hidden (`opacity-0`) | Visible: grayscale + brightness(1.8) + multiply blend |
| Hero card shadow | `0_12px_40px/.08` | `0_16px_56px/.13` — lifts more clearly |
| Output cards | No resting shadow | `0_1px_6px/.05` resting depth |
| Dev icon position | Bottom-left (stray appearance) | Bottom-right (clear, or hidden in prod) |

### Validation Status
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Dark mode: ✅ no regressions — all `dark:` classes preserved, dark banner in separate `hidden dark:block` wrapper

---

## Phase 18 — Premium Light Theme Polish

**Date:** 2026-05-20
**Commit:** (pending)

### Context

Dark theme reached premium black chrome standard in Phase 17 redesign. Light theme still presented as plain white SaaS dashboard — pure white background, flat plastic-looking cards, low contrast platform pills, generic button shadow. This phase brings light theme to the same premium tier: pearl white, soft depth, chrome glass card surfaces, intentional hierarchy.

### What Changed

**`app/globals.css`**
- `--background`: `#ffffff` → `#f8f8f6` (warm pearl off-white — base surface for all light-mode UI)

**`app/page.tsx`**
- Root div: `bg-white` → `bg-[#f8f8f6]` (matches new CSS var)
- Banner atmospheric: added light-mode pearl radial bloom (`radial-gradient ellipse 80% 60%, rgba(160,160,175,0.07)`) — analog of dark chrome banner; very restrained
- Banner fade divs: `from-white` → `from-[#f8f8f6]` (correct fade-to-background in both fades)
- Hero card: light-mode shadow upgraded from flat `shadow-[0_8px_40px_rgba(0,0,0,0.06)]` → `shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]` (adds inset top-edge chrome highlight — same system as dark mode, inverted)
- Headline emphasis span: `text-zinc-400` → `text-zinc-500` (intentional accent, not disabled-looking)
- Input field: `bg-zinc-100` → `bg-white` (white input on pearl background = natural layering depth), added soft `focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]` focus ring
- Generate button: shadow upgraded from `0_4px_20px_rgba(0,0,0,0.07)` → `0_4px_24px_rgba(0,0,0,0.14)` + inset highlight `inset_0_1px_0_rgba(255,255,255,0.07)` (premium chrome black, not flat plastic)
- Logo mark: `opacity-80` → `opacity-100` in light mode (V logo fully visible on pearl background)
- VIRNIX label: `text-zinc-400` → `text-zinc-500` (slightly more legible)
- Platform pills: `border-zinc-200 text-zinc-400` → `border-zinc-300 text-zinc-500` (contrast rescued from near-invisible)
- Dark mode: all `dark:` classes left unchanged — zero dark mode regression

### Visual Delta

| Element | Before | After |
|---------|--------|-------|
| Page background | Pure `#ffffff` | Pearl `#f8f8f6` |
| Hero card depth | Flat white card | White card elevated on pearl with chrome inset |
| Generate button | Flat dark plastic | Deep chrome black with subtle highlight |
| Platform pills | Near-invisible on white | Legible zinc-500 text on zinc-300 border |
| Headline accent | `zinc-400` (looked disabled) | `zinc-500` (intentional, premium) |
| Input surface | zinc-100 (same as background) | Pure white (naturally elevated) |

### Validation Status
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Dark mode: ✅ no regressions — all dark: classes preserved

---

## Phase 17 — TikTok Opener Quality Patch

**Date:** 2026-05-20
**Commit:** (pending)

### Context

Phase 15 validation identified "Everyone's doing this backwards." appearing in 5/12 outputs (42%). The `TIKTOK_OPENING_LINES` pool had only 10 entries with 5 never selected due to clustering. Opener repetition is the most visible quality defect and the fastest fix — no architecture changes, no API impact.

### What Changed

**Updated: `app/lib/prompts/platforms/tiktok.ts`**
- `TIKTOK_OPENING_LINES` expanded from 10 → 26 entries
- Added variety across 8 opener archetypes: curiosity gap, contrarian, identity shift, FOMO/loss framing, confession, mechanism reframe, harsh truth, practical/business insight
- No opener duplicates prior types; all remain creator-native, abrupt, algorithm-fast
- No prompt architecture changes, no scoring logic changes, no schema changes

### Expected Impact

- Opener variety: 10 → 26 entries, ~5× lower repetition probability per archetype
- "Everyone's doing this backwards." drops from ~42% exposure to ~3.8%
- Zero added latency, zero added tokens, zero API changes

### Validation Status
- Build: ✅ clean
- Lint: ✅ clean

---

## Phase 16 — Transcript Quality Intelligence

**Date:** 2026-05-19
**Commit:** (pending)

### Context

Phase 15 found: "The quality ceiling is the transcript's psychological richness."
Phase 16 operationalizes that insight — Virnix now evaluates transcript quality itself
and surfaces it to creators as a clipability assessment.

### What Was Built

**New: `app/lib/timeline/transcript-quality.ts`**
- `evaluateTranscriptQuality(moments)` → `TranscriptQualityReport | null`
- Zero new API calls — pure downstream computation on already-detected moments
- Weighted scoring: validation_hook=20, confession=18, mechanism_reframe=16, etc.
- `clipability`: "low" | "medium" | "high" — the creator-facing bucket
- `strongestSignals`, `weaknesses`, `creatorFit`, `summary` — all derived from moment data
- Returns `null` when empty — clean fallback, no UI rendered

**New: `app/components/generation/TranscriptQualityCard.tsx`**
- Creator-facing card rendered above ClipGuide
- Shows clipability rating (🔥 High / ⚠️ Medium / ○ Low), strongest signals, summary, platform fit
- Weaknesses shown only for medium/low transcripts (honest, not punishing)
- Hidden when no quality data (mock mode)

**Updated: 6 files** — `timeline/index.ts`, `types/generation.ts`, `ai/generate.ts`,
`ai/diagnostics.ts`, `page.tsx`, `components/DebugPanel.tsx`

**New doc: `docs/TRANSCRIPT_QUALITY_SYSTEM.md`**

### Calibration

Score ≥ 58 → High (Bartlett-type confession arc, Naval-type metaphor)
Score ≥ 30 → Medium (Huberman mechanism-heavy, Hormozi tactical)
Score < 30 → Low (Peterson philosophical, GaryVee motivational)

Calibrated against Phase 15 gold dataset findings across 12 creator transcripts.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Mock mode: ✅ no quality card rendered (correct)
- Fallback: ✅ null → no UI, no layout shift

---

## Phase 21 — Hero Card Transparency Polish (UI-POLISH-E, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Single targeted transparency adjustment to hero card surface.

- `app/page.tsx`: hero card light-mode fill `bg-white/75` → `bg-white/65`
- Dark mode, `backdrop-blur-xl`, input opacity, button unchanged

35% card transparency (up from 25%) lets the pearl-chrome banner atmosphere
show through more visibly while keeping text fully readable.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: banner atmosphere more visible through card
- Dark mode: no regression

---

## Phase 22 — Hero Card Transparency Polish (UI-POLISH-F, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Single targeted transparency adjustment to hero card surface.

- `app/page.tsx`: hero card light-mode fill `bg-white/65` → `bg-white/55`
- Dark mode, `backdrop-blur-xl`, input opacity, button unchanged

45% card transparency (up from 35%) lets the pearl-chrome banner atmosphere
show through clearly while keeping text readable.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: banner atmosphere clearly visible through card
- Dark mode: no regression

---

## Phase 23 — Hero Card Transparency Polish (UI-POLISH-G, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Increased transparency in both light and dark mode.

- `app/page.tsx` light: `bg-white/55` → `bg-white/45` (55% transparency)
- `app/page.tsx` dark: `dark:bg-[#0a0a0a]/80` → `dark:bg-[#0a0a0a]/65` (35% transparency)
- `backdrop-blur-xl`, chrome glow, input, button all unchanged

Banner chrome wave now shows clearly through the card surface in both modes.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: banner clearly visible through card
- Dark mode: banner clearly visible through card, premium feel maintained

---

## Phase 24 — Hero Card Transparency (UI-POLISH-H, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Large transparency jump on the hero card — banner now visible through the card surface.

- `app/page.tsx` light card: `bg-white/45` → `bg-white/30` (70% transparent)
- `app/page.tsx` dark card: `dark:bg-[#0a0a0a]/65` → `dark:bg-[#0a0a0a]/40` (60% transparent)
- `app/page.tsx` blur: `backdrop-blur-xl` → `backdrop-blur-lg` (both modes)
- Dark banner image: `opacity-[0.10]` → `opacity-[0.14]`

Input, button, chrome glow, inner highlight unchanged.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: pearl-chrome wave visible through card
- Dark mode: chrome wave visible through card

---

## Phase 25 — Hero Card True Glass Surface (UI-POLISH-I, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Decisive transparency jump to make the banner visibly readable through the card.

- `app/page.tsx` light card: `bg-white/30` → `bg-white/20` (80% transparent)
- `app/page.tsx` dark card: `dark:bg-[#0a0a0a]/40` → `dark:bg-[#0a0a0a]/25` (75% transparent)
- `app/page.tsx` blur: `backdrop-blur-lg` → `backdrop-blur-md` (12px, both modes)

Border, shadow, chrome glow, inner highlight, dark banner opacity (0.14) unchanged.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light + dark: banner wave visible through card surface

---

## Phase 26 — Hero Card Internal Atmosphere (UI-POLISH-K, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Replaced opacity-only approach with layered internal atmosphere inside the card.

- `app/page.tsx` card: `overflow-hidden` added
- Light: `bg-white/20` → `bg-white/40`, blur `md` → `lg`
- Dark: `dark:bg-[#0a0a0a]/25` → `dark:bg-[#0a0a0a]/52`, blur `md` → `lg`
- New internal atmosphere layer (z-0, absolute inset-0):
  - Light: banner.png grayscale+brightness(1.6) at opacity 0.18 + multiply blend + radial gradient
  - Dark: banner.png at opacity 0.12 + subtle radial highlight
- Content wrapped in `relative z-10`

Root cause of milky appearance: transparency showed only blurred background.
Fix: internal banner layer gives chrome texture *inside* the card boundary.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean

---

## Phase 27 — TikTok Domain Unlock + Closing Pool (QB-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Fixed P0 content domain-lock and P1-1 YouTube title contradiction identified in QA-A.

**P0-1 — TikTok opener pool:**
- Removed 9 creator-growth-specific openers (creator, followers, algorithm, 100k, views, best-performing post)
- Replaced with 9 domain-agnostic alternatives covering educational, medical, historical, philosophical, business, interview, and narrative content
- All 26 openers now domain-agnostic (0% creator-specific ratio, down from ~40–46%)
- Near-duplicate pair ("I was wrong for years" ≈ "I spent two years wrong") resolved

**P0-2 — TikTok forced ending:**
- Removed hardcoded `End with "Here's the exact system..."` instruction from both `buildPrompt` and `buildAdvancedPrompt`
- Added `TIKTOK_CLOSING_LINES` pool (8 domain-agnostic endings) to `tiktok.ts`
- Closing now uses `pickRandom(TIKTOK_CLOSING_LINES)` — same pattern as opener selection
- Endings cover: system/framework, reframe, practical takeaway, mistake, pattern, reveal, question, moment

**P1-1 — YouTube title contradiction:**
- Removed formula `"Curiosity gap: 'The [Thing] Nobody Talks About'"` from `YOUTUBE_TITLE_FORMULAS`
- Replaced with `"Curiosity gap: 'The Hidden [Thing] Behind [Common Outcome]'"`
- Eliminates the contradiction where YOUTUBE_TITLE_RULES explicitly bans "Nobody Talks About"

### Files Changed
- `app/lib/prompts/platforms/tiktok.ts` — opener pool rewritten, TIKTOK_CLOSING_LINES added
- `app/lib/prompts/index.ts` — import TIKTOK_CLOSING_LINES, `tiktokClosing = pickRandom(...)`, replace hardcoded ending in both builders
- `app/lib/prompts/platforms/youtube.ts` — formula contradiction fixed

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 creator-specific openers, 0 near-duplicates)
- YouTube formula vs. rules: ✅ consistent (no contradiction)

---

## Phase 28 — Creator Energy Selection (CE-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Added creator-native energy/angle steering before generation.

**New module: `app/lib/creator-energy/`**
- `types.ts` — `CreatorEnergyId` union + `CreatorEnergy` interface
- `options.ts` — 6 energy definitions (Tactical, Contrarian, Analytical, Reflective, Relatable, Harsh Truth)
  with per-energy `promptDirective` strings + `isValidEnergyId()` allowlist guard
- `prompt-context.ts` — `formatEnergyContext(energyIds)` → "" when empty, structured block when set

**New component: `app/components/CreatorEnergySelector.tsx`**
- Pill-style toggles matching ExamplesRow aesthetic (not a settings panel)
- "Balanced" pill = default clear state (active when nothing selected)
- Multiselect — one or more energies toggleable independently
- Visible in HeroCard at idle phase only; hidden during loading/done

**Wiring (4 modified files):**
- `app/lib/types/generation.ts` — `energyIds?: CreatorEnergyId[]` added to `GenerateRequest`
- `app/api/generate/route.ts` — server-side allowlist validation; unknown values silently dropped
- `app/lib/ai/generate.ts` — energyIds → `formatEnergyContext` → injected into prompts
- `app/lib/prompts/index.ts` — `buildPrompt/buildAdvancedPrompt` gain optional `energyContext` param
- `app/page.tsx` — state, `runGeneration(url, energies)`, HeroCard integration

**Behavior:**
- Empty selection (Balanced) = no-op; prompt identical to pre-CE-A
- 1–6 energies selected = directives + grounding rule injected into GENERATION PROFILE
- All platforms receive the energy steering (not TikTok-only)
- Grounding rule prevents hallucinated emotions/facts to satisfy energy choice

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS (0 failures)

---

## Phase 29 — Creator Energy QA (CE-QA-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Static validation of CE-A (Creator Energy Selection). No new features.

**P1 fix: `app/lib/creator-energy/prompt-context.ts`**
- Added `Priority:` instruction to `formatEnergyContext()` output
- Without it: model may apply random variation angle (curiosity/controversy/etc.) instead of creator-selected energy
- With it: creator energy is primary creative direction; variation profile provides structural scaffolding only

**New: `scripts/qa/creator-energy-audit.ts`**
- 9-section static audit, no API calls, $0 cost
- Sections: balanced/empty mode, single-energy formatting (6×), multi-energy combinations (3 combos), allowlist validation (6 valid + 10 invalid), prompt injection position, balanced prompt integrity, directive specificity, variation angle priority, domain safety grounding
- 3 transcript types: creator/business, science, philosophy
- Run 1: 1 failure + 6 warnings → P1 fix applied → Run 2: ✅ ALL CHECKS PASS

**New: `docs/qa/CREATOR_ENERGY_QA_A.md`**
- Full static QA report with per-section results, issues found/fixed, verdict

### Verdict

SAFE TO KEEP CREATOR ENERGY: **YES**
- Balanced/empty = guaranteed no-op ✓
- Allowlist injection-safe ✓
- Correct prompt position ✓
- Priority instruction resolves variation-angle ambiguity ✓
- Grounding rule prevents hallucination on mismatched transcripts ✓

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 creator-specific)
- creator-energy-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 warnings)

---

## Phase 30 — Creator Energy Real AI Validation (CE-B, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Real AI output validation of Creator Energy Selection. 9 API calls across 3 transcript types and 7 energy modes.

**New: `scripts/qa/creator-energy-real-ai.ts`**
- Loads .env.local before API calls; exits cleanly if ANTHROPIC_API_KEY missing
- 3 fixture transcripts embedded: creator/business, science, philosophy
- 9 test cases: Creator × 5 (Balanced, Tactical, Contrarian, Analytical, Reflective), Science × 2 (Balanced, Relatable), Philosophy × 2 (Balanced, Harsh Truth)
- Energy fingerprint detection + invented-numbers hallucination scan + platform-native format checks
- TikTok and LinkedIn cross-energy comparison output

**New: `docs/qa/CREATOR_ENERGY_REAL_AI_B.md`**
- Full real AI QA report: 14 validation questions answered, per-platform analysis,
  P0/P1/P2 findings, SAFE TO PROCEED verdict

### Key Results

- 9/9 API calls succeeded, 0 errors
- All 4 single energies differ from Balanced on TikTok ✓
- Tactical vs. Reflective: clearest differentiation pair ✓
- Contrarian vs. Analytical: meaningfully different angle and framing ✓
- Grounding rule held: Relatable on science = no invented confessions ✓
- Harsh Truth on philosophy = no invented drama; stayed Nietzsche-grounded ✓
- LinkedIn also shows energy steering (not just TikTok) ✓
- No corporate AI voice in any of 9 LinkedIn outputs ✓
- P2 only: Contrarian opener occasionally sounds tactical; some energy fingerprints low (tone-level steering vs. keyword-level)

### Verdict

SAFE TO PROCEED: **YES**

Creator Energy Selection is production-ready. Real AI behavior matches static analysis predictions. No factual hallucinations. No format regressions. Clear energy differentiation on all tested platforms.

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS
- creator-energy-audit.ts: ✅ ALL CHECKS PASS
- creator-energy-real-ai.ts: ✅ 9/9 calls succeeded, 0 errors
- Real AI: ✅ tested with live Anthropic Sonnet 4.6 API

---

## Phase 31 — Pricing & Credits Plan (PRICING-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Strategy and documentation phase only. Nothing implemented.

**New: `docs/PRICING_CREDITS_PLAN.md`** — 15-section pricing strategy document.

**Pricing model decided:**
- Free tier: 3 total trial credits, max 10 min, basic only, Creator Energy locked
- Pro tier: €20/month, 100 credits/month, all platforms, Creator Energy included
- Duration-based credit consumption: 0–10 min = 1, 10–30 min = 2, 30–60 min = 4, 60–120 min = 8, 120+ blocked
- Advanced Content Kit: +1 credit
- Creator Energy: included in Pro, no extra cost
- Formula: `credits_used = duration_base_credits + mode_extra_credits`

**Margin analysis:**
4 user scenarios modeled. All within 60–80% gross margin target. Worst case (long podcast with future audio transcription): ~72% margin. Best case (short-form creator): ~92%.

**Implementation prerequisites identified:**
Auth must ship before credits. Credits must ship before billing. No billing without user identity.

### What Was NOT Implemented
- No code changes
- No Stripe integration
- No DB schema
- No UI changes
- No feature flags

### Validation Status at End of Phase
- Documentation only — no build required
- git: clean commit, pushed

---

## Phase 32 — Contrarian Energy Directive Polish (CE-C, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Single-directive quality fix. No new features, no architecture changes.

**P2 fix: `app/lib/creator-energy/options.ts` — Contrarian `promptDirective`**

CE-B found Contrarian sometimes opened with tactical/framework language. Root cause: the old directive said "find the sharpest reframe" without prohibiting framework/steps framing.

Old directive: `"Lead with the assumption most people have wrong. Find the sharpest reframe in the transcript. Take a clear, defensible position — don't hedge."`

New directive: explicitly steers toward assumption-challenging framing, prohibits steps/framework openers unless the transcript is about a framework, includes example pattern ("most people believe X, but this transcript reveals Y"), retains grounding rule.

**Updated: `docs/qa/CREATOR_ENERGY_REAL_AI_B.md`** — CE-C resolution note added to P2 finding.

### Real AI Spot Check

One Contrarian call on creator transcript (~$0.037).

Post-fix TikTok opener: `"The mistake starts earlier than you think: Posting more is not the fix."` — clear assumption-challenging framing. Framework language: none. Contrarian signals: "most people", "actually", "assumption", "reveals".

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- creator-energy-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 warnings)
- Real AI spot check: ✅ PASS — no framework language, contrarian signals present

---

## Phase 33 — Business Docs Consolidation (BUSINESS-DOCS-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Documentation-only phase. No production code changed.

**Updated: `docs/BUSINESS_DIRECTION.md`**
- Core Positioning: updated one-liner + "creator intelligence engine" framing. Added note that AI is invisible infrastructure.
- Monetization Direction: replaced stale Phase 2 guesses with PRICING-A decisions (€20/month, 100 credits, duration tiers, credit formula, margin targets, cost control rules).
- Competitive Moat: added Creator Energy Selection, Transcript-first (no rendering), Domain-agnostic prompts, Credits model as explicit moat points.
- New section: Creator Energy Selection — energy modes table, rules, pricing decision, validation status.
- Feature Priorities: updated to reflect CE-A through CE-C shipped; replaced "Next tier" with auth → credits → billing sequence.
- New section: Validation Status — phases QB-A through PRICING-A, next gates.
- Business Constraints: added auth-first requirement, real-cost validation note.

**Created: `docs/BUSINESS_PLAN_CURRENT.md`**
- 9-section business plan document reflecting current product reality
- Sections: product positioning, core differentiation, Creator Energy, pricing/credits, margin logic, roadmap, anti-goals, validation status, VIRNIX.docx note
- Intended as authoritative markdown source for manual merge into VIRNIX.docx

### What Was NOT Changed
- No app runtime code
- No UI components
- No prompts or AI logic
- No Supabase / Stripe / auth work
- `docs/PROJECT_BRAIN.md` not rewritten
- `VIRNIX.docx` not modified (binary — manual merge from BUSINESS_PLAN_CURRENT.md required)

### Validation Status at End of Phase
- git status: only docs changed ✅
- No build required (docs only)

### Next: AUTH-A — Supabase authentication
All product quality phases complete. Pricing and business docs consolidated. Auth is the next gate before monetization.

---

## Phase 34 — Pricing Expansion + Roadmap Docs (BUSINESS-DOCS-B, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Documentation-only phase. No production code changed.

**Created: `docs/roadmap/` folder (4 new files)**

- `docs/roadmap/README.md` — roadmap folder overview, current stage, next sequence, tier table
- `docs/roadmap/VERSIONING.md` — semantic versioning system: MAJOR.MINOR.PATCH with Virnix-specific rules, version table (v0.1.0 → v1.0.0), phase-to-version mapping
- `docs/roadmap/FEATURE_ROADMAP.md` — features by version (v0.1.x through v1.0.0), status legend, shipped list (25+ items), planned/candidate/future/never sections, Studio/Agency readiness checklists
- `docs/roadmap/RELEASE_PLAN.md` — v0.1.0 baseline definition, upcoming release plans (v0.2.0–v1.0.0), changelog format, PATCH/MINOR/MAJOR decision guide, release checklist

**Updated: `docs/BUSINESS_DIRECTION.md`**
- Header updated to BUSINESS-DOCS-B, Phases 1–34, roadmap folder reference
- Future tiers: "Creator tier" replaced with named Studio (€49, 350 credits) and Agency (€99, 900 credits)

**Updated: `docs/BUSINESS_PLAN_CURRENT.md`**
- Header updated to BUSINESS-DOCS-B, roadmap links added to Section 6
- Future pricing expanded: Studio / Agency / PAYG with full details
- New Section 9: Future public roadmap/changelog page concept (docs-only)

**Updated: `docs/PRICING_CREDITS_PLAN.md`**
- Section 13 rewritten: "Creator tier" → Studio (€49, 350cr), "Team tier" → Agency (€99, 900cr)
- PAYG candidate documented
- Tier positioning summary table added
- plans.ts comment updated to Free/Pro/Studio/Agency

### What Was NOT Changed
- No app runtime code
- No UI, prompts, AI logic
- No Supabase / Stripe / auth
- VIRNIX.docx not modified (binary — manual merge required)

### Validation Status at End of Phase
- git status: only docs and new roadmap folder ✅
- No build required (docs only)

### Next: AUTH-A — Supabase authentication
Version baseline v0.1.0 established. Roadmap docs complete. Auth is the prerequisite gate for the entire credits + billing stack.

---

## Phase 35 — Feedback / Improvement Loop Plan (BUSINESS-DOCS-C, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Documentation-only phase. No production code changed.

**Created: `docs/feedback/` folder (3 new files)**

- `docs/feedback/README.md` — folder overview, design principles, implementation sequence
- `docs/feedback/FEEDBACK_SURVEY_PLAN.md` — 5-question survey design, placement rules, future implementation architecture (FeedbackWidget, types, options, API route, DB sketch, implementation rules, copy guidelines)
- `docs/feedback/IMPROVEMENT_LOOP.md` — feedback → decision process (collect → tag → review → pattern → action), 12-category tag system, review cadence, pattern detection rules, P0/P1/P2/Candidate priority framework, what feedback can/cannot change

**Updated: `docs/roadmap/README.md`** — feedback folder reference added, shipped list updated  
**Updated: `docs/roadmap/FEATURE_ROADMAP.md`** — feedback widget added to v0.3.x (Planned), v0.4.x (Candidate), v0.6.x (Future); v1.0.0 feedback row updated  
**Updated: `docs/roadmap/RELEASE_PLAN.md`** — BUSINESS-DOCS-C added to v0.1.0 phases; v0.3.0 description updated  
**Updated: `docs/BUSINESS_DIRECTION.md`** — header updated, new Feedback Loop section added  
**Updated: `docs/BUSINESS_PLAN_CURRENT.md`** — header updated, new Section 9 (Feedback-Driven Roadmap) added

### What Was NOT Changed
- No app runtime code
- No UI, prompts, AI logic
- No Supabase / Stripe / auth
- VIRNIX.docx not modified (binary)

### Validation Status at End of Phase
- git status: only docs and new feedback folder ✅
- No build required (docs only)

### Next: AUTH-A — Supabase authentication
All planning phases complete. The full documentation suite (business plan, pricing, roadmap, versioning, feedback) is in place. AUTH-A is the first implementation gate — prerequisite for credits, billing, and feedback storage.

---

## Phase 36 — Supabase Authentication (AUTH-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Built

**New: `app/lib/auth/supabase-client.ts`**
- `createBrowserClient` wrapper for use in `"use client"` components
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**New: `app/lib/auth/supabase-server.ts`**
- Async `createServerClient` for Server Components and Route Handlers
- Cookie store wired via `next/headers` `cookies()` (Next.js App Router pattern)
- `setAll` silently catches in Server Components where cookie writes are middleware-only

**New: `app/auth/callback/route.ts`**
- GET handler: exchanges `?code=` for session via `exchangeCodeForSession()`
- Sets session cookies via server Supabase client
- Redirects to `next` param or `/` on success; redirects to `/?auth_error=true` on failure

**New: `app/components/auth/AuthButton.tsx`**
- Client component: `Sign in` link when logged out, email + `Sign out` button when logged in
- `useMemo(() => createClient(), [])` pattern prevents client re-creation on render
- `onAuthStateChange` subscription for reactive state; cleaned up in effect teardown

**New: `app/login/page.tsx`**
- Magic link form: idle / loading / sent / error states
- Full Virnix premium aesthetic: glass card, chrome border glow, banner.png internal atmosphere, matching input/button styles
- "sent" state shows email confirmation with "Use a different email" reset
- `← Back to Virnix` footer link

**Updated: `app/page.tsx`**
- `AuthButton` imported via `dynamic(..., { ssr: false })` — prevents SSR prerender calling `createBrowserClient` without env vars
- Top bar right slot: `<div className="absolute right-0">` → `<div className="absolute right-0 flex items-center gap-2">` with `<AuthButton />` before `<ThemeToggle />`

**Updated: `.env.example`**
- `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=` added
- Redirect URL docs: `http://localhost:3000/auth/callback` + `https://virnix.com/auth/callback`
- `SUPABASE_SERVICE_ROLE_KEY` commented out with client-exposure warning

**Created: `docs/auth/README.md`**
- Setup notes: env vars, Supabase dashboard config (redirect URLs), flow walkthrough, file structure, security notes, what AUTH-A does NOT include, CREDITS-A next step

### Auth Flow

1. User visits `/login`, enters email
2. `signInWithOtp({ email, emailRedirectTo: origin + '/auth/callback' })` — Supabase sends magic link email
3. User clicks link → `/auth/callback?code=...` → `exchangeCodeForSession(code)` → session cookies set
4. Redirect to `/` — `AuthButton` shows email + Sign out

### Build Fix Applied

Initial build failed: `AuthButton` was imported as a static import, causing `createBrowserClient` to be called during SSR prerendering when Supabase env vars are not set in the build environment. Fixed by switching to `dynamic(() => import("./components/auth/AuthButton"), { ssr: false })` — auth state is inherently client-only and cannot be known at prerender time.

### What Was NOT Implemented

- No credit check or deduction (CREDITS-A)
- No Pro gating (BILLING-A)
- No generation history (v0.4.x)
- No feedback storage (v0.3.x)
- No middleware for automatic token refresh (CREDITS-A)
- No auth gate on generation or landing page — usage remains public

### Validation Status at End of Phase
- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Auth flow: ✅ implemented — requires Supabase project + env vars to test end-to-end
- Landing page regression: ✅ none
- Generation regression: ✅ none — no AI/prompt/credit code touched

### Next: CREDITS-A
Server-side credit check in `/api/generate`, free tier allocation, atomic deduction, middleware for session refresh.

---

## Phase 37 — Merchant of Record / VAT-Safe Pricing Plan (BUSINESS-DOCS-D, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Done

Documentation-only phase. No production code changed.

**Updated: `docs/PRICING_CREDITS_PLAN.md`**
- New **Section 16: Merchant of Record / VAT-Safe Pricing Approach**
  - What is a Merchant of Record (simple founder explanation)
  - MoR vs. payment processor comparison table (Paddle/Lemon Squeezy vs. Stripe + Stripe Tax)
  - Pro pricing model: €20/month + VAT where applicable
  - Fee assumptions with ⚠ verification reminders
  - **Transaction examples:**
    - Example A: single B2C transaction with 22% VAT → payout ~€18.28–€18.50
    - Example B: 100 Pro transactions → payout €1,828–€1,850
    - Example C: after AI/transcription costs at €3/€5/€7 per user
  - Pricing optimization recommendations (6 rules)
  - What not to over-optimize yet
  - Legal and accounting disclaimer
- Section 9 (Margin Assumptions): added note that billing fee assumption (~€0.90 Stripe) varies by provider; MoR fee ~€1.50–€1.72 per transaction
- Section 15 (Open Questions): expanded provider question from "Stripe or LemonSqueezy?" to full MoR evaluation guidance

**Updated: `docs/BUSINESS_PLAN_CURRENT.md`**
- Header updated to BUSINESS-DOCS-D, Phases 1–37
- Pro plan updated: €20/month + VAT where applicable (with note about net revenue target)
- Billing sequence updated: provider evaluation step added before implementation
- New Section 11: Merchant of Record / VAT-Safe Pricing (summary section)
- Old Section 11 VIRNIX.docx Note → Section 12

**Updated: `docs/BUSINESS_DIRECTION.md`**
- Header updated to BUSINESS-DOCS-D, Phases 1–37
- Pro price: €20/month → €20/month + VAT where applicable
- Feature Priorities: billing note updated to include MoR evaluation step
- Validation Status: AUTH-A marked ✅ Done; BILLING-A updated with provider evaluation context

**Updated: `docs/roadmap/FEATURE_ROADMAP.md`**
- v0.3.x Billing + Pro Plan: provider evaluation row added, MoR note added to gates

**Updated: `docs/roadmap/RELEASE_PLAN.md`**
- v0.2.0: AUTH-A marked ✅ shipped
- v0.3.0: billing provider evaluation step added; MoR note added
- v0.1.0 phases table: BUSINESS-DOCS-D (37) added

### What Was NOT Changed

- No app runtime code touched
- No UI components modified
- No prompts or AI logic touched
- No Supabase / billing integration
- `docs/PROJECT_BRAIN.md` not rewritten
- `VIRNIX.docx` not modified (binary — manual merge from BUSINESS_PLAN_CURRENT.md required)

### Key business decisions documented

- **Pro is €20/month + VAT** (not €20 VAT-included). Net revenue target.
- **Merchant of Record is the preferred early billing path.** Paddle or Lemon Squeezy handle global VAT. Higher fee than Stripe but near-zero compliance overhead.
- **Evaluate before implementing BILLING-A.** Provider choice drives architecture.
- **Transaction estimate:** €20 net Pro, 22% VAT → customer pays €24.40 → Virnix receives ~€18.28–€18.50 after MoR fees.
- **All tax treatment must be confirmed by an accountant before public launch.**

### Validation Status at End of Phase
- Build: ✅ not required (docs only)
- git status: only docs changed ✅

### Next: CREDITS-A
AUTH-A is complete. CREDITS-A is the next gate: server-side session read, credit check/deduct, free tier allocation, middleware.

---

## Phase 38 — Supabase Heartbeat (SUPABASE-HEARTBEAT-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Built

**New: `app/api/health/supabase/route.ts`**
- `GET /api/health/supabase` — server-side diagnostic endpoint
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env
- Validates URL format
- Fetches `/auth/v1/health` server-side with `apikey` + `Authorization: Bearer` headers; 8s timeout
- Returns safe JSON diagnostics only — no key values, no secrets, no user data
- HTTP 200 on success, HTTP 503 on any failure
- Handles: missing env vars, malformed URL, DNS failure, timeout, 401/403, unexpected status

**Updated: `docs/auth/README.md`**
- "Pre-CREDITS-A heartbeat plan" section replaced with "Supabase heartbeat route"
- Documents implemented endpoint, response contract, what it checks vs. not yet, why no-auth is safe

### What Was NOT Changed

- No auth components, login page, or other API routes
- No prompts, AI logic, or generation code
- No Supabase / Stripe / billing / credits
- No UI components
- `scripts/check-supabase-auth.ts` already up to date from AUTH-A-CLEANUP

### Validation Status at End of Phase
- Lint: ✅ clean
- Build: ✅ clean — 7 routes including `/api/health/supabase`
- Checker: ✅ exit 0
- Local endpoint: ✅ `GET http://localhost:3000/api/health/supabase` returns `{"status":"ok","dnsReachable":true,"authReachable":true,...}`

### Next: CREDITS-A
Heartbeat confirmed working. CREDITS-A is the next gate: server-side session read, credit check/deduct, free tier allocation, middleware. Add DB `SELECT 1` to heartbeat once CREDITS-A schema exists.

---

## Phase 39 — Credits Foundation (CREDITS-A, 2026-05-20)

**Commit:** (see git log for hash)

### What Was Built

**New: `app/lib/credits/` module**
- `types.ts` — `CreditCost`, `GenerationMode`
- `rules.ts` — `DURATION_CREDIT_TIERS` (0–10 min=1, 10–30=2, 30–60=4, 60–120=8, 120+=blocked), `MODE_EXTRA_CREDITS` (basic=+0, advanced=+1), `WORDS_PER_MINUTE_ESTIMATE`
- `calculateCredits.ts` — `calculateCreditsForGeneration(durationSec, mode)` — server-side only; `estimateDurationFromWordCount()` as documented fallback
- `server.ts` — `ensureUserCredits()`, `deductCredits(amount)` — wrappers over Supabase RPCs

**New: `app/api/credits/route.ts`** — `GET /api/credits` — returns authenticated user's balance; calls `ensure_user_credits` RPC; 401 if not signed in

**New: `app/components/credits/CreditBadge.tsx`** — top bar credit display; fetches on mount; updates from generation response; hidden when not signed in

**Modified: `app/lib/ai/transcript.ts`** — `TranscriptResult` now includes `durationSec: number` (auto-detects ms vs seconds from YouTube segment format)

**Modified: `app/lib/ai/generate.ts`** — accepts optional `PreloadedTranscript` second param; route passes pre-fetched transcript to avoid double fetch

**Modified: `app/lib/types/generation.ts`** — `GenerateResponse` now includes optional `creditsUsed`, `creditsRemaining` (success) and `creditsRequired`, `creditsAvailable` (error 402)

**Modified: `app/api/generate/route.ts`** — real AI mode now enforces: session check (401), transcript fetch, server-side credit calculation, 422 for 120+ min, `ensure_user_credits`, balance check (402), generation, atomic deduction, credit fields in response. Mock mode unchanged.

**Modified: `app/page.tsx`** — `creditsRemaining` state, `CreditBadge` in top bar, generation error handling now parses JSON body from all status codes (gets server error message for 401/402)

**New: `docs/credits/README.md`** — full credit system documentation

**New: `docs/credits/SQL.md`** — ⚠ MANUAL ACTION REQUIRED — SQL for `user_credits` table, RLS policy, `ensure_user_credits()` RPC, `deduct_credits(integer)` RPC

### What Was NOT Changed

- No Stripe, billing, Pro subscriptions, pricing page
- No Studio/Agency logic
- No AI prompt changes, no Creator Energy changes
- No major UI redesign
- No new environment variables required (`NEXT_PUBLIC_SUPABASE_ANON_KEY` + session cookies sufficient)

### Credit Rules Implemented

```
credits_used = duration_base_credits + mode_extra_credits
```

Duration tiers: 0–10 min=1, 10–30 min=2, 30–60 min=4, 60–120 min=8, 120+ min=blocked  
Mode: basic=+0, advanced=+1. Creator Energy=+0.

### Security / RLS

- `user_credits` table: RLS enabled. SELECT policy: `auth.uid() = user_id`. No direct DML.
- `ensure_user_credits()` and `deduct_credits(integer)`: `SECURITY DEFINER`, `grant execute to authenticated`.
- Service role key NOT required — anon key + user session (cookies) is sufficient.
- Credit cost calculated server-side from actual transcript duration. Never from client input.

### Known Limitations

1. Race condition window: two simultaneous requests can both pass balance check. Second deduction returns -1 (atomic RPC guards the DB). Generation is still served; logged as warning.
2. No monthly credit reset until BILLING-A.
3. No `credit_transactions` audit log (CREDITS-B).
4. Rate limiting (20/hour per user) not yet enforced (CREDITS-B).

### Validation Status at End of Phase

- Lint: ✅ clean
- Build: ✅ clean
- SQL: ⏳ must be run manually in Supabase before end-to-end production test

### Next: BILLING-A
Run SQL in Supabase, test end-to-end (sign in → generate → credits deducted → badge updates), evaluate billing provider (Paddle/Lemon Squeezy/Stripe), implement Pro subscription + webhooks.

---

## Phase 40 — Dark Mode Output Readability Polish (UI-POLISH-L, 2026-05-21)

**Commit:** `3c32429`

### What Was Done

Targeted dark mode contrast fixes across all output/report components. No logic changes.

**Modified: `app/components/generation/ClipMomentCard.tsx`**
- Confidence label ("Good match", "Possible"): `dark:zinc-600` → `zinc-500`
- Timestamp: `dark:zinc-500` → `zinc-400`
- "Why it works" description: `dark:zinc-500` → `zinc-400`
- Platform pills text: `dark:zinc-600` → `zinc-400`
- Platform pills border: `dark:border-zinc-800` → `dark:border-zinc-700/60`
- Source text preview quote: `dark:zinc-700` → `zinc-600`

**Modified: `app/components/generation/ClipGuide.tsx`**
- Section header "Strongest moments": `dark:zinc-600` → `zinc-500`
- Footer "N moments detected": `dark:zinc-600` → `zinc-500`

**Modified: `app/components/generation/TranscriptQualityCard.tsx`**
- Section header: `dark:zinc-600` → `zinc-500`
- Clipability sublabel: `dark:zinc-600` → `zinc-500`
- Summary paragraph (most important body text): `dark:zinc-400` → `zinc-300`
- "Strongest signals" label: `dark:zinc-600` → `zinc-500`
- Weakness text: `dark:zinc-600` → `zinc-500`
- "Best fit:" label: `dark:zinc-600` → `zinc-500`
- Platform fit pills: `dark:zinc-500` → `zinc-400`

**Modified: `app/components/OutputCard.tsx`**
- Platform label (TIKTOK, TWITTER…): `dark:zinc-600` → `zinc-500`
- Card body content: `dark:zinc-400` → `zinc-300`
- Char count: `dark:zinc-700` → `zinc-500`

### What Was NOT Changed
- Light mode: no light-mode class touched
- Credits logic, Supabase, auth, API routes: untouched
- CreditBadge placement: inspected, acceptable as-is at time of this phase

### Validation Status at End of Phase
- Lint: ✅ clean
- Build: ✅ clean

---

## Phase 41 — Output Language Selection (LANG-A, 2026-05-21)

**Commit:** (see git log for hash)

### What Was Built

**New: `app/lib/languages/` module**
- `types.ts` — `OutputLanguageId` union type (auto | en | sl | hr | sr-latn | bs | de | it | es | fr | pt), `OutputLanguage` interface
- `options.ts` — `OUTPUT_LANGUAGES` array (11 options), `isValidLanguageId()` server-side allowlist guard, `getLanguageById()` lookup
- `prompt-context.ts` — `formatLanguageContext(id)` — returns "" for "auto" (no-op), full native-language directive block for any explicit selection

**New: `app/components/LanguageSelector.tsx`**
- Pill-based selector matching exact style of `CreatorEnergySelector`
- Label: "Write in" / default: Auto
- Shown inside HeroCard when `phase === "idle"`, below CreatorEnergySelector

**Modified: `app/lib/types/generation.ts`**
- `GenerateRequest` extended with `outputLanguage?: OutputLanguageId`

**Modified: `app/lib/prompts/index.ts`**
- `buildPrompt(transcript, timelineContext, energyContext, languageContext)` — languageContext injected after energyContext in GENERATION PROFILE
- `buildAdvancedPrompt(transcript, timelineContext, energyContext, languageContext)` — same

**Modified: `app/lib/ai/generate.ts`**
- Import `formatLanguageContext` from language module
- `generate()` passes `req.outputLanguage ?? "auto"` to `realGenerate()`
- `realGenerate()` accepts `outputLanguage: OutputLanguageId`, calls `formatLanguageContext()`, logs non-auto selection, injects into prompt

**Modified: `app/api/generate/route.ts`**
- Imports `isValidLanguageId`, `OutputLanguageId`
- Validates `body.outputLanguage` against allowlist — unknown values fall back to "auto"
- Passes validated `outputLanguage` to both real-AI and mock `generate()` calls

**Modified: `app/page.tsx`**
- `selectedLanguage` state (default: "auto")
- `outputLanguage: selectedLanguage` included in fetch body
- `LanguageSelector` rendered inside HeroCard when idle, below Direction controls
- **CreditBadge repositioned**: moved from right controls cluster to `absolute left-0` — logo stays center, auth+theme stays right, credits badge now has its own left-side space with no logo collision

**New: `docs/languages/README.md`** — language system documentation

### Language Options (Phase LANG-A)

| ID | Label | Notes |
|----|-------|-------|
| auto | Auto | Same as transcript — no prompt injection |
| en | English | |
| sl | Slovenian | Regional note injected |
| hr | Croatian | No-mix regional note |
| sr-latn | Serbian Latin | Latin only, no Cyrillic, no-mix note |
| bs | Bosnian | No-mix regional note |
| de | German | |
| it | Italian | |
| es | Spanish | |
| fr | French | |
| pt | Portuguese | |

### Prompt Injection

Language context injects after `energyContext` in the GENERATION PROFILE block:

```
Output language: {promptName}
Write all outputs natively in {promptName}. Do not literally translate English viral hook formulas. Use natural creator and social media phrasing for that language and region.
{nativeNote if present}
Priority: Output language is mandatory and overrides all other stylistic instructions. Creator Energy is creative steering. Variation profile is secondary and must not override language.
```

For "auto": returns "", prompt unchanged.

### Security

- Server validates language against typed allowlist — arbitrary strings from client are ignored, coerced to "auto"
- No new environment variables required
- Language selection never increases credit cost (LANG-A)

### Credits Impact

Language selection = +0 credits in this phase. All existing credit rules unchanged.

### Mock Mode

Mock mode (`real_ai_generation=false`) passes `outputLanguage` through `generate()` but hits `getMockResult()` before any prompt is built — mock output is unaffected.

### What Was NOT Changed

- Credits logic, Supabase, auth, billing: untouched
- Creator Energy behavior: untouched (language is a separate parallel parameter)
- AI provider architecture: untouched
- No external translation API — all native generation via Claude
- No database persistence for language selection (ephemeral page state only)
- No rate limiting changes

### CreditBadge Placement Fix

Before: CreditBadge lived inside the `absolute right-0` controls cluster, crowded between logo (center) and AuthButton.

After: Three-section top bar — `absolute left-0` (CreditBadge) | centered (logo + wordmark) | `absolute right-0` (AuthButton + ThemeToggle). Clear visual separation, no collision with logo area.

### Validation Status at End of Phase

- Lint: ✅ clean
- Build: ✅ clean
- Mock mode: ✅ unaffected
- Language allowlist: ✅ server-validated
- Prompt injection: ✅ language context injects after energy context in GENERATION PROFILE
- CreditBadge placement: ✅ left side, no logo collision

### Next Recommended Step

**BILLING-A** — billing provider evaluation (Paddle/Lemon Squeezy/Stripe + Stripe Tax), Pro subscription flow, webhook credit allocation/reset.

Prerequisites:
1. Run `docs/credits/SQL.md` in Supabase (if not yet done)
2. Test end-to-end credits flow (sign in → generate → deduction → badge)
3. Optionally test LANG-A with real AI: select Slovenian, generate from English podcast, verify native output

---

## Phase 42 — Language Selection QA (LANG-QA-A, 2026-05-21)

**Commit:** `f61ed9b`

### What Was Done

Static audit of LANG-A. No production code changed.

**New: `scripts/qa/language-audit.ts`**

12-section audit script, zero API calls, zero cost:
1. Language options list completeness (11 IDs)
2. `formatLanguageContext("auto")` returns `""` — guaranteed no-op
3. All non-auto languages return non-empty context
4. Core directives present in all non-auto languages ("Write all outputs natively", "Do not literally translate English viral hook formulas", "Priority: Output language is mandatory")
5. Croatian no-mix warning (Serbian/Bosnian)
6. Serbian Latin: Latin script explicit, Cyrillic explicitly forbidden, no-mix warning
7. Bosnian no-mix warning (Serbian/Croatian)
8. `isValidLanguageId` allowlist — 11 valid IDs pass, 17 invalid inputs rejected (wrong case, unknown IDs, non-strings, empty string, future language codes)
9. Auto mode = zero prompt change (formatLanguageContext("auto") === "")
10. Explicit language injects verbatim into GENERATION PROFILE
11. Language context appears after energy context (correct priority order)
12. Priority hierarchy: language mandatory > Creator Energy creative steering > variation profile secondary

### Results

- language-audit.ts: ✅ 0 failures · 1 P2 warning
- opener-audit.ts: ✅ ALL CHECKS PASS (0 failures)
- creator-energy-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 warnings)
- Lint: ✅ clean
- Build: ✅ clean (8 routes)
- Supabase: ✅ reachable

**P2 Warning:** Slovenian `nativeNote` has no explicit no-mix warning for Croatian/Serbian. Lower risk than BCS languages (different branch, less cross-contamination risk). Not a blocker.

**Real AI tests:** Not run — static QA sufficient. BILLING-A prerequisite (SQL.md) not yet confirmed run.

### What Was NOT Changed

- No production code modified
- Credits logic, Supabase, auth, billing: untouched
- Language module, UI, prompt injection: unchanged from LANG-A

### Validation Status at End of Phase

- Lint: ✅ clean
- Build: ✅ clean
- language-audit.ts: ✅ 0 failures
- All prior QA scripts: ✅ regression-clean

### Safe to Proceed to BILLING-A: YES

---

## Phase 43 — Output Wow Upgrade / Use This First Layer (QUALITY-C, 2026-05-22)

**Commit:** `daeb5fe`

### What Was Built

**Updated: `app/lib/ai/schemas.ts`**
- `BestAngle` and `BestAngleVariants` interfaces
- `coerceBestAngle()` — returns null if hook/why missing; no partial renders
- `CORE_OUTPUT_SCHEMA` and `ADVANCED_OUTPUT_SCHEMA` both include `best_angle` field

**Updated: `app/lib/types/generation.ts`**
- `bestAngle?: BestAngle` added to `GenerateResult`

**Updated: `app/lib/ai/parser.ts`**
- Extracts `best_angle` from parsed JSON in `parseAnthropicResponse()`
- `buildResult()` accepts optional `bestAngle?: BestAngle`, includes in result

**Updated: `app/lib/prompts/index.ts`**
- `best_angle` instructions added to both `buildPrompt` and `buildAdvancedPrompt`
- Grounded rules: no virality guarantees, no invented statistics, all text in output language

**Updated: `app/lib/ai/generate.ts`**
- `bestAngle: result.bestAngle` threaded through to returned `GenerateResult`

**Updated: `app/lib/ai/mock.ts`**
- `MOCK_BEST_ANGLE` constant with realistic creator content
- Mock mode surfaces the card immediately (no real AI needed)

**New: `app/components/generation/UseThisFirstCard.tsx`**
- Premium card rendered above ClipGuide in phase=done
- Shows: best hook (large), best platform badge, why it works, caution, 5 labeled hook variants
- Each variant has an inline copy button
- Hidden when AI omits `best_angle` or hook/why are empty

**Updated: `app/page.tsx`**
- `bestAngle` state + `setBestAngle` from API response
- `UseThisFirstCard` rendered between TranscriptQualityCard and ClipGuide

### Hook Variants

5 labeled angles on the same core content:
- **Curiosity** — opens a question the reader wants answered
- **Contrarian** — challenges what the audience currently believes
- **Tactical** — leads with a specific action or data point
- **Reflective** — speaks to identity or meaning shift
- **Punchy** — ultra-short, nothing wasted

Variant labels are English UI labels; body text respects the selected output language.

### Design Decisions
- Card is hidden (not shown with empty state) when AI omits `best_angle`
- Coercion falls back to primary hook for missing variants — never crashes
- No fake virality claims — prompt explicitly forbids "guaranteed viral" language
- Creator Energy influences the best angle direction via the existing energy context

### Validation Status at End of Phase
- Lint: ✅ clean (0 warnings)
- Build: ✅ clean (TypeScript, Turbopack)
- Mock mode: ✅ MOCK_BEST_ANGLE renders correctly
- Real AI: requires live API test (see FREE-BETA-A)

---

## Phase 44 — Controlled Free Beta Strategy (FREE-BETA-STRATEGY-A, 2026-05-22)

**Commit:** (see below — docs only)

### What Was Done

Docs-only phase. No runtime code changed.

Created `docs/beta/` folder with 7 strategic planning documents:

| File | Contents |
|------|---------|
| `FREE_BETA_STRATEGY.md` | Executive summary, 7/14-day plan, success/failure criteria, daily routine for Miha and Claude |
| `COST_CONTROL_POLICY.md` | €100 budget, cost scenarios (20–300 users), kill switches, danger zones, what to log |
| `BETA_RISK_REGISTER.md` | 20-item risk table (probability, impact, warning sign, mitigation, decision trigger) |
| `BETA_LAUNCH_CHECKLIST.md` | 10-section checkbox checklist — must-haves before first invite |
| `MARKETING_TEST_PLAN.md` | First 50-user acquisition plan, 5 DM templates, 5 X posts, 3 LinkedIn posts, 3 Reddit posts, 3 TikTok scripts, objection handling, headline alternatives |
| `FOUNDER_OPERATING_SYSTEM.md` | How Miha runs the beta — daily checks, decision framework, what Claude can do alone, what requires Miha's input |
| `ARCHITECTURE_BETA_GUARDRAILS.md` | Module boundary rules, what not to build during beta, feature flags documented, expected future phases |

### Strategic Decisions Documented

- **Start with 20 users, not 50 or 100** — qualitative signal before scale
- **3 free credits** per user (already built in CREDITS-A)
- **10-minute max** video (already enforced)
- **Creator Energy unlocked** for all beta users (key differentiator)
- **Best Angle visible** on all real AI output (QUALITY-C)
- **AI cost for 20 users × 3 credits**: ~€3 (well within €100 budget)
- **Critical blocker**: Supabase SQL must be run before any user invite

### Top 5 Risks Identified
1. Credits SQL not applied → unlimited free generation
2. No one converts → existential signal failure
3. Product misunderstood as video editor → messaging problem
4. Bad first impression / low quality → smoke test required before invite
5. Missing terms/privacy notice → must exist before public URL shared

### What Was NOT Changed
- No app runtime code
- No AI prompts
- No Supabase schema
- No Stripe/billing
- No new environment variables

### Validation Status
- Lint: ✅ clean (docs only)
- Build: ✅ not required (docs only)
- No secrets touched
- No live AI scripts run

### Next: FREE-BETA-OBSERVABILITY-A
Beta tracking, feedback collection, and founder review system — docs + optional Supabase tables.

---

## Phase 45 — Beta Observability Plan (FREE-BETA-OBSERVABILITY-A, 2026-05-22)

**Commit:** (see below — docs only)

### What Was Done

Docs-only phase. No runtime code changed.

Created `docs/beta/BETA_OBSERVABILITY_PLAN.md` — 10-section plan covering:

| Section | Contents |
|---------|---------|
| Purpose | Why structured tracking matters at 20 users |
| Minimum data to capture | 13 fields logged per generation attempt |
| Feedback data | 6-field post-generation feedback schema |
| Founder notes | Per-user tagging system (good_lead, bug_report, likely_paid_user, etc.) |
| Privacy rules | Exact privacy notice text, hard constraints on what must never be logged |
| Minimum implementation | Tier 1/2/3 observability stack; Tier 1+2 sufficient for 20 users |
| Suggested DB tables | SQL schemas for `generation_logs`, `generation_feedback`, `founder_beta_notes` |
| Daily review workflow | 15-min checklist by step |
| Signal vs. noise framework | What to act on vs. log vs. ignore |
| Required before first 20 users | Checklist — 9 items, 1 hard requirement (privacy notice) |

Updated 4 existing beta docs:
- `BETA_LAUNCH_CHECKLIST.md` — new Section K (Observability Readiness) with 9 items
- `FREE_BETA_STRATEGY.md` — added note that beta is for learning from identifiable people, not anonymous traffic
- `FOUNDER_OPERATING_SYSTEM.md` — expanded daily check table, added BETA_LOG.md guidance, added signal vs. noise section
- `ARCHITECTURE_BETA_GUARDRAILS.md` — new Observability section with allowed/prohibited logging rules and architecture constraints

### Key Decisions

- **generation_logs table** — Supabase, service-role only, never exposed to client
- **No client-facing analytics provider** for first 20 users — Vercel logs + Supabase watching is enough
- **Transcript and output text must never be logged** — explicitly listed as hard prohibition
- **Privacy notice is a hard blocker** before any user invite — exact text provided in the plan
- **Feedback collection** can be as simple as "reply to my DM" for the first wave

### What Was NOT Changed
- No app runtime code
- No AI prompts
- No Supabase schema (tables are optional additions, not required)
- No new environment variables

### Validation Status
- Lint: ✅ not required (docs only)
- Build: ✅ not required (docs only)
- No secrets touched
- No live AI scripts run

### Next: FREE-BETA-A
Production readiness confirmation: SQL verification, real AI smoke test on virnix.pro, credits end-to-end test, privacy notice, error message improvements.

---

## Phase 46 — Production Readiness Confirmation (FREE-BETA-A, 2026-05-22)

**Commit:** (see below)

### What Was Done

Code + docs phase. Lint ✅ Build ✅ Zero AI calls. €0.00 cost.

**Production endpoint checks (all passed):**
- `GET virnix.pro/api/health/supabase` → `{"status":"ok","authReachable":true}`
- `GET virnix.pro/` → HTTP 200
- `GET virnix.pro/api/credits` (unauthenticated) → HTTP 401

**Code changes:**

`app/api/generate/route.ts` — 3 error message improvements:
- 402 (balance=0): "You've used your free beta credits. Message Miha if you'd like more."
- 402 (insufficient): "Not enough credits for this video (needs N, you have M). Try a shorter video."
- 500 (generation fail): "Generation failed. Nothing was charged. Please try again."

`app/page.tsx` — Beta privacy notice:
- `BetaNotice` component added, renders in idle state below platform list
- Text: "Beta: Virnix may review submitted content and feedback to improve the product. Don't submit private or confidential content."

**Docs created:**

`docs/beta/FREE_BETA_A_READINESS_REPORT.md` — full verification report:
- 19 code-verified items
- 3 production endpoint checks
- 12 items marked as requiring manual verification
- 4 hard blockers identified before first 5 invites
- Final recommendation: NOT READY until Miha completes 4 manual checks

**BETA_LAUNCH_CHECKLIST.md** updated — sections A, B, C, K marked with [x] for code-verified items.

### 4 Manual Blockers (Miha must complete before first invite)

1. Supabase SQL confirmed applied (`user_credits` + RPCs exist)
2. `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` confirmed in Vercel production
3. One live generation test passes on virnix.pro
4. Auth end-to-end tested on production (magic link → session → credits shown)

### What Was NOT Changed
- No AI prompts
- No credit logic
- No auth logic
- No Supabase schema
- No new environment variables
- No new dependencies

### Validation Status
- Lint: ✅ clean (exit 0)
- Build: ✅ clean (TypeScript, Turbopack, 6 routes)
- Real AI calls: 0
- Estimated cost: €0.00

### Next: FREE-BETA-D (after Miha clears 4 blockers)
Send first 5 controlled beta invites. Not an engineering phase — founder execution only.

---

## Phase 47 — Blocker Verification (FREE-BETA-A.1, 2026-05-22)

**Commit:** (see below)

### What Was Done

Verification phase. Lint ✅ Build ✅ Zero AI calls. €0.00 cost.

**Critical finding:**
Production is running in MOCK MODE. Confirmed by unauthenticated POST to `/api/generate` which returned HTTP 200 with mock data (`"provider":"mock","elapsedMs":0,"fallbackUsed":true`). The `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` flag is missing or set to `false` in Vercel production. Auth gate and credit system are bypassed on production.

**Blocker status after this phase:**

| Blocker | Status |
|---------|--------|
| 1. Supabase SQL applied | ⚠️ Cannot confirm — manual Supabase dashboard required |
| 2. Real AI flag in Vercel | ❌ Confirmed failing — must be fixed before any invites |
| 3. Live generation test | ⚠️ Manual required — needs blockers 1+2 cleared first |
| 4. Auth magic link | ⚠️ Manual required — needs browser + email |

**Code change:**

`app/api/health/supabase/route.ts` — Added database connectivity check:
- Queries `user_credits?select=user_id&limit=0` with anon key (read-only, zero cost)
- New response field: `"dbReachable": true/false`
- Allows remote verification of Supabase SQL application without dashboard access
- Was planned as a future addition in `docs/credits/README.md`

**Docs created:**

`docs/beta/FREE_BETA_A1_BLOCKER_VERIFICATION.md` — Full blocker analysis:
- Per-blocker: what was verified, what remains manual, exact steps for Miha, pass criteria
- Step A: Fix Vercel flag (~10 min)
- Step B: Verify Supabase SQL (~20 min)
- Step C: Auth end-to-end test (~15 min)
- Step D: One live generation test (~15 min)
- Estimated total time for Miha to clear all 4: ~60 minutes

**`BETA_LAUNCH_CHECKLIST.md`** updated — Blocker 2 marked as CONFIRMED FAILING.

### What Was NOT Changed
- No AI prompts
- No credit logic
- No auth logic
- No Supabase schema
- No new environment variables
- No new dependencies

### Validation Status
- Lint: ✅ clean (exit 0)
- Build: ✅ clean (TypeScript, Turbopack)
- Real AI calls: 0
- Estimated cost: €0.00
- Endpoint checks: 1 (unauthenticated POST to generate — safe, zero cost, confirmed mock mode)

### Next: FREE-BETA-A.2 — Miha manual production verification
Miha works through 4-step checklist in FREE_BETA_A1_BLOCKER_VERIFICATION.md (~60 min). No engineering needed. After all 4 pass: FREE-BETA-D.
