# Current Phase — TRANSCRIPT-FIX-A

Phase started: 2026-05-22
Status: complete — transcript reliability fixed, lint/build clean, awaiting Miha's live test

---

## Previous phases (abbreviated)
- FREE-BETA-A.1 (2026-05-22) — Blocker verification, health endpoint DB check, commit `833b22e` — complete
- FREE-BETA-A (2026-05-22) — Production readiness, error UX, privacy notice, commit `562f468` — complete
- FREE-BETA-OBSERVABILITY-A (2026-05-22) — Beta observability plan, 7 docs — complete
- FREE-BETA-STRATEGY-A (2026-05-22) — Controlled beta strategy, 7 docs, 20-user plan — complete
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, commit `daeb5fe` — complete
- LANG-REAL-A (2026-05-21) — Real AI multilingual validation — complete
- CREDITS-A (2026-05-20) — Server-side credit system — complete
- AUTH-A (2026-05-20) — Supabase magic link auth — complete

---

## What Was Fixed in TRANSCRIPT-FIX-A

### Root cause identified

Production generation was failing with HTTP 422: "This video does not have captions enabled."

**Root cause:** YouTube's InnerTube API requires `?prettyPrint=false` in the URL. Without it, YouTube returns HTTP 400. The custom InnerTube fetcher added in this phase was initially missing this parameter, making it fall through to HTML scraping, which fails on Vercel's cloud IPs (YouTube serves a different page without inline JSON).

Additionally, the package was returning Arabic captions for Simon Sinek's TEDx talk (first available track), not English.

### What changed

**`app/lib/ai/transcript.ts`** — Complete rewrite:
- Added `fetchViaInnerTubeDirect`: custom InnerTube fetcher with correct URL (`?prettyPrint=false`), full Android client context (`hl: "en"`, `gl: "US"`, version `20.10.38`, X-YouTube headers)
- Runs BEFORE the `youtube-transcript` package fallback (better for cloud IPs)
- English caption preference: prefers `en` → `en-*` → first available
- Package fallback now passes `lang: "en"` with graceful retry without lang if not available
- Improved `toFriendlyError`: distinguishes CAPTCHA/rate-limit from disabled captions

**`app/page.tsx`**:
- Changed hint text: "No account required · Works with any captioned YouTube video" → "Free beta · Sign in required · Works with captioned YouTube videos"

**`scripts/test-transcript.mjs`** — Rewritten:
- URL parsing: 13 test cases (all passed)
- Package fallback path: 4 videos (all passed)
- Enhanced InnerTube path: 3 videos via direct API call (all passed)

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean
- URL parsing tests: ✅ 13/13
- Transcript tests: ✅ all passed locally
- Real AI calls: 0 (zero cost)

---

## Next Recommended Phase

**FREE-BETA-A.3 — Miha runs one final live generation smoke test**

Not an engineering phase. Miha:
1. Waits for Vercel to deploy (auto-deploys on push to main, ~2 min)
2. Signs in on virnix.pro → confirms 3 credits
3. Clicks "Simon Sinek · TEDx" sample button
4. Confirms output cards, UseThisFirstCard, English content, credits deducted (3→1)
5. If passes: **READY FOR FIRST 5 BETA INVITES → FREE-BETA-D**

See `docs/beta/TRANSCRIPT_FIX_A_REPORT.md` for full details and manual test steps.
