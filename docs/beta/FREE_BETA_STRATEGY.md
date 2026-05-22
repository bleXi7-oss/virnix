# Virnix — Controlled Free Beta Strategy

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Status:** Planning / documentation only
**Budget cap:** €100 extra test spend

---

## Executive Summary

Virnix has a working product: auth, credits, AI generation, Creator Energy, Best Angle, language selection, Clip Guide, Transcript Quality — all implemented and tested. The next step is not more engineering. It is finding out whether real people understand it, use it, and want to pay for it.

This document defines a controlled free beta: invite a small group of real creators, give them 3 free credits, observe their behavior, and get honest reactions. No money changes hands. No big launch. No viral push yet. Just signal.

**Goal:** Turn a working prototype into a validated product with enough signal to make a confident decision about billing.

**Budget:** €100 extra over normal development costs. This covers Anthropic API usage, Supabase hosting, Vercel, and any micro-marketing experiments during the beta window.

---

## Why Free Beta Makes Sense Now

The product has passed every internal quality gate:

- Creator Energy validated with real AI (CE-B, CE-C)
- Language selection validated: 6 languages, zero Cyrillic regressions (LANG-REAL-A)
- Best Angle / Use This First live (QUALITY-C, commit daeb5fe)
- Auth works: Supabase magic link, tested
- Credits built: 3-credit trial, server-side, atomic deduction
- UI: premium black chrome / pearl white, mobile-responsive

What is NOT known:

- Do creators immediately understand what to do?
- Does the first generation create a "wow" moment or a shrug?
- Is Best Angle / Creator Energy visible enough to feel different from other tools?
- Which type of creator reacts best?
- What do people say the tool is after seeing it?
- Would anyone pay €20/month?

These questions cannot be answered by building more features. They require real users.

---

## What We Are Testing

| Question | How we measure it |
|----------|------------------|
| Does the product make sense in under 30 seconds? | User session recordings, time-to-first-generation |
| Does first generation create a "wow" moment? | Direct feedback after generation, qualitative messages |
| Which creator type gets the most value? | Ask users their role; compare reaction quality |
| Is Best Angle / Creator Energy actually used? | Observe whether users click energy pills vs. leaving on Balanced |
| Do users come back for a second generation? | Session return within 48 hours |
| What do people say the product is? | Ask "how would you describe this to a friend?" |
| Would anyone pay? | Ask directly: "Would you pay €20/month for this?" |
| What breaks? | Error logs, transcript failures, credit edge cases |

---

## What We Are NOT Testing

- Revenue. This beta has zero paid conversions as a goal.
- Scale. We are not testing 1,000 users.
- Video upload. Audio/MP4 is not built. Do not test, do not promise.
- Auto-edited clips. Virnix is text-first. If users expect video cutting, that is a positioning problem to fix in messaging, not the product.
- Fancy analytics dashboards. Manual review beats premature dashboards.
- Perfect UI. Good enough is good enough. Ship and learn.
- Agency or team workflows. One user, one creator, one generation.

---

## Definition of Success

After 14 days of beta, we have succeeded if:

- At least 10 of 20 users completed at least 1 generation
- At least 3 users said "I would pay for this" or asked about pricing
- At least 1 user came back without being prompted
- We have at least 5 pieces of direct feedback (messages, replies, DMs)
- We have identified which creator type reacts best
- We have at least 1 piece of feedback strong enough to influence the product roadmap
- Total API cost stayed under €20

---

## Definition of Failure

- Fewer than 5 users ever generate anything (positioning problem or friction problem)
- Every piece of feedback is "cool demo" with no desire to use it for real work
- Nobody asks about pricing
- Total API cost exceeds €50 without corresponding signal (abuse or infrastructure problem)
- The product consistently shows wrong output or broken auth for real users
- Zero returning users in 14 days

---

## 7-Day Beta Plan

### Day 1 — Technical readiness
- Confirm Supabase SQL is running (user_credits table, RPCs)
- Confirm real AI flag is on in production
- Confirm auth flow works on production (not localhost)
- Confirm credits deduct correctly after first generation
- Confirm Best Angle renders on real AI output
- Deploy and smoke test on virnix.pro
- Document any issues found

### Day 2 — Invite list preparation
- Identify 20 specific people to invite (see MARKETING_TEST_PLAN.md)
- Prepare personalized DM messages (5 templates in MARKETING_TEST_PLAN.md)
- Do not post publicly yet — controlled only

