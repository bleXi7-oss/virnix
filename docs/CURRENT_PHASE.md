# Current Phase — Supabase Heartbeat (SUPABASE-HEARTBEAT-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Auth Cleanup (AUTH-A-CLEANUP, 2026-05-20) — complete

---

## Context

SUPABASE-HEARTBEAT-A adds a safe server-side diagnostic endpoint that verifies Supabase is configured and reachable from the Vercel server. This was planned in AUTH-A-CLEANUP as a pre-CREDITS-A step.

Production magic link is working on `https://www.virnix.pro`. AUTH-A is fully verified.

---

## What Changed

### `app/api/health/supabase/route.ts` (new file)

`GET /api/health/supabase` — server-side heartbeat endpoint.

- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env
- Validates URL format
- Fetches `/auth/v1/health` server-side with `apikey` + `Authorization: Bearer` headers (8s timeout)
- Returns JSON with safe diagnostics only — no key values, no secrets
- HTTP 200 when fully healthy, HTTP 503 on any failure
- Handles: missing env vars, malformed URL, DNS failure, timeout, 401/403, unexpected status

### `docs/auth/README.md`

- Replaced the "Pre-CREDITS-A heartbeat plan" section with "Supabase heartbeat route" — documents the implemented endpoint, response contract, what it checks, what it does NOT yet check, and why no-auth is safe for this endpoint

### `docs/CURRENT_PHASE.md`

- This file

---

## What Was NOT Changed

- No auth components, no login page, no API routes beyond the new heartbeat
- No prompts, AI logic, or generation code
- No Supabase / Stripe / billing / credits
- No UI components
- `scripts/check-supabase-auth.ts` — already up to date from AUTH-A-CLEANUP (apikey header, publishable key support)

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean — 7 routes including `/api/health/supabase`
- Checker: ✅ exit 0 (`npx.cmd tsx scripts/check-supabase-auth.ts`)
- Local endpoint: ✅ `GET http://localhost:3000/api/health/supabase` returns `{"status":"ok",...,"dnsReachable":true,"authReachable":true}`

---

## Next Recommended Step

**CREDITS-A — Server-side credit check and deduction**

AUTH-A and the heartbeat endpoint are both verified. Now implement:
1. Server-side session read in `/api/generate`
2. Credit balance check before AI call (reject 402 if insufficient)
3. Atomic credit deduction
4. Free tier trial credit allocation on first sign-in
5. Middleware for session refresh on all routes
6. Add database `SELECT 1` to heartbeat once CREDITS-A schema exists
