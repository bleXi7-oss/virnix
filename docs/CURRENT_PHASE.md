# Current Phase — Prompt Quality Polish

Phase started: 2026-05-19
Status: complete and pushed

---

## What Was Done in This Phase

No new features, no dependencies, no architecture changes.
Targeted prompt-quality improvements across all 6 platform modules.

### Goal

Improve real AI output quality before first live API test:
- stronger hooks and curiosity
- sharper platform-native tone
- less AI-generic language
- better formatting guidance
- tighter anti-cliché rules

---

## Changes by File

### `app/lib/prompts/twitter/index.ts`

**TWITTER_TONE** — added:
- "Renew curiosity every 2–3 tweets — drop a new claim or open a new question before momentum fades"

**TWITTER_FORMAT** — tweet 1 line tightened:
- Before: "Tweet 1: bold claim or contrarian opener — no context, no warm-up."
- After: "Tweet 1: bold claim that withholds the proof — state the conclusion, force the read."

**Why:** Middle-tweet drop-off was identified in the tone rules but not enforced in the format block. The new tone rule adds the renewal directive. The format update makes tweet 1's "withhold proof" function explicit.

---

### `app/lib/prompts/linkedin/index.ts`

**LINKEDIN_TONE** — added:
- "Founder/operator voice — earned lesson from a peer, not dispensed wisdom from a pundit"

**LINKEDIN_FORMAT** — added:
- "Avoid passive observer framing: 'Hot take:', 'Something I've been thinking about', 'Friendly reminder:'."

**Why:** The existing "smart colleague, not management consultant" rule didn't explicitly block the common "thought leader dispensing wisdom" pattern. Added a founder/operator directive and named the specific phrases that trigger it.

---

### `app/lib/prompts/instagram/index.ts`

**INSTAGRAM_FORMAT** — added line-break rule:
- "New idea = new line. Never stack two ideas in one sentence."

**INSTAGRAM_FORMAT** — extended never-close-with:
- Added 'Tag a friend!' — closes the gap where the original list missed the most ad-like CTA pattern.

**Why:** Instagram captions need visual spacing for mobile readability. Stacked ideas in one sentence kill the rhythm that makes captions feel native.

---

### `app/lib/prompts/youtube/index.ts`

**YOUTUBE_TITLE_RULES** — added:
- "Use a different formula for each of the 5 titles — no two titles with the same structure"

**Why:** With 7 formulas and 5 titles, the AI was likely defaulting to its favorite 2–3 patterns. The new rule enforces structural variety across the title set.

---

### `app/lib/prompts/cleanup/index.ts`

**CLEANUP_RULES** — added:
- "Contrast creates tension: one short punchy sentence. Then a longer one that earns it."

**Why:** `VIRAL_FORMATTING_RULES` already defined this as a core formatting technique but it was never injected into the live prompt. This pulls the most actionable rule into the active cleanup block.

---

### `app/lib/prompts/index.ts`

**TikTok section** in `buildPrompt()` and `buildAdvancedPrompt()` — both strengthened from 2 lines to 5:
- Before: just an opening line + ending requirement
- After: added no-slow-setup directive, short-sentence rule, "every line makes the next feel necessary"

**Short-Form Script** (ADVANCED_SYSTEM_PROMPT + buildAdvancedPrompt) — added:
- "Cut filler transitions: 'So', 'Basically', 'What I mean is'."
- "Momentum must not break — if a line doesn't advance the idea, delete it."

**Blog Summary** (ADVANCED_SYSTEM_PROMPT + buildAdvancedPrompt) — added:
- "Skimmable — each bullet must stand alone."
- "No SEO filler: 'In today's world', 'In conclusion', 'It goes without saying'."

**Why:** TikTok was the weakest platform section — 2 lines for a format that lives or dies on every individual sentence. Short-form and blog had thin execution guidance that would produce filler-heavy output.

---

## What Was NOT Changed

- Output schema (CORE_OUTPUT_SCHEMA / ADVANCED_OUTPUT_SCHEMA) — unchanged
- JSON validation and coercion logic — unchanged
- Variation engine (emotional angles, profiles, rhythm directives) — unchanged
- Intelligence layer (hooks.ts, retention.ts, storytelling.ts, emotions.ts, platforms.ts) — unchanged
- IDENTITY_BLOCK — unchanged (STORYTELLING_PATTERNS + ANTI_GENERIC_RULES still strong)
- All non-prompt code — unchanged

---

## Validation

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Real AI: ⏳ requires ANTHROPIC_API_KEY

---

## Next Recommended Phase

**Real AI First Run**

Follow `docs/FIRST_REAL_AI_TEST_PLAN.md`:
1. Add `ANTHROPIC_API_KEY` to `.env.local`
2. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true`
3. Keep `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`
4. `npm.cmd run dev`
5. Test a short YouTube video (< 5 min)
6. Score output with `docs/OUTPUT_QUALITY_CHECKLIST.md`
7. Check `[VIRNIX_AI]` log line for diagnostics
