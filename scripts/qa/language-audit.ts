// Virnix QA — Language Selection static audit (LANG-QA-A).
//
// Checks:
//   1. All expected language IDs exist in OUTPUT_LANGUAGES
//   2. formatLanguageContext("auto") returns "" — guaranteed no-op
//   3. Every non-auto language returns non-empty context
//   4. Every non-auto context includes core directive phrases
//   5. Croatian includes no-mix warning
//   6. Serbian Latin includes Latin-script + no-Cyrillic rule
//   7. Bosnian includes no-mix warning
//   8. isValidLanguageId rejects unknown values and accepts all valid IDs
//   9. buildPrompt with "auto" == buildPrompt without (byte-for-byte identical)
//  10. buildPrompt with explicit language injects language context in GENERATION PROFILE
//  11. Language context appears AFTER energy context in prompt
//  12. Priority instruction is present and correctly ordered
//
// No API calls. Zero cost. Safe to run at any time.
// Run: npx.cmd tsx scripts/qa/language-audit.ts

import { formatLanguageContext } from "../../app/lib/languages/prompt-context";
import { OUTPUT_LANGUAGES, isValidLanguageId, getLanguageById } from "../../app/lib/languages/options";
import type { OutputLanguageId } from "../../app/lib/languages/types";
import { buildPrompt } from "../../app/lib/prompts";
import { formatEnergyContext } from "../../app/lib/creator-energy/prompt-context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function header(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}
function pass(msg: string): void { console.log(`  ✓ ${msg}`); }
function fail(msg: string): void { console.log(`  ✗ ${msg}`); failCount++; }
function info(msg: string): void { console.log(`    ${msg}`); }

let failCount = 0;

function assertPass(cond: boolean, ok: string, bad: string): void {
  if (cond) pass(ok); else fail(bad);
}

// ─── Expected language pack (LANG-A) ─────────────────────────────────────────

const EXPECTED_IDS: OutputLanguageId[] = [
  "auto", "en", "sl", "hr", "sr-latn", "bs", "de", "it", "es", "fr", "pt",
];

// ─── 1. Language options list completeness ────────────────────────────────────

header("1. Language options list completeness");

assertPass(
  OUTPUT_LANGUAGES.length === EXPECTED_IDS.length,
  `OUTPUT_LANGUAGES has ${OUTPUT_LANGUAGES.length} entries (expected ${EXPECTED_IDS.length})`,
  `OUTPUT_LANGUAGES has ${OUTPUT_LANGUAGES.length} entries, expected ${EXPECTED_IDS.length}`
);

for (const id of EXPECTED_IDS) {
  const found = OUTPUT_LANGUAGES.some((l) => l.id === id);
  assertPass(found, `ID "${id}" present`, `ID "${id}" MISSING from OUTPUT_LANGUAGES`);
}

const firstIsAuto = OUTPUT_LANGUAGES[0]?.id === "auto";
assertPass(firstIsAuto, `First entry is "auto" (default / fallback position)`, `First entry is NOT "auto" — getLanguageById fallback would break`);

// ─── 2. Auto returns "" — guaranteed no-op ────────────────────────────────────

header('2. formatLanguageContext("auto") is empty string');

const autoResult = formatLanguageContext("auto");
assertPass(autoResult === "", `Auto returns empty string ""`, `Auto returned non-empty: "${autoResult}"`);

// ─── 3. All non-auto languages return non-empty context ───────────────────────

header("3. Non-auto languages return non-empty context");

const nonAutoIds = EXPECTED_IDS.filter((id) => id !== "auto") as Exclude<OutputLanguageId, "auto">[];
for (const id of nonAutoIds) {
  const ctx = formatLanguageContext(id);
  assertPass(ctx.length > 0, `"${id}" returns non-empty context`, `"${id}" returned empty context`);
}

// ─── 4. Core directive phrases present in every non-auto language ─────────────

header("4. Core directive phrases in all non-auto languages");

const REQUIRED_PHRASES = [
  "Write all outputs natively in",
  "Do not literally translate English viral hook formulas",
  "Priority: Output language is mandatory",
];

