import type { GenerateRequest, GenerateResult } from "../types/generation";
import { SYSTEM_PROMPT, buildPrompt } from "../prompts";
import { getTranscript } from "./transcript";
import { getMockResult } from "./mock";
import { parseAnthropicResponse } from "./parser";

// Set to false once ANTHROPIC_API_KEY is in .env.local and transcript fetching works
const MOCK = true;

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  if (MOCK) return getMockResult();
  return realGenerate(req);
}

async function realGenerate(req: GenerateRequest): Promise<GenerateResult> {
  const transcript = await getTranscript(req.youtubeUrl);

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
