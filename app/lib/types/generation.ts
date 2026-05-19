import type { OutputCardData } from "../outputCards";
import type { AIDiagnostics } from "../ai/diagnostics";

export interface GenerateRequest {
  youtubeUrl: string;
}

export interface GenerateResult {
  cards: OutputCardData[];
  generatedAt: string;
  diagnostics?: AIDiagnostics;
}

export type GenerateResponse =
  | { ok: true; data: GenerateResult }
  | { ok: false; error: string };
