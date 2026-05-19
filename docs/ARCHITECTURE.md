# Virnix Architecture

Lightweight, creator-first content repurposing engine.
No databases, no queues, no auth — pure request/response pipeline.

---

## Request Flow

```
Browser (page.tsx)
  │
  ├── POST /api/generate  { youtubeUrl }
  │
  └── app/api/generate/route.ts
        │
        ├── isValidYouTubeUrl()
        │
        └── generate(req)  ← app/lib/ai/generate.ts
              │
              ├── isEnabled("real_ai_generation")  → false → getMockResult()
              │
              ├── getTranscript(youtubeUrl)
              │     └── YoutubeTranscript.fetchTranscript()
              │           ↓ error → getMockResult() + fallback diagnostics
              │
              ├── selectBestSegment(transcript, 3000)
              │     └── content-density scoring: questions, signal words, sponsor penalties
              │
              ├── buildPrompt(transcript)  or  buildAdvancedPrompt(transcript)
              │     ├── pickVariation()  → emotional angle + tone + opening + CTA
              │     ├── buildPromptContext(angle)  → story arc, hook formula, retention rule
              │     └── platform-specific tone/format modules
              │
              ├── provider.complete(params)  ← AnthropicProvider
              │     ├── AbortController (45s timeout)
              │     ├── fetch → api.anthropic.com/v1/messages
              │     └── retry on: network err / 429 / 5xx (max 2, backoff 1s → 2s)
              │
              ├── parseAnthropicResponse(text)
              │     ├── extractJSON()  → bracket-counting fast path
              │     ├── extractLargestJsonObject()  → deep-scan fallback
              │     ├── validateCoreOutput()  → type check
              │     ├── coerceCoreOutput()  → always returns valid cards
              │     └── extractAdvancedOutput()  → optional fields
              │
              ├── selectBestOutputs()  [advanced mode only]
              │     └── score tiktok_alt vs tiktok, youtube_alt vs youtube
              │
              ├── estimateViralityScore()
              │
              └── logDiagnostics()  → [VIRNIX_AI] structured log line
```

---

## Key Modules

| Module | Path | Purpose |
|---|---|---|
| Generate | `app/lib/ai/generate.ts` | Orchestrates the full pipeline |
| Provider | `app/lib/ai/provider.ts` | HTTP to Anthropic + retry/timeout |
| Parser | `app/lib/ai/parser.ts` | JSON extraction + schema coercion |
| Schemas | `app/lib/ai/schemas.ts` | TypeScript types + coercers |
| Chunker | `app/lib/ai/chunker.ts` | Token estimation + segment selection |
| Diagnostics | `app/lib/ai/diagnostics.ts` | Structured logging, no side effects |
| Mock | `app/lib/ai/mock.ts` | Hardcoded demo cards (default mode) |
| Prompts | `app/lib/prompts/index.ts` | Prompt assembly from modular pieces |
| Platforms | `app/lib/prompts/platforms/` | Per-platform tone, format, opener rules (5 files) |
| Variation | `app/lib/prompts/variation/` | 6 emotional angles, random picks |
| Intelligence | `app/lib/intelligence/` | Hook mechanics, story arcs, retention |
| Prompt Context | `app/lib/intelligence/prompt-context.ts` | Angle → story arc + hook injection |
| Quality | `app/lib/intelligence/quality.ts` | 0–100 heuristic virality scoring |
| Timeline | `app/lib/timeline/` | Timestamp-aware moment detection (isolated, not active in generation) |
| Flags | `app/lib/flags.ts` | Feature flag system (NEXT_PUBLIC_FLAG_*) |
| Analytics | `app/lib/analytics.ts` | Event tracking stub (no provider yet) |

---

## Feature Flags

All flags default to `false`. Override via env vars (Vercel or `.env.local`).

