// Parses raw AI text into GenerateResult.
//
// Defensive by design — every failure mode (empty, malformed JSON, missing fields,
// partial output, markdown-wrapped, leading/trailing prose) produces a usable result
// via coercion rather than throwing. The caller gets cards even in degraded cases.
//
// ParseOutcome carries parse quality flags so callers can track diagnostic state.

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

// ─── Public result type ───────────────────────────────────────────────────────

export interface ParseOutcome {
  result: GenerateResult;
  parseRepaired: boolean;  // true when JSON was recovered by deep-scan fallback
  coercionUsed: boolean;   // true when any required fields were missing/malformed
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

// Fast path: strips markdown fences and finds the outermost { } using bracket
// counting. More reliable than lastIndexOf("}") when the AI adds trailing prose.
function extractJSON(raw: string): string {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  if (start === -1) return cleaned;

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  // Unclosed block — return from start to end as best effort
  return cleaned.slice(start);
}

// Deep-scan fallback: finds ALL balanced { } blocks in the raw string and returns
// the largest one that parses as valid JSON. Handles cases where the AI wraps the
// JSON in explanatory prose or includes stray braces in commentary.
// Deterministic — no regex patterns for the actual extraction, only bracket counting.
export function extractLargestJsonObject(raw: string): string {
  const candidates: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== "{") continue;
    let depth = 0;
    for (let j = i; j < raw.length; j++) {
      if (raw[j] === "{") depth++;
      else if (raw[j] === "}") {
        depth--;
        if (depth === 0) {
          candidates.push(raw.slice(i, j + 1));
          break;
        }
      }
    }
  }

  // Largest block first — the full AI response is almost always the biggest JSON object
  candidates.sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    if (safeParse(candidate) !== null) return candidate;
  }

  return candidates[0] ?? "";
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

export function parseAnthropicResponse(text: string): ParseOutcome {
  let parseRepaired = false;
  let coercionUsed = false;

  // Empty response — model returned nothing
  if (!text?.trim()) {
    console.warn("[virnix] AI returned an empty response — using coerced fallback");
    coercionUsed = true;
    return { result: buildResult(coerceCoreOutput(null)), parseRepaired, coercionUsed };
  }

  // Fast path: extract outermost {} block
  const extracted = extractJSON(text);
  let parsed = safeParse(extracted);

  // Deep-scan fallback: the AI may have included prose before/after the JSON
  if (parsed === null) {
    const largest = extractLargestJsonObject(text);
    parsed = safeParse(largest);
    if (parsed !== null) {
      parseRepaired = true;
      console.warn("[virnix] JSON recovered via deep scan — AI included commentary around the response");
    }
  }

  if (parsed === null) {
    console.warn("[virnix] AI response was not valid JSON — using coerced fallback");
    coercionUsed = true;
    return { result: buildResult(coerceCoreOutput(null)), parseRepaired, coercionUsed };
  }

  if (!validateCoreOutput(parsed)) {
    console.warn("[virnix] AI response missing required fields — coercing partial output");
    coercionUsed = true;
  }

  const core = coerceCoreOutput(parsed);
  const advanced = isEnabled("advanced_outputs")
    ? extractAdvancedOutput(parsed)
    : {};

  return { result: buildResult(core, advanced), parseRepaired, coercionUsed };
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
