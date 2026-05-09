import { YoutubeTranscript } from "youtube-transcript";
import { getYouTubeVideoId } from "../youtube";

export async function getTranscript(youtubeUrl: string): Promise<string> {
  const videoId = getYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error("Could not extract video ID from the URL.");
  }

  let segments: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>;

  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    throw new Error(toFriendlyError(err));
  }

  if (!segments || segments.length === 0) {
    throw new Error("No transcript found for this video.");
  }

  return cleanText(segments.map((s) => s.text).join(" "));
}

function cleanText(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, "")   // strip [Music], [Applause], etc.
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
  if (msg.includes("disabled") || msg.includes("no transcript")) {
    return "This video does not have captions enabled.";
  }
  if (msg.includes("private") || msg.includes("not available")) {
    return "This video is private or unavailable.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "Video not found. Please check the URL.";
  }
  return "Could not fetch transcript. The video may not have captions.";
}
