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

  if (lang.nativeNote) {
    lines.push(lang.nativeNote);
  }

  lines.push(
    "Priority: Output language is mandatory and overrides all other stylistic instructions. Creator Energy is creative steering. Variation profile is secondary and must not override language."
  );

  return lines.join("\n");
}
