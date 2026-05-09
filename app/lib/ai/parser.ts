import type { OutputCardData } from "../outputCards";
import type { GenerateResult } from "../types/generation";

// Shape that Claude returns as JSON when given buildPrompt()
type RawOutput = {
  tiktok: { content: string };
  twitter: { content: string };
  linkedin: { content: string };
  instagram: { content: string };
  youtube: { content: string };
};

// Parses the raw JSON string from the Anthropic response into GenerateResult.
// If Claude ever changes its output format, only this file needs to change.
export function parseAnthropicResponse(text: string): GenerateResult {
  // Strip markdown code fences — Claude occasionally wraps JSON in ```json ... ```
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let raw: RawOutput;
  try {
    raw = JSON.parse(cleaned) as RawOutput;
  } catch {
    throw new Error("AI returned an unexpected format. Please try again.");
  }

  const cards: OutputCardData[] = [
    {
      platform: "TikTok / Reels",
      type: "Hook Script",
      badge: "60 sec",
      iconType: "tiktok",
      charCount: `~${raw.tiktok.content.length} chars`,
      content: raw.tiktok.content,
    },
    {
      platform: "Twitter / X",
      type: "Thread",
      badge: "8 tweets",
      iconType: "x",
      charCount: `~${raw.twitter.content.length} chars`,
      content: raw.twitter.content,
    },
    {
      platform: "LinkedIn",
      type: "Long Post",
      badge: "Professional",
      iconType: "linkedin",
      charCount: `~${raw.linkedin.content.length} chars`,
      content: raw.linkedin.content,
    },
    {
      platform: "Instagram",
      type: "Caption",
      badge: "Casual",
      iconType: "instagram",
      charCount: `~${raw.instagram.content.length} chars`,
      content: raw.instagram.content,
    },
    {
      platform: "YouTube",
      type: "Title Ideas",
      badge: "5 options",
      iconType: "youtube",
      wide: true,
      charCount: `~${raw.youtube.content.length} chars`,
      content: raw.youtube.content,
    },
  ];

  return { cards, generatedAt: new Date().toISOString() };
}
