# Virnix Beta — Risk Register

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Review cadence:** Weekly during active beta

Probability: H = High / M = Medium / L = Low
Impact: H = High / M = Medium / L = Low

---

## Risk Table

| # | Risk | Prob | Impact | Early Warning Sign | Mitigation | Owner | Decision Trigger |
|---|------|------|--------|-------------------|------------|-------|-----------------|
| 1 | API cost abuse — user creates script or loop to drain credits | L | H | Anthropic dashboard shows spike; one user_id has 50+ calls | 3-credit cap stops per-account abuse; rate limiting per IP before public launch | Miha + Engineering | If single IP >10 requests/hour, activate mock mode and investigate |
| 2 | Credits SQL not applied — unlimited free generation | M | H | New users generate without balance decreasing in Supabase | Verify `user_credits` table exists before any user invite | Miha (manual) | If table missing, do not send a single invite until fixed |
| 3 | Same user creates multiple accounts for free credits | M | L | Multiple sign-ups from same IP within minutes; suspiciously similar emails | Not worth blocking in beta — costs €0.15 per 3-account set; it signals desire to use product | None needed now | Only enforce if >20 duplicate accounts detected in first week |
| 4 | Very long video/transcript slipping through duration check | M | M | Single generation costs $0.30+ in Anthropic dashboard | `selectBestSegment()` already caps tokens; verify duration detection returns correct value; test a 3-hour YouTube URL before launch | Engineering | If any single call costs >$0.15, investigate transcript length |
| 5 | Low output quality on first impression | M | H | Users do not copy, share, or return; first feedback is "meh" | Use real AI in production (not mock mode) for beta; ensure Best Angle visible on output; test 3 real generations before inviting users | Miha (smoke test) | If 3 consecutive beta users report unusable output, pause and investigate |
| 6 | Bad first impression — product feels confusing | M | H | Users sign up, do not generate anything; time-to-first-generation >5 minutes | Add clear placeholder text in URL input; add a hint: "Paste any YouTube URL" + an example; keep the UI minimal | Engineering | If first 5 beta users don't generate, fix the UX before more invites |
| 7 | YouTube transcript extraction fails consistently | M | M | Multiple transcript errors in Vercel logs; users report blank or demo output | Detect transcript failure explicitly and show clear error (not silent fallback); suggest a different video | Engineering | If >20% of submissions fail transcript fetch, add visible error and investigate |
| 8 | Product misunderstood as video editor | H | M | Users ask "where's the clip?" or "where's the video output?" | Landing page copy says "Text posts and hooks, not video clips" explicitly; first invite message explains this; Miha addresses it in follow-up DMs | Miha (copy/messaging) | If >30% of users ask about video editing, rewrite landing copy immediately |
| 9 | Users expect auto-edited short clips (OpusClip comparison) | H | M | Users compare to OpusClip in messages; disappointed when no video | Add explicit "Virnix is not a video editor" line to landing page and invite copy; see MARKETING_TEST_PLAN.md for handling this objection | Miha (copy) | If mentioned by 5+ users, add a comparison one-liner to the product description |
| 10 | No one converts — zero "I would pay" responses | M | H | 14 days, 20 users, 0 expressions of willingness to pay | Ask directly: "Would you pay €20/month for this?" — do not wait for users to volunteer it; if answer is universally no, dig into why | Miha (direct outreach) | If 0 of 20 users express willingness to pay after direct ask, pause beta and investigate |
| 11 | Too few users — can't get 20 invites accepted | M | M | <5 people respond to first outreach; low open rate on DMs | Prepare 3 acquisition channels (personal network, Slovenian creator community, LinkedIn); start with warmest contacts | Miha | If <5 users in first 5 days, try a second channel; if still nothing, reassess targeting |
| 12 | Too many users — viral spread beyond budget | L | M | Supabase signups spike; Anthropic bill climbs; Vercel traffic alarm | Switch to mock mode immediately; respond to users: "Beta is temporarily paused, you're on the list"; re-enable carefully | Miha (immediate) | If signups exceed 300 in a single day, activate mock mode |
| 13 | Legal/privacy concern — users ask about data retention | M | M | Users DM asking "do you store my transcripts?" or "what happens to my data?" | Add a simple privacy notice (one paragraph on the landing page); store no transcript text, only credit balances and auth data; be able to answer this question clearly | Miha + Engineering | If 3+ users ask, add privacy notice to landing page same day |
| 14 | Missing terms of service / privacy policy | H | M | Users ask; or App Store / legal review requires it | Write a minimal 1-page privacy notice and terms before public beta; they do not need to be legal documents — they need to exist and be honest | Miha | Must have before any public URL is shared |
| 15 | Data retention confusion — users think generations are saved | M | M | Users ask "where are my old generations?" or come back expecting history | Add a line near the output: "This generation is not saved. Copy your outputs before leaving." | Engineering | If 3 users ask about history, add the copy-first reminder UI immediately |
| 16 | Slow generation (>30 seconds) | M | M | Users refresh the page or close it during loading; Vercel logs show long elapsed times | Show a loading indicator with "Generating 5 platform outputs..." and estimated time ("usually 10–15 seconds"); do not show a spinner with no context | Engineering | If p90 generation time >25s, investigate (timeout? long transcript? API latency?) |
| 17 | Mobile UX problems | M | M | Users on mobile report broken layout; copy buttons don't work; URL input hard to use | Test on iPhone Safari and Android Chrome before first invite; the product is built mobile-first with Tailwind but real device testing is required | Miha (manual test) | If >2 mobile-specific bugs reported, fix before expanding beyond 20 users |
| 18 | Weak positioning — "just another AI writing tool" | H | M | Users compare to ChatGPT, Jasper, Copy.ai; don't see differentiation | Emphasize: "Paste your existing content → get posts for 5 platforms instantly" + Creator Energy + Best Angle as unique; the hook isn't "AI writing" it's "your content, repurposed, for the right platform, in 15 seconds" | Miha (copy/DMs) | If comparison to generic AI tools comes up in 5+ conversations, rewrite the positioning |
| 19 | Founder over-polishing UI instead of launching | H | H | Week 2 passes, still no users invited; changelog full of minor tweaks | Use this doc as a blocker check — if it doesn't block a user from generating, it is not a beta blocker; commit to a launch date and keep it | Miha (self-check) | If launch date passes without user invite, Miha must ask why |
| 20 | Engineering overbuilding during beta | M | M | New features added during beta window; architecture becomes messy; costs go up | Engineering only fixes P0 bugs during beta; no new features unless a specific gap is blocking real usage; see FOUNDER_OPERATING_SYSTEM.md | Miha + Engineering | If a feature request comes in, log it in roadmap docs — do not build it during beta |

---

## Top 5 Risks Ranked by Composite Score

1. **Credits SQL not applied** (Prob: M, Impact: H) — Most dangerous because it is easy to miss and silently allows free unlimited generation. Must be verified before any invite.

2. **No one converts** (Prob: M, Impact: H) — Existential signal risk. If nobody wants to pay, the product needs to change before investing in billing.

3. **Product misunderstood as video editor** (Prob: H, Impact: M) — Most likely to happen. Virnix is text-first in a category that is usually video-first. Requires clear messaging, not a product change.

4. **Bad first impression / low output quality** (Prob: M, Impact: H) — One bad first generation can lose a user forever. Smoke test thoroughly before inviting.

5. **Missing terms/privacy notice** (Prob: H, Impact: M) — Legal cover. One paragraph is enough. Must exist before public sharing.

---

## Risks NOT on This Register (Intentionally Deferred)

- Stripe billing failure (not built yet)
- Multi-user team abuse (not in beta scope)
- Audio/video upload security (not built yet)
- GDPR full compliance audit (needed before paid public launch, not beta)
- SEO attacks or content scraping (low relevance at 20-user scale)
