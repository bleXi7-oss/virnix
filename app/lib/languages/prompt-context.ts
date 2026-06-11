import type { OutputLanguageId } from "./types";
import { getLanguageById } from "./options";

// Returns a language directive block for injection into the GENERATION PROFILE.
// Returns "" for "auto" — no instruction needed, model preserves transcript language.
//
// Placement in prompt: injected after energyContext in the GENERATION PROFILE block.
// Priority: language > energy > variation profile.
export function formatLanguageContext(id: OutputLanguageId): string {
  if (id === "auto") return "";

  const lang = getLanguageById(id);

  const lines: string[] = [
    `Output language: ${lang.promptName}`,
    `Write all outputs natively in ${lang.promptName}. Do not literally translate English viral hook formulas. Use natural creator and social media phrasing for that language and region.`,
  ];

  // For English: the transcript may arrive in any language (Arabic, Chinese, Spanish, etc.).
  // The model must not follow the transcript language for generated platform copy.
  if (id === "en") {
    lines.push(
      "The source transcript may be in any language. This does not change your output language.",
      "ALL generated platform copy MUST be written in English: TikTok script, Twitter/X thread, LinkedIn post, Instagram caption, YouTube titles, best_angle hook text, and all hook_variants.",
      "NEVER output platform cards in the transcript language. Source quotes may appear in their original language inside an otherwise English post, but all creator-generated text must be English."
    );
  }

  if (lang.nativeNote) {
    lines.push(lang.nativeNote);
  }

  lines.push(
    "Priority: Output language is mandatory and overrides all other stylistic instructions. Creator Energy is creative steering. Variation profile is secondary and must not override language."
  );

  return lines.join("\n");
}
