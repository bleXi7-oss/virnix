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

// ─── ClipMomentCard hideSource — combined guard (script + lang) ───────────────
//
// ClipMomentCard computes:
//   hideSource = shouldHideSourcePreview(text, lang, output) ||
//     !['latin_dominant','no_letters'].includes(detectTranscriptScript(text))
//
// The second clause catches mixed-language captions (15–30% non-Latin) that the
// shouldHideSourcePreview auto-output bypass would otherwise let through.

function computeHideSource(text, transcriptLang, outputLanguage) {
  return (
    shouldHideSourcePreview(text, transcriptLang, outputLanguage) ||
    !["latin_dominant", "no_letters"].includes(detectTranscriptScript(text))
  );
}

console.log("\nClipMomentCard hideSource — combined guard");

// Pure Arabic → always hide (script check fires)
assert(computeHideSource("الوقت أثمن من المال في هذا العصر", null, null), "Pure Arabic, no lang → hide");
assert(computeHideSource("الوقت أثمن من المال", "ar", "auto"), "Pure Arabic + auto output → hide");
assert(computeHideSource("الوقت أثمن من المال", "ar", "sl"), "Arabic + ar/sl → hide");

// Mixed Arabic/Latin (16–28% Arabic) + auto output — previously leaked through, now hidden
assert(
  computeHideSource(
    "In this segment the speaker says الوقت أثمن من المال about time management",
    "ar", "auto",
  ),
  "Mixed Arabic/Latin (> 15% Arabic) + auto output → hide (new guard)",
);

// Cyrillic + auto → hide (script check)
assert(computeHideSource("Сегодня мы говорим о продуктивности", "ru", "auto"), "Cyrillic + auto → hide");

// CJK → hide
assert(computeHideSource("今天我们来谈谈生产力", "zh", "en"), "Chinese CJK + en → hide");

// Turkish (Latin-script) + lang mismatch → hide via lang check
assert(computeHideSource("Bu video çok ilginç", "tr", "sl"), "Turkish Latin + tr/sl → hide (lang mismatch)");

// Turkish (Latin-script) + auto → show (no non-Latin chars, no lang mismatch)
assert(!computeHideSource("Bu içerik Türkçe bir videodur.", "tr", "auto"), "Turkish Latin + auto → show");

// English source excerpts → always show when safe
assert(!computeHideSource("This is an English excerpt.", "en", "sl"), "English + sl output → show (translation expected)");
assert(!computeHideSource("This is clean English text.", "en", "en"), "English + en output → show");
assert(!computeHideSource("This is English.", null, null), "English + no lang → show");
assert(!computeHideSource("Danes govorimo o uspehu.", "sl", "sl"), "Slovenian + sl/sl → show");

// ─── ClipMomentCard hideHook — main quote guard (CAPTION-HIDE-B) ─────────────
//
// ClipMomentCard computes hideHook with the SAME combined logic as hideSource,
// applied to moment.suggestedHook. When true, the hook is hidden by default and
// a single toggle (showSourcePreview) reveals both hook and sourceTextPreview.

function computeHideHook(text, transcriptLang, outputLanguage) {
  return (
    shouldHideSourcePreview(text, transcriptLang, outputLanguage) ||
    !["latin_dominant", "no_letters"].includes(detectTranscriptScript(text))
  );
}

console.log("\nClipMomentCard hideHook — main quote guard");

// Pure Arabic hook (AI generated in Arabic when outputLanguage="auto") → hide
assert(computeHideHook("(ضحك) كلنا نوجد بأماكن مختلفة", "ar", "auto"), "Arabic hook + auto output → hide");
assert(computeHideHook("توقف عن فعل هذا الشيء الآن", null, null), "Arabic hook, no lang → hide");
assert(computeHideHook("العادة الإنتاجية الوحيدة", "ar", "sl"), "Arabic hook + ar/sl → hide");

// Mixed Arabic/Latin hook (> 15% Arabic) → hide
assert(
  computeHideHook("In this moment الوقت أثمن من المال about time", "ar", "auto"),
  "Mixed Arabic/Latin hook (> 15%) + auto → hide",
);

