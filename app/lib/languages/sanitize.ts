// Deterministic post-processing sanitizer for Slovenian AI-generated output.
// Applied to cards[].content after generation when outputLanguage === "sl".
//
// Three categories of leakage that prompt guidance alone doesn't prevent:
//   1. Cyrillic characters: Slovenian is Latin-only; strip any that slip through.
//   2. Croatian/Serbian-specific diacritics: ć→č, đ→dž (not in Slovenian alphabet).
//   3. Forbidden mannequin forms: mannequin* (AI loanword) → lutke (Slovenian).
//
// This is intentionally conservative: it only removes things that are provably
// wrong in Slovenian. It does not attempt to correct grammar or word order.
export function sanitizeSlovenianOutput(text: string): string {
  return text
    // Strip Cyrillic Unicode blocks (U+0400-U+052F)
    .replace(/[Ѐ-ԯ]/g, "")
    // ć → č (Croatian/Serbian phoneme absent from Slovenian)
    .replace(/ć/g, "č")
    .replace(/Ć/g, "Č")
    // đ → dž (closest Slovenian equivalent; đ not in Slovenian alphabet)
    .replace(/đ/g, "dž")
    .replace(/Đ/g, "Dž")
    // Replace all mannequin case forms with neutral Slovenian "lutke"
    // (mannequin/mannequini/mannequinom/mannequinih/mannequinov → lutke)
    .replace(/\bmannequin[a-z]*/gi, "lutke")
    // Collapse doubled spaces left by Cyrillic removal
    .replace(/ {2,}/g, " ")
    .trim();
}
