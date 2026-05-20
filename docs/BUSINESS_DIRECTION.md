# Business Direction — Virnix

> AI-readable strategic operating document. Distilled from the Virnix startup handbook
> and validated against Phases 1–32 product decisions.
> Last updated: BUSINESS-DOCS-A (2026-05-20)

---

## Core Positioning

**One-liner:** "Turn long-form content into platform-native posts, hooks, and clip ideas with creator-directed AI."

**Secondary one-liner (simpler):** "Turn 1 podcast into 30 viral posts in 60 seconds."

**Strategic positioning:** Virnix is not a content generator. It is a **creator intelligence engine** — a psychological signal extractor that happens to generate content as a downstream output. The moat is the intelligence layer — creator psychology, moment detection, platform-native formatting, and Creator Energy steering — not the generation itself.

Virnix is also not "powered by Claude" or "AI-powered content." The AI is invisible infrastructure. The product is the intelligence, the framing, and the output quality.

**Category:** Creator Intelligence Platform  
**Segment:** Premium creator tooling (not enterprise, not prosumer dashboard)

---

## Target Users

**Primary:** Content creators who already understand repurposing but are bottlenecked by:
- Time cost of manual clipping
- Not knowing *which* moments are worth clipping
- Platform translation friction (podcast → TikTok hook requires real skill)

**Creator archetypes that Virnix serves best:**
1. **Podcast creators** — long-form → short clips across all platforms
2. **Thought leaders** — deep interview content → thread-worthy insights
3. **Educators** — structured teaching → educational gem clips
4. **Story-driven creators** (Bartlett-type) — confession + arc → high emotional density

**Creator archetypes Virnix serves less well:**
- Non-English creators (signal detection is English-only)
- Pure entertainment creators (low educational/confession density)
- Short-form native creators (already creating the final format)

---

## Creator Psychology

**Why creators don't repurpose consistently:**
1. They don't know which moments are actually good (subjective uncertainty)
2. Repurposing takes 2–4 hours per piece of content
3. Platform translation requires different voice, format, hook — not just copy-paste
4. Fear of posting lower-quality derivative content

**What Virnix addresses:**
1. Removes subjective uncertainty → shows exactly which moments have psychological weight
2. Eliminates the 2–4 hour manual process → under 60 seconds
3. Platform translation is native → each output is built for the target platform's psychology
4. Quality confidence → grounded in signal detection, not generic AI output

---

## Monetization Direction

**Current state:** Free, unlimited, no auth — pure product validation. No billing, no credits, no auth yet wired.

**Decided model (PRICING-A, 2026-05-20):** Duration-based credits. Full strategy in `docs/PRICING_CREDITS_PLAN.md`.

### Plans

**Free (trial, not monthly)**
- 3 total credits (one-time pool, not monthly reset)
- Max 10 min content
- Basic outputs only (5 platforms)
- Creator Energy locked — upgrade motivation

**Pro — €20/month**
- 100 credits/month (reset on billing date, unused expire)
- Max 60 min content
- All platforms + Advanced Content Kit (+1 credit)
- Creator Energy included, no extra cost

**Creator tier — future, not yet priced**
- Higher credit pool, audio upload support, saved history
- Do not build until Pro validates at €1k MRR

### Credit formula

```
credits_used = duration_base_credits + mode_extra_credits
```

Duration tiers: 0–10 min = 1cr · 10–30 min = 2cr · 30–60 min = 4cr · 60–120 min = 8cr · 120+ = blocked

### Unit economics target
- €1k MRR = ~50 Pro users × €20
- AI cost: ~€0.035/basic call, ~€0.070/advanced call
- Gross margin: 60–80% target across all usage scenarios
- Best case (short-form creator): ~92% margin
- Worst case (long podcast + future transcription): ~72% margin

**No unlimited plan at €20.** One power user with 10 × 90-min podcasts costs ~€8+/month in future transcription. Credits protect margin.

### Cost control rules
- Credit check before any AI call — never start a call you can't complete
- Max video: 60 min Pro, 10 min Free — block 120+ explicitly
- Rate limit: 20 generations/hour per user (silent, user-invisible)
- All credit calculation server-side — never trust client-supplied cost
- Delete audio immediately (future audio upload) — store transcript text only

---

## Competitive Moat

What creates defensible advantage:

1. **Psychological moment detection** — not generic AI summarization. Virnix knows *why* a moment clips, not just *that* it exists.

