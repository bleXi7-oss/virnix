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
  const detectSample = segments.slice(0, 20);
  const isMs = (() => {
    const sample = detectSample.filter((s) => s.duration > 0).slice(0, 10);
    if (!sample.length) return true;
    const sorted = [...sample.map((s) => s.duration)].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return median > 100;
  })();
  const last = segments[segments.length - 1];
  const lastOffsetSec = isMs ? last.offset / 1000 : last.offset;
  const lastDurSec   = isMs ? last.duration / 1000 : last.duration;
  let durationSec = lastOffsetSec + lastDurSec;
  if (segments.length >= 10) {
    const allEndSec = segments
      .map((s) => (isMs ? s.offset / 1000 : s.offset) + (isMs ? s.duration / 1000 : s.duration))
      .sort((a, b) => a - b);
    const p90EndSec = allEndSec[Math.floor(allEndSec.length * 0.90)];
    if (durationSec > p90EndSec * 3) {
      durationSec = p90EndSec;
    }
  }
  return durationSec;
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

// ─── TRANSCRIPT-DURATION-QA-A: regression tests ───────────────────────────────
// Production failure: two ~35-minute Huberman Lab Essentials videos were falsely
// rejected with "Content over 120 minutes cannot be processed."
// Root causes found and fixed:
//   1. isMs detection checked ALL segments — a single late decimal offset (e.g.,
//      2097000.4 ms from float conversion) caused isMs=false, treating ms offsets
//      as seconds and inflating 35 min to 583 hours.
//   2. Last-segment-only duration relied on the final segment's offset, which in
//      compilation/Essentials videos can reference the original episode timestamp
//      (e.g., minute 130 of a 3h podcast), not the clip length.
// Fix: isMs detection uses first 20 segments; 90th-percentile outlier guard.

// Helper: makes N consecutive ms-format segments (3 s each)
function makeSegmentsMsFormat(count, startOffsetMs = 0) {
  return Array.from({ length: count }, (_, i) => ({
    text: `word${i}`,
    offset: startOffsetMs + i * 3000,
    duration: 3000,
  }));
}

// Max duration that 7200 sec threshold maps to (in seconds)
const MAX_ALLOWED_SEC = 7200;

