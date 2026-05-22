# Virnix — Architecture Beta Guardrails

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Purpose:** Define what engineering should and should not touch during the beta window

---

## Core Architectural Principle for Beta

**Do not change architecture to add scope. Change it only to fix correctness.**

During the beta, the product shape is fixed. The only acceptable code changes are:
- Bug fixes that block generation
- UX fixes that block comprehension
- Security fixes
- Documentation updates
- Log/diagnostic improvements

Everything else — new features, refactors, new output types, upload support — waits for post-beta signal.

---

## Module Boundaries — Keep These Separated

The current architecture has clean separation. Do not merge these during beta:

| Module | Location | Responsibility | Touch during beta? |
|--------|----------|---------------|-------------------|
| Parser | `app/lib/ai/parser.ts` | Extract JSON from AI response, coerce missing fields | Only for P0 parse failures |
| Transcript fetch | `app/lib/ai/transcript.ts` | YouTube → text, timestamped format, duration detection | Only for P0 transcript failures |
| Generation | `app/lib/ai/generate.ts` | Orchestrate prompt build, AI call, result assembly | Only for P0 generation failures |
| Output rendering | `app/components/generation/` | Display cards, UseThisFirstCard, ClipGuide, TranscriptQualityCard | P1 UX fixes only |
| Prompt engine | `app/lib/prompts/` | Platform-specific prompt modules | Only if output quality is consistently broken |
| Credits | `app/lib/credits/` + route | Server-side cost calculation, balance check, deduction | Only for P0 credit gate failure |
| Auth | `app/lib/auth/` + routes | Session management, magic link | Only for P0 auth failure |
| Creator Energy | `app/lib/creator-energy/` | Energy context injection | No changes during beta |
| Language | `app/lib/languages/` | Language context injection | No changes during beta |
| Schemas | `app/lib/ai/schemas.ts` | AI output type definitions, coercion | Only for parse failures |

**The rule:** If you are touching a module for a reason other than "this bug is preventing generation," stop and think.

---

## Keep Prompt Logic Centralized

All AI prompt assembly goes through `app/lib/prompts/index.ts`.

Do not:
- Build inline prompts in route handlers
- Add prompt logic directly to `generate.ts`
- Create a second prompt system for "beta mode"

If the prompt needs to change during beta, change it in the prompt modules and through the existing assembler. One place. No exceptions.

---

## Creator Energy and Best Angle Are First-Class Concepts

These are not optional add-ons or experimental flags. They are core product differentiators.

During beta:
- Creator Energy selector must be visible at idle state (all users see it)
- Best Angle / UseThisFirstCard must render when AI returns a valid `best_angle` field
- Both must work across all supported languages

Do not disable, hide, or move these features during beta. If they break, fix them — do not hide them.

---

## Credits Are Server-Side Only. No Exceptions.

The credit system was deliberately built server-side (CREDITS-A). During beta, this must remain true.

Never:
- Accept a `creditsUsed` value from the request body
- Calculate credit cost in client-side code
- Trust any client-supplied parameter for cost or balance
- Bypass the credit check to "make testing easier"

If you need to test as a user with credits, add credits manually via Supabase SQL editor. Do not change the server-side enforcement.

---

## Do Not Store Raw Videos

Virnix does not store videos. It extracts transcript text only. This must remain true throughout beta.

The current architecture: YouTube URL → `getTranscriptFull()` → text → AI → output. No video file is ever written to disk or stored in Supabase storage.

Do not add:
- File upload endpoints during beta
- Supabase storage buckets for video
- Any mechanism to persist video or audio files

---

## Store Only What Is Necessary

Current stored data:
- Supabase `user_credits`: user_id (UUID), balance, timestamps
- Supabase auth: email, session (managed by Supabase)

Nothing else is stored. Generated content is ephemeral (in-memory, returned to client, not persisted).

During beta, do not add:
- Generation history storage
- Transcript text storage
- Output card storage
- Any user profile data beyond what Supabase auth provides

