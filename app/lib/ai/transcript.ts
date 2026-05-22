import { YoutubeTranscript } from "youtube-transcript";
import { getYouTubeVideoId } from "../youtube";
import { buildTimestampedTranscript } from "../timeline/build-timestamped-transcript";
import type { RawSegment } from "../timeline/build-timestamped-transcript";

export interface TranscriptResult {
  transcript: string;
  timestampedTranscript: string;
  durationSec: number;
}

// ─── Enhanced InnerTube fetcher ───────────────────────────────────────────────
// The youtube-transcript package's InnerTube context is minimal and can fail on
// cloud server IPs (Vercel). This fetcher tries two clients with full context
// before falling back to the package's own logic.

// prettyPrint=false is required — YouTube returns 400 without it
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

const INNERTUBE_CLIENTS = [
  {
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "20.10.38",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "20.10.38",
    },
  },
] as const;

// Prefers English (exact, then prefix), falls back to first available track.
function selectTrack(
  tracks: Array<{ languageCode?: string; baseUrl?: string }>
): { languageCode?: string; baseUrl?: string } | null {
  if (tracks.length === 0) return null;
  return (
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode?.startsWith("en")) ??
    tracks[0]
  );
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    );
}

// Handles both srv3 (<p t="ms" d="ms">) and classic (<text start="s" dur="s">) XML.
function parseTranscriptXml(xml: string): RawSegment[] {
  const results: RawSegment[] = [];

  // srv3 format
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRegex.exec(xml)) !== null) {
    const text = decodeXmlEntities(m[3].replace(/<[^>]+>/g, "")).trim();
    if (text) {
      results.push({ text, duration: parseInt(m[2], 10), offset: parseInt(m[1], 10) });
    }
  }
  if (results.length > 0) return results;

  // Classic format
  const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  while ((m = classicRegex.exec(xml)) !== null) {
    const text = decodeXmlEntities(m[3]).trim();
    if (text) {
      results.push({ text, duration: parseFloat(m[2]), offset: parseFloat(m[1]) });
    }
  }
  return results;
}

async function fetchViaInnerTubeDirect(videoId: string): Promise<RawSegment[] | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const resp = await fetch(INNERTUBE_URL, {
        method: "POST",
        headers: client.headers as Record<string, string>,
        body: JSON.stringify({
          context: client.context,
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });
      if (!resp.ok) continue;

      const data = await resp.json();
      const tracks: Array<{ languageCode?: string; baseUrl?: string }> =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

      const track = selectTrack(tracks);
      if (!track?.baseUrl) continue;

      const captionUrl = new URL(track.baseUrl);
      if (!captionUrl.hostname.endsWith(".youtube.com")) continue;

      const xmlResp = await fetch(track.baseUrl);
      if (!xmlResp.ok) continue;

      const segments = parseTranscriptXml(await xmlResp.text());
      if (segments.length > 0) return segments;
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Duration calculation ─────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTranscriptFull(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = getYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error("Please paste a valid YouTube link.");
  }

  // 1. Enhanced InnerTube (better context for cloud IPs — tries ANDROID then WEB client).
  const directSegments = await fetchViaInnerTubeDirect(videoId);
  if (directSegments && directSegments.length > 0) {
    return buildResult(directSegments);
  }

  // 2. Fallback: youtube-transcript package (InnerTube + HTML scraping).
  //    Prefer English; if the language isn't available, retry without filter.
  let segments: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>;
  try {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    } catch (langErr) {
      const msg = langErr instanceof Error ? langErr.message.toLowerCase() : "";
      if (msg.includes("no transcripts are available in") || msg.includes("available languages")) {
        segments = await YoutubeTranscript.fetchTranscript(videoId);
      } else {
        throw langErr;
      }
    }
  } catch (err) {
    throw new Error(toFriendlyError(err));
  }

  if (!segments || segments.length === 0) {
    throw new Error("No transcript content found for this video.");
  }

  return buildResult(segments as unknown as RawSegment[]);
}

function buildResult(segments: RawSegment[]): TranscriptResult {
  const transcript = cleanText(segments.map((s) => s.text).join(" "));
  const timestampedTranscript = buildTimestampedTranscript(segments);
  const durationSec = computeDurationSeconds(segments);
  return { transcript, timestampedTranscript, durationSec };
}

export async function getTranscript(youtubeUrl: string): Promise<string> {
  const result = await getTranscriptFull(youtubeUrl);
  return result.transcript;
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

function toFriendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("too many requests") || msg.includes("captcha")) {
    return "YouTube is temporarily blocking transcript access. Please try again in a few minutes.";
  }
  if (msg.includes("disabled")) {
    return "This video doesn't have captions or a readable transcript. Try a public YouTube video with captions enabled.";
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
  if (msg.includes("not available")) {
    return "This video is private or unavailable.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "Video not found. Please check the URL.";
  }
  return "Couldn't fetch the transcript. Make sure the video is public and has captions enabled.";
}
