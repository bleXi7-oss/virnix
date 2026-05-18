// Virnix Intelligence Layer — Creator Psychology
//
// This module maps the deep cognitive mechanics behind viral content.
// It complements prompts/psychology/ (which focuses on storytelling patterns
// and anti-generic rules) by covering the WHY — the underlying mental triggers
// that make people stop, read, share, and save.
//
// Future prompt use:
//   - Pick a bias trigger matching the variation angle and inject into tone directives
//   - Use IDENTITY_APPEALS to write CTAs that feel personal rather than generic
//   - Use SOCIAL_DYNAMICS to calibrate controversy/authority angles in buildPrompt()

// ─── Cognitive bias triggers ──────────────────────────────────────────────────
// Each bias has a prompt application note explaining how to activate it in copy.

export const COGNITIVE_BIASES = {
  curiosityGap: {
    mechanism: "People are compelled to close knowledge gaps once they become aware of them.",
    promptApplication: "Name what the reader doesn't know before revealing it. The gap IS the hook.",
  },
  socialProof: {
    mechanism: "Humans calibrate behavior by watching what others do, especially peers.",
    promptApplication: "Reference specific numbers of people or outcomes. '10,000 creators' > 'many creators'.",
  },
  lossAversion: {
    mechanism: "Losses feel roughly 2x more painful than equivalent gains feel good.",
    promptApplication: "Frame missed opportunities, not just gained benefits. 'What you're leaving on the table' > 'what you could gain'.",
  },
  authority: {
    mechanism: "Specific credentials and verifiable results override skepticism faster than general claims.",
    promptApplication: "Replace 'I'm an expert' with a specific outcome: '47 clients, 3 years, $0 in ads'.",
  },
  scarcity: {
    mechanism: "Limited availability increases perceived value — even of ideas and information.",
    promptApplication: "Name the window: 'This only works in the first 90 days', 'Most people miss this before it's obvious'.",
  },
  reciprocity: {
    mechanism: "Receiving something of value creates an implicit obligation to give something back.",
    promptApplication: "Give the insight generously before asking for anything — saves, follows, clicks.",
  },
  confirmation: {
    mechanism: "People engage more deeply with content that validates something they already suspect.",
    promptApplication: "Start with 'You already know X isn't working' — validate the frustration before offering the solution.",
  },
  patternInterrupt: {
    mechanism: "The brain filters out repetitive stimuli. Unexpected breaks in pattern force attention.",
    promptApplication: "Open with something that violates the format the reader expects for this topic.",
  },
} as const;

// ─── Identity appeals ─────────────────────────────────────────────────────────
// The most viral content makes readers feel seen — it mirrors their identity or
// their aspired identity. CTAs that reference identity outperform generic ones.

export const IDENTITY_APPEALS = [
  {
    type: "aspired",
    description: "Speaks to who the reader is trying to become",
    example: "If you're the kind of creator who wants sustainable growth, not just a viral moment —",
  },
  {
    type: "insider",
    description: "Creates in-group membership — 'you already know this'",
    example: "The people who've been doing this for 3+ years already know what I'm about to say.",
  },
  {
    type: "contrarian",
    description: "Validates the reader for thinking differently than the mainstream",
    example: "If you've never trusted the 'just post every day' advice, you were right.",
  },
  {
    type: "transformation",
    description: "Mirrors the reader's before-state and promises an after-state",
    example: "I used to spend 6 hours on content that got 200 views. Now I spend 45 minutes.",
  },
  {
    type: "exclusivity",
    description: "Creates a sense that this information is not commonly known",
    example: "Most people in this niche will never figure this out because they're asking the wrong question.",
  },
] as const;

// ─── Social dynamics ──────────────────────────────────────────────────────────
// Virality is inherently social. Content spreads when it gives people something
// to signal to their own tribe — agreement, disagreement, shared identity.

export const SOCIAL_DYNAMICS = {
  shareMotivations: [
    "Makes the sharer look smart or well-informed",
    "Validates something the sharer already believes",
    "Is controversial enough that the sharer wants reactions",
    "Is so useful that sharing it is itself a social act",
    "Makes the sharer part of a movement or perspective",
  ],
  saveMotivations: [
    "Feels like a resource the reader will need later",
    "Contains a framework or list worth returning to",
    "Is too dense to absorb in one reading",
    "Feels exclusive — like something they found, not something pushed to them",
  ],
  commentMotivations: [
    "Creates a genuine binary: which side are you on?",
    "Invites a personal story the reader already has ready",
    "Asks a question specific enough that the answer feels non-obvious",
    "Challenges something the reader has direct experience contradicting",
  ],
} as const;

// ─── Trust calibration ────────────────────────────────────────────────────────
// Trust is the bottleneck in creator content. These patterns build it fast.

export const TRUST_PATTERNS = [
  "Acknowledge the counterargument before dismissing it — shows intellectual honesty",
  "Cite your failures as proof you've done the work, not just read about it",
  "Name the thing that didn't work before naming the thing that did",
  "Disagree with someone credible and explain specifically why",
  "Say what you're NOT going to claim — negative specificity signals rigor",
] as const;