console.log("\nTRANSCRIPT-DURATION-QA-A — normal 35-36 min video accepted");
{
  // HXuj7wAt7u8 fixture (~36 min = 720 segments × 3s = 2160 sec)
  const segs = makeSegmentsMsFormat(720); // last offset=719*3000=2,157,000 ms
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `HXuj7wAt7u8 fixture: ~36 min → ${Math.round(dur / 60)} min — accepted (< 120)`,
  );
}
{
  // jwChiek_aRY fixture (~35 min = 700 segments × 3s = 2100 sec)
  const segs = makeSegmentsMsFormat(700); // last offset=699*3000=2,097,000 ms
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `jwChiek_aRY fixture: ~35 min → ${Math.round(dur / 60)} min — accepted (< 120)`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-A — true 125-min video blocked");
{
  // 2500 segments × 3s = 7500 sec = 125 min
  const segs = makeSegmentsMsFormat(2500); // last offset=2499*3000=7,497,000 ms
  const dur = computeDurationSeconds(segs);
  assert(
    dur > MAX_ALLOWED_SEC,
    `true 125-min fixture: → ${Math.round(dur / 60)} min — blocked (> 120)`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-A — compilation video with outlier last segment accepted");
{
  // 35-min compilation (700 normal segments) + 1 final segment at 2h10m of original podcast.
  // Old: uses last segment → 7803 sec = 130 min → blocked.
  // New: p90 guard kicks in (last > p90*3) → ~35 min → accepted.
  const normal = makeSegmentsMsFormat(700); // normal: 0..2,097,000 ms
  const outlier = { text: "from original podcast", offset: 7_800_000, duration: 3000 };
  const segs = [...normal, outlier];
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `compilation outlier fixture: outlier at 130min, p90 guard → ${Math.round(dur / 60)} min — accepted`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-A — ms-format with decimal last segment not inflated");
{
  // The last segment has floating-point imprecision (2097000.4 ms instead of 2097000).
  // Old: segments.some() finds decimal → isMs=false → duration = 2,097,000 sec (583 hr) → blocked.
  // New: magnitude detection: sample median = 3000 > 100 → isMs=true → ~35 min → accepted.
  const normal = makeSegmentsMsFormat(699);
  const malformed = { text: "decimal ms value", offset: 2_097_000.4, duration: 3000.3 };
  const segs = [...normal, malformed];
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `decimal last-segment fixture: isMs=true (magnitude) → ${Math.round(dur / 60)} min — accepted`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-A — multiple outlier tail segments handled");
{
  // Last 5 segments reference original episode at 2h+ (5 outliers, not just 1)
  const normal = makeSegmentsMsFormat(695);
  const outliers = [
    { text: "clip1", offset: 7_800_000, duration: 3000 },
    { text: "clip2", offset: 7_803_000, duration: 3000 },
    { text: "clip3", offset: 7_806_000, duration: 3000 },
    { text: "clip4", offset: 7_809_000, duration: 3000 },
    { text: "clip5", offset: 7_812_000, duration: 3000 },
  ];
  const segs = [...normal, ...outliers];
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `5-outlier tail fixture: p90 guard → ${Math.round(dur / 60)} min — accepted`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-A — unit conversion: ms → seconds → minutes");
{
  // 36 min in ms: last offset = 2157000 ms → / 1000 = 2157 sec → 36 min
  const segs = makeSegmentsMsFormat(720);
  const durSec = computeDurationSeconds(segs);
  const durMin = durSec / 60;
  assert(durSec > 2100 && durSec < 2200, `ms→sec: ${Math.round(durSec)} sec in expected 2100-2200 range`);
  assert(durMin > 35 && durMin < 37, `sec→min: ${durMin.toFixed(1)} min in expected 35-37 range`);
}

console.log("\nTRANSCRIPT-DURATION-QA-A — unit conversion: float seconds → minutes");
{
  // Classic XML seconds format: 2100.0 + 3.0 = 2103 sec = 35 min
  const segs = [
    { text: "start", offset: 0.0, duration: 3.0 },
    { text: "end", offset: 2100.0, duration: 3.0 },
  ];
  const durSec = computeDurationSeconds(segs);
  assert(
    Math.abs(durSec - 2103.0) < 0.1,
    `float-seconds: 2100+3 = 2103 sec: got ${durSec}`,
  );
}

// ─── TRANSCRIPT-DURATION-QA-B: magnitude-based unit detection ─────────────────
// Production failure (after commit a41f91c): valid ~35-minute videos still rejected.
// Live Vercel log for jwChiek_aRY:
//   [virnix-duration] segments=870 isMs=false duration_sec=2033960 duration_min=33899
// Root cause: Supadata returns ms-format segments with float imprecision THROUGHOUT
// (every offset/duration has a decimal), not just the last segment. QA-A's first-20
// fix didn't help — the first 20 segments also have decimals. The old modulo check
// (`offset % 1 !== 0`) treats 3960.2ms as seconds, inflating 33.9 min → 33,899 min.
// Fix: use median duration magnitude instead of modulo. ms durations are 2000-5000;
// seconds durations are 2-5. Median > 100 → ms regardless of decimal presence.

// Helper: simulates Supadata decimal-ms imprecision throughout all segments
function makeDecimalMsSegments(count, durationMs = 2338) {
  return Array.from({ length: count }, (_, i) => ({
    text: `word${i}`,
    offset: i * durationMs + 0.4,
    duration: durationMs + 0.2,
  }));
}

console.log("\nTRANSCRIPT-DURATION-QA-B — ms integer values classified correctly");
{
  // offset=2030000ms, duration=3960ms → total = 2033960ms → /1000 = 2033.96s ≈ 33.9 min
  const segs = [
    { text: "x", offset: 0, duration: 3960 },
    { text: "y", offset: 2030000, duration: 3960 },
  ];
  const dur = computeDurationSeconds(segs);
  assert(
    Math.abs(dur - 2033.96) < 1,
    `ms integer: (2030000+3960)/1000 → ${dur.toFixed(2)}s ≈ 33.9 min`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-B — ms decimal values classified correctly (production failure)");
{
  // offset=2030000.4ms, duration=3960.2ms → total ≈ 2033960.6ms → /1000 ≈ 2034s ≈ 33.9 min
  // Old: any decimal → isMs=false → 2033960.6s = 565 hrs → blocked
  // New: median = 3960.2 > 100 → isMs=true → 2034s → accepted
  const segs = [
    { text: "x", offset: 0.0, duration: 3960.2 },
    { text: "y", offset: 2030000.4, duration: 3960.2 },
  ];
  const dur = computeDurationSeconds(segs);
  assert(
    dur < MAX_ALLOWED_SEC,
    `ms decimal: magnitude isMs=true → ${dur.toFixed(2)}s (not 2033960.6s) — accepted`,
  );
  assert(
    Math.abs(dur - 2033.96) < 1,
    `ms decimal: value ≈ 2034s (33.9 min): got ${dur.toFixed(2)}s`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-B — seconds decimal values classified correctly");
{
  // offset=2030.4s, duration=3.2s → total = 2033.6s ≈ 33.9 min
  // median = 3.2 < 100 → isMs=false → treat as seconds
  const segs = [
    { text: "x", offset: 0.0, duration: 3.2 },
    { text: "y", offset: 2030.4, duration: 3.2 },
  ];
  const dur = computeDurationSeconds(segs);
  assert(
    Math.abs(dur - 2033.6) < 0.01,
    `seconds decimal: isMs=false → 2030.4+3.2 = ${dur.toFixed(2)}s`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-B — production log reproduction (870 decimal-ms segments)");
{
  // Simulates jwChiek_aRY: 870 segments, all with decimal ms offsets/durations.
  // Expected: duration_min ≈ 33.9, NOT 33,899.
  const segs = makeDecimalMsSegments(870, 2338);
  const dur = computeDurationSeconds(segs);
  const durMin = dur / 60;
  assert(
    dur < MAX_ALLOWED_SEC,
    `870 decimal-ms segments: duration_min=${durMin.toFixed(1)} (not 33899) — accepted`,
  );
  assert(
    durMin > 30 && durMin < 40,
    `870 decimal-ms segments: duration_min=${durMin.toFixed(1)} in expected 30-40 range`,
  );
}

console.log("\nTRANSCRIPT-DURATION-QA-B — true 125-min decimal-ms video still blocked");
{
  // 2500 decimal-ms segments × ~3000ms = ~7500s = 125 min → must be blocked
  const segs = makeDecimalMsSegments(2500, 3000);
  const dur = computeDurationSeconds(segs);
  assert(
    dur > MAX_ALLOWED_SEC,
    `true 125-min decimal-ms: ${Math.round(dur / 60)} min — blocked (> 120)`,
  );
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
