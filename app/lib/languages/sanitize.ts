// Deterministic post-processing sanitizer for Slovenian AI-generated output.
// Applied to cards[].content after generation when outputLanguage === "sl".
//
// Categories of leakage that prompt guidance alone doesn't prevent:
//   1. Cyrillic characters: Slovenian is Latin-only; strip any that slip through.
//   2. Croatian/Serbian-specific diacritics: ć→č, đ→dž (not in Slovenian alphabet).
//   3. Forbidden mannequin forms: mannequin* (AI loanword) → lutke (Slovenian).
//   4. English scaffold phrases that leak into Slovenian output → translated.
//   5. Known recurring Slovenian typos / malformed words → corrected form.
//
// This is intentionally conservative: it only changes things that are provably
// wrong in Slovenian. It does not attempt to build a grammar engine, and the
// word-fix list contains only tokens that are NOT valid Slovenian — so a fix can
// never damage correct text.

// Slovenian + Croatian/Serbian letter class for word-boundary assertions.
// JS \b only recognizes [A-Za-z0-9_], so it breaks around words that contain or
// end in š, ž, č, ć, đ (e.g. "zapusteš", "najlaži"). We assert non-letter
// boundaries explicitly with look-arounds instead of relying on \b.
const SL_LETTER = "a-zA-ZčšžćđČŠŽĆĐ";

// Known recurring Slovenian typos / malformed words → corrected form.
// Whole-token replacement only, with capitalization preserved. Every left-hand
// side is NOT a valid Slovenian word, so replacement is always safe.
const SL_WORD_FIXES: ReadonlyArray<readonly [string, string]> = [
  ["tvojot", "tvoj"],         // "tvojot fokus" → "tvoj fokus"
  ["zapusteš", "zapustiš"],   // "zapusteš aplikacijo" → "zapustiš aplikacijo"
  ["najlaži", "najlažji"],    // "Najlaži začetek" → "Najlažji začetek"
  ["zde", "zdaj"],            // "Zde je koristen način" → "Zdaj je koristen način"
  ["prepisodek", "prepis"],   // malformed blend → "prepis"
  ["mozeg", "možgani"],       // missing diacritic / wrong stem → "možgani"
  ["transcript", "prepis"],   // English word leak → "prepis" (matches nativeNote guidance)
];

// English "scaffold" phrases that leak into Slovenian output. Translated to
// natural Slovenian rather than deleted so the card stays meaningful. Apostrophe
// class covers straight (') and curly (’) variants the model may emit.
const SL_SCAFFOLD_TRANSLATIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bnobody talks about this\b/gi, "O tem nihče ne govori"],
  [/\bhere(?:['’]s| is) the pattern\b/gi, "To je vzorec"],
  [/\bhere(?:['’]s| is) what this reveals\b/gi, "To razkriva naslednje"],
  [/\bthis is the useful way to think about it\b/gi, "Tako je koristno razmišljati o tem"],
];

// Replace a standalone Slovenian token, preserving the original capitalization
// (all-caps → all-caps, Title → Title, lower → lower).
function fixSlovenianWord(text: string, target: string, replacement: string): string {
  const re = new RegExp(`(?<![${SL_LETTER}])${target}(?![${SL_LETTER}])`, "gi");
  return text.replace(re, (match) => {
    if (match === match.toUpperCase() && match !== match.toLowerCase()) {
      return replacement.toUpperCase();
    }
    if (match[0] !== match[0].toLowerCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

export function sanitizeSlovenianOutput(text: string): string {
  let out = text
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
    .replace(/\bmannequin[a-z]*/gi, "lutke");

  // Translate leaked English scaffold phrases to natural Slovenian.
  for (const [re, replacement] of SL_SCAFFOLD_TRANSLATIONS) {
    out = out.replace(re, replacement);
  }

  // Fix known recurring Slovenian typos / malformed words.
  for (const [target, replacement] of SL_WORD_FIXES) {
    out = fixSlovenianWord(out, target, replacement);
  }

  // Collapse doubled spaces left by Cyrillic removal, then trim.
  return out.replace(/ {2,}/g, " ").trim();
}
