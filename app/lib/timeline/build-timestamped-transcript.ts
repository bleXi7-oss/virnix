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
  // Magnitude-based unit detection on the first 20 segments.
  // Supadata returns ms-format offsets with float imprecision throughout (e.g. 3960.2ms),
  // so decimal presence alone cannot determine the format — 3960.2 is ms, 3.2 is seconds.
  // ms durations: 2000–5000; seconds durations: 2–5. Median > 100 → milliseconds.
  const detectSample = segments.slice(0, 20);
  const sample = detectSample.filter((s) => s.duration > 0).slice(0, 10);
  if (sample.length === 0) return "ms";
  const sorted = [...sample.map((s) => s.duration)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return median > 100 ? "ms" : "s";
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
