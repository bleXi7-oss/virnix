import type { OutputCardData } from "../outputCards";

export interface GenerateRequest {
  youtubeUrl: string;
}

export interface GenerateResult {
  cards: OutputCardData[];
  generatedAt: string;
}

export type GenerateResponse =
  | { ok: true; data: GenerateResult }
  | { ok: false; error: string };
