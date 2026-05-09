import type { GenerateRequest, GenerateResult } from "../types/generation";
import { SYSTEM_PROMPT, buildPrompt } from "../prompts";
import { getTranscript } from "./transcript";
import { getMockResult } from "./mock";
import { parseAnthropicResponse } from "./parser";

// ─── To enable real AI generation ────────────────────────────────────────────
// 1. Copy env.example → .env.local
// 2. Set ANTHROPIC_API_KEY to your key from console.anthropic.com
// 3. Change MOCK to false below
// 4. Restart the dev server (npm run dev)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK = true;

// Cap transcript input to keep prompt size and cost predictable.
const MAX_WORDS = 3000;

function truncateTranscript(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS) return text;
  return words.slice(0, MAX_WORDS).join(" ");
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  const transcript = await getTranscript(req.youtubeUrl);

  const words = transcript.split(/\s+/).filter(Boolean).length;
  const truncated = truncateTranscript(transcript);
  const wasTruncated = truncated.length < transcript.length;

  console.log(
    `[virnix] transcript: ${words} words${wasTruncated ? ` → truncated to ${MAX_WORDS}` : ""}`
  );
  console.log(`[virnix] preview: "${truncated.slice(0, 300)}${truncated.length > 300 ? "…" : ""}"`);

  if (MOCK) return getMockResult();
  return realGenerate(truncated);
}

async function realGenerate(transcript: string): Promise<GenerateResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(transcript) }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  return parseAnthropicResponse(data.content[0].text);
}