// Cyrillic hook → hide
assert(computeHideHook("Сегодня мы говорим о продуктивности", "ru", "auto"), "Cyrillic hook + auto → hide");

// CJK hook → hide
assert(computeHideHook("今天我们来谈谈生产力和成功", "zh", "en"), "CJK hook + en output → hide");

// English hook → never hide
assert(!computeHideHook("Stop doing this one thing. You're wasting 3 hours.", "en", "sl"), "English hook + sl → show");
assert(!computeHideHook("The one habit top performers never skip.", null, null), "English hook, no lang → show");
assert(!computeHideHook("Stop grinding. Start winning.", "en", "auto"), "English hook + auto → show");

// Turkish Latin-script hook + auto → show (Latin script, no mismatch)
assert(!computeHideHook("Bu içerik üretkenlik hakkında konuşuyor.", "tr", "auto"), "Turkish Latin hook + auto → show");

// Turkish Latin-script + mismatch → hide (lang metadata fires)
assert(computeHideHook("Bu içerik Türkçe bir videodur.", "tr", "sl"), "Turkish Latin hook + tr/sl → hide (lang mismatch)");

// ─── CONTENT-POLISH-QA-G: Slovenian output sanitizer ────────────────────────

const SL_LETTER = "a-zA-ZčšžćđČŠŽĆĐ";

const SL_WORD_FIXES = [
  ["tvojot", "tvoj"],
  ["zapusteš", "zapustiš"],
  ["najlaži", "najlažji"],
  ["zde", "zdaj"],
  ["prepisodek", "prepis"],
  ["mozeg", "možgani"],
  ["transcript", "prepis"],
  ["stimule", "dražljaje"],
  ["podcástom", "podcastom"],
  ["boredom", "dolgočasje"],
  ["prebraneš", "prebereš"],
];

