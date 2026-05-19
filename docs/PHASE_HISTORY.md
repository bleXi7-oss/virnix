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
