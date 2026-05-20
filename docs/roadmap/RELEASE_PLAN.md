# Virnix Release Plan

---

## Current baseline: v0.1.0

**Date:** 2026-05-20  
**Type:** Private beta foundation

v0.1.0 represents the first coherent private-beta baseline. The product quality phases, pricing strategy, and business docs are complete. No auth, no credits, no billing.

### What makes this v0.1.0 (not v0.0.x)

The complete core workflow is production-ready:
- YouTube URL → moment detection → platform-native generation works end-to-end
- Creator Energy steering validated with real AI
- Domain-agnostic prompts (not creator-growth-locked)
- Premium UI (dark/light) complete
- Pricing and business strategy documented

This is a coherent, demonstrable product. Hence v0.1.0, not v0.0.x.

### Phases included in v0.1.0

| Implementation phase | What it added |
|---------------------|---------------|
| Phases 0–17 | Full foundation: AI layer, prompts, UI, timeline, quality |
| UI phases 18–26 | Premium visual polish |
| QB-A (27) | TikTok domain-unlock, closing pool |
| CE-A (28) | Creator Energy Selection |
| CE-QA-A (29) | Static energy audit |
| CE-B (30) | Real AI energy validation |
| CE-C (32) | Contrarian directive polish |
| PRICING-A (31) | Pricing / credits strategy |
| BUSINESS-DOCS-A (33) | Business docs consolidation |
| BUSINESS-DOCS-B (34) | Roadmap docs, pricing tier expansion |
| BUSINESS-DOCS-C (35) | Feedback system design |
| AUTH-A (36) | Supabase magic link auth, AuthButton, login page |
| BUSINESS-DOCS-D (37) | MoR/VAT pricing approach, transaction examples, billing provider evaluation |

---

## Upcoming releases

### v0.1.x — patches (as needed)

Examples of what counts as a v0.1.x patch:
- Small UI adjustments (spacing, color, shadow)
- Copy tweaks in product or docs
- Prompt wording improvements (not new features)
- QA script improvements
- Docs corrections or additions
- Minor bug fixes

**Does not require**: new implementation phases, new DB tables, new API endpoints.

---

### v0.2.0 — Auth + credits foundation

**Planned phases:** AUTH-A (complete) + CREDITS-A  
**Prerequisite:** AUTH-A ✅ shipped  
**Gate:** Auth must be stable before exposing credits to users

What v0.2.0 adds:
- Supabase auth (signup, login, session) ✅ AUTH-A complete
- User identity (user_id) ✅ AUTH-A complete
- Credit balance per user (CREDITS-A)
- Server-side credit calculation (duration → credits) (CREDITS-A)
- Credit check before every AI call (CREDITS-A)
- Atomic credit deduction (CREDITS-A)
- Free tier: 3 trial credits on signup (CREDITS-A)
- Basic usage guardrails (rate limit, duration check) (CREDITS-A)

**Do not ship v0.2.0** until: credit deduction + generation flow is tested end-to-end, 402 rejection on zero credits is confirmed.

---

### v0.3.0 — Billing + Pro plan

**Planned phases:** BILLING-A + pricing/upgrade UI  
**Prerequisite:** v0.2.0 (credits + auth)

What v0.3.0 adds:
- **Billing provider evaluation:** Paddle (MoR) vs. Lemon Squeezy (MoR) vs. Stripe + Stripe Tax — choose before coding
- Pro plan subscription (€20/month + VAT where applicable)
- VAT-safe checkout (MoR preferred for global launch simplicity)
- Monthly credit allocation (100 on billing date, expire unused)
- Webhook reliability (subscription.created, invoice.paid, payment_failed)
- Pricing page (€20/month + VAT wording)
- Upgrade CTA
- Credit display in UI
- Pro gating for Creator Energy and Advanced Kit on Free
- Post-generation feedback widget (5-question survey, anonymous or user-linked)
- Feedback stored to DB for internal review

**Do not ship v0.3.0** until: billing provider chosen and documented, subscription webhooks tested, Pro credit allocation confirmed, Free-to-Pro upgrade flow tested, downgrade/cancel handling confirmed.  
**MoR note:** Merchant of Record (Paddle/Lemon Squeezy) handles VAT calculation, collection, and filing globally. Higher per-transaction fee (~5% + ~€0.50) but near-zero tax compliance overhead for early-stage. Full comparison: `docs/PRICING_CREDITS_PLAN.md` Section 16.

---

### v0.4.0 — History + saved generations

**Planned phases:** TBD  
**Prerequisite:** v0.3.0 (paying users have accounts worth preserving)

What v0.4.0 adds:
- Generation history list per user
- Saved outputs
- Regenerate from previous transcript
- Minimal history view (not a full dashboard)

---

### v0.5.0 — Upload support

**Planned phases:** TBD  
**Prerequisite:** v0.3.0 + transcription cost validated

What v0.5.0 adds:
- Audio file upload (MP3, WAV)
- MP4 video upload with transcript extraction
- File size limits (server-enforced)
- Transcription cost integration into credit system
- Delete raw files immediately after extraction

**Note:** This is when Scenario C cost modeling (72% margin with transcription) becomes real. Do not ship without production cost validation.

---

### v1.0.0 — Stable public launch

**Prerequisite:** v0.3.0 stable in production, real-world cost validated, basic user feedback loop in place.

Use as a quality gate, not a deadline. See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md#v100----stable-public-launch) for the full checklist.

---

## Changelog format

Use this format for every MINOR or significant PATCH release:

```
## v0.2.0 — Auth + Credits Foundation

**Version:** 0.2.0
**Date:** YYYY-MM-DD
**Type:** MINOR — new user-visible capability
**Summary:** Supabase auth and server-side credit system. Free tier gated. 402 on zero credits.

**Changed:**
- AUTH-A: Supabase signup/login/session
- CREDITS-A: credit balance, calculation, check/deduction
- Free tier: 3 trial credits allocated on signup
- Rate limiting: 20 generations/hour per user

**Validation:**
- Auth flow: tested (signup, login, session, logout)
- Credit deduction: tested (atomic, 402 on zero balance confirmed)
- Free tier: tested (3-credit pool, max 10 min enforced)

**Commit:** (hash)
```

For PATCH releases, a shorter format is acceptable:

```
## v0.1.1

**Type:** PATCH
**Summary:** Roadmap docs added, minor prompt refinement.
**Commit:** (hash)
```

---

## How to decide PATCH vs MINOR vs MAJOR

Ask:
1. Did a user gain access to a new capability they didn't have before? → MINOR
2. Did the underlying architecture change significantly? → MINOR (possibly MAJOR)
3. Did something get fixed or polished without new capability? → PATCH
4. Is this the first time the product is fully stable and production-ready for public use? → MAJOR (v1.0.0)

When in doubt: MINOR is safer than PATCH, PATCH is safer than MAJOR.

---

## Release checklist

Before any MINOR release:

- [ ] `npm.cmd run lint` — clean
- [ ] `npm.cmd run build` — clean
- [ ] All QA scripts pass (opener-audit, creator-energy-audit)
- [ ] No `.env.local` staged
- [ ] No API keys in any committed file
- [ ] CURRENT_PHASE.md updated
- [ ] PHASE_HISTORY.md updated
- [ ] This RELEASE_PLAN.md updated with new entry
- [ ] Commit pushed to `origin/main`
