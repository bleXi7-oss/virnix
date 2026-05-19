# Timeline Moment Detection

## What This Is

Transcript intelligence that identifies the strongest content moments in a YouTube transcript — without any AI calls, video processing, or external dependencies.

Given a YouTube URL, Virnix now:
1. Fetches the transcript with raw timestamp metadata (offset in ms/s)
2. Reconstructs a timestamped transcript string (`"00:42 text here"`)
3. Groups segments into 30-second scoring windows
4. Scores each window for psychological moment type
5. Returns the top 8 moments, ranked by confidence

**Example output (in dev debug panel):**

```
00:42–01:14  ▸ Mechanism Reframe  [85/100]
  You can't just erase a fear. You have to extinguish it — then replace it.
  Why: Reframes a concept the reader thinks they understand
  Suggested hook: "This isn't what you think. You can't just erase a fear."
  Best for: TikTok / Twitter / LinkedIn

12:03–12:44  ▸ Contrarian Insight  [60/100]
  Most people think consistency is discipline...
```

---

## What This Is NOT

- Not video editing
- Not clip rendering
- Not ffmpeg or video processing
- Not AI-generated suggestions (all deterministic, zero extra API cost)
- Not automatic posting or scheduling

---

## Architecture

### Full Pipeline

```
YouTube URL
  → getTranscriptFull()
      ├── YoutubeTranscript.fetchTranscript()  [raw segments with offset/duration]
      ├── cleanText(segments.map(s => s.text).join(' '))  → transcript (for AI)
      └── buildTimestampedTranscript(segments)            → timestampedTranscript

  → detectTimelineMoments(timestampedTranscript)
      ├── detectTimestampedLines()    [parse "MM:SS text" lines]
      ├── groupLinesIntoSegments()    [pair each timestamp with next]
      ├── groupIntoWindows(30s)       [merge 3s segments → 30s windows]
      ├── scoreMoment(window.text)    [heuristic scoring per window]
      └── top 8 by confidence score

  → GenerateResult { cards, diagnostics, timelineMoments }
```

### Module Location

```
app/lib/timeline/
  types.ts                       TimelineMoment, MomentType, PlatformFit
  build-timestamped-transcript.ts  buildTimestampedTranscript(RawSegment[])
  transcript-timestamps.ts       detectTimestampedLines, groupLinesIntoSegments
  moment-scoring.ts              scoreMoment, MomentScore
  moment-detector.ts             detectTimelineMoments (main entry point)
  formatter.ts                   formatTimelineMomentsForPrompt, formatMomentReport, formatMomentsReport
  index.ts                       public API barrel
```

### Key Design Decisions

**`buildTimestampedTranscript`** — handles both youtube-transcript output formats:
- `srv3` (InnerTube API, primary): `offset` in milliseconds (integers)
- `classic XML` (fallback): `offset` in seconds (floats with decimal parts)
- Auto-detection: checks for float decimals first, then average duration magnitude

**30-second window grouping** — YouTube API returns segments every 2–3 seconds. Scoring 3-second slices produces noise. Grouping into 30-second windows gives the scorer full thoughts and sentences to analyze, dramatically improving detection quality.

**Never throws** — `detectTimelineMoments` wraps all work in `try/catch` and returns `[]` on any failure. The existing generation pipeline is unaffected if timeline detection fails.

---

## Moment Types (10 types)

| Type | Signal | Platform Fit | Gold Dataset Source |
|------|--------|-------------|---------------------|
| `mechanism_reframe` | "it's not", "actually", "not about", "what you think is" | TikTok, Twitter, LinkedIn | #1 viral pattern (Naval, Huberman, Peterson) |
| `validation_hook` | "you're not", "not your fault", "you're not lazy" | TikTok, Reels, Instagram | Validation hook formula |
| `contrarian_insight` | "backwards", "the truth is", "stop doing" | Twitter, LinkedIn, YouTube | Pattern interrupt |
| `emotional_confession` | "i was wrong", "i failed", "i spent years" | TikTok, Reels, YouTube | Vulnerability + trust |
| `story_turning_point` | "that's when", "everything changed", "i realized" | YouTube, TikTok | Narrative arc |
| `educational_gem` | "the mechanism", "40 years", "research shows" | LinkedIn, YouTube | Save-worthy insight |
| `quote_moment` | `"`, "they told me", "i once read" | Instagram, Twitter | Borrowed authority |
| `fomo_loss_frame` | "if you don't", "you're already behind", "compound" | TikTok, Twitter | Loss aversion |
| `authority_proof` | "after working with", "i've seen", "hundreds of" | LinkedIn, YouTube | Social proof |
| `transformation_moment` | "changed everything", "rebuilt myself", "never the same" | YouTube, TikTok | Identity aspiration |

### Scoring Improvements (Phase 12)

Added from gold dataset findings:
- **Mechanism reframe signals** (16 pts each) — "not about", "actually", "not just", "what you think is"
- **Specificity bonus** (+20) — "70 sales meetings", "$2,000/month", "40 years of research"
- **Motivation penalty** (−15) — "hustle", "grind", "work harder", "believe in yourself" (Gary Vee pattern)
- Increased validation weight (22 pts vs previous 20)
- Increased confession weight (18 pts vs previous 15)

