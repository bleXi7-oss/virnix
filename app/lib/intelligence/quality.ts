// Virnix Intelligence Layer — Quality Scoring
//
// Deterministic heuristic scoring for generated content.
// No AI calls, no ML, no external dependencies.
// Returns approximate 0–100 virality score based on structural signals.
//
// Use as a foundation for future ranking, filtering, or A/B selection.
// Do not treat scores as ground truth — they are fast proxies, not human judgement.

// ─── Signal word lists ────────────────────────────────────────────────────────

const EMOTIONAL_WORDS = [
  "wrong", "mistake", "failed", "discovered", "secret", "shocked",
  "truth", "never", "always", "actually", "surprisingly", "finally",
  "realized", "warning", "stop", "avoid", "proven", "regret",
  "lost", "quit", "changed", "broke", "built", "tested",
] as const;

const CURIOSITY_PHRASES = [
  "nobody tells you",
  "nobody talks about",
  "the real reason",
  "here's the thing",
  "i only found",
  "stop scrolling",
  "most people",
  "the truth about",
  "here's what",
  "i was wrong",
  "here's why",
  "you're doing",
  "they don't want you",
  "what nobody",
] as const;

const HOOK_OPENERS = [
  "i lost", "i made", "i quit", "i tested", "i spent", "i built",
  "we made", "stop doing", "this one thing", "here's why", "i was",
  "i used to", "years ago", "18 months", "i realized",
] as const;

// Platform-native vocabulary per platform key (lowercase)
const PLATFORM_SIGNALS: Record<string, readonly string[]> = {
  tiktok:    ["here's the exact", "system", "pov:", "stop scrolling", "here's why"],
  twitter:   ["1/", "thread:", "most people", "unpopular opinion", "here's a framework"],
  linkedin:  ["i used to", "years ago", "here's what i learned", "↓", "→", "i almost"],
  instagram: ["→", "save this", "pov", "📌", "🧠", "here's the truth"],
  youtube:   ["how to", "why you", "the truth", "you need to", "i tried", "i tested"],
} as const;

// ─── Individual signal checks ─────────────────────────────────────────────────

// Returns true if the opening 200 chars exhibit strong hook patterns.
export function hasStrongHook(text: string): boolean {
  const first200 = text.slice(0, 200).toLowerCase();
  const hasOpener = HOOK_OPENERS.some((h) => first200.includes(h));
  const hasNumber = /\d+/.test(first200);
  const hasContrast = /\b(but|however|until|wrong|instead|despite|yet)\b/.test(first200);
  return hasOpener || (hasNumber && hasContrast);
}

// Returns true if the text uses curiosity-gap language.
export function hasCuriosityGap(text: string): boolean {
  const lower = text.toLowerCase();
  return CURIOSITY_PHRASES.some((p) => lower.includes(p));
}

// Returns true if the text contains platform-native vocabulary for the given platform.
export function hasPlatformLanguage(text: string, platform: string): boolean {
  const lower = text.toLowerCase();
  const signals = PLATFORM_SIGNALS[platform] ?? [];
  return signals.some((s) => lower.includes(s));
}

// Returns true if the text contains at least 2 emotional trigger words.
export function hasEmotionalWords(text: string): boolean {
  const lower = text.toLowerCase();
  let count = 0;
  for (const w of EMOTIONAL_WORDS) {
    if (lower.includes(w)) count++;
    if (count >= 2) return true;
  }
  return false;
}

// ─── Composite virality score ─────────────────────────────────────────────────

// Returns an approximate 0–100 score based on structural signals.
// Not a predictor of real-world performance — use as a relative ranking signal only.
export function estimateViralityScore(text: string, platform = "general"): number {
  if (!text.trim()) return 0;
  let score = 0;
  if (hasStrongHook(text))              score += 30;
  if (hasCuriosityGap(text))            score += 25;
  if (hasEmotionalWords(text))          score += 20;
  if (hasPlatformLanguage(text, platform)) score += 15;
  if (/\d+/.test(text))                 score += 10; // contains specific numbers
  return Math.min(score, 100);
}
