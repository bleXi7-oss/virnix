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
