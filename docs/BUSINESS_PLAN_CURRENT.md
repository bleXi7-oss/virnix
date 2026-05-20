# Virnix — Current Business Plan

**Phase:** BUSINESS-DOCS-C  
**Date:** 2026-05-20  
**Status:** Living document. Update when strategy changes.

> This is the markdown source for the Virnix business plan.
> VIRNIX.docx (project root) should be updated manually from this file.
> This document reflects product state after Phases 1–35 (BUSINESS-DOCS-C complete).
> Full feature roadmap and versioning: docs/roadmap/
> Feedback system design: docs/feedback/

---

## 1. Product Positioning

**Primary positioning:**
> "Turn long-form content into platform-native posts, hooks, and clip ideas with creator-directed AI."

**Short-form:**
> "Turn 1 podcast into 30 viral posts in 60 seconds."

### What Virnix is

Virnix is a **creator intelligence engine**. It takes a YouTube video, podcast, or transcript and:
1. Detects the psychologically strongest moments in the content
2. Evaluates overall clipability and content quality
3. Generates platform-native posts, scripts, and hooks grounded in those moments
4. Lets creators steer the creative direction with Creator Energy Selection

The intelligence layer — moment detection, psychological scoring, energy steering — is the product. The generated output is downstream of it.

### What Virnix is not

- An AI chatbot or generic AI wrapper
- A "powered by Claude" content surface — AI is invisible infrastructure
- A social media scheduler
- An analytics dashboard
- An enterprise SaaS platform
- A virality predictor
- A video editing tool

### What Virnix can honestly claim

✅ "Find out which parts of your content have psychologically strong moments"  
✅ "Detect psychological content density before you generate"  
✅ "Get platform-native content grounded in the strongest moments"  
✅ "Steer the creative direction — Tactical, Contrarian, Reflective, and more"  

❌ "Predict virality" — explicitly avoid  
❌ "Guarantee engagement" — never say this  
❌ "AI-generated" or "Powered by Claude" — don't lead with this  

---

## 2. Core Differentiation

### What makes Virnix defensible

**1. Psychological moment detection**  
Not generic summarization. Virnix detects *why* a moment clips — validation hooks, emotional confessions, mechanism reframes, contrarian insights — and scores them by psychological weight. A Bartlett confession arc scores 90. A GaryVee motivational rant scores 25. Virnix knows the difference.

**2. Creator Energy Selection**  
User-directed creative steering. Creators choose the angle before generation: Tactical (steps/takeaways), Contrarian (challenge assumptions), Analytical (explain mechanisms), Reflective (identity shifts), Relatable (human tension), Harsh Truth (direct, grounded). No generic AI tool offers this level of directional control while staying transcript-grounded.

**3. Honest intelligence**  
Virnix tells creators when their content has low clip potential. Generic AI always says content is great. Honest clipability assessment builds creator trust.

**4. Transcript-first (no video rendering)**  
Input is text. Output is text. No media pipeline, no render farm, no video storage. Cost structure stays lean. A 90-min podcast costs Virnix ~€0.05 to process (AI only, current implementation).

**5. Domain-agnostic prompts**  
Works across creator/business, science, philosophy, health, history, interviews. Not locked to creator growth content.

**6. Platform-native output**  
TikTok hooks, Twitter threads, LinkedIn posts, Instagram captions, YouTube titles — each built around the psychology of that platform, not just reformatted text.

**7. Speed**  
Under 60 seconds from URL to output. The experience itself is the value demonstration.

---

## 3. Creator Energy Selection

Creator Energy is a directional steering layer — added in CE-A (Phase 28), static-audited in CE-QA-A, real-AI validated in CE-B, Contrarian polished in CE-C. Production-ready as of 2026-05-20.

### Direction pills

