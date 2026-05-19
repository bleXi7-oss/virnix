// Transcript quality evaluation — psychological content density analysis.
//
// Input:  TimelineMoment[] from detectTimelineMoments()
// Output: TranscriptQualityReport — honest assessment of clipability and psychological richness
//
// This is NOT:
//   - virality prediction
//   - engagement forecasting
//   - fake AI scoring
//
// This IS:
//   - psychological content density detection
//   - honest signal-based clipability classification
//   - creator-native summary of where emotional value lives

import type { TimelineMoment, MomentType } from "./types";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TranscriptQualityReport {
  overallScore: number;           // 0–100 composite — for diagnostics only, not shown as a number to creators
  clipability: "low" | "medium" | "high";
  strongestSignals: string[];     // up to 3 human-readable moment type labels
  weaknesses: string[];           // up to 2 honest observations about what's missing
  creatorFit: string[];           // platform recommendations derived from detected types
  emotionalDensity: number;       // 0–100: share of high-emotional moments (confession, validation, transformation, story)
  mechanismReframes: number;      // count of mechanism_reframe moments
  validationMoments: number;      // count of validation_hook moments
  confessionMoments: number;      // count of emotional_confession moments
  educationalDensity: number;     // 0–100: share of educational/authority moments
  psychologicalRichness: number;  // 0–100: variety of premium moment types (not just count)
  summary: string;                // creator-native 1–2 sentence honest assessment
}

// ─── Configuration ────────────────────────────────────────────────────────────

// Weights reflect psychological value as a prompt anchor — matches PROMPT_PRIORITY_TYPES ordering.
// Lower-value types contribute less to clipability even at high confidence.
const TYPE_WEIGHTS: Record<MomentType, number> = {
  validation_hook:       20,
  emotional_confession:  18,
  mechanism_reframe:     16,
  transformation_moment: 15,
  story_turning_point:   14,
  contrarian_insight:    12,
  fomo_loss_frame:       12,
  educational_gem:        8,
  authority_proof:        8,
  quote_moment:           6,
};

// Premium types: create identity tension, emotional contrast, or paradigm shift.
// Presence of these types is what distinguishes clipable content from educational summaries.
const PREMIUM_TYPES = new Set<MomentType>([
  "validation_hook",
  "mechanism_reframe",
  "emotional_confession",
  "contrarian_insight",
  "transformation_moment",
  "story_turning_point",
  "fomo_loss_frame",
]);

// Emotional arc types: confession, validation, transformation, story — drive TikTok/Reels fit
const EMOTIONAL_ARC_TYPES = new Set<MomentType>([
  "validation_hook",
  "emotional_confession",
  "transformation_moment",
  "story_turning_point",
]);

// Educational types: informational density — drive LinkedIn/YouTube fit
const EDUCATIONAL_TYPES = new Set<MomentType>([
  "educational_gem",
  "authority_proof",
]);

// Human-readable labels for display
const TYPE_LABELS: Record<MomentType, string> = {
  validation_hook:       "Validation hook",
  mechanism_reframe:     "Mechanism reframe",
  emotional_confession:  "Emotional confession",
  transformation_moment: "Transformation arc",
  story_turning_point:   "Story arc",
  contrarian_insight:    "Contrarian insight",
  fomo_loss_frame:       "Loss-frame hook",
  educational_gem:       "Educational clarity",
  authority_proof:       "Authority signal",
  quote_moment:          "Quotable moment",
};

// Scale factor: pushes typical real-world confidence scores (20–70) into a usable 0–100 range.
// Calibrated so: 3 premium types at 65 avg confidence ≈ 65 (High); all-educational at 40 ≈ 32 (Low-Medium).
const SCORE_SCALE = 2.0;

// Clipability thresholds
const HIGH_THRESHOLD = 58;
const MEDIUM_THRESHOLD = 30;

// ─── Main export ──────────────────────────────────────────────────────────────

