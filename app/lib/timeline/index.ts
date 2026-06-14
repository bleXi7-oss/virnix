// Timeline moment detection — public API.
//
// Completely isolated from core generation. Removing this entire folder
// has zero impact on providers, prompts, parsing, diagnostics, or UI cards.
//
// Usage:
//   const moments = detectTimelineMoments(timestampedTranscript);
//   const promptSection = formatTimelineMomentsForPrompt(moments);

export type { TimelineMoment, MomentType, PlatformFit } from "./types";
export { detectTimelineMoments } from "./moment-detector";
export { formatTimelineMomentsForPrompt, selectMomentsForPrompt, formatMomentReport, formatMomentsReport } from "./formatter";
export {
  parseTimestamp,
  formatTimestamp,
  detectTimestampedLines,
  groupLinesIntoSegments,
} from "./transcript-timestamps";
export { scoreMoment } from "./moment-scoring";
export type { MomentScore } from "./moment-scoring";
export {
  cleanWindowText,
  collapseRepeatedFragments,
  countMeaningfulWords,
  isLowSemanticContent,
  isNoiseHeavy,
  noiseTokenRatio,
  trimToMeaningfulStart,
  findFirstMeaningfulSentence,
} from "./moment-text-cleaner";
export type { TimestampedLine, TranscriptSegment } from "./transcript-timestamps";
export { buildTimestampedTranscript } from "./build-timestamped-transcript";
export type { RawSegment } from "./build-timestamped-transcript";
export { evaluateTranscriptQuality } from "./transcript-quality";
export type { TranscriptQualityReport } from "./transcript-quality";
