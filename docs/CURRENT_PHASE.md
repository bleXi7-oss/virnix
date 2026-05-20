# Current Phase — Auth Cleanup + Checker Fix (AUTH-A-CLEANUP)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Merchant of Record / VAT-Safe Pricing Plan (BUSINESS-DOCS-D, 2026-05-20) — complete

---

## Context

AUTH-A-CLEANUP closes out the auth debugging sequence (AUTH-A → FIX → FIX-2 → FIX-3 → CLEANUP).

Root cause of the auth failures: typo in Supabase project URL (missing `p` in the project ref). Correct URL is `https://pbpqvuxnlmwxmcdybtvc.supabase.co`. After fixing the URL in `.env.local` and Vercel env vars and redeploying, production magic link works. User can sign in on `https://www.virnix.pro` and `AuthButton` shows email + Sign out.

This phase is small cleanup only:
1. Fixed checker false negative — script now sends `apikey` + `Authorization` headers; `/auth/v1/health` was returning 401 because request had no headers
2. Added publishable key format detection — `sb_publishable_*` keys are now recognized and reported correctly
3. Updated `docs/auth/README.md` — correct URL documented, publishable key format noted, heartbeat section expanded and moved to pre-CREDITS-A

---

## What Changed

### `scripts/check-supabase-auth.ts`

- Sends `apikey` and `Authorization: Bearer` headers on the health check request
- Detects key format: `sb_publishable_*` (publishable), 3-part JWT (JWT), or unknown
- On 401/403 with headers present: reports "reachable but auth check rejected — key may be invalid or mismatched"
- On ENOTFOUND: improved message referencing the URL typo fix as a common cause
- Dual `RESULT:` lines for DNS and auth endpoint separately

### `docs/auth/README.md`

- Phase header updated to AUTH-A-CLEANUP
- Correct Supabase URL documented: `https://pbpqvuxnlmwxmcdybtvc.supabase.co`
- Note added about the URL typo (pbqvux → pbpqvux) as a caution
- Accepted anon key formats: JWT + publishable key documented
- Anon key troubleshooting updated to mention publishable key format
- Heartbeat section: promoted from "post-CREDITS-A" to "Pre-CREDITS-A" with expanded spec (response contract, server-side vs. client-side path distinction)

### `docs/CURRENT_PHASE.md`

- This file

---

## What Was NOT Changed

- No app runtime code (no auth components, no login page, no API routes)
- No prompts, AI logic, or generation code
- No Supabase / Stripe / billing
- No UI components
- `docs/PHASE_HISTORY.md` — append AUTH-A-CLEANUP entry manually or in next session

---

## Validation

- Build: ✅ clean
- Lint: ✅ clean
- `npx tsx scripts/check-supabase-auth.ts`: ✅ DNS reachable, auth endpoint reachable (2xx with apikey header)

---

## Next Recommended Step

**CREDITS-A — Server-side credit check and deduction**

AUTH-A is verified working end-to-end (production magic link confirmed). Now implement:
1. Server-side session read in `/api/generate`
2. Credit balance check before AI call (reject 402 if insufficient)
3. Atomic credit deduction
4. Free tier trial credit allocation on first sign-in
5. Middleware for session refresh on all routes
6. `/api/health/supabase` heartbeat route (implement at start of CREDITS-A)
