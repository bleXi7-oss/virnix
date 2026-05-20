# Virnix Feedback Survey Plan

**Status:** Designed — not yet implemented.  
**Target version:** v0.3.x (after auth + billing, or as lightweight anonymous form in v0.2.x)

---

## Purpose

A short post-generation survey that lets creators tell us what actually worked.

The goal is not sentiment tracking. The goal is signal for specific product decisions:
- Which outputs to improve first
- Which Creator Energy modes to polish
- Which creator archetypes to support better
- Which features to prioritize next

---

## Design requirements

- 5 questions maximum
- Each question has predefined options (fast to answer, structured for analysis)
- Each question includes "Other: [free text]" for edge cases
- Total time: under 60 seconds
- Appears after generation — never before, never blocking
- Skippable — a creator who doesn't want to respond should never feel forced

---

## The 5 Questions

---

### Q1 — Usefulness

**Question:** How useful was this generation?

**Options:**
- Very useful — I'll post this or most of it
- Somewhat useful — good starting point, needs editing
- Not useful — outputs weren't what I needed
- I was just testing it out
- Other: [free text]

**What this tells us:** Overall quality signal. If "not useful" clusters around specific transcript types, that's a product problem to fix.

---

### Q2 — Best output

**Question:** Which output helped you most?

**Options:**
- TikTok hooks / script
- LinkedIn post
- X / Twitter thread
- Instagram caption
- YouTube titles / timestamps
- Strongest Moments / Clip Guide
- Nothing was useful
- Other: [free text]

**What this tells us:** Which platforms are driving real value vs. which are just decoration. If YouTube timestamps consistently scores zero, that's a signal to invest there or deprioritize it.

---

### Q3 — Weakest point

**Question:** What felt weakest or wrong?

**Options:**
- Too generic — could have been about anything
- Didn't sound like my style or voice
- Wrong tone for my audience
- Outputs were too long
- Outputs were too short
- Not grounded enough in my actual transcript
- Hooks weren't strong enough
- Wrong format for the platform
- Other: [free text]

**What this tells us:** Specific quality failure modes. "Too generic" → prompt issue. "Not grounded enough" → timeline detection or prompt grounding issue. "Wrong format" → platform-specific prompt issue.

---

### Q4 — Next priority

**Question:** What would you want Virnix to add or improve?

**Options:**
- Stronger / more varied hooks
- More Creator Energy directions
- Brand voice calibration (match my style)
- More platforms (Shorts script, newsletter, etc.)
- Audio or video file upload (not just YouTube)
- Saved generation history
- Export content packs
- Process multiple videos at once (batch)
- Other: [free text]

**What this tells us:** Which roadmap candidate features have the most pull. If "brand voice" repeatedly tops this, it moves from Candidate to Planned.

---

### Q5 — Creator type

**Question:** What kind of content or creator does Virnix need to serve better?

**Options:**
- Podcasters (long-form audio)
- Educators (structured lessons, tutorials)
- Coaches and consultants
- Business / startup creators
- Fitness and wellness creators
- Science and medical educators
- Philosophical / reflective creators
- Vloggers and story-driven creators
- Agencies doing client work
- Other: [free text]

**What this tells us:** Creator archetype gaps. If "fitness" repeatedly appears as underserved, that's a signal to test Virnix on fitness transcripts and tune prompts for that domain.

---

## Survey placement

**Preferred:** Small widget below the output cards, visible after generation completes.  
**Alternative:** A "Give feedback" link in the footer or output area.  
**Not appropriate:** Modal / popup that interrupts the generation or output viewing experience.

The survey should be discoverable but not demanding.

---

## Future implementation architecture

Not built yet. Design notes for when this ships (v0.3.x):

### Frontend component

```
app/components/FeedbackWidget.tsx
```

- Renders after `phase === "done"`
- Collapsible — starts with a single "How did it go? →" prompt
- Expanding shows the 5 questions inline
- Submits to `/api/feedback`
- Shows "Thanks" state after submit
- Never re-shows in the same session after submission

### Feedback types

```
app/lib/feedback/types.ts
```

```typescript
// Future — not now
type FeedbackAnswer = {
  questionId: string;
  selected: string;   // predefined option value
  freeText?: string;  // "Other" free text, optional
};

type FeedbackSubmission = {
  sessionId: string;           // anonymous session ID pre-auth
  userId?: string;             // attach if auth exists
  generationId?: string;       // link to specific generation if available
  answers: FeedbackAnswer[];
  submittedAt: string;         // ISO timestamp
};
```

### Options registry

```
app/lib/feedback/options.ts
```

Defines the 5 questions and their predefined options as a typed constant — same pattern as creator energy options. No hardcoded strings in the component.

### API route

```
app/api/feedback/route.ts
```

- `POST /api/feedback`
- Server-side validation (answer count, option values against allowlist, free text length limit)
- No API key or transcript content stored
- Stores to Supabase `feedback_responses` table (future)
- Returns `{ ok: true }` — no sensitive data back to client

### Database table (future, sketch only)

```sql
feedback_responses (
  id              uuid primary key,
  session_id      text not null,
  user_id         uuid references auth.users nullable,
  generation_id   uuid nullable,
  answers         jsonb not null,
  submitted_at    timestamptz default now()
)
```

### Implementation rules

- **Server-side validation only.** Validate option values against the allowlist — reject unknown options.
- **Free text: max 500 chars.** Prevents abuse and keeps storage manageable.
- **Anonymous pre-auth.** Use a session ID (not user_id) until auth exists. Attach user_id post-auth.
- **Never store secrets.** No API keys, no transcript content, no personal data beyond optional user_id.
- **Non-blocking.** The feedback API route is independent — a failure never affects generation.
- **No admin dashboard needed early.** Export from Supabase directly during private beta. Build a simple view only when feedback volume makes manual review impractical.

---

## Copy guidelines

Survey language should feel like a smart creator talking to you, not a corporate NPS survey.

| ❌ Avoid | ✓ Use instead |
|---------|--------------|
| "Please rate your satisfaction" | "How useful was this generation?" |
| "Overall experience score" | Skip altogether |
| "Would you recommend Virnix?" | Too early, not actionable |
| "Please provide detailed feedback" | Short, specific questions |
| "Your input is valuable to us" | No filler copy |

Heading: "Quick feedback — 60 seconds" or just "How did it go?"  
Submit button: "Send feedback" (not "Submit survey")  
Thanks state: "Got it. Thank you." (no marketing language)
