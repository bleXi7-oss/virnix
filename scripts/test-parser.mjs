// Zero-cost parser + schema validation smoke test.
// Mirrors logic from app/lib/ai/parser.ts and app/lib/ai/schemas.ts.
// Run with: node scripts/test-parser.mjs
// No TypeScript compiler. No AI calls. No network.

// ─── Inline mirrors (keep in sync with source files) ─────────────────────────

// mirrors hasContent from schemas.ts
function hasContent(val) {
  if (typeof val !== "object" || val === null) return false;
  const content = val.content;
  return typeof content === "string" && content.trim().length > 0;
}

// mirrors validateCoreOutput from schemas.ts
const CORE_KEYS = ["tiktok", "twitter", "linkedin", "instagram", "youtube"];
function validateCoreOutput(raw) {
  if (typeof raw !== "object" || raw === null) return false;
  return CORE_KEYS.every((key) => hasContent(raw[key]));
}

// mirrors coerceCoreOutput from schemas.ts
function coerceCoreOutput(raw) {
  const obj = typeof raw === "object" && raw !== null ? raw : {};
  const field = (key) => (hasContent(obj[key]) ? obj[key] : { content: "" });
  return {
    tiktok: field("tiktok"),
    twitter: field("twitter"),
    linkedin: field("linkedin"),
    instagram: field("instagram"),
    youtube: field("youtube"),
  };
}

// mirrors extractJSON from parser.ts
function extractJSON(raw) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return cleaned;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return cleaned.slice(start);
}

// mirrors extractLargestJsonObject from parser.ts
function extractLargestJsonObject(raw) {
  const candidates = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== "{") continue;
    let depth = 0;
    for (let j = i; j < raw.length; j++) {
      if (raw[j] === "{") depth++;
      else if (raw[j] === "}") {
        depth--;
        if (depth === 0) {
          candidates.push(raw.slice(i, j + 1));
          break;
        }
      }
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates) {
    try { JSON.parse(c); return c; } catch { /* skip */ }
  }
  return candidates[0] ?? "";
}