| Energy | Tagline | Directive |
|--------|---------|-----------|
| **Balanced** | (default / no selection) | Virnix chooses the strongest grounded direction automatically |
| **Tactical** | Steps · Tips · Takeaways | Clear steps, concrete takeaways, immediately actionable for every platform |
| **Contrarian** | Challenge · Reframe · Flip | Lead with the misunderstanding most people have; frame around the gap the transcript reveals |
| **Analytical** | Mechanism · Pattern · Why | Explain the mechanism underneath the insight; name the cause-effect or system |
| **Reflective** | Meaning · Identity · Worldview | Draw out identity-level shifts; invite viewers to see themselves or their situation differently |
| **Relatable** | Story · Emotion · Human | Lead with human tension and emotional truth before the lesson |
| **Harsh Truth** | Direct · Uncomfortable · Grounded | Name the uncomfortable truth plainly; no hedging; grounded in the transcript |

### How it works

- **No selection = automatic mode.** "No selection means Virnix chooses the strongest grounded direction automatically." Prompt is byte-for-byte identical to pre-CE-A.
- **One or more energies** can be selected. Directives layer.
- **Grounding rule is always active.** Energy is creative steering. Virnix never invents facts, emotions, or controversy to satisfy a direction.
- **All platforms respond to energy steering** — not TikTok only. LinkedIn, Twitter, Instagram, YouTube all receive the directive.

### Pricing decision

Creator Energy is **included in Pro, locked on Free.**  
Token cost: ~100–150 prompt tokens, ~€0.003 per call — not a cost driver.  
Lock on Free creates upgrade motivation without punishing the experience.

### Validation

- CE-QA-A: static audit, ALL CHECKS PASS ✅
- CE-B: 9 real API calls, clear energy differentiation across all platforms, no hallucinations ✅
- CE-C: Contrarian polished — no framework language, assumption-challenging framing confirmed ✅

---

## 4. Pricing & Credits Model

Full strategy: `docs/PRICING_CREDITS_PLAN.md`

### Plans

**Free** (no credit card required)
- 3 total trial credits (one-time, not monthly)
- Max 10 min content
- Basic outputs: TikTok, Twitter, LinkedIn, Instagram, YouTube titles
- Creator Energy: locked
- Purpose: product trial. One good generation demonstrates value.

**Pro — €20/month**
- 100 credits/month (reset on billing date, unused expire)
- Max 60 min content
- Basic + Advanced Content Kit (+1 credit)
- Creator Energy: included, no extra cost
- Purpose: core creator workflow — weekly podcast → week of short-form content

**Studio — €49/month (future, not at launch)**
- 350 credits/month (reset monthly, unused expire)
- Everything in Pro
- Max 90 min content (future — requires audio upload)
- Advanced Content Kit included
- Creator Energy included
- Export content packs
- Saved generation history
- Candidate for 2–3 team seats
- Priority processing candidate
- **Build when:** Pro validates at €1k MRR + audio upload is live

**Agency — €99/month (future, not at launch)**
- 900 credits/month (reset monthly, unused expire)
- Everything in Studio
- Client/project organization
- Multiple team seats
- Client-ready export formats
- Priority support
- **Build when:** Studio validates with paying users + evidence of agency usage patterns

**Pay-as-you-go — candidate, not designed**
- €0.30/credit à la carte, no subscription
- Serves occasional users who won't commit monthly
- Lower margin per credit but reduces churn risk
- Consider as fallback offer only if subscription conversion is weak

### Credit formula

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

Advanced Content Kit (blog, timestamps, short-form script): +1 credit  
Creator Energy: +0 credits

### Example calculations

- 8-min YouTube clip, basic → 1 credit
- 8-min YouTube clip, advanced kit → 2 credits  
- 25-min podcast, basic → 2 credits  
- 45-min podcast, advanced kit → 5 credits  
- 90-min podcast, basic → 8 credits  

---

## 5. Margin Logic

### Why unlimited is dangerous

A 5-min YouTube clip costs Virnix ~€0.035 to process (AI only).  
A 90-min podcast with future audio upload costs ~€0.59 (AI + transcription).  
At unlimited pricing, one power user running 10 × 90-min podcasts/month captures €6+ of cost on a €20 plan.

**Credits charge power users appropriately without blocking them.**

### Target gross margin: 60–80%

All figures are estimates (⚠ must be validated with production logs):

