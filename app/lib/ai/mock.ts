import { OUTPUT_CARDS } from "../outputCards";
import type { GenerateResult, BestAngle } from "../types/generation";
import type { AIDiagnostics } from "./diagnostics";

const MOCK_DIAGNOSTICS: AIDiagnostics = {
  provider: "mock",
  elapsedMs: 0,
  estimatedTokens: 0,
  chunkCount: 0,
  outputType: "core",
  retryCount: 0,
  fallbackUsed: true,
  parseRepaired: false,
  coercionUsed: false,
};

const MOCK_BEST_ANGLE: BestAngle = {
  hook: "The creators who grew fastest posted less. Not more.",
  why: "This flips the conventional wisdom with a concrete finding — save rate, not frequency, is the actual growth lever.",
  caution: "Results depend heavily on niche and audience size; a one-size rule won't apply to every creator.",
  best_platform: "TikTok / Reels",
  hook_variants: {
    curiosity:  "What if posting less was the fastest path to growth?",
    contrarian: "More content is killing your reach — here's the data.",
    tactical:   "73% of the fastest-growing accounts reduced post frequency at month six.",
    reflective: "You've been measuring the wrong metric this whole time.",
    punchy:     "Save rate > post frequency. Full stop.",
  },
};

export function getMockResult(): GenerateResult {
  return {
    cards: OUTPUT_CARDS,
    generatedAt: new Date().toISOString(),
    bestAngle: MOCK_BEST_ANGLE,
    diagnostics: MOCK_DIAGNOSTICS,
  };
}
