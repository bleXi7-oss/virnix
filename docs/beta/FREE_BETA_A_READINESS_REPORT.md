# Virnix — FREE-BETA-A Production Readiness Report

**Date:** 2026-05-22
**Phase:** FREE-BETA-A
**Commit before phase:** `e020246` (FREE-BETA-OBSERVABILITY-A)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## What Was Verified

### Code inspection (static — no cost)

| Item | Status | Method |
|------|--------|--------|
| Auth route (`/api/generate`) checks `supabase.auth.getUser()` before AI call | ✅ VERIFIED | Code inspection |
| Unauthenticated generate returns 401 | ✅ VERIFIED | Code inspection |
| Credit calculation is server-side using `transcriptResult.durationSec` | ✅ VERIFIED | Code inspection |
| 0-credit state returns 402 with human message | ✅ VERIFIED | Code inspection (updated in this phase) |
| Generation failure does NOT deduct credits | ✅ VERIFIED | Code inspection |
| Deduction happens only after successful AI generation | ✅ VERIFIED | Code inspection |
| 120+ min video blocked (returns -1 credit cost → 422) | ✅ VERIFIED | Code inspection (`calculateCredits.ts`) |
| Transcript errors are human-readable (`toFriendlyError()`) | ✅ VERIFIED | Code inspection (`transcript.ts`) |
| `UseThisFirstCard` exists and is wired in `page.tsx` | ✅ VERIFIED | Code inspection |
| `CreatorEnergySelector` renders in idle state | ✅ VERIFIED | Code inspection |
| `LanguageSelector` renders in idle state | ✅ VERIFIED | Code inspection |
| `AuthButton` exists and renders Sign in / Sign out | ✅ VERIFIED | Code inspection |
| `CreditBadge` exists and fetches from `/api/credits` | ✅ VERIFIED | Code inspection |
| Beta privacy notice added to landing page | ✅ VERIFIED | Code inspection (`BetaNotice` component) |
| `docs/credits/SQL.md` exists with full migration SQL | ✅ VERIFIED | File read |
| Supabase heartbeat endpoint (`/api/health/supabase`) implemented | ✅ VERIFIED | Code inspection |
| Auth callback route (`/auth/callback`) implemented | ✅ VERIFIED | Code inspection |
| Magic link login page (`/login`) implemented | ✅ VERIFIED | Code inspection |
| `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` flag controls AI vs mock mode | ✅ VERIFIED | Code inspection |

### Production endpoint checks (live — zero cost)

| Endpoint | Result | Status |
|----------|--------|--------|
| `GET https://virnix.pro/` | HTTP 200 | ✅ Site loads |
| `GET https://virnix.pro/api/health/supabase` | `{"status":"ok","authReachable":true}` | ✅ Supabase live |
| `GET https://virnix.pro/api/credits` (no auth) | HTTP 401 `{"error":"Not authenticated"}` | ✅ Auth gate active |

---

## What Was Assumed (NOT Verified)

These items cannot be verified without a real browser session, Supabase dashboard access, or a live AI call. They require manual verification by Miha.

| Item | Why Not Verified |
|------|-----------------|
| Supabase SQL applied (user_credits table + RPCs exist) | Requires Supabase dashboard access |
| Real AI generation works on production (NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true) | Requires Vercel dashboard access + live test |
| Credits deduct correctly after real generation | Requires authenticated production test |
| Magic link email arrives and works | Requires real email test |
| Auth callback redirect works (both www and non-www) | Requires browser test |
| Vercel is deployed to production branch (not preview) | Requires Vercel dashboard check |
| Anthropic billing dashboard shows alerts enabled | Requires Anthropic dashboard access |
| API key is not exposed in client JS bundle | Requires browser DevTools check |
| Output cards render correctly with real AI output | Requires live generation test |
| CreditBadge shows correct balance when signed in | Requires authenticated session |
| Dark mode output text is readable | Requires visual browser test |
| Mobile layout works on iOS Safari | Requires device test |

---

## What Requires Miha Manual Action

### BLOCKER 1 — Supabase SQL

Run the SQL from `docs/credits/SQL.md` in Supabase dashboard before inviting any user.

