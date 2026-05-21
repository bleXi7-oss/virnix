# Current Phase — Language QA (LANG-QA-A)

Phase started: 2026-05-21
Status: complete

---

## Previous phases (abbreviated)
- LANG-A (2026-05-21) — output language selection, commit `1d2187c` — complete
- UI-POLISH-L (2026-05-21) — dark mode output readability, commit `3c32429` — complete
- CREDITS-A (2026-05-20) — server-side credit system, SQL must be run manually — complete
- SUPABASE-HEARTBEAT-A (2026-05-20) — complete
- AUTH-A (2026-05-20) — magic link auth, production verified — complete

---

## Context

LANG-QA-A is a static audit of the LANG-A implementation. No new features. One new QA script created.

**Prerequisite before BILLING-A**: Run `docs/credits/SQL.md` in Supabase if not yet done.

---

## What Changed

### New: `scripts/qa/language-audit.ts`

12-section static audit script. No API calls. Zero cost. Checks:
- All 11 language IDs present in OUTPUT_LANGUAGES
- `formatLanguageContext("auto")` returns `""` (guaranteed no-op)
- Every non-auto language returns non-empty context
- Core directive phrases present in all non-auto languages
- Croatian/Bosnian/Serbian Latin no-mix warnings present
- Serbian Latin: Latin script explicit, Cyrillic explicitly forbidden
- Allowlist rejects: unknown strings, wrong case, non-string types, future languages, empty string
- Prompt injection position: inside GENERATION PROFILE, after energy context, before platform requirements
- Priority hierarchy: language > Creator Energy > variation profile

---

## Audit Results (LANG-QA-A)

- language-audit.ts: ✅ 0 failures · 1 P2 warning
- opener-audit.ts: ✅ ALL CHECKS PASS
- creator-energy-audit.ts: ✅ ALL CHECKS PASS
- Lint: ✅ clean
- Build: ✅ clean (8 routes)
- Supabase: ✅ reachable

**P2 Warning (acceptable):** Slovenian `nativeNote` has no explicit no-mix warning for Croatian/Serbian. Lower risk than the BCS group (different language family branch, less cross-contamination risk from the model). Not a blocker for BILLING-A.

---

## What Was NOT Changed

- No production code changed — audit only
- Credits logic, Supabase, auth, billing: untouched
- Language module, UI, prompt injection: unchanged from LANG-A

---

## Next Recommended Step

**BILLING-A — Billing provider evaluation and Pro subscription**

Prerequisites for BILLING-A:
1. Run `docs/credits/SQL.md` in Supabase (if not yet done)
2. Test end-to-end credits: sign in → generate → deduction → CreditBadge updates
3. Evaluate billing provider: Paddle MoR / Lemon Squeezy MoR / Stripe + Stripe Tax (see `docs/PRICING_CREDITS_PLAN.md` Section 16)

BILLING-A will:
1. Implement Pro plan subscription flow
2. Webhook: `subscription.created` → allocate 100 credits
3. Webhook: `invoice.paid` → reset monthly credits
4. Failed payment / cancel handling
5. Pricing page UI