| Flag | Env Var | Effect |
|---|---|---|
| `real_ai_generation` | `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` | Use Claude API instead of mock cards |
| `advanced_outputs` | `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS` | Generate blog, timestamps, short-form + alt selection |
| `dev_debug` | `NEXT_PUBLIC_FLAG_DEV_DEBUG` | Show diagnostics panel in UI (dev only) |
| `analytics_enabled` | `NEXT_PUBLIC_FLAG_ANALYTICS_ENABLED` | Send analytics events to provider |
| `transcript_preview` | `NEXT_PUBLIC_FLAG_TRANSCRIPT_PREVIEW` | Show fetched transcript before generating |
| `premium_mode` | `NEXT_PUBLIC_FLAG_PREMIUM_MODE` | Gated features for paid users |
| `experimental_hooks` | `NEXT_PUBLIC_FLAG_EXPERIMENTAL_HOOKS` | Test new hook generation strategies |

---

## Resilience Model

```
transcript fetch failed → getMockResult() + fallback diagnostics (UI gets demo cards)
provider timeout (45s)  → retry (up to 2x) → throw → route.ts returns 500 → UI error panel
provider 429 / 5xx      → retry with backoff
provider 4xx auth       → throw immediately (no retry)
malformed JSON          → extractLargestJsonObject() → coerceCoreOutput() → blank cards
missing fields          → coerceCoreOutput() → empty string content (never null crash)
```

---

## AI Diagnostics Log Format

Every real AI request emits one `[VIRNIX_AI]` log line:

```
[VIRNIX_AI] provider=anthropic elapsed=4212ms tokens=~2840 chunks=1
            type=core retries=0 fallback=false repaired=false coerced=false
            stopReason=end_turn score=65
```

Available in: Vercel Functions logs, local terminal (npm.cmd run dev).
Never contains transcript content, API keys, or raw AI output.

---

## Prompt Architecture

```
SYSTEM_PROMPT = IDENTITY_BLOCK + CORE_OUTPUT_SCHEMA
ADVANCED_SYSTEM_PROMPT = IDENTITY_BLOCK + ADVANCED_OUTPUT_SCHEMA + extended guidance

IDENTITY_BLOCK:
  - Creator identity (Virnix is a viral content engine)
  - STORYTELLING_PATTERNS (from prompts/psychology/)
  - ANTI_GENERIC_RULES (from prompts/psychology/)
  - JSON-only output rule (repeated in user prompt for reinforcement)

USER_PROMPT per request:
  - Transcript (≤3000 words, best-density segment)
  - GENERATION PROFILE: emotional angle + tone + opening style + CTA style
  - Story arc hint + hook formula + retention rule (from intelligence/prompt-context.ts)
  - Per-platform requirements: tone, format, length targets
  - "Return only the JSON object, nothing else."
```

---

## Output Schema

Core (always present):
```json
{
  "tiktok":    { "content": "..." },
  "twitter":   { "content": "..." },
  "linkedin":  { "content": "..." },
  "instagram": { "content": "..." },
  "youtube":   { "content": "..." }
}
```

Advanced (when `advanced_outputs=true`, additional fields):
```json
{
  "tiktok_alt":  { "content": "..." },
  "youtube_alt": { "content": "..." },
  "shortform":   { "content": "..." },
  "timestamps":  { "content": "..." },
  "blog":        { "content": "..." }
}
```

`tiktok_alt` and `youtube_alt` are scored vs primary and the winner is used in the UI.
`shortform`, `timestamps`, `blog` are appended as additional output cards.

---

## Folder Structure

```
app/lib/
  ai/                    Core AI pipeline (generate, provider, parser, chunker, diagnostics, mock)
  prompts/
    platforms/           Per-platform modules: tiktok, twitter, linkedin, instagram, youtube
    psychology/          STORYTELLING_PATTERNS, ANTI_GENERIC_RULES
    variation/           6 emotional angle profiles + picker
    cleanup/             CLEANUP_RULES
    index.ts             Prompt assembler
  intelligence/          Hook formulas, retention rules, story arcs, quality scorer, prompt-context
  timeline/              Timestamp-aware moment detection (isolated — not active in generation)
  types/                 Shared TypeScript interfaces
```

---

## What This Architecture Intentionally Excludes

- No database (Supabase planned but not connected)
- No auth middleware
- No payment/billing layer
- No background jobs or queues
- No vector database or embeddings
- No multi-tenant data isolation
- No real-time features (WebSockets, SSE)

These exclusions are intentional. Virnix is optimized for launch speed, simplicity,
and creator-first UX — not enterprise feature completeness.
