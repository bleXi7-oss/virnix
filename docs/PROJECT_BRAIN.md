# Project Brain — Virnix

> Read this file first. It consolidates all product, technical, and design context.
> Future prompts should start: "Read docs/PROJECT_BRAIN.md first."

---

## What Virnix Is

Virnix is a **creator intelligence platform** — not an AI wrapper.

It extracts psychological signal from video transcripts, identifies the strongest clipable moments, and generates platform-native content for every major creator channel. The intelligence layer is the core product. The generated output is downstream of it.

**Core positioning**: "Turn 1 podcast into 30 viral posts in 60 seconds."

**What this means technically**: Paste a YouTube URL → transcript → psychological moment detection → grounded content generation → platform-native output cards.

---

## What Virnix Is NOT

- An AI chatbot frontend
- A generic AI wrapper (nothing generic about the signal extraction)
- A social scheduler
- An editing suite
- An analytics dashboard
- An enterprise SaaS platform
- A virality predictor (we detect psychological density, not viral probability)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS v4 |
| AI | Anthropic Claude Sonnet 4.6 (via API) |
| Fonts | Geist Sans + Geist Mono (Google Fonts) |
| Theme | Dark/light toggle, stored in localStorage, class-based |
| Analytics | Lightweight internal event tracking (`app/lib/analytics.ts`) |
| Deployment | Vercel (planned) |
| Database | Supabase (planned, not yet wired) |
| Payments | Stripe (planned) |

---

## Architecture

```
YouTube URL
  → /api/generate (route.ts)
      → fetchTranscript (youtube.ts)
      → buildTimestampedTranscript (timeline/build-timestamped-transcript.ts)
      → detectTimelineMoments (timeline/moment-detector.ts)
      → evaluateTranscriptQuality (timeline/transcript-quality.ts)
      → buildPromptContext (intelligence/prompt-context.ts)
      → selectMomentsForPrompt + formatTimelineMomentsForPrompt (timeline/formatter.ts)
      → generate (ai/generate.ts)
          → Claude API (provider.ts)
          → parse + coerce (parser.ts)
      → GenerateResult { cards, timelineMoments, transcriptQuality, diagnostics }
  → page.tsx state → component render
```

### Module Map

```
app/
  page.tsx                          ← main UI, all state, render logic
  layout.tsx                        ← font setup, metadata, theme flash prevention
  globals.css                       ← Tailwind v4 import, animations, dark vars
  api/generate/route.ts             ← POST endpoint
  components/
    OutputCard.tsx                  ← individual generated content card
    DebugPanel.tsx                  ← dev-only AI diagnostics (FLAG: dev_debug)
    ThemeToggle.tsx                 ← dark/light switch
    ErrorBoundary.tsx               ← output panel safety net
    CopyButton.tsx                  ← clipboard copy with feedback
    generation/
      ClipGuide.tsx                 ← top 3 moments section wrapper
      ClipMomentCard.tsx            ← individual moment: hook, why, platforms
      TranscriptQualityCard.tsx     ← content intelligence report card
  lib/
    ai/
      generate.ts                   ← real + mock generation entry point
      provider.ts                   ← Claude API client
      transcript.ts                 ← transcript fetching
      parser.ts                     ← JSON output parsing + repair
      mock.ts                       ← mock output for dev
      diagnostics.ts                ← AIDiagnostics type + logDiagnostics()
      schemas.ts                    ← Zod output schema
      chunker.ts                    ← transcript chunking
    timeline/
      types.ts                      ← TimelineMoment, MomentType, PlatformFit
      moment-detector.ts            ← detectTimelineMoments()
      moment-scoring.ts             ← per-type signal word scoring
      transcript-timestamps.ts      ← timestamp parsing
      build-timestamped-transcript.ts ← maps words to time positions
      formatter.ts                  ← selectMomentsForPrompt, formatTimelineMomentsForPrompt
      transcript-quality.ts         ← evaluateTranscriptQuality() → TranscriptQualityReport
      index.ts                      ← public API exports
    intelligence/
      hooks.ts                      ← psychological hook patterns
      retention.ts                  ← retention signal detection
      storytelling.ts               ← narrative arc patterns
      quality.ts                    ← output quality scoring
      prompt-context.ts             ← buildPromptContext()
      index.ts                      ← exports
    prompts/
      index.ts                      ← buildPrompt() entry
      platforms/
        tiktok.ts                   ← TikTok hook scripts
        twitter.ts                  ← X/Twitter threads
        linkedin.ts                 ← LinkedIn posts
        instagram.ts                ← Instagram captions
        youtube.ts                  ← YouTube timestamps + titles
      psychology/index.ts           ← psychological principles injected into prompts
      cleanup/index.ts              ← output cleanup rules
      variation/index.ts            ← style variation system
    types/generation.ts             ← GenerateResult, GenerateResponse interfaces
    outputCards.ts                  ← OutputCardData type, LOADING_STEPS, mock OUTPUT_CARDS
    youtube.ts                      ← URL validation + video ID extraction
    flags.ts                        ← feature flags (isEnabled)
    analytics.ts                    ← event tracking
```

