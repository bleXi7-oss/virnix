// Detects the strongest content moments in a timestamped transcript.
//
// Deterministic heuristic — no AI calls, no ML, no external dependencies.
// Returns top moments sorted by confidence score.
// Never throws — returns [] on any failure or missing timestamps.

import type { TimelineMoment } from "./types";
import {
  detectTimestampedLines,
  groupLinesIntoSegments,
  formatTimestamp,
} from "./transcript-timestamps";
import { scoreMoment } from "./moment-scoring";

const MAX_MOMENTS = 8;
const MIN_SCORE_THRESHOLD = 10;

export function detectTimelineMoments(transcript: string): TimelineMoment[] {
  try {
    const lines = detectTimestampedLines(transcript);
    // No timestamps found — return empty, don't break existing generation
    if (lines.length === 0) return [];

    const segments = groupLinesIntoSegments(lines);
    if (segments.length === 0) return [];

    const moments: TimelineMoment[] = segments
      .map((seg, i) => {
        const scored = scoreMoment(seg.text);
        // Estimate 30s window for the last segment (no next timestamp)
        const endTime = seg.endTime || formatTimestamp(seg.startSeconds + 30);

        return {
          id: `moment-${i}`,
          startTime: seg.startTime,
          endTime,
          title: MOMENT_TITLES[scored.momentType] ?? "Strong Moment",
          momentType: scored.momentType,
          platformFit: scored.platformFit,
          suggestedHook: buildSuggestedHook(seg.text, scored.momentType),
          whyItWorks: scored.reason,
          emotionalTrigger: scored.emotionalTrigger,
          contentUse: CONTENT_USES[scored.momentType] ?? "repurposable content moment",
          confidenceScore: scored.score,
          sourceTextPreview: seg.text.slice(0, 100),
        } satisfies TimelineMoment;
      })
      .filter((m) => m.confidenceScore >= MIN_SCORE_THRESHOLD);

    moments.sort((a, b) => b.confidenceScore - a.confidenceScore);
    return moments.slice(0, MAX_MOMENTS);

  } catch {
    return [];
  }
}

function buildSuggestedHook(text: string, type: string): string {
  const firstSentence = text.match(/[^.!?]+[.!?]/)?.[0]?.trim() ?? text.slice(0, 80).trim();
  const prefixes: Record<string, string> = {
    validation_hook:       "You're not failing — ",
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
  contrarian_insight:    "Twitter thread starter / LinkedIn hook",
  emotional_confession:  "TikTok / Reels opener",
  story_turning_point:   "YouTube long-form anchor moment",
  educational_gem:       "LinkedIn post / blog key insight",
  quote_moment:          "Instagram quote card / Twitter pull quote",
  fomo_loss_frame:       "TikTok / Reels urgency hook",
  authority_proof:       "LinkedIn credibility post",
  transformation_moment: "YouTube thumbnail moment / TikTok arc",
};
