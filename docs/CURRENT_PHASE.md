# Current Phase — TRANSCRIPT-FIX-E

Phase started: 2026-05-22
Status: complete — manual transcript fallback UX fixed; route refactored with pure helper; 38 tests passing

---

## Previous phases (abbreviated)
- TRANSCRIPT-FIX-D (2026-05-22) — manual transcript paste fallback implemented, commit `b6bbc5c` — complete but UX had duplicate error display bug
- TRANSCRIPT-FIX-C (2026-05-22) — 4-client InnerTube fallback added, commit `713e0cf` — complete but all clients fail on Vercel
- TRANSCRIPT-FIX-B (2026-05-22) — diagnostic tooling + `/api/debug/transcript`, commit `71491a8` — complete
- TRANSCRIPT-FIX-A (2026-05-22) — InnerTube `?prettyPrint=false` fix, commit `b11d7ce` — complete but production still failed
- FREE-BETA-A.1 (2026-05-22) — Blocker verification, health endpoint DB check, commit `833b22e` — complete
- FREE-BETA-A (2026-05-22) — Production readiness, error UX, privacy notice, commit `562f468` — complete
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, commit `daeb5fe` — complete

---

## What Was Done in TRANSCRIPT-FIX-E

### Problem
After TRANSCRIPT-FIX-D deployed, Miha tested production and reported "manual fallback still fails."

Root cause: the API route logic was correct, but two UX bugs made the error state look broken:

1. **Duplicate error display** — same error rendered in both HeroCard hintText and ErrorPanel
2. **Paste toggle didn't clear error state** — entering paste mode from error state left ErrorPanel visible alongside the paste textarea

### What Changed

**`app/page.tsx`**
- `HeroCard` now receives `error` only in idle phase (`error={phase === "idle" ? error : null}`)
- Added `handlePasteModeToggle`: entering paste mode from error state transitions to idle and clears error
- `ErrorPanel` only renders when `error` is non-null (prevents stale "Something went wrong" ghost)
- `ErrorPanel` shows paste hint when error matches `/transcript|caption/i` and paste mode is not active
- `ErrorPanel` component: added optional `hint` prop

**`app/lib/generation/chooseGenerationInput.ts`** (new)
- Pure helper: given request body, returns `{mode, transcript?, youtubeUrl?, error?}`
- Handles: transcript priority, min/max length validation, YouTube URL format validation
- Behavioral fix vs old route: transcript ≤50 chars now returns explicit "too short" error instead of falling through to YouTube mode

**`app/api/generate/route.ts`**
- Refactored to use `chooseGenerationInput(body)` — no behavioral change to happy path
- Removed `isValidYouTubeUrl` import (now inside helper)

**`scripts/test-generation-input.mjs`** (new)
- 38 zero-cost assertions for `chooseGenerationInput` logic
- No TypeScript compiler, no AI calls, no network

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean
- Tests: ✅ 38/38 passed (`node scripts/test-generation-input.mjs`)
- Real AI calls: 0
- Cost: €0.00

---

## Next Recommended Phase

**FREE-BETA-A.4 — Miha runs one manual transcript live smoke test**

1. Deploy this commit to Vercel
2. Sign in on virnix.pro
3. Click "Video fails? Paste transcript manually" — confirm error clears and textarea appears
4. Paste a real YouTube transcript (>50 chars)
5. Click Generate — confirm output cards and credit deduction

If successful: READY FOR FIRST 5 BETA INVITES (Supabase SQL and real AI flag must also be confirmed)

After beta validated: **TRANSCRIPT-PROVIDER-A** — integrate Supadata.ai as primary transcript provider so YouTube URL flow works without manual paste.
