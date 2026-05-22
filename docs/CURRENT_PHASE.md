# Current Phase — Beta Observability Plan (FREE-BETA-OBSERVABILITY-A)

Phase started: 2026-05-22
Status: complete — docs created, no runtime code changed

---

## Previous phases (abbreviated)
- FREE-BETA-STRATEGY-A (2026-05-22) — Controlled beta strategy, 7 docs created, 20-user plan — complete
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, hook variants, commit `daeb5fe` — complete
- LANG-REAL-A-FIX (2026-05-21) — Multilingual smoke test re-run at 90s timeout, all 6 languages pass — complete
- LANG-REAL-A (2026-05-21) — Real AI multilingual validation, Croatian Cyrillic P0 fixed — complete
- LANG-QA-A (2026-05-21) — Language selection static audit, commit `f61ed9b` — complete
- LANG-A (2026-05-21) — Output language selection (11 languages), commit `1d2187c` — complete
- UI-POLISH-L (2026-05-21) — Dark mode output readability, commit `3c32429` — complete
- CREDITS-A (2026-05-20) — Server-side credit system (SQL must be run manually) — complete
- AUTH-A (2026-05-20) — Supabase magic link auth — complete

---

## What Changed in FREE-BETA-OBSERVABILITY-A

Docs-only phase. No runtime code touched.

### Files Created

| File | Purpose |
|------|---------|
| `docs/beta/BETA_OBSERVABILITY_PLAN.md` | 10-section plan: what to track, feedback schema, privacy rules, DB tables, daily review, signal/noise framework |

### Files Updated

| File | What Was Added |
|------|---------------|
| `docs/beta/BETA_LAUNCH_CHECKLIST.md` | New Section K — Observability Readiness (9 checklist items) |
| `docs/beta/FREE_BETA_STRATEGY.md` | Note that beta is for learning from identifiable people, not anonymous traffic |
| `docs/beta/FOUNDER_OPERATING_SYSTEM.md` | Expanded daily check table, BETA_LOG.md write guidance, signal vs. noise section |
| `docs/beta/ARCHITECTURE_BETA_GUARDRAILS.md` | New Observability section — allowed/prohibited logging, architecture constraints, RLS rule |

---

## Key Observability Decisions

- **generation_logs table** — Supabase, service-role only. Log user_id, email, URL, status, credits, elapsed_ms. Never log transcript text or AI output.
- **No analytics provider** for first 20 users — Vercel logs + Supabase direct watching is sufficient.
- **Privacy notice is a hard blocker** before any user invite. Exact text provided in BETA_OBSERVABILITY_PLAN.md Section 5.
- **Feedback collection** can be a DM for first wave. Tally form is better but not required.
- **Transcript and generated content must never be stored in any database or sent to analytics.**

---

## What Was NOT Changed

- No app runtime code
- No AI prompt changes
- No Supabase schema changes (generation_logs table is optional, not yet applied)
- No Stripe/billing
- No new environment variables
- No UI changes

---

## Next Recommended Phase

**FREE-BETA-A** — Production readiness confirmation before first user invite.

This is an engineering phase:
1. Confirm Supabase SQL applied and verified (user_credits table + RPCs)
2. Smoke test real AI generation on virnix.pro (not localhost)
3. Confirm credits deduction end-to-end
4. Confirm auth flow on production
5. Add visible error message for 0-credit state
6. Add visible error message for transcript fetch failure
7. Add minimal privacy notice to landing page (text provided in BETA_OBSERVABILITY_PLAN.md Section 5)
8. [ Optional ] Apply generation_logs table SQL from BETA_OBSERVABILITY_PLAN.md Section 7
9. Run BETA_LAUNCH_CHECKLIST.md sections A–C
10. Commit any fixes, push

Expected cost: €0–5 (a few real AI smoke test calls)
Expected time: half a day
