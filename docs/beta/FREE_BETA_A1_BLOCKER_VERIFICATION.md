# Virnix — FREE-BETA-A.1 Blocker Verification

**Date:** 2026-05-22
**Phase:** FREE-BETA-A.1
**Commit before phase:** `562f468` (FREE-BETA-A)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## Summary

4 blockers were identified in FREE-BETA-A. This phase verifies each as far as possible from code inspection and safe zero-cost endpoint checks.

**Critical finding:** Production is running in **MOCK MODE**. Real AI generation is disabled. The `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` flag is not set to `true` in Vercel production. This was confirmed by an unauthenticated POST to the generate endpoint that returned HTTP 200 with mock data (diagnostics: `"provider":"mock","elapsedMs":0`). This is a confirmed hard blocker.

---

## Blocker 1 — Supabase Credits SQL Applied

### What was verified (code inspection)

- `docs/credits/SQL.md` contains complete SQL migration creating:
  - `user_credits` table (user_id, balance=3, created_at, updated_at)
  - RLS enabled with one SELECT policy (`users_read_own_credits`)
  - `ensure_user_credits()` RPC — idempotent, SECURITY DEFINER
  - `deduct_credits(p_amount integer)` RPC — atomic, SECURITY DEFINER
- App code in `app/lib/credits/server.ts` calls `supabase.rpc("ensure_user_credits")` and `supabase.rpc("deduct_credits")`
- If RPCs don't exist in Supabase, all generation in real AI mode returns 500

### What was tested (endpoint)

The `/api/health/supabase` endpoint was updated in this phase (FREE-BETA-A.1) to also check database connectivity by querying `user_credits?select=user_id&limit=0` with the anon key. This is a read-only check: with RLS enabled, anon returns empty array if table exists, error if table does not exist.

After deploying this code change, call `GET https://virnix.pro/api/health/supabase` and check the `dbReachable` field:
- `"dbReachable": true` → table exists, SQL was applied ✅
- `"dbReachable": false` + `"dbMessage": "user_credits table not found"` → SQL not applied ❌

**STATUS: MANUAL VERIFICATION REQUIRED** (until Miha confirms in Supabase dashboard or endpoint check passes after deployment)

### Manual steps for Miha — Supabase SQL

**Step 1: Run the SQL (if not already done)**
1. Go to https://app.supabase.com → your project
2. Left nav → **SQL Editor** → New query
3. Open `docs/credits/SQL.md` (in this codebase) — copy the entire SQL block
4. Paste into SQL Editor → click **Run**
5. Expected: no error, "Success. No rows returned."
6. If you see "already exists" errors: the `IF NOT EXISTS` clause makes re-running safe — ignore these

**Step 2: Verify tables**
1. Supabase → left nav → **Table Editor**
2. Confirm `user_credits` table appears in the list
3. Click it — confirm columns: `user_id`, `balance`, `created_at`, `updated_at`
4. Confirm the **lock icon** is visible (RLS enabled)

**Step 3: Verify policies**
1. Supabase → **Authentication** → **Policies**
2. Find `user_credits` table — confirm one policy: `users_read_own_credits` (SELECT, using `auth.uid() = user_id`)

**Step 4: Verify RPCs**
1. Supabase → **Database** → **Functions**
2. Confirm these two functions exist:
   - `ensure_user_credits()` — returns void, security definer
   - `deduct_credits(p_amount integer)` — returns integer, security definer

**Step 5: Confirm via endpoint (after FREE-BETA-A.1 deployment)**
```
GET https://virnix.pro/api/health/supabase
```
Expected response after SQL applied:
```json
{
  "status": "ok",
  "dbReachable": true,
  "authReachable": true
}
```

**Pass criteria:** All 4 steps above confirm existence. Endpoint shows `"dbReachable": true`.

---

## Blocker 2 — Vercel Real AI Flag

### What was verified (CONFIRMED FAILING)

An unauthenticated POST to `https://virnix.pro/api/generate` with a valid YouTube URL returned:
```
HTTP 200
{
  "ok": true,
  "data": { ... },
  "diagnostics": {
    "provider": "mock",
    "elapsedMs": 0,
    "estimatedTokens": 0,
    "fallbackUsed": true
  }
}
```

**This definitively proves:** `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` is either absent or set to `false` in Vercel production.

In real AI mode, an unauthenticated request returns 401 immediately. In mock mode, it returns 200 with hardcoded demo data. The response returned 200 — production is in mock mode.

**Consequences:**
- Auth gate is NOT active for generation on production (anyone can "generate" without signing in)
- Credit system is NOT active for generation on production (no credits checked or deducted)
- Real Anthropic API is NOT being called
- Users invited to beta would see demo content, not their actual video processed

**STATUS: CONFIRMED FAILING — requires Miha action in Vercel dashboard**

### Manual steps for Miha — Vercel flag

**Step 1: Open Vercel**
1. Go to https://vercel.com → your project (virnix)
2. Top nav → **Settings** → **Environment Variables**

