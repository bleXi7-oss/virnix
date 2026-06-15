// Deterministic heuristic scoring for transcript segments.
// No AI calls, no embeddings, no external dependencies.
// Signal word lists informed by Virnix gold dataset findings (2026-05-19).

import type { MomentType, PlatformFit } from "./types";

export interface MomentScore {
  score: number;             // 0–100 composite heuristic
  momentType: MomentType;
  emotionalTrigger: string;
  platformFit: PlatformFit[];
  reason: string;
  allScores: Record<MomentType, number>;
}

// ─── Signal word lists per moment type ───────────────────────────────────────

const VALIDATION_SIGNALS = [
  "you're not", "you were never", "you didn't fail", "it's not your fault",
  "not because you're", "stop blaming yourself", "you're not broken",
  "it's not you", "you're not lazy", "not weakness", "stop beating yourself",
  "not your problem", "you're not alone", "nothing wrong with you",
] as const;

// Gold dataset finding: mechanism reframe is the #1 viral pattern.
// Examples: "Meditation isn't clearing your mind", "You can't erase a fear — extinguish it",
// "Your inbox never empties. Not email. Your mind."
const MECHANISM_REFRAME_SIGNALS = [
  "it's not", "isn't about", "not about", "actually", "the real reason",
  "not just", "it's never been about", "what you think is",
  "most people think", "everyone thinks", "misunderstood", "hidden",
  "what's really", "what's actually", "not X but", "instead of",
  "the opposite of", "not clearing", "not erasing", "not fixing",
  "not willpower", "not discipline", "not motivation", "not talent",
  "not luck", "not money", "not time",
] as const;

const CONTRARIAN_SIGNALS = [
  "backwards", "wrong about", "the truth is", "nobody tells you",
  "they don't want you", "what they don't", "counterintuitive",
  "the opposite", "stop doing", "stop trying", "stop thinking",
  "conventional wisdom", "what you've been told is wrong",
] as const;

const CONFESSION_SIGNALS = [
  "i was wrong", "i made a mistake", "i used to", "i failed", "i quit",
  "i lost", "looking back", "i regret", "i didn't know", "i was completely",
  "i almost", "i spent years", "i wasted", "i embarrassed", "i had no idea",
  "i was terrible", "i believed", "i thought", "my biggest mistake",
  "my worst", "i got it wrong",
] as const;

const STORY_SIGNALS = [
  "that's when", "everything changed", "turning point", "and then",
  "suddenly", "until one day", "that moment", "i realized", "it hit me",
  "i couldn't believe", "that's the moment", "walked in", "walked out",
  "they said no", "said no", "every single", "nobody wanted",
] as const;

const EDUCATIONAL_SIGNALS = [
  "the mechanism", "studies show", "research shows",
  "data shows", "the science", "what this means",
  "what most people miss", "40 years", "decades of research",
  "professor", "university study", "peer-reviewed",
] as const;

const QUOTE_SIGNALS = [
  '"', "as someone said", "they told me", "the quote", "i once read",
  "i heard someone say", "one of my mentors", "someone once told me",
] as const;

const FOMO_SIGNALS = [
  "if you don't", "you're already behind", "most people are", "by the time",
  "it's already", "you'll regret", "missing out", "don't wait",
  "every day you", "while you're waiting", "compound",
  "the window is closing", "already too late", "you're leaving",
] as const;

const AUTHORITY_SIGNALS = [
  "in my experience", "after working with", "over the years", "i've seen",
  "in every case", "without exception", "consistently", "hundreds of",
  "across dozens", "pattern i noticed", "every client", "every founder",
  "every creator i've worked with",
] as const;

const TRANSFORMATION_SIGNALS = [
  "changed everything", "transformed", "never the same", "before that",
  "after that", "it broke me", "rebuilt myself", "came out the other side",
  "who i was before", "i became", "completely different person",
  "nothing was the same", "it rewired",
] as const;

// ─── Scoring ──────────────────────────────────────────────────────────────────