2. **Creator-native output calibration** — prompts built around creator psychology, platform-native hooks, retention patterns. Not generic "write a LinkedIn post about this."

3. **Creator Energy Selection** — user-directed creative steering: Tactical, Contrarian, Analytical, Reflective, Relatable, Harsh Truth. No other repurposing tool offers this level of directional control while staying transcript-grounded. See section below.

4. **Honest intelligence** — Virnix tells creators when their content has low clip potential. Generic AI tools always say everything is great. This honesty builds trust.

5. **Transcript-first (no video rendering)** — input is text, output is text. No expensive media pipeline, no render farm, no storage cost. Cost structure stays lean.

6. **Domain-agnostic prompts** — works across creator/business, science, philosophy, health, history. Not hardcoded for creator growth content.

7. **Speed feedback loop** — under 60 seconds from URL to output. The experience itself is the value demonstration.

8. **Credits model** — pricing protects margin from power user cost risk without blocking value. Transparent to users, invisible in UX.

---

## Anti-Goals

What Virnix must **never** become:

- **An analytics dashboard** — clip moments are discoveries, not metrics
- **A social media scheduler** — Virnix generates, doesn't manage
- **A video editor** — transcript-based only, no media manipulation
- **An enterprise platform** — no complex team workflows, no admin panels
- **A generic AI wrapper** — the intelligence layer is the product, not the LLM access
- **A virality predictor** — psychological density ≠ viral guarantee
- **A brand safety tool** — not our market
- **A subscription bundle** — no feature bloat, one core workflow

---

## Creator Energy Selection

Creator Energy is a direction layer — it lets creators steer the creative framing before generation. Shipped in CE-A (Phase 28), validated in CE-QA-A (Phase 29), real AI tested in CE-B (Phase 30), Contrarian polished in CE-C (Phase 32).

### Energy modes

| Energy | Tagline | What it does |
|--------|---------|--------------|
| Balanced | (default) | Virnix chooses the strongest grounded direction automatically |
| Tactical | Steps · Tips · Takeaways | Prioritizes clear steps, concrete takeaways, immediately actionable |
| Contrarian | Challenge · Reframe · Flip | Challenges the assumption the transcript reverses; leads with the misunderstanding |
| Analytical | Mechanism · Pattern · Why | Explains the mechanism underneath the insight; names cause-effect |
| Reflective | Meaning · Identity · Worldview | Draws out identity-level shifts; invites viewers to see themselves differently |
| Relatable | Story · Emotion · Human | Leads with human tension and emotional truth before the lesson |
| Harsh Truth | Direct · Uncomfortable · Grounded | Names the uncomfortable truth plainly; no softening, no hedging |

### Key rules

- **No selection = automatic mode.** Virnix picks the strongest grounded direction. No option is always available.
- **One or more energies** can be selected simultaneously. Directives combine.
- **Grounding rule is always active.** Energy is creative steering, not permission to invent facts or emotions not in the transcript.
- **All platforms receive energy steering** — not TikTok-only. LinkedIn, Twitter, Instagram, YouTube all respond.
- **Balanced is a guaranteed no-op.** When empty selection, the prompt is byte-for-byte identical to pre-CE-A output. No performance cost.

### Pricing

Creator Energy is **included in Pro at no extra credit cost.** It adds ~100–150 prompt tokens (~€0.003 cost impact) — not a cost driver. Locked on Free tier to create upgrade motivation.

### Validation status

- CE-QA-A (Phase 29): static audit — ✅ ALL CHECKS PASS
- CE-B (Phase 30): 9 real AI calls — ✅ clear energy differentiation, grounding held, no hallucinations
- CE-C (Phase 32): Contrarian directive polished — ✅ assumption-challenging framing, no framework language

---

## Product Philosophy

**Extreme simplicity:** One input (YouTube URL). One action (generate). Clear output. No onboarding friction.

**Creator-first UX:** Every word in the interface is written for someone who thinks in clips, hooks, and engagement — not someone who manages content workflows.

**Honest intelligence:** If content has low clipability, say so clearly. False positivity destroys creator trust. Honest assessment of content quality is a differentiator.

**Speed as a product value:** The 60-second experience is the demo. The faster it is, the more valuable it feels. Never add loading for perceived quality.

**Minimal surface area:** Do not add features because they are possible. Add features because creators lose meaningful time to that specific problem.

---

## UX Direction

