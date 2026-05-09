// YouTube title formulas and rules.
// Titles are the highest-leverage creative decision on YouTube — they determine click-through rate.
// Good titles are specific, front-loaded, and deliver on their promise.

// Proven structural formulas for high-CTR YouTube titles.
export const YOUTUBE_TITLE_FORMULAS = [
  "Curiosity gap: 'The [Thing] Nobody Talks About'",
  "Transformation: 'How I [Result] Without [Common Excuse]'",
  "Number hook: 'I Did X for 30 Days — Here's What Happened'",
  "Contrarian: 'Stop [Popular Thing] — Do This Instead'",
  "Before/after: '[Problem State] to [Result]: The Full System'",
  "Data hook: 'I Studied [Number] [People/Cases] — Here's the Pattern'",
  "Confession: 'I Was Wrong About [Conventional Wisdom] for Years'",
] as const;

// Quality rules that prevent weak or misleading titles.
export const YOUTUBE_TITLE_RULES = [
  "No clickbait that the video doesn't deliver on",
  "Front-load the hook — the first 6 words are what viewers scan",
  "Numbers and specifics outperform vague superlatives",
  "Question titles perform in search; statement titles perform in feeds",
  "Avoid overused phrases: 'Ultimate Guide', 'Changed My Life', 'Nobody Talks About'",
  "The best titles create a knowledge gap the viewer must close by watching",
] as const;
