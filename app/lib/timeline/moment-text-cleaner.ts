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

// Collapse duplicate comma-separated phrase fragments within a sentence.
// YouTube caption buffering can produce "phrase, same phrase" inline patterns
// that collapseRepeatedFragments (sentence-level) misses because commas are
// not sentence terminators. Example:
//   "We KNEW it was the wrong one, We KNEW it was the wrong one..."
//   → "We KNEW it was the wrong one..."
// Comparison is case-insensitive and strips trailing punctuation so
// "phrase" and "phrase..." or "phrase," are treated as the same fragment.
export function collapseCommaRepetitions(text: string): string {
  const parts = text.split(/,\s+/).filter(Boolean);
  if (parts.length <= 1) return text;
  const seenKeys: string[] = [];
  const result: string[] = [];
  for (const part of parts) {
    const key = part.trim().toLowerCase().replace(/[.!?,;……]+$/, "").replace(/\s+/g, " ");
    if (!key) continue;
    // Exact duplicate OR a prior part ends with this key at a word boundary.
    // Catches "I used to believe [X], [X]" where [X] is a suffix of the first part.
    const covered = seenKeys.some((k) => {
      if (k === key) return true;
      if (!k.endsWith(key)) return false;
      const boundary = k[k.length - key.length - 1];
      return boundary === " ";
    });
    if (covered) continue;
    seenKeys.push(key);
    result.push(part.trim());
  }
  if (result.length === parts.length) return text;
  return result.join(", ");
}

// Collapse duplicate adjacent sentences/fragments — catches YouTube subtitle
// repetition where the same phrase appears twice with invisible spacing chars.
// Clean the text first so invisible chars don't prevent sentence splitting.
//
// Also handles suffix repetition: when a short sentence S2 appears verbatim at
// the end of a previously-seen longer sentence S1 (preceded by space or comma),
// S2 is redundant and skipped. This covers the pattern produced by YouTube caption
// buffering after collapseCommaRepetitions deduplicates a comma-group:
//   "S1, S2!" → "S2!" (standalone)  — "S2!" is a suffix of "S1, S2!" → removed.
export function collapseRepeatedFragments(text: string): string {
  const parts = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const seenKeys: string[] = [];
  const result: string[] = [];
  for (const part of parts) {
    const key = part.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) continue;
    const covered = seenKeys.some((k) => {
      if (k === key) return true;
      if (!k.endsWith(key)) return false;
      // Only count as covered when the suffix begins at a word boundary
      // (space or comma) — prevents partial-word false matches.
      const boundary = k[k.length - key.length - 1];
      return boundary === " " || boundary === ",";
    });
    if (covered) continue;
    seenKeys.push(key);
    result.push(part.trim());
  }
  return result.join(" ");
}

