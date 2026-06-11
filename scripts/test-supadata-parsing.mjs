// Zero-cost Supadata response-parsing smoke test.
// Mirrors response-handling logic from app/lib/ai/transcript.ts.
// Run with: node scripts/test-supadata-parsing.mjs
// No TypeScript compiler. No network calls. No API cost.
//
// Optional live test (real Supadata call, consumes API quota):
//   SUPADATA_API_KEY=<key> LIVE=1 node scripts/test-supadata-parsing.mjs

// ─── Inline mirrors ───────────────────────────────────────────────────────────

function cleanText(raw) {
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

function computeDurationSeconds(segments) {
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

// mirrors toFriendlyError from transcript.ts
function toFriendlyError(err) {
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

// mirrors the post-fetch parsing logic from getTranscriptFull
function parseSupadataResponse(data) {
  if (typeof data.content === "string") {
    const text = cleanText(data.content);
    if (!text) throw new Error("No transcript content found for this video.");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const durationSec = Math.ceil((wordCount / 130) * 60);
    return { transcript: text, timestampedTranscript: text, durationSec, mode: "plaintext" };
  }

  const segments = Array.isArray(data.content)
    ? data.content.filter((c) => c.text?.trim()).map((c) => ({ text: c.text, offset: c.offset, duration: c.duration }))
    : [];

  if (segments.length === 0) throw new Error("No transcript content found for this video.");

  const transcript = cleanText(segments.map((s) => s.text).join(" "));
  const durationSec = computeDurationSeconds(segments);
  return { transcript, timestampedTranscript: "[timestamped]", durationSec, mode: "segments", segments };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Real Supadata segment shape (offset + duration in ms)
const SAMPLE_SEGMENTS = [
  { text: "And it is worth mentioning", offset: 0, duration: 2000, lang: "en" },
  { text: "that Simon Sinek is one of", offset: 2000, duration: 2500, lang: "en" },
  { text: "the most watched TED speakers", offset: 4500, duration: 3000, lang: "en" },
  { text: "of all time.", offset: 7500, duration: 1500, lang: "en" },
];

// Seconds-mode segments (legacy: duration/offset are floats in seconds)
const SAMPLE_SEGMENTS_SECONDS = [
  { text: "First sentence here", offset: 0.0, duration: 2.5 },
  { text: "Second sentence here", offset: 2.5, duration: 3.0 },
  { text: "Third sentence here", offset: 5.5, duration: 2.0 },
];

// ─── Assertions ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function assertThrows(fn, containsMsg, label) {
  try {
    fn();
    console.error(`  ✗ FAIL (no throw): ${label}`);
    failed++;
  } catch (err) {
    if (containsMsg && !err.message.includes(containsMsg)) {
      console.error(`  ✗ FAIL (wrong error "${err.message}"): ${label}`);
      failed++;
    } else {
      console.log(`  ✓ ${label}`);
      passed++;
    }
  }
}

// ─── Segment array mode ───────────────────────────────────────────────────────

console.log("Segment array (default Supadata mode)");
{
  const r = parseSupadataResponse({ content: SAMPLE_SEGMENTS });
  assert(r.mode === "segments", "mode=segments");
  assert(r.transcript.includes("Simon Sinek"), "transcript text assembled");
  assert(r.transcript.length > 0, "transcript non-empty");
  assert(r.durationSec > 0, "durationSec computed");
  // SAMPLE_SEGMENTS: last offset=7500ms, last duration=1500ms → (7500+1500)/1000 = 9s
  assert(Math.abs(r.durationSec - 9) < 0.01, `durationSec=9 (ms mode): got ${r.durationSec}`);
}

console.log("\nSegment array — seconds-mode offsets (float durations)");
{
  const r = parseSupadataResponse({ content: SAMPLE_SEGMENTS_SECONDS });
  assert(r.mode === "segments", "mode=segments");
  // last offset=5.5, last duration=2.0 → 7.5s
  assert(Math.abs(r.durationSec - 7.5) < 0.01, `durationSec=7.5 (seconds mode): got ${r.durationSec}`);
}

console.log("\nSegment array — whitespace-only segments filtered out");
{
  const withBlanks = [
    ...SAMPLE_SEGMENTS,
    { text: "   ", offset: 9000, duration: 500 },
    { text: "\n", offset: 9500, duration: 200 },
  ];
  const r = parseSupadataResponse({ content: withBlanks });
  assert(r.segments.length === SAMPLE_SEGMENTS.length, "blank segments stripped");
}

console.log("\nSegment array — HTML entities decoded in transcript");
{
  const withEntities = [
    { text: "It&amp;s a great &amp; important point", offset: 0, duration: 2000 },
  ];
  const r = parseSupadataResponse({ content: withEntities });
  assert(r.transcript.includes("It&s"), "HTML &amp; decoded to &");
}

console.log("\nSegment array — cleanText removes [Music] / [Applause] tags");
{
  const withTags = [
    { text: "[Music]", offset: 0, duration: 1000 },
    { text: "Real words here", offset: 1000, duration: 2000 },
    { text: "[Applause]", offset: 3000, duration: 500 },
  ];
  const r = parseSupadataResponse({ content: withTags });
  assert(!r.transcript.includes("[Music]"), "[Music] stripped");
  assert(!r.transcript.includes("[Applause]"), "[Applause] stripped");
  assert(r.transcript.includes("Real words"), "real words preserved");
}

// ─── Plain-text mode ──────────────────────────────────────────────────────────

console.log("\nPlain-text string mode");
{
  const text = "Simon Sinek talks about the golden circle and why leaders inspire action.";
  const r = parseSupadataResponse({ content: text });
  assert(r.mode === "plaintext", "mode=plaintext");
  assert(r.transcript === text, "transcript matches input");
  assert(r.timestampedTranscript === text, "timestampedTranscript = transcript in plaintext mode");
  // 12 words → ceil((12/130)*60) = ceil(5.5) = 6
  assert(r.durationSec > 0, "durationSec estimated from word count");
}

console.log("\nPlain-text mode — duration estimation (word count / 130 wpm)");
{
  // 130 words → ceil((130/130)*60) = 60s
  const text = "word ".repeat(130).trim();
  const r = parseSupadataResponse({ content: text });
  assert(r.durationSec === 60, `130 words → 60s: got ${r.durationSec}`);
}
{
  // 260 words → ceil((260/130)*60) = 120s
  const text = "word ".repeat(260).trim();
  const r = parseSupadataResponse({ content: text });
  assert(r.durationSec === 120, `260 words → 120s: got ${r.durationSec}`);
}

// ─── Empty / missing content ──────────────────────────────────────────────────

console.log("\nEmpty / missing content → throws");
assertThrows(
  () => parseSupadataResponse({ content: [] }),
  "No transcript content found",
  "empty segment array throws"
);
assertThrows(
  () => parseSupadataResponse({ content: "" }),
  "No transcript content found",
  "empty string content throws"
);
assertThrows(
  () => parseSupadataResponse({ content: "   " }),
  "No transcript content found",
  "whitespace-only string throws after cleanText"
);
assertThrows(
  () => parseSupadataResponse({ content: [{ text: "  ", offset: 0, duration: 500 }] }),
  "No transcript content found",
  "segment array with only whitespace throws"
);

// ─── toFriendlyError ─────────────────────────────────────────────────────────

console.log("\ntoFriendlyError — AbortError (timeout)");
{
  const abort = new Error("timeout");
  abort.name = "AbortError";
  const msg = toFriendlyError(abort);
  assert(msg.includes("Taking too long"), "AbortError → taking too long message");
  assert(msg.includes("paste the transcript manually"), "AbortError includes manual paste hint");
}

console.log("\ntoFriendlyError — HTTP status codes");
{
  assert(toFriendlyError(new Error("http_404")).includes("Video not found"), "404 → video not found");
  assert(toFriendlyError(new Error("http_401")).includes("Couldn't fetch"), "401 → generic error");
  assert(toFriendlyError(new Error("captions disabled")).includes("captions enabled"), "disabled → captions message");
  assert(toFriendlyError(new Error("private video")).includes("private"), "private → private message");
  assert(toFriendlyError(new Error("no transcripts found")).includes("captions enabled"), "no transcripts → captions message");
  assert(toFriendlyError(new Error("no longer available")).includes("unavailable"), "unavailable → unavailable message");
}

console.log("\ntoFriendlyError — unknown error → generic fallback");
{
  const msg = toFriendlyError(new Error("something completely unknown happened"));
  assert(msg.includes("Make sure the video is public"), "unknown → generic fallback");
}
{
  const msg = toFriendlyError("plain string, not an Error");
  assert(typeof msg === "string" && msg.length > 0, "non-Error arg → does not crash");
}

// ─── computeDurationSeconds ───────────────────────────────────────────────────

console.log("\ncomputeDurationSeconds — ms vs seconds auto-detection");
{
  // ms mode: avg duration > 100
  const msSegs = [
    { text: "a", offset: 0, duration: 2000 },
    { text: "b", offset: 2000, duration: 3000 },
  ];
  const dur = computeDurationSeconds(msSegs);
  assert(Math.abs(dur - 5.0) < 0.01, `ms mode: (2000+3000)/1000 = 5s: got ${dur}`);
}
{
  // seconds mode: float offsets → isMs=false
  const secSegs = [
    { text: "a", offset: 0.0, duration: 2.5 },
    { text: "b", offset: 2.5, duration: 3.0 },
  ];
  const dur = computeDurationSeconds(secSegs);
  assert(Math.abs(dur - 5.5) < 0.01, `seconds mode: 2.5+3.0=5.5s: got ${dur}`);
}
{
  assert(computeDurationSeconds([]) === 0, "empty segments → 0");
  assert(computeDurationSeconds(null) === 0, "null → 0");
}

// ─── Optional live test ───────────────────────────────────────────────────────

if (process.env.LIVE === "1") {
  const key = process.env.SUPADATA_API_KEY;
  if (!key) {
    console.warn("\n[LIVE] Skipped — SUPADATA_API_KEY not set");
  } else {
    console.log("\n[LIVE] Testing real Supadata call for u4ZoJKF_VuA...");
    const TEST_URL = "https://www.youtube.com/watch?v=u4ZoJKF_VuA";
    const SUPADATA_URL = "https://api.supadata.ai/v1/transcript";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    const t0 = Date.now();
    try {
      const resp = await fetch(
        `${SUPADATA_URL}?url=${encodeURIComponent(TEST_URL)}`,
        { headers: { "x-api-key": key }, signal: controller.signal }
      );
      clearTimeout(timer);
      const elapsed = Date.now() - t0;
      assert(resp.ok, `[LIVE] HTTP ${resp.status} (elapsed=${elapsed}ms)`);
      if (resp.ok) {
        const data = await resp.json();
        const r = parseSupadataResponse(data);
        assert(r.transcript.length > 100, `[LIVE] transcript has >100 chars (${r.transcript.length})`);
        assert(r.durationSec > 0, `[LIVE] durationSec=${r.durationSec}`);
        console.log(`  [LIVE] chars=${r.transcript.length} durationSec=${r.durationSec} mode=${r.mode} elapsed=${elapsed}ms`);
      }
    } catch (err) {
      clearTimeout(timer);
      console.error(`  [LIVE] ✗ ${toFriendlyError(err)}`);
      failed++;
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
