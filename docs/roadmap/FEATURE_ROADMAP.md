# Virnix Feature Roadmap

> Internal planning document. Features are candidates, not promises.
> Build only after validation — user behavior beats roadmap assumptions.

---

## Status legend

| Status | Meaning |
|--------|---------|
| ✅ Shipped | Validated and production-ready |
| 🔨 Next | Required before monetization — high confidence |
| 📋 Planned | Intended for a specific version — not started |
| 💡 Candidate | Strong candidate — build after validation |
| 🔭 Future | Eventually — validate demand first |
| ❌ Never | Explicit anti-goal |

---

## v0.1.x — Foundation / Private Beta

**Status:** ✅ Baseline shipped. Patch fixes as needed.

### Shipped / validated

| Feature | Phase | Status |
|---------|-------|--------|
| Premium landing page + product UI | UI phases 18–26 | ✅ Shipped |
| YouTube URL → transcript flow | Phase 0 | ✅ Shipped |
| Platform-native content generation | Phase 0–5 | ✅ Shipped |
| Timeline moment detection | Phases 12–13 | ✅ Shipped |
| Clip Guide UI (top 3 moments) | Phase 13 | ✅ Shipped |
| Transcript quality / clipability assessment | Phase 16 | ✅ Shipped |
| Content Intelligence (prompt grounding) | Phase 14–15 | ✅ Shipped |
| TikTok opener rotation (26 domain-agnostic openers) | QB-A / Phase 27 | ✅ Shipped |
| TikTok closing rotation (8 domain-agnostic closings) | QB-A / Phase 27 | ✅ Shipped |
| Creator Energy Selection (6 energies + Balanced) | CE-A / Phase 28 | ✅ Shipped |
| Creator Energy static audit (CE-QA-A) | Phase 29 | ✅ Shipped |
| Creator Energy real AI validation (CE-B) | Phase 30 | ✅ Shipped |
| Contrarian directive polish (CE-C) | Phase 32 | ✅ Shipped |
| Pricing / credits strategy documented | PRICING-A / Phase 31 | ✅ Shipped |
| Business docs consolidated | BUSINESS-DOCS-A / Phase 33 | ✅ Shipped |
| Dark / light premium theme | UI phases | ✅ Shipped |
| Feature flags system | Phase 0 | ✅ Shipped |
| Debug panel (dev-only) | Phase 2 | ✅ Shipped |
| Advanced Content Kit (blog, timestamps, short-form) | Phase 0 (flag-gated) | ✅ Shipped |

### v0.1.x patches (examples)

- Roadmap docs created (BUSINESS-DOCS-B)
- Feedback system designed (BUSINESS-DOCS-C)
- Any future prompt wording adjustments
- Any future UI polish tweaks
- Any future QA script improvements

---

## v0.2.x — Auth + Credits Foundation

**Status:** 🔨 Next. Required before any monetization.

| Feature | Phase | Status |
|---------|-------|--------|
| Supabase authentication | AUTH-A | ✅ Shipped |
| User identity (user_id in DB) | AUTH-A | ✅ Shipped |
| Session management | AUTH-A | ✅ Shipped |
| Credit balance per user | CREDITS-A | 🔨 Next |
| Server-side credit calculation | CREDITS-A | 🔨 Next |
| Credit check before AI call (reject 402 if insufficient) | CREDITS-A | 🔨 Next |
| Atomic credit deduction + generation start | CREDITS-A | 🔨 Next |
| Free tier: 3 trial credits allocated on signup | CREDITS-A | 🔨 Next |
| Basic account state (plan, credits remaining) | CREDITS-A | 🔨 Next |
| Usage guardrails (rate limit, duration check) | CREDITS-A | 🔨 Next |

**Gate:** Do not ship CREDITS-A without AUTH-A complete.

---

## v0.3.x — Billing + Pro Plan

**Status:** 📋 Planned. Blocked on v0.2.x.

| Feature | Phase | Status |
|---------|-------|--------|
| Stripe subscription integration | BILLING-A | 📋 Planned |
| Pro plan activation flow | BILLING-A | 📋 Planned |
| Monthly credit allocation (100 credits on billing date) | BILLING-A | 📋 Planned |
| Webhook: subscription.created → allocate credits | BILLING-A | 📋 Planned |
| Webhook: invoice.paid → reset monthly credits | BILLING-A | 📋 Planned |
| Failed payment / cancel handling | BILLING-A | 📋 Planned |
| Pricing page | UI-PRICING-A | 📋 Planned |
| Upgrade CTA in product | UI-PRICING-A | 📋 Planned |
| Credit display in UI (X credits remaining) | UI-CREDITS-A | 📋 Planned |
| Credit cost estimate before generation | UI-CREDITS-A | 📋 Planned |
| Pro gating: Creator Energy on Free | UI-CREDITS-A | 📋 Planned |
| Pro gating: Advanced Kit on Free | UI-CREDITS-A | 📋 Planned |

