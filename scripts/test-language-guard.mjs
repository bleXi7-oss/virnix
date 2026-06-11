// Zero-cost language mismatch guard smoke test.
// Mirrors isRtlDominated logic from app/lib/ai/generate.ts.
// Run with: node scripts/test-language-guard.mjs
// No TypeScript compiler. No AI calls. No network.

// ─── Inline mirror of isRtlDominated from generate.ts ────────────────────────

function isRtlDominated(text) {
  const arabicChars = (text.match(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) ?? []).length;
  const allLetterChars = (text.match(/[a-zA-Z؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) ?? []).length;
  if (allLetterChars === 0) return false;
  return arabicChars / allLetterChars > 0.30;
}

// ─── Inline mirror of language mismatch guard from generate.ts ───────────────
// Returns null when guard passes, throws with message when it fires.

function languageMismatchGuard(cards, outputLanguage) {
  const corePlatformText = cards.slice(0, 5).map((c) => c.content).join(" ");
  const coreTotalChars = corePlatformText.length;
  if (coreTotalChars < 20) throw new Error("AI returned all-empty platform content");
  if (outputLanguage === "en" && isRtlDominated(corePlatformText)) {
    throw new Error("Generated content did not match the target language. Please try again.");
  }
  return null; // guard passed
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ENGLISH_CARDS = [
  { content: "Stop doing this one thing. You're wasting 3 hours every day." },
  { content: "1/ Most people never figure out why they're tired.\n\nHere's the real reason:" },
  { content: "The one productivity habit nobody talks about. Here's what actually works." },
  { content: "You've been told to wake up early. That's not the point." },
  { content: "Why Discipline Is Overrated\nThe Real Secret to Peak Performance\nStop Grinding, Start Winning" },
];

// Fully Arabic cards — what the model returns when it ignores the language instruction
const ARABIC_CARDS = [
  { content: "توقف عن فعل هذا الشيء. أنت تضيع 3 ساعات كل يوم." },
  { content: "معظم الناس لا يعرفون أبدًا سبب إرهاقهم. هذا هو السبب الحقيقي." },
  { content: "العادة الإنتاجية الوحيدة التي لا يتحدث عنها أحد." },
  { content: "لقد قيل لك أن تستيقظ مبكرًا. هذه ليست النقطة." },
  { content: "لماذا الانضباط مبالغ فيه\nالسر الحقيقي للأداء العالي\nتوقف عن الكفاح، ابدأ بالفوز" },
];

// English cards where one card contains a quoted Arabic phrase (e.g. creator cites a source)
const ENGLISH_WITH_ARABIC_QUOTE_CARDS = [
  { content: "Stop doing this one thing. You're wasting 3 hours every day." },
  { content: "1/ Most people never figure out why they're tired.\n\nHere's the real reason:" },
  { content: "The speaker said: \"الوقت أثمن من المال\" (time is more precious than money). Here's what that means for you." },
  { content: "You've been told to wake up early. That's not the point." },
  { content: "Why Discipline Is Overrated\nThe Real Secret to Peak Performance" },
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

// ─── isRtlDominated — unit tests ─────────────────────────────────────────────

console.log("isRtlDominated — English text");
assert(!isRtlDominated("This is a normal English sentence."), "pure English → false");
assert(!isRtlDominated("Hook: The one habit top performers never skip."), "English hook → false");
assert(!isRtlDominated("1/ Thread on peak performance habits..."), "English thread → false");

console.log("\nisRtlDominated — Arabic text");
assert(isRtlDominated("توقف عن فعل هذا الشيء. أنت تضيع ساعات كل يوم."), "pure Arabic → true");
assert(isRtlDominated("العادة الإنتاجية الوحيدة التي لا يتحدث عنها أحد."), "Arabic hook → true");

console.log("\nisRtlDominated — mixed: small Arabic quote inside English text");
{
  // Short Arabic phrase (~15 chars) inside a 300-char English post: << 30% Arabic
  const withQuote = 'The speaker said: "الوقت أثمن" (time is precious). ' +
    "This changes how you think about productivity. Stop grinding, start winning. " +
    "Every second you waste scrolling is a second compounding against you.";
  assert(!isRtlDominated(withQuote), "short Arabic quote in English post → false");
}

console.log("\nisRtlDominated — threshold boundary");
{
  // Construct text at exactly 30% Arabic / 70% English letters
  // 30 Arabic chars + 70 English chars = 100 total, ratio = 0.30 (NOT > 0.30)
  const arabic30 = "ا".repeat(30); // 30 Arabic alefs
  const english70 = "a".repeat(70);
  assert(!isRtlDominated(arabic30 + english70), "exactly 30% Arabic → false (threshold is > 0.30, not >=)");

  // 31 Arabic + 69 English = ratio 0.31 > 0.30
  const arabic31 = "ا".repeat(31);
  const english69 = "a".repeat(69);
  assert(isRtlDominated(arabic31 + english69), "31% Arabic → true");
}

console.log("\nisRtlDominated — edge cases");
assert(!isRtlDominated(""), "empty string → false");
assert(!isRtlDominated("   "), "whitespace only → false");
assert(!isRtlDominated("1234567890 ✅ 🔥 📊"), "digits + emoji only → false (no letter chars)");

// ─── Language mismatch guard — integration ────────────────────────────────────

console.log("\nlanguageMismatchGuard — English output, target en → passes");
{
  let threw = false;
  try { languageMismatchGuard(ENGLISH_CARDS, "en"); } catch { threw = true; }
  assert(!threw, "English cards with en target → guard passes");
}

console.log("\nlanguageMismatchGuard — Arabic output, target en → throws language mismatch");
assertThrows(
  () => languageMismatchGuard(ARABIC_CARDS, "en"),
  "did not match the target language",
  "Arabic cards with en target → language mismatch error"
);

console.log("\nlanguageMismatchGuard — Arabic output, target auto → passes (no guard)");
{
  let threw = false;
  try { languageMismatchGuard(ARABIC_CARDS, "auto"); } catch { threw = true; }
  assert(!threw, "Arabic cards with auto target → no language guard fires");
}

console.log("\nlanguageMismatchGuard — English + Arabic quote, target en → passes");
{
  let threw = false;
  try { languageMismatchGuard(ENGLISH_WITH_ARABIC_QUOTE_CARDS, "en"); } catch { threw = true; }
  assert(!threw, "English cards with single Arabic quote → guard passes (quote is < 30%)");
}

console.log("\nlanguageMismatchGuard — empty cards → empty-card guard fires first");
{
  const emptyCards = [
    { content: "" }, { content: "" }, { content: "" }, { content: "" }, { content: "" },
  ];
  assertThrows(
    () => languageMismatchGuard(emptyCards, "en"),
    "all-empty platform content",
    "empty cards → empty-card guard (not language-mismatch guard)"
  );
}

// ─── Confirm combined platform text calculation matches generate.ts ───────────

console.log("\ncorePlatformText — uses first 5 cards only");
{
  // 6th card should not affect language detection
  const sixCards = [
    ...ARABIC_CARDS,
    { content: "This is an English sixth card that should be ignored for the guard" },
  ];
  assertThrows(
    () => languageMismatchGuard(sixCards, "en"),
    "did not match the target language",
    "6-card list: first 5 Arabic → still fires (6th ignored)"
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
