# Current Phase — Business Docs Consolidation (BUSINESS-DOCS-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Contrarian Energy Directive Polish (CE-C, 2026-05-20) — complete

---

## Context

BUSINESS-DOCS-A is a documentation-only phase. No code changed.

Goal: merge the current Virnix product/pricing direction into business documents after:
- Premium UI polish (Phases 18–26)
- Creator Energy Selection (CE-A through CE-C)
- Real AI validation (CE-B)
- Pricing/credits strategy (PRICING-A)

---

## What Changed

### Updated: `docs/BUSINESS_DIRECTION.md`

Targeted updates — content preserved, stale sections replaced:

- **Core Positioning:** updated one-liner to "Turn long-form content into platform-native posts, hooks, and clip ideas with creator-directed AI." Secondary one-liner preserved. Added "creator intelligence engine" framing. Explicit note that AI is invisible infrastructure, not the brand.
- **Monetization Direction:** replaced old Phase 2 guesses (€19, 50 generations) with PRICING-A decisions (€20/month, 100 credits, duration tiers, credit formula, margin targets).
- **Competitive Moat:** added Creator Energy Selection and Transcript-first (no rendering) as explicit moat points. Domain-agnostic prompts added. Credits model added.
- **Creator Energy Selection:** new section — energy modes table, key rules, pricing decision, validation status.
- **Feature Priorities:** updated shipped list (CE-A through CE-C ✅). Replaced "Next tier" with auth/credits/billing sequence. Removed stale "Expanded TikTok opener pool" (fixed in QB-A).
- **Validation Status table:** new section before Business Constraints — phases QB-A through PRICING-A, next gates AUTH-A / CREDITS-A / BILLING-A.
- **Business Constraints:** added auth-first requirement and real-cost validation note.

### Created: `docs/BUSINESS_PLAN_CURRENT.md`

New 9-section business plan document reflecting current product reality:

1. Product positioning (updated one-liners, honest claims, what Virnix is not)
2. Core differentiation (7 moat points)
3. Creator Energy Selection (full mode table, rules, pricing, validation)
4. Pricing / credits model (plans, formula, examples)
5. Margin logic (why unlimited is dangerous, scenario table, key assumptions)
6. Implementation roadmap (AUTH-A → CREDITS-A → BILLING-A sequence with rules)
7. Anti-goals (13 explicit anti-goals)
8. Validation status (complete phases, next gates)
9. VIRNIX.docx note (binary file; this is the authoritative markdown source)

---

## What Was NOT Changed

- No app runtime code touched
- No UI components modified
- No prompts or AI logic touched
- No Supabase / Stripe / auth work done
- `docs/PROJECT_BRAIN.md` not rewritten (still accurate for architecture reference)
- `VIRNIX.docx` not modified (binary format; manual merge required from BUSINESS_PLAN_CURRENT.md)

---

## Validation

- `git status`: only docs changed ✅
- No build required (docs only)

---

## Next Recommended Step

**AUTH-A — Supabase authentication**

All product quality phases complete (QB-A, CE-A, CE-QA-A, CE-B, CE-C).
Pricing strategy documented (PRICING-A).
Business docs consolidated (BUSINESS-DOCS-A).
The next required step before monetization is auth.

Auth is the prerequisite for credits, which is the prerequisite for billing.
