// Deterministic post-processing sanitizer for Slovenian AI-generated output.
// Applied to cards[].content after generation when outputLanguage === "sl".
//
// Categories of leakage that prompt guidance alone doesn't prevent:
//   1. Cyrillic characters: Slovenian is Latin-only; strip any that slip through.
//   2. Croatian/Serbian-specific diacritics: ć→č, đ→dž (not in Slovenian alphabet).
//   3. Forbidden mannequin forms: mannequin* (AI loanword) → lutke (Slovenian).
//   4. English scaffold phrases that leak into Slovenian output → translated.
//   5. Known recurring Slovenian typos / malformed words → corrected form.
//   6. Known awkward / wrong-case / leaked phrases → exact natural-Slovenian form.
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
  // QA-E:
  ["stimule", "dražljaje"],   // Serbian/Croatian/Latin loanword → "dražljaje"
  ["podcástom", "podcastom"], // foreign acute accent (á) → plain "podcastom"
  // QA-F:
  ["boredom", "dolgočasje"],  // English word leak → "dolgočasje"
  ["prebraneš", "prebereš"],  // malformed verb → "prebereš" (you read)
];

// Known awkward / wrong-case / leaked phrases → exact natural-Slovenian form.
// Whole-phrase replacement with first-letter capitalization following the match.
// Each left-hand side is an exact production string that is provably wrong or
// non-Slovenian — never a phrase that valid Slovenian content would contain.
// SL_LETTER look-arounds gate the short fragments so they only match standalone.
const SL_PHRASE_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  // 1. English leakage → translated (period/punctuation after the phrase is kept)
  [/learning is repeated recall, not repeated exposure/gi,
    "Učenje je priklic, ne ponovna izpostavljenost"],
  // 2. Wrong preposition: "s" (not "z") before voiceless "t"
  [new RegExp(`(?<![${SL_LETTER}])z telefonom(?![${SL_LETTER}])`, "gi"),
    "s telefonom"],
  // 3. Wrong noun case: "možgani" is plural-only → dative plural "možganom"
  [new RegExp(`(?<![${SL_LETTER}])tvojemu možganu(?![${SL_LETTER}])`, "gi"),
    "tvojim možganom"],
  // 5. Awkward Slovenian phrase → natural rewrite
  [/pred delom namerno naloži dolgočasje/gi,
    "Pred delom si namerno vzemi nekaj minut dolgočasja"],
  // 7. Latin/Balkan word leakage → Slovenian
  [new RegExp(`(?<![${SL_LETTER}])contra vsemu(?![${SL_LETTER}])`, "gi"),
    "v nasprotju z vsem"],
  // 8. Broken two-sentence fragment → single natural sentence
  [/odmore se ti po delu\.\s+to je problem\./gi,
    "Tvoji odmori po delu so problem."],
  // QA-F:
  // 1. Adjective gender agreement: "mehanizem" is masculine → "kontraintuitiven"
  [new RegExp(`(?<![${SL_LETTER}])mehanizem je kontraintuitivna(?![${SL_LETTER}])`, "gi"),
    "mehanizem je kontraintuitiven"],
  // 2. Wrong preposition: "s" (not "z") before voiceless "š"
  [new RegExp(`(?<![${SL_LETTER}])z ščepcem(?![${SL_LETTER}])`, "gi"),
    "s ščepcem"],
  // 3. Gender-mixed first-person sentence → masculine-consistent (spraševala → spraševal)
  [/pil sem kavo ob 7h in se spraševala, zakaj sem ob 15h popolnoma mrtev\./gi,
    "Pil sem kavo ob 7h in se spraševal, zakaj sem ob 15h popolnoma mrtev."],
  // 4. English slang leakage → Slovenian
  [new RegExp(`(?<![${SL_LETTER}])popravi crashe(?![${SL_LETTER}])`, "gi"),
    "popravi popoldanske padce"],
  // 5. English academic phrase → Slovenian
  [new RegExp(`(?<![${SL_LETTER}])peer-reviewed raziskav(?![${SL_LETTER}])`, "gi"),
    "recenziranih raziskav"],
  // 6. Wrong noun case: nominative "Problem", not genitive "Problema"
  [new RegExp(`(?<![${SL_LETTER}])problema je to(?![${SL_LETTER}])`, "gi"),
    "Problem je to"],
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

// Replace a whole phrase, making the replacement's first letter follow the
// case of the matched text (upper-initial match → upper-initial replacement).
function applyPhraseFix(text: string, re: RegExp, replacement: string): string {
  return text.replace(re, (match) => {
    const first = match[0];
    const matchedUpper = first !== first.toLowerCase() && first === first.toUpperCase();
    return matchedUpper
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement[0].toLowerCase() + replacement.slice(1);
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

  // Replace known awkward / wrong-case / leaked phrases with natural Slovenian.
  for (const [re, replacement] of SL_PHRASE_FIXES) {
    out = applyPhraseFix(out, re, replacement);
  }

  // Fix known recurring Slovenian typos / malformed words.
  for (const [target, replacement] of SL_WORD_FIXES) {
    out = fixSlovenianWord(out, target, replacement);
  }

  // Collapse doubled spaces left by Cyrillic removal, then trim.
  return out.replace(/ {2,}/g, " ").trim();
}
