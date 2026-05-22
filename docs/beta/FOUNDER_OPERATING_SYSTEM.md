# Virnix — Founder Operating System for Beta

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Audience:** Miha — this document is for you, not for users

---

## What This Document Is

This is a management guide for running the beta without burning out, overbuilding, or making decisions under pressure that you'll regret.

You are a solo builder. That means you do not have a co-founder to push back on bad ideas, a PM to filter noise, or a QA team to catch things before users do. This document is a stand-in for all of those.

Read it before making any major decision during the beta.

---

## How to Manage the Beta

### What "managing" means at 20 users

- Read logs once a day (5 minutes)
- Read messages and respond within 4 hours
- Write one sentence in BETA_LOG.md at the end of each day
- Fix P0 bugs same day
- Do nothing else

That is it. That is the whole management job for the first week.

### What "managing" does NOT mean

- Watching the dashboard every hour
- Refreshing Vercel logs while users are in a session
- Reading analytics before you have enough data to interpret it
- Adding new features in response to the first complaint
- Rewriting landing copy after the first confused user
- Holding a "product review meeting" with yourself

You will feel the urge to do these things. Resist them. The product is live and working. Trust it for a week before touching it.

---

## What to Check Every Day

| Check | Time | How |
|-------|------|-----|
| New sign-ups | 3 min | Supabase → Table editor → user_credits |
| Credit usage | 2 min | Same table — check balance changes |
| Vercel error rate | 3 min | Vercel dashboard → Functions → check for 500s |
| Messages from beta users | 5 min | DMs, email, wherever they reach you |
| Anthropic cost | 2 min | Anthropic dashboard — weekly is fine, daily during first 3 days |

Total: ~15 minutes. Not more.

---

## What to Ignore

- Your app's Lighthouse score
- Whether the font is exactly right
- The animation speed on the output cards
- That one user who didn't respond to your follow-up
- Competitors launching new features
- Twitter threads about "the right way to build a SaaS"
- Whether the beta "looks professional enough"

---

## How to Avoid Panic When Users Complain

Users will complain. Some complaints are P0 bugs. Most are not.

**When a complaint arrives, ask these questions in order:**

1. Can a user not complete a generation because of this? → P0. Fix today.
2. Does this cause a user to lose trust or feel misled? → P1. Fix this week.
3. Is this cosmetic or a nice-to-have? → Log it. Do not build it during beta.
4. Is this a feature request disguised as a complaint? → Log it in the roadmap. Respond: "I've noted this. Not in beta scope but likely coming."
5. Is this about a use case Virnix does not support (video editing, auto-posting, teams)? → Respond honestly: "That's not what Virnix does. Here's what it does well."

**Never:**
- Apologize for features that don't exist
- Promise a timeline you are not sure about
- Add a feature immediately because one user asked for it

---

## How to Decide If Feedback Is Real Signal or Noise

**Signal:**
- Same problem mentioned by 3+ different users independently
- A user stops using the product because of a specific issue (and says why)
- A user says "I would pay for this if only it did X"
- A user compares Virnix to a specific competitor and explains why they prefer the competitor for X use case

**Noise:**
- One user wants a feature that no one else has mentioned
- A user who tries the product once and never engages again gives a vague critique
- Friends say "looks cool!" — that is not feedback, it is politeness
- Feedback that contradicts itself from the same person within the same conversation

**Rule:** One person saying something is interesting. Three people independently saying the same thing is a pattern. A pattern is signal.

---

## How to Handle Friends Testing the App

Friends will be too nice. They will say "this is amazing" and not tell you what confused them.

**To get honest feedback from friends:**
- Ask specific questions: "Did you understand what to put in the URL field?" / "What did you expect to see after clicking Generate?"
- Ask them to screen-share their first session if possible
- Ask: "What would make you NOT use this?" (negative framing gets honest answers)
- Ask: "How would you explain this to someone who hadn't seen it?"

Do not ask: "Did you like it?" — you will always get "yes."

Do not send friends your proudest features. Send them the product cold and watch what they do first.

---

## How to Avoid Polish Addiction

**Polish addiction symptoms:**
- "I just want to fix this one animation before inviting users"
- "The font looks slightly off on mobile — let me fix that first"
- "The card shadow needs to be slightly softer"
- "The copy on the generate button isn't quite right"

**The test:**
Ask: "Would a new user not try the product because of this?"

If the answer is no — it is not a beta blocker. Log it. Move on.

**The only exception:** If a UI issue directly causes confusion about what to do (where to click, what to paste), that is a UX issue, not polish, and it belongs in P1.

---

## How to Avoid Feature Addiction

