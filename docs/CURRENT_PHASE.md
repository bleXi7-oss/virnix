# Current Phase — Feedback / Improvement Loop Plan (BUSINESS-DOCS-C)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Pricing Expansion + Roadmap Docs (BUSINESS-DOCS-B, 2026-05-20) — complete

---

## Context

BUSINESS-DOCS-C adds the feedback system design to the documentation suite.

Goal: Document a lightweight post-generation creator feedback loop so early users can tell us which outputs are useful, what's wrong, and what to build next. Nothing implemented — design and planning only.

---

## What Changed

### Created: `docs/feedback/` folder (3 new files)

**`docs/feedback/README.md`**
- Folder overview: purpose, design principles, implementation sequence
- Links to FEEDBACK_SURVEY_PLAN.md and IMPROVEMENT_LOOP.md
- Cross-links to roadmap docs

**`docs/feedback/FEEDBACK_SURVEY_PLAN.md`**
- 5-question survey design (full questions, options, purpose of each)
- Survey placement rules (post-generation, non-blocking, skippable)
- Future implementation architecture:
  - `FeedbackWidget.tsx` component
  - `app/lib/feedback/types.ts` — `FeedbackAnswer`, `FeedbackSubmission`
  - `app/lib/feedback/options.ts` — typed question/options registry
  - `app/api/feedback/route.ts` — server-side validation, Supabase write
  - `feedback_responses` DB table sketch
- Implementation rules (server-side validation, anonymous pre-auth, no secrets, free text limit)
- Copy guidelines (creator-native language, no NPS, no corporate survey filler)

**`docs/feedback/IMPROVEMENT_LOOP.md`**
- Full feedback → decision process (collect → tag → review → pattern → action)
- 12-category tag system (output-quality, platform-quality, missing-feature, creator-archetype, energy-direction, etc.)
- Review cadence by user volume (immediate → weekly → biweekly)
- Pattern detection rules (3 = signal, 5 = priority)
- Priority framework (P0/P1/P2/Candidate)
- What feedback can vs. cannot change (anti-goals are not overridable)
- Connection to public roadmap

### Updated: `docs/roadmap/README.md`
- Feedback folder reference added to Related docs
- v0.1.0 shipped list updated (BUSINESS-DOCS-B/C)

### Updated: `docs/roadmap/FEATURE_ROADMAP.md`
- v0.1.x patches: BUSINESS-DOCS-C added
- v0.3.x: feedback widget + DB storage added as Planned
- v0.4.x: feedback-informed improvements added as Candidate
- v0.6.x: Studio/Agency feedback categories added as Future
- v1.0.0: "User feedback loop" upgraded from Candidate to Planned

### Updated: `docs/roadmap/RELEASE_PLAN.md`
- BUSINESS-DOCS-C (35) added to v0.1.0 phases
- v0.3.0 description updated with feedback widget

### Updated: `docs/BUSINESS_DIRECTION.md`
- Header updated to BUSINESS-DOCS-C, Phases 1–35, feedback folder reference
- New section: Feedback Loop (5-question survey, purpose, planned version)

### Updated: `docs/BUSINESS_PLAN_CURRENT.md`
- Header updated to BUSINESS-DOCS-C
- New Section 9: Feedback-Driven Roadmap (full process, signal → decision table, what feedback can/cannot change)
- Old Section 9 → 10, old Section 10 → 11

---

## What Was NOT Changed

- No app runtime code touched
- No UI components modified
- No prompts or AI logic touched
- No Supabase / Stripe / auth work done
- `docs/PROJECT_BRAIN.md` not rewritten
- `VIRNIX.docx` not modified (binary format)

---

## Validation

- `git status`: only docs and feedback folder changed ✅
- No build required (docs only)

---

## Next Recommended Step

**AUTH-A — Supabase authentication**

All planning/documentation work complete (product quality, pricing, business plan, roadmap, versioning, feedback system).

The next required implementation step is auth. Auth is the prerequisite for credits, billing, and feedback storage.
