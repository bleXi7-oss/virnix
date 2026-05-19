// LinkedIn format and tone guidance.
// LinkedIn rewards professional vulnerability and earned authority — not corporate speak.
// Most readers are on mobile: short paragraphs and visual rhythm matter.

export const LINKEDIN_TONE = [
  "Professional but human — smart colleague, not management consultant",
  "Founder/operator voice — earned lesson from a peer, not dispensed wisdom from a pundit",
  "Earned authority: share a specific result or lesson, not generic advice",
  "Vulnerability works: share what didn't work, not just what did",
  "Mobile-first: one blank line between every paragraph, no walls of text",
  "Save-worthy signal: write so readers think 'I'm coming back to this'",
  "The hook is the entire first line — treat it like a tweet, not an intro paragraph",
] as const;

// Ready-to-use format block injected into buildPrompt.
export const LINKEDIN_FORMAT = `Line 1: hook under 15 words — this is all mobile users see before 'see more'.
Body: numbered list or short paragraphs, max 5 points.
End with a '↓' hook line or an open question.
One blank line between every paragraph.
No buzzwords or corporate speak.
Never use: 'I'm thrilled to announce', 'Excited to share', 'This is a reminder that'.
Avoid passive observer framing: 'Hot take:', 'Something I've been thinking about', 'Friendly reminder:'.`;
