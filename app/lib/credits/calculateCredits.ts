import { DURATION_CREDIT_TIERS, MODE_EXTRA_CREDITS, WORDS_PER_MINUTE_ESTIMATE } from "./rules";
import type { CreditCost, GenerationMode } from "./types";

// Returns total === -1 when content is blocked (120+ min).
// All credit calculation is server-side — never trust client-supplied values.
export function calculateCreditsForGeneration(
  durationSec: number,
  mode: GenerationMode
): CreditCost {
  const tier = DURATION_CREDIT_TIERS.find((t) => durationSec <= t.maxSec);
  const durationCredits = tier?.credits ?? -1;

  if (durationCredits === -1) {
    return { durationCredits: -1, modeCredits: 0, total: -1 };
  }

  const modeCredits = MODE_EXTRA_CREDITS[mode];
  return { durationCredits, modeCredits, total: durationCredits + modeCredits };
}

// Fallback: estimate video duration from transcript word count.
// Used when the YouTube segment timing data is unavailable.
// Keep this centralized so it can be replaced when a better source is available.
export function estimateDurationFromWordCount(wordCount: number): number {
  return (wordCount / WORDS_PER_MINUTE_ESTIMATE) * 60;
}
