# Virnix Versioning System

Virnix uses **semantic versioning**: `MAJOR.MINOR.PATCH`

---

## What each number means

### PATCH — small fix or polish

Format: `v0.1.1`, `v0.1.2`, `v0.2.1`

Used for:
- Bug fixes
- UI polish (spacing, color, shadow adjustments)
- Copy tweaks (headlines, labels, CTAs)
- Prompt wording adjustments
- QA script improvements
- Docs corrections
- No major behavior change for users

**When to increment:** Any commit or small batch of commits that fixes something or refines an existing experience without adding a user-visible capability.

---

### MINOR — new user-visible capability

Format: `v0.2.0`, `v0.3.0`, `v0.4.0`

Used for:
- New user-visible feature (auth flow, credit display, pricing page)
- New product capability (energy steering, clip guide, quality card)
- New workflow module (billing, upload support, history)
- New platform support
- Backward-compatible meaningful additions

**When to increment:** When a meaningful new capability ships that a user would notice as a new feature. Implementation phases (AUTH-A, CREDITS-A, BILLING-A) each map to a MINOR increment.

---

### MAJOR — stable public launch milestone

Format: `v1.0.0`

Used for:
- Public launch-ready stable product
- All required systems stable (auth + credits + billing + generation + cost controls)
- Real-world validated
- Production monitoring in place
- Major repositioning or workflow overhaul

**When to increment:** v1.0.0 is the first public stable launch. Do not call the current product v1.0.0 — it has no auth, no credits, no billing.

---

## Versioning rules

- All pre-launch versions are `0.x.x` — explicitly signals "not yet stable for public"
- Never skip a MINOR just to reach a rounder number
- Do not rush to v1.0.0 — use it as a quality gate, not a marketing deadline
- Each MINOR release should have at least one validated implementation phase behind it

---

## Version examples

| Version | What it represents |
|---------|-------------------|
| `v0.1.0` | Private beta baseline — full product foundation, no monetization |
| `v0.1.1` | Small UI polish, docs update, prompt refinement |
| `v0.1.2` | Another targeted fix or improvement |
| `v0.2.0` | AUTH-A + CREDITS-A — user identity and credit system |
| `v0.3.0` | BILLING-A — Stripe Pro plan, pricing page, upgrade flow |
| `v0.4.0` | Generation history, saved outputs |
| `v0.5.0` | Audio/video upload support |
| `v0.6.0` | Studio workflow features (batch, export, brand voice) |
| `v1.0.0` | Stable public launch — all systems validated, production-ready |

---

## How versions relate to implementation phases

Implementation phases (AUTH-A, CREDITS-A, BILLING-A, etc.) are granular development units. Versions are product milestones that group related phases.

One MINOR version typically spans 1–3 implementation phases.

Example:
- v0.2.0 = AUTH-A + CREDITS-A (closely coupled, ship together)
- v0.3.0 = BILLING-A + pricing page + upgrade CTA (one cohesive billing release)

---

## Changelog expectations

Every MINOR or MAJOR release gets a changelog entry in [RELEASE_PLAN.md](RELEASE_PLAN.md).

PATCH releases: brief note in RELEASE_PLAN.md or commit message only — no full changelog entry required unless the fix is significant.