| Scenario | Credits used | Est. AI cost | Gross margin |
|----------|-------------|--------------|--------------|
| Short video creator (~16 clips/mo) | ~20/100 | €0.70 | ~92% |
| Mixed creator (2 podcasts + 5 clips) | ~23/100 | €0.36 | ~94% |
| Long podcast power user (current, YT captions) | ~64/100 | €0.40 | ~98% |
| Long podcast power user (w/ future transcription) | ~64/100 | €4.72 | ~72% |
| Advanced-mode heavy (all advanced kit) | ~60/100 | €1.12 | ~90% |

No scenario in the table breaches the 60% floor at current costs.

### Key margin assumption

Current AI cost (~€0.035/basic call) is derived from CE-B real AI test data (~2000 input + ~1200 output tokens at Sonnet 4.6 pricing). **Validate against 50+ production generations before treating these as fixed.** Future audio transcription (~€0.006/min Whisper-equivalent) is a future cost driver — not live yet.

### Danger zone

Any user whose combined AI + transcription cost exceeds €12/month on a €20 plan (60% floor). Duration limits and credit caps prevent this in all modeled scenarios.

---

## 6. Implementation Roadmap

> Full versioned roadmap: [docs/roadmap/FEATURE_ROADMAP.md](roadmap/FEATURE_ROADMAP.md)  
> Release plan and changelog: [docs/roadmap/RELEASE_PLAN.md](roadmap/RELEASE_PLAN.md)  
> Versioning rules: [docs/roadmap/VERSIONING.md](roadmap/VERSIONING.md)

### Prerequisite sequence (do not skip steps)

```
Current state: no auth, no credits, no billing
     ↓
AUTH-A — Supabase authentication
  Creates user identity (user_id) required for credit tracking
     ↓
CREDITS-A — Server-side credit system
  Credit check before AI call (reject 402 if insufficient)
  Credit deduction (atomic with generation start)
  Credit allocation on plan activation
  app/lib/credits/ module
     ↓
BILLING-A — Stripe subscription
  Pro plan subscription flow
  Webhook: subscription.created → allocate 100 credits
  Webhook: invoice.paid → reset monthly credits
  app/lib/billing/ module
     ↓
Pricing page + upgrade flow UI
Credits display in UI (X credits remaining, cost estimate before generation)
```

**Auth is prerequisite for credits because credits need user_id.**  
**Credits are prerequisite for billing because billing allocates credits.**  
Do not build out of order.

### Key implementation rules

- **Credit calculation is always server-side.** Never trust a client-supplied credit cost.
- **Check credits before the AI call.** Reject with HTTP 402 if insufficient — never start a call you can't complete.
- **Deduct atomically.** Credit deduction and generation start in the same DB transaction. Restore credits if AI call fails.
- **Log safe metadata only.** Token counts, elapsed ms, credit cost — never API keys or transcript content.
- **Centralize pricing rules** in `app/lib/credits/rules.ts`. Never hardcode credit costs in UI components or API handlers.

---

## 7. Anti-Goals

What Virnix must never become:

| Anti-goal | Why |
|-----------|-----|
| Unlimited plan at €20 | Power user inversion kills margin |
| Bloated dashboard | Kills the simplicity moat |
| Enterprise admin panel | Not our market |
| Video rendering / render farm | Kills cost structure |
| Generic AI wrapper copy | Destroys brand positioning |
| Hardcoded creator-only assumptions | Domain-agnostic is a feature |
| Virality promises | Psychological density ≠ viral guarantee |
| "Powered by Claude" prominent branding | AI is infrastructure, not the product |
| Social scheduling | Virnix generates, doesn't manage |
| AI image generation | Not our workflow |
| Team collaboration (before Pro validates) | Premature complexity |

---

## 8. Validation Status

### Product quality phases complete

| Phase | What it validated | Result |
|-------|-------------------|--------|
| QB-A (27) | TikTok domain-lock P0 fix, closing pool, YouTube formula contradiction | ✅ Done |
| CE-A (28) | Creator Energy Selection implemented and wired end-to-end | ✅ Done |
| CE-QA-A (29) | Static audit — 0 failures, 0 warnings | ✅ Done |
| CE-B (30) | Real AI test — 9/9 calls, clear differentiation, no hallucinations, no corporate voice | ✅ Done |
| CE-C (32) | Contrarian directive polished — no framework language, assumption-challenging confirmed | ✅ Done |
| PRICING-A (31) | Pricing / credits strategy documented and modeled | ✅ Done |