### Day 3 — First 5 invites sent
- Send 5 invites (DM or direct link)
- Watch sessions manually or via console logs
- Fix any immediate blockers same day
- Note first reactions

### Day 4 — Check-in and iterate
- Follow up with Day 3 invitees: "Did you try it? What happened?"
- Fix any friction points (UI confusion, broken link, wrong error messages)
- Send next 5 invites only if Day 3 showed no critical bugs

### Day 5 — Second wave
- Send remaining 10 invites
- Prepare a 2-question feedback ask: "What's the most useful output?" + "Would you pay for this?"

### Day 6 — Mid-beta review
- Review all session data (Vercel logs, Supabase credit activity, any error logs)
- Count: how many users generated something, how many came back, what broke
- Write a 1-paragraph status note in docs/beta/BETA_LOG.md (create manually)

### Day 7 — Decide and adjust
- Continue, pivot, or pause based on Day 6 findings
- Decide whether to expand to 50 users or stay at 20

---

## 14-Day Beta Plan

Days 8–14 depend on Day 7 decision. Default:

### Days 8–10 — Qualitative depth
- Follow up with active users: ask them to share Virnix with one creator they know
- Ask "how would you describe this to someone who hasn't seen it?"
- Ask "what would make you use this every week?"
- Document all verbatim responses (no paraphrase — actual words matter)

### Days 11–12 — Second wave expansion (if Day 7 green light)
- Expand to up to 50 users total
- Use the X/LinkedIn/Reddit copy from MARKETING_TEST_PLAN.md
- Monitor cost in real time (see COST_CONTROL_POLICY.md)

### Day 13 — Synthesis
- Write a 1-page beta findings note
- Answer each "what we are testing" question from this doc
- Identify: best user type, strongest output, biggest friction point

### Day 14 — Decision gate
- Make a binary decision: proceed to BILLING-A or fix a specific blocking issue first
- If proceeding to BILLING-A: use beta findings to refine pricing copy and onboarding

---

## What Miha Should Do Daily

| Task | Time | Notes |
|------|------|-------|
| Check Vercel logs for errors | 5 min | Watch for 500s, API timeouts, credit edge cases |
| Check Supabase for new sign-ups | 3 min | Count new users, check credit balances |
| Check for direct messages/replies | 5 min | Respond within 4 hours to beta users |
| Note anything surprising | 2 min | One sentence in a running notes doc |

Total daily time: ~15 minutes. Not more. Do not obsess.

---

## What Claude/Engineering Should Do

- Fix P0 bugs same day (broken auth, generation fails, credits not deducting)
- Fix P1 issues within 48 hours (misleading error messages, broken copy buttons)
- Leave P2 polish for after beta (font sizes, minor dark mode tweaks, animation details)
- Do NOT add features during the beta window unless a specific gap blocks real usage
- Log all changes made during beta in BETA_LOG.md with date and reason

---

## What Should Be Measured

**Hard metrics (check weekly):**
- Users signed up
- Users who completed ≥1 generation
- Users who returned (≥2 sessions)
- Total credits used
- Total API cost (Anthropic dashboard)
- Error rate (500s in Vercel logs)

**Soft signals (check after each interaction):**
- Did user understand what to paste?
- Did user use Creator Energy or leave on Balanced?
- Did user engage with Best Angle card?
- Did user copy any output?
- What did user say in follow-up?

---

## What Should Not Distract Us

- Conversion rate (zero paid users expected)
- Virality or social sharing
- SEO
- Domain authority
- Mobile app
- Video editing
- Team/multi-seat features
- Advanced analytics dashboards
- Stripe/billing (until beta validation is done)
- Perfect onboarding flow (good enough for 20 users)

---

## Recommendation: Launch to 20 Users First

**Start with 20, not 50 or 100.**

Reasoning:
1. 20 is enough for qualitative signal. You do not need statistical significance — you need honest reactions.
2. 20 is manageable for one founder. You can personally follow up with every user.
3. 20 limits cost exposure while the credits SQL situation and production hardening is confirmed.
4. If 15 of 20 love it, expand to 50. If 5 of 20 love it, figure out why first.
5. A controlled 20-person launch that goes well is a better story than a rushed 100-person launch with broken auth and no follow-up.

**Target profile for first 20:**
- Solo creators (not agencies)
- Regular content producers (at least weekly)
- Already repurposing content manually (they understand the problem)
- Know Miha or can be personally reached (warm, not cold)

See MARKETING_TEST_PLAN.md for acquisition tactics.
