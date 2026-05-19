import { OUTPUT_CARDS } from "../outputCards";
import type { GenerateResult } from "../types/generation";
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

export function getMockResult(): GenerateResult {
  return {
    cards: OUTPUT_CARDS,
    generatedAt: new Date().toISOString(),
    diagnostics: MOCK_DIAGNOSTICS,
  };
}
