// Transcript chunking and cost-control utilities.
//
// Used for: pre-call cost estimation, long-transcript splitting, and smart
// truncation that favours content-dense sections over blind head-truncation.
//
// Token counts are approximate (1 word ≈ 1.3 tokens for English).
// Use these for guards and logging, not billing-accurate invoicing.

// ─── Token estimation ─────────────────────────────────────────────────────────

const WORDS_PER_TOKEN = 1.3;

export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * WORDS_PER_TOKEN);
}

// ─── Cost estimation ──────────────────────────────────────────────────────────

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedUSD: number;
}

// Claude Sonnet 4.6 pricing (approximate, update if Anthropic changes rates).
// WARNING: These estimates are approximations only (1 word ≈ 1.3 tokens).
// They are suitable for logging and rough guardrails ONLY — NOT for billing,
// accounting, invoicing, or any financial reporting. Always use the actual
// token counts returned by the Anthropic API for cost accounting.
// TODO: pull these from env vars once pricing is stable and multi-provider support lands.
const INPUT_COST_PER_MILLION = 3;  // USD (Sonnet 4.6)
const OUTPUT_COST_PER_MILLION = 15; // USD (Sonnet 4.6)

export function estimateCost(
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const estimatedUSD =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return { inputTokens, outputTokens, estimatedUSD };
}

// ─── Transcript chunking ──────────────────────────────────────────────────────

export interface TranscriptChunk {
  text: string;
  wordCount: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

// Splits a transcript into sequential chunks of up to maxWords each.
// Useful for future multi-pass summarisation of 1hr+ podcasts.
// TODO: add sentence-boundary splitting so chunks don't cut mid-sentence.
export function chunkTranscript(
  text: string,
  maxWords: number
): TranscriptChunk[] {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return [
      { text, wordCount: words.length, index: 0, isFirst: true, isLast: true },
    ];
  }

  const chunks: TranscriptChunk[] = [];
  let offset = 0;

  while (offset < words.length) {
    const slice = words.slice(offset, offset + maxWords);
    const isLast = offset + maxWords >= words.length;
    chunks.push({
      text: slice.join(" "),
      wordCount: slice.length,
      index: chunks.length,
      isFirst: chunks.length === 0,
      isLast,
    });
    offset += maxWords;
  }

  return chunks;
}

// ─── Content quality scoring ──────────────────────────────────────────────────
// Heuristics that identify content-dense sections of a transcript.
// Used by selectBestSegment to prefer emotionally rich, story-driven content
// over intros, greetings, sponsor segments, and dead air.

// Signals that indicate high-quality content sections
const CONTENT_SIGNALS = [
  "but", "however", "actually", "wrong", "mistake", "discovered",
  "realized", "suddenly", "the truth", "nobody", "secret", "failed",
  "stopped", "changed", "here's why", "the reason", "what happened",
  "turned out", "the problem", "the real", "i found",
] as const;

// Signals that indicate low-value sections (intros, sponsors, filler)
const LOW_VALUE_SIGNALS = [
  "welcome back", "hey everyone", "thanks for watching", "subscribe",
  "hit the bell", "like and subscribe", "sponsored by", "discount code",
  "promo code", "use code", "check out", "today i want to", "in this video",
  "going to be talking", "um ", "uh ", "so basically", "you know what i mean",
] as const;

// Score a word slice for content density. Higher = better.
function scoreSegment(words: string[]): number {
  const text = words.join(" ").toLowerCase();
  let score = 0;

  // Question marks indicate engagement and tension
  score += (text.match(/\?/g) ?? []).length * 3;

  // Content signal words
  for (const signal of CONTENT_SIGNALS) {
    if (text.includes(signal)) score += 2;
  }

  // Specificity: numbers signal authority and concrete claims
  score += Math.min((text.match(/\b\d+\b/g) ?? []).length, 5) * 2;

  // Low-value penalties
  for (const signal of LOW_VALUE_SIGNALS) {
    if (text.includes(signal)) score -= 5;
  }

  return score;
}

// ─── Smart truncation ─────────────────────────────────────────────────────────

// Selects up to maxWords of transcript, preferring sections with high content
// density (questions, specific claims, conflict language, story markers) over
// intros, sponsor breaks, and filler.
//
// Approach: score non-overlapping 500-word segments, then take the highest-scoring
// contiguous block that fits within maxWords. O(n) and deterministic.
export function selectBestSegment(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;

  const SEGMENT_SIZE = 500;
  const numSegments = Math.ceil(words.length / SEGMENT_SIZE);

  // Score each segment
  const scores: number[] = [];
  for (let i = 0; i < numSegments; i++) {
    const segWords = words.slice(i * SEGMENT_SIZE, (i + 1) * SEGMENT_SIZE);
    scores.push(scoreSegment(segWords));
  }

  // Find the highest-scoring segment as the anchor
  let bestSegIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[bestSegIdx]) bestSegIdx = i;
  }

  // Expand from the best segment anchor to fill up to maxWords.
  // Prefer expanding forward, then backward if more room is available.
  const segmentsNeeded = Math.ceil(maxWords / SEGMENT_SIZE);
  let startSeg = Math.max(0, bestSegIdx - Math.floor(segmentsNeeded / 2));
  const endSeg = Math.min(numSegments, startSeg + segmentsNeeded);
  startSeg = Math.max(0, endSeg - segmentsNeeded); // adjust if we hit the end

  const startWord = startSeg * SEGMENT_SIZE;
  const selectedWords = words.slice(startWord, startWord + maxWords);
  return selectedWords.join(" ");
}
