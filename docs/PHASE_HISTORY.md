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
