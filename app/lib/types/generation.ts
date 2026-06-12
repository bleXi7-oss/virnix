import type { OutputCardData } from "../outputCards";
import type { AIDiagnostics } from "../ai/diagnostics";
import type { TimelineMoment } from "../timeline/types";
import type { TranscriptQualityReport } from "../timeline/transcript-quality";
import type { CreatorEnergyId } from "../creator-energy/types";
import type { OutputLanguageId } from "../languages/types";
import type { BestAngle } from "../ai/schemas";
import type { CreatorBrainProfile } from "../creator-brain/types";

export type { BestAngle };

export interface GenerateRequest {
  youtubeUrl?: string;
  energyIds?: CreatorEnergyId[];
  outputLanguage?: OutputLanguageId;
  // Server-fetched after auth — never passed from the HTTP request body.
  creatorBrain?: CreatorBrainProfile | null;
}

export interface GenerateResult {
  cards: OutputCardData[];
  generatedAt: string;
  bestAngle?: BestAngle;
  diagnostics?: AIDiagnostics;
  timelineMoments?: TimelineMoment[];
  transcriptQuality?: TranscriptQualityReport;
}

export type GenerateResponse =
  | { ok: true; data: GenerateResult; creditsUsed?: number; creditsRemaining?: number }
  | { ok: false; error: string; creditsRequired?: number; creditsAvailable?: number };
