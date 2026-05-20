import type { GenerateRequest, GenerateResult } from "../types/generation";
import type { CreatorEnergyId } from "../creator-energy/types";
import type { AIDiagnostics } from "./diagnostics";
import { SYSTEM_PROMPT, ADVANCED_SYSTEM_PROMPT, buildPrompt, buildAdvancedPrompt } from "../prompts";
import { getTranscriptFull } from "./transcript";
import { getMockResult } from "./mock";
import { parseAnthropicResponse } from "./parser";
import { isEnabled } from "../flags";
import { getProvider } from "./provider";
import { estimateTokens, estimateCost, selectBestSegment } from "./chunker";
import { logDiagnostics } from "./diagnostics";
import { estimateViralityScore } from "../intelligence/quality";
import { formatEnergyContext } from "../creator-energy/prompt-context";
import { detectTimelineMoments, formatTimelineMomentsForPrompt, selectMomentsForPrompt, evaluateTranscriptQuality } from "../timeline";

// ─── To enable real AI generation ────────────────────────────────────────────
// Set NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true in .env.local (or Vercel env vars)
// and set ANTHROPIC_API_KEY to your key from console.anthropic.com.
// For advanced outputs (blog, timestamps, short-form, alt hook selection):
// also set NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=true.
// For the developer debug panel: set NEXT_PUBLIC_FLAG_DEV_DEBUG=true.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_WORDS = 3000;

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  // Short-circuit before any network call — keeps mock mode fast and free
  if (!isEnabled("real_ai_generation")) return getMockResult();

  const startMs = Date.now();

  let transcript: string;
  let timestampedTranscript: string;
  try {
    ({ transcript, timestampedTranscript } = await getTranscriptFull(req.youtubeUrl));
  } catch (err) {
    console.error("[virnix] transcript fetch failed:", err instanceof Error ? err.message : err);
    // Fall back to mock cards — user sees output rather than an error screen
    return { ...getMockResult(), diagnostics: makeFallbackDiagnostics("transcript-fetch-failed", startMs) };
  }

  const words = transcript.split(/\s+/).filter(Boolean).length;
  const truncated = selectBestSegment(transcript, MAX_WORDS);
  const wasTruncated = truncated.split(/\s+/).filter(Boolean).length < words;

  console.log(
    `[virnix] transcript: ${words} words${wasTruncated ? ` → best ${MAX_WORDS}-word segment selected` : ""}`
  );

  // Timeline detection runs on the full timestamped transcript — never throws, never blocks generation
  const timelineMoments = detectTimelineMoments(timestampedTranscript);
  if (timelineMoments.length > 0) {
    console.log(`[virnix] timeline: ${timelineMoments.length} moments detected`);
  }

  return realGenerate(truncated, startMs, timelineMoments, req.energyIds ?? []);
}

async function realGenerate(
  transcript: string,
  startMs: number,
  timelineMoments: GenerateResult["timelineMoments"] = [],
  energyIds: CreatorEnergyId[] = []
): Promise<GenerateResult> {
  const useAdvanced = isEnabled("advanced_outputs");
  const outputType: "core" | "advanced" = useAdvanced ? "advanced" : "core";
  const systemPrompt = useAdvanced ? ADVANCED_SYSTEM_PROMPT : SYSTEM_PROMPT;

  // Build timeline context: compact string of top psychological moments as creative anchors.
  // Returns "" when no moments — prompts stay byte-for-byte identical to before.
  const timelineContext = formatTimelineMomentsForPrompt(timelineMoments ?? []);
  const injectedMoments = timelineContext ? selectMomentsForPrompt(timelineMoments ?? []) : [];
  const timelineInjected = injectedMoments.length > 0;

  // Build energy context: empty string when no energies selected — prompts unchanged.
  const energyContext = formatEnergyContext(energyIds);
  if (energyIds.length > 0) {
    console.log(`[virnix] creator energy: ${energyIds.join(", ")}`);
  }

  const userPrompt = useAdvanced
    ? buildAdvancedPrompt(transcript, timelineContext, energyContext)
    : buildPrompt(transcript, timelineContext, energyContext);

  const provider = getProvider();

  const estimatedInput = estimateTokens(systemPrompt + userPrompt);
  // Core: 5 outputs ~900-1200 tokens actual; 2048 gives generous headroom.
  // Advanced: 8 outputs + 2 alts ~2000-2500 tokens actual; 3500 gives safe headroom.
  const maxTokens = useAdvanced ? 3500 : 2048;
  const { estimatedUSD } = estimateCost(estimatedInput, maxTokens);

  // Log cost estimate before calling — visible in Vercel Functions logs
  // WARNING: estimate is approximate only. Use Anthropic dashboard for billing.
  console.log(
    `[virnix] AI call — provider: ${provider.name}, ~${estimatedInput} input tokens, ~$${estimatedUSD.toFixed(4)} estimated`
  );

  // TODO: add a circuit breaker once per-user cost tracking is implemented
  // TODO: tune maxTokens after production testing — monitor stop_reason=max_tokens in logs
  const { text, retryCount, stopReason } = await provider.complete({
    system: systemPrompt,
    user: userPrompt,
    maxTokens,
  });

  const { result, parseRepaired, coercionUsed } = parseAnthropicResponse(text);

  // For advanced mode, score the alt hook/title candidates and keep the stronger ones
  const finalCards = useAdvanced
    ? selectBestOutputs(result.cards, text)
    : result.cards;

  // Score the TikTok hook for diagnostics — first card is always TikTok
  const viralityScore = estimateViralityScore(finalCards[0]?.content ?? "", "tiktok");

  // Evaluate transcript psychological density — zero cost, uses already-detected moments
  const transcriptQuality = timelineMoments?.length
    ? evaluateTranscriptQuality(timelineMoments)
    : undefined;

  const diagnostics: AIDiagnostics = {
    provider: provider.name,
    elapsedMs: Date.now() - startMs,
    estimatedTokens: estimatedInput,
    chunkCount: 1, // future: multi-chunk for 1h+ podcasts
    outputType,
    stopReason,
    retryCount,
    fallbackUsed: false,
    parseRepaired,
    coercionUsed,
    viralityScore,
    timelineMomentsDetected: timelineMoments?.length ?? 0,
    timelineInjected,
    injectedMomentCount: injectedMoments.length,
    transcriptQualityScore: transcriptQuality?.overallScore,
    clipability: transcriptQuality?.clipability,
  };

  logDiagnostics(diagnostics);

  return {
    cards: finalCards,
    generatedAt: result.generatedAt,
    diagnostics,
    timelineMoments: timelineMoments?.length ? timelineMoments : undefined,
    transcriptQuality: transcriptQuality ?? undefined,
  };
}