function countSignals(text: string, signals: readonly string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

export function scoreMoment(text: string): MomentScore {
  if (!text.trim()) {
    const empty: Record<MomentType, number> = {
      validation_hook: 0, mechanism_reframe: 0, contrarian_insight: 0,
      emotional_confession: 0, story_turning_point: 0, educational_gem: 0,
      quote_moment: 0, fomo_loss_frame: 0, authority_proof: 0, transformation_moment: 0,
    };
    return { score: 0, momentType: "educational_gem", emotionalTrigger: "", platformFit: ["youtube"], reason: "", allScores: empty };
  }

  const raw: Record<MomentType, number> = {
    validation_hook:       countSignals(text, VALIDATION_SIGNALS) * 22,
    mechanism_reframe:     countSignals(text, MECHANISM_REFRAME_SIGNALS) * 16,
    contrarian_insight:    countSignals(text, CONTRARIAN_SIGNALS) * 12,
    emotional_confession:  countSignals(text, CONFESSION_SIGNALS) * 18,
    story_turning_point:   countSignals(text, STORY_SIGNALS) * 14,
    educational_gem:       countSignals(text, EDUCATIONAL_SIGNALS) * 10,
    quote_moment:          countSignals(text, QUOTE_SIGNALS) * 15,
    fomo_loss_frame:       countSignals(text, FOMO_SIGNALS) * 15,
    authority_proof:       countSignals(text, AUTHORITY_SIGNALS) * 10,
    transformation_moment: countSignals(text, TRANSFORMATION_SIGNALS) * 14,
  };

  // Specificity bonus: numbers, dollar amounts, percentages, timeframes.
  // Gold dataset finding: specific detail (70 rejections, $2000/month, 40 years)
  // dramatically improves content quality.
  const specificityBonus =
    /\$[\d,]+|\d+[%x]|\d+\s*(days?|weeks?|months?|years?|clients?|creators?|followers?|meetings?|hours?|rejections?|people|times?|years?\s+of)/.test(text)
      ? 20
      : 0;

  // Anti-motivation penalty: pure hustle/motivational content (Gary Vee pattern)
  // produces weak outputs — gold dataset confirmed.
  const motivationPenalty =
    /hustle|work harder|believe in yourself|grind|mindset|you can do it|stay consistent|just show up|take action|just do it/.test(
      text.toLowerCase()
    )
      ? -15
      : 0;

  // Find dominant moment type by highest raw score
  const entries = (Object.entries(raw) as [MomentType, number][]).sort(([, a], [, b]) => b - a);
  const [momentType, typeScore] = entries[0];

  const score = Math.max(0, Math.min(typeScore + specificityBonus + motivationPenalty, 100));

  return {
    score,
    momentType,
    emotionalTrigger: EMOTIONAL_TRIGGERS[momentType],
    platformFit: PLATFORM_FIT[momentType],
    reason: REASONS[momentType],
    allScores: raw,
  };
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const EMOTIONAL_TRIGGERS: Record<MomentType, string> = {
  validation_hook:       "identity relief + curiosity",
  mechanism_reframe:     "cognitive reframe + paradigm shift",
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
  mechanism_reframe:     ["tiktok", "twitter", "linkedin"],
  contrarian_insight:    ["twitter", "linkedin", "youtube"],
  emotional_confession:  ["tiktok", "reels", "instagram", "youtube"],
  story_turning_point:   ["youtube", "tiktok", "instagram"],
  educational_gem:       ["linkedin", "youtube", "twitter"],
  quote_moment:          ["instagram", "twitter", "linkedin"],
  fomo_loss_frame:       ["tiktok", "twitter", "instagram"],
  authority_proof:       ["linkedin", "youtube"],
  transformation_moment: ["youtube", "tiktok", "reels"],
};

export const REASONS: Record<MomentType, string> = {
  validation_hook:
    "Removes self-blame before delivering insight — validation hook formula",
  mechanism_reframe:
    "Reframes a concept the reader thinks they understand — gold dataset #1 viral pattern",
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

// Returns the display rationale string for a given moment type.
// Use with the RESOLVED display type (after resolveDisplayType), not the
// raw scored type — so a downgraded validation_hook → quote_moment shows
// the quote_moment rationale, not the validation_hook one.
export function getDisplayReason(momentType: MomentType): string {
  return REASONS[momentType] ?? "";
}

export function getEmotionalTrigger(type: MomentType): string {
  return EMOTIONAL_TRIGGERS[type] ?? "";
}

export function getPlatformFit(type: MomentType): PlatformFit[] {
  return PLATFORM_FIT[type] ?? [];
}
