import { getYouTubeVideoId } from "../youtube";
import { buildTimestampedTranscript } from "../timeline/build-timestamped-transcript";
import type { RawSegment } from "../timeline/build-timestamped-transcript";

export interface TranscriptResult {
  transcript: string;
  timestampedTranscript: string;
  durationSec: number;
}

export interface TranscriptDiagnosis {
  videoId: string | null;
  urlType: string;
  supadataStatus: number | null;
  supadataChars: number | null;
  supadataElapsedMs: number | null;
  ok: boolean;
  friendlyError: string | null;
}

interface SupadataSegment {
  text: string;
  offset: number;
  duration: number;
  lang?: string;
}

interface SupadataResponse {
  content: SupadataSegment[] | string;
  lang?: string;
  availableLangs?: string[];
}

const SUPADATA_URL = "https://api.supadata.ai/v1/transcript";
const TIMEOUT_MS = 20_000;

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTranscriptFull(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = getYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error("Please paste a valid YouTube link.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = Date.now();

  console.log(`[virnix-transcript] supadata start url=${youtubeUrl}`);

  let resp: Response;
  try {
    resp = await fetch(
      `${SUPADATA_URL}?url=${encodeURIComponent(youtubeUrl)}`,
      {
        headers: { "x-api-key": process.env.SUPADATA_API_KEY ?? "" },
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timer);
    const elapsedMs = Date.now() - t0;
    console.log(
      `[virnix-transcript] supadata error elapsed=${elapsedMs}ms err=${err instanceof Error ? err.name : "unknown"}`
    );
    throw new Error(toFriendlyError(err));
  }
  clearTimeout(timer);

  const elapsedMs = Date.now() - t0;

  if (!resp.ok) {
    console.log(
      `[virnix-transcript] supadata fail status=${resp.status} elapsed=${elapsedMs}ms`
    );
    throw new Error(toFriendlyError(new Error(`http_${resp.status}`)));
  }

  const data = (await resp.json()) as SupadataResponse;

  if (data.lang) {
    console.log(
      `[virnix-transcript] supadata transcript-lang=${data.lang}${
        data.availableLangs?.length ? ` availableLangs=${data.availableLangs.join(",")}` : ""
      }`
    );
  }

  // Plain-text mode (text=true) returns content as a string.
  if (typeof data.content === "string") {
    const text = cleanText(data.content);
    if (!text) {
      console.log(`[virnix-transcript] supadata empty chars=0 elapsed=${elapsedMs}ms`);
      throw new Error("No transcript content found for this video.");
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const durationSec = Math.ceil((wordCount / 130) * 60);
    console.log(`[virnix-transcript] supadata ok chars=${text.length} elapsed=${elapsedMs}ms`);
    return { transcript: text, timestampedTranscript: text, durationSec };
  }

  // Segment array mode (default).
  const segments: RawSegment[] = Array.isArray(data.content)
    ? data.content
        .filter((c) => c.text?.trim())
        .map((c) => ({ text: c.text, offset: c.offset, duration: c.duration }))
    : [];

  if (segments.length === 0) {
    console.log(`[virnix-transcript] supadata empty chars=0 elapsed=${elapsedMs}ms`);
    throw new Error("No transcript content found for this video.");
  }

  const transcript = cleanText(segments.map((s) => s.text).join(" "));
  const timestampedTranscript = buildTimestampedTranscript(segments);
  const durationSec = computeDurationSeconds(segments);

  console.log(
    `[virnix-transcript] supadata ok chars=${transcript.length} elapsed=${elapsedMs}ms`
  );

  return { transcript, timestampedTranscript, durationSec };
}

export async function diagnoseTranscript(youtubeUrl: string): Promise<TranscriptDiagnosis> {
  const videoId = getYouTubeVideoId(youtubeUrl);
  const urlType = youtubeUrl.includes("/shorts/")
    ? "shorts"
    : youtubeUrl.includes("youtu.be/")
    ? "youtu.be"
    : youtubeUrl.includes("watch?")
    ? "watch"
    : "other";

  const diag: TranscriptDiagnosis = {
    videoId,
    urlType,
    supadataStatus: null,
    supadataChars: null,
    supadataElapsedMs: null,
    ok: false,
    friendlyError: null,
  };

  if (!videoId) {
    diag.friendlyError = "Invalid YouTube URL";
    return diag;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = Date.now();

  try {
    const resp = await fetch(
      `${SUPADATA_URL}?url=${encodeURIComponent(youtubeUrl)}`,
      {
        headers: { "x-api-key": process.env.SUPADATA_API_KEY ?? "" },
        signal: controller.signal,
      }
    );

    diag.supadataStatus = resp.status;
    diag.supadataElapsedMs = Date.now() - t0;

    if (!resp.ok) {
      diag.friendlyError = toFriendlyError(new Error(`http_${resp.status}`));
      return diag;
    }

    const data = (await resp.json()) as SupadataResponse;

    if (typeof data.content === "string") {
      diag.supadataChars = data.content.length;
      diag.ok = data.content.length > 0;
      if (!diag.ok) diag.friendlyError = "Empty transcript returned.";
    } else if (Array.isArray(data.content)) {
      const joined = data.content.map((c) => c.text).join(" ");
      diag.supadataChars = joined.length;
      diag.ok = data.content.length > 0;
      if (!diag.ok) diag.friendlyError = "Empty transcript returned.";
    } else {
      diag.friendlyError = "Unexpected response shape.";
    }
  } catch (err) {
    diag.supadataElapsedMs = Date.now() - t0;
    diag.friendlyError = toFriendlyError(err);
  } finally {
    clearTimeout(timer);
  }

  return diag;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDurationSeconds(segments: RawSegment[]): number {
  if (!segments || segments.length === 0) return 0;
  const isMs = (() => {
    if (segments.some((s) => s.duration % 1 !== 0 || s.offset % 1 !== 0)) return false;
    const sample = segments.filter((s) => s.duration > 0).slice(0, 10);
    if (!sample.length) return true;
    const avg = sample.reduce((sum, s) => sum + s.duration, 0) / sample.length;
    return avg > 100;
  })();
  const last = segments[segments.length - 1];
  const offsetSec = isMs ? last.offset / 1000 : last.offset;
  const durSec = isMs ? last.duration / 1000 : last.duration;
  return offsetSec + durSec;
}

function cleanText(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function toFriendlyError(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") {
    return "Taking too long to fetch the transcript. Please try again, or paste the transcript manually.";
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("too many requests") || msg.includes("captcha")) {
    return "YouTube is temporarily blocking transcript access. Please try again in a few minutes.";
  }
  if (msg.includes("disabled")) {
    return "This video doesn't have captions enabled. Try a public YouTube video with captions.";
  }
  if (msg.includes("no longer available") || msg.includes("unavailable")) {
    return "This video is unavailable.";
  }
  if (msg.includes("private")) {
    return "This video is private or restricted.";
  }
  if (msg.includes("no transcript") || msg.includes("no transcripts")) {
    return "No transcript was found for this video. Try a video with captions enabled.";
  }
  if (msg.includes("not found") || msg.includes("http_404")) {
    return "Video not found. Please check the URL.";
  }
  return "Couldn't fetch the transcript. Make sure the video is public and has captions enabled.";
}
