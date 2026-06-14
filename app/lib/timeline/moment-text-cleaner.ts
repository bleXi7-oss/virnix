// Transcript window text cleaner for moment detection.
// Guards against YouTube auto-caption artifacts: zero-width characters,
// duplicate subtitle fragments, reaction sounds, and punctuation noise.
// All functions are deterministic and have no side effects.

// Zero-width and invisible Unicode characters common in YouTube subtitle exports.
// U+200B ZWS, U+200C ZWNJ, U+200D ZWJ, U+FEFF BOM,
// U+00AD soft-hyphen, U+2060 word-joiner, U+180E Mongolian vowel separator.
const INVISIBLE_CHAR_RE = /[​‌‍﻿­⁠᠎]/g;

// Normalize transcript window text: strip invisible chars, collapse whitespace,
// and reduce punctuation runs (!!!!! → !!) to prevent noise score inflation.
export function cleanWindowText(raw: string): string {
  return raw
    .replace(INVISIBLE_CHAR_RE, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([!?…]{3,})/g, (m) => m.slice(0, 2))
    .trim();
}

// Collapse duplicate adjacent sentences/fragments — catches YouTube subtitle
// repetition where the same phrase appears twice with invisible spacing chars.
// Clean the text first so invisible chars don't prevent sentence splitting.
export function collapseRepeatedFragments(text: string): string {
  const parts = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const key = part.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(part.trim());
  }
  return result.join(" ");
}

// Known reaction sounds and interjections with zero semantic content.
// Matched case-insensitively against individual words (letters only).
const NOISE_WORD_RE =
  /^(n+o+|y+e+a+h?|w+o+|o+h+|a+h+|e+h+|u+g+h+|h+m+|h+e+h+|h+a+h?|h+a+|a+w+|w+o+w+|e+u+h?|u+m+|u+h+|e+r+)$/i;

// A word counts as "meaningful" when it has >= 3 letters and is not a pure
// reaction sound / interjection.
function isMeaningfulWord(word: string): boolean {
  const letters = word.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  // Explicit reaction sounds (heh, noo, yeah, etc.)
  if (NOISE_WORD_RE.test(letters)) return false;
  // Reject words with a single letter repeated 3+ times (NOOooo, heehhh, eeuuHHH)
  if (/(.)\1{2,}/i.test(letters)) return false;
  // Reject words composed entirely of vowels + h (pure vocalization: eeuuu, ohhh)
  if (/^[aeiouAEIOUhH]+$/.test(letters)) return false;
  return true;
}

// Count words with genuine semantic content in a text fragment.
export function countMeaningfulWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).filter(isMeaningfulWord).length;
}

// Fraction of non-whitespace characters that are alphabetic letters.
// Low values indicate symbol/punctuation-heavy garbage.
function alphabeticRatio(text: string): number {
  const nonWS = text.replace(/\s/g, "");
  if (!nonWS) return 0;
  const letters = (nonWS.match(/[a-zA-Z]/g) ?? []).length;
  return letters / nonWS.length;
}

// Returns true when a transcript window text is too noisy/low-semantic to
// qualify as a Strongest Moment. Applied to the raw window text before
// any further processing.
//
// Thresholds are deliberately conservative (low bars) to avoid false positives:
//   5 meaningful words in 30 seconds ≈ 6–8% of normal speech density
//   0.40 alpha ratio: allows punctuation/emoji but rejects symbol-only garbage
export function isLowSemanticContent(rawText: string): boolean {
  // Clean invisible chars first so they don't prevent sentence dedup splitting
  const cleaned = collapseRepeatedFragments(cleanWindowText(rawText));
  if (cleaned.length < 20) return true;
  if (countMeaningfulWords(cleaned) < 5) return true;
  if (alphabeticRatio(cleaned) < 0.40) return true;
  return false;
}

// Find the first sentence in text that contains at least minWords meaningful
// words. Used in buildSuggestedHook to skip noise sentences (e.g. "NOOooo…
// Close!") and surface the first real content sentence as the hook opener.
// Falls back to the naive first-sentence regex, then the raw text prefix.
export function findFirstMeaningfulSentence(text: string, minWords = 4): string {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  for (const sentence of sentences) {
    if (countMeaningfulWords(sentence) >= minWords) return sentence.trim();
  }
  // Fallback: original naive behavior
  return text.match(/[^.!?]+[.!?]/)?.[0]?.trim() ?? text.slice(0, 80).trim();
}
