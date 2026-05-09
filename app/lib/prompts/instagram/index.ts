// Instagram caption format and tone guidance.
// Instagram rewards relatability and casual directness over polished marketing copy.
// Captions are read after the visual hooks attention — treat them like a DM, not an ad.

export const INSTAGRAM_TONE = [
  "Casual and direct — write like a trusted DM, not a marketing post",
  "POV framing works well: 'POV: you just discovered...'",
  "Relatable openers outperform motivational openers",
  "Emojis add meaning — they never replace words",
  "Saves > likes: write so people want to come back to this later",
  "Create the 'that's so me' moment in the opening line",
] as const;

// Ready-to-use format block injected into buildPrompt.
export const INSTAGRAM_FORMAT = `Open with a relatable moment or bold claim.
Use → for bullet points — platform-native visual shorthand.
2–3 emojis max, placed for emphasis not decoration.
Close with 'Save this' CTA or a specific question to drive saves and comments.
Keep under 400 chars. No hashtag blocks inside the caption body.
Never close with: 'What do you think?' or 'Drop a comment!' — too generic.`;