| Lightweight feedback widget (post-generation) | UI-FEEDBACK-A | 📋 Planned |
| Feedback stored to DB (anonymous pre-auth, user_id post-auth) | UI-FEEDBACK-A | 📋 Planned |
| Internal feedback review process (manual during private beta) | PROCESS | 📋 Planned |

**Gate:** Validate Stripe + credit webhook reliability before exposing to real users.  
**Note:** Feedback widget can ship in v0.3.x once auth exists, or as anonymous-only in v0.2.x.

---

## v0.4.x — History + Saved Generations

**Status:** 💡 Candidate. Build after Pro validates.

| Feature | Status |
|---------|--------|
| Generation history list | 💡 Candidate |
| Saved outputs per generation | 💡 Candidate |
| Regenerate from previous transcript | 💡 Candidate |
| Copy/export improvements | 💡 Candidate |
| Minimal creator dashboard (history only) | 💡 Candidate |

| Feedback-informed improvements (prompt/platform refinements from v0.3.x data) | PROCESS | 💡 Candidate |

**Note:** History requires auth + DB writes. Do not build before v0.2.x.  
**Note:** Dashboard must stay minimal — not a metrics dashboard, just history access.

---

## v0.5.x — Upload Support

**Status:** 💡 Candidate. Build after Pro validates.

| Feature | Status |
|---------|--------|
| Audio file upload (MP3, WAV) | 💡 Candidate |
| MP4/video upload + transcript extraction | 💡 Candidate |
| File size limits (server-enforced) | 💡 Candidate |
| Transcription cost control (server-side duration check) | 💡 Candidate |
| Delete raw audio immediately after transcript extraction | 💡 Candidate |
| Transcript-only storage | 💡 Candidate |
| Duration cost display for uploaded files | 💡 Candidate |

**Note:** Audio upload activates the transcription cost driver. This is when Scenario C (72% margin) becomes real. Validate credits + billing stability first.

---

## v0.6.x — Studio Workflows

**Status:** 🔭 Future. Build after Pro validates at €1k MRR.

| Feature | Status |
|---------|--------|
| Batch link processing | 🔭 Future |
| Export content packs (all platforms, one ZIP) | 🔭 Future |
| Saved brand voice candidate | 🔭 Future |
| Client / project folders | 🔭 Future |
| Team seats (2–3) | 🔭 Future |
| Studio pricing tier (€49/month, 350 credits) | 🔭 Future |
| Priority processing | 🔭 Future |
| Studio/Agency feedback categories (client workflow feedback) | 🔭 Future |

---

## v1.0.0 — Stable Public Launch

**Status:** 🔭 Future milestone. Gate, not a schedule.

**Requirements before calling this v1.0.0:**

| Requirement | Status |
|-------------|--------|
| Stable auth (Supabase, session management) | ✅ Shipped (AUTH-A) |
| Stable credits (check/deduct/allocate cycle tested) | ⏳ Blocked on v0.2.x |
| Stable billing (Stripe webhooks validated) | ⏳ Blocked on v0.3.x |
| Reliable generation flow (timeout, retry, error handling) | ✅ Shipped (Phase 2) |
| Production cost controls (duration limits, rate limiting) | ⏳ Blocked on v0.2.x |
| Clear pricing page | ⏳ Blocked on v0.3.x |
| User feedback loop (post-generation widget, planned in v0.3.x) | 📋 Planned |
| Minimal onboarding (empty state, first-run UX) | 💡 Candidate |
| Real-world validation (50+ real API generations logged) | ⏳ Blocked on auth |

**Do not rush v1.0.0.** Use it as a quality gate. If auth or credits are fragile, stay on 0.x.

---

## Features that will never be built (anti-goals)

| Feature | Why |
|---------|-----|
| ❌ Analytics dashboard | Clip moments are discoveries, not metrics |
| ❌ Social media scheduling | Virnix generates, doesn't manage |
| ❌ Video editing | Transcript-based only |
| ❌ AI image generation | Not our workflow |
| ❌ Unlimited generation plan | Power user inversion kills margin |
| ❌ Enterprise admin panel | Not our market |
| ❌ Virality prediction score | Psychological density ≠ viral guarantee |
| ❌ AI provider branding | AI is infrastructure, not the product |

---

## Future tier readiness checklist

Before launching Studio (€49/month):
- [ ] Pro at €1k MRR
- [ ] Audio upload live + transcription costs validated
- [ ] Export pack feature complete
- [ ] Brand voice feature validated with real creators
- [ ] 350-credit allocation tested end-to-end

Before launching Agency (€99/month):
- [ ] Studio validated with paying users
- [ ] Client/project folder feature built
- [ ] Team seats implemented
- [ ] 900-credit allocation tested
- [ ] Evidence of agency-type usage patterns in real data
