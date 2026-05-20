# Current Phase — Pricing & Credits Plan (PRICING-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Creator Energy Real AI Validation (CE-B, 2026-05-20) — complete

---

## Context

PRICING-A is a strategy/documentation phase only.
Nothing was implemented. No code was written. No schema was added.

Goal: establish a credits pricing model that protects Virnix margin from power users while remaining simple for creators to understand.

---

## What Was Done

### New: `docs/PRICING_CREDITS_PLAN.md`

15-section pricing and credits strategy document covering:

1. Executive summary
2. Why credits (not unlimited)
3. Why unlimited is dangerous (unit economics breakdown)
4. Proposed plans — Free (3 trial credits) and Pro (€20/month, 100 credits)
5. Credit consumption rules — duration tiers + mode extra
6. Advanced mode pricing (+1 credit for Advanced Content Kit)
7. Creator Energy decision (included in Pro, no extra cost)
8. Example user scenarios — 4 archetypes with cost + margin estimates
9. Margin assumptions — Sonnet 4.6 pricing, transcription cost projections, Stripe fees
10. Abuse prevention — hard limits, soft limits, free tier vectors
11. What to show users in UI — creator-native copy, credit cost labels
12. What NOT to expose — no tokens, no model names, no API language
13. Future pricing tiers — Creator tier, Team tier, pay-as-you-go
14. Implementation notes for later — file structure, calculation formula, DB sketch
15. Open questions before coding

---

## Credit System Design (no code yet)

```
credits_used = duration_base_credits + mode_extra_credits
```

| Duration | Credits |
|----------|---------|
| 0–10 min | 1 |
| 10–30 min | 2 |
| 30–60 min | 4 |
| 60–120 min | 8 |
| 120+ min | Blocked |

Advanced Content Kit: +1 credit.
Creator Energy: included at no extra cost.

---

## Margin Model

At €20/month / 100 credits:

| User type | Credits used | Est. AI cost | Gross margin |
|-----------|-------------|--------------|--------------|
| Short-form creator | ~20 | ~€0.70 | ~92% |
| Mixed creator | ~23 | ~€0.36 | ~94% |
| Podcast power user (now) | ~64 | ~€0.40 | ~98% |
| Podcast power user (w/ transcription) | ~64 | ~€4.72 | ~72% |
| Advanced mode heavy | ~60 | ~€1.12 | ~90% |

All scenarios within 60–80% gross margin target.

---

## What Was NOT Implemented

- No Stripe integration
- No credit database tables
- No auth changes
- No feature flags
- No UI changes
- No pricing page
- No billing logic
- No API changes

---

## Validation Status

- No build required (documentation only)
- Lint: N/A
- git status: clean

---

## Next Recommended Step

**AUTH-A — Supabase authentication**

Credits require user identity. Auth is the prerequisite for the entire billing system. Without auth, credits cannot be tracked per user. Ship auth before any billing implementation.

After auth: CREDITS-A (implement credit check/deduction before AI call).
After credits: BILLING-A (Stripe subscription + Pro plan gating).
