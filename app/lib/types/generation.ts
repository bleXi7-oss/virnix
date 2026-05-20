import type { OutputCardData } from "../outputCards";
import type { AIDiagnostics } from "../ai/diagnostics";
import type { TimelineMoment } from "../timeline/types";
import type { TranscriptQualityReport } from "../timeline/transcript-quality";
import type { CreatorEnergyId } from "../creator-energy/types";

export interface GenerateRequest {
  youtubeUrl: string;
  energyIds?: CreatorEnergyId[];
}

export interface GenerateResult {
  cards: OutputCardData[];
  generatedAt: string;
  diagnostics?: AIDiagnostics;
  timelineMoments?: TimelineMoment[];
  transcriptQuality?: TranscriptQualityReport;
}

export type GenerateResponse =
  | { ok: true; data: GenerateResult; creditsUsed?: number; creditsRemaining?: number }
  | { ok: false; error: string; creditsRequired?: number; creditsAvailable?: number };