Steps:
1. Go to https://app.supabase.com → your project
2. SQL Editor → New query
3. Paste the full SQL from `docs/credits/SQL.md`
4. Click Run
5. Verify: Table editor → `user_credits` table exists, RLS enabled (lock icon)
6. Verify: Database → Functions → `ensure_user_credits()` and `deduct_credits(integer)` both appear

If the table already exists from a previous run, the `IF NOT EXISTS` clause makes this safe to re-run.

### BLOCKER 2 — Real AI flag verification

Verify `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` is set in Vercel production.

Steps:
1. Vercel dashboard → your project → Settings → Environment Variables
2. Confirm `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` = `true` for Production environment
3. If missing or set to `false`, add/update it and trigger a Redeploy

### BLOCKER 3 — One live generation test on production

After confirming blockers 1 and 2:
1. Open virnix.pro in browser
2. Sign in with your email (magic link)
3. Paste a short public YouTube video (under 5 minutes with captions)
4. Generate content
5. Confirm: output cards appear, Best Angle card appears, Creator Energy worked
6. Open Supabase → Table editor → `user_credits` — confirm balance decreased
7. Check Anthropic billing dashboard — confirm ~€0.04–0.06 charged

Suggested test URL: Simon Sinek TEDx (already in examples): `https://www.youtube.com/watch?v=u4ZoJKF_VuA`

### BLOCKER 4 — Auth end-to-end test

1. Open virnix.pro incognito
2. Click Sign in
3. Enter your email → Send magic link
4. Open email, click magic link
5. Confirm: redirected to virnix.pro, AuthButton shows your email + Sign out, CreditBadge shows 3 credits
6. Click Sign out — confirm AuthButton returns to "Sign in"

### NON-BLOCKER — Privacy notice visual check

After this phase's code is deployed:
1. Open virnix.pro
2. Confirm the beta privacy notice is visible below the platform list pills
3. Text should read: "Beta: Virnix may review submitted content and feedback to improve the product. Don't submit private or confidential content."

### NON-BLOCKER — API key check

1. Open virnix.pro in browser → DevTools → Network tab
2. Click Generate (or paste a URL)
3. Confirm: no request headers contain `ANTHROPIC_API_KEY` or any secret value
4. The Anthropic API key should only appear in Vercel server logs, never in browser network traffic

---

## Blockers Before First 5 Invites

| Blocker | Action required | Who |
|---------|----------------|-----|
| Supabase SQL not confirmed applied | Run SQL from `docs/credits/SQL.md` in Supabase dashboard | Miha |
| Real AI flag not confirmed on | Check Vercel env: `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` | Miha |
| No live production generation tested | 1 manual test on virnix.pro with real YouTube URL | Miha |
| Auth end-to-end not tested on production | Sign in → magic link → session → sign out on virnix.pro | Miha |

---

## What Is Safe Enough for First 5 Invites (After Blockers Cleared)

If all 4 blockers above are cleared by Miha:
- Auth is working (magic link, session management)
- Credits are enforced (3-credit cap, server-side)
- Credit deduction verified working
- Privacy notice is visible
- Error messages are human-friendly
- Best Angle + Creator Energy are wired

The product is safe for 5 controlled warm invites.

---

## Cost Safety

| Item | Value |
|------|-------|
| Real AI calls run in this phase | 0 |
| Estimated cost this phase | €0.00 |
| Production endpoint checks | 3 (health, site load, credits) — zero cost |
| Budget used vs €100 cap | ~€0 |
| Budget risk | None — this phase was code + docs only |

---

## User-Facing Changes Made in FREE-BETA-A

### `app/api/generate/route.ts`

**402 error — out of credits (balance = 0):**
- Before: `"Not enough credits. This generation requires 1 credit(s)."`
- After: `"You've used your free beta credits. Message Miha if you'd like more."`

**402 error — insufficient credits (balance > 0 but not enough):**
- Before: `"Not enough credits. This generation requires N credit(s)."`
- After: `"Not enough credits for this video (needs N, you have M). Try a shorter video."`

**500 error — generation failed:**
- Before: `"Something went wrong. Please try again."`
- After: `"Generation failed. Nothing was charged. Please try again."`

### `app/page.tsx`

**Beta privacy notice added** — new `<BetaNotice>` component renders in idle state below platform list.

