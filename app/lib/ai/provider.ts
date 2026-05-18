// AI provider abstraction.
//
// Isolates the HTTP layer from generation logic so swapping Anthropic → OpenAI
// (or adding a second provider for A/B testing) requires zero changes outside this file.
//
// Current implementation: Anthropic via raw fetch — no SDK dependency.
//
// TODO: implement OpenAIProvider once quality comparison testing is ready.
// TODO: add NEXT_PUBLIC_AI_PROVIDER env var to select provider at runtime.

export interface CompletionParams {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}

export interface AIProvider {
  readonly name: string;
  complete(params: CompletionParams): Promise<string>;
}

// ─── Anthropic provider ───────────────────────────────────────────────────────

const ANTHROPIC_DEFAULT_MODEL = "claude-opus-4-7";
const ANTHROPIC_DEFAULT_MAX_TOKENS = 4096;

// Response shape from https://api.anthropic.com/v1/messages
interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason?: string;
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async complete({
    system,
    user,
    maxTokens = ANTHROPIC_DEFAULT_MAX_TOKENS,
    model = ANTHROPIC_DEFAULT_MODEL,
  }: CompletionParams): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // TODO: surface a cleaner error in the UI when the key is missing in production
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

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
    });

    if (!res.ok) {
      // Include first 200 chars of body for diagnosability without leaking secrets
      const body = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as AnthropicResponse;

    // Warn when Anthropic cuts off the response mid-generation.
    // This most commonly means max_tokens was too low for the requested output.
    // The caller (parser.ts) handles truncated/malformed JSON gracefully via safeParse,
    // but the output will be degraded — empty or partial cards will surface to the user.
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

    return textBlock.text;
  }
}

// ─── OpenAI provider (stub) ───────────────────────────────────────────────────
// TODO: implement when OPENAI_API_KEY is available for quality/cost comparison.
// Signature:
//   class OpenAIProvider implements AIProvider {
//     readonly name = "openai";
//     async complete(params: CompletionParams): Promise<string> { ... }
//   }

// ─── Factory ──────────────────────────────────────────────────────────────────

// Returns the active provider. Currently always Anthropic.
// Future: read process.env.AI_PROVIDER to support "openai" | "anthropic".
export function getProvider(): AIProvider {
  return new AnthropicProvider();
}
