// Instagram caption format and tone guidance.
// Instagram rewards relatability and casual directness over polished marketing copy.
// Captions are read after the visual hooks attention — treat them like a DM, not an ad.

export const INSTAGRAM_TONE = [
  "Casual and direct — write like a trusted DM, not a marketing post",
  "POV framing works well: 'POV: you just discovered...'",
  "Relatable openers outperform motivational openers",
  "Emojis add meaning — they never replace words",
] as const;

// Ready-to-use format block injected into buildPrompt.
export const INSTAGRAM_FORMAT = `Open with a relatable moment or bold claim.
Use → for bullet points — platform-native visual shorthand.
2–3 emojis max, placed for emphasis not decoration.
Close with a CTA question to drive comments.
Keep under 400 chars. No hashtag blocks inside the caption body.`;