**Feature addiction symptoms:**
- "If I just add audio upload, more creators will use it"
- "I should add a history page so users can come back to their generations"
- "A dashboard would help users understand their credit usage"
- "I need to add a feedback widget before launching"

**The test:**
Ask: "Is there a specific user who can not use the product right now because this feature doesn't exist?"

If yes, and that user is representative of your target, consider it.
If no — it is a future feature. Log it. Move on.

**The cost of overbuilding during beta:**
- Delayed launch (users never see the product)
- Architecture debt (features built on assumptions instead of validated behavior)
- Burnout (building features nobody asked for)
- Missed signal (you were building, not watching users)

---

## How to Maintain Clean Architecture During Beta

When a P0 fix is needed, follow this protocol:

1. Identify the minimal change that fixes the issue
2. Write the fix
3. Run lint + build
4. Test on production manually
5. Commit with a clear message explaining why (not what)
6. Push

Do NOT:
- Refactor surrounding code while fixing a bug
- Add new abstractions "while you're in there"
- Combine a bug fix with a feature in the same commit
- Ship untested code to production under pressure

If the fix requires more than 30 lines of code, stop and think whether you are fixing the real problem or patching a symptom.

---

## What Claude Can Decide Alone

These do not require Miha's review before execution:

- Run lint, build, QA scripts
- Fix TypeScript errors or ESLint warnings
- Fix a P0 bug where the root cause is clear and the fix is small (<30 lines)
- Update documentation
- Read and summarize logs or output files
- Research a technical question and present options
- Write draft copy for review

---

## What Claude Must Ask Before Doing

- Any change to auth logic, session handling, or credit deduction
- Adding or removing environment variables
- Changing the AI prompt or schema in a way that affects output quality
- Any git operation that modifies history (amend, rebase, force push)
- Committing or pushing after a major feature
- Running real AI generation scripts that cost money
- Adding external dependencies or new packages

---

## What Belongs in Docs

- Strategy decisions and why they were made
- Risk assessments
- Phase outcomes and validation results
- Architecture decisions and their reasoning
- Anything that would take more than 5 minutes to re-derive from the codebase
- Beta log: what happened, what was learned

---

## What Belongs in Code

- Technical implementation only
- Bug fixes
- Feature flag logic
- Error handling
- Anything a future developer (or Claude) needs to read to understand how the system works

---

## What Belongs in Future Roadmap

When a request comes in that should not be built now, add it here (not in code):

**docs/roadmap/FEATURE_ROADMAP.md** — add to appropriate future version section.

Do not build it. Do not comment it out in code as "TODO." Do not create a branch for it. Log it in the roadmap. Forget it until the right phase.

---

## Beta Blocker vs. Nice-to-Have

| Situation | Classification |
|-----------|---------------|
| Generation returns an error and the user can't proceed | P0 blocker |
| Auth fails for a real user and they can't sign in | P0 blocker |
| Credits not deducting and API cost is climbing | P0 blocker |
| API key exposed in client JS | P0 blocker (security) |
| Error message says "Error 500" instead of a human explanation | P1 — fix within 48h |
| Copy button doesn't work on mobile | P1 — fix within 48h |
| Transcript fetch fails and shows wrong error message | P1 — fix within 48h |
| A card shadow looks slightly different in Firefox | P2 — log, not urgent |
| The animation on the output panel is slightly slow | P2 — log, not urgent |
| Font weight feels heavy | P2 — not during beta |
| User asks for audio upload | Roadmap — log as v0.5.x candidate |
| User asks for generation history | Roadmap — log as v0.4.x |
| User asks for team features | Roadmap — log as Agency tier candidate |
| User asks for a mobile app | Roadmap — log as future |
| User asks for video clip output | Outside scope — explain, do not build |

---

## Decision Framework

### Fix immediately if:
- It blocks a user from completing a generation
- It costs money unexpectedly (credit gate broken)
- It exposes a secret or security vulnerability
- It breaks authentication
- It confuses the majority of users in the same way

### Document for later if:
- It is cosmetic
- It is an advanced workflow feature
- It requires a database schema change
- It is a nice-to-have export format
- It is any kind of dashboard UI
- One user asked for it but no others have

### Reject for now if:
- It moves Virnix toward video editing or clip rendering
- It requires enterprise infrastructure (multi-tenant, SSO, audit logs)
- It requires an expensive third-party API not already in use
- It adds significant complexity without clear validated demand
- It would take more than 2 days to build and has not been asked for by 3+ independent users

---

## The One Rule

If the product is live, users can generate, and there are no P0 bugs:

**Do not touch the code. Go talk to users instead.**
