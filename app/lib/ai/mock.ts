import { OUTPUT_CARDS } from "../outputCards";
import type { GenerateResult } from "../types/generation";

// Returns the hardcoded demo cards while MOCK = true in generate.ts.
// Replace OUTPUT_CARDS entries with real content once the AI pipeline is live.
export function getMockResult(): GenerateResult {
  return {
    cards: OUTPUT_CARDS,
    generatedAt: new Date().toISOString(),
  };
}
