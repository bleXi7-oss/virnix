# Current Phase — AI Cost and Latency Optimization

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

First real Anthropic generation succeeded in Phase 5. Results:
- provider=anthropic, elapsed=26158ms, ~4944 estimated input tokens
- ~$0.3814 estimated cost, score=70, retries=0, fallback=false
- Output quality strong — Twitter thread strong, pacing strong
- TikTok hook slightly generic

Goal: reduce cost and latency while preserving output quality.

---

## Changes by File

### `app/lib/ai/provider.ts`

**Model** — changed from `claude-opus-4-7` to `claude-sonnet-4-6`
- Why: ~5x cheaper per token, ~2x faster, sufficient quality for creator content generation

**Timeout** — reduced from 45s to 30s
- Why: Sonnet responds faster; 30s still leaves ample room for slow networks

---

### `app/lib/ai/generate.ts`

**maxTokens** — core: 4096 → 2048, advanced: 6144 → 3500
- Why: Actual core output ~900-1200 tokens; previous ceiling wasted headroom and inflated cost estimates

---

### `app/lib/ai/chunker.ts`

**Pricing constants** — INPUT_COST_PER_MILLION: 15 → 3, OUTPUT_COST_PER_MILLION: 75 → 15
- Why: Updated to Sonnet 4.6 pricing; Opus pricing was producing inflated log estimates

---

### `app/lib/prompts/hooks/index.ts`

**TIKTOK_OPENING_LINES** — replaced `"Stop scrolling. This one's different."` with `"Everyone's doing this backwards."`
- Why: Original was ad-language; replacement creates tension and a knowledge gap without sounding like a paid ad

---

### `app/lib/prompts/cleanup/index.ts`

**CLEANUP_RULES** — removed `"Replace vague with specific: 'grew' → 'grew 3x in 90 days'..."`
- Why: Exact duplicate of the rule in `ANTI_GENERIC_RULES` in the system prompt; injecting it twice wastes tokens

---

### `app/lib/prompts/index.ts`

**TikTok section** (both `buildPrompt` and `buildAdvancedPrompt`) — added one line:
- `"Name something specific from this transcript — no claim that could apply to any video."`
- Why: Observed TikTok hooks were occasionally generic; this forces transcript-specific content

**ADVANCED_SYSTEM_PROMPT blog** + `buildAdvancedPrompt` blog section — removed `'In today's world'` from SEO filler list
- Why: Already covered by ANTI_GENERIC_RULES in the system prompt; duplicate wasted tokens

---

## Token / Cost Impact

| Metric | Before | After |
|--------|--------|-------|
| Model | claude-opus-4-7 | claude-sonnet-4-6 |
| Input cost / million | $15 | $3 |
| Output cost / million | $75 | $15 |
| maxTokens (core) | 4096 | 2048 |
| maxTokens (advanced) | 6144 | 3500 |
| Estimated cost (core, ~5k input) | ~$0.38 | ~$0.05 |
| Expected latency | ~26s | ~8–12s |

---

## Validation

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Real AI: ⏳ requires ANTHROPIC_API_KEY in .env.local

---

## Next Recommended Step

Run another real AI generation and compare diagnostics:
1. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` in `.env.local`
2. Keep `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`
3. `npm.cmd run dev`
4. Test same YouTube URL as Phase 5 test
5. Compare: elapsed, estimatedTokens, estimated cost, viralityScore
6. Check TikTok hook for specificity improvement
