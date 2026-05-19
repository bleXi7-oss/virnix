// Timeline moment types — transcript intelligence, no AI calls, no persistence.

export type MomentType =
  | "validation_hook"
  | "contrarian_insight"
  | "emotional_confession"
  | "story_turning_point"
  | "educational_gem"
  | "quote_moment"
  | "fomo_loss_frame"
  | "authority_proof"
  | "transformation_moment";

export type PlatformFit =
  | "tiktok"
  | "reels"
  | "shorts"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube";

export interface TimelineMoment {
  id: string;
  startTime: string;          // e.g. "00:42"
  endTime: string;            // e.g. "01:14" — empty string if last segment
  title: string;              // short human-readable label
  momentType: MomentType;
  platformFit: PlatformFit[];
  suggestedHook: string;      // suggested opening line for a clip
  whyItWorks: string;         // psychological reason this moment has power
  emotionalTrigger: string;   // primary emotional mechanism (e.g. "identity relief + curiosity")
  contentUse: string;         // e.g. "short-form clip opener"
  confidenceScore: number;    // 0–100 heuristic — not a predictor, use for relative ranking
  sourceTextPreview: string;  // first ~100 chars of the segment text
}
