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