// Returns null when no moments — caller skips rendering the quality card entirely.
export function evaluateTranscriptQuality(
  moments: TimelineMoment[]
): TranscriptQualityReport | null {
  if (moments.length === 0) return null;

  // ── Core counts ──
  const validationMoments  = moments.filter((m) => m.momentType === "validation_hook").length;
  const confessionMoments  = moments.filter((m) => m.momentType === "emotional_confession").length;
  const mechanismReframes  = moments.filter((m) => m.momentType === "mechanism_reframe").length;
  const emotionalArcCount  = moments.filter((m) => EMOTIONAL_ARC_TYPES.has(m.momentType)).length;
  const educationalCount   = moments.filter((m) => EDUCATIONAL_TYPES.has(m.momentType)).length;

  const total = moments.length;

  // ── Overall score ──
  // Top-5 moments by weighted contribution, scaled and clamped to 0–100.
  // Reflects psychological richness — not a predictor of real-world performance.
  const contributions = moments
    .map((m) => TYPE_WEIGHTS[m.momentType] * (m.confidenceScore / 100))
    .sort((a, b) => b - a)
    .slice(0, 5);
  const rawScore = contributions.reduce((acc, v) => acc + v, 0);
  const overallScore = Math.round(Math.min(100, rawScore * SCORE_SCALE));

  // ── Clipability bucket ──
  const clipability: "low" | "medium" | "high" =
    overallScore >= HIGH_THRESHOLD   ? "high"   :
    overallScore >= MEDIUM_THRESHOLD ? "medium" : "low";

  // ── Density metrics ──
  const emotionalDensity  = Math.round((emotionalArcCount / total) * 100);
  const educationalDensity = Math.round((educationalCount / total) * 100);

  // ── Psychological richness ──
  // Diversity of premium moment types — 5 or more unique types → 100.
  const uniquePremiumTypes = new Set(
    moments.filter((m) => PREMIUM_TYPES.has(m.momentType)).map((m) => m.momentType)
  ).size;
  const psychologicalRichness = Math.min(100, uniquePremiumTypes * 20);

  // ── Strongest signals ──
  // Top 3 distinct moment types by (type_weight × avg_confidence), deduplicated.
  const typeScoreMap = new Map<MomentType, { totalWeight: number; count: number }>();
  for (const m of moments) {
    const existing = typeScoreMap.get(m.momentType);
    if (existing) {
      existing.totalWeight += TYPE_WEIGHTS[m.momentType] * (m.confidenceScore / 100);
      existing.count++;
    } else {
      typeScoreMap.set(m.momentType, {
        totalWeight: TYPE_WEIGHTS[m.momentType] * (m.confidenceScore / 100),
        count: 1,
      });
    }
  }
  const strongestSignals = Array.from(typeScoreMap.entries())
    .sort(([, a], [, b]) => b.totalWeight - a.totalWeight)
    .slice(0, 3)
    .map(([type]) => TYPE_LABELS[type]);

  // ── Weaknesses ──
  const weaknesses = deriveWeaknesses({
    clipability,
    validationMoments,
    confessionMoments,
    mechanismReframes,
    emotionalDensity,
    educationalDensity,
    total,
    overallScore,
  });

  // ── Creator fit ──
  const presentTypes = new Set(moments.map((m) => m.momentType));
  const creatorFit = deriveCreatorFit(presentTypes, clipability);

  // ── Summary ──
  const summary = generateSummary({
    clipability,
    hasValidation: validationMoments > 0,
    hasConfession: confessionMoments > 0,
    hasMechanism: mechanismReframes > 0,
    hasStory: moments.some((m) => m.momentType === "story_turning_point"),
    hasTransformation: moments.some((m) => m.momentType === "transformation_moment"),
    educationalDensity,
    uniquePremiumTypes,
  });

  return {
    overallScore,
    clipability,
    strongestSignals,
    weaknesses,
    creatorFit,
    emotionalDensity,
    mechanismReframes,
    validationMoments,
    confessionMoments,
    educationalDensity,
    psychologicalRichness,
    summary,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function deriveWeaknesses(opts: {
  clipability: string;
  validationMoments: number;
  confessionMoments: number;
  mechanismReframes: number;
  emotionalDensity: number;
  educationalDensity: number;
  total: number;
  overallScore: number;
}): string[] {
  const {
    clipability,
    validationMoments,
    confessionMoments,
    mechanismReframes,
    emotionalDensity,
    educationalDensity,
    total,
    overallScore,
  } = opts;

  if (clipability === "high") return []; // high clipability → no weaknesses surfaced

  const result: string[] = [];

  if (validationMoments === 0 && confessionMoments === 0) {
    result.push("No identity tension or confession arc detected");
  }
  if (mechanismReframes === 0) {
    result.push("Limited mechanism reframe potential");
  }
  if (educationalDensity >= 60 && emotionalDensity < 25) {
    result.push("Educational structure without emotional contrast");
  }
  if (total <= 2 && overallScore < MEDIUM_THRESHOLD) {
    result.push("Few psychologically distinct moments detected");
  }

  return result.slice(0, 2);
}

function deriveCreatorFit(
  presentTypes: Set<MomentType>,
  clipability: string
): string[] {
  const platforms = new Set<string>();

  if (
    presentTypes.has("validation_hook") ||
    presentTypes.has("emotional_confession") ||
    presentTypes.has("transformation_moment")
  ) {
    platforms.add("TikTok");
    platforms.add("Reels");
  }
  if (presentTypes.has("mechanism_reframe") || presentTypes.has("contrarian_insight")) {
    platforms.add("Twitter");
    platforms.add("LinkedIn");
  }
  if (presentTypes.has("story_turning_point")) {
    platforms.add("YouTube");
    if (!platforms.has("TikTok")) platforms.add("TikTok");
  }
  if (presentTypes.has("fomo_loss_frame")) {
    platforms.add("TikTok");
    platforms.add("Twitter");
  }
  if (presentTypes.has("educational_gem") || presentTypes.has("authority_proof")) {
    platforms.add("LinkedIn");
    platforms.add("YouTube");
  }
  if (presentTypes.has("quote_moment")) {
    platforms.add("Instagram");
  }

  // If low clipability with no strong fits, default to long-form
  if (platforms.size === 0 || (clipability === "low" && platforms.size <= 1)) {
    return ["YouTube", "LinkedIn"];
  }

  return Array.from(platforms).slice(0, 4);
}

function generateSummary(opts: {
  clipability: string;
  hasValidation: boolean;
  hasConfession: boolean;
  hasMechanism: boolean;
  hasStory: boolean;
  hasTransformation: boolean;
  educationalDensity: number;
  uniquePremiumTypes: number;
}): string {
  const {
    clipability,
    hasValidation,
    hasConfession,
    hasMechanism,
    hasStory,
    hasTransformation,
    educationalDensity,
    uniquePremiumTypes,
  } = opts;

  if (clipability === "high") {
    if (hasConfession && hasMechanism) {
      return "Strong emotional arc detected — confession moments and mechanism reframes ground this transcript in specific psychological tension. High short-form potential.";
    }
    if (hasValidation && hasMechanism) {
      return "Identity resonance and reframe moments detected. Transcript has the psychological contrast that drives saves and shares on TikTok and Twitter.";
    }
    if (hasStory || hasTransformation) {
      return "Story arc with clear turning points detected. Narrative tension makes this transcript strong for both short-form clips and long-form engagement.";
    }
    if (uniquePremiumTypes >= 3) {
      return "Psychologically rich content across multiple moment types. Strong short-form clip potential across platforms.";
    }
    return "Strong psychological density detected. This transcript has real clipable moments worth surfacing.";
  }

  if (clipability === "medium") {
    if (educationalDensity >= 50) {
      return "Good educational structure with clear mechanisms. Limited emotional contrast reduces short-form impact — strongest on LinkedIn and YouTube.";
    }
    if (hasMechanism) {
      return "Mechanism reframe moments detected, but limited confession or identity tension. Medium clip potential — anchor to the strongest reframe for best results.";
    }
    if (hasStory) {
      return "Story moments detected but emotional contrast is moderate. Surface the key turning point to maximize short-form potential.";
    }
    return "Moderate psychological density. Some strong moments detected — identify the emotional high point and anchor clips there.";
  }

  // low
  if (educationalDensity >= 40) {
    return "Primarily educational content structure. Limited psychological contrast detected — strongest for long-form and YouTube rather than short-form clips.";
  }
  return "Transcript lacks distinct psychological contrast. Repurposing is possible — identify the confession or reframe moment manually to anchor clips.";
}