If users ask for history — they are telling you they want to save outputs. That is a product signal. Log it. Build it after beta.

---

## Feature Flags — Keep These Active and Documented

| Flag | Variable | Default in production | Purpose |
|------|----------|-----------------------|---------|
| Real AI generation | `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` | true | Master AI toggle |
| Advanced outputs | `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS` | false (during beta) | Extended output mode |
| Dev debug panel | `NEXT_PUBLIC_FLAG_DEV_DEBUG` | false | Developer diagnostics |

**Do not remove feature flags during beta.** They are your kill switches and testing levers.

**New flag to consider before public beta:**
A `NEXT_PUBLIC_FLAG_BETA_MODE` flag could show a "Beta" badge in the UI and enable/disable specific beta-only messaging. Not required for 20-user closed beta, but useful before public opening.

---

## Prefer Text/Transcript Workflows

Virnix is transcript-first. Every feature should work from text.

During beta, the only input source is a YouTube URL. The architecture correctly reflects this.

Future sources (audio upload, podcast RSS, direct transcript paste) are v0.5.x candidates. Do not add them during beta. Do not add endpoints, storage, or processing pipelines for them.

If a user says "I have a transcript but not a YouTube video" — that is a valid use case. Log it. The simplest solution (a "Paste transcript" mode that bypasses YouTube fetch) is a 2-hour feature that should wait for post-beta validation before building.

---

## Analytics — Add Carefully

Current analytics: `track()` stub in `app/lib/analytics.ts` — typed events, no provider connected.

During beta with 20 users, manual log review is sufficient. Do not add a full analytics provider (PostHog, Amplitude, Mixpanel) until you have enough users to generate meaningful data.

If adding analytics:
- Keep events client-side only for UX tracking
- Never send transcript content or generated output to analytics
- Never send email addresses to analytics
- Events allowed: `generation_started`, `generation_completed`, `copy_clicked`, `energy_selected`, `language_selected`, `sign_in`, `sign_out`

---

## Add Upload Support Later

Audio/MP4 upload is planned for v0.5.x. During beta:

- Do not build upload endpoints
- Do not add Supabase storage buckets
- Do not add transcription pipeline (Whisper, AssemblyAI, etc.)
- Do not add file size validation (nothing to validate)

When users ask for upload support, say: "This is coming after beta." Log it. Do not build it.

---

## Add Stripe Later, After Beta Signal

BILLING-A is explicitly post-beta. During beta:

- Do not integrate Stripe
- Do not add pricing pages with real checkout
- Do not add subscription management UI
- Do not add webhook handlers for payment events

If a user says "I want to pay" — take their email and put them on a waiting list manually. That is a better use of 15 minutes than starting Stripe integration under beta pressure.

---

## Expected Future Phases (For Reference)

The following phases are documented as coming post-beta. Do not start them during the beta window:

| Phase | What it covers | When |
|-------|---------------|------|
| FREE-BETA-A | Production readiness confirmation: SQL, real AI, credits, smoke tests | Before first user invite |
| FREE-BETA-B | Cost control infrastructure: rate limiting, alerting | Before 50+ users |
| FREE-BETA-C | Feedback capture: post-generation survey, response tagging | Week 2 of beta |
| FREE-BETA-D | First public invite: controlled 20-user wave | Day 3 of beta (per strategy) |
| BILLING-A | Stripe/Paddle integration, Pro subscription, webhook credit allocation | After beta signal confirmed |
| CREDITS-B | Credit transaction audit log, rate limiting per user, monthly reset | After BILLING-A |

---

## Checklist Before Any Beta Code Change

Before making any code change during the beta window, confirm:

- [ ] This change fixes a P0 or P1 issue (not cosmetic)
- [ ] The change is isolated to the module responsible for the issue
- [ ] The change does not affect auth, credit deduction, or the AI provider
- [ ] lint passes after the change
- [ ] build passes after the change
- [ ] The change has been manually tested on production (not just localhost)
- [ ] The commit message explains WHY the change was made
- [ ] BETA_LOG.md is updated with a note about the change and the reason
