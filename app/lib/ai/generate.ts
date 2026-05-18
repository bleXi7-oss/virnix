import type { GenerateRequest, GenerateResult } from "../types/generation";
import { SYSTEM_PROMPT, ADVANCED_SYSTEM_PROMPT, buildPrompt, buildAdvancedPrompt } from "../prompts";
import { getTranscript } from "./transcript";
import { getMockResult } from "./mock";
import { parseAnthropicResponse } from "./parser";
import { isEnabled } from "../flags";
import { getProvider } from "./provider";
import { estimateTokens, estimateCost } from "./chunker";

// ─── To enable real AI generation ────────────────────────────────────────────
// Set NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true in .env.local (or Vercel env vars)
// and set ANTHROPIC_API_KEY to your key from console.anthropic.com.
// For advanced outputs (blog, timestamps, short-form): also set
// NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=true.
// ─────────────────────────────────────────────────────────────────────────────

// Cap transcript input to keep prompt size and cost predictable.
const MAX_WORDS = 3000;

function truncateTranscript(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS) return text;
  return words.slice(0, MAX_WORDS).join(" ");
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  // Short-circuit before any network call — Vercel blocks youtube-transcript requests
  if (!isEnabled("real_ai_generation")) return getMockResult();

  let transcript: string;
  try {
    transcript = await getTranscript(req.youtubeUrl);
  } catch (err) {
    console.error("[virnix] transcript fetch failed:", err instanceof Error ? err.message : err);
    // Fall back to mock cards so the user sees output rather than an error
    return getMockResult();
  }

  const words = transcript.split(/\s+/).filter(Boolean).length;
  const truncated = truncateTranscript(transcript);
  const wasTruncated = truncated.length < transcript.length;

  console.log(
    `[virnix] transcript: ${words} words${wasTruncated ? ` → truncated to ${MAX_WORDS}` : ""}`
  );

  return realGenerate(truncated);
}

async function realGenerate(transcript: string): Promise<GenerateResult> {
  const useAdvanced = isEnabled("advanced_outputs");
  const systemPrompt = useAdvanced ? ADVANCED_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const userPrompt = useAdvanced ? buildAdvancedPrompt(transcript) : buildPrompt(transcript);

  const provider = getProvider();

  // Log estimated cost before the API call for cost observability
  const estimatedInput = estimateTokens(systemPrompt + userPrompt);
  const { estimatedUSD } = estimateCost(estimatedInput, 4096);
  console.log(
    `[virnix] AI call — provider: ${provider.name}, ~${estimatedInput} input tokens, ~$${estimatedUSD.toFixed(4)} estimated`
  );

  // TODO: add a circuit breaker here once per-user cost tracking is implemented
  // TODO: tune maxTokens after real production testing — 4096 may truncate long transcripts
  // and 6144 for advanced outputs may be insufficient for very dense content.
  // Monitor stop_reason=max_tokens warnings in logs to identify when to raise these values.
  const text = await provider.complete({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: useAdvanced ? 6144 : 4096,
  });

  return parseAnthropicResponse(text);
}
