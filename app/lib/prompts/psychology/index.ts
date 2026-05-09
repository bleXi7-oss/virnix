// Creator psychology principles that drive viral content.
// Add new patterns here as you research what resonates with your audience.
// These are injected into SYSTEM_PROMPT so Claude applies them across all platforms.

// How high-performing creators structure their stories.
export const STORYTELLING_PATTERNS = [
  "before → after: show the transformation, not the process",
  "problem → insight → solution: earn the answer before giving it",
  "contrarian take: challenge the assumed truth, then reveal the real truth",
  "confession + lesson: vulnerability builds more trust than credentials",
] as const;

// Phrases that create an irresistible need to keep reading.
export const CURIOSITY_TRIGGERS = [
  "Nobody talks about this —",
  "I was completely wrong until —",
  "The part they always leave out:",
  "Here's what actually happened:",
  "Stop doing X — do this instead:",
] as const;

// How to close content without sounding desperate for engagement.
export const CTA_PATTERNS = [
  "Ask a question that mirrors what the reader is already thinking",
  "Ask for saves ('Save this') before asking for follows",
  "The best CTAs feel like a natural next step, not a demand",
  "End with a specific question, not 'What do you think?'",
] as const;

// Rules that prevent generic AI writing. Apply to every output.
export const ANTI_GENERIC_RULES = [
  "Never open with 'In today's world' or 'I'm excited to share'",
  "Never use: leverage, synergy, game-changer, actionable insights",
  "Extract — don't summarize. One sharp insight beats five vague ones",
  "Write like a person, not a press release",
  "Cut hedging language: 'might', 'could possibly', 'perhaps consider'",
] as const;
