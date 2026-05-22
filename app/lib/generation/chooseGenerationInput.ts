import { isValidYouTubeUrl } from "../youtube";

export type GenerationInputMode = "manual_transcript" | "youtube";

export interface GenerationInputError {
  message: string;
  status: number;
}

export interface GenerationInputResult {
  mode: GenerationInputMode;
  transcript?: string;
  youtubeUrl?: string;
  error?: GenerationInputError;
}

const MAX_PASTE_CHARS = 20000;
const MIN_PASTE_CHARS = 50;

// Pure function — no side effects, no network calls, no auth.
// Determines whether the request body represents a manual transcript paste
// or a YouTube URL generation, and validates accordingly.
// Always returns either { transcript } or { youtubeUrl } or { error }.
export function chooseGenerationInput(body: Record<string, unknown>): GenerationInputResult {
  // Manual transcript mode: presence of `transcript` field takes priority over youtubeUrl.
  if (typeof body.transcript === "string") {
    const trimmed = body.transcript.trim();
    if (trimmed.length <= MIN_PASTE_CHARS) {
      return {
        mode: "manual_transcript",
        error: {
          message: "Transcript is too short. Paste more text (at least a paragraph).",
          status: 400,
        },
      };
    }
    if (trimmed.length > MAX_PASTE_CHARS) {
      return {
        mode: "manual_transcript",
        error: {
          message: "Transcript is too long. Paste a shorter excerpt (max ~20 minutes of speech).",
          status: 400,
        },
      };
    }
    return { mode: "manual_transcript", transcript: trimmed };
  }

  // YouTube URL mode.
  if (!body.youtubeUrl || typeof body.youtubeUrl !== "string") {
    return {
      mode: "youtube",
      error: { message: "youtubeUrl is required", status: 400 },
    };
  }
  if (!isValidYouTubeUrl(body.youtubeUrl)) {
    return {
      mode: "youtube",
      error: { message: "Please provide a valid YouTube URL", status: 400 },
    };
  }
  return { mode: "youtube", youtubeUrl: body.youtubeUrl };
}
