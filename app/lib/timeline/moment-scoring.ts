// Deterministic heuristic scoring for transcript segments.
// No AI calls, no embeddings, no external dependencies.
// Identifies the most likely moment type and platform fit for a given text block.

import type { MomentType, PlatformFit } from "./types";

export interface MomentScore {
  score: number;             // 0–100 composite heuristic
  momentType: MomentType;
  emotionalTrigger: string;
  platformFit: PlatformFit[];
  reason: string;
}

// ─── Signal word lists per moment type ───────────────────────────────────────

const VALIDATION_SIGNALS = [
  "you're not", "you were never", "you didn't fail", "it's not your fault",
  "not because you're", "stop blaming yourself", "you're not broken",
  "it's not you", "you're not lazy", "not weakness",
] as const;

const CONTRARIAN_SIGNALS = [
  "actually", "the truth is", "wrong about", "most people", "everyone thinks",
  "the opposite", "counterintuitive", "nobody tells you", "they don't want you",
  "the real reason", "what they don't", "backwards",
] as const;

const CONFESSION_SIGNALS = [
  "i was wrong", "i made a mistake", "i used to", "i failed", "i quit",
  "i lost", "looking back", "i regret", "i didn't know", "i was completely",
  "i almost", "i spent years", "i wasted",
] as const;

const STORY_SIGNALS = [
  "that's when", "everything changed", "turning point", "and then",
  "suddenly", "until one day", "that moment", "i realized", "it hit me",
  "i couldn't believe", "that's the moment",
] as const;

const EDUCATIONAL_SIGNALS = [
  "here's why", "the reason", "the mechanism", "studies show", "research shows",
  "data shows", "this is how", "here's how", "the science", "what this means",
  "the key is", "what most people miss",
] as const;

const QUOTE_SIGNALS = [
  '"', "as someone said", "they told me", "the quote", "i once read",
  "i heard someone say", "one of my mentors",
] as const;

const FOMO_SIGNALS = [
  "if you don't", "you're already behind", "most people are", "by the time",
  "it's already", "you'll regret", "missing out", "don't wait",
  "every day you", "while you're waiting", "compound",
] as const;

const AUTHORITY_SIGNALS = [
  "in my experience", "after working with", "over the years", "i've seen",
  "in every case", "without exception", "consistently", "hundreds of",
  "across dozens", "pattern i noticed",
] as const;

const TRANSFORMATION_SIGNALS = [
  "changed everything", "transformed", "never the same", "before that",
  "after that", "it broke me", "rebuilt myself", "came out the other side",
  "who i was before", "i became",
] as const;

// ─── Scoring ──────────────────────────────────────────────────────────────────

function countSignals(text: string, signals: readonly string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

export function scoreMoment(text: string): MomentScore {
  if (!text.trim()) {
    return { score: 0, momentType: "educational_gem", emotionalTrigger: "", platformFit: ["youtube"], reason: "" };
  }

  const raw: Record<MomentType, number> = {
    validation_hook:       countSignals(text, VALIDATION_SIGNALS) * 20,
    contrarian_insight:    countSignals(text, CONTRARIAN_SIGNALS) * 10,
    emotional_confession:  countSignals(text, CONFESSION_SIGNALS) * 15,
    story_turning_point:   countSignals(text, STORY_SIGNALS) * 12,
    educational_gem:       countSignals(text, EDUCATIONAL_SIGNALS) * 10,
    quote_moment:          countSignals(text, QUOTE_SIGNALS) * 15,
    fomo_loss_frame:       countSignals(text, FOMO_SIGNALS) * 15,
    authority_proof:       countSignals(text, AUTHORITY_SIGNALS) * 10,
    transformation_moment: countSignals(text, TRANSFORMATION_SIGNALS) * 12,
  };

  // Specificity bonus: numbers, percentages, multipliers, timeframes
  const specificityBonus =
    /\$\d+|\d+[%x]|\d+\s*(days?|weeks?|months?|years?|clients?|creators?|followers?)/.test(text)
      ? 15
      : 0;

  // Find dominant moment type by highest raw score
  const entries = (Object.entries(raw) as [MomentType, number][]).sort(([, a], [, b]) => b - a);
  const [momentType, typeScore] = entries[0];

  const score = Math.max(0, Math.min(typeScore + specificityBonus, 100));

  return {
    score,
    momentType,
    emotionalTrigger: EMOTIONAL_TRIGGERS[momentType],
    platformFit: PLATFORM_FIT[momentType],
    reason: REASONS[momentType],
  };
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const EMOTIONAL_TRIGGERS: Record<MomentType, string> = {
  validation_hook:       "identity relief + curiosity",
  contrarian_insight:    "cognitive dissonance + pattern interrupt",
  emotional_confession:  "vulnerability + trust",
  story_turning_point:   "narrative tension + resolution",
  educational_gem:       "insight + authority",
  quote_moment:          "borrowed authority + resonance",
  fomo_loss_frame:       "loss aversion + urgency",
  authority_proof:       "social proof + credibility",
  transformation_moment: "aspiration + relatability",
};

const PLATFORM_FIT: Record<MomentType, PlatformFit[]> = {
  validation_hook:       ["tiktok", "reels", "instagram"],
  contrarian_insight:    ["twitter", "linkedin", "youtube"],
  emotional_confession:  ["tiktok", "reels", "instagram", "youtube"],
  story_turning_point:   ["youtube", "tiktok", "instagram"],
  educational_gem:       ["linkedin", "youtube", "twitter"],
  quote_moment:          ["instagram", "twitter", "linkedin"],
  fomo_loss_frame:       ["tiktok", "twitter", "instagram"],
  authority_proof:       ["linkedin", "youtube"],
  transformation_moment: ["youtube", "tiktok", "reels"],
};

const REASONS: Record<MomentType, string> = {
  validation_hook:
    "Removes self-blame before delivering insight — validation hook formula",
  contrarian_insight:
    "Challenges assumed truth — forces viewer to re-evaluate their position",
  emotional_confession:
    "Vulnerability builds faster trust than credentials",
  story_turning_point:
    "Narrative arc with clear before/after — completion loop opens",
  educational_gem:
    "High information density + mechanism clarity — save-worthy",
  quote_moment:
    "Borrowed authority + quotable format — high share potential",
  fomo_loss_frame:
    "Loss framing activates urgency 2x stronger than gain framing",
  authority_proof:
    "Experience-backed claim — credibility without asserting credentials",
  transformation_moment:
    "Identity-level aspiration — viewer sees themselves post-transformation",
};