// ─── Best-output selection ────────────────────────────────────────────────────
// When advanced_outputs is on, the prompt asks for tiktok_alt and youtube_alt.
// This function scores both candidates and swaps in the stronger one.
// Isolated, deterministic — no API calls, no loops.

function selectBestOutputs(
  cards: GenerateResult["cards"],
  rawText: string
): GenerateResult["cards"] {
  // Re-parse to access the advanced fields (tiktok_alt, youtube_alt)
  // We already parsed once; this is a cheap in-memory re-parse of the same text
  let parsed: unknown = null;
  try {
    // Try to find the JSON object in the raw text
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    if (start !== -1 && end > start) {
      parsed = JSON.parse(rawText.slice(start, end + 1));
    }
  } catch {
    // If re-parse fails, return original cards unchanged
    return cards;
  }

  if (typeof parsed !== "object" || parsed === null) return cards;
  const obj = parsed as Record<string, unknown>;

  const result = [...cards];

  // Score and select TikTok hook
  const tiktokIdx = result.findIndex((c) => c.platform === "TikTok / Reels");
  if (tiktokIdx !== -1) {
    const alt = extractContent(obj.tiktok_alt);
    if (alt) {
      const mainScore = estimateViralityScore(result[tiktokIdx].content, "tiktok");
      const altScore  = estimateViralityScore(alt, "tiktok");
      if (altScore > mainScore) {
        result[tiktokIdx] = { ...result[tiktokIdx], content: alt, charCount: `~${alt.length} chars` };
        console.log(`[virnix] tiktok_alt selected (score ${altScore} vs ${mainScore})`);
      }
    }
  }

  // Score and select YouTube titles
  const youtubeIdx = result.findIndex((c) => c.platform === "YouTube" && c.type === "Title Ideas");
  if (youtubeIdx !== -1) {
    const alt = extractContent(obj.youtube_alt);
    if (alt) {
      const mainScore = estimateViralityScore(result[youtubeIdx].content, "youtube");
      const altScore  = estimateViralityScore(alt, "youtube");
      if (altScore > mainScore) {
        result[youtubeIdx] = { ...result[youtubeIdx], content: alt, charCount: `~${alt.length} chars` };
        console.log(`[virnix] youtube_alt selected (score ${altScore} vs ${mainScore})`);
      }
    }
  }

  return result;
}

function extractContent(val: unknown): string | null {
  if (typeof val === "object" && val !== null && "content" in val) {
    const c = (val as Record<string, unknown>).content;
    return typeof c === "string" && c.trim() ? c : null;
  }
  return null;
}

// ─── Fallback diagnostics ─────────────────────────────────────────────────────

function makeFallbackDiagnostics(reason: string, startMs: number): AIDiagnostics {
  return {
    provider: "mock",
    elapsedMs: Date.now() - startMs,
    estimatedTokens: 0,
    chunkCount: 0,
    outputType: "core",
    stopReason: reason,
    retryCount: 0,
    fallbackUsed: true,
    parseRepaired: false,
    coercionUsed: false,
  };
}

