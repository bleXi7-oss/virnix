// Prompt assembler — imports from modular engines and composes the final prompts.
// To improve any platform: edit its module. To improve core psychology: edit psychology/.
// To add new variation patterns: edit variation/.
// Public API:
//   SYSTEM_PROMPT / buildPrompt           → core 5 outputs
//   ADVANCED_SYSTEM_PROMPT / buildAdvancedPrompt → all 8 outputs (advanced_outputs flag)

import { STORYTELLING_PATTERNS, ANTI_GENERIC_RULES } from "./psychology";
import { TIKTOK_OPENING_LINES, TIKTOK_CLOSING_LINES } from "./platforms/tiktok";
import { TWITTER_TONE, TWITTER_FORMAT } from "./platforms/twitter";
import { LINKEDIN_TONE, LINKEDIN_FORMAT } from "./platforms/linkedin";
import { INSTAGRAM_TONE, INSTAGRAM_FORMAT } from "./platforms/instagram";
import { YOUTUBE_TITLE_FORMULAS, YOUTUBE_TITLE_RULES } from "./platforms/youtube";
import { CLEANUP_RULES } from "./cleanup";
import { pickVariation, pickRandom, formatVariationBlock } from "./variation";
import { CORE_OUTPUT_SCHEMA, ADVANCED_OUTPUT_SCHEMA } from "../ai/schemas";
import { buildPromptContext, formatPromptContext } from "../intelligence/prompt-context";

