// Detects the strongest content moments in a timestamped transcript.
//
// Pipeline:
//   1. detectTimestampedLines()   — find all lines with timestamps
//   2. groupLinesIntoSegments()   — pair each timestamp with the next
//   3. groupIntoWindows()         — merge 3s segments into 30s scoring windows
//   4. scoreMoment()              — heuristic score per window
//   5. top MAX_MOMENTS returned, sorted by confidence
//
// Deterministic heuristic — no AI calls, no ML, no external dependencies.
// Never throws — returns [] on any failure or missing timestamps.

import type { TimelineMoment } from "./types";
import {
  detectTimestampedLines,
  groupLinesIntoSegments,
  formatTimestamp,
  type TranscriptSegment,
} from "./transcript-timestamps";
import { scoreMoment } from "./moment-scoring";
import {
  cleanWindowText,
  collapseRepeatedFragments,
  isLowSemanticContent,
  findFirstMeaningfulSentence,
} from "./moment-text-cleaner";

const MAX_MOMENTS = 8;
const MIN_SCORE_THRESHOLD = 10;
const WINDOW_SECONDS = 30;

export function detectTimelineMoments(transcript: string): TimelineMoment[] {
  try {
    const lines = detectTimestampedLines(transcript);
    if (lines.length === 0) return [];

    const segments = groupLinesIntoSegments(lines);
    if (segments.length === 0) return [];

    const windows = groupIntoWindows(segments, WINDOW_SECONDS);

    const moments: TimelineMoment[] = windows
      // Pre-filter: reject pure noise / reaction windows before scoring.
      // isLowSemanticContent cleans and deduplicates internally.
      .filter((win) => !isLowSemanticContent(win.text))
      .map((win, i) => {
        // Clean once: remove invisible chars + collapse duplicate subtitle fragments.
        // Used for scoring (prevents duplicate signal inflation) and display.
        const cleanText = collapseRepeatedFragments(cleanWindowText(win.text));
        const scored = scoreMoment(cleanText);
        return {
          id: `moment-${i}`,
          startTime: win.startTime,
          endTime: win.endTime,
          title: MOMENT_TITLES[scored.momentType] ?? "Strong Moment",
          momentType: scored.momentType,
          platformFit: scored.platformFit,
          suggestedHook: buildSuggestedHook(cleanText, scored.momentType),
          whyItWorks: scored.reason,
          emotionalTrigger: scored.emotionalTrigger,
          contentUse: CONTENT_USES[scored.momentType] ?? "repurposable content moment",
          confidenceScore: scored.score,
          sourceTextPreview: cleanText.slice(0, 120),
        } satisfies TimelineMoment;
      })
      .filter((m) => m.confidenceScore >= MIN_SCORE_THRESHOLD);

    moments.sort((a, b) => b.confidenceScore - a.confidenceScore);
    return moments.slice(0, MAX_MOMENTS);

  } catch {
    return [];
  }
}

// Merges consecutive segments into fixed-duration windows.
// YouTube API returns segments every 2–3 seconds. Scoring individual lines
// misses context; 30-second windows contain full thoughts and score better.
function groupIntoWindows(
  segments: TranscriptSegment[],
  windowDuration: number
): TranscriptSegment[] {
  if (segments.length === 0) return [];

  const windows: TranscriptSegment[] = [];
  let windowStart = segments[0];
  const windowTexts: string[] = [segments[0].text];

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const elapsed = seg.startSeconds - windowStart.startSeconds;

    if (elapsed >= windowDuration) {
      windows.push({
        startTime: windowStart.startTime,
        endTime: seg.startTime,
        startSeconds: windowStart.startSeconds,
        endSeconds: seg.startSeconds,
        text: windowTexts.join(" "),
      });
      windowStart = seg;
      windowTexts.length = 0;
      windowTexts.push(seg.text);
    } else {
      windowTexts.push(seg.text);
    }
  }

  if (windowTexts.length > 0) {
    const last = segments[segments.length - 1];
    windows.push({
      startTime: windowStart.startTime,
      endTime: last.endTime || formatTimestamp(last.startSeconds + windowDuration),
      startSeconds: windowStart.startSeconds,
      endSeconds: last.endSeconds || last.startSeconds + windowDuration,
      text: windowTexts.join(" "),
    });
  }

  return windows;
}

function buildSuggestedHook(text: string, type: string): string {
  // Find first sentence with >= 4 meaningful words to skip reaction noise
  // (e.g. "NOOooo… Close!" before a real content sentence).
  const firstSentence = findFirstMeaningfulSentence(text, 4);
  const prefixes: Record<string, string> = {
    validation_hook:       "You're not failing — ",
    mechanism_reframe:     "This isn't what you think. ",
    contrarian_insight:    "Everyone gets this wrong. ",
    emotional_confession:  "I used to believe ",
    story_turning_point:   "That's when everything changed: ",
    educational_gem:       "Here's why: ",
    quote_moment:          '"',
    fomo_loss_frame:       "Most people are already behind on this. ",
    authority_proof:       "After working with hundreds of creators: ",
    transformation_moment: "Before this moment, I was ",
  };
  const prefix = prefixes[type] ?? "";
  return `${prefix}${firstSentence}`;
}

const MOMENT_TITLES: Record<string, string> = {
  validation_hook:       "Validation Hook",
  mechanism_reframe:     "Mechanism Reframe",
  contrarian_insight:    "Contrarian Insight",
  emotional_confession:  "Emotional Confession",
  story_turning_point:   "Story Turning Point",
  educational_gem:       "Educational Gem",
  quote_moment:          "Quotable Moment",
  fomo_loss_frame:       "FOMO / Loss Frame",
  authority_proof:       "Authority Proof",
  transformation_moment: "Transformation Moment",
};

const CONTENT_USES: Record<string, string> = {
  validation_hook:       "short-form clip opener",
  mechanism_reframe:     "TikTok / Reels opener · Twitter thread starter",
  contrarian_insight:    "Twitter thread starter / LinkedIn hook",
  emotional_confession:  "TikTok / Reels opener",
  story_turning_point:   "YouTube long-form anchor moment",
  educational_gem:       "LinkedIn post / blog key insight",
  quote_moment:          "Instagram quote card / Twitter pull quote",
  fomo_loss_frame:       "TikTok / Reels urgency hook",
  authority_proof:       "LinkedIn credibility post",
  transformation_moment: "YouTube thumbnail moment / TikTok arc",
};
