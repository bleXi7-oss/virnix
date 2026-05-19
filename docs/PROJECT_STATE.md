# Virnix — Project State

Current snapshot of what is built, what is validated, and what is not yet done.
Update this file whenever a phase completes.

---

## What Exists (as of 2026-05-19)

### Core Pipeline
- YouTube transcript fetch via `youtube-transcript`
- Transcript truncation / best-segment selection (content-density scoring)
- Feature-flagged real AI generation (off by default — mock is the default)
- Anthropic Claude provider (raw fetch, no SDK) with 45s timeout + 2-retry exponential backoff
- Mock flow returns hardcoded demo cards instantly (zero cost, zero API)

### Prompt System
- Modular prompt engine with platform-specific tone/format modules
- Variation engine: 6 emotional angles × 3 opening styles × 3 CTA styles = 54+ combos
- Intelligence layer injection: story arc, hook formula, retention rule per angle
- Core prompt (5 platforms) and advanced prompt (8 platforms + alt hook selection)

### Output Layer
- Structured JSON output with schema validation + coercion (never throws)
- Safe JSON parser with fast path + deep-scan fallback (`extractLargestJsonObject`)
- `parseRepaired` and `coercionUsed` flags for diagnostic tracking
- Advanced outputs: blog summary, YouTube timestamps, short-form script
- Best-output selection: tiktok_alt / youtube_alt scored and winner returned

### Quality & Diagnostics
- `estimateViralityScore()`: 0–100 heuristic hook/title scoring
- `hasStrongHook()`, `hasCuriosityGap()`, `hasPlatformLanguage()`, `hasEmotionalWords()`
- `AIDiagnostics` interface with structured `[VIRNIX_AI]` log line per request
- Developer debug panel (gated by `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`)

### UI
- Next.js App Router, Tailwind CSS, dark/light mode
- Paste-and-go URL flow with real-time validation
- Animated loading steps
- Output card grid with copy-to-clipboard
- ErrorBoundary wrapping output panel
- DebugPanel (collapsible, dev-only)

### Infrastructure
- Vercel deployment (virnix.pro)
- Feature flags system (`NEXT_PUBLIC_FLAG_*`)
- Analytics event tracking stub (no provider connected yet)

---

## What Has NOT Been Done

- No auth / no user accounts
- No Stripe / no payments
- No database / no Supabase
- No file uploads (MP4, audio)
- No scheduling or queue
- No real analytics provider (events typed and structured, but not sent)
- No live real AI test with Anthropic key (pipeline validated at build level only)
- No mobile app
- No team workspace

---

## Validation Status

| Check | Status |
|---|---|
| `npm.cmd install` | ✅ Clean |
| `npm.cmd run build` | ✅ Clean (TypeScript OK) |
| `npm.cmd run lint` | ✅ Clean |
| Dev server | ✅ Starts at localhost:3000 |
| Mock flow | ✅ Returns demo cards |
| Real AI end-to-end | ⏳ Requires ANTHROPIC_API_KEY |
| Browser UI test | ⏳ Manual check required |
