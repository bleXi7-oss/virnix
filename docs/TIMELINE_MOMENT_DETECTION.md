# Timeline Moment Detection

## What This Is

Transcript intelligence that identifies the strongest content moments within a timestamped transcript — without any AI calls, video processing, or external dependencies.

Given a transcript with timestamps, Virnix detects:

- Best short-form clip opportunities
- Best hook moments (validation hooks, contrarian insights, confessions)
- Best emotional moments
- Best educational / save-worthy moments
- Best quote moments
- Best Twitter/X thread starting points
- Best LinkedIn post angles

**Example output:**

```
00:42–01:14
Moment type: Validation Hook
Why it works: Removes self-blame before delivering insight — validation hook formula
Best platform: TikTok / Reels / Instagram
Suggested hook: "You're not failing — Your brain isn't resisting change. It's surviving it."
Suggested use: short-form clip opener
Confidence: 80/100
```

---

## What This Is NOT

- Not video editing
- Not clip rendering
- Not ffmpeg or video processing
- Not AI-generated clip suggestions (all deterministic, zero API cost)
- Not automatic posting or scheduling
- Not a replacement for human judgment about what to clip

---

## Why Timestamp Intelligence Matters for Creators

Most creators repurpose content in one of two ways:
1. Manually scrubbing through video to find moments (slow, inconsistent)
2. Using AI to summarize the whole video (loses the specific moments)

Neither approach surfaces the psychologically strongest moments — the validation hooks, the emotional confessions, the story turning points that generate saves and shares.

Virnix's timeline detection finds those moments deterministically by scanning the transcript for known high-signal language patterns. No AI cost, no latency — pure text analysis.

---

## How It Works

### Step 1: Timestamp Detection

`detectTimestampedLines()` scans the transcript for timestamp patterns:
- `00:42` / `1:23` / `01:02:15`
- `[00:42]` / `(00:42)`

If no timestamps are found, the function returns an empty array and **does not affect generation**. Existing generation continues normally.

### Step 2: Segment Grouping

`groupLinesIntoSegments()` converts timestamped lines into segments — each segment spans from one timestamp to the next.

### Step 3: Moment Scoring

`scoreMoment()` applies deterministic heuristics to each segment:

| Moment Type | Signal Words | Platform Fit |
|-------------|-------------|--------------|
| validation_hook | "you're not", "not your fault", "not weakness" | TikTok, Reels, Instagram |
| contrarian_insight | "actually", "most people", "the truth is" | Twitter, LinkedIn, YouTube |
| emotional_confession | "i was wrong", "i failed", "looking back" | TikTok, Reels, YouTube |
| story_turning_point | "that's when", "everything changed", "i realized" | YouTube, TikTok |
| educational_gem | "here's why", "the mechanism", "data shows" | LinkedIn, YouTube, Twitter |
| quote_moment | `"`, "they told me", "i once read" | Instagram, Twitter |
| fomo_loss_frame | "you're already behind", "every day you", "compound" | TikTok, Twitter |
| authority_proof | "after working with", "over the years", "i've seen" | LinkedIn, YouTube |
| transformation_moment | "changed everything", "rebuilt myself", "never the same" | YouTube, TikTok |

Specificity bonus (+15) for concrete data: `$123`, `47%`, `3x`, `30 days`.

### Step 4: Selection

Top 8 moments by confidence score are returned. Moments below score 10 are filtered out.

---

## Module Location

```
app/lib/timeline/
  types.ts                  TimelineMoment, MomentType, PlatformFit
  transcript-timestamps.ts  parseTimestamp, formatTimestamp, detectTimestampedLines, groupLinesIntoSegments
  moment-scoring.ts         scoreMoment, MomentScore
  moment-detector.ts        detectTimelineMoments (main entry point)
  formatter.ts              formatTimelineMomentsForPrompt, formatMomentReport
  index.ts                  public API barrel
```

---

## Current Integration Status

**Timeline detection is NOT injected into generation prompts by default.**

`formatter.ts` provides `formatTimelineMomentsForPrompt()` which formats moments into a compact block:

```
POTENTIAL CLIP MOMENTS:
- 00:42–01:14: validation hook, identity relief + curiosity, tiktok/reels fit
- 12:03–12:31: contrarian insight, cognitive dissonance, twitter/linkedin fit
```

This block can be injected into `buildPrompt()` / `buildAdvancedPrompt()` in a future phase when:
- The token cost is acceptable (~60 tokens for 5 moments)
- The segment scoring is validated against real transcripts
- The quality improvement is confirmed

Until then, the module is live code but not connected to generation.

---

## Removal Guarantee

If timeline detection is removed entirely (delete `app/lib/timeline/`), **zero other modules are affected**:

- `app/lib/ai/generate.ts` — not affected
- `app/lib/prompts/` — not affected
- `app/lib/intelligence/` — not affected
- `app/components/` — not affected
- `app/api/generate/` — not affected

No other file imports from `app/lib/timeline/`. It is a pure addition.

---

## Known Limitations

1. **Requires timestamps in the transcript.** YouTube transcripts fetched via `youtube-transcript` do NOT include timestamps in the text — they are in separate metadata fields. This means timeline detection returns `[]` for most Virnix inputs today. Future work: use the segment metadata to reconstruct the timestamped transcript.

2. **Single-line segments.** Currently, each timestamped line is treated as a single segment. Multi-line segments (where one timestamp covers several lines of dialogue) require pre-aggregation that is not yet implemented.

3. **Heuristic scoring.** Signal word matching is fast and deterministic but misses context. A sentence containing "i was wrong" could be mundane; a sentence without any signals could be exceptional. The scorer is a filter, not a judge.

4. **No validation against real outputs.** The signal word lists and weights are derived from the creator psychology research (Notion analysis), not from scored real transcripts. Calibration against the gold dataset will improve accuracy.

---

## Future Roadmap

1. **Timestamp injection from YouTube metadata** — reconstruct timestamped transcript from `youtube-transcript` segment objects (timestamps are in the API response, just not in the joined text)
2. **Multi-line segment aggregation** — group lines between timestamps into richer text blocks for better scoring
3. **Clip script suggestions** — given a detected moment, generate a short-form script for that specific timestamp range
4. **Manual clip export hint** — surface `startTime–endTime` in the UI so creators know exactly which part to clip
5. **Gold dataset calibration** — score signal word lists against 50+ evaluated moments to improve detection accuracy
6. **UI integration** — display detected moments in the output panel as an optional "clip guide" section
7. **Video editing integration** — much later, optional, only after the text layer is validated
