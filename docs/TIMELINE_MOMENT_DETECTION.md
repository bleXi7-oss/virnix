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

**Active as of Phase 12.** Timeline moments are:
1. **Detected** on every real AI generation (zero-cost, runs in parallel with transcript fetch)
2. **Returned** in `GenerateResult.timelineMoments`
3. **Shown** in dev debug panel (collapsible "Best Clip Opportunities" section)
4. **Logged** in diagnostics (`moments=N` in `[VIRNIX_AI]` log line)

**NOT yet active:**
- Prompt injection (`formatTimelineMomentsForPrompt` exists but not wired to generation)
- Public UI display (debug panel only)
- Clip export hints to users

---

## Removal Guarantee

If `app/lib/timeline/` is deleted:
- `app/lib/ai/generate.ts` — remove the `detectTimelineMoments` import and the two lines that call it
- `app/lib/ai/transcript.ts` — revert `getTranscriptFull` to `getTranscript` (plain string return)
- `app/lib/types/generation.ts` — remove `timelineMoments?: TimelineMoment[]`
- `app/lib/ai/diagnostics.ts` — remove `timelineMomentsDetected`
- `app/components/DebugPanel.tsx` — remove moments prop and section
- `app/page.tsx` — remove `timelineMoments` state

No other modules are affected.

---

## Known Limitations

1. **Heuristic only.** Signal word matching is fast and deterministic but misses context. A sentence containing "i was wrong" could be mundane. A sentence with zero signals could be a Bartlett-level gold moment. The scorer filters, it doesn't judge.

2. **No calibration against video.** The confidence score is relative within a generation — it does not predict real-world virality. Use it to rank moments within a transcript, not compare across creators.

3. **Window boundaries.** The 30-second window grouping may split a key moment across two windows. The dominant moment usually still scores well; edge cases may miss the peak.

4. **Language English-only.** Signal word lists are English. Non-English transcripts will produce empty or low-quality results.

---

## Future Roadmap

1. **Prompt injection** — connect `formatTimelineMomentsForPrompt()` to `buildPrompt()` when token cost is validated
2. **Public clip guide UI** — show detected moments in the output panel as a "Best moments to clip" section
3. **Gold dataset calibration** — score signal word lists against 50+ manually evaluated moments
4. **Confession arc detection** — multi-window scoring to detect the full "setup → confession → resolution" arc
5. **Video editing integration** — much later, optional, only after text layer is validated
