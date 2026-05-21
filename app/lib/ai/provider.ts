// AI provider abstraction.
//
// Isolates the HTTP layer from generation logic so swapping Anthropic → OpenAI
// (or adding a second provider for A/B testing) requires zero changes outside this file.
//
// Current implementation: Anthropic via raw fetch — no SDK dependency.
// Resilience: AbortController timeout (45s) + exponential backoff retry (max 2).
//
// TODO: implement OpenAIProvider once quality comparison testing is ready.
// TODO: add NEXT_PUBLIC_AI_PROVIDER env var to select provider at runtime.

export interface CompletionParams {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
  timeoutMs?: number; // per-request override; defaults to TIMEOUT_MS (30s)
}

// Richer return type — carries retry count and stop_reason for diagnostics.
export interface CompletionResult {
  text: string;
  retryCount: number;
  stopReason?: string;
}

export interface AIProvider {
  readonly name: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
}

// ─── Anthropic provider ───────────────────────────────────────────────────────

// Sonnet 4.6: best quality/cost ratio for creator content generation (~5x cheaper than Opus, ~2x faster)
const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_DEFAULT_MAX_TOKENS = 2048;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

// Response shape from https://api.anthropic.com/v1/messages
interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason?: string;
}

// Maps HTTP status to whether the request should be retried.
// Do not retry auth failures, bad requests, or validation errors.
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

// Delays for backoff: 1s after first failure, 2s after second.
function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async complete({
    system,
    user,
    maxTokens = ANTHROPIC_DEFAULT_MAX_TOKENS,
    model = ANTHROPIC_DEFAULT_MODEL,
    timeoutMs = TIMEOUT_MS,
  }: CompletionParams): Promise<CompletionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // TODO: surface a cleaner error in the UI when the key is missing in production
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    let lastError: Error | null = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = backoffMs(attempt - 1);
        console.warn(`[virnix] Retrying Anthropic request (attempt ${attempt}/${MAX_RETRIES}) after ${delay}ms`);
        await sleep(delay);
        retryCount = attempt;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system,
            messages: [{ role: "user", content: user }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // Include first 200 chars of body for diagnosability without leaking secrets
          const body = await res.text().catch(() => "");
          const err = new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`);
          if (isRetryableStatus(res.status)) {
            lastError = err;
            continue; // retry
          }
          throw err; // non-retryable (4xx auth/validation) — fail immediately
        }

        const data = (await res.json()) as AnthropicResponse;

        // Warn when Anthropic cuts off the response mid-generation.
        // The parser handles truncated/malformed JSON gracefully via safeParse,
        // but output will be degraded — empty or partial cards may surface to the user.
        if (data.stop_reason === "max_tokens") {
          console.warn(
            `[virnix] Anthropic stop_reason=max_tokens — response was truncated. ` +
            `Increase maxTokens or reduce transcript size. Output may be partial.`
          );
        }

        const textBlock = data.content?.find((b) => b.type === "text");

        if (!textBlock?.text) {
          throw new Error(
            `Anthropic returned no text block (stop_reason: ${data.stop_reason ?? "unknown"})`
          );
        }

        return { text: textBlock.text, retryCount, stopReason: data.stop_reason };

      } catch (err) {
        clearTimeout(timeoutId);

        // AbortController fires when the timeout is hit
        if (err instanceof Error && err.name === "AbortError") {
          const timeoutErr = new Error(`Anthropic request timed out after ${timeoutMs / 1000}s`);
          lastError = timeoutErr;
          console.warn(`[virnix] Request timed out on attempt ${attempt + 1}`);
          continue; // retry on timeout
        }

        // Network-level errors (fetch rejected before HTTP) — safe to retry
        if (err instanceof TypeError) {
          lastError = err;
          continue;
        }

        // Re-throw anything else (non-retryable errors from inside the try block)
        throw err;
      }
    }

    // All retries exhausted
    throw lastError ?? new Error("Anthropic request failed after all retries");
  }
}

// ─── OpenAI provider (stub) ───────────────────────────────────────────────────
// TODO: implement when OPENAI_API_KEY is available for quality/cost comparison.

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getProvider(): AIProvider {
  return new AnthropicProvider();
}