**Step 2: Add or update the flag**
1. Search for `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION`
2. If it doesn't exist: click **Add New** → enter:
   - Key: `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION`
   - Value: `true`
   - Environment: check **Production** (and Preview if you want)
3. If it exists but shows `false`: click the edit icon → change value to `true` → Save

**Step 3: Redeploy**
1. After saving the env var, go to **Deployments** tab
2. Click the three-dot menu on the latest production deployment → **Redeploy**
3. Wait ~2 minutes for deployment to complete
4. Or push any commit to main — Vercel will auto-redeploy

**Step 4: Verify**

After redeployment, run this test (or use curl):
```
POST https://virnix.pro/api/generate
Content-Type: application/json
Body: {"youtubeUrl":"https://www.youtube.com/watch?v=u4ZoJKF_VuA","energyIds":[],"outputLanguage":"auto"}
```
**No auth cookies** (incognito or curl without cookies)

Expected after flag is on:
```
HTTP 401
{"ok": false, "error": "Sign in to generate content."}
```

If you still see HTTP 200 with mock data → the env var hasn't propagated or the redeploy hasn't finished.

**Pass criteria:** Unauthenticated POST returns 401, not 200.

---

## Blocker 3 — Live Generation Test on Production

### What was verified (code)

- Generate route structure is correct: auth → transcript → credits → AI → deduct → return
- Error messages are human-friendly (updated in FREE-BETA-A)
- BestAngle wired in page.tsx
- CreatorEnergySelector and LanguageSelector wired in idle state
- LoadingPanel shows steps during generation
- OutputPanel renders cards

**STATUS: MANUAL VERIFICATION REQUIRED** — requires real browser session with auth cookie, Supabase SQL applied (Blocker 1 cleared), and real AI flag on (Blocker 2 cleared). Cannot be done without browser + email access.

### Manual steps for Miha — Live generation test

Complete Blockers 1 and 2 first. Then:

**Pre-flight:**
1. Confirm `/api/health/supabase` returns `"dbReachable": true`
2. Confirm unauthenticated POST to `/api/generate` returns 401

**Test:**
1. Open **virnix.pro in an incognito browser window**
2. Click **Sign in** → enter your email → click Send magic link
3. Open email → click magic link → you should land on virnix.pro signed in
4. Confirm: AuthButton shows your email, CreditBadge shows **3 credits**
5. In the URL input, paste: `https://www.youtube.com/watch?v=u4ZoJKF_VuA` (Simon Sinek · TEDx, ~18 min — costs 2 credits)
   - OR use a shorter video under 10 minutes for 1 credit
6. Select one Creator Energy pill (e.g. Tactical)
7. Click **Generate Content**
8. Watch the loading steps (Analyzing → Building → Crafting → Done)
9. Confirm:
   - **UseThisFirstCard** appears above the output cards ("Use This First" label)
   - **ClipGuide** appears (best moments section)
   - **Output cards** appear: TikTok, Twitter/X, LinkedIn, Instagram, YouTube
   - Copy button on each card works
   - Credit badge decreased (from 3 to 2 if Simon Sinek video used, or 3→2 for 10-30 min)
10. Open Supabase → Table Editor → `user_credits` → confirm balance decreased
11. Open Anthropic dashboard → billing → confirm ~€0.04–0.06 was charged

**DevTools API key check:**
1. Before generating: open browser DevTools → Network tab
2. After generating: find the `/api/generate` request
3. Click it → Headers → Request Headers
4. Confirm: no `ANTHROPIC_API_KEY` or `x-api-key` header visible (key must be server-only)

**Estimated cost:** ~€0.04–0.06 for one generation

**Pass criteria:**
- Output cards appear with real content (not identical to demo cards)
- UseThisFirstCard appears with content specific to the video
- CreditBadge shows reduced balance
- Supabase balance confirms deduction
- Anthropic dashboard shows small charge (~€0.05)
- No API key in browser network headers

---

## Blocker 4 — Auth Magic Link Production Browser Test

### What was verified (code + endpoint)

- `/login` page exists: magic link form at `app/login/page.tsx`
- Auth callback at `/auth/callback/route.ts`: exchanges code for session, sets cookies
- `AuthButton` component: shows email + Sign out when signed in
- Supabase auth endpoint reachable from production server: `"authReachable": true` (confirmed in FREE-BETA-A)
- Redirect URLs in docs: `https://virnix.pro/auth/callback` and `https://www.virnix.pro/auth/callback` must be in Supabase allowlist

**STATUS: MANUAL VERIFICATION REQUIRED** — cannot verify magic link email delivery or redirect without real browser + email account.

### Manual steps for Miha — Auth end-to-end test

**Pre-check: Supabase redirect URL configuration**
1. Supabase → **Authentication** → **URL Configuration** → **Redirect URLs**
2. Confirm all three are present:
   - `http://localhost:3000/auth/callback`
   - `https://virnix.pro/auth/callback`
   - `https://www.virnix.pro/auth/callback`
