// Transcript language guard smoke tests — zero cost, no network, no AI.
// Mirrors logic from app/lib/transcript/detectTranscriptLanguage.ts
// and app/lib/ai/generate.ts.
// Run with: node scripts/test-language-guard.mjs

// ─── Inline mirror of isRtlDominated from generate.ts ────────────────────────

function isRtlDominated(text) {
  const arabicChars = (text.match(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) ?? []).length;
  const allLetterChars = (text.match(/[a-zA-Z؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g) ?? []).length;
  if (allLetterChars === 0) return false;
  return arabicChars / allLetterChars > 0.30;
}

// ─── Inline mirror of languageMismatchGuard from generate.ts ─────────────────

function languageMismatchGuard(cards, outputLanguage) {
  const corePlatformText = cards.slice(0, 5).map((c) => c.content).join(" ");
  const coreTotalChars = corePlatformText.length;
  if (coreTotalChars < 20) throw new Error("AI returned all-empty platform content");
  if (outputLanguage === "en" && isRtlDominated(corePlatformText)) {
    throw new Error("Generated content did not match the target language. Please try again.");
  }
  return null;
}

// ─── Inline mirror of detectTranscriptLanguage.ts ────────────────────────────

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const CYRILLIC_RE = /[Ѐ-ӿԀ-ԯ]/g;
// CJK: Unified Ideographs, CJK punctuation, Katakana, Hiragana, Hangul
const CJK_RE = /[　-鿿豈-﫿︰-﹏가-힯]/g;
const LATIN_RE = /[a-zA-Z]/g;

function detectTranscriptScript(text) {
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const cyrillic = (text.match(CYRILLIC_RE) ?? []).length;
  const cjk = (text.match(CJK_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  const nonLatin = arabic + cyrillic + cjk;
  const total = nonLatin + latin;
  if (total === 0) return "no_letters";
  const ratio = nonLatin / total;
  if (ratio > 0.50) {
    if (arabic >= cyrillic && arabic >= cjk) return "arabic_dominant";
    if (cyrillic >= arabic && cyrillic >= cjk) return "cyrillic_dominant";
    return "cjk_dominant";
  }
  if (ratio > 0.15) return "mixed";
  return "latin_dominant";
}

function normalizeLangCode(code) {
  if (!code) return null;
  return code.split(/[-_]/)[0].toLowerCase();
}

// Codes that mean "language undetermined" — treated same as absent metadata.
const UNDETERMINED_CODES = new Set(["und", "zxx", "mis", "mul"]);

function isTranscriptSafe(transcriptLang, outputLanguage, script) {
  if (outputLanguage === "auto") return true;
  const normalizedOutput = normalizeLangCode(outputLanguage);
  const normalizedTranscript = normalizeLangCode(transcriptLang);
  if (!normalizedTranscript || UNDETERMINED_CODES.has(normalizedTranscript)) {
    return script === "latin_dominant" || script === "no_letters";
  }
  if (normalizedTranscript === normalizedOutput) return true;
  if (normalizedTranscript === "en") return true;
  return false;
}

// Backward-compat wrapper — now delegates to isTranscriptSafe.
function shouldWarnTranscript(script, outputLanguage, supadataLang) {
  return !isTranscriptSafe(supadataLang, outputLanguage, script);
}

const RTL_CODES = new Set(["ar", "fa", "he", "ur", "yi", "dv", "ckb", "ps"]);
function isRtlLangCode(code) {
  if (!code) return false;
  return RTL_CODES.has(normalizeLangCode(code) ?? "");
}

function isNonLatinDominatedText(text) {
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const cyrillic = (text.match(CYRILLIC_RE) ?? []).length;
  const cjk = (text.match(CJK_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  const nonLatin = arabic + cyrillic + cjk;
  if (nonLatin + latin === 0) return false;
  return nonLatin / (nonLatin + latin) > 0.30;
}

function shouldHideSourcePreview(text, transcriptLang, outputLanguage) {
  if (isNonLatinDominatedText(text)) return true;
  if (!transcriptLang || !outputLanguage) return false;
  if (outputLanguage === "auto") return false;
  const nl = normalizeLangCode(transcriptLang);
  const no_ = normalizeLangCode(outputLanguage);
  if (nl === "en") return false;
  if (nl === no_) return false;
  return true;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ENGLISH_CARDS = [
  { content: "Stop doing this one thing. You're wasting 3 hours every day." },
  { content: "1/ Most people never figure out why they're tired.\n\nHere's the real reason:" },
  { content: "The one productivity habit nobody talks about. Here's what actually works." },
  { content: "You've been told to wake up early. That's not the point." },
  { content: "Why Discipline Is Overrated\nThe Real Secret to Peak Performance\nStop Grinding, Start Winning" },
];

const ARABIC_CARDS = [
  { content: "توقف عن فعل هذا الشيء. أنت تضيع 3 ساعات كل يوم." },
  { content: "معظم الناس لا يعرفون أبدًا سبب إرهاقهم. هذا هو السبب الحقيقي." },
  { content: "العادة الإنتاجية الوحيدة التي لا يتحدث عنها أحد." },
  { content: "لقد قيل لك أن تستيقظ مبكرًا. هذه ليست النقطة." },
  { content: "لماذا الانضباط مبالغ فيه\nالسر الحقيقي للأداء العالي\nتوقف عن الكفاح، ابدأ بالفوز" },
];

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
  const withQuote = 'The speaker said: "الوقت أثمن" (time is precious). ' +
    "This changes how you think about productivity. Stop grinding, start winning. " +
    "Every second you waste scrolling is a second compounding against you.";
  assert(!isRtlDominated(withQuote), "short Arabic quote in English post → false");
}

console.log("\nisRtlDominated — threshold boundary");
{
  const arabic30 = "ا".repeat(30);
  const english70 = "a".repeat(70);
  assert(!isRtlDominated(arabic30 + english70), "exactly 30% Arabic → false (threshold > 0.30)");
  const arabic31 = "ا".repeat(31);
  const english69 = "a".repeat(69);
  assert(isRtlDominated(arabic31 + english69), "31% Arabic → true");
}

console.log("\nisRtlDominated — edge cases");
assert(!isRtlDominated(""), "empty string → false");
assert(!isRtlDominated("   "), "whitespace only → false");
assert(!isRtlDominated("1234567890 ✅ 🔥 📊"), "digits + emoji only → false");

// ─── languageMismatchGuard — integration ─────────────────────────────────────

console.log("\nlanguageMismatchGuard — English output, target en → passes");
{ let threw = false; try { languageMismatchGuard(ENGLISH_CARDS, "en"); } catch { threw = true; }
  assert(!threw, "English cards with en target → guard passes"); }

console.log("\nlanguageMismatchGuard — Arabic output, target en → throws");
assertThrows(() => languageMismatchGuard(ARABIC_CARDS, "en"), "did not match", "Arabic cards with en target → language mismatch error");

console.log("\nlanguageMismatchGuard — Arabic output, target auto → passes");
{ let threw = false; try { languageMismatchGuard(ARABIC_CARDS, "auto"); } catch { threw = true; }
  assert(!threw, "Arabic cards with auto target → no guard"); }

console.log("\nlanguageMismatchGuard — English + Arabic quote, target en → passes");
{ let threw = false; try { languageMismatchGuard(ENGLISH_WITH_ARABIC_QUOTE_CARDS, "en"); } catch { threw = true; }
  assert(!threw, "English cards with single Arabic quote → guard passes"); }

console.log("\nlanguageMismatchGuard — empty cards → throws");
{ const empty = [{ content: "" }, { content: "" }, { content: "" }, { content: "" }, { content: "" }];
  assertThrows(() => languageMismatchGuard(empty, "en"), "all-empty", "empty cards → empty-card guard"); }

console.log("\nlanguageMismatchGuard — 6-card list, first 5 Arabic → fires");
{ const six = [...ARABIC_CARDS, { content: "This English 6th card should be ignored." }];
  assertThrows(() => languageMismatchGuard(six, "en"), "did not match", "6-card list: first 5 Arabic → still fires"); }

// ─── detectTranscriptScript — expanded ───────────────────────────────────────

console.log("\ndetectTranscriptScript — Latin/English");
assert(detectTranscriptScript("This is a normal English sentence about productivity.") === "latin_dominant", "pure English → latin_dominant");
assert(detectTranscriptScript("I am honored to be with you today at your commencement.") === "latin_dominant", "Steve Jobs EN → latin_dominant");
assert(detectTranscriptScript("Bu video çok ilginç bir konu hakkında konuşuyor.") === "latin_dominant", "Turkish (Latin script) → latin_dominant");
assert(detectTranscriptScript("Ce contenu parle de productivité et de succès.") === "latin_dominant", "French → latin_dominant");
assert(detectTranscriptScript("Hola, hoy hablamos sobre productividad personal.") === "latin_dominant", "Spanish → latin_dominant");
assert(detectTranscriptScript("Este é um conteúdo sobre crescimento pessoal.") === "latin_dominant", "Portuguese → latin_dominant");

console.log("\ndetectTranscriptScript — Arabic");
assert(detectTranscriptScript("توقف عن فعل هذا الشيء وابدأ بالفوز الآن") === "arabic_dominant", "pure Arabic → arabic_dominant");

console.log("\ndetectTranscriptScript — Cyrillic");
assert(detectTranscriptScript("Сегодня мы говорим о продуктивности и успехе в жизни.") === "cyrillic_dominant", "Russian Cyrillic → cyrillic_dominant");
assert(detectTranscriptScript("Данас говоримо о продуктивности и успеху у животу.") === "cyrillic_dominant", "Serbian Cyrillic → cyrillic_dominant");

console.log("\ndetectTranscriptScript — CJK");
assert(detectTranscriptScript("今天我们来谈谈生产力和成功的话题。") === "cjk_dominant", "Chinese → cjk_dominant");
assert(detectTranscriptScript("今日は生産性と成功について話します。") === "cjk_dominant", "Japanese → cjk_dominant");
assert(detectTranscriptScript("오늘은 생산성과 성공에 대해 이야기합니다.") === "cjk_dominant", "Korean → cjk_dominant");

console.log("\ndetectTranscriptScript — edge cases");
assert(detectTranscriptScript("") === "no_letters", "empty string → no_letters");
assert(detectTranscriptScript("1234 !@#$%") === "no_letters", "digits/symbols only → no_letters");
assert(detectTranscriptScript("hello world this is a test sentence with a single مرحبا word") === "latin_dominant", "mostly English, one Arabic word (< 15%) → latin_dominant");

// ─── isTranscriptSafe — metadata-first rules ─────────────────────────────────

console.log("\nisTranscriptSafe — auto output always safe");
assert(isTranscriptSafe("ar", "auto", "arabic_dominant"), "Arabic transcript + auto output → safe");
assert(isTranscriptSafe("tr", "auto", "latin_dominant"), "Turkish transcript + auto output → safe");
assert(isTranscriptSafe(null, "auto", "cjk_dominant"), "no metadata + auto output → safe");

console.log("\nisTranscriptSafe — transcript lang matches output lang");
assert(isTranscriptSafe("en", "en", "latin_dominant"), "en transcript + en output → safe");
assert(isTranscriptSafe("sl", "sl", "latin_dominant"), "sl transcript + sl output → safe");
assert(isTranscriptSafe("hr", "hr", "latin_dominant"), "hr transcript + hr output → safe");
assert(isTranscriptSafe("es", "es", "latin_dominant"), "es transcript + es output → safe");
assert(isTranscriptSafe("pt", "pt", "latin_dominant"), "pt transcript + pt output → safe");
assert(isTranscriptSafe("sr", "sr", "cyrillic_dominant"), "sr transcript + sr output (Cyrillic) → safe");
assert(isTranscriptSafe("sl-SI", "sl", "latin_dominant"), "sl-SI subtag → normalized → safe");
assert(isTranscriptSafe("en-US", "en", "latin_dominant"), "en-US → normalized → safe");
assert(isTranscriptSafe("pt-BR", "pt", "latin_dominant"), "pt-BR → normalized → safe");

console.log("\nisTranscriptSafe — English transcript is always safe (translation scenario)");
assert(isTranscriptSafe("en", "sl", "latin_dominant"), "English transcript + Slovenian output → safe");
assert(isTranscriptSafe("en", "hr", "latin_dominant"), "English transcript + Croatian output → safe");
assert(isTranscriptSafe("en", "de", "latin_dominant"), "English transcript + German output → safe");
assert(isTranscriptSafe("en-US", "sl", "latin_dominant"), "en-US transcript + Slovenian output → safe");
assert(isTranscriptSafe("en-GB", "fr", "latin_dominant"), "en-GB transcript + French output → safe");

console.log("\nisTranscriptSafe — mismatch → warn (Turkish, French, German, etc.)");
assert(!isTranscriptSafe("tr", "sl", "latin_dominant"), "Turkish transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("fr", "en", "latin_dominant"), "French transcript + English output → UNSAFE");
assert(!isTranscriptSafe("de", "sl", "latin_dominant"), "German transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("it", "sl", "latin_dominant"), "Italian transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("es", "sl", "latin_dominant"), "Spanish transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("pt", "en", "latin_dominant"), "Portuguese transcript + English output → UNSAFE");
assert(!isTranscriptSafe("ar", "sl", "arabic_dominant"), "Arabic transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("ar", "en", "arabic_dominant"), "Arabic transcript + English output → UNSAFE");
assert(!isTranscriptSafe("he", "en", "arabic_dominant"), "Hebrew transcript + English output → UNSAFE");
assert(!isTranscriptSafe("ru", "sl", "cyrillic_dominant"), "Russian transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("zh", "en", "cjk_dominant"), "Chinese transcript + English output → UNSAFE");
assert(!isTranscriptSafe("ja", "sl", "cjk_dominant"), "Japanese transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("ko", "en", "cjk_dominant"), "Korean transcript + English output → UNSAFE");
assert(!isTranscriptSafe("hr", "sl", "latin_dominant"), "Croatian transcript + Slovenian output → UNSAFE");
assert(!isTranscriptSafe("sr", "sl", "cyrillic_dominant"), "Serbian transcript + Slovenian output → UNSAFE");

console.log("\nisTranscriptSafe — no metadata fallback (script-only)");
assert(isTranscriptSafe(null, "sl", "latin_dominant"), "no metadata + Latin script → safe (can't distinguish Turkish from English)");
assert(isTranscriptSafe(null, "en", "latin_dominant"), "no metadata + Latin script + en output → safe");
assert(isTranscriptSafe(null, "no_letters", "no_letters"), "no metadata + no_letters → safe");
assert(!isTranscriptSafe(null, "sl", "arabic_dominant"), "no metadata + Arabic script → UNSAFE");
assert(!isTranscriptSafe(null, "en", "cyrillic_dominant"), "no metadata + Cyrillic script → UNSAFE");
assert(!isTranscriptSafe(null, "sl", "cjk_dominant"), "no metadata + CJK script → UNSAFE");
assert(!isTranscriptSafe(null, "en", "mixed"), "no metadata + mixed → UNSAFE (can't confirm Latin-only)");

console.log("\nisTranscriptSafe — underscore lang codes (Supadata en_US false-positive fix)");
assert(isTranscriptSafe("en_US", "sl", "latin_dominant"), "en_US + sl → safe (underscore normalized to en)");
assert(isTranscriptSafe("en_GB", "de", "latin_dominant"), "en_GB + de → safe (underscore normalized to en)");
assert(isTranscriptSafe("en_US", "en", "latin_dominant"), "en_US + en → safe (same lang after normalization)");

console.log("\nisTranscriptSafe — undetermined lang codes (und/zxx treated as no metadata)");
assert(isTranscriptSafe("und", "sl", "latin_dominant"), "und + sl + Latin script → safe (undetermined treated as no-metadata)");
assert(isTranscriptSafe("und", "en", "latin_dominant"), "und + en + Latin script → safe");
assert(isTranscriptSafe("und", "sl", "no_letters"), "und + sl + no_letters → safe");
assert(!isTranscriptSafe("und", "sl", "arabic_dominant"), "und + sl + Arabic script → UNSAFE (falls back to script heuristic)");
assert(!isTranscriptSafe("und", "en", "cyrillic_dominant"), "und + en + Cyrillic script → UNSAFE");
assert(!isTranscriptSafe("und", "sl", "cjk_dominant"), "und + sl + CJK script → UNSAFE");
assert(isTranscriptSafe("zxx", "sl", "latin_dominant"), "zxx (no linguistic content) + Latin → safe");
assert(isTranscriptSafe("mul", "sl", "latin_dominant"), "mul (multilingual) + Latin → safe (treat as undetermined)");

// ─── UF8uR6Z6KLc regression — Steve Jobs Arabic auto-captions ────────────────

const JOBS_ARABIC_SAMPLE =
  "أنا ممتن جداً لوجودي معكم اليوم في مراسم تخرج واحدة من أفضل الجامعات في العالم " +
  "لم أتخرج قط من الجامعة الحقيقة هي أن هذا هو الأقرب إلى التخرج بالنسبة لي " +
  "أريد أن أحكي لكم ثلاث قصص من حياتي هذا كل شيء لا شيء عظيم " +
  "القصة الأولى تتحدث عن ربط النقاط لقد انتهيت من جامعة ريد كوليدج بعد ستة أشهر فقط " +
  "لكنني بقيت أتردد عليها كمستمع لمدة ثمانية عشر شهرًا إضافية قبل أن أغادر";

console.log("\nUF8uR6Z6KLc regression — Arabic auto-captions");
assert(detectTranscriptScript(JOBS_ARABIC_SAMPLE) === "arabic_dominant", "Arabic captions → arabic_dominant");
assert(!isTranscriptSafe("ar", "sl", "arabic_dominant"), "ar transcript + sl output → UNSAFE → guard fires");
assert(!isTranscriptSafe("ar", "en", "arabic_dominant"), "ar transcript + en output → UNSAFE → guard fires");
assert(isTranscriptSafe("ar", "auto", "arabic_dominant"), "ar transcript + auto output → safe (no guard)");
// When user clicks 'Try English' and Supadata returns English:
assert(isTranscriptSafe("en", "sl", "latin_dominant"), "after Try English: en transcript + sl output → safe");
// When user clicks 'Try English' and Supadata still returns non-English (route.ts returns error not warning):
assert(!isTranscriptSafe("ar", "sl", "arabic_dominant"), "Try English failed: still Arabic → still unsafe (route returns error, not warning)");

// ─── shouldWarnTranscript — backward compat ───────────────────────────────────

console.log("\nshouldWarnTranscript — backward compat scenarios");
assert(!shouldWarnTranscript("latin_dominant", "sl", null), "latin_dominant + sl + no meta → no warn");
assert(!shouldWarnTranscript("no_letters", "en", null), "no_letters → no warn");
assert(shouldWarnTranscript("arabic_dominant", "sl", null), "arabic_dominant + sl → warn");
assert(shouldWarnTranscript("cyrillic_dominant", "en", "ru"), "cyrillic + ru lang → warn");
assert(shouldWarnTranscript("cjk_dominant", "sl", "zh"), "cjk + zh lang → warn");
// Turkish transcript is Latin-script, but metadata says "tr" and output is "sl" → warn via metadata
assert(shouldWarnTranscript("latin_dominant", "sl", "tr"), "Turkish metadata + sl output → warn via metadata");

// ─── isRtlLangCode ───────────────────────────────────────────────────────────

console.log("\nisRtlLangCode");
assert(isRtlLangCode("ar"), "ar → true");
assert(isRtlLangCode("ar-SA"), "ar-SA → true (strips subtag)");
assert(isRtlLangCode("he"), "he → true");
assert(isRtlLangCode("fa"), "fa → true");
assert(!isRtlLangCode("en"), "en → false");
assert(!isRtlLangCode("sl"), "sl → false");
assert(!isRtlLangCode("tr"), "tr → false (Turkish is Latin-script)");
assert(!isRtlLangCode(null), "null → false");
assert(!isRtlLangCode(undefined), "undefined → false");

// ─── normalizeLangCode ───────────────────────────────────────────────────────

console.log("\nnormalizeLangCode");
assert(normalizeLangCode("en-US") === "en", "en-US → en");
assert(normalizeLangCode("sl-SI") === "sl", "sl-SI → sl");
assert(normalizeLangCode("pt-BR") === "pt", "pt-BR → pt");
assert(normalizeLangCode("sr-Latn") === "sr", "sr-Latn → sr");
assert(normalizeLangCode("zh-Hans") === "zh", "zh-Hans → zh");
assert(normalizeLangCode("ar") === "ar", "ar → ar (no subtag)");
assert(normalizeLangCode(null) === null, "null → null");
assert(normalizeLangCode(undefined) === null, "undefined → null");

console.log("\nnormalizeLangCode — underscore variants (Supadata may use en_US format)");
assert(normalizeLangCode("en_US") === "en", "en_US (underscore) → en");
assert(normalizeLangCode("en_GB") === "en", "en_GB (underscore) → en");
assert(normalizeLangCode("pt_BR") === "pt", "pt_BR (underscore) → pt");
assert(normalizeLangCode("zh_Hans") === "zh", "zh_Hans (underscore) → zh");
assert(normalizeLangCode("sr_Latn") === "sr", "sr_Latn (underscore) → sr");

// ─── shouldHideSourcePreview — Strongest Moments ─────────────────────────────

console.log("\nshouldHideSourcePreview — Strongest Moments display");

// Arabic/RTL source text
assert(shouldHideSourcePreview("الوقت أثمن من المال في هذا العصر", null, null), "Arabic source text → hide (script)");
assert(shouldHideSourcePreview("الوقت أثمن من المال", "ar", "sl"), "Arabic text + ar lang → hide");

// Cyrillic source text
assert(shouldHideSourcePreview("Сегодня мы говорим о продуктивности", "ru", "sl"), "Russian Cyrillic → hide");
assert(shouldHideSourcePreview("Данас говоримо о животу", "sr", "sl"), "Serbian Cyrillic → hide");

// CJK source text
assert(shouldHideSourcePreview("今天我们来谈谈生产力", "zh", "en"), "Chinese CJK → hide");

// Turkish: Latin script, but metadata says tr and output is sl → hide
// (text detection won't catch it, but metadata check should)
assert(shouldHideSourcePreview("Bu video çok ilginç", "tr", "sl"), "Turkish source + tr meta + sl output → hide");
assert(shouldHideSourcePreview("Ce contenu est en français", "fr", "en"), "French source + fr meta + en output → hide");

// Safe cases — should NOT hide
assert(!shouldHideSourcePreview("This is an English excerpt.", "en", "sl"), "English source + sl output → show (translation expected)");
assert(!shouldHideSourcePreview("This is clean English text.", "en", "en"), "English source + en output → show");
assert(!shouldHideSourcePreview("Danes govorimo o uspehu.", "sl", "sl"), "Slovenian source + sl output → show");
assert(!shouldHideSourcePreview("This is English.", null, null), "English + no lang metadata → show");
assert(!shouldHideSourcePreview("This is English.", null, "sl"), "English text + no transcript lang → show (can't confirm mismatch)");

// auto output — never hide based on lang (user accepts transcript language)
assert(!shouldHideSourcePreview("Bu içerik Türkçe.", "tr", "auto"), "Turkish + auto output → show");

// ─── Try English button logic — availableLangs normalization ─────────────────

console.log("\nTry English button — normalized lang check");
{
  // hasEnglish should be true if "en", "en-US", "en-GB", "en-AU" etc. is present
  function hasEnglish(availableLangs) {
    return availableLangs.some((l) => normalizeLangCode(l) === "en");
  }
  assert(hasEnglish(["ar", "en"]), "['ar','en'] → has English");
  assert(hasEnglish(["ar", "en-US"]), "['ar','en-US'] → has English (en-US normalized)");
  assert(hasEnglish(["ar", "en-GB"]), "['ar','en-GB'] → has English (en-GB normalized)");
  assert(!hasEnglish(["ar", "fr"]), "['ar','fr'] → no English");
  assert(!hasEnglish([]), "[] → no English");
}

// ─── Guard fires before Anthropic / before credits ───────────────────────────

console.log("\nGuard execution order — verified by logic not test harness");
// The guard in route.ts fires after getTranscriptFull() and BEFORE:
//   - calculateCreditsForGeneration()
//   - ensure_user_credits RPC
//   - user_credits SELECT
//   - generate() (Anthropic call)
// This is verified by code position in route.ts, not by this test script.
// Test: unsafe transcript with no confirmTranscriptWarning → MUST return transcriptWarning, not run AI
assert(!isTranscriptSafe("tr", "sl", "latin_dominant"), "Turkish + Slovenian output → guard WOULD fire (confirmed unsafe)");
assert(!isTranscriptSafe("ar", "en", "arabic_dominant"), "Arabic + English output → guard WOULD fire (confirmed unsafe)");
assert(isTranscriptSafe("en", "sl", "latin_dominant"), "English + Slovenian output → guard WOULD NOT fire (confirmed safe)");

// ─── Paste language heuristic — non-blocking ─────────────────────────────────

console.log("\nPaste heuristic — non-blocking script detection");
// Manual paste: script detection only (no metadata available)
// arabic_dominant / cyrillic_dominant / cjk_dominant → transcriptNote (soft warning)
// latin_dominant → no note (can't distinguish Turkish from English by script)
assert(detectTranscriptScript("الوقت أثمن من المال في هذا العصر") === "arabic_dominant", "Pasted Arabic → arabic_dominant → note generated");
assert(detectTranscriptScript("Сегодня мы говорим о продуктивности") === "cyrillic_dominant", "Pasted Cyrillic → cyrillic_dominant → note generated");
assert(detectTranscriptScript("今天我们来谈谈生产力") === "cjk_dominant", "Pasted CJK → cjk_dominant → note generated");
assert(detectTranscriptScript("Bu video çok ilginç bir konu.") === "latin_dominant", "Pasted Turkish (Latin) → latin_dominant → NO note (can't detect without metadata)");
assert(detectTranscriptScript("Ce contenu est en français.") === "latin_dominant", "Pasted French (Latin) → latin_dominant → NO note (can't detect without metadata)");

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
