# Virnix Feedback System

**Status:** Planned / candidate — not yet implemented.

This folder documents the lightweight feedback loop for Virnix early users.

> This is not an enterprise support system or an analytics dashboard.
> It is a fast, creator-native feedback capture system — designed to answer:
> "Is this actually useful, and what should we build next?"

---

## Documents in this folder

| File | Purpose |
|------|---------|
| [FEEDBACK_SURVEY_PLAN.md](FEEDBACK_SURVEY_PLAN.md) | 5-question survey design + implementation architecture |
| [IMPROVEMENT_LOOP.md](IMPROVEMENT_LOOP.md) | How feedback is tagged, reviewed, and turned into roadmap decisions |

## Related docs

| File | Purpose |
|------|---------|
| [../roadmap/FEATURE_ROADMAP.md](../roadmap/FEATURE_ROADMAP.md) | Where feedback feature sits in the roadmap |
| [../roadmap/RELEASE_PLAN.md](../roadmap/RELEASE_PLAN.md) | Which version includes feedback capture |
| [../BUSINESS_PLAN_CURRENT.md](../BUSINESS_PLAN_CURRENT.md) | Business plan context |

---

## Why this matters

Without a feedback loop, the only way to know what to build is guessing.

Early users will reveal:
- Which outputs are actually used vs. ignored
- Which Creator Energy directions are most valuable
- Which creator archetypes Virnix currently underserves
- What formats or platforms are missing
- What friction is blocking conversion or repeat use

This feedback drives roadmap decisions more reliably than any internal assumption.

---

## Design principles

- **Fast.** Under 60 seconds to complete.
- **Creator-native.** No corporate survey language. Direct and practical.
- **Non-blocking.** Feedback capture never interrupts the generation flow.
- **Low-friction.** Predefined options + optional free text. No essays.
- **Anonymous-friendly.** Works before auth exists; attaches user_id once auth is live.
- **Actionable.** Every question maps to a specific roadmap or product decision.

---

## Implementation sequence

1. **Now:** Design and document (this phase)
2. **v0.3.x:** Lightweight post-generation feedback widget (after auth + billing exist)
3. **v0.4.x:** Feedback-informed improvements to history/saved outputs
4. **v0.6.x:** Studio/Agency-specific feedback categories

First implementation can be a simple form appended after the output cards. No admin dashboard needed initially — review responses manually during private beta.
