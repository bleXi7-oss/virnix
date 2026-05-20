# Virnix Roadmap

**Current product stage:** Private beta foundation (v0.1.0)

This folder contains the practical planning documents for Virnix product development.

> This roadmap is an internal planning tool, not a public promise. Features marked "planned" or "future" are candidates — they get built when validated by real user behavior, not by schedule.

---

## Documents in this folder

| File | Purpose |
|------|---------|
| [VERSIONING.md](VERSIONING.md) | How version numbers work for Virnix |
| [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) | Features by version milestone |
| [RELEASE_PLAN.md](RELEASE_PLAN.md) | Current baseline, next releases, changelog format |

## Related docs

| File | Purpose |
|------|---------|
| [../BUSINESS_PLAN_CURRENT.md](../BUSINESS_PLAN_CURRENT.md) | Full current business plan |
| [../PRICING_CREDITS_PLAN.md](../PRICING_CREDITS_PLAN.md) | Full credits pricing strategy |
| [../BUSINESS_DIRECTION.md](../BUSINESS_DIRECTION.md) | Strategic operating document |
| [../feedback/README.md](../feedback/README.md) | Feedback system plan |

---

## Current state (v0.1.0 baseline)

Private beta foundation. Product quality phases complete. No auth, no credits, no billing.

**Shipped and validated:**
- Premium UI (black chrome dark / pearl white light)
- YouTube URL → transcript → moment detection → content generation
- Strongest Moments / Clip Guide / Content Intelligence
- Creator Energy Selection (CE-A through CE-C, real AI validated)
- Domain-agnostic TikTok opener/closing system (QB-A)
- Pricing/credits strategy documented (PRICING-A)
- Business docs consolidated (BUSINESS-DOCS-A, BUSINESS-DOCS-B)
- Feedback system designed (BUSINESS-DOCS-C)

---

## Next implementation sequence

```
v0.2.0 — Auth + credits foundation
  └─ AUTH-A: Supabase authentication
  └─ CREDITS-A: server-side credit check / deduct / allocate

v0.3.0 — Billing + Pro plan
  └─ BILLING-A: Stripe subscription
  └─ Pricing page + upgrade flow

v0.4.0 — History + saved generations
v0.5.0 — Upload support (audio / MP4)
v0.6.0 — Studio workflows

v1.0.0 — Stable public launch
```

Auth is the prerequisite for everything else. Do not build credits without auth.

---

## Launch tiers (planned)

| Tier | Price | Status |
|------|-------|--------|
| Free | — | Launch with Pro |
| Pro | €20/month | Launch tier |
| Studio | €49/month | Future — after Pro validates |
| Agency | €99/month | Future — after Studio validates |

Do not launch Studio or Agency before Pro reaches €1k MRR.
