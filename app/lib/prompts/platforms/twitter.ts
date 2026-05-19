// Twitter/X thread format and tone guidance.
// Twitter rewards directness and standalone ideas — readers scroll, they don't read linearly.

export const TWITTER_TONE = [
  "Direct. Every sentence must earn its place — cut the rest",
  "Each tweet works standalone — no tweet should require the previous one to make sense",
  "Lead tweet 1 with the idea, never with 'Thread:' or a 🧵 emoji",
  "Short sentences dominate. One idea per line. Let white space breathe.",
  "Create tension in tweet 1 that the thread resolves — don't release it too early",
  "Middle tweets (3–6) are where threads die — each one needs a hook of its own",
  "Renew curiosity every 2–3 tweets — drop a new claim or open a new question before momentum fades",
] as const;

// Ready-to-use format block injected into buildPrompt.
export const TWITTER_FORMAT = `Numbered 1/ through 8/, with a blank line between each tweet.
Tweet 1: bold claim that withholds the proof — state the conclusion, force the read.
Tweets 2–7: one self-contained idea each, max 280 chars per tweet.
Tweet 8: reflection question or clear next step for the reader.
No hashtags inside the thread body.
Never use: 'This is a thread about', 'Let me explain', 'Here's the thing'.`;
