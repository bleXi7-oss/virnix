# Current Phase — Merchant of Record / VAT-Safe Pricing Plan (BUSINESS-DOCS-D)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Supabase Authentication (AUTH-A, 2026-05-20) — complete

---

## Context

BUSINESS-DOCS-D adds the Merchant of Record / VAT-safe pricing strategy to the documentation suite. Documentation and business planning only — no code changes.

Goal: Clarify that Pro is €20/month + VAT (not €20 VAT-included), evaluate MoR as the preferred early-launch billing approach, add worked transaction examples, and document what not to over-optimize before provider choice is made.

---

## What Changed

### Updated files

| File | Change |
|------|--------|
| `docs/PRICING_CREDITS_PLAN.md` | New Section 16 (MoR/VAT approach, fee comparison, transaction examples, recommendations, disclaimer); Section 9 billing fee note; Section 15 provider question expanded |
| `docs/BUSINESS_PLAN_CURRENT.md` | Header updated (BUSINESS-DOCS-D); Pro price updated to €20/month + VAT; new Section 11 (MoR/VAT summary); billing sequence updated to include provider evaluation; Section 12 VIRNIX.docx renumbered |
| `docs/BUSINESS_DIRECTION.md` | Header updated (BUSINESS-DOCS-D); Pro price updated to €20/month + VAT; Feature Priorities billing note updated; Validation Status: AUTH-A marked done, BILLING-A updated with MoR evaluation |
| `docs/roadmap/FEATURE_ROADMAP.md` | v0.3.x billing section: provider evaluation row added, MoR note added |
| `docs/roadmap/RELEASE_PLAN.md` | v0.3.0: billing provider evaluation step added, MoR note; BUSINESS-DOCS-D (37) added to v0.1.0 phases; AUTH-A marked complete |
| `docs/CURRENT_PHASE.md` | This file |
| `docs/PHASE_HISTORY.md` | Phase 37 appended |

---

## Key decisions documented

**Pro — €20/month + VAT where applicable**
- The €20 is the net revenue target. VAT added at checkout based on customer country and type.
- B2C: VAT added at applicable rate. B2B EU: reverse charge may apply. ⚠ confirm with accountant.

**Merchant of Record is the preferred early-launch billing approach**
- Paddle or Lemon Squeezy handle VAT calculation, collection, and filing globally
- Higher per-transaction fee (~5% + ~€0.50) but near-zero tax compliance overhead at early stage
- Evaluate Paddle / Lemon Squeezy / Stripe + Stripe Tax before BILLING-A implementation

**Transaction estimate for €20 net Pro transaction:**
- B2C with 22% VAT: customer pays €24.40, Virnix receives ~€18.28–€18.50 after MoR fees
- 100 Pro users: ~€1,828–€1,850 payout before AI costs

---

## What Was NOT Implemented

- No billing code added
- No Stripe / Paddle / Lemon Squeezy integration
- No database tables
- No checkout UI
- No credits code
- No auth changes
- No app runtime code touched

---

## Validation

- git status: only docs changed ✅
- No build required (docs only)

---

## Next Recommended Step

**CREDITS-A — Server-side credit check and deduction**

AUTH-A is complete. Now implement:
1. Server-side session read in `/api/generate`
2. Credit balance check before AI call (reject 402 if insufficient)
3. Atomic credit deduction
4. Free tier trial credit allocation on first sign-in
5. Middleware for session refresh on all routes