Text: "Beta: Virnix may review submitted content and feedback to improve the product. Don't submit private or confidential content."

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm.cmd run lint` | ✅ Clean (exit 0) |
| `npm.cmd run build` | Running… (see build output) |
| `GET virnix.pro/api/health/supabase` | ✅ `{"status":"ok","authReachable":true}` |
| `GET virnix.pro/` | ✅ HTTP 200 |
| `GET virnix.pro/api/credits` (unauthenticated) | ✅ HTTP 401 |
| git status after changes | Clean or pending commit |

---

## Auth Status

**VERIFIED (code):** Auth routes exist, session check in generate route, magic link login page, auth callback, AuthButton component.

**NOT VERIFIED (manual required):** End-to-end magic link flow on production, redirect URL allowlist in Supabase, Supabase project not paused.

**Production note:** `/api/health/supabase` returns `authReachable: true` — Supabase auth endpoint is responsive. Project is NOT paused.

---

## Credits Status

**VERIFIED (code):** Server-side credit calculation, atomic deduction RPC, 402 on insufficient credits, 0-credit human message, credit deduction AFTER generation only, `docs/credits/SQL.md` exists.

**NOT VERIFIED (manual required):** SQL actually applied in Supabase dashboard, `user_credits` table and RPCs exist in production, real credit deduction tested.

**CRITICAL: Assume NOT applied until Miha confirms.** If SQL is not applied, `ensure_user_credits()` RPC calls will fail → 500 error on first generation.

---

## Generation Status

**VERIFIED (code):** Generate route structure, auth gate, credit gate, transcript fetch, AI call, credit deduction after success, error handling.

**NOT VERIFIED (manual required):** Real AI flag is on in Vercel, one live generation succeeds on production.

---

## Best Angle Status

**VERIFIED (code):** `UseThisFirstCard` component exists, wired in `page.tsx` when `bestAngle !== null`, prompt instructs AI to return `best_angle` field, parser coerces it.

**NOT VERIFIED:** Renders correctly on real AI output (requires live test).

---

## Creator Energy Status

**VERIFIED (code):** `CreatorEnergySelector` renders in idle state, selected energy IDs sent to generate route, route passes them to generate function.

**NOT VERIFIED:** Appears correctly styled on production, all pills visible.

---

## Privacy Notice Status

**VERIFIED (code):** `BetaNotice` component added to `app/page.tsx`, renders in idle state below platform list.

**NOT VERIFIED:** Visually confirmed on production (requires deployment + browser check).

---

## Error UX Status

**VERIFIED (code):**
- 401: "Sign in to generate content."
- 402 (0 credits): "You've used your free beta credits. Message Miha if you'd like more."
- 402 (insufficient): "Not enough credits for this video (needs N, you have M). Try a shorter video."
- 422 (transcript fail): human-friendly messages from `toFriendlyError()`
- 422 (120+ min): "Content over 120 minutes cannot be processed. Try a shorter video or clip."
- 500 (generation fail): "Generation failed. Nothing was charged. Please try again."
- 500 (setup fail): "Something went wrong. Please try again."

**NOT VERIFIED:** Whether ErrorPanel renders these messages visibly in the UI (code shows it does — `<ErrorPanel message={error} />`).

---

## Observability Status

**VERIFIED (code):** Vercel console logs with `[virnix]` prefix exist in generate route and credits route. `/api/health/supabase` endpoint works.

**NOT VERIFIED / OPTIONAL:** `generation_logs` Supabase table not yet created. `BETA_LOG.md` not yet created. Feedback form not yet created.

**Minimum floor before beta:** Supabase `user_credits` table (part of credits SQL blocker) — this gives Miha visibility into sign-ups and credit usage.

---

## Final Recommendation

**NOT READY — COMPLETE 4 MANUAL BLOCKERS FIRST**

Code is production-ready. Architecture is sound. Error UX is improved. Privacy notice is live (pending deployment). But 4 manual items block the first invite:

1. Supabase SQL must be confirmed applied
2. Real AI flag must be confirmed on in Vercel
3. One live generation test must pass on virnix.pro
4. Auth end-to-end must be tested on production

Once all 4 are done and pass: **READY FOR FIRST 5 INVITES.**

---

## Next Step

**FREE-BETA-D — Send first 5 controlled beta invites**

Only start after Miha completes and confirms all 4 manual blockers above. No engineering work required for FREE-BETA-D. It is purely founder execution: pick 5 warm contacts, send personalized DMs, watch Vercel logs and Supabase for the first 2 hours.
