// Detects the strongest content moments in a timestamped transcript.
//
// Pipeline:
//   1. detectTimestampedLines()       — find all lines with timestamps
//   2. groupLinesIntoSegments()       — pair each timestamp with the next
//   3. groupIntoWindows()             — merge 3s segments into 30s scoring windows
//   4. isLowSemanticContent()         — Gate 1: reject pure noise windows
//   5. isNoiseHeavy()                 — Gate 2: reject exclamation-dominant windows
//   6. isDisplayQualityHook()         — Gate 3: reject event chatter with no insight
//   7. isStandaloneReframeClaim()     — Gate 3b: universal — reject lowercase-start / filler / >50-word hooks
//   8. isSponsorOrAdReadText()        — Gate 4: reject sponsor/ad-read + self-referential filler
//   9. scoreMoment()                  — heuristic score per window (Gate 5: >= 10)
//  10. isGenuineReframeConcrete()     — Gate 6: mechanism_reframe only — require causal/mechanism/experiment content
//  11. top MAX_MOMENTS returned, sorted by confidence
//
// Deterministic heuristic — no AI calls, no ML, no external dependencies.
// Never throws — returns [] on any failure or missing timestamps.

import type { TimelineMoment, MomentType } from "./types";
import {
  detectTimestampedLines,
  groupLinesIntoSegments,
  formatTimestamp,
  type TranscriptSegment,
} from "./transcript-timestamps";
import { scoreMoment, getDisplayReason } from "./moment-scoring";
import {
  cleanMomentDisplayText,
  isLowSemanticContent,
  isNoiseHeavy,
  isDisplayQualityHook,
  isGenuineReframeConcrete,
  isStandaloneReframeClaim,
  isSponsorOrAdReadText,
  isSelfReferentialFillerHook,
  findFirstMeaningfulSentence,
  trimToMeaningfulStart,
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
      // Gate 1: reject pure noise / reaction windows (< 5 meaningful words,
      //         < 0.40 alpha ratio, < 20 chars after clean+dedup).
      .filter((win) => !isLowSemanticContent(win.text))
      // Gate 2: reject exclamation-dominant windows where no single sentence
      //         has 3+ meaningful words, or >55% of sentences are short !… noise.
      .filter((win) => !isNoiseHeavy(win.text))
      .flatMap((win, i): TimelineMoment[] => {
        // Clean once — used for scoring (prevents duplicate signal inflation)
        // and for extracting the hook sentence and preview.
        const cleanText = cleanMomentDisplayText(win.text);
        // Extract the hook sentence once; require >= 5 meaningful words so
        // brief event commentary ("We're all out now." = 4 words) is skipped.
        const hookSentence = findFirstMeaningfulSentence(cleanText, 5);
        // Gate 3: reject hook sentences that can't stand alone as a clip opener
        // — questions, short vague descriptors, game chatter with no insight.
        if (!isDisplayQualityHook(hookSentence)) return [];
        // Gate 3b: universal standalone claim gate — rejects lowercase-start
        // continuation fragments, lecture filler phrases, and >50-word excerpts
        // for all moment types. Strongest Moments display honest pull-quotes;
        // mid-sentence clips and setup phrases are never acceptable.
        if (!isStandaloneReframeClaim(hookSentence)) return [];
        // Gate 4: reject sponsor/ad-read windows and self-referential episode
        // filler — fewer moments is better than sponsor contamination.
        if (isSponsorOrAdReadText(cleanText) || isSelfReferentialFillerHook(hookSentence)) {
          return [];
        }
        const scored = scoreMoment(cleanText);
        // Gate 5: minimum confidence threshold.
        if (scored.score < MIN_SCORE_THRESHOLD) return [];
        // Gate 6: mechanism_reframe requires concrete educational content —
        // causal language, named biological mechanism, or study/experiment evidence.
        // Hard-reject on failure; fewer moments is safer than showing a
        // generic lecture fragment as a "reframe" moment.
        if (
          scored.momentType === "mechanism_reframe" &&
          !isGenuineReframeConcrete(hookSentence)
        ) {
          return [];
        }
        // Resolve display type: validation_hook without genuine validation
        // signals is downgraded to quote_moment so the label matches.
        const displayType = resolveDisplayType(scored.momentType, hookSentence);
        const suggestedHook = buildSuggestedHook(hookSentence);
        return [{
          id: `moment-${i}`,
          startTime: win.startTime,
          endTime: win.endTime,
          title: MOMENT_TITLES[displayType] ?? "Strong Moment",
          momentType: displayType,
          platformFit: scored.platformFit,
          suggestedHook,
          whyItWorks: getDisplayReason(displayType),
          emotionalTrigger: scored.emotionalTrigger,
          contentUse: CONTENT_USES[displayType] ?? "repurposable content moment",
          confidenceScore: scored.score,
          // Trim leading noise sentences so preview doesn't open with "NOOooo…"
          sourceTextPreview: trimToMeaningfulStart(cleanText).slice(0, 120),
        }];
      });

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

// Words that signal genuine self-blame, misconception, or audience pain —
// required for the "You're not failing — " validation hook prefix to apply.
// Without these, the sentence is event commentary, not a validation hook.
const VALIDATION_CONTENT_SIGNALS = [
  "fail", "wrong", "lazy", "broken", "blame", "bad at", "can't", "cannot",
  "couldn't", "struggling", "stuck", "afraid", "fear", "doubt", "never",
  "don't understand", "confused", "overwhelmed", "shame", "not enough",
  "inadequate", "weak", "scared", "lost", "worthless", "hopeless",
  "giving up", "quit", "hate myself", "hate my",
];

function isValidValidationHookSentence(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return VALIDATION_CONTENT_SIGNALS.some((s) => lower.includes(s));
}

// Returns the display moment type, downgrading validation_hook to quote_moment
// when the hook sentence lacks genuine self-blame or misconception signals.
// This keeps the label, prefix, and content_use consistent with the hook text.
function resolveDisplayType(scoredType: MomentType, hookSentence: string): MomentType {
  if (scoredType === "validation_hook" && !isValidValidationHookSentence(hookSentence)) {
    return "quote_moment";
  }
  return scoredType;
}

function buildSuggestedHook(hookSentence: string): string {
  return `“${hookSentence}”`;
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