function list(items: readonly string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

// ─── Shared preamble ──────────────────────────────────────────────────────────
// Common identity + rules injected into both system prompts.

const IDENTITY_BLOCK = `You are Virnix, an AI content repurposing engine for creators.

Your job: transform podcast/video transcripts into platform-native viral content.

Creator psychology — apply across all platforms:
${list(STORYTELLING_PATTERNS)}

Anti-generic rules — always apply:
${list(ANTI_GENERIC_RULES)}

Rules:
- Return only valid JSON, no commentary, no markdown fences
- Write in a creator voice: direct, punchy, hook-driven
- Prioritize viral potential over comprehensiveness`;

// ─── Core system prompt (5 outputs) ──────────────────────────────────────────

export const SYSTEM_PROMPT = `${IDENTITY_BLOCK}

Output schema (return exactly this structure):
${CORE_OUTPUT_SCHEMA}`;

// ─── Advanced system prompt (8 outputs) ──────────────────────────────────────
// Used when NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=true.
// Requests blog summary, YouTube timestamps, and a short-form script in addition
// to the core 5 outputs. Increases max_tokens to 6144.

export const ADVANCED_SYSTEM_PROMPT = `${IDENTITY_BLOCK}

Output schema (return exactly this structure):
${ADVANCED_OUTPUT_SCHEMA}

Additional output guidance:

Short-Form Script (~500 chars):
Structure: HOOK (one punchy line) → BODY (2-3 tight sentences with the insight) → CTA (one specific action)
Cut filler transitions: 'So', 'Basically', 'What I mean is'.
Momentum must not break — if a line doesn't advance the idea, delete it.
No hashtags.

YouTube Timestamps (~300 chars):
Format: "0:00 [Chapter name]\n1:23 [Chapter name]"
Infer plausible timestamps from the transcript content. Keep chapter names under 5 words.
Start at 0:00. Include 5-8 chapters.

Blog Summary (~800 chars):
Structure: one-sentence intro → 3 bullet-point key insights (specific, no fluff) → one-sentence conclusion CTA
Each bullet: bold insight in plain language. Skimmable — each bullet must stand alone.
No SEO filler: 'In conclusion', 'It goes without saying'.`;

// ─── Core user prompt ─────────────────────────────────────────────────────────
// Injects the transcript, a freshly picked variation profile, and platform guidance.
// Variation is re-picked on every call — same transcript produces a different emotional
// angle each time, making repeated generations feel genuinely different.

export function buildPrompt(transcript: string, timelineContext = "", energyContext = "", languageContext = ""): string {
  const variation = pickVariation();
  const tiktokOpener = pickRandom(TIKTOK_OPENING_LINES);
  const tiktokClosing = pickRandom(TIKTOK_CLOSING_LINES);
  const context = buildPromptContext(variation.angle);

  return `Transform this podcast transcript into viral content for 5 platforms.

TRANSCRIPT:
${transcript}

━━━ GENERATION PROFILE ━━━
${formatVariationBlock(variation)}
${formatPromptContext(context)}${timelineContext ? `\n\n${timelineContext}` : ""}${energyContext ? `\n\n${energyContext}` : ""}${languageContext ? `\n\n${languageContext}` : ""}

Apply this angle to all 5 platforms. Don't name the angle. Don't explain it. Embody it.

Platform requirements:

TikTok / Reels (~300 chars):
Opening line: "${tiktokOpener}"
No slow setup — tension or surprise in the first 5 words.
Name something specific from this transcript — no claim that could apply to any video.
Make the viewer feel this is about them specifically — not generic advice for anyone.
Short sentences only — one idea per line.
Every line makes the next feel necessary.
End with "${tiktokClosing}". No hashtags.

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

best_angle — Use This First:
Identify the single strongest hook this transcript can support.
hook: most potent 1-2 sentence hook (~60 chars), grounded in specific transcript content — no invented data
why: 1-2 sentences — what specifically makes this hook work, referencing the actual content
caution: one honest limitation — what to avoid overclaiming; do not promise virality or invent outcomes
best_platform: single platform where this hook lands hardest
hook_variants: 5 distinct angles on the same core content — each differs in emotional entry point, grounded in transcript
All best_angle text in the same language as all other output. Every variant must differ from the others.

Return only the JSON object, nothing else.`;
}

// ─── Advanced user prompt (8 outputs) ────────────────────────────────────────
// Extends buildPrompt with 3 additional platform sections.

export function buildAdvancedPrompt(transcript: string, timelineContext = "", energyContext = "", languageContext = ""): string {
  const variation = pickVariation();
  const tiktokOpener = pickRandom(TIKTOK_OPENING_LINES);
  const tiktokClosing = pickRandom(TIKTOK_CLOSING_LINES);
  const context = buildPromptContext(variation.angle);

  return `Transform this podcast transcript into viral content for 8 platforms.

TRANSCRIPT:
${transcript}

━━━ GENERATION PROFILE ━━━
${formatVariationBlock(variation)}
${formatPromptContext(context)}${timelineContext ? `\n\n${timelineContext}` : ""}${energyContext ? `\n\n${energyContext}` : ""}${languageContext ? `\n\n${languageContext}` : ""}

Apply this angle to all platforms. Don't name the angle. Don't explain it. Embody it.

Platform requirements:

TikTok / Reels — primary hook (~300 chars):
Opening line: "${tiktokOpener}"
No slow setup — tension or surprise in the first 5 words.
Name something specific from this transcript — no claim that could apply to any video.
Make the viewer feel this is about them specifically — not generic advice for anyone.
Short sentences only — one idea per line.
Every line makes the next feel necessary.
End with "${tiktokClosing}". No hashtags.

TikTok / Reels — alternate hook (~300 chars, key "tiktok_alt"):
Use a different emotional angle than the primary. Same length and format rules.
This is a candidate — the stronger hook will be selected automatically.

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

YouTube titles — primary (5 titles, ~300 chars total):
Formulas:
${list(YOUTUBE_TITLE_FORMULAS)}
Rules:
${list(YOUTUBE_TITLE_RULES)}

YouTube titles — alternate (5 titles, ~300 chars total, key "youtube_alt"):
Use different curiosity styles than the primary titles. Same format rules.
This is a candidate — the stronger set will be selected automatically.

Short-Form Script (~500 chars):
Structure: HOOK → BODY (2-3 sentences) → CTA (one action).
Cut filler transitions: 'So', 'Basically', 'What I mean is'.
Momentum must not break — if a line doesn't advance the idea, delete it.
No hashtags.

YouTube Timestamps (~300 chars):
Format: "0:00 Chapter Name". 5-8 chapters. Start at 0:00.
Infer plausible timestamps from the transcript. Chapter names under 5 words.

Blog Summary (~800 chars):
Intro sentence → 3 bullet key insights (bold, specific) → conclusion CTA.
Skimmable — each bullet must stand alone. Write like a person, not a press release.
No SEO filler: 'In conclusion', 'It goes without saying'.

Output cleanup — apply to all platforms:
${list(CLEANUP_RULES)}

best_angle — Use This First:
Identify the single strongest hook this transcript can support.
hook: most potent 1-2 sentence hook (~60 chars), grounded in specific transcript content — no invented data
why: 1-2 sentences — what specifically makes this hook work, referencing the actual content
caution: one honest limitation — what to avoid overclaiming; do not promise virality or invent outcomes
best_platform: single platform where this hook lands hardest
hook_variants: 5 distinct angles on the same core content — each differs in emotional entry point, grounded in transcript
All best_angle text in the same language as all other output. Every variant must differ from the others.

Return only the JSON object, nothing else.`;
}
