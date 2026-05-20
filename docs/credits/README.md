# Virnix Credits System — CREDITS-A

**Phase:** CREDITS-A  
**Date:** 2026-05-20  
**Status:** Implemented. SQL must be run manually in Supabase before production use.

---

## What was implemented

- `user_credits` Supabase table — one row per user, `balance` integer, default 3
- `ensure_user_credits()` RPC — idempotent row creation (3 trial credits for new users)
- `deduct_credits(p_amount integer)` RPC — atomic deduction, returns new balance or -1
- `app/lib/credits/types.ts` — `CreditCost`, `GenerationMode` types
- `app/lib/credits/rules.ts` — `DURATION_CREDIT_TIERS`, `MODE_EXTRA_CREDITS` constants
- `app/lib/credits/calculateCredits.ts` — `calculateCreditsForGeneration(durationSec, mode)`
- `app/lib/credits/server.ts` — `ensureUserCredits()`, `deductCredits(amount)` server helpers
- `app/api/credits/route.ts` — `GET /api/credits` — returns authenticated user's balance
- `app/components/credits/CreditBadge.tsx` — displays credit balance in top bar
- `app/lib/ai/transcript.ts` — now returns `durationSec` alongside transcript text
- `app/api/generate/route.ts` — auth check (401), credit check (402), deduction after generation
- `app/lib/types/generation.ts` — `GenerateResponse` includes optional credit fields

---

## Credit calculation rules

All calculation is server-side. Never trust client-supplied credit costs.

```
credits_used = duration_base_credits + mode_extra_credits
```

### Duration tiers (from transcript segment timing)

| Duration      | Credits |
|---------------|---------|
| 0–10 min      | 1       |
| 10–30 min     | 2       |
| 30–60 min     | 4       |
| 60–120 min    | 8       |
| 120+ min      | Blocked |

### Mode extra

| Mode                 | Extra credits |
|----------------------|---------------|
| Basic generation     | +0            |
| Advanced Content Kit | +1            |

Creator Energy Selection: +0 (included in all modes).

### Duration source

Duration is computed from YouTube transcript segment offsets (`offset + duration` of the last segment). The `youtube-transcript` library returns segments in two formats:
- **srv3 format**: offset/duration in milliseconds (integer)
- **classic XML**: offset/duration in seconds (float)

`transcript.ts` auto-detects the unit (same logic as `build-timestamped-transcript.ts`) and normalises to seconds.

If duration computation returns 0 (rare edge case with malformed segments), the system defaults to the 0–10 min tier (1 credit). This is conservative and safe.

---

## Generation flow (real AI mode)

```
POST /api/generate
  → session check → 401 if not signed in
  → fetch transcript (get durationSec) → 422 if fails
  → calculateCreditsForGeneration(durationSec, mode)
  → 422 if 120+ min blocked
  → ensure_user_credits() → 500 if fails
  → read balance → 500 if fails
  → 402 if balance < cost (with creditsRequired, creditsAvailable)
  → generate(req, preloadedTranscript)
    → AI call → throw on failure (credits NOT deducted)
  → deduct_credits(cost) → atomic UPDATE
  → return { ok: true, data, creditsUsed, creditsRemaining }
```

**Key invariants:**
- Credits are deducted ONLY after successful AI generation
- A failed AI call returns 500 — no deduction
- A transcript fetch failure returns 422 — no AI call, no deduction
- A balance-too-low rejection returns 402 — no AI call, no deduction
- Credit calculation runs on the server using actual transcript duration, never client input

---

## Mock mode

When `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false` (default), the generate route skips auth and credit checks entirely. Mock mode returns `getMockResult()` immediately. CreditBadge renders nothing (API call to `/api/credits` returns 401 if not signed in, or would return balance if signed in — but in mock dev without Supabase configured, it silently shows nothing).

---

## Free tier

- First sign-in → 3 trial credits allocated by `ensure_user_credits()`
- One-time pool — not monthly (no reset until BILLING-A)
- Credits consumed from the same pool as future paid plans
- 3 credits ≈ 3 short video generations or 1 medium video generation

---

## UI

**CreditBadge** (`app/components/credits/CreditBadge.tsx`):
- Shown in top bar between AuthButton and ThemeToggle
- On mount: fetches `GET /api/credits` to get initial balance
- After generation: balance updated from `creditsRemaining` in the response
- Shows nothing if not signed in or if Supabase is not configured
- Shows "N credit" / "N credits" in monospace font style

**Error states in generation:**
- HTTP 401: error message "Sign in to generate content." displayed at generation area
- HTTP 402: error message "Not enough credits. This generation requires N credit(s)." displayed at generation area

---

## Environment variables

No new environment variables are required for CREDITS-A. The existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

provide all the necessary auth context via `@supabase/ssr` cookie sessions. The service role key is NOT needed.

---

## Known limitations (CREDITS-A)

1. **Race condition window**: Two simultaneous generation requests from the same user that both pass the balance check could both succeed. The `deduct_credits` RPC is atomic, so only one deduction succeeds — the second returns -1 (logged as a warning, not a user-visible error). At typical usage rates this is not a practical concern.

2. **No monthly reset**: Credits don't replenish until BILLING-A implements Stripe/Paddle webhook handlers. Free users keep their 3 credits until deducted.

3. **No audit log**: `credit_transactions` table is not implemented yet. Add in CREDITS-B when transaction history is needed.

4. **No heartbeat DB check**: `GET /api/health/supabase` does not yet check database connectivity. Add `SELECT 1 FROM user_credits LIMIT 1` after confirming the schema is stable.

5. **No rate limiting**: Max 20 generations/hour per user (per PRICING-A plan) is not enforced yet. Add in CREDITS-B.

---

## Next: BILLING-A

Once CREDITS-A is live and tested:
1. Evaluate billing provider (Paddle MoR / Lemon Squeezy MoR / Stripe + Stripe Tax)
2. Implement Pro plan subscription flow
3. Webhook: `subscription.created` → allocate 100 credits
4. Webhook: `invoice.paid` → reset monthly credits
5. Pricing page UI

Full billing strategy: `docs/PRICING_CREDITS_PLAN.md`

---

## SQL

See `docs/credits/SQL.md` — **must be run manually in Supabase dashboard before production deployment.**