3. If missing, add them and Save

**Test:**
1. Open **virnix.pro in incognito** (or a browser where you're not signed in)
2. Click **Sign in** (top right)
3. Enter your email → click **Send magic link**
4. Check email inbox — magic link should arrive within 30–60 seconds
5. Click the link in the email
6. You should be redirected to virnix.pro (homepage)
7. Confirm: AuthButton shows your email address
8. Confirm: CreditBadge shows credit balance (3 if first sign-in)
9. Click **Sign out** → confirm AuthButton shows "Sign in" again

**If magic link email doesn't arrive:**
- Check spam folder
- If spam: whitelist Supabase email domain
- If completely missing: check Supabase → Authentication → Logs for any email delivery errors

**If clicking link shows an error:**
- Check that `https://virnix.pro/auth/callback` is in Supabase → Auth → URL Configuration → Redirect URLs
- Check for www vs non-www mismatch (both must be listed)

**Pass criteria:**
- Magic link email arrives within 2 minutes
- Clicking link → redirected to virnix.pro
- AuthButton shows email, not "Sign in"
- CreditBadge shows 3 (or current balance if previously signed in)
- Sign out works

---

## Final Blocker Status

| Blocker | Status | Who |
|---------|--------|-----|
| 1. Supabase SQL applied | ⚠️ CANNOT CONFIRM — manual Supabase check required | Miha |
| 2. Real AI flag in Vercel | ❌ CONFIRMED FAILING — flag not set or false in production | Miha |
| 3. Live generation test | ⚠️ MANUAL REQUIRED — needs Blockers 1+2 cleared first | Miha |
| 4. Auth magic link | ⚠️ MANUAL REQUIRED — needs browser + email | Miha |

---

## Manual Verification Checklist for Miha

Work through these in order. Each step depends on the previous.

### Step A — Fix Vercel flag (30 min max)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Add/update `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` = `true` for Production
- [ ] Redeploy (push a commit or use Vercel → Redeploy button)
- [ ] Confirm: unauthenticated POST to `/api/generate` returns 401 (not 200)

### Step B — Verify Supabase SQL (20 min max)
- [ ] Go to https://app.supabase.com → your project
- [ ] Confirm Supabase project is NOT paused (dashboard shows "Active")
- [ ] SQL Editor → run SQL from `docs/credits/SQL.md` (safe to re-run)
- [ ] Table Editor → confirm `user_credits` table exists with RLS lock icon
- [ ] Database → Functions → confirm `ensure_user_credits()` and `deduct_credits()` exist
- [ ] Call `GET https://virnix.pro/api/health/supabase` → confirm `"dbReachable": true`

### Step C — Auth end-to-end test (15 min max)
- [ ] Supabase → Auth → URL Configuration → Redirect URLs → confirm both virnix.pro and www.virnix.pro URLs listed
- [ ] Open virnix.pro incognito → Sign in → send magic link → click link → confirm signed-in state
- [ ] Confirm CreditBadge shows 3 credits

### Step D — One live generation test (15 min max)
- [ ] Use a public YouTube video under 10 minutes with captions
- [ ] Generate once, signed in
- [ ] Confirm output cards, UseThisFirstCard, and ClipGuide appear
- [ ] Confirm CreditBadge decreased by 1 credit
- [ ] Confirm Supabase user_credits balance decreased
- [ ] Confirm Anthropic dashboard shows charge ~€0.04–0.06
- [ ] Confirm no API key in browser DevTools Network headers

---

## Pass Criteria Summary

All 4 blockers pass when:
1. `GET /api/health/supabase` returns `{"status":"ok","dbReachable":true,"authReachable":true}`
2. Unauthenticated POST to `/api/generate` returns 401 (not 200)
3. Magic link flow completes: email arrives → click → signed in → credits visible
4. One real generation succeeds with credit deduction confirmed in Supabase

---

## Final Recommendation

**NOT READY — MANUAL BLOCKERS REMAIN**

The code is production-ready and lint/build clean. The auth architecture is sound. The credit system is implemented correctly. The error messages are human-friendly.

The remaining blockers are all configuration and manual verification tasks:

1. **Vercel flag** — 5-minute fix in Vercel dashboard (CONFIRMED failing — must fix before inviting anyone)
2. **Supabase SQL** — 20-minute task in Supabase dashboard (must confirm before inviting anyone)
3. **Auth test** — 15 minutes, required once
4. **Generation test** — 15 minutes, required once (needs 1+2 cleared first)

Estimated total time for Miha to clear all 4 blockers: **~60 minutes.**

After all 4 are cleared: **READY FOR FIRST 5 INVITES → proceed to FREE-BETA-D.**

---

## What NOT to Do

- Do not invite users before the Vercel flag is fixed — they will see demo data, not real output
- Do not invite users before the Supabase SQL is confirmed — credits will not enforce, costs could run uncontrolled
- Do not run multiple live generation tests — one is enough; each costs ~€0.05
