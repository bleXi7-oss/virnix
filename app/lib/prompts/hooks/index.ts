// Hook patterns and opening formulas for short-form content.
// TikTok and Instagram hooks are especially pattern-sensitive — small wording
// differences have large impact on watch time and engagement.

// Structural hook archetypes that work across platforms.
export const HOOK_PATTERNS = [
  "Pattern interrupt: open with the unexpected before explaining",
  "Bold claim: one specific, defensible claim — no setup",
  "Curiosity gap: hint at the payoff without revealing it",
  "Confession: 'I used to think X. I was completely wrong.'",
  "Social proof inversion: 'Everyone does X — that's why it doesn't work'",
  "Consequence first: start with what happened before explaining why",
  "Counterintuitive number: lead with a specific result that seems wrong",
] as const;

// Proven TikTok/Reels first-line openers.
// Keep the energy abrupt — the algorithm rewards fast hooks.
export const TIKTOK_OPENING_LINES = [
  "Nobody talks about this —",
  "I only found this out by accident.",
  "Everyone's doing this backwards.",
  "Here's the part they always skip:",
  "I wish someone had told me this earlier:",
  "I was wrong about this for years.",
  "The data says something completely different.",
  "This broke everything I thought I knew.",
] as const;
