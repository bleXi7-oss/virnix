// Converts raw YouTube transcript segments (from youtube-transcript library) into
// a timestamped transcript string suitable for moment detection.
//
// The youtube-transcript library returns segments in two formats:
//   srv3 (InnerTube API): offset in milliseconds (integer)
//   classic XML:          offset in seconds (float)
//
// This module auto-detects the unit and normalises to seconds before formatting.
//
// Output format: one line per segment
//   "00:42 Your brain isn't resisting change."
//   "00:48 It's protecting your identity."

export interface RawSegment {
  text: string;
  offset: number;   // ms (srv3) or seconds (classic) — see detectUnit()
  duration: number;
}

// Detects whether offset/duration values are in milliseconds or seconds.
// srv3 segments are integers in ms (e.g. 3000 for 3s).
// Classic XML segments are floats in seconds (e.g. 3.0 or 2.34).
function detectUnit(segments: RawSegment[]): "ms" | "s" {
  // Use first 20 segments for unit detection — a single malformed late segment with
  // a decimal offset (e.g., 2097000.4 ms from floating-point conversion) must not
  // misclassify the entire batch as seconds and corrupt the displayed timestamps.
  const detectSample = segments.slice(0, 20);
  // Float decimal part → classic format in seconds
  if (detectSample.some((s) => s.duration % 1 !== 0 || s.offset % 1 !== 0)) return "s";
  // Large integer durations → srv3 milliseconds (typical segment = 2–5s = 2000–5000ms)
  const sample = detectSample.filter((s) => s.duration > 0).slice(0, 10);
  if (sample.length === 0) return "ms";
  const avg = sample.reduce((sum, s) => sum + s.duration, 0) / sample.length;
  return avg > 100 ? "ms" : "s";
}

function toSeconds(value: number, unit: "ms" | "s"): number {
  return unit === "ms" ? value / 1000 : value;
}

function formatSeconds(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function cleanText(text: string): string {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTimestampedTranscript(segments: RawSegment[]): string {
  if (!segments || segments.length === 0) return "";

  const unit = detectUnit(segments);
  const lines: string[] = [];

  for (const seg of segments) {
    const text = cleanText(seg.text);
    if (!text) continue;
    const ts = formatSeconds(toSeconds(seg.offset, unit));
    lines.push(`${ts} ${text}`);
  }

  return lines.join("\n");
}
