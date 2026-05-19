// AI request diagnostics — server-side only, no persistence.
// Structured logging for observability during development and production debugging.
//
// Safety rules (enforced by callers, not this module):
//   - NEVER log transcript content
//   - NEVER log the API key
//   - NEVER log raw AI response text
//   - Log metadata and derived metrics only

export interface AIDiagnostics {
  provider: string;
  elapsedMs: number;
  estimatedTokens: number;
  chunkCount: number;
  outputType: "core" | "advanced";
  stopReason?: string;
  retryCount: number;
  fallbackUsed: boolean;
  parseRepaired: boolean;
  coercionUsed: boolean;
  viralityScore?: number;
  timelineMomentsDetected?: number;
  timelineInjected?: boolean;
  injectedMomentCount?: number;
  transcriptQualityScore?: number;
  clipability?: "low" | "medium" | "high";
}

// Emits a single structured log line prefixed with [VIRNIX_AI].
// Keep all values short and safe — no secrets, no content.
export function logDiagnostics(d: AIDiagnostics): void {
  const parts = [
    `[VIRNIX_AI] provider=${d.provider}`,
    `elapsed=${d.elapsedMs}ms`,
    `tokens=~${d.estimatedTokens}`,
    `chunks=${d.chunkCount}`,
    `type=${d.outputType}`,
    `retries=${d.retryCount}`,
    `fallback=${d.fallbackUsed}`,
    `repaired=${d.parseRepaired}`,
    `coerced=${d.coercionUsed}`,
  ];
  if (d.stopReason) parts.push(`stopReason=${d.stopReason}`);
  if (d.viralityScore != null) parts.push(`score=${d.viralityScore}`);
  if (d.timelineMomentsDetected != null) parts.push(`moments=${d.timelineMomentsDetected}`);
  if (d.timelineInjected != null) parts.push(`timelineInjected=${d.timelineInjected}${d.injectedMomentCount != null ? `(${d.injectedMomentCount})` : ""}`);
  if (d.transcriptQualityScore != null) parts.push(`qualityScore=${d.transcriptQualityScore}`);
  if (d.clipability != null) parts.push(`clipability=${d.clipability}`);
  console.log(parts.join(" "));
}