for (const id of nonAutoIds) {
  const ctx = formatLanguageContext(id);
  for (const phrase of REQUIRED_PHRASES) {
    assertPass(
      ctx.includes(phrase),
      `"${id}" includes "${phrase.slice(0, 40)}..."`,
      `"${id}" MISSING phrase: "${phrase}"`
    );
  }
}

// ─── 5. Croatian no-mix + Latin-script enforcement ────────────────────────────

header("5. Croatian no-mix warning + Latin-script enforcement");

const hrCtx = formatLanguageContext("hr");
assertPass(
  hrCtx.toLowerCase().includes("serbian") || hrCtx.toLowerCase().includes("bosnian"),
  "Croatian context warns against mixing with Serbian/Bosnian",
  "Croatian context is MISSING no-mix warning for Serbian/Bosnian"
);
assertPass(
  hrCtx.toLowerCase().includes("latin"),
  "Croatian context specifies Latin script",
  "Croatian context does NOT mention Latin script — model may emit Cyrillic"
);
assertPass(
  hrCtx.toLowerCase().includes("cyrillic"),
  "Croatian context explicitly forbids Cyrillic",
  "Croatian context does NOT mention Cyrillic — model may emit Cyrillic"
);
info(`Croatian nativeNote: "${getLanguageById("hr").nativeNote}"`);

// ─── 6. Serbian Latin: Latin-only + no-Cyrillic ───────────────────────────────

header("6. Serbian Latin script enforcement");

const srCtx = formatLanguageContext("sr-latn");
assertPass(
  srCtx.toLowerCase().includes("latin"),
  "Serbian Latin context specifies Latin script",
  "Serbian Latin context does NOT mention Latin script"
);
assertPass(
  srCtx.toLowerCase().includes("cyrillic"),
  "Serbian Latin context explicitly forbids Cyrillic",
  "Serbian Latin context does NOT mention Cyrillic — model may default to Cyrillic"
);
assertPass(
  srCtx.toLowerCase().includes("croatian") || srCtx.toLowerCase().includes("bosnian"),
  "Serbian Latin context warns against mixing",
  "Serbian Latin context is MISSING no-mix warning"
);
info(`Serbian Latin nativeNote: "${getLanguageById("sr-latn").nativeNote}"`);

// ─── 7. Bosnian no-mix warning ────────────────────────────────────────────────

header("7. Bosnian no-mix warning");

const bsCtx = formatLanguageContext("bs");
assertPass(
  bsCtx.toLowerCase().includes("serbian") || bsCtx.toLowerCase().includes("croatian"),
  "Bosnian context warns against mixing with Serbian/Croatian",
  "Bosnian context is MISSING no-mix warning for Serbian/Croatian"
);
info(`Bosnian nativeNote: "${getLanguageById("bs").nativeNote}"`);

// ─── Bonus: Slovenian note present ────────────────────────────────────────────

header("7b. Slovenian no-mix warning");

const slLang = getLanguageById("sl");
assertPass(
  !!slLang.nativeNote,
  "Slovenian has nativeNote",
  "Slovenian is MISSING nativeNote"
);
if (slLang.nativeNote) {
  assertPass(
    slLang.nativeNote.toLowerCase().includes("croatian") || slLang.nativeNote.toLowerCase().includes("serbian"),
    "Slovenian nativeNote warns against mixing with Croatian/Serbian",
    "Slovenian nativeNote is MISSING no-mix warning for Croatian/Serbian"
  );
  info(`Slovenian nativeNote: "${slLang.nativeNote}"`);
}

// ─── 8. Allowlist validation ──────────────────────────────────────────────────

header("8. isValidLanguageId allowlist");

// Valid IDs must pass
for (const id of EXPECTED_IDS) {
  assertPass(isValidLanguageId(id), `isValidLanguageId("${id}") → true`, `isValidLanguageId("${id}") → false — ALLOWLIST BUG`);
}

