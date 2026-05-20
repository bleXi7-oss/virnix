# Virnix Improvement Loop

How creator feedback turns into product decisions.

**Status:** Process design — not yet active (no feedback system implemented yet).

---

## The loop

```
Creator generates content
    ↓
Sees 5-question feedback widget
    ↓
Submits answers (optional, under 60s)
    ↓
Weekly internal review
    ↓
Tag by category
    ↓
Identify repeating patterns
    ↓
Convert to roadmap candidates or priority fixes
    ↓
Build → ship → measure → repeat
```

---

## Step 1 — Collect

Feedback is captured via the post-generation survey (see [FEEDBACK_SURVEY_PLAN.md](FEEDBACK_SURVEY_PLAN.md)).

During private beta: responses stored in Supabase, reviewed manually.  
Later: lightweight internal view when volume increases.

**What not to collect:**
- Net Promoter Score — too vague, not actionable
- Email/identity unsolicited — only collect if user opts in
- Long-form essays — predefined options with optional short free text is enough
- Real-time feedback during generation — non-blocking only

---

## Step 2 — Tag

Every feedback response gets tagged in one or more categories:

| Tag | What it covers |
|-----|----------------|
| `output-quality` | Output was generic, wrong tone, too long/short, weak hooks |
| `platform-quality` | Specific platform output underperformed (e.g. LinkedIn felt corporate) |
| `missing-feature` | Request for a feature not yet built |
| `pricing-concern` | Credits, cost, or plan tier mentioned as friction |
| `usability-issue` | UX friction — something was confusing or hard to find |
| `creator-archetype` | A creator type Virnix doesn't serve well enough |
| `content-format` | Request for new output type (newsletter, short script, etc.) |
| `energy-direction` | Request for new or improved Creator Energy mode |
| `platform-request` | Request for a new platform (YouTube Shorts script, newsletter, etc.) |
| `bug` | Something didn't work as expected |
| `positive` | What worked well — important to track, not just failures |

Free-text "Other" answers should be tagged after reading.

---

## Step 3 — Review cadence

**During private beta (first 0–50 users):** Review every response immediately. At low volume, patterns are obvious.

**At 50–200 users:** Weekly review session. Batch responses, identify clusters.

**At 200+ users:** Lightweight tagging tool or Supabase query. Review top patterns biweekly.

The goal of the review is to answer:
1. What is breaking that we didn't know about?
2. What is missing that multiple users want?
3. What is working that we should double down on?

---

## Step 4 — Identify patterns

A single piece of feedback is noise. Three identical complaints is a signal. Five is a priority.

**Pattern detection rules:**
- Same tag appearing in ≥3 unrelated responses → review for action
- Same free-text theme across ≥3 responses → extract as explicit finding
- "Positive" responses mentioning the same feature → double down on that feature
- Single response with extreme severity (total blocker) → investigate immediately regardless of frequency

**Do not act on:**
- One-off requests with no pattern
- Feature requests that conflict with anti-goals (analytics dashboard, social scheduling, etc.)
- Complaints that reflect the intended product direction (e.g. "no editing tools" is not a bug)

---

## Step 5 — Convert to decisions

Patterns become one of these outcomes:

### Priority fix (P0 / P1)

Something is broken or blocking real use.

| Level | Definition | Action |
|-------|-----------|--------|
| **P0** | Blocks usage, payment, or core workflow | Fix before next deploy |
| **P1** | Hurts output quality, conversion, or trust | Fix within current sprint |
| **P2** | Polish or improvement, not blocking | Add to next PATCH release |

### Roadmap candidate

A repeated request that doesn't exist yet. Moves from "Future" to "Candidate" in the feature roadmap.

Threshold: ≥5 responses with same tag/theme before promoting a candidate to Planned.

### Creator archetype finding

A creator type that consistently finds Virnix output weak. Triggers a targeted real-AI test with that archetype's transcript style before deciding whether to invest in prompt improvements.

### Energy direction finding

A Creator Energy mode that consistently disappoints (fingerprint score low, outputs feel wrong). Triggers a directed polish phase (like CE-C for Contrarian).

---

## Priority framework

When multiple issues compete, prioritize in this order:

1. **Blocks conversion or payment** — user can't use the product or can't pay
2. **Hurts output quality** — users won't return if outputs are consistently wrong
3. **Reduces churn** — something that makes paying users leave
4. **Supports target creator archetypes** — podcasters, educators, thought leaders
5. **Protects margin / cost** — anything that could cause runaway AI cost
6. **Polish / nice-to-have** — everything else

Do not build a feature just because one user asked loudly. Build it when the pattern repeats across multiple independent users and it clears the priority bar.

---

## What feedback should influence

| Feedback category | What it can change |
|-------------------|-------------------|
| Output quality / generic | Prompt refinements, energy directive polish |
| Platform quality | Platform-specific prompt improvements |
| Creator archetype gap | Test + tune prompts for that domain |
| Missing energy direction | New Creator Energy mode evaluation |
| Missing platform | Add to roadmap Candidate if ≥5 requests |
| New content format | Add to roadmap Candidate if ≥5 requests |
| Pricing concern | Review credit tiers, not necessarily price |
| Usability issue | UX/copy fixes — usually PATCH |

---

## What feedback should NOT do

- Override the anti-goals list (no analytics dashboard, no social scheduling, no video editing — even if requested)
- Force building a feature one user wants loudly but others haven't mentioned
- Commit to specific ETAs publicly based on feedback
- Lead to scope creep beyond the core generator flow
- Replace internal quality judgment — feedback is signal, not instruction

---

## Connection to public roadmap

When a feedback-driven feature moves from Candidate to Planned:
- Update [FEATURE_ROADMAP.md](../roadmap/FEATURE_ROADMAP.md) status
- If it justifies a public mention, add to the "Next" section of the future public roadmap page
- Do not promise delivery dates

When a feedback-driven fix ships:
- Note it in the PATCH or MINOR changelog entry in [RELEASE_PLAN.md](../roadmap/RELEASE_PLAN.md)
- E.g. "v0.3.1 — Contrarian energy improved based on early user feedback"
