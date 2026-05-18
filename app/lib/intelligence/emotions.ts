// Virnix Intelligence Layer — Emotion Engine
//
// Maps the emotional mechanics behind viral content decisions.
// Content spreads for emotional reasons, not logical ones — this module
// captures which emotions drive which actions on which platforms.
//
// Future prompt use:
//   - Map the variation angle (curiosity, controversy, etc.) to a primary emotion
//   - Use EMOTION_TO_ACTION to steer the CTA toward the highest-yield action for the platform
//   - Use EMOTIONAL_INTENSITY as a pacing guide inside prompt tone directives

// ─── Primary emotional triggers ──────────────────────────────────────────────
// These are the 8 emotions most consistently tied to content virality.
// Each has a prompt directive explaining how to activate it in copy.

export const EMOTIONAL_TRIGGERS = {
  awe: {
    description: "The sense that something is bigger than expected — scale, surprise, beauty, revelation",
    activators: ["Unexpected scale ('went from 0 to 1M in 90 days')", "Paradigm-shifting insight", "Counterintuitive proof"],
    promptDirective: "Use specific numbers at unexpected scale. Let the magnitude speak — don't explain that it's impressive.",
    viralMechanism: "Awe makes people want to share the feeling — 'you have to see this'",
  },
  anger: {
    description: "Righteous frustration at something unfair, dishonest, or broken",
    activators: ["Naming a villain (a norm, a lie, a system)", "Exposing a common deception", "Validating a frustration the reader has felt alone in"],
    promptDirective: "Name the thing that's broken with precision. Don't be vague. 'The algorithm punishes quality' is weak. 'Long-form posts get 60% less reach than native videos' is anger-activating.",
    viralMechanism: "Anger is shared to recruit allies and signal values",
  },
  fear: {
    description: "Awareness of a real risk the reader hadn't fully named yet",
    activators: ["Loss framing ('what you're already losing')", "Social exclusion risk", "Missing a window that's closing"],
    promptDirective: "Make the risk specific and near. 'Your competitors are already doing this' > 'this is important for your future'.",
    viralMechanism: "Fear is saved for personal reference — saves spike on fear-based content",
  },
  joy: {
    description: "Delight, relief, recognition, or the satisfaction of finding what you've been looking for",
    activators: ["'That's exactly how I feel' moment", "Solving a frustration the reader has lived with", "Unexpected simplicity in something complex"],
    promptDirective: "Mirror the reader's experience before offering the solution. Joy comes from feeling understood, not just informed.",
    viralMechanism: "Joy is shared as a gift — 'this made my day, thought of you'",
  },
  surprise: {
    description: "Violation of a confident expectation — the world was not as predicted",
    activators: ["Counterintuitive data", "The expert who was wrong", "The simple solution to the complex problem"],
    promptDirective: "State the surprise first. Don't build up to it — the surprise IS the hook. Then explain it.",
    viralMechanism: "Surprise drives shares because people want to recreate the feeling in others",
  },
  anticipation: {
    description: "The pleasurable tension of knowing something is coming without knowing exactly what",
    activators: ["Open loops ('I'll tell you at the end')", "Numbered lists that imply escalation", "Promised frameworks that haven't been revealed yet"],
    promptDirective: "Create a promise early and delay its fulfillment deliberately. Withhold the payoff one beat longer than feels comfortable.",
    viralMechanism: "Anticipation keeps people reading — it's the primary retention mechanic in long-form",
  },
  trust: {
    description: "The feeling that this person knows what they're talking about AND has your interests at heart",
    activators: ["Admitting failure before claiming success", "Specific data over vague claims", "Naming the thing that DIDN'T work"],
    promptDirective: "Build trust through specificity and acknowledged failure. Credentials don't build trust — honest reporting of real experiences does.",
    viralMechanism: "Trust drives saves — people return to sources they trust when they need to act",
  },
  disgust: {
    description: "Revulsion at something that violates standards — poor quality, dishonesty, bad taste",
    activators: ["Naming commonly accepted bad practices with precision", "The thing everyone does that quietly doesn't work", "Generic advice that actively harms creators"],
    promptDirective: "Be specific about what the bad practice is and why it fails. Generic disgust ('most advice is bad') is weak. Specific disgust ('the 3-post-per-day rule kills engagement because of X') is viral.",
    viralMechanism: "Disgust builds in-group identity — 'we're not those people' — and drives shares within communities",
  },
} as const;

// ─── Emotion-to-action mapping ────────────────────────────────────────────────
// Different emotions drive different engagement behaviors.
// Use this to steer CTAs toward the highest-yield action per platform goal.

export const EMOTION_TO_ACTION = {
  shares:   ["awe", "anger", "surprise", "joy"] as const,
  saves:    ["fear", "trust", "anticipation"] as const,
  comments: ["anger", "disgust", "surprise"] as const,
  follows:  ["trust", "awe", "anticipation"] as const,
  clicks:   ["fear", "curiosity", "anticipation"] as const,
} as const;

// ─── Emotional intensity spectrum ─────────────────────────────────────────────
// Low-intensity emotions create saves and follows.
// High-intensity emotions create shares and comments.
// Balance depends on the platform goal.

export const EMOTIONAL_INTENSITY = {
  low:    ["trust", "anticipation", "joy"],
  medium: ["awe", "surprise", "fear"],
  high:   ["anger", "disgust"],
} as const;

// ─── Variation angle to emotion mapping ──────────────────────────────────────
// Maps the variation engine's EmotionalAngle (prompts/variation/) to
// the primary emotional trigger this module defines.
// Future: use this to select emotion-appropriate CTAs automatically.

export const ANGLE_TO_EMOTION: Record<string, keyof typeof EMOTIONAL_TRIGGERS> = {
  curiosity:    "anticipation",
  controversy:  "anger",
  authority:    "trust",
  vulnerability:"trust",
  storytelling: "joy",
  urgency:      "fear",
};
