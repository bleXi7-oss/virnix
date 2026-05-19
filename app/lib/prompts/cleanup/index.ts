// Output cleanup and quality control rules.
// These catch common AI writing patterns that make content sound generated, not human.
// Applied globally in buildPrompt so every platform benefits.

// Sentence-level fixes that strip filler and tighten copy.
export const CLEANUP_RULES = [
  "Strip filler: 'It's important to note that', 'As we can see', 'In conclusion'",
  "One idea per sentence — split compound sentences at 'and' or 'but'",
  "Active voice: 'Creators use this' not 'This is used by creators'",
  "Cut the last sentence — first drafts always end one beat too late",
  "Remove throat-clearing: 'So basically', 'What I mean is', 'The thing is'",
  "Contrast creates tension: one short punchy sentence. Then a longer one that earns it.",
] as const;

// Formatting rules that create visual rhythm and readability on feeds.
export const VIRAL_FORMATTING_RULES = [
  "Short lines create visual rhythm — use them intentionally",
  "White space is engagement: break at natural pauses",
  "The hook earns the reader's next 3 seconds, nothing more",
  "Save the sharpest insight for the final line, not the first",
  "Contrast creates tension: one short sentence. Then explain it with a longer one.",
  "The reader should feel smarter at the end — not just informed",
] as const;
