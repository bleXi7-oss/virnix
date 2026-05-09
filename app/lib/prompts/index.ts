// Prompt assembler — imports from modular engines and composes the final prompts.
// To improve any platform: edit its module. To improve core psychology: edit psychology/.
// The public API (SYSTEM_PROMPT, buildPrompt) stays stable so generate.ts never changes.

import { STORYTELLING_PATTERNS, ANTI_GENERIC_RULES } from "./psychology";
import { TIKTOK_OPENING_LINES } from "./hooks";
import { TWITTER_TONE, TWITTER_FORMAT } from "./twitter";
import { LINKEDIN_TONE, LINKEDIN_FORMAT } from "./linkedin";
import { INSTAGRAM_TONE, INSTAGRAM_FORMAT } from "./instagram";
import { YOUTUBE_TITLE_FORMULAS, YOUTUBE_TITLE_RULES } from "./youtube";
import { CLEANUP_RULES } from "./cleanup";

function list(items: readonly string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

// ─── System Prompt ─────────────────────────────────────────────────────────────
// Establishes Virnix identity, creator psychology, and anti-generic rules.
// Sent once per request as the system message — kept lean intentionally.

export const SYSTEM_PROMPT = `You are Virnix, an AI content repurposing engine for creators.

Your job: transform podcast/video transcripts into platform-native viral content.

Creator psychology — apply across all platforms:
${list(STORYTELLING_PATTERNS)}

Anti-generic rules — always apply:
${list(ANTI_GENERIC_RULES)}

Rules:
- Return only valid JSON, no commentary, no markdown fences
- Write in a creator voice: direct, punchy, hook-driven
- Prioritize viral potential over comprehensiveness

Output schema (return exactly this structure):
{
  "tiktok":    { "content": "<60-sec hook script, ~300 chars>" },
  "twitter":   { "content": "<8-tweet thread numbered 1/ through 8/, ~2000 chars>" },
  "linkedin":  { "content": "<professional post with line breaks, ~600 chars>" },
  "instagram": { "content": "<casual caption with arrows and CTA, ~400 chars>" },
  "youtube":   { "content": "<5 title options numbered 1-5, ~300 chars total>" }
}`;

// ─── User Prompt ───────────────────────────────────────────────────────────────
// Injects the transcript and platform-specific guidance.
// Each section is driven by its module — improve one platform by editing one file.

export function buildPrompt(transcript: string): string {
  return `Transform this podcast transcript into viral content for 5 platforms.

TRANSCRIPT:
${transcript}

Platform requirements:

TikTok / Reels (~300 chars):
Opening lines to use: ${TIKTOK_OPENING_LINES.slice(0, 3).join(" | ")}
End with "Here's the exact system...". No hashtags.

Twitter / X (~2000 chars):
Tone:
${list(TWITTER_TONE)}
Format: ${TWITTER_FORMAT}

LinkedIn (~600 chars):
Tone:
${list(LINKEDIN_TONE)}
Format: ${LINKEDIN_FORMAT}

Instagram (~400 chars):
Tone:
${list(INSTAGRAM_TONE)}
Format: ${INSTAGRAM_FORMAT}

YouTube (5 titles, ~300 chars total):
Formulas:
${list(YOUTUBE_TITLE_FORMULAS)}
Rules:
${list(YOUTUBE_TITLE_RULES)}

Output cleanup — apply to all platforms:
${list(CLEANUP_RULES)}

Return only the JSON object, nothing else.`;
}
