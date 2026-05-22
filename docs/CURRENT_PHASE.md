# Current Phase — Blocker Verification (FREE-BETA-A.1)

Phase started: 2026-05-22
Status: complete — docs created, health endpoint updated, manual blockers documented for Miha

---

## Previous phases (abbreviated)
- FREE-BETA-A (2026-05-22) — Production readiness, error UX, privacy notice, commit `562f468` — complete
- FREE-BETA-OBSERVABILITY-A (2026-05-22) — Beta observability plan, 7 docs — complete
- FREE-BETA-STRATEGY-A (2026-05-22) — Controlled beta strategy, 7 docs, 20-user plan — complete
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, commit `daeb5fe` — complete
- LANG-REAL-A (2026-05-21) — Real AI multilingual validation — complete
- CREDITS-A (2026-05-20) — Server-side credit system — complete
- AUTH-A (2026-05-20) — Supabase magic link auth — complete

---

## Critical Finding in FREE-BETA-A.1

**Production is running in MOCK MODE.**

Confirmed by: unauthenticated POST to `https://virnix.pro/api/generate` returned HTTP 200 with mock data (`"provider":"mock","elapsedMs":0,"fallbackUsed":true`).

This means:
- Auth gate for generation is NOT active on production
- Credit system is NOT active on production
- Real Anthropic AI is NOT being called
- Any visitor can "generate" — but sees only hardcoded demo cards

**Fix:** Miha must set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` in Vercel → Settings → Environment Variables → Production → then Redeploy.

---

## What Changed in FREE-BETA-A.1

### Code changes (1 file)

**`app/api/health/supabase/route.ts`** — Added DB connectivity check:
- Now queries `user_credits?select=user_id&limit=0` with anon key (read-only, no mutations)
- New response field: `"dbReachable": true/false`
- If table exists with RLS: returns `dbReachable: true`
- If table doesn't exist: returns `dbReachable: false` with `dbMessage: "user_credits table not found — run docs/credits/SQL.md in Supabase dashboard"`
- Allows remote verification of Supabase SQL application after deployment

### Docs created/updated (4 files)

| File | What Changed |
|------|-------------|
| `docs/beta/FREE_BETA_A1_BLOCKER_VERIFICATION.md` | NEW — per-blocker analysis, manual steps, pass criteria |
| `docs/beta/BETA_LAUNCH_CHECKLIST.md` | Blocker 2 updated to CONFIRMED FAILING; K section updated |
| `docs/CURRENT_PHASE.md` | This file |
| `docs/PHASE_HISTORY.md` | Phase 47 entry added |

---

## Blocker Status After FREE-BETA-A.1

| Blocker | Status |
|---------|--------|
| 1. Supabase SQL applied | ⚠️ CANNOT CONFIRM — manual Supabase dashboard required |
| 2. Real AI flag in Vercel | ❌ CONFIRMED FAILING — must fix before inviting users |
| 3. Live generation test | ⚠️ MANUAL REQUIRED — needs Blockers 1+2 cleared first |
| 4. Auth magic link end-to-end | ⚠️ MANUAL REQUIRED — needs browser + email |

---

## Exact Steps for Miha (60 minutes total)

See `docs/beta/FREE_BETA_A1_BLOCKER_VERIFICATION.md` for full detail with pass criteria.

### Step A — Fix Vercel flag (~10 min)
1. Vercel dashboard → your project → Settings → Environment Variables
2. Add/update `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` = `true` for Production
3. Redeploy
4. Verify: unauthenticated POST to `/api/generate` returns 401

### Step B — Verify Supabase SQL (~20 min)
1. https://app.supabase.com → your project → confirm NOT paused
2. SQL Editor → run SQL from `docs/credits/SQL.md`
3. Table Editor → confirm `user_credits` table with RLS icon
4. Database → Functions → confirm `ensure_user_credits()` and `deduct_credits()`
5. `GET https://virnix.pro/api/health/supabase` → confirm `"dbReachable": true`

### Step C — Auth end-to-end (~15 min)
1. Supabase → Auth → URL Configuration → confirm redirect URLs include `https://virnix.pro/auth/callback`
2. virnix.pro incognito → Sign in → magic link → click → confirm signed in + credits visible

### Step D — One live generation (~15 min)
1. Signed in on virnix.pro → paste short public YouTube URL → generate once
2. Confirm output cards, UseThisFirstCard, credits deducted
3. Confirm Supabase balance decreased
4. Confirm Anthropic dashboard shows ~€0.05 charge

---

## Validation

- Lint: ✅ clean (exit 0)
- Build: see build output (running)
- Real AI calls: 0
- Estimated cost: €0.00
- Production endpoint checks: 1 (unauthenticated POST — safe, zero cost)

---

## Next Recommended Phase

**FREE-BETA-A.2 — Miha manual production verification**

Not an engineering phase. Miha works through the 4-step checklist above (~60 min). No code changes expected. After all 4 steps pass, proceed directly to:

**FREE-BETA-D — Send first 5 controlled beta invites**
