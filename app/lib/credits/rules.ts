import type { GenerationMode } from "./types";

// Duration tiers: checked in order, first match wins.
// total === -1 means the content is blocked (120+ min).
export const DURATION_CREDIT_TIERS: ReadonlyArray<{ maxSec: number; credits: number }> = [
  { maxSec: 600,      credits: 1 }, // 0–10 min
  { maxSec: 1800,     credits: 2 }, // 10–30 min
  { maxSec: 3600,     credits: 4 }, // 30–60 min
  { maxSec: 7200,     credits: 8 }, // 60–120 min
  { maxSec: Infinity, credits: -1 }, // 120+ min → blocked
];

export const MODE_EXTRA_CREDITS: Record<GenerationMode, number> = {
  basic: 0,
  advanced: 1,
};

// Fallback when exact video duration is not available:
// estimate from transcript word count at typical speech rate.
export const WORDS_PER_MINUTE_ESTIMATE = 150;
