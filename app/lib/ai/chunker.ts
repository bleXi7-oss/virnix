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

// Claude Opus 4.7 pricing (approximate, update if Anthropic changes rates).
// TODO: pull these from env vars once pricing is stable and multi-provider support lands.
const INPUT_COST_PER_MILLION = 15; // USD
const OUTPUT_COST_PER_MILLION = 75; // USD

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

// ─── Smart truncation ─────────────────────────────────────────────────────────

// Selects up to maxWords of transcript, preferring the opening segment where
// podcasts and videos typically front-load their key arguments and hooks.
// Falls back to simple head-truncation when the content is already short enough.
//
// TODO: replace with an extractive summarisation pass once multi-call pipeline is tested.
export function selectBestSegment(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}