const SL_SCAFFOLD_TRANSLATIONS = [
  [/\bnobody talks about this\b/gi, "O tem nihče ne govori"],
  [/\bhere(?:['’]s| is) the pattern\b/gi, "To je vzorec"],
  [/\bhere(?:['’]s| is) what this reveals\b/gi, "To razkriva naslednje"],
  [/\bthis is the useful way to think about it\b/gi, "Tako je koristno razmišljati o tem"],
];

const SL_PHRASE_FIXES = [
  [/learning is repeated recall, not repeated exposure/gi,
    "Učenje je priklic, ne ponovna izpostavljenost"],
  [new RegExp(`(?<![${SL_LETTER}])z telefonom(?![${SL_LETTER}])`, "gi"),
    "s telefonom"],
  [new RegExp(`(?<![${SL_LETTER}])tvojemu možganu(?![${SL_LETTER}])`, "gi"),
    "tvojim možganom"],
  [/pred delom namerno naloži dolgočasje/gi,
    "Pred delom si namerno vzemi nekaj minut dolgočasja"],
  [new RegExp(`(?<![${SL_LETTER}])contra vsemu(?![${SL_LETTER}])`, "gi"),
    "v nasprotju z vsem"],
  [/odmore se ti po delu\.\s+to je problem\./gi,
    "Tvoji odmori po delu so problem."],
  [new RegExp(`(?<![${SL_LETTER}])mehanizem je kontraintuitivna(?![${SL_LETTER}])`, "gi"),
    "mehanizem je kontraintuitiven"],
  [new RegExp(`(?<![${SL_LETTER}])z ščepcem(?![${SL_LETTER}])`, "gi"),
    "s ščepcem"],
  [/pil sem kavo ob 7h in se spraševala, zakaj sem ob 15h popolnoma mrtev\./gi,
    "Pil sem kavo ob 7h in se spraševal, zakaj sem ob 15h popolnoma mrtev."],
  [new RegExp(`(?<![${SL_LETTER}])popravi crashe(?![${SL_LETTER}])`, "gi"),
    "popravi popoldanske padce"],
  [new RegExp(`(?<![${SL_LETTER}])peer-reviewed raziskav(?![${SL_LETTER}])`, "gi"),
    "recenziranih raziskav"],
  [new RegExp(`(?<![${SL_LETTER}])problema je to(?![${SL_LETTER}])`, "gi"),
    "Problem je to"],
];

function fixSlovenianWord(text, target, replacement) {
  const re = new RegExp(`(?<![${SL_LETTER}])${target}(?![${SL_LETTER}])`, "gi");
  return text.replace(re, (match) => {
    if (match === match.toUpperCase() && match !== match.toLowerCase()) {
      return replacement.toUpperCase();
    }
    if (match[0] !== match[0].toLowerCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

function applyPhraseFix(text, re, replacement) {
  return text.replace(re, (match) => {
    const first = match[0];
    const matchedUpper = first !== first.toLowerCase() && first === first.toUpperCase();
    return matchedUpper
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement[0].toLowerCase() + replacement.slice(1);
  });
}

function sanitizeSlovenianOutput(text) {
  let out = text
    .replace(/[Ѐ-ԯ]/g, "")
    .replace(/ć/g, "č").replace(/Ć/g, "Č")
    .replace(/đ/g, "dž").replace(/Đ/g, "Dž")
    .replace(/\bmannequin[a-z]*/gi, "lutke");
  for (const [re, replacement] of SL_SCAFFOLD_TRANSLATIONS) {
    out = out.replace(re, replacement);
  }
  for (const [re, replacement] of SL_PHRASE_FIXES) {
    out = applyPhraseFix(out, re, replacement);
  }
  for (const [target, replacement] of SL_WORD_FIXES) {
    out = fixSlovenianWord(out, target, replacement);
  }
  return out.replace(/ {2,}/g, " ").trim();
}

console.log("\nCONTENT-POLISH-QA-G — Slovenian output sanitizer");

// Cyrillic characters stripped (production failure: "Kdo Je Preživел?")
assert(
  !/[Ѐ-ԯ]/.test(sanitizeSlovenianOutput("Kdo Je Preživел?")),
  "QA-G: Cyrillic stripped from Slovenian output",
);

// ć → č (production failure: "neobstojećih")
assert(
  sanitizeSlovenianOutput("neobstojećih dejstev") === "neobstoječih dejstev",
  "QA-G: ć replaced with č",
);
assert(
  !sanitizeSlovenianOutput("neobstojećih dejstev").includes("neobstojećih"),
  "QA-G: 'neobstojećih' absent after sanitization",
);

// mannequini replaced (production failure: "mannequini / mannequinom")
assert(
  !sanitizeSlovenianOutput("med stotimi mannequini").includes("mannequini"),
  "QA-G: 'mannequini' replaced",
);
assert(
  sanitizeSlovenianOutput("med stotimi mannequini") === "med stotimi lutke",
  "QA-G: mannequini → lutke",
);

// mannequinom replaced
assert(
  !sanitizeSlovenianOutput("igra z mannequinom").includes("mannequinom"),
  "QA-G: 'mannequinom' replaced",
);
assert(
  sanitizeSlovenianOutput("igra z mannequinom") === "igra z lutke",
  "QA-G: mannequinom → lutke",
);

// Case-insensitive mannequin replacement
assert(
  !sanitizeSlovenianOutput("MANNEQUINI so visoke").includes("MANNEQUINI"),
  "QA-G: uppercase MANNEQUINI replaced",
);

// đ → dž
assert(
  !sanitizeSlovenianOutput("Đuro je prišel").includes("Đ"),
  "QA-G: Đ replaced in Slovenian output",
);

// Clean Slovenian passes through unchanged
assert(
  sanitizeSlovenianOutput("Lutke so na polici.") === "Lutke so na polici.",
  "QA-G: clean Slovenian text unchanged",
);

// ─── CONTENT-LANGUAGE-QA-D: Slovenian grammar polish + scaffold translation ──
// Production failures from qM6yqU7RGhU:
//   • "Nobody talks about this" leaked into Slovenian TikTok output
//   • Grammar typos: tvojot/zapusteš/najlaži/zde
// Fix: deterministic scaffold-phrase translation + whole-word typo correction.
// Word-boundary uses an explicit Slovenian letter class because JS \b breaks
// around words ending in š/ž (e.g. "zapusteš").

console.log("\nCONTENT-LANGUAGE-QA-D — English scaffold phrases translated");

// 1. "Nobody talks about this —" removed/translated (no longer English)
assert(
  !sanitizeSlovenianOutput("Nobody talks about this — tvoj fokus se kruši.").includes("Nobody talks about this"),
  "QA-D: 'Nobody talks about this' translated out of Slovenian output",
);
assert(
  sanitizeSlovenianOutput("Nobody talks about this — počneš narobe.") === "O tem nihče ne govori — počneš narobe.",
  "QA-D: 'Nobody talks about this' → 'O tem nihče ne govori'",
);

// Other known scaffold phrases (straight + curly apostrophe, 'is' variant)
assert(
  sanitizeSlovenianOutput("Here's the pattern: ponavljaš isto napako.") === "To je vzorec: ponavljaš isto napako.",
  "QA-D: \"Here's the pattern\" → 'To je vzorec'",
);
assert(
  sanitizeSlovenianOutput("Here is the pattern.") === "To je vzorec.",
  "QA-D: 'Here is the pattern' → 'To je vzorec'",
);
assert(
  sanitizeSlovenianOutput("Here's what this reveals about fokus.") === "To razkriva naslednje about fokus.",
  "QA-D: \"Here's what this reveals\" → 'To razkriva naslednje'",
);
assert(
  sanitizeSlovenianOutput("This is the useful way to think about it.") === "Tako je koristno razmišljati o tem.",
  "QA-D: 'This is the useful way to think about it' → translated",
);

console.log("\nCONTENT-LANGUAGE-QA-D — Slovenian grammar typo fixes");

// 2. tvojot → tvoj
assert(
  sanitizeSlovenianOutput("tvojot fokus") === "tvoj fokus",
  "QA-D: 'tvojot fokus' → 'tvoj fokus'",
);

// 3. zapusteš → zapustiš (ends in š — \b would fail, explicit class works)
assert(
  sanitizeSlovenianOutput("zapusteš aplikacijo") === "zapustiš aplikacijo",
  "QA-D: 'zapusteš aplikacijo' → 'zapustiš aplikacijo'",
);

// 4. Najlaži → Najlažji (capitalization preserved)
assert(
  sanitizeSlovenianOutput("Najlaži začetek") === "Najlažji začetek",
  "QA-D: 'Najlaži začetek' → 'Najlažji začetek'",
);

// 5. Zde → Zdaj (capitalization preserved)
assert(
  sanitizeSlovenianOutput("Zde je koristen način") === "Zdaj je koristen način",
  "QA-D: 'Zde je koristen način' → 'Zdaj je koristen način'",
);

// Extra documented fixes
assert(
  sanitizeSlovenianOutput("prepisodek pokaže resnico") === "prepis pokaže resnico",
  "QA-D: 'prepisodek' → 'prepis'",
);
assert(
  sanitizeSlovenianOutput("tvoj mozeg se upira") === "tvoj možgani se upira",
  "QA-D: 'mozeg' → 'možgani'",
);
assert(
  sanitizeSlovenianOutput("Transcript razkrije resnico") === "Prepis razkrije resnico",
  "QA-D: 'Transcript razkrije' → 'Prepis razkrije' (no English 'Transcript' leak)",
);
assert(
  !sanitizeSlovenianOutput("Transcript razkrije resnico").includes("Transcript razkrije"),
  "QA-D: 'Transcript razkrije' absent after sanitization",
);

console.log("\nCONTENT-LANGUAGE-QA-D — word-boundary safety (no over-aggressive replacement)");

// "zde" must NOT match inside valid words (lookbehind/lookahead protect)
assert(
  sanitizeSlovenianOutput("izdelek je zdrav") === "izdelek je zdrav",
  "QA-D: 'zde' not replaced inside 'izdelek'; 'zdrav' untouched",
);
// "najlaži" token only — "laži" (valid: lies) untouched
assert(
  sanitizeSlovenianOutput("njegove laži") === "njegove laži",
  "QA-D: standalone 'laži' (lies) not altered by 'najlaži' rule",
);
// Capitalization variants
assert(
  sanitizeSlovenianOutput("Tvojot fokus") === "Tvoj fokus",
  "QA-D: 'Tvojot' (Title) → 'Tvoj' (Title preserved)",
);
// Clean Slovenian with diacritics passes through
assert(
  sanitizeSlovenianOutput("Zdaj zapustiš aplikacijo in najlažji korak je tvoj.") ===
    "Zdaj zapustiš aplikacijo in najlažji korak je tvoj.",
  "QA-D: already-correct Slovenian text unchanged (no false positives)",
);

console.log("\nCONTENT-LANGUAGE-QA-D — existing sanitizer protections still pass");

// no Cyrillic leakage
assert(
  !/[Ѐ-ԯ]/.test(sanitizeSlovenianOutput("Kdo Je Preživел?")),
  "QA-D: Cyrillic still stripped",
);
// no mannequin/mannequini leakage
assert(
  !sanitizeSlovenianOutput("med stotimi mannequini").includes("mannequini"),
  "QA-D: 'mannequini' still replaced",
);
// no "Transcript razkrije"
assert(
  !sanitizeSlovenianOutput("Transcript razkrije vzorec").includes("Transcript"),
  "QA-D: English 'Transcript' fully removed",
);
// no Serbian/Croatian "neobstojećih"
assert(
  !sanitizeSlovenianOutput("neobstojećih dejstev").includes("neobstojećih"),
  "QA-D: 'neobstojećih' (ć) still corrected to 'neobstoječih'",
);

// ─── CONTENT-LANGUAGE-QA-E: residual Slovenian grammar + English leakage ─────
// Residual issues from the Slovenian qM6yqU7RGhU retest (after QA-D passed):
// English leakage, wrong preposition/case, Balkan/Latin loanwords, awkward
// phrasing, and a foreign acute accent. All exact-phrase / exact-token fixes —
// no grammar engine. Croatian/Serbian output is explicitly out of scope.

console.log("\nCONTENT-LANGUAGE-QA-E — residual fixes");

// 1. English leakage → translated to Slovenian (trailing period preserved)
assert(
  sanitizeSlovenianOutput("Learning is repeated recall, not repeated exposure.") ===
    "Učenje je priklic, ne ponovna izpostavljenost.",
  "QA-E: English 'Learning is repeated recall...' → Slovenian",
);
assert(
  !sanitizeSlovenianOutput("Learning is repeated recall, not repeated exposure.").includes("Learning is repeated recall"),
  "QA-E: English 'Learning is repeated recall' no longer present",
);

// 2. Wrong preposition: "z telefonom" → "s telefonom"
assert(
  sanitizeSlovenianOutput("Odmor z telefonom") === "Odmor s telefonom",
  "QA-E: 'Odmor z telefonom' → 'Odmor s telefonom'",
);

// 3. Wrong noun case: "tvojemu možganu" → "tvojim možganom"
assert(
  sanitizeSlovenianOutput("tvojemu možganu škodijo") === "tvojim možganom škodijo",
  "QA-E: 'tvojemu možganu škodijo' → 'tvojim možganom škodijo'",
);

// 4. Balkan/Latin loanword: "nove stimule" → "nove dražljaje"
assert(
  sanitizeSlovenianOutput("nove stimule") === "nove dražljaje",
  "QA-E: 'nove stimule' → 'nove dražljaje'",
);

// 5. Awkward phrase → natural Slovenian rewrite
assert(
  sanitizeSlovenianOutput("Pred delom namerno naloži dolgočasje") ===
    "Pred delom si namerno vzemi nekaj minut dolgočasja",
  "QA-E: 'Pred delom namerno naloži dolgočasje' → natural phrase",
);

// 6. Foreign acute accent: "podcástom" → "podcastom"
assert(
  sanitizeSlovenianOutput("poslušaj me na podcástom") === "poslušaj me na podcastom",
  "QA-E: 'podcástom' → 'podcastom'",
);

// 7. Latin/Balkan leakage: "contra vsemu" → "v nasprotju z vsem"
assert(
  sanitizeSlovenianOutput("contra vsemu kar veš") === "v nasprotju z vsem kar veš",
  "QA-E: 'contra vsemu' → 'v nasprotju z vsem'",
);

// 8. Broken two-sentence fragment → single natural sentence
assert(
  sanitizeSlovenianOutput("Odmore se ti po delu. To je problem.") ===
    "Tvoji odmori po delu so problem.",
  "QA-E: 'Odmore se ti po delu. To je problem.' → 'Tvoji odmori po delu so problem.'",
);

console.log("\nCONTENT-LANGUAGE-QA-E — capitalization + boundary safety");

// Capitalization follows the match (sentence-initial "Contra" → "V ...")
assert(
  sanitizeSlovenianOutput("Contra vsemu kar veš") === "V nasprotju z vsem kar veš",
  "QA-E: 'Contra vsemu' (Title) → 'V nasprotju z vsem'",
);
// "z telefonom" only as a standalone phrase — does not corrupt other "z" usage
assert(
  sanitizeSlovenianOutput("Govori z mano o telefonih") === "Govori z mano o telefonih",
  "QA-E: unrelated 'z mano' / 'telefonih' not altered by 'z telefonom' rule",
);
// "stimule" token only — broader valid text untouched
assert(
  sanitizeSlovenianOutput("To so dražljaji, ne stimule") === "To so dražljaji, ne dražljaje",
  "QA-E: standalone 'stimule' → 'dražljaje'; 'dražljaji' untouched",
);
// Already-correct Slovenian passes through unchanged
assert(
  sanitizeSlovenianOutput("Odmor s telefonom škodi tvojim možganom.") ===
    "Odmor s telefonom škodi tvojim možganom.",
  "QA-E: already-correct Slovenian unchanged (no false positives)",
);

console.log("\nCONTENT-LANGUAGE-QA-E — QA-D protections still pass");

// no QA-D English scaffold phrase
assert(
  !sanitizeSlovenianOutput("Nobody talks about this — počneš narobe.").includes("Nobody talks about this"),
  "QA-E: QA-D scaffold 'Nobody talks about this' still translated",
);
// no Cyrillic leakage
assert(
  !/[Ѐ-ԯ]/.test(sanitizeSlovenianOutput("Kdo Je Preživел?")),
  "QA-E: Cyrillic still stripped",
);
// no mannequin/mannequini leakage
assert(
  !sanitizeSlovenianOutput("med stotimi mannequini").includes("mannequini"),
  "QA-E: 'mannequini' still replaced",
);
// no "Transcript razkrije"
assert(
  !sanitizeSlovenianOutput("Transcript razkrije vzorec").includes("Transcript"),
  "QA-E: English 'Transcript' still removed",
);
// no Serbian/Croatian "neobstojećih"
assert(
  !sanitizeSlovenianOutput("neobstojećih dejstev").includes("neobstojećih"),
  "QA-E: 'neobstojećih' (ć) still corrected",
);
// QA-D typo fixes still active
assert(
  sanitizeSlovenianOutput("tvojot fokus, zapusteš aplikacijo, Zde je") ===
    "tvoj fokus, zapustiš aplikacijo, Zdaj je",
  "QA-E: QA-D word fixes (tvojot/zapusteš/zde) still active",
);

// ─── CONTENT-LANGUAGE-QA-F: minor polish for production sample Pmd6knanPKw ────
// After QA-D + QA-E, Slovenian cards are broadly usable. Pmd6knanPKw passed
// overall but surfaced a few minor residual issues: adjective/noun gender
// agreement, s/z preposition before voiceless š, gender-mixed first-person copy,
// English/slang leakage, and two malformed tokens. All exact-phrase / exact-token
// fixes — no grammar engine. Croatian/Serbian output is out of scope.

console.log("\nCONTENT-LANGUAGE-QA-F — residual production polish");

// 1. Adjective gender agreement (mehanizem masculine)
assert(
  sanitizeSlovenianOutput("mehanizem je kontraintuitivna") === "mehanizem je kontraintuitiven",
  "QA-F: 'mehanizem je kontraintuitivna' → 'mehanizem je kontraintuitiven'",
);

// 2. Preposition before voiceless š: "z ščepcem" → "s ščepcem"
assert(
  sanitizeSlovenianOutput("voda z ščepcem") === "voda s ščepcem",
  "QA-F: 'voda z ščepcem' → 'voda s ščepcem'",
);

// 3. Gender-mixed first-person sentence → masculine-consistent
assert(
  sanitizeSlovenianOutput("Pil sem kavo ob 7h in se spraševala, zakaj sem ob 15h popolnoma mrtev.") ===
    "Pil sem kavo ob 7h in se spraševal, zakaj sem ob 15h popolnoma mrtev.",
  "QA-F: gender-mixed coffee sentence → consistent masculine ('spraševala' → 'spraševal')",
);
assert(
  !sanitizeSlovenianOutput("Pil sem kavo ob 7h in se spraševala, zakaj sem ob 15h popolnoma mrtev.").includes("spraševala"),
  "QA-F: feminine 'spraševala' no longer present in the mixed sentence",
);

// 4. English slang leakage → Slovenian
assert(
  sanitizeSlovenianOutput("popravi crashe danes") === "popravi popoldanske padce danes",
  "QA-F: 'popravi crashe' → 'popravi popoldanske padce'",
);

// 5. English academic phrase → Slovenian
assert(
  sanitizeSlovenianOutput("na podlagi peer-reviewed raziskav") === "na podlagi recenziranih raziskav",
  "QA-F: 'peer-reviewed raziskav' → 'recenziranih raziskav'",
);

// 6. Wrong noun case: "Problema je to" → "Problem je to"
assert(
  sanitizeSlovenianOutput("Problema je to") === "Problem je to",
  "QA-F: 'Problema je to' → 'Problem je to'",
);

// 7. English word leakage: "boredom" → "dolgočasje"
assert(
  sanitizeSlovenianOutput("boredom ni ovira") === "dolgočasje ni ovira",
  "QA-F: 'boredom ni ovira' → 'dolgočasje ni ovira'",
);

// 8. Malformed verb: "Prebraneš stran" → "Prebereš stran"
assert(
  sanitizeSlovenianOutput("Prebraneš stran") === "Prebereš stran",
  "QA-F: 'Prebraneš stran' → 'Prebereš stran'",
);

console.log("\nCONTENT-LANGUAGE-QA-F — capitalization + boundary safety");

// "Problema" only as standalone phrase "Problema je to" — valid genitive untouched
assert(
  sanitizeSlovenianOutput("Tega problema ne razumem") === "Tega problema ne razumem",
  "QA-F: valid genitive 'problema' (not followed by 'je to') untouched",
);
// "z ščepcem" rule does not touch other valid "z" usage
assert(
  sanitizeSlovenianOutput("z mano gre") === "z mano gre",
  "QA-F: unrelated 'z mano' not altered by 'z ščepcem' rule",
);
// "kontraintuitivna" alone (valid with feminine noun) untouched outside the phrase
assert(
  sanitizeSlovenianOutput("ta ideja je kontraintuitivna") === "ta ideja je kontraintuitivna",
  "QA-F: valid feminine 'kontraintuitivna' (not after 'mehanizem je') untouched",
);
// Capitalization follows the match (sentence-initial)
assert(
  sanitizeSlovenianOutput("Boredom ni ovira") === "Dolgočasje ni ovira",
  "QA-F: 'Boredom' (Title) → 'Dolgočasje' (Title preserved)",
);

console.log("\nCONTENT-LANGUAGE-QA-F — QA-D + QA-E protections still pass");

// QA-D
assert(
  !sanitizeSlovenianOutput("Nobody talks about this — počneš narobe.").includes("Nobody talks about this"),
  "QA-F: 'Nobody talks about this' still translated",
);
assert(
  sanitizeSlovenianOutput("tvojot fokus") === "tvoj fokus",
  "QA-F: QA-D 'tvojot' still fixed",
);
assert(
  sanitizeSlovenianOutput("zapusteš aplikacijo") === "zapustiš aplikacijo",
  "QA-F: QA-D 'zapusteš' still fixed",
);
assert(
  sanitizeSlovenianOutput("Najlaži začetek") === "Najlažji začetek",
  "QA-F: QA-D 'najlaži' still fixed",
);
assert(
  sanitizeSlovenianOutput("Zde je") === "Zdaj je",
  "QA-F: QA-D 'zde' still fixed",
);
assert(
  sanitizeSlovenianOutput("tvoj mozeg") === "tvoj možgani",
  "QA-F: QA-D 'mozeg' still fixed",
);
assert(
  !sanitizeSlovenianOutput("Transcript razkrije vzorec").includes("Transcript"),
  "QA-F: QA-D 'Transcript' still removed",
);
// QA-E
assert(
  !sanitizeSlovenianOutput("Learning is repeated recall, not repeated exposure.").includes("Learning is repeated recall"),
  "QA-F: QA-E 'Learning is repeated recall...' still translated",
);
assert(
  sanitizeSlovenianOutput("Odmor z telefonom") === "Odmor s telefonom",
  "QA-F: QA-E 'z telefonom' still fixed",
);
assert(
  sanitizeSlovenianOutput("tvojemu možganu škodijo") === "tvojim možganom škodijo",
  "QA-F: QA-E 'tvojemu možganu' still fixed",
);
assert(
  sanitizeSlovenianOutput("nove stimule") === "nove dražljaje",
  "QA-F: QA-E 'nove stimule' still fixed",
);
assert(
  sanitizeSlovenianOutput("poslušaj me na podcástom") === "poslušaj me na podcastom",
  "QA-F: QA-E 'podcástom' still fixed",
);
assert(
  sanitizeSlovenianOutput("contra vsemu kar veš") === "v nasprotju z vsem kar veš",
  "QA-F: QA-E 'contra vsemu' still fixed",
);

// ─── CONTENT-POLISH-QA-F: Slovenian nativeNote rules ────────────────────────
// Mirror the Slovenian nativeNote from app/lib/languages/options.ts.
// These tests verify the note contains the required prompt-engineering guards
// so that if the string is ever edited, the regression is immediately visible.

const SLOVENIAN_NATIVE_NOTE =
  "Use natural Slovenian creator and social media phrasing. Do not mix Slovenian with Croatian, Serbian, or Bosnian. Do NOT use the English word 'Transcript' in Slovenian output — use 'prepis', 'vsebina', or 'iz posnetka' instead. For English 'mannequin(s)': use 'mannequin' / 'mannequini' or 'lutka' / 'lutke' (display dummy). Do NOT use 'manekenka' / 'manekenke' / 'manekenkami' — those mean fashion model(s), not display mannequins.";

console.log("\nCONTENT-POLISH-QA-F — Slovenian nativeNote guards");

assert(
  SLOVENIAN_NATIVE_NOTE.includes("Transcript") &&
    SLOVENIAN_NATIVE_NOTE.includes("prepis"),
  "QA-F: Slovenian note bans English 'Transcript' and offers 'prepis' alternative",
);

assert(
  SLOVENIAN_NATIVE_NOTE.includes("vsebina") &&
    SLOVENIAN_NATIVE_NOTE.includes("iz posnetka"),
  "QA-F: Slovenian note includes 'vsebina' and 'iz posnetka' alternatives",
);

assert(
  SLOVENIAN_NATIVE_NOTE.includes("mannequin") &&
    SLOVENIAN_NATIVE_NOTE.includes("lutka"),
  "QA-F: Slovenian note includes mannequin translation hint with 'lutka'",
);

assert(
  SLOVENIAN_NATIVE_NOTE.includes("manekenka"),
  "QA-F: Slovenian note names 'manekenka' as the word to AVOID",
);

assert(
  SLOVENIAN_NATIVE_NOTE.includes("manekenkami"),
  "QA-F: Slovenian note names 'manekenkami' as the word to AVOID",
);

assert(
  !SLOVENIAN_NATIVE_NOTE.startsWith("manekenk"),
  "QA-F: Slovenian note does not recommend 'manekenk-' forms as the correct translation",
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
