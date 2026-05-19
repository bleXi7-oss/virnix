import type { OutputCardData } from "../outputCards";
import type { AIDiagnostics } from "../ai/diagnostics";
import type { TimelineMoment } from "../timeline/types";
import type { TranscriptQualityReport } from "../timeline/transcript-quality";

export interface GenerateRequest {
  youtubeUrl: string;
}

export interface GenerateResult {
  cards: OutputCardData[];
  generatedAt: string;
  diagnostics?: AIDiagnostics;
  timelineMoments?: TimelineMoment[];
  transcriptQuality?: TranscriptQualityReport;
}

export type GenerateResponse =
  | { ok: true; data: GenerateResult }
  | { ok: false; error: string };