### Next gates before launch

| Gate | Phase | Status |
|------|-------|--------|
| Supabase authentication | AUTH-A | ⏳ Not started |
| Credits system | CREDITS-A | ⏳ Blocked on AUTH-A |
| Stripe billing | BILLING-A | ⏳ Blocked on CREDITS-A |
| Real-cost production validation | (50+ live generations) | ⏳ Blocked on auth |

---

## 9. Feedback-Driven Roadmap

### Why feedback matters more than planning

Internal assumptions about what creators want are often wrong. A creator who posts twice a week uses Virnix differently from a podcaster who posts monthly. The only reliable way to know what to build next is to ask early users after they've generated real content.

### The feedback system

A lightweight post-generation survey — 5 questions, under 60 seconds, non-blocking. Designed to capture:

- Which outputs are actually useful vs. ignored
- Which Creator Energy directions land vs. disappoint
- Which creator archetypes feel underserved
- What features have the most pull
- What is broken or wrong

Full design: [docs/feedback/FEEDBACK_SURVEY_PLAN.md](feedback/FEEDBACK_SURVEY_PLAN.md)

### How feedback becomes decisions

1. Collect responses (post-generation widget, v0.3.x)
2. Tag by category: output quality · platform quality · missing feature · creator archetype · energy direction · bug
3. Weekly review during private beta
4. Pattern threshold: ≥3 identical complaints = signal; ≥5 = priority candidate
5. Convert to roadmap action: P0 fix / P1 fix / PATCH / new Candidate

Full process: [docs/feedback/IMPROVEMENT_LOOP.md](feedback/IMPROVEMENT_LOOP.md)

### What feedback can change

| Feedback signal | Potential action |
|----------------|-----------------|
| "Too generic" | Prompt or energy directive refinement |
| "Wrong platform format" | Platform-specific prompt improvement |
| Creator archetype underserved | Targeted real-AI test + prompt tuning |
| Energy direction disappoints | Directed polish phase (like CE-C) |
| Feature requested ≥5 times | Promote from Future → Candidate |
| "Pricing feels expensive" | Review credit tier thresholds, not necessarily price |

### What feedback will not change

- Anti-goals (no analytics dashboard, no social scheduling, no video editing)
- Core product philosophy (transcript-first, no video rendering)
- Pricing model structure (credits, not unlimited)

---

## 10. Future: Public Roadmap / Changelog Page

Not built yet. Do not add this to the app now.

When the product is post-launch (v0.3.0+), a minimal public-facing roadmap page could help with:
- Showing momentum to potential users
- Building trust through transparency ("here's what just shipped")
- Reducing support questions about upcoming features

**What it should show (if built):**
- Current version
- Recently shipped (last 2–3 milestones)
- Now (what's in active development)
- Next (what's clearly coming)
- Later (candidates, not promises)
- Minimal changelog

**What it should NOT show:**
- Dates or ETAs
- Speculative features
- Competitor comparisons
- Internal implementation phases or technical details

**Implementation note:** A single static page (`/roadmap`) or external Notion/Changelog page is fine. Do not build a dynamic roadmap system — maintain it as a simple markdown-to-UI page or a hosted changelog tool (e.g., Changelog.so, Headway, or custom static page). Prioritize the generator flow — the roadmap page is secondary.

---

## 11. VIRNIX.docx Note

`VIRNIX.docx` exists in the project root but is a binary format. This markdown file (`docs/BUSINESS_PLAN_CURRENT.md`) is the authoritative source for the current business plan.

To merge into VIRNIX.docx: open both files side-by-side and update or replace the relevant sections manually. Sections 1–9 above map cleanly to the VIRNIX.docx structure.

Sections most likely to need updating in VIRNIX.docx:
- Pricing / monetization model (PRICING-A credits model, Studio/Agency as future tiers)
- Creator Energy Selection (new section, not in original VIRNIX.docx)
- Product positioning (updated one-liner, "creator intelligence engine" framing)
- Feature roadmap (versioned roadmap added, AUTH-A next gate)
- Margin / unit economics (modeled scenarios, €20 Pro at 60–80% target)
