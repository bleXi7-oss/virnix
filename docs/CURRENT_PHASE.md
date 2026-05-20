# Current Phase — TikTok Domain Unlock + Closing Pool (QB-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Hero Card Internal Atmosphere (UI-POLISH-K, 2026-05-20) — complete

---

## Context

QA-A identified two P0 issues blocking Creator Energy Selection:
1. ~40–46% of TikTok openers were creator-growth-specific (creator, followers, algorithm, 100k),
   producing embarrassing output on medical, historical, educational, or narrative transcripts.
2. The hardcoded TikTok ending "Here's the exact system..." forced a "system" framing onto
   every transcript, causing hallucinated frameworks for confessional, philosophical, or story content.

QA-A also identified a P1-1 contradiction in YouTube titles — "Nobody Talks About" appeared in
both YOUTUBE_TITLE_FORMULAS (to use it) and YOUTUBE_TITLE_RULES (to avoid it).

---

## What Changed

### Updated: `app/lib/prompts/platforms/tiktok.ts`

**Opener pool (26 → 26):**
- Removed 9 creator-specific openers (containing: creator, creators, followers, algorithm, 100k, views, best-performing post)
- Replaced with 9 domain-agnostic alternatives
- All 26 openers now pass creator-domain-specific detection check (0% ratio, down from ~40–46%)
- Near-duplicate pair resolved

**New: `TIKTOK_CLOSING_LINES` pool (8 entries):**
- "Here is the useful way to think about it:"
- "Here is the part that changes the whole frame:"
- "Here is the practical takeaway:"
- "Here is the mistake to avoid:"
- "Here is the pattern underneath it:"
- "Here is what this reveals:"
- "Here is the question worth asking:"
- "Here is the moment that matters:"

### Updated: `app/lib/prompts/index.ts`

- Import `TIKTOK_CLOSING_LINES` alongside `TIKTOK_OPENING_LINES`
- Both `buildPrompt` and `buildAdvancedPrompt`: add `tiktokClosing = pickRandom(TIKTOK_CLOSING_LINES)`
- Replaced `End with "Here's the exact system..."` with `End with "${tiktokClosing}"` in both builders

### Updated: `app/lib/prompts/platforms/youtube.ts`

- Replaced `"Curiosity gap: 'The [Thing] Nobody Talks About'"` in `YOUTUBE_TITLE_FORMULAS`
  with `"Curiosity gap: 'The Hidden [Thing] Behind [Common Outcome]'"`
- Eliminates internal contradiction with `YOUTUBE_TITLE_RULES` rule banning "Nobody Talks About"

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS
  - Openers: 26
  - Creator-domain risk: 0/26 (0%)
  - Near-duplicates: 0
  - YouTube formula/rules contradiction: resolved
  - Test failures: 0
