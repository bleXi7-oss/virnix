import { YoutubeTranscript } from "youtube-transcript";
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
  innertubeAttempts: Array<{
    clientName: string;
    httpStatus: number | null;
    playabilityStatus: string | null;
    captionTrackCount: number;
    selectedLang: string | null;
    selectedTrackKind: string | null;
    xmlHttpStatus: number | null;
    xmlSegmentCount: number | null;
    error: string | null;
  }>;
  innertubeSucceeded: boolean;
  packageFallbackError: string | null;
  totalSegmentCount: number | null;
  ok: boolean;
  friendlyError: string | null;
}

// ─── InnerTube clients ────────────────────────────────────────────────────────
// prettyPrint=false is required — YouTube returns 400 without it.
// Clients are tried in order; first to return caption segments wins.
// WEB is first: least likely to get LOGIN_REQUIRED from datacenter IPs.
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

interface InnerTubeClient {
  name: string;
  context: object;
  headers: Record<string, string>;
}

const INNERTUBE_CLIENTS: InnerTubeClient[] = [
  {
    name: "WEB",
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240726.00.00",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20240726.00.00",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/",
    },
  },
  {
    name: "ANDROID",
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
  {
    name: "WEB_EMBEDDED_PLAYER",
    context: {
      client: {
        clientName: "WEB_EMBEDDED_PLAYER",
        clientVersion: "1.20240726.00.00",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "X-YouTube-Client-Name": "56",
      "X-YouTube-Client-Version": "1.20240726.00.00",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/embed/",
    },
  },
  {
    name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    context: {
      client: {
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
      "X-YouTube-Client-Name": "85",
      "X-YouTube-Client-Version": "2.0",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function selectTrack(
  tracks: Array<{ languageCode?: string; baseUrl?: string; kind?: string }>
): { languageCode?: string; baseUrl?: string; kind?: string } | null {
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

function parseTranscriptXml(xml: string): RawSegment[] {
  const results: RawSegment[] = [];
  // srv3 format: <p t="ms" d="ms">
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRegex.exec(xml)) !== null) {
    const text = decodeXmlEntities(m[3].replace(/<[^>]+>/g, "")).trim();
    if (text) {
      results.push({ text, duration: parseInt(m[2], 10), offset: parseInt(m[1], 10) });
    }
  }
  if (results.length > 0) return results;
  // Classic format: <text start="s" dur="s">
  const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  while ((m = classicRegex.exec(xml)) !== null) {
    const text = decodeXmlEntities(m[3]).trim();
    if (text) {
      results.push({ text, duration: parseFloat(m[2]), offset: parseFloat(m[1]) });
    }
  }
  return results;
}

// ─── InnerTube attempt (single client) ───────────────────────────────────────

interface InnerTubeAttemptResult {
  segments: RawSegment[] | null;
  httpStatus: number | null;
  playabilityStatus: string | null;
  captionTrackCount: number;
  selectedLang: string | null;
  selectedTrackKind: string | null;
  xmlHttpStatus: number | null;
  xmlSegmentCount: number | null;
  error: string | null;
}

async function tryInnerTubeClient(
  videoId: string,
  client: InnerTubeClient
): Promise<InnerTubeAttemptResult> {
  const r: InnerTubeAttemptResult = {
    segments: null,
    httpStatus: null,
    playabilityStatus: null,
    captionTrackCount: 0,
    selectedLang: null,
    selectedTrackKind: null,
    xmlHttpStatus: null,
    xmlSegmentCount: null,
    error: null,
  };

  try {
    const resp = await fetch(INNERTUBE_URL, {
      method: "POST",
      headers: client.headers,
      body: JSON.stringify({
        context: client.context,
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });

    r.httpStatus = resp.status;

    if (!resp.ok) {
      r.error = `http_${resp.status}`;
      return r;
    }

    const data = await resp.json() as Record<string, unknown>;
    const ps = data?.playabilityStatus as Record<string, unknown> | undefined;
    r.playabilityStatus = (ps?.status as string) ?? null;

    const captions = data?.captions as Record<string, unknown> | undefined;
    const renderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    const tracks = (renderer?.captionTracks as Array<{ languageCode?: string; baseUrl?: string; kind?: string }>) ?? [];
    r.captionTrackCount = tracks.length;

    const track = selectTrack(tracks);
    if (!track?.baseUrl) {
      r.error = "no_usable_track";
      return r;
    }

    r.selectedLang = track.languageCode ?? null;
    r.selectedTrackKind = track.kind ?? null;

    const captionUrl = new URL(track.baseUrl);
    if (!captionUrl.hostname.endsWith(".youtube.com")) {
      r.error = "unsafe_url";
      return r;
    }

    const xmlResp = await fetch(track.baseUrl);
    r.xmlHttpStatus = xmlResp.status;
    r.xmlSegmentCount = 0;
    if (!xmlResp.ok) {
      r.error = `xml_${xmlResp.status}`;
      return r;
    }

    const segments = parseTranscriptXml(await xmlResp.text());
    r.xmlSegmentCount = segments.length;

    if (segments.length === 0) {
      r.error = "empty_segments";
      return r;
    }

    r.segments = segments;
    return r;
  } catch (err) {
    r.error = `exception:${err instanceof Error ? err.message.slice(0, 80) : "unknown"}`;
    return r;
  }
}

// ─── InnerTube fetch (all clients) ───────────────────────────────────────────

async function fetchViaInnerTubeDirect(videoId: string): Promise<RawSegment[] | null> {
  console.log(`[virnix-transcript] InnerTube start videoId=${videoId}`);

  for (const client of INNERTUBE_CLIENTS) {
    const r = await tryInnerTubeClient(videoId, client);
    console.log(
      `[virnix-transcript] ${client.name} status=${r.httpStatus ?? "?"} playability=${r.playabilityStatus ?? "?"} tracks=${r.captionTrackCount} lang=${r.selectedLang ?? "-"} kind=${r.selectedTrackKind ?? "-"} xmlSegs=${r.xmlSegmentCount ?? "-"} err=${r.error ?? "ok"}`
    );
    if (r.segments) return r.segments;
  }

  console.log(`[virnix-transcript] InnerTube all clients failed`);
  return null;
}

// ─── Duration ─────────────────────────────────────────────────────────────────

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

  // 1. Enhanced InnerTube — tries WEB, ANDROID, WEB_EMBEDDED_PLAYER, TVHTML5_SIMPLY_EMBEDDED_PLAYER in order.
  const directSegments = await fetchViaInnerTubeDirect(videoId);
  if (directSegments && directSegments.length > 0) {
    console.log(`[virnix-transcript] success via InnerTube segments=${directSegments.length}`);
    return buildResult(directSegments);
  }

  // 2. Fallback: youtube-transcript package (InnerTube + HTML scraping).
  console.log(`[virnix-transcript] package fallback start videoId=${videoId}`);
  let segments: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>;
  try {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      console.log(`[virnix-transcript] package returned segments=${segments.length}`);
    } catch (langErr) {
      const msg = langErr instanceof Error ? langErr.message.toLowerCase() : "";
      console.log(`[virnix-transcript] package lang=en error: ${msg.slice(0, 120)}`);
      if (msg.includes("no transcripts are available in") || msg.includes("available languages")) {
        segments = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`[virnix-transcript] package retry returned segments=${segments.length}`);
      } else {
        throw langErr;
      }
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    console.log(`[virnix-transcript] package failed: ${rawMsg.slice(0, 200)}`);
    throw new Error(toFriendlyError(err));
  }

  if (!segments || segments.length === 0) {
    throw new Error("No transcript content found for this video.");
  }

  return buildResult(segments as unknown as RawSegment[]);
}

// Returns structured diagnostics without exposing full transcript text.
// Used by /api/debug/transcript.
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
    innertubeAttempts: [],
    innertubeSucceeded: false,
    packageFallbackError: null,
    totalSegmentCount: null,
    ok: false,
    friendlyError: null,
  };

  if (!videoId) {
    diag.friendlyError = "Invalid YouTube URL";
    return diag;
  }

  for (const client of INNERTUBE_CLIENTS) {
    const r = await tryInnerTubeClient(videoId, client);
    diag.innertubeAttempts.push({
      clientName: client.name,
      httpStatus: r.httpStatus,
      playabilityStatus: r.playabilityStatus,
      captionTrackCount: r.captionTrackCount,
      selectedLang: r.selectedLang,
      selectedTrackKind: r.selectedTrackKind,
      xmlHttpStatus: r.xmlHttpStatus,
      xmlSegmentCount: r.xmlSegmentCount,
      error: r.error,
    });
    if (r.segments) {
      diag.innertubeSucceeded = true;
      diag.totalSegmentCount = r.segments.length;
      diag.ok = true;
      return diag;
    }
  }

  // Package fallback
  try {
    let segments: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>;
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
    if (segments && segments.length > 0) {
      diag.totalSegmentCount = segments.length;
      diag.ok = true;
    } else {
      diag.packageFallbackError = "empty_result";
      diag.friendlyError = "No transcript content found.";
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    diag.packageFallbackError = rawMsg.slice(0, 200);
    diag.friendlyError = toFriendlyError(err);
  }

  return diag;
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
