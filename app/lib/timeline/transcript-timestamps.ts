// Timestamp detection and segmentation for transcripts.
//
// Supports common timestamp formats:
//   00:42   1:23   01:02:15   [00:42]   (00:42)
//
// If the transcript has no timestamps, all functions return empty arrays.
// Callers must handle empty gracefully — timeline detection is optional.
// No external dependencies.

// Matches HH:MM:SS, MM:SS, or wrapped variants like [00:42] or (00:42)
const TIMESTAMP_RE = /(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?/;

export interface TimestampedLine {
  timestamp: string;   // raw matched value, e.g. "00:42"
  seconds: number;     // total seconds equivalent
  text: string;        // line content with timestamp removed
  rawLine: string;     // original unmodified line
}

export interface TranscriptSegment {
  startTime: string;     // formatted timestamp, e.g. "00:42"
  endTime: string;       // empty string if this is the last segment
  startSeconds: number;
  endSeconds: number;    // 0 if last segment
  text: string;          // content of this segment
}

// Converts "H:MM:SS" or "M:SS" to total seconds.
export function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Converts total seconds back to "MM:SS" or "H:MM:SS" string.
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Returns all lines from the transcript that contain a parseable timestamp.
// Lines without timestamps are ignored.
export function detectTimestampedLines(transcript: string): TimestampedLine[] {
  const lines = transcript.split(/\r?\n/);
  const result: TimestampedLine[] = [];

  for (const rawLine of lines) {
    const match = rawLine.match(TIMESTAMP_RE);
    if (!match) continue;

    result.push({
      timestamp: match[1],
      seconds: parseTimestamp(match[1]),
      text: rawLine.replace(match[0], "").trim(),
      rawLine,
    });
  }

  return result;
}

// Groups timestamped lines into segments: each segment spans from one timestamp
// to the next. Text within a segment is the line content, not the surrounding lines.
// For multi-line segments, the caller should pre-aggregate lines by timestamp first.
export function groupLinesIntoSegments(lines: TimestampedLine[]): TranscriptSegment[] {
  if (lines.length === 0) return [];

  return lines.map((line, i) => {
    const next = lines[i + 1];
    return {
      startTime: formatTimestamp(line.seconds),
      endTime: next ? formatTimestamp(next.seconds) : "",
      startSeconds: line.seconds,
      endSeconds: next ? next.seconds : 0,
      text: line.text,
    };
  });
}
