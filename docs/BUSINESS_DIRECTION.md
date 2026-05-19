# Business Direction — Virnix

> AI-readable strategic operating document. Distilled from the Virnix startup handbook
> and validated against Phase 1–16 product decisions.

---

## Core Positioning

**One-liner:** "Turn 1 podcast into 30 viral posts in 60 seconds."

**Strategic positioning:** Virnix is not a content generator. It is a **psychological signal extractor** that happens to generate content as a downstream output. The moat is the intelligence layer — creator psychology, moment detection, platform-native formatting — not the generation itself.

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

**Phase 1 (current):** Free, unlimited, no auth — pure product validation

**Phase 2:** Credit-based freemium
- Free tier: 3 generations/month
- Pro tier: ~€19/month, 50+ generations
- Creator tier: ~€49/month, unlimited + advanced features

**Unit economics target:**
- €1k MRR = ~50 Pro users × €19
- AI API cost: ~€50–150/month at 50 users
- Net margin: ~70%+

**Cost control rules (from VIRNIX.docx):**
- Delete audio immediately after transcription — never store raw media
- Store transcript text only
- Rate limit from day 1
- Max video length: 30 min free, 60 min pro
- Credits system prevents abuse

---

## Competitive Moat

What creates defensible advantage:

1. **Psychological moment detection** — not generic AI summarization. Virnix knows *why* a moment clips, not just *that* it exists.

2. **Creator-native output calibration** — prompts built around creator psychology, platform-native hooks, retention patterns. Not generic "write a LinkedIn post about this."

3. **Honest intelligence** — Virnix tells creators when their content has low clip potential. Generic AI tools always say everything is great. This honesty builds trust.

4. **Speed feedback loop** — under 60 seconds from URL to output. The experience itself is the value demonstration.

5. **No editing required positioning** — direct deployment content, not first-draft content.

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

**Must have (shipped or in progress):**
- ✅ YouTube URL → transcript → content generation
- ✅ Timeline moment detection
- ✅ Transcript quality / clipability intelligence
- ✅ Platform-native content (TikTok, Twitter, LinkedIn, Instagram, YouTube)
- ✅ Dark/light theme

**Next tier (high value, not yet built):**
- Auth + user accounts (Supabase)
- Credits system (free/pro gating)
- Expanded TikTok opener pool (fix 42% repetition rate)
- Non-YouTube source support (direct audio upload, podcast RSS)

**Future (validated before building):**
- Saved generations history
- Brand voice calibration
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

## Business Constraints

- **Bootstrap-first:** No external funding assumed. Profitability at €1k MRR with current cost structure.
- **Solo/small team:** Architecture must remain simple enough for 1–2 engineers to understand completely.
- **Vercel + Supabase + Anthropic:** No proprietary infrastructure. Switch costs must stay low.
- **Token economics matter:** Every API call costs money. No prompts that generate unnecessary output. No re-fetching transcripts. Chunking and caching are required.
