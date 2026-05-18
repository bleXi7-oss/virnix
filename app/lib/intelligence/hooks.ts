// Virnix Intelligence Layer — Hook Mechanics
//
// This module goes deeper than the prompt-level HOOK_PATTERNS in prompts/hooks/.
// Where prompts/hooks/ lists structural archetypes for injection into system prompts,
// this module captures the underlying mechanics of WHY hooks work — the cognitive
// triggers, open-loop structures, and curiosity gap formulas.
//
// Future prompt use:
//   - Pick a hook formula matching the variation angle and inject into platform prompts
//   - Use OPEN_LOOP_STRUCTURES to enforce cliffhanger rhythm across multi-tweet threads
//   - Use HOOK_STRENGTH_SIGNALS as a scoring rubric in a future self-critique pass

// ─── Curiosity gap formulas ───────────────────────────────────────────────────
// These are fill-in templates. The blank is where the specific insight goes.
// The gap between "what I know" and "what they know" is what drives clicks.

export const CURIOSITY_GAP_FORMULAS = [
  "Nobody tells you ___ until it's too late.",
  "I thought I understood ___ until ___.",
  "The real reason ___ isn't what you think.",
  "Most people do ___. The 1% do ___ instead.",
  "___ works — but only if you know this first.",
  "Here's what ___ actually looks like behind the scenes.",
  "Stop doing ___ — here's what happens when you do.",
  "The thing about ___ that every expert skips over:",
] as const;

// ─── Open-loop structures ─────────────────────────────────────────────────────
// Open loops delay resolution to force forward movement.
// Used in threads (tweet 1 sets the loop, tweet 8 closes it),
// in TikTok scripts (hook creates a loop, CTA offers partial closure),
// and in LinkedIn posts (first line creates a loop, body earns the resolution).

export const OPEN_LOOP_STRUCTURES = [
  {
    name: "tease-then-earn",
    description: "State the conclusion early. Withhold the HOW. Build toward it.",
    example: "I 10x'd my output last year. But not by working harder. Here's what changed:",
  },
  {
    name: "conflict-first",
    description: "Open with a contradiction or paradox. Readers need to resolve it.",
    example: "The more content I made, the less it worked. Until I did the opposite of everything I'd read.",
  },
  {
    name: "before-state-hook",
    description: "Describe who you were before the insight. Readers project themselves onto it.",
    example: "18 months ago I was posting daily and getting 12 likes per post.",
  },
  {
    name: "numbered-withhold",
    description: "Promise a list. Make reading feel like unlocking items.",
    example: "3 things I learned from 1,000 creator interviews. Most people only know the first one.",
  },
  {
    name: "pattern-interrupt-question",
    description: "Ask a question that breaks the reader's autopilot assumption.",
    example: "What if the reason your content isn't working has nothing to do with quality?",
  },
] as const;

// ─── Hook strength signals ────────────────────────────────────────────────────
// Criteria that separate a strong hook from a weak one.
// Future: use these as a rubric in a post-generation quality check pass.

export const HOOK_STRENGTH_SIGNALS = {
  strong: [
    "Contains a specific number, result, or timeframe",
    "Creates a knowledge gap the reader didn't know existed",
    "Names a problem the reader recognizes before they explain it",
    "Takes a position — says something specific enough to be wrong",
    "Implies a before/after without spelling it out",
  ],
  weak: [
    "Opens with 'I wanted to share' or 'Here's a thread about'",
    "Generic claim with no specificity ('content is important')",
    "Motivational tone with no tension or stakes",
    "Requires context from a previous post to make sense",
    "Ends with a question mark as the entire hook",
  ],
} as const;

// ─── Platform hook windows ────────────────────────────────────────────────────
// How long the hook has to work on each platform before the user bounces.
// Informs pacing and information density decisions in prompt engineering.

export const PLATFORM_HOOK_WINDOWS = {
  tiktok:    { seconds: 2,  chars: 60,  mechanism: "visual + audio — first word and face tell the story" },
  twitter:   { seconds: 3,  chars: 120, mechanism: "first tweet must stand alone and reward reading immediately" },
  linkedin:  { seconds: 4,  chars: 80,  mechanism: "first line is all mobile users see before 'see more'" },
  instagram: { seconds: 3,  chars: 100, mechanism: "hook competes with the image — either amplifies or contrasts it" },
  youtube:   { seconds: 0,  chars: 60,  mechanism: "title + thumbnail are the hook — the video hasn't started yet" },
} as const;
