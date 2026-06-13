# Credit Logic — Source of Truth

> Code source of truth: `app/lib/credits/rules.ts`
> This document explains how credits are calculated, when they are charged, and how to verify correctness.

## Duration Tiers

Credits are determined by the video's duration, reported by Supadata. The first matching tier wins.

| Tier label  | Duration          | Credits |
|-------------|-------------------|---------|
| 0–10 min    | ≤ 600 s           | 1       |
| 10–30 min   | 601 – 1 800 s     | 2       |
| 30–60 min   | 1 801 – 3 600 s   | 4       |
| 60–120 min  | 3 601 – 7 200 s   | 8       |
| 120+ min    | > 7 200 s         | blocked |

### Examples

- Simon Sinek "How Great Leaders Inspire Action" (~17:42 = 1 062 s) → **2 credits** (10–30 min tier). This is NOT a duplicate charge.
- A 5-minute YouTube Short → **1 credit**.
- A 45-minute podcast → **4 credits**.

### Mode extra credits

Advanced outputs mode adds +1 credit on top of the duration tier (currently not shipped to production; flag `advanced_outputs` is off).

## When credits are charged

1. The server verifies the user has enough credits **before** calling Anthropic.
2. Credits are deducted **after** a successful AI response, via `deductCredits()`.
3. The `generation_attempts` table stores `attempt_key` (UUID derived from `user_id + url + energyIds`). An in-flight or completed attempt blocks a second charge for the same key — idempotency guard.
4. The React `inFlightRef` prevents the UI from sending two requests in the same session.

## When credits are NOT charged

- Transcript warning returned (language mismatch) — no credits deducted.
- API error before generation — no credits deducted.
- Duplicate attempt detected (idempotency) — no additional charge.
- Video longer than 120 minutes — request blocked, no charge.

## Verifying a charge in Vercel logs

Search logs for `[virnix-credit]`. One log line per attempt:

```
[virnix-credit] status=success charged=2 attemptKey=<uuid> elapsedMs=12345
```

A legitimate 2-credit charge produces **exactly one** `charged=2` line.
A duplicate-charge bug would produce **two** `charged=1` lines with the same `attemptKey` — the idempotency guard prevents this.

## Transparency surfaces

| Surface | Location |
|---------|----------|
| Code source of truth | `app/lib/credits/rules.ts` — `DURATION_CREDIT_TIERS` |
| Internal doc | `docs/credits/CREDITS_LOGIC.md` (this file) |
| Existing credits doc | `docs/credits/README.md` |
| CreditBadge tooltip | Hover the credit badge in the top bar |
| URL hint text | Below the URL input when a valid URL is detected |
| Transcript warning panel | Above the Continue button when a caption mismatch is shown |
