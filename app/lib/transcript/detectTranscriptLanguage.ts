// Transcript source language detection — guards against silently generating from
// mismatched captions (e.g. Turkish captions when output is Slovenian).
//
// Detection priority: Supadata metadata first, script heuristics as fallback.
// Latin-only script detection cannot distinguish Turkish from English without
// metadata; heuristics are only used when metadata is absent.

export type TranscriptScript =
  | "arabic_dominant"    // > 50% Arabic/RTL letter chars
  | "cyrillic_dominant"  // > 50% Cyrillic letter chars
  | "cjk_dominant"       // > 50% CJK letter chars
  | "mixed"              // 15–50% non-Latin chars
  | "latin_dominant"     // < 15% non-Latin chars
  | "no_letters";        // No recognizable letter characters

// ─── Unicode ranges ───────────────────────────────────────────────────────────

const ARABIC_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const CYRILLIC_RE = /[Ѐ-ӿԀ-ԯ]/g;
// CJK Unified Ideographs, CJK punctuation, Katakana, Hiragana, Hangul
const CJK_RE =
  /[　-鿿豈-﫿︰-﹏가-힯]/g;
const LATIN_RE = /[a-zA-Z]/g;

// ─── Script detection ─────────────────────────────────────────────────────────

export function detectTranscriptScript(text: string): TranscriptScript {
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const cyrillic = (text.match(CYRILLIC_RE) ?? []).length;
  const cjk = (text.match(CJK_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  const nonLatin = arabic + cyrillic + cjk;
  const total = nonLatin + latin;

  if (total === 0) return "no_letters";

  const ratio = nonLatin / total;

  if (ratio > 0.50) {
    if (arabic >= cyrillic && arabic >= cjk) return "arabic_dominant";
    if (cyrillic >= arabic && cyrillic >= cjk) return "cyrillic_dominant";
    return "cjk_dominant";
  }
  if (ratio > 0.15) return "mixed";
  return "latin_dominant";
}

// ─── Language code normalization ──────────────────────────────────────────────
// Strips subtag and lowercases. en-US → en, en_US → en, sl-SI → sl, sr-Latn → sr.
// Handles both BCP 47 dash separator and the underscore variant some APIs return.

export function normalizeLangCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.split(/[-_]/)[0].toLowerCase();
}

// Codes that mean "language could not be determined" — treat same as absent metadata.
// "und" = undetermined (ISO 639-3), "zxx" = no linguistic content, "mis" = uncoded,
// "mul" = multiple languages. Supadata returns "und" for some auto-generated tracks.
const UNDETERMINED_CODES = new Set(["und", "zxx", "mis", "mul"]);

// ─── Transcript safety check — metadata-first ────────────────────────────────
//
// Returns true when it is safe to proceed with AI generation without warning.
//
// Rules:
//   1. outputLanguage === "auto" → always safe (user accepts transcript language)
//   2. Transcript lang matches output lang → safe
//   3. Transcript lang is English → safe (translation to target is standard)
//   4. No metadata or undetermined code (und/zxx/mis/mul):
//      - Latin or no_letters script → safe (can't distinguish languages by script alone)
//      - Non-Latin script → unsafe (Cyrillic/CJK/Arabic strongly suggests mismatch)
//   5. Any other known language that differs from output → unsafe

export function isTranscriptSafe(
  transcriptLang: string | null | undefined,
  outputLanguage: string,
  script: TranscriptScript,
): boolean {
  if (outputLanguage === "auto") return true;

  const normalizedOutput = normalizeLangCode(outputLanguage);
  const normalizedTranscript = normalizeLangCode(transcriptLang);

  if (!normalizedTranscript || UNDETERMINED_CODES.has(normalizedTranscript)) {
    // No metadata or undetermined language — fall back to script heuristics
    return script === "latin_dominant" || script === "no_letters";
  }

  if (normalizedTranscript === normalizedOutput) return true;
  if (normalizedTranscript === "en") return true;

  return false;
}

// Kept for backward compatibility with existing callers.
export function shouldWarnTranscript(
  script: TranscriptScript,
  outputLanguage: string,
  supadataLang?: string | null,
): boolean {
  return !isTranscriptSafe(supadataLang, outputLanguage, script);
}

// ─── Display helpers ──────────────────────────────────────────────────────────

// RTL check for source text display (30% threshold — same logic as generate.ts).
export function isRtlDominatedText(text: string): boolean {
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  if (arabic + latin === 0) return false;
  return arabic / (arabic + latin) > 0.30;
}

// Broader non-Latin dominance check for source preview hiding.
// Covers Arabic, Cyrillic, CJK when any single script exceeds 30% of letters.
export function isNonLatinDominatedText(text: string): boolean {
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const cyrillic = (text.match(CYRILLIC_RE) ?? []).length;
  const cjk = (text.match(CJK_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  const nonLatin = arabic + cyrillic + cjk;
  if (nonLatin + latin === 0) return false;
  return nonLatin / (nonLatin + latin) > 0.30;
}

// Whether to hide a sourceTextPreview in the Strongest Moments UI.
// Hides when the text itself looks non-Latin, or when metadata confirms a
// language mismatch with the output (to avoid showing raw foreign text as
// if it were generated output).
export function shouldHideSourcePreview(
  text: string,
  transcriptLang: string | null | undefined,
  outputLanguage: string | null | undefined,
): boolean {
  if (isNonLatinDominatedText(text)) return true;
  if (!transcriptLang || !outputLanguage) return false;
  if (outputLanguage === "auto") return false;
  const nl = normalizeLangCode(transcriptLang);
  const no_ = normalizeLangCode(outputLanguage);
  // Transcript is English → no need to hide (translation happened normally)
  if (nl === "en") return false;
  // Transcript matches output → no need to hide
  if (nl === no_) return false;
  // Different known language → hide the raw excerpt
  return true;
}

// Label for the collapsed source preview toggle.
// Returns e.g. "Original captions · Turkish" if lang is known.
export function getSourcePreviewLabel(
  transcriptLang: string | null | undefined,
): string {
  const name = transcriptLang ? langCodeToName(transcriptLang) : null;
  return name ? `Original captions · ${name}` : "Original transcript excerpt";
}

// ─── RTL language code check ──────────────────────────────────────────────────

const RTL_CODES = new Set(["ar", "fa", "he", "ur", "yi", "dv", "ckb", "ps"]);

export function isRtlLangCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return RTL_CODES.has(normalizeLangCode(code) ?? "");
}

// ─── Language name lookup ─────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  ar: "Arabic",    fa: "Farsi",      he: "Hebrew",   ur: "Urdu",
  yi: "Yiddish",   dv: "Dhivehi",    ckb: "Kurdish", ps: "Pashto",
  zh: "Chinese",   ja: "Japanese",   ko: "Korean",
  hi: "Hindi",     th: "Thai",
  ru: "Russian",   uk: "Ukrainian",  bg: "Bulgarian",
  sr: "Serbian",   mk: "Macedonian", be: "Belarusian",
  en: "English",   de: "German",     fr: "French",    es: "Spanish",
  it: "Italian",   pt: "Portuguese", nl: "Dutch",     pl: "Polish",
  sv: "Swedish",   da: "Danish",     no: "Norwegian", fi: "Finnish",
  tr: "Turkish",   id: "Indonesian", vi: "Vietnamese", ms: "Malay",
  cs: "Czech",     sk: "Slovak",     ro: "Romanian",
  sl: "Slovenian", hr: "Croatian",   bs: "Bosnian",
  hu: "Hungarian", el: "Greek",      et: "Estonian",
  lv: "Latvian",   lt: "Lithuanian",
};

export function langCodeToName(code: string | null | undefined): string {
  if (!code) return "unknown";
  const base = normalizeLangCode(code) ?? "";
  return LANG_NAMES[base] ?? code.toUpperCase();
}

// ─── Warning copy builders ────────────────────────────────────────────────────

export function buildTranscriptWarningCopy(
  transcriptLangName: string,
  outputLangLabel: string,
  hasEnglishFallback: boolean,
): string {
  const base =
    `Virnix found ${transcriptLangName} captions for this video. ` +
    `Your selected output language is ${outputLangLabel}. ` +
    `This may be the wrong caption track or an auto-translated transcript. ` +
    `Virnix can continue, but meaning may be approximate.`;
  return hasEnglishFallback
    ? base + " You can also try fetching English captions instead."
    : base;
}

// Non-blocking copy for manual paste transcript language mismatch.
export function buildPasteWarningCopy(
  script: TranscriptScript,
  outputLangLabel: string,
): string {
  const scriptName =
    script === "arabic_dominant" ? "Arabic/RTL"
    : script === "cyrillic_dominant" ? "Cyrillic"
    : script === "cjk_dominant" ? "Chinese/Japanese/Korean"
    : "a non-Latin script";
  return (
    `Your pasted transcript appears to be in ${scriptName}. ` +
    `Virnix will generate in ${outputLangLabel}, but translation may be approximate.`
  );
}
