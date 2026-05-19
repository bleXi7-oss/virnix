# Current Phase — Real AI Execution Hardening

Phase started: 2026-05-19
Status: complete and pushed

---

## What Was Done in This Phase

### 1. AI Request Diagnostics (`app/lib/ai/diagnostics.ts`)
- New `AIDiagnostics` interface: provider, elapsedMs, estimatedTokens, chunkCount,
  outputType, stopReason, retryCount, fallbackUsed, parseRepaired, coercionUsed, viralityScore
- `logDiagnostics()` emits a single structured `[VIRNIX_AI] key=value ...` log line
- No secrets, no transcript content, no raw AI response in logs

### 2. Retry + Timeout Resilience (`app/lib/ai/provider.ts`)
- `AbortController` timeout at 45 seconds
- Exponential backoff retry: max 2 retries, delays 1s → 2s
- Retries on: network errors (`TypeError`), 429, 5xx, timeout (`AbortError`)
- Does NOT retry: 4xx auth/validation errors — fail immediately
- `CompletionResult` return type carries `retryCount` and `stopReason` for diagnostics

### 3. Improved JSON Extraction (`app/lib/ai/parser.ts`)
- Fast path: `extractJSON()` uses bracket counting (not `lastIndexOf`) — more reliable
- Deep-scan fallback: `extractLargestJsonObject()` finds all `{...}` blocks, tries largest first
- `ParseOutcome` return type: `{ result, parseRepaired, coercionUsed }` for diagnostics
- All fallbacks still produce valid UI-safe cards — never throws

### 4. Quality Scoring (`app/lib/intelligence/quality.ts`)
- `hasStrongHook()` — hook opener + number + contrast signal in first 200 chars
- `hasCuriosityGap()` — curiosity gap phrases present
- `hasPlatformLanguage()` — platform-native vocabulary per platform key
- `hasEmotionalWords()` — 2+ emotional trigger words
- `estimateViralityScore()` — 0–100 composite heuristic score

### 5. Best-Output Selection (`app/lib/ai/generate.ts`)
- Advanced mode asks for `tiktok_alt` and `youtube_alt` in the JSON response
- Both candidates scored with `estimateViralityScore`
- Higher-scoring hook and title set is used in the final card output
- One API call — token increase is ~300–500 output tokens only

### 6. Developer Debug Panel (`app/components/DebugPanel.tsx`)
- Collapsible `<details>` panel below output cards
- Visible only when `NEXT_PUBLIC_FLAG_DEV_DEBUG=true` (baked at build time)
- Shows: provider, elapsed, tokens, chunks, type, retries, fallback, repaired, coerced, score
- No sensitive info, no raw AI output

### 7. Smart Transcript Segment Selection (`app/lib/ai/chunker.ts`)
- `selectBestSegment()` now scores non-overlapping 500-word segments
- Prefers: questions, content signal words, specific numbers
- Penalizes: welcome/subscribe filler, sponsor markers, dead air
- Returns highest-scoring contiguous block up to maxWords

### 8. Local Smoke Test (`scripts/test-real-ai.ts`)
- Tests parsing, quality scoring, and chunking against hardcoded sample data
- Zero API calls, zero cost — safe to run at any time
- Run with: `npx.cmd tsx scripts/test-real-ai.ts` (requires `npm.cmd install --save-dev tsx`)

### 9. Feature Flags
- New `dev_debug` flag added to `flags.ts`
- Env var: `NEXT_PUBLIC_FLAG_DEV_DEBUG=true`

### 10. Type Updates
- `GenerateResult` now carries optional `diagnostics?: AIDiagnostics`
- `CompletionResult` replaces bare `string` return from `AIProvider.complete()`
- `ParseOutcome` replaces bare `GenerateResult` return from `parseAnthropicResponse()`

---

## Next Recommended Phase

**Real AI First Run + Output Iteration**
1. Add `ANTHROPIC_API_KEY` to Vercel (or `.env.local` locally)
2. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true`
3. Set `NEXT_PUBLIC_FLAG_DEV_DEBUG=true` to see diagnostics panel
4. Run a 3–5 min YouTube video
5. Check logs: token count, cost estimate, stop_reason, virality score
6. Review output card quality: hooks, titles, threads
7. Iterate on prompt content if hooks are weak (< 40 virality score)
8. Enable `advanced_outputs` and test blog/timestamps/short-form
9. Review alt hook selection in logs (`tiktok_alt selected` or `youtube_alt selected`)
