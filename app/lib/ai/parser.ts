// Parses raw AI text into GenerateResult.
//
// Defensive by design — every failure mode (empty, malformed JSON, missing fields,
// partial output, markdown-wrapped) produces a usable result via coercion rather
// than throwing. The caller gets cards even in degraded cases; empty content strings
// surface to the user as blank cards rather than uncaught errors.
//
// If Claude changes its output format, only this file + schemas.ts need to change.

import type { OutputCardData } from "../outputCards";
import type { GenerateResult } from "../types/generation";
import {
  validateCoreOutput,
  coerceCoreOutput,
  extractAdvancedOutput,
  type CoreAIOutput,
  type AdvancedAIOutput,
} from "./schemas";
import { isEnabled } from "../flags";

// ─── JSON extraction ──────────────────────────────────────────────────────────

// Strips markdown fences and extracts the outermost { } block.
// Guards against: ```json...```, leading prose, trailing prose.
function extractJSON(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Find outermost braces — handles leading/trailing prose from the model
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

// Returns parsed value or null — never throws.
function safeParse(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Public parser ────────────────────────────────────────────────────────────

export function parseAnthropicResponse(text: string): GenerateResult {
  // Empty response — model returned nothing
  if (!text?.trim()) {
    // TODO: increment an error counter in analytics once the monitoring pipeline is live
    console.warn("[virnix] AI returned an empty response — using coerced fallback");
    return buildResult(coerceCoreOutput(null));
  }

  const extracted = extractJSON(text);
  const parsed = safeParse(extracted);

  if (parsed === null) {
    // TODO: log raw text (truncated) to a debug store once structured logging is wired up
    console.warn("[virnix] AI response was not valid JSON — using coerced fallback");
    return buildResult(coerceCoreOutput(null));
  }

  if (!validateCoreOutput(parsed)) {
    // TODO: log which keys failed validation to track model drift over time
    console.warn("[virnix] AI response missing required fields — coercing partial output");
  }

  const core = coerceCoreOutput(parsed);
  const advanced = isEnabled("advanced_outputs")
    ? extractAdvancedOutput(parsed)
    : {};

  return buildResult(core, advanced);
}

// ─── Result builder ───────────────────────────────────────────────────────────

function buildResult(
  core: CoreAIOutput,
  advanced: Partial<AdvancedAIOutput> = {}
): GenerateResult {
  const cards: OutputCardData[] = [
    {
      platform: "TikTok / Reels",
      type: "Hook Script",
      badge: "60 sec",
      iconType: "tiktok",
      charCount: `~${core.tiktok.content.length} chars`,
      content: core.tiktok.content,
    },
    {
      platform: "Twitter / X",
      type: "Thread",
      badge: "8 tweets",
      iconType: "x",
      charCount: `~${core.twitter.content.length} chars`,
      content: core.twitter.content,
    },
    {
      platform: "LinkedIn",
      type: "Long Post",
      badge: "Professional",
      iconType: "linkedin",
      charCount: `~${core.linkedin.content.length} chars`,
      content: core.linkedin.content,
    },
    {
      platform: "Instagram",
      type: "Caption",
      badge: "Casual",
      iconType: "instagram",
      charCount: `~${core.instagram.content.length} chars`,
      content: core.instagram.content,
    },
    {
      platform: "YouTube",
      type: "Title Ideas",
      badge: "5 options",
      iconType: "youtube",
      wide: true,
      charCount: `~${core.youtube.content.length} chars`,
      content: core.youtube.content,
    },
  ];

  // Advanced outputs — only appended when advanced_outputs flag is on
  if (advanced.shortform?.content) {
    cards.push({
      platform: "Short-Form Script",
      type: "Script",
      badge: "30 sec",
      iconType: "tiktok",
      charCount: `~${advanced.shortform.content.length} chars`,
      content: advanced.shortform.content,
    });
  }

  if (advanced.timestamps?.content) {
    cards.push({
      platform: "YouTube",
      type: "Timestamps",
      badge: "Chapters",
      iconType: "youtube",
      wide: true,
      charCount: `~${advanced.timestamps.content.length} chars`,
      content: advanced.timestamps.content,
    });
  }

  if (advanced.blog?.content) {
    cards.push({
      platform: "Blog",
      type: "Summary",
      badge: "Article",
      iconType: "linkedin", // TODO: add dedicated blog icon to IconType when UI is extended
      wide: true,
      charCount: `~${advanced.blog.content.length} chars`,
      content: advanced.blog.content,
    });
  }

  return { cards, generatedAt: new Date().toISOString() };
}