---

## Intelligence Layer

### Timeline Moment Detection

`detectTimelineMoments(timestampedTranscript)` scans the transcript using per-type signal word lists. Returns `TimelineMoment[]` ranked by confidence.

**Moment types + psychological weights:**
| Type | Weight | Psychology |
|------|--------|------------|
| validation_hook | 20 | Identity relief → highest short-form resonance |
| emotional_confession | 18 | Vulnerability builds trust faster than credentials |
| mechanism_reframe | 16 | Paradigm-shift openers drive saves/shares |
| transformation_moment | 15 | Identity-level aspiration |
| story_turning_point | 14 | Narrative tension drives completion |
| contrarian_insight | 12 | Pattern interrupt |
| fomo_loss_frame | 12 | Loss aversion 2× gain framing |
| educational_gem | 8 | Save-worthy, limited emotional punch |
| authority_proof | 8 | Credibility without emotional engagement |
| quote_moment | 6 | Borrowed authority |

### Transcript Quality Evaluation

`evaluateTranscriptQuality(moments)` → `TranscriptQualityReport | null`

Pure downstream of detected moments. Zero new API calls. Returns null if no moments → no UI rendered.

**Score formula:** top-5 moments × (TYPE_WEIGHT × confidence/100) × SCORE_SCALE(2.0), clamped to 100.

**Clipability buckets:** High ≥ 58 · Medium ≥ 30 · Low < 30

Calibrated against Phase 15 gold dataset (12 creators). **Never describe as virality prediction.**

### Prompt Grounding

`selectMomentsForPrompt` picks top 3 moments by score. `formatTimelineMomentsForPrompt` serializes them into the prompt context. Grounding benefit is highest for mid-tier transcripts (30–55 score range).

---

## Design System

### Visual Identity

**Brand aesthetic:** Black chrome · liquid metallic surfaces · cinematic depth · restrained glow · premium minimalism

**Assets:** `public/logo.png` (V logo, black circle + white glow) · `public/banner.png` (chrome wave banner)