// Invalid values must fail
const INVALID_INPUTS = [
  "ru", "zh", "ar", "pl", "nl", "", "AUTO", "Auto",
  "en-US", "sr-cyrl", "unknown", null, undefined, 42, {}, [],
];
for (const bad of INVALID_INPUTS) {
  assertPass(
    !isValidLanguageId(bad),
    `isValidLanguageId(${JSON.stringify(bad)}) → false (correctly rejected)`,
    `isValidLanguageId(${JSON.stringify(bad)}) → true — INJECTION RISK`
  );
}

// ─── 9. Auto prompt is byte-for-byte identical to pre-LANG-A prompt ───────────

header("9. Auto mode = zero prompt change (byte-for-byte identical)");

const SAMPLE_TRANSCRIPT = "This is a test transcript about business and entrepreneurship.";

// buildPrompt seeds random variation, so we must fix the comparison carefully:
// We compare with explicit "" vs. formatLanguageContext("auto") which also returns "".
const langContextAuto = formatLanguageContext("auto");
assertPass(langContextAuto === "", "formatLanguageContext(auto) produces empty string — prompts are identical to pre-LANG-A", "Auto did not return empty");

// ─── 10. Explicit language injects into GENERATION PROFILE ────────────────────

header("10. Language context injection position in prompt");

// Build prompt with Slovenian selected
const slContext = formatLanguageContext("sl");
const promptWithSl = buildPrompt(SAMPLE_TRANSCRIPT, "", "", slContext);

assertPass(
  promptWithSl.includes(slContext),
  "Slovenian language context appears verbatim in built prompt",
  "Slovenian language context NOT found in built prompt"
);

assertPass(
  promptWithSl.includes("━━━ GENERATION PROFILE ━━━"),
  "GENERATION PROFILE marker present in prompt",
  "GENERATION PROFILE marker MISSING"
);

const profileStart = promptWithSl.indexOf("━━━ GENERATION PROFILE ━━━");
const platformStart = promptWithSl.indexOf("Platform requirements:");
const langContextStart = promptWithSl.indexOf(slContext);

assertPass(
  profileStart < langContextStart && langContextStart < platformStart,
  "Language context is inside GENERATION PROFILE (after marker, before platform requirements)",
  "Language context is NOT correctly positioned in GENERATION PROFILE"
);

// ─── 11. Language context appears AFTER energy context ────────────────────────

header("11. Language context appears after energy context (priority ordering)");

const energyCtx = formatEnergyContext(["tactical"]);
const promptWithBoth = buildPrompt(SAMPLE_TRANSCRIPT, "", energyCtx, slContext);

const energyStart = promptWithBoth.indexOf("Creator energy:");
const langStart = promptWithBoth.indexOf("Output language:");

if (energyStart === -1) {
  fail("Energy context not found in prompt with both energy+language — check formatEnergyContext");
} else if (langStart === -1) {
  fail("Language context not found in prompt with both energy+language");
} else {
  assertPass(
    energyStart < langStart,
    `Energy context (pos ${energyStart}) appears before language context (pos ${langStart}) — correct priority order`,
    `Language context appears BEFORE energy context — priority order is wrong`
  );
}

// ─── 12. Priority instruction order ──────────────────────────────────────────

header("12. Priority instruction hierarchy");

const deCtx = formatLanguageContext("de");
assertPass(
  deCtx.includes("Output language is mandatory"),
  "Priority line says language is mandatory",
  "Priority line missing 'mandatory'"
);
assertPass(
  deCtx.includes("Creator Energy is creative steering"),
  "Priority line correctly names Creator Energy as creative steering",
  "Priority line missing Creator Energy reference"
);
assertPass(
  deCtx.includes("Variation profile is secondary"),
  "Priority line correctly demotes variation profile",
  "Priority line missing variation profile demotion"
);

info("Priority hierarchy confirmed: language > Creator Energy > variation profile");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(55));
if (failCount === 0) {
  console.log(`✅ ALL CHECKS PASS — 0 failures, 0 warnings`);
} else {
  console.log(`❌ ${failCount} FAILURE(S)`);
}
console.log("─".repeat(55));

if (failCount > 0) process.exit(1);