**The experience should feel:**
- Premium and intentional (not startup-scrappy)
- Calm and powerful (not excitable and reactive)
- Editorially intelligent (not dashboardy)
- Cinematic (not utilitarian)

**Visual language:**
- Black chrome · liquid metallic · restrained glow (dark mode primary)
- Pearl white · soft chrome · premium paper (light mode)
- Typography dominates — no image-first layouts
- Breathing room — generous spacing, no cramped grids

**Language:** Creator-native, direct, no corporate SaaS filler. Write like a smart creator, not like enterprise software.

---

## Feature Priorities

**Shipped (production-ready):**
- ✅ YouTube URL → transcript → content generation
- ✅ Timeline moment detection
- ✅ Transcript quality / clipability intelligence
- ✅ Platform-native content (TikTok, Twitter, LinkedIn, Instagram, YouTube)
- ✅ Dark/light premium theme (black chrome / pearl white)
- ✅ TikTok opener rotation (26 domain-agnostic openers, QB-A)
- ✅ TikTok closing rotation (8 domain-agnostic closings, QB-A)
- ✅ Creator Energy Selection (CE-A through CE-C)

**Next required — must ship before monetization:**
1. **Auth — Supabase (AUTH-A):** user identity required for credit tracking
2. **Credits system (CREDITS-A):** server-side credit check/deduct/allocate
3. **Billing — Stripe (BILLING-A):** subscription + credit allocation on payment

**Next valuable — after Pro validates:**
- Non-YouTube source support (direct audio upload, podcast RSS)
- Saved generation history
- Brand voice calibration

**Future (validate demand first):**
- Creator template library
- Team collaboration

**Never build without strong creator demand:**
- Analytics dashboards
- Social scheduling
- AI image generation
- Video editing

---

## Launch Strategy

**Phase 1 (current):** Product quality first. No paid acquisition until output quality is demonstrably better than generic AI tools.

**Phase 2:** Organic creator channels — Twitter/X threads showing Virnix output vs. generic AI output. The quality delta is the ad.

**Phase 3:** Creator beta → word of mouth. Target 10 creators with 10k+ audiences to create case studies.

**Validation criteria before paid growth:**
- ≥ 20 organic users returning for a second generation
- ≥ 1 creator posting content from Virnix output publicly
- Clear feedback that output quality exceeds generic AI

---

## Long-Term Vision

Virnix becomes the **intelligence layer** that sits between every creator's long-form content and the short-form internet.

The end state is not "AI that writes captions." It is:
**"A system that understands which parts of a creator's content have psychological weight, and builds the exact content each platform needs to surface that weight."**

This is the difference between automation and intelligence.

---

## Validation Status (as of Phase 32)

All product quality phases complete. Pricing strategy documented. Auth is the next gate.

| Phase | What it validated | Status |
|-------|-------------------|--------|
| QB-A (27) | TikTok domain-lock fix, closing pool, YouTube formula contradiction | ✅ Done |
| CE-A (28) | Creator Energy Selection implemented | ✅ Done |
| CE-QA-A (29) | Static audit of energy system — 0 failures | ✅ Done |
| CE-B (30) | Real AI test — 9 calls, clear differentiation, no hallucinations | ✅ Done |
| CE-C (32) | Contrarian directive polished — assumption-challenging framing confirmed | ✅ Done |
| PRICING-A (31) | Pricing / credits strategy documented | ✅ Done |
| AUTH-A | Supabase authentication | ⏳ Not started |
| CREDITS-A | Server-side credit calculation / check / deduction | ⏳ Blocked on AUTH-A |
| BILLING-A | Stripe subscription + credit allocation | ⏳ Blocked on CREDITS-A |

---

## Business Constraints

- **Bootstrap-first:** No external funding assumed. Profitability at €1k MRR with current cost structure.
- **Solo/small team:** Architecture must remain simple enough for 1–2 engineers to understand completely.
- **Vercel + Supabase + Anthropic:** No proprietary infrastructure. Switch costs must stay low.
- **Token economics matter:** Every API call costs money. No prompts that generate unnecessary output. No re-fetching transcripts. Chunking and caching are required.
- **Auth-first for credits:** Credits system requires user identity. Never build CREDITS-A before AUTH-A is complete.
- **Real-cost validation before price lock:** Current margin estimates are based on ~€0.035/call. Validate against 50+ real productions generations before treating these as fixed numbers.