function safeParse(text) {
  if (!text?.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// mirrors parseAnthropicResponse from parser.ts (advanced_outputs=false)
function parseAnthropicResponse(text) {
  let parseRepaired = false;
  let coercionUsed = false;

  if (!text?.trim()) {
    coercionUsed = true;
    return { core: coerceCoreOutput(null), parseRepaired, coercionUsed };
  }

  const extracted = extractJSON(text);
  let parsed = safeParse(extracted);

  if (parsed === null) {
    const largest = extractLargestJsonObject(text);
    parsed = safeParse(largest);
    if (parsed !== null) parseRepaired = true;
  }

  if (parsed === null) {
    coercionUsed = true;
    return { core: coerceCoreOutput(null), parseRepaired, coercionUsed };
  }

  if (!validateCoreOutput(parsed)) coercionUsed = true;

  const core = coerceCoreOutput(parsed);
  return { core, parseRepaired, coercionUsed };
}

// mirrors post-parse empty guard from generate.ts
function checkEmptyGuard(core) {
  const coreTotalChars = CORE_KEYS.reduce((sum, k) => sum + core[k].content.length, 0);
  if (coreTotalChars < 20) throw new Error("AI returned all-empty platform content");
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeFull(overrides = {}) {
  return JSON.stringify({
    best_angle: {
      hook: "The one habit top performers never skip",
      why: "Opens a curiosity gap immediately.",
      caution: "May feel abstract without examples.",
      best_platform: "TikTok / Reels",
      hook_variants: {
        curiosity: "What separates winners from everyone else?",
        contrarian: "Discipline is overrated — here is what actually works",
        tactical: "Do this one thing every morning to outperform 99%",
        reflective: "The moment I stopped grinding and started winning",
        punchy: "Stop grinding. Start this.",
      },
    },
    tiktok: { content: "Hook: The one habit top performers never skip. [script...]" },
    twitter: { content: "1/ Thread on peak performance habits..." },
    linkedin: { content: "Most people grind without results. Here is what changes that..." },
    instagram: { content: "The secret to peak performance -> consistency over intensity..." },
    youtube: { content: "1. The Habit Top Performers Never Skip\n2. Why Discipline Is Overrated\n3. One Morning Routine To Rule Them All\n4. The Real Secret To Peak Performance\n5. Stop Grinding, Start Winning" },
    ...overrides,
  });
}

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

function assertThrows(fn, msgContains, label) {
  try {
    fn();
    console.error(`  ✗ FAIL (no throw): ${label}`);
    failed++;
  } catch (err) {
    if (msgContains && !err.message.includes(msgContains)) {
      console.error(`  ✗ FAIL (wrong error "${err.message}"): ${label}`);
      failed++;
    } else {
      console.log(`  ✓ ${label}`);
      passed++;
    }
  }
}

// ─── hasContent ───────────────────────────────────────────────────────────────

console.log("hasContent — accepts non-empty strings only");
assert(hasContent({ content: "hello" }), 'true for "hello"');
assert(hasContent({ content: "  hi  " }), 'true for "  hi  " (has non-whitespace)');
assert(!hasContent({ content: "" }), 'false for ""');
assert(!hasContent({ content: "   " }), 'false for "   "');
assert(!hasContent({ content: 42 }), 'false for number');
assert(!hasContent(null), 'false for null');
assert(!hasContent(undefined), 'false for undefined');
assert(!hasContent("string"), 'false for bare string');
assert(!hasContent({}), 'false for {} (no content key)');

// ─── validateCoreOutput ───────────────────────────────────────────────────────

console.log("\nvalidateCoreOutput");
assert(validateCoreOutput(JSON.parse(makeFull())), "valid full output → true");
assert(!validateCoreOutput(JSON.parse(makeFull({ tiktok: { content: "" } }))), "empty tiktok → false");
assert(!validateCoreOutput(JSON.parse(makeFull({ twitter: null }))), "null twitter → false");
assert(!validateCoreOutput({}), "empty object → false");
assert(!validateCoreOutput(null), "null → false");

// ─── coerceCoreOutput ─────────────────────────────────────────────────────────

console.log("\ncoerceCoreOutput — missing fields fall back to empty string");
{
  const result = coerceCoreOutput(JSON.parse(makeFull()));
  assert(result.tiktok.content.length > 0, "tiktok content present");
  assert(result.youtube.content.length > 0, "youtube content present");
}
{
  const result = coerceCoreOutput({ tiktok: { content: "x" } }); // twitter/linkedin/instagram/youtube missing
  assert(result.tiktok.content === "x", "tiktok content preserved");
  assert(result.twitter.content === "", "twitter falls back to empty string");
  assert(result.youtube.content === "", "youtube falls back to empty string");
}

// ─── extractJSON ──────────────────────────────────────────────────────────────

console.log("\nextractJSON — fast path");
assert(extractJSON('{"a":1}') === '{"a":1}', "plain JSON unchanged");
assert(extractJSON("```json\n{\"a\":1}\n```") === '{"a":1}', "strips markdown fence");
assert(extractJSON("some prose before {\"a\":1} and after") === '{"a":1}', "strips leading prose");
assert(extractJSON("Here is the result:\n{\"x\":2}\n\nDone.") === '{"x":2}', "strips trailing prose");
{
  const nested = '{"a":{"b":1},"c":2}';
  assert(extractJSON(nested) === nested, "nested braces handled correctly");
}

// ─── extractLargestJsonObject ─────────────────────────────────────────────────

console.log("\nextractLargestJsonObject — deep-scan fallback");
{
  const prose = 'Here is the JSON: {"tiktok":{"content":"hook"},"twitter":{"content":"thread"}} Done.';
  const result = extractLargestJsonObject(prose);
  assert(result.includes('"tiktok"'), "deep scan finds JSON block in prose");
}
{
  // Multiple JSON objects — picks the largest
  const multi = '{"small":1} some text {"large":{"a":"a longer string that makes this bigger"}}';
  const result = JSON.parse(extractLargestJsonObject(multi));
  assert("large" in result, "picks larger JSON object");
}

// ─── parseAnthropicResponse ───────────────────────────────────────────────────

console.log("\nparseAnthropicResponse — valid full JSON");
{
  const { core, parseRepaired, coercionUsed } = parseAnthropicResponse(makeFull());
  assert(!parseRepaired, "no repair needed");
  assert(!coercionUsed, "no coercion needed");
  assert(core.tiktok.content.length > 0, "tiktok populated");
  assert(core.twitter.content.length > 0, "twitter populated");
  assert(core.linkedin.content.length > 0, "linkedin populated");
  assert(core.instagram.content.length > 0, "instagram populated");
  assert(core.youtube.content.length > 0, "youtube populated");
}

console.log("\nparseAnthropicResponse — markdown-wrapped JSON");
{
  const wrapped = "```json\n" + makeFull() + "\n```";
  const { core, parseRepaired, coercionUsed } = parseAnthropicResponse(wrapped);
  assert(!parseRepaired, "no repair needed for markdown-wrapped");
  assert(!coercionUsed, "no coercion for markdown-wrapped");
  assert(core.tiktok.content.length > 0, "tiktok populated from markdown-wrapped");
}

console.log("\nparseAnthropicResponse — JSON embedded in prose (deep-scan path)");
{
  // extractJSON fast path finds first {, counts brackets to find matching }, returns "{format}".
  // safeParse("{format}") fails because it is not valid JSON, triggering deep-scan.
  // deep-scan finds the large valid JSON object and sets parseRepaired=true.
  const withLeadingBrace = "I'll use {format}: " + makeFull() + "\n\nDone.";
  const { core, parseRepaired } = parseAnthropicResponse(withLeadingBrace);
  assert(parseRepaired, "parseRepaired=true when unbalanced brace before JSON forces deep-scan");
  assert(core.tiktok.content.length > 0, "tiktok still populated after deep scan");
}

console.log("\nparseAnthropicResponse — missing platform key (coercion)");
{
  const partial = makeFull({ tiktok: undefined });
  const obj = JSON.parse(partial);
  delete obj.tiktok;
  const { core, coercionUsed } = parseAnthropicResponse(JSON.stringify(obj));
  assert(coercionUsed, "coercionUsed=true when tiktok missing");
  assert(core.tiktok.content === "", "tiktok falls back to empty string");
  assert(core.twitter.content.length > 0, "other cards still populated");
}

console.log("\nparseAnthropicResponse — empty string content (coercion)");
{
  const emptyContent = makeFull({ tiktok: { content: "" } });
  const { core, coercionUsed } = parseAnthropicResponse(emptyContent);
  assert(coercionUsed, "coercionUsed=true when tiktok content is empty string");
  assert(core.tiktok.content === "", "tiktok content stays empty");
}

console.log("\nparseAnthropicResponse — completely invalid JSON");
{
  const { core, parseRepaired, coercionUsed } = parseAnthropicResponse("This is not JSON at all.");
  assert(!parseRepaired, "parseRepaired=false for pure prose");
  assert(coercionUsed, "coercionUsed=true for pure prose");
  assert(core.tiktok.content === "", "tiktok empty in fallback");
}

console.log("\nparseAnthropicResponse — empty string");
{
  const { coercionUsed } = parseAnthropicResponse("");
  assert(coercionUsed, "empty string forces coercion");
}

// ─── Post-parse empty guard (mirrors generate.ts) ─────────────────────────────

console.log("\nPost-parse empty guard — coreTotalChars < 20 throws");
{
  const allEmpty = coerceCoreOutput(null); // all fields ""
  assertThrows(() => checkEmptyGuard(allEmpty), "all-empty platform content", "throws when all 5 cards empty");
}
{
  // Only tiktok is non-empty with 33 chars total — that is >= 20, so guard does NOT throw.
  // The guard is coreTotalChars < 20, not "all cards must be non-empty".
  const onePopulated = coerceCoreOutput({ tiktok: { content: "A real hook that has enough chars" } });
  let threw = false;
  try { checkEmptyGuard(onePopulated); } catch { threw = true; }
  assert(!threw, "one card with 33 chars (total >= 20) does NOT throw");
}
{
  const allPopulated = coerceCoreOutput(JSON.parse(makeFull()));
  let threw = false;
  try { checkEmptyGuard(allPopulated); } catch { threw = true; }
  assert(!threw, "does NOT throw when all 5 cards populated");
}
{
  // Edge: total chars exactly 20 — guard triggers at < 20 so this passes
  const borderline = {
    tiktok: { content: "a".repeat(20) }, // exactly 20 chars
    twitter: { content: "" },
    linkedin: { content: "" },
    instagram: { content: "" },
    youtube: { content: "" },
  };
  let threw = false;
  try { checkEmptyGuard(borderline); } catch { threw = true; }
  assert(!threw, "exactly 20 chars does NOT throw (threshold is < 20)");
}
{
  // Edge: total chars 19 — throws
  const justUnder = {
    tiktok: { content: "a".repeat(19) },
    twitter: { content: "" },
    linkedin: { content: "" },
    instagram: { content: "" },
    youtube: { content: "" },
  };
  assertThrows(() => checkEmptyGuard(justUnder), "all-empty platform content", "19 chars throws");
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
