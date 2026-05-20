# Current Phase — Pricing Expansion + Roadmap Docs (BUSINESS-DOCS-B)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Business Docs Consolidation (BUSINESS-DOCS-A, 2026-05-20) — complete

---

## Context

BUSINESS-DOCS-B extends the BUSINESS-DOCS-A foundation with:
- Future pricing tier expansion (Studio + Agency)
- Dedicated product roadmap folder
- Semantic versioning system
- Feature plan by version milestone
- Release plan and changelog format

Documentation-only phase. No code changed.

---

## What Changed

### Created: `docs/roadmap/` folder (4 new files)

**`docs/roadmap/README.md`**
- Overview of roadmap folder
- Current stage (v0.1.0 private beta)
- Next implementation sequence
- Tier table (Free / Pro / Studio / Agency with status)

**`docs/roadmap/VERSIONING.md`**
- Semantic versioning for Virnix (MAJOR.MINOR.PATCH)
- Full explanation of PATCH / MINOR / MAJOR with Virnix-specific examples
- Version table (v0.1.0 through v1.0.0)
- How implementation phases map to version numbers

**`docs/roadmap/FEATURE_ROADMAP.md`**
- Features by version (v0.1.x through v1.0.0)
- Status legend (Shipped / Next / Planned / Candidate / Future / Never)
- Complete v0.1.x shipped list (25+ items)
- v0.2.x through v0.6.x planned features
- v1.0.0 launch checklist
- Anti-goals table
- Studio/Agency readiness checklists

**`docs/roadmap/RELEASE_PLAN.md`**
- v0.1.0 baseline definition + phases included
- v0.1.x patch criteria
- v0.2.0 through v1.0.0 release plans
- Changelog format (MINOR + PATCH templates)
- PATCH vs MINOR vs MAJOR decision guide
- Release checklist

### Updated: `docs/BUSINESS_DIRECTION.md`
- Header updated to BUSINESS-DOCS-B, Phases 1–34
- Roadmap folder reference added
- "Creator tier — future" replaced with Studio (€49, 350 credits) and Agency (€99, 900 credits) as named future tiers

### Updated: `docs/BUSINESS_PLAN_CURRENT.md`
- Header updated to BUSINESS-DOCS-B
- Roadmap folder references added to Section 6
- "Creator — future" expanded to Studio + Agency + PAYG with full details
- New Section 9: Future public roadmap/changelog page (docs-only)
- Section 10: VIRNIX.docx note updated with Studio/Agency references

### Updated: `docs/PRICING_CREDITS_PLAN.md`
- Section 13 (Future Pricing Tiers) rewritten:
  - "Creator tier" → **Studio — €49/month** (350 credits, features, when-to-build)
  - "Team tier" → **Agency — €99/month** (900 credits, features, when-to-build)
  - PAYG option documented
  - Tier positioning summary table added
  - plans.ts reference updated to Free/Pro/Studio/Agency
- Section 14 plans.ts comment updated

---

## What Was NOT Changed

- No app runtime code touched
- No UI components modified
- No prompts or AI logic touched
- No Supabase / Stripe / auth work done
- `docs/PROJECT_BRAIN.md` not rewritten
- `VIRNIX.docx` not modified (binary format; manual merge from BUSINESS_PLAN_CURRENT.md)

---

## Validation

- `git status`: only docs and roadmap folder changed ✅
- No build required (docs only)

---

## Next Recommended Step

**AUTH-A — Supabase authentication**

All product quality phases complete. Pricing strategy documented. Business docs and roadmap consolidated. Version baseline established at v0.1.0.

The next required implementation step is auth. Auth is the prerequisite for credits, which is the prerequisite for billing.