---

## Integration Status

**Fully active as of Phase 14.** Timeline moments are:
1. **Detected** on every real AI generation (zero-cost, runs after transcript fetch)
2. **Injected** into the generation prompt as lightweight creative anchors (Phase 14)
3. **Returned** in `GenerateResult.timelineMoments`
4. **Shown** to users in the "Best moments to clip" section above output cards (Phase 13)
5. **Logged** in diagnostics (`moments=N`, `timelineInjected=true(N)` in `[VIRNIX_AI]` log line)

**NOT yet active:**
- Clip export hints to users
- Confession arc detection (multi-window)
- Gold dataset calibration of signal word lists

---

## Prompt Grounding Flow (Phase 14)

This is **not RAG**. It is lightweight creative scaffolding.

```
detectTimelineMoments(timestampedTranscript)
  → selectMomentsForPrompt()       [filter to ≤3 high-priority types, min confidence 25]
  → formatTimelineMomentsForPrompt() [compact block ~80 tokens]
  → buildPrompt(transcript, timelineContext)
      → injected after GENERATION PROFILE block
      → absent if no moments qualified
```

### Why this is not RAG

RAG retrieves relevant chunks from a vector store and injects them as primary context. This is different:

- **No retrieval** — moments come from the same transcript already in the prompt
- **No vector store** — purely deterministic heuristic scoring
- **Not primary context** — moments appear as a small "creative anchors" block, after the core generation profile
- **Zero new API calls** — all detection happens before the prompt is built
- **Fallback = no change** — if no moments qualify, prompt is byte-for-byte identical to before

### What gets injected

Up to 3 moments, formatted as:

```
TRANSCRIPT HIGHLIGHTS — draw from these moments as creative anchors, don't copy verbatim:
- "You're not failing — Your identity is fighting back against change." [validation hook · TikTok/Reels]
- "This isn't what you think. Most people believe discipline is the answer." [mechanism reframe · Twitter/LinkedIn]
- "I used to believe I was just lazy." [confession · TikTok/Reels]
```

### Token cost

~80 tokens (3 moments × ~25 tokens each + header). On a typical 5000-token call, that's a ~1.6% increase. Within measurement noise.

### Priority filtering (`selectMomentsForPrompt`)

High-priority types (qualify at confidence ≥25):
`validation_hook`, `mechanism_reframe`, `emotional_confession`, `contrarian_insight`, `transformation_moment`, `story_turning_point`, `fomo_loss_frame`

Low-priority types (only qualify at confidence ≥40, fallback only):
`educational_gem`, `authority_proof`, `quote_moment`

### Known tradeoffs

- Repetition risk: if moments are injected as "don't copy verbatim" and the model echoes them anyway, reduce injection or add stronger diversity instruction
- Overfitting: if all outputs start referencing the same timestamp, lower confidence threshold or reduce to 2 moments
- Diversity: moment types should vary — 3 × mechanism_reframe anchors would narrow the output

Diagnostics (`timelineInjected`, `injectedMomentCount`) allow monitoring these tradeoffs across real generations.

---

## Removal Guarantee

If `app/lib/timeline/` is deleted:
- `app/lib/ai/generate.ts` — remove the 3 timeline imports and 4 lines (detect, format, select, timelineInjected)
- `app/lib/ai/transcript.ts` — revert `getTranscriptFull` to `getTranscript` (plain string return)
- `app/lib/types/generation.ts` — remove `timelineMoments?: TimelineMoment[]`
- `app/lib/ai/diagnostics.ts` — remove 4 fields: `timelineMomentsDetected`, `timelineInjected`, `injectedMomentCount` + log line
- `app/lib/prompts/index.ts` — remove `timelineContext` params from both builders (revert to `string` only)
- `app/components/DebugPanel.tsx` — remove `timelineMoments` prop, clip section, and grounded row
- `app/components/generation/ClipGuide.tsx` + `ClipMomentCard.tsx` — delete
- `app/page.tsx` — remove `ClipGuide` import, render, and `timelineMoments` state

No other modules are affected. Core generation, providers, schemas, parser — all unchanged.

---

## Known Limitations

1. **Heuristic only.** Signal word matching is fast and deterministic but misses context. A sentence containing "i was wrong" could be mundane. A sentence with zero signals could be a Bartlett-level gold moment. The scorer filters, it doesn't judge.

2. **No calibration against video.** The confidence score is relative within a generation — it does not predict real-world virality. Use it to rank moments within a transcript, not compare across creators.

3. **Window boundaries.** The 30-second window grouping may split a key moment across two windows. The dominant moment usually still scores well; edge cases may miss the peak.

4. **Language English-only.** Signal word lists are English. Non-English transcripts will produce empty or low-quality results.

---

## Future Roadmap

1. **Gold dataset calibration** — score signal word lists against 50+ manually evaluated moments; adjust weights
2. **Repetition monitoring** — track whether prompt injection increases output similarity across runs
3. **Confession arc detection** — multi-window scoring to detect the full "setup → confession → resolution" arc
4. **Clip export hints** — "Start at 02:14" shown next to detected moments in the creator UI
5. **Video editing integration** — much later, optional, only after text layer is validated
