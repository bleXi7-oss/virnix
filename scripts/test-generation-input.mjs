// Zero-cost test for chooseGenerationInput logic — mirrors app/lib/generation/chooseGenerationInput.ts
// Run with: node scripts/test-generation-input.mjs
// No TypeScript compiler required. No AI calls. No network calls. No auth.

const MAX_PASTE_CHARS = 20000;
const MIN_PASTE_CHARS = 50;

// Mirrors app/lib/youtube.ts ID_PATTERNS exactly
const YT_PATTERNS = [
  /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
];
function isValidYouTubeUrl(url) {
  return YT_PATTERNS.some((p) => p.test(url));
}

// Mirrors app/lib/generation/chooseGenerationInput.ts logic exactly
function chooseGenerationInput(body) {
  if (typeof body.transcript === "string") {
    const trimmed = body.transcript.trim();
    if (trimmed.length <= MIN_PASTE_CHARS) {
      return { mode: "manual_transcript", error: { message: "Transcript is too short.", status: 400 } };
    }
    if (trimmed.length > MAX_PASTE_CHARS) {
      return { mode: "manual_transcript", error: { message: "Transcript is too long.", status: 400 } };
    }
    return { mode: "manual_transcript", transcript: trimmed };
  }
  if (!body.youtubeUrl || typeof body.youtubeUrl !== "string") {
    return { mode: "youtube", error: { message: "youtubeUrl is required", status: 400 } };
  }
  if (!isValidYouTubeUrl(body.youtubeUrl)) {
    return { mode: "youtube", error: { message: "Please provide a valid YouTube URL", status: 400 } };
  }
  return { mode: "youtube", youtubeUrl: body.youtubeUrl };
}

// ─── Assertions ──────────────────────────────────────────────────────────────

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

// ─── Manual transcript mode ───────────────────────────────────────────────────

console.log("manual transcript — valid (100 words)");
{
  const text = "word ".repeat(100).trim();
  const r = chooseGenerationInput({ transcript: text });
  assert(r.mode === "manual_transcript", "mode=manual_transcript");
  assert(r.transcript === text, "transcript returned as-is");
  assert(!r.error, "no error");
  assert(!r.youtubeUrl, "youtubeUrl absent");
}

console.log("\nmanual transcript — valid (exactly 51 chars)");
{
  const text = "a".repeat(51);
  const r = chooseGenerationInput({ transcript: text });
  assert(r.mode === "manual_transcript", "mode=manual_transcript");
  assert(!r.error, "no error");
}

console.log("\nmanual transcript — leading/trailing whitespace trimmed");
{
  const core = "word ".repeat(20).trim();
  const r = chooseGenerationInput({ transcript: "  " + core + "  " });
  assert(!r.error, "no error");
  assert(r.transcript === core, "whitespace stripped");
}

console.log("\nmanual transcript — too short (empty string)");
{
  const r = chooseGenerationInput({ transcript: "" });
  assert(r.mode === "manual_transcript", "mode=manual_transcript");
  assert(!!r.error, "error present");
  assert(r.error.status === 400, "status 400");
  assert(!r.transcript, "no transcript");
}

console.log("\nmanual transcript — too short (exactly 50 chars)");
{
  const r = chooseGenerationInput({ transcript: "a".repeat(50) });
  assert(r.mode === "manual_transcript", "mode=manual_transcript");
  assert(!!r.error, "error for 50 chars (need > 50)");
}

console.log("\nmanual transcript — too long (MAX_PASTE_CHARS + 1)");
{
  const r = chooseGenerationInput({ transcript: "x".repeat(MAX_PASTE_CHARS + 1) });
  assert(r.mode === "manual_transcript", "mode=manual_transcript");
  assert(!!r.error, "error present");
  assert(r.error.status === 400, "status 400");
  assert(!r.transcript, "no transcript");
}

console.log("\nmanual transcript — transcript wins when both fields present");
{
  const r = chooseGenerationInput({
    transcript: "word ".repeat(20),
    youtubeUrl: "https://www.youtube.com/watch?v=u4ZoJKF_VuA",
  });
  assert(r.mode === "manual_transcript", "transcript field takes priority");
  assert(!r.error, "no error");
  assert(!r.youtubeUrl, "youtubeUrl not surfaced in transcript mode");
}

// ─── YouTube URL mode ─────────────────────────────────────────────────────────

console.log("\nYouTube URL — standard watch URL");
{
  const r = chooseGenerationInput({ youtubeUrl: "https://www.youtube.com/watch?v=u4ZoJKF_VuA" });
  assert(r.mode === "youtube", "mode=youtube");
  assert(r.youtubeUrl === "https://www.youtube.com/watch?v=u4ZoJKF_VuA", "youtubeUrl preserved");
  assert(!r.error, "no error");
}

console.log("\nYouTube URL — youtu.be short link");
{
  const r = chooseGenerationInput({ youtubeUrl: "https://youtu.be/u4ZoJKF_VuA" });
  assert(r.mode === "youtube", "mode=youtube");
  assert(!r.error, "no error");
}

console.log("\nYouTube URL — Shorts URL");
{
  const r = chooseGenerationInput({ youtubeUrl: "https://www.youtube.com/shorts/u4ZoJKF_VuA" });
  assert(r.mode === "youtube", "mode=youtube");
  assert(!r.error, "no error");
}

console.log("\nYouTube URL — invalid (non-YouTube)");
{
  const r = chooseGenerationInput({ youtubeUrl: "https://vimeo.com/123456" });
  assert(r.mode === "youtube", "mode=youtube");
  assert(!!r.error, "error present");
  assert(r.error.status === 400, "status 400");
}

console.log("\nYouTube URL — missing entirely");
{
  const r = chooseGenerationInput({});
  assert(r.mode === "youtube", "defaults to youtube mode");
  assert(!!r.error, "error present");
  assert(r.error.message === "youtubeUrl is required", "correct message");
}

console.log("\nYouTube URL — wrong type (number)");
{
  const r = chooseGenerationInput({ youtubeUrl: 12345 });
  assert(r.mode === "youtube", "mode=youtube");
  assert(!!r.error, "error for non-string youtubeUrl");
}

console.log("\nYouTube URL — watch URL with extra query params");
{
  const r = chooseGenerationInput({ youtubeUrl: "https://www.youtube.com/watch?v=u4ZoJKF_VuA&t=120s" });
  assert(r.mode === "youtube", "mode=youtube");
  assert(!r.error, "no error — extra params allowed");
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
