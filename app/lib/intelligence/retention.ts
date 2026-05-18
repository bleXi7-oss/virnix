// Virnix Intelligence Layer — Retention Mechanics
//
// Retention is the gap between someone starting to read and finishing.
// Most content loses readers in the middle — this module captures the mechanics
// that keep people engaged past the hook and through to the CTA.
//
// Future prompt use:
//   - Inject MIDDLE_CONTENT_RULES into prompt sections to prevent mid-thread drop-off
//   - Use OPEN_LOOP_MAINTENANCE as a pacing directive inside long-form prompt guidance
//   - Use SCROLL_STOPPING_PATTERNS to diversify how each platform section opens

// ─── The retention problem ────────────────────────────────────────────────────
// Why most content fails after the hook.

export const RETENTION_FAILURE_MODES = [
  "The hook over-promised — the body couldn't deliver the implied insight",
  "The middle answers the question too early — nothing left to earn",
  "Every paragraph has equal weight — no rhythm, no escalation, no surprise",
  "The CTA arrives before the reader feels they've received full value",
  "The format changes mid-way without a natural transition signal",
  "Too many ideas at once — the reader's working memory fills and they bail",
] as const;

// ─── Scroll-stopping patterns ─────────────────────────────────────────────────
// Techniques for pulling readers past the fold, tweet 3, or the 'see more' cutoff.

export const SCROLL_STOPPING_PATTERNS = [
  {
    name: "micro-cliffhanger",
    description: "End a paragraph or tweet with a fragment that demands the next",
    example: "And that's where it went wrong.",
  },
  {
    name: "specific detail drop",
    description: "Insert a hyper-specific detail mid-content — specificity signals authenticity and creates texture",
    example: "At 11:43pm on a Tuesday. Not the day I expected.",
  },
  {
    name: "reframe pivot",
    description: "Suddenly shift how the reader sees the preceding content",
    example: "But here's the thing — that wasn't the lesson.",
  },
  {
    name: "reader-mirror",
    description: "Name exactly what the reader is thinking at this moment",
    example: "By now you're probably wondering if this actually worked.",
  },
  {
    name: "stakes escalation",
    description: "Reveal mid-content that more was riding on this than the reader knew",
    example: "What I didn't tell you yet: I had 30 days to make this work.",
  },
  {
    name: "unexplained result",
    description: "Drop a result without the explanation — create a gap that must be resolved",
    example: "The weird part: engagement went up when we posted less.",
  },
] as const;

// ─── Open loop maintenance ────────────────────────────────────────────────────
// The loop created in the hook must be maintained through the body.
// These patterns sustain tension without resolving it too early.

export const OPEN_LOOP_MAINTENANCE = [
  "Re-reference the hook every 3-4 paragraphs — remind readers what they're waiting for",
  "Add a secondary loop mid-content that resolves before the primary loop does",
  "Delay the most important number or result until the final third",
  "Use 'but that's not the whole story' as a bridge to sustain open loops",
  "Layer a personal consequence alongside the informational payoff — make it human",
] as const;

// ─── Middle content rules ─────────────────────────────────────────────────────
// The middle is where threads, posts, and scripts lose their audience.
// These rules apply specifically to tweets 3-6, LinkedIn paragraphs 2-4,
// and TikTok body sections.

export const MIDDLE_CONTENT_RULES = [
  "Each middle unit (tweet, paragraph, beat) needs its own micro-hook",
  "Alternate between insight and evidence — don't stack 3 claims in a row",
  "Use contrast: short punchy sentence. Then a longer one that earns it.",
  "One tangible example per abstract claim — no more, no less",
  "The best middle content changes how the reader sees the hook retroactively",
  "If you can cut it without losing the argument, cut it",
] as const;

// ─── Completion signals ───────────────────────────────────────────────────────
// What signals to the reader that finishing is worth it.
// These create the psychological commitment to reach the CTA.

export const COMPLETION_SIGNALS = [
  {
    name: "tease-the-resolution",
    description: "Give a hint that the payoff is close but requires reading one more section",
    example: "The last part is the one nobody talks about.",
  },
  {
    name: "diminishing-return-warning",
    description: "Imply the value increases toward the end",
    example: "Everything I've shared so far is public knowledge. This next part isn't.",
  },
  {
    name: "earned-credibility-drop",
    description: "Reveal a credentialing detail late — after the reader is already invested",
    example: "I should mention: we ran this across 1,200 accounts before writing any of this down.",
  },
] as const;
