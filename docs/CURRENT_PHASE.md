# Current Phase — Free Beta Strategy (FREE-BETA-STRATEGY-A)

Phase started: 2026-05-22
Status: complete — docs created, no runtime code changed

---

## Previous phases (abbreviated)
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, hook variants, commit `daeb5fe` — complete
- LANG-REAL-A-FIX (2026-05-21) — Multilingual smoke test re-run at 90s timeout, all 6 languages pass — complete
- LANG-REAL-A (2026-05-21) — Real AI multilingual validation, Croatian Cyrillic P0 fixed — complete
- LANG-QA-A (2026-05-21) — Language selection static audit, commit `f61ed9b` — complete
- LANG-A (2026-05-21) — Output language selection (11 languages), commit `1d2187c` — complete
- UI-POLISH-L (2026-05-21) — Dark mode output readability, commit `3c32429` — complete
- CREDITS-A (2026-05-20) — Server-side credit system (SQL must be run manually) — complete
- AUTH-A (2026-05-20) — Supabase magic link auth — complete

---

## What Changed in FREE-BETA-STRATEGY-A

Docs-only phase. No runtime code touched.

### Files Created

| File | Purpose |
|------|---------|
| `docs/beta/FREE_BETA_STRATEGY.md` | 7/14-day beta plan, success/failure criteria, user acquisition recommendation (start with 20) |
| `docs/beta/COST_CONTROL_POLICY.md` | €100 budget breakdown, cost scenarios for 20–300 users, kill switches, danger zones |
| `docs/beta/BETA_RISK_REGISTER.md` | 20-item risk table with probability, impact, early warning signs, mitigations |
| `docs/beta/BETA_LAUNCH_CHECKLIST.md` | 10-section practical checklist — must-haves before first invite |
| `docs/beta/MARKETING_TEST_PLAN.md` | Acquisition plan, 5 DM templates, 5 X posts, 3 LinkedIn drafts, 3 Reddit posts, 3 TikTok scripts, objection handling |
| `docs/beta/FOUNDER_OPERATING_SYSTEM.md` | Daily routine, decision framework, how to avoid polish/feature addiction, Claude autonomy rules |
| `docs/beta/ARCHITECTURE_BETA_GUARDRAILS.md` | Module boundaries, what not to build during beta, feature flag documentation, expected future phases |

---

## Strategic Recommendation

- Start with **20 users** (not 50 or 100)
- **3 free credits** per user (already built)
- **10-minute max** video (already enforced)
- **Creator Energy unlocked** for all beta users (showcase differentiator)
- **Best Angle visible** on all real AI output (QUALITY-C live)
- **AI cost for 20 users × 3 credits**: ~€3 — well within €100 budget

---

## Critical Prerequisites Before First Invite

1. Run `docs/credits/SQL.md` in Supabase (user_credits table + RPCs)
2. Confirm real AI generation works on production (virnix.pro)
3. Confirm credits deduct after generation
4. Confirm auth works end-to-end on production
5. Add simple privacy notice to landing page
6. Add clear error message when credits are 0
7. Write minimal terms of service (one paragraph is enough)

---

## What Was NOT Changed

- No app runtime code
- No AI prompt changes
- No Supabase schema changes
- No Stripe/billing
- No new environment variables
- No UI changes

---

## Next Recommended Phase

**FREE-BETA-A** — Production readiness confirmation before first user invite.

This is an engineering phase:
1. Confirm Supabase SQL applied and verified
2. Smoke test real AI generation on virnix.pro (not localhost)
3. Confirm credits deduction end-to-end
4. Confirm auth flow on production
5. Add visible error message for 0-credit state
6. Add visible error message for transcript fetch failure
7. Add minimal privacy notice to landing page
8. Run BETA_LAUNCH_CHECKLIST.md section A–C
9. Commit any fixes, push

Expected cost: €0–5 (a few real AI smoke test calls)
Expected time: half a day
