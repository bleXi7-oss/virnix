import type { OutputCardData } from "../outputCards";
import type { AIDiagnostics } from "../ai/diagnostics";
import type { TimelineMoment } from "../timeline/types";
import type { TranscriptQualityReport } from "../timeline/transcript-quality";
import type { CreatorEnergyId } from "../creator-energy/types";
import type { OutputLanguageId } from "../languages/types";
import type { BestAngle } from "../ai/schemas";
import type { CreatorBrainProfile } from "../creator-brain/types";

// Returned before AI generation when the transcript language does not match the
// selected output language. No credits are charged. The client shows a warning UI.
export interface TranscriptWarning {
  transcriptLang: string | null;       // Supadata lang code, e.g. "ar", "tr"
  transcriptScript: "arabic" | "cyrillic" | "cjk" | "non_latin" | "latin" | "unknown";
  selectedOutputLang: string;          // e.g. "sl"
  availableLangs: string[];            // Caption tracks Supadata reported
  hasEnglish: boolean;                 // Whether "en" is in availableLangs
  warningCopy: string;                 // Human-readable warning for the UI
}

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
  | { ok: true; data: GenerateResult; creditsUsed: number; creditsRemaining?: number; transcriptLang?: string; transcriptNote?: string }
  | { ok: false; error: string; creditsUsed: number; creditsRequired?: number; creditsAvailable?: number; transcriptWarning?: TranscriptWarning };