// Full display cleaning pipeline: sentence-level dedup (with suffix coverage),
// then comma-level dedup. Apply to any moment text field before display.
export function cleanMomentDisplayText(rawText: string): string {
  return collapseCommaRepetitions(collapseRepeatedFragments(cleanWindowText(rawText)));
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

// Count UNIQUE meaningful words — collapses inline repetitions.
// YouTube auto-caption buffering produces "phrase-- same phrase" patterns
// within a single sentence where collapseRepeatedFragments (sentence-level)
// doesn't help. Raw countMeaningfulWords sees 10 tokens for a 5-word phrase
// repeated twice. This function returns 5 instead, preventing the ≥7
// word-count fallback in isDisplayQualityHook from being gamed.
export function countUniqueMeaningfulWords(text: string): number {
  const unique = new Set(
    text.split(/\s+/).filter(Boolean)
      .filter(isMeaningfulWord)
      .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
      .filter(Boolean)
  );
  return unique.size;
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

// Fraction of word tokens in text that are NOT meaningful (noise/short/sound).
export function noiseTokenRatio(text: string): number {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const noiseCount = tokens.filter((w) => !isMeaningfulWord(w)).length;
  return noiseCount / tokens.length;
}

// Returns text trimmed to start at the first sentence with >= minWords
// meaningful words. Used for sourceTextPreview so it does not open with
// noise lines like "NOOooo…" or "eeuuHHH heh heehhh..".
// Falls back to the full text when no sentence meets the threshold (keeps
// short punchy confessional windows like "I quit. I was wrong." intact).
export function trimToMeaningfulStart(text: string, minWords = 4): string {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
  for (let i = 0; i < sentences.length; i++) {
    if (countMeaningfulWords(sentences[i]) >= minWords) {
      return sentences.slice(i).join(" ").trim();
    }
  }
  return text.trim();
}

// Second-level noise gate — applied after isLowSemanticContent.
// Catches windows that scraped past the 5-meaningful-word floor but still
// have no extractable sentence worth showing as a Strongest Moment.
//
// Gate 1: no single sentence reaches 3 meaningful words → nothing to quote.
//   Catches: "NOOooo… Close! It was close. It was epic!! NOOO!!"
//            "Close! Close! It was close. It was epic."
//
// Gate 2 (≥3 sentences): >55% of sentences are short exclamation/trailing
//   fragments with ≤2 meaningful words → window is exclamation-dominant.
//   Catches: "NOOooo… Close! It was close. It was epic!! Actually that was cool."
//            (4 of 5 sentences are short !… fragments → 80% > 55%)
//
// Thresholds are deliberately permissive to avoid rejecting punchy short
// confessional content ("I quit. I was wrong. That changed everything.").
export function isNoiseHeavy(rawText: string): boolean {
  const cleaned = collapseRepeatedFragments(cleanWindowText(rawText));
  const sentences = cleaned.split(/(?<=[.!?…])\s+/).filter(Boolean);
  if (sentences.length === 0) return true;

  const maxMeaningful = Math.max(0, ...sentences.map(countMeaningfulWords));
  if (maxMeaningful < 3) return true;

  if (sentences.length >= 3) {
    const noisySentences = sentences.filter(
      (s) => /[!…]$/.test(s.trim()) && countMeaningfulWords(s) <= 2
    ).length;
    if (noisySentences / sentences.length > 0.55) return true;
  }

  return false;
}

// Vocabulary that signals a sentence carries transferable insight — causation,
// realization, mechanism, comparison, scale, or emotional truth. Used by
// isDisplayQualityHook to accept good moments without requiring long sentences.
const INSIGHT_VOCAB_RE =
  /because|the reason|that'?s why|which is why|leads to|results in|the real reason|cause of|realize|realise|understand|discover|figured out|turns out|found out|instead of|rather than|strategy|system|mechanism|method|approach|technique|the key|the secret|how to|always|never|most people|no one|everyone|nobody|faster than|better than|worse than|more than|less than|compared to|actually|in reality|struggling|failing|failed|afraid|fear|doubt|wrong about|mistake|regret|million|billion|thousand|percent|subscribers|followers|years of|decades|not about|isn'?t about|it'?s not about|not just|the opposite|nothing to do with/i;

// True when a sentence contains at least one concept word that signals
// transferable, context-independent insight.
export function hasInsightVocabulary(text: string): boolean {
  return INSIGHT_VOCAB_RE.test(text);
}

// Final display gate applied to the extracted hook sentence after all noise
// gates and scoring. A hook sentence passes when it can stand alone as a
// clip opener for a creator who wasn't in the room.
//
// Passes when the sentence:
//   a) contains insight vocabulary (causation/mechanism/scale/pain), OR
//   b) has >= 7 UNIQUE meaningful words AND contains no "--"
//      (unique count prevents repeated-phrase inflation; "--" check blocks
//       YouTube caption buffering artifacts like
//       "phrase-- same phrase-- trailing bonus phrase" where extra trailing
//       text adds new unique words beyond the repeated fragment)
//
// Always rejects questions (ends with "?") — questions without answers are
// not useful as standalone clip openers for repurposed content.
//
// Rejects: "that just made it a little weird…"                      (5 unique)
//          "I was team Vanoss over Speedy-- [dup]"                  (has --)
//          "...but-- ...but-- There's no sweating."                 (has --)
//          "So when he did that breath, what'd you notice?"         (question)
// Allows:  "500 million subscribers still doesn't feel real"        (insight)
//          "The team moved faster than solo players"                 (insight)
//          "Someone advanced by watching where others submitted answers" (7 unique, no --)
export function isDisplayQualityHook(hookSentence: string): boolean {
  if (/\?$/.test(hookSentence.trim())) return false;
  if (hasInsightVocabulary(hookSentence)) return true;
  // "--" in a hook is a YouTube caption buffering artifact. Trailing fragments
  // can inject new unique words (e.g. "There's no sweating.") that push the
  // unique word count past the ≥7 threshold even though the core phrase is garbage.
  if (hookSentence.includes("--")) return false;
  return countUniqueMeaningfulWords(hookSentence) >= 7;
}

// Regexes for concrete educational content — required before applying the
// "This isn't what you think." mechanism_reframe prefix.
// Educational lectures constantly trigger weak reframe signals ("not just",
// "actually") without offering a genuine paradigm shift. These three categories
// distinguish real educational insight from generic lecture continuation fragments.
const REFRAME_CAUSAL_RE =
  /\b(because|therefore|leads?\s+to|triggers?|causes?|results?\s+in|is\s+why|that'?s\s+why|disrupts?|consolidat(?:es?|ed|ion)?|is\s+what\s+(?:triggers?|causes?|makes?)|reduces?|increases?|impairs?|boosts?|activates?|suppresses?|inhibits?)\b/i;

const REFRAME_MECHANISM_RE =
  /\b(dopamine|acetylcholine|cortisol|serotonin|melatonin|adrenaline|norepinephrine|adenosine|plasticity|neuroplasticity|neural\b|neuron|synapse|prefrontal|amygdala|hippocampus|sleep\s+architecture|deep\s+sleep|rem\s+sleep|circadian|nervous\s+system|testosterone|glucose|insulin|myelin)\b/i;

const REFRAME_EXPERIMENT_RE =
  /\b(stud(?:y|ies)|research|experiment(?:al)?|lab\b|subjects?|clinical\s+trial|evidence|scientific(?:ally)?|researchers?|findings?|peer[\s-]?review)\b/i;

// Returns true when a hook sentence contains concrete educational content that
// justifies the "This isn't what you think." prefix: causal language (triggers,
// disrupts, reduces), named biological/psychological mechanism (dopamine, plasticity,
// deep sleep), or study/experiment language.
// Prevents weak mechanism_reframe signals ("not just", "actually") from
// generating fake reframe moments on educational/talking-head videos.
export function isGenuineReframeConcrete(hookSentence: string): boolean {
  return (
    REFRAME_CAUSAL_RE.test(hookSentence) ||
    REFRAME_MECHANISM_RE.test(hookSentence) ||
    REFRAME_EXPERIMENT_RE.test(hookSentence)
  );
}

// Patterns indicating sponsor/ad-read content — commercial segments that should
// never surface as Strongest Moments. Checked against the full window text so
// that ad segments are blocked even when the hook sentence looks benign.
const SPONSOR_AD_RE =
  /\b(sponsor(?:s|ed|ing|ship)?|today'?s\s+sponsor|link\s+in\s+the\s+description|discount\s+code|use\s+code|biomarkers?|expert\s+physicians?|improve\s+your\s+health\s+and\s+lifespan)\b/i;

// Returns true when the window text is a sponsor/ad-read segment.
export function isSponsorOrAdReadText(text: string): boolean {
  return SPONSOR_AD_RE.test(text);
}

// Patterns that signal a hook sentence is self-referential filler — pointing
// to another episode or the creator's own internal process rather than
// delivering a transferable insight. These produce useless Strongest Moments
// with any prefix ("This isn't what you think. I did an episode on...").
const SELF_REF_EPISODE_RE =
  /\b(i\s+did\s+an\s+episode|last\s+episode|previous\s+episode|prior\s+episode|check\s+out\s+that\s+episode|as\s+i\s+mentioned\s+last\s+episode|this\s+episode\s+on\s+how\s+to|i\s+went\s+to\s+the\s+data\s+to\s+find\s+out|i\s+have\s+my\s+methods)\b/i;

// Returns true when the hook sentence points back to another episode or uses
// creator meta-commentary instead of delivering an actionable insight.
export function isSelfReferentialFillerHook(hookSentence: string): boolean {
  return SELF_REF_EPISODE_RE.test(hookSentence);
}

// Returns true when a hook sentence is a short, complete, standalone claim —
// not a transcript continuation fragment or lecture-transition filler.
// Universal gate applied to ALL moment types (Gate 3b in the pipeline).
// The hook must read as a self-contained assertion that can stand as a pull-quote
// without prior context — not a mid-sentence clip, not a lecture setup phrase.
export function isStandaloneReframeClaim(hookSentence: string): boolean {
  const trimmed = hookSentence.trim();
  if (!trimmed) return false;

  // Continuation fragments always start lowercase — they were clipped from
  // mid-sentence transcript text. Standalone claims start with an uppercase
  // letter or a leading digit (e.g. "7 to 30 minutes of making errors...").
  if (/^[a-z]/.test(trimmed)) return false;

  // Long clipped excerpts are window text pasted verbatim, not tight claims.
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount > 50) return false;

  // Lecture-transition and filler phrases signal the sentence is an in-context
  // setup or instruction, not a standalone claim.
  const lower = trimmed.toLowerCase();
  const FILLER: string[] = [
    "let's talk about",
    "let me talk about",
    "soon you'll understand",
    "as i mentioned",
    "i'll just tell you",
    "so okay",
    "this is where it gets",
    "what i want to do",
    "what we're going to",
    "i want you to",
    "so what i'm saying",
    "what i mean by",
    "and what that means is",
    "what that means is",
    "the goal of today",
    "in today's episode",
  ];
  if (FILLER.some((p) => lower.includes(p))) return false;

  return true;
}