### Dark Mode (Primary)
- Background: `#000000` pure black
- Cards: `#0a0a0a`
- Primary text: `#ededed`
- Secondary: `zinc-400` (#a1a1aa)
- Tertiary: `zinc-600` (#52525b)
- Borders: `zinc-800/60` to `zinc-700`
- Card shadows: deep 80–90% black
- Glow: `rgba(255,255,255,0.04–0.10)` inset top edge on cards

### Light Mode
- Background: `#ffffff` pure white
- Cards: `#ffffff` with `zinc-200` borders
- Primary text: `zinc-900`
- Secondary: `zinc-600`
- Shadows: subtle zinc

### Typography
- Font: Geist Sans (variable, `-font-sans`)
- Mono: Geist Mono (`--font-mono`)
- Headline hierarchy: `text-[2.5rem]` → `md:text-[3.6rem]`, tight tracking `[-0.03em]`, bold
- Section labels: `text-[10px] uppercase tracking-[0.25em] text-zinc-400`
- Card body: `text-[13px] leading-relaxed`
- Meta labels: `text-[11px] font-mono`

### UI Philosophy
- Typography dominates — images and glows are atmospheric, not focal
- Cinematic spacing — generous padding, breathing room, no cramped grids
- Editorial hierarchy — each section feels discovered, not listed
- Restrained color — monochromatic premium, not rainbow SaaS
- No border spam — borders only where they add depth
- No badge overload — one status indicator max per section

### Anti-Patterns (Never Do)
- Nested card-inside-card-inside-card
- Multiple colorful badges in one row
- Dashboard grid for intelligence findings
- Fake AI scoring numbers shown to creators
- "AI-generated" or "Powered by AI" labels in prominent positions
- Star ratings or percentage confidence shown to creators
- Generic SaaS gradients (purple-to-pink, blue-to-green)
- Enterprise navigation sidebars

---

## Feature Flags

`NEXT_PUBLIC_FLAG_DEV_DEBUG=true` → enables DebugPanel  
`NEXT_PUBLIC_FLAG_MOCK_AI=true` → uses mock output instead of real Claude API

---

## Git Workflow

- Branch: `main` (single branch, push direct)
- Windows: Always use `npm.cmd` not `npm`
- Before committing: `npm.cmd run lint` must pass
- Before pushing: `npm.cmd run build` must pass
- Never commit `.env.local`
- `.gitignore` protects env files

---

## Security Rules (Non-Negotiable)

- NEVER commit `.env.local`
- NEVER log API keys
- NEVER log transcript contents
- NEVER expose secrets to client code
- NEVER log full AI responses
- Log only safe metadata (token counts, elapsed ms, moment counts, scores)

---

## Known Weaknesses / Technical Debt

1. **Opener repetition**: ✅ Fixed in Phase 17. `TIKTOK_OPENING_LINES` expanded from 10 → 26 entries across 8 archetypes. "Everyone's doing this backwards." exposure drops from ~42% to ~3.8%.
2. **Non-English transcripts**: Signal detection is English-only. Non-English → scores Low.
3. **Contracted forms**: "isn't" ≠ "is not" in signal matching. Heuristic limitation.
4. **Short transcripts**: < 3 moments → conservative quality scores.
5. **No auth**: Not yet wired. Any user can generate.
6. **No rate limiting**: No credits system yet.

---

## Phase History (abbreviated)

| Phase | Summary |
|-------|---------|
| 1–10 | MVP foundation, prompts, output cards, mock system |
| 11–13 | Intelligence layer: hooks, retention, storytelling, quality signals |
| 14 | Timeline moment detection + ClipGuide UI |
| 15 | Timeline grounding: inject detected moments into prompts |
| 16 | Transcript quality evaluation: clipability classification + UI card |

Current phase: **17 — TikTok opener quality patch, complete and pushed**

---

## Render Order (phase === "done")

```
TranscriptQualityCard   ← psychological density assessment
ClipGuide               ← top 3 detected moments with hooks
OutputPanel             ← generated content cards (grid)
DebugPanel              ← dev-only diagnostics
```

---

## What Virnix Can Honestly Claim

✅ "Find out which parts of your content have psychologically strong moments"  
✅ "Detect psychological content density before you generate"  
✅ "Understand where the emotional value is hiding in your transcript"  
✅ "Get platform-native content grounded in the strongest moments"  

❌ "Predict virality" — explicitly avoid  
❌ "Compare your content against other creators" — score is relative within one transcript  
❌ "AI guarantees engagement" — never say this  
