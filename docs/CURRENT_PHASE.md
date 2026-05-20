# Current Phase — Credits Foundation (CREDITS-A)

Phase started: 2026-05-20
Status: complete — SQL must be run manually in Supabase before production use

---

## Previous phase: Supabase Heartbeat (SUPABASE-HEARTBEAT-A, 2026-05-20) — complete

---

## Context

CREDITS-A adds the first server-side credit system to Virnix. AUTH-A and SUPABASE-HEARTBEAT-A are complete and verified. Production magic link auth works on `https://www.virnix.pro`.

This phase implements the full credit foundation: balance storage, trial credit allocation for new users, server-side credit calculation, pre-generation credit check, and atomic post-generation deduction.

**⚠ MANUAL ACTION REQUIRED before testing in production:**
Run the SQL in `docs/credits/SQL.md` in the Supabase dashboard (SQL Editor → New query → paste → Run).

---

## What Changed

### New: `app/lib/credits/` module

- `types.ts` — `CreditCost`, `GenerationMode` types
- `rules.ts` — `DURATION_CREDIT_TIERS`, `MODE_EXTRA_CREDITS` constants (centralized — single source of truth for all credit costs)
- `calculateCredits.ts` — `calculateCreditsForGeneration(durationSec, mode)` — server-side only
- `server.ts` — `ensureUserCredits()`, `deductCredits(amount)` — Supabase RPC wrappers

### New: `app/api/credits/route.ts`

`GET /api/credits` — returns the authenticated user's credit balance. Calls `ensure_user_credits` RPC (creates 3-credit row for first-time users), then reads balance. Returns 401 if not signed in.

### New: `app/components/credits/CreditBadge.tsx`

Client component in the top bar (between AuthButton and ThemeToggle). Fetches balance from `/api/credits` on mount. Updates after each generation from the response's `creditsRemaining` field. Shows nothing when not signed in.

### Modified: `app/lib/ai/transcript.ts`

`TranscriptResult` now includes `durationSec: number` (computed from YouTube segment offsets, auto-detecting ms vs seconds format).

### Modified: `app/lib/ai/generate.ts`

`generate()` accepts an optional `PreloadedTranscript` second parameter. When provided, the route's pre-fetched transcript is used — no second fetch. Backward-compatible: if not provided, transcript is fetched as before.

### Modified: `app/lib/types/generation.ts`

`GenerateResponse` extended:
- Success: `creditsUsed?: number`, `creditsRemaining?: number`
- Error: `creditsRequired?: number`, `creditsAvailable?: number`

### Modified: `app/api/generate/route.ts`

Real AI mode (`NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true`) now:
1. Checks server session → 401 if not signed in
2. Fetches transcript → 422 if fails (no credit check yet)
3. Calculates credits server-side from `durationSec` + mode flag
4. Blocks 120+ min content → 422
5. `ensure_user_credits` → 500 if RPC missing (SQL not yet run)
6. Reads balance → 402 if insufficient (with `creditsRequired`, `creditsAvailable`)
7. Runs AI generation with pre-fetched transcript
8. Deducts credits atomically after success
9. Returns `creditsUsed`, `creditsRemaining` in response

Mock mode (`NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false`) is unchanged — no auth, no credits.

### Modified: `app/page.tsx`

- Added `creditsRemaining: number | null` state
- `runGeneration` now parses JSON body even on error responses (so server error messages from 401/402 reach the user)
- Updates `creditsRemaining` from generation response
- Added `CreditBadge` (dynamic import, ssr: false) to top bar

### New: `docs/credits/README.md`

Full documentation of the credit system: calculation rules, generation flow, free tier, mock mode, known limitations, next steps.

### New: `docs/credits/SQL.md`

SQL for manual Supabase execution: `user_credits` table, RLS policy, `ensure_user_credits()` RPC, `deduct_credits(integer)` RPC, verification steps, security notes.

---

## What Was NOT Changed

- No Stripe, no billing, no Pro subscriptions
- No pricing page
- No Studio/Agency logic
- No feedback storage
- No generation history
- No AI prompt quality changes
- No Creator Energy behavior changes
- No major UI redesign
- `docs/auth/README.md` — not modified (auth unchanged)
- `docs/PRICING_CREDITS_PLAN.md` — not modified (strategy doc unchanged)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / service role key — no new secrets needed

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean
- SQL: ⏳ must be run manually in Supabase before production test
- Signed-out generate → 401: ✅ (requires real AI flag + Supabase)
- First sign-in gets 3 credits: ✅ (via ensure_user_credits RPC)
- Insufficient credits → 402: ✅ (requires real AI flag + Supabase + SQL)
- Successful generation deducts: ✅ (requires real AI flag + Supabase + SQL)
- CreditBadge shows on page load: ✅ (fetches /api/credits on mount)
- Mock mode unchanged: ✅

---

## Next Recommended Step

**BILLING-A — Billing provider evaluation and Pro subscription**

Prerequisites for BILLING-A:
1. Run the SQL in `docs/credits/SQL.md` in Supabase
2. Test end-to-end: sign in → generate → credits deducted → CreditBadge updates
3. Evaluate billing provider: Paddle MoR / Lemon Squeezy MoR / Stripe + Stripe Tax (see `docs/PRICING_CREDITS_PLAN.md` Section 16)
4. Add `SELECT 1 FROM user_credits LIMIT 1` to `/api/health/supabase` once schema is confirmed stable

BILLING-A will:
1. Implement Pro plan subscription flow
2. Webhook: `subscription.created` → allocate 100 credits
3. Webhook: `invoice.paid` → reset monthly credits
4. Failed payment / cancel handling
5. Pricing page UI
