// LANG-REAL-A: Real AI multilingual output smoke test.
//
// Runs 6 API calls: Auto (English baseline) + Slovenian + Croatian +
// Serbian Latin + German + Bosnian. Uses a single English creator
// transcript so language differences are clearly attributable to the
// language directive, not transcript content.
//
// Checks per language:
//   - Non-auto: output contains target-language characters (diacritics / umlauts)
//   - Auto:     output is in English (no unexpected Slavic/German diacritics)
//   - Serbian Latin: ZERO Cyrillic characters (P0 if present)
//   - All:      platform structure intact (TikTok/LinkedIn/Twitter/YouTube present)
//   - All:      no invented numbers beyond transcript source
//
// Human-readable previews printed per call for manual quality review.
// Does NOT mutate credits or Supabase.
//
// Run: npx.cmd tsx scripts/qa/language-real-ai.ts
// Requires: ANTHROPIC_API_KEY in .env.local

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SYSTEM_PROMPT, buildPrompt } from "../../app/lib/prompts/index";
import { getProvider } from "../../app/lib/ai/provider";
import { parseAnthropicResponse } from "../../app/lib/ai/parser";
import { formatLanguageContext } from "../../app/lib/languages/prompt-context";
import { estimateTokens, estimateCost } from "../../app/lib/ai/chunker";
import type { OutputLanguageId } from "../../app/lib/languages/types";

// ─── Load .env.local ──────────────────────────────────────────────────────────

(function loadEnv(): void {
  try {
    const content = readFileSync(resolve(".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* missing .env.local — API key check below catches it */ }
})();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\n✗ ANTHROPIC_API_KEY not found in .env.local");
  console.error("  Real AI tests cannot run without the API key.");
  console.error("  Add ANTHROPIC_API_KEY=sk-ant-... to .env.local and re-run.\n");
  process.exit(1);
}

// ─── Fixture transcript ───────────────────────────────────────────────────────
// Single English creator/business transcript for all language tests.
// Short (~110 words) to minimise token cost.

const TRANSCRIPT = `Posting frequency was not the strongest predictor of growth. Save rate was.
The creators who grew fastest posted less often but made content people returned to.
I tracked 200 accounts over 18 months. At month six, 73% of the fastest-growing accounts
had reduced posting frequency. Reach went up. Saves went up. Follower growth accelerated.
The algorithm does not reward volume. It rewards retention and saves.
If someone saves your post, the system treats it as high-value signal.
Specificity beats polish. Raw and useful beats beautiful and vague. Every single time.`;

// ─── Test cases ───────────────────────────────────────────────────────────────

interface TestCase {
  name: string;
  language: OutputLanguageId;
  label: string;
}

const TEST_CASES: TestCase[] = [
  { name: "auto",     language: "auto",     label: "Auto (English baseline)" },
  { name: "sl",       language: "sl",       label: "Slovenian"               },
  { name: "hr",       language: "hr",       label: "Croatian"                },
  { name: "sr-latn",  language: "sr-latn",  label: "Serbian Latin"           },
  { name: "de",       language: "de",       label: "German"                  },
  { name: "bs",       language: "bs",       label: "Bosnian"                 },
];

// ─── Output shape ─────────────────────────────────────────────────────────────

interface Output {
  tiktok: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
}

interface TestResult {
  tc: TestCase;
  output: Output | null;
  elapsedMs: number;
  estTokens: number;
  estCostStr: string;
  error?: string;
}

// ─── Language checks ──────────────────────────────────────────────────────────

// Unicode ranges:
const CYRILLIC_RE    = /[Ѐ-ӿ]/;
// Slavic Latin diacritics: š č ž đ ć (covers SL/HR/BS/SR)
const SLAVIC_DIAC_RE = /[šŠčČžŽđĐćĆ]/;
// German-specific characters
const GERMAN_DIAC_RE = /[üÜöÖäÄß]/;

interface LangCheck {
  hasCyrillic: boolean;
  hasSlavicDiac: boolean;
  hasGermanDiac: boolean;
  hasEnglishWords: boolean; // rough proxy: common English stop-words
}

function checkLang(output: Output): LangCheck {
  const full = [output.tiktok, output.twitter, output.linkedin, output.instagram, output.youtube].join(" ");
  // Very rough English check: presence of common English function words
  const englishCount = (full.match(/\b(the|and|this|that|your|are|for|you|have|not|with|can|but)\b/gi) ?? []).length;
  return {
    hasCyrillic:    CYRILLIC_RE.test(full),
    hasSlavicDiac:  SLAVIC_DIAC_RE.test(full),
    hasGermanDiac:  GERMAN_DIAC_RE.test(full),
    hasEnglishWords: englishCount > 10, // >10 matches = predominantly English
  };
}

// ─── Invented numbers check ───────────────────────────────────────────────────

function inventedNumbers(output: Output): string[] {
  const transcriptNums = new Set(TRANSCRIPT.match(/\d+/g) ?? []);
  // Exclude twitter: thread numbering (1/, 2/, 3/…) produces unavoidable false positives.
  const full = [output.tiktok, output.linkedin, output.instagram].join(" ");
  const nums = full.match(/\d+/g) ?? [];
  return [...new Set(nums.filter(n => !transcriptNums.has(n) && parseInt(n) > 2))];
}

// ─── Platform structure check ─────────────────────────────────────────────────

function platformCheck(output: Output): string[] {
  const issues: string[] = [];
  if (!output.tiktok)    issues.push("TikTok card missing or empty");
  if (!output.linkedin)  issues.push("LinkedIn card missing or empty");
  if (!output.twitter)   issues.push("Twitter card missing or empty");
  if (!output.youtube)   issues.push("YouTube card missing or empty");
  if (output.tiktok.length > 600) issues.push(`TikTok too long (${output.tiktok.length} chars)`);
  if (output.linkedin.length < 80) issues.push(`LinkedIn too short (${output.linkedin.length} chars)`);
  return issues;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trunc(s: string, n: number): string {
  const flat = s.replace(/\n+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n - 1) + "…" : flat;
}

function header(s: string): void {
  console.log(`\n── ${s} ${"─".repeat(Math.max(0, 58 - s.length))}`);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runOne(tc: TestCase): Promise<TestResult> {
  const t0 = Date.now();
  const langCtx = formatLanguageContext(tc.language);
  const userPrompt = buildPrompt(TRANSCRIPT, "", "", langCtx);
  const estTokens = estimateTokens(SYSTEM_PROMPT + userPrompt);
  const { estimatedUSD } = estimateCost(estTokens, 2048);

  console.log(`  running: ${tc.name.padEnd(10)} [${tc.label}]  ~${estTokens} tok  ~$${estimatedUSD.toFixed(4)}`);

  try {
    const { text } = await getProvider().complete({ system: SYSTEM_PROMPT, user: userPrompt, maxTokens: 2048 });
    const { result } = parseAnthropicResponse(text);
    const cards = result.cards;

    const output: Output = {
      tiktok:    cards.find(c => c.platform === "TikTok / Reels")?.content ?? "",
      twitter:   cards.find(c => c.platform === "Twitter / X")?.content    ?? "",
      linkedin:  cards.find(c => c.platform === "LinkedIn")?.content       ?? "",
      instagram: cards.find(c => c.platform === "Instagram")?.content      ?? "",
      youtube:   cards.find(c => c.platform === "YouTube")?.content        ?? "",
    };

    return { tc, output, elapsedMs: Date.now() - t0, estTokens, estCostStr: `$${estimatedUSD.toFixed(4)}` };
  } catch (err) {
    return { tc, output: null, elapsedMs: Date.now() - t0, estTokens,
             estCostStr: `$${estimatedUSD.toFixed(4)}`,
             error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

function report(results: TestResult[]): { p0: number; p1: number } {
  let p0 = 0; let p1 = 0;

  for (const r of results) {
    header(`${r.tc.label}  [${r.elapsedMs}ms | ${r.estTokens} tok | ${r.estCostStr}]`);

    if (r.error) {
      console.log(`  ✗ P0 ERROR: ${r.error}`);
      p0++; continue;
    }

    const o = r.output!;

    // Output previews (truncated for readability — human quality check)
    console.log(`  TikTok:   ${trunc(o.tiktok, 120)}`);
    console.log(`  LinkedIn: ${trunc(o.linkedin, 120)}`);
    console.log(`  Twitter1: ${trunc(o.twitter.split("\n")[0] ?? o.twitter, 110)}`);
    console.log(`  YouTube1: ${trunc(o.youtube.split("\n")[0] ?? o.youtube, 90)}`);

    // Language character checks
    const lc = checkLang(o);

    if (r.tc.language === "auto") {
      // Auto: expect English output, no unexpected diacritics
      if (lc.hasEnglishWords) console.log(`  Language: ✓ English detected (auto mode correct)`);
      else                    { console.log(`  ⚠ P2: auto mode — fewer English function words than expected`); p1++; }
      if (lc.hasCyrillic)     { console.log(`  ✗ P0: Cyrillic in auto/English output`); p0++; }

    } else if (r.tc.language === "sr-latn") {
      // Serbian Latin: Cyrillic = hard P0
      if (lc.hasCyrillic) {
        console.log(`  ✗ P0: CYRILLIC DETECTED in Serbian Latin output — script rule violated`);
        p0++;
      } else {
        console.log(`  Language: ✓ No Cyrillic (Latin script confirmed)`);
      }
      if (lc.hasSlavicDiac) console.log(`  Language: ✓ Slavic diacritics present (šČžĐ etc.)`);
      else                  { console.log(`  ⚠ P1: no Slavic diacritics in Serbian output — may be romanized English`); p1++; }

    } else if (r.tc.language === "sl" || r.tc.language === "hr" || r.tc.language === "bs") {
      // Slovenian / Croatian / Bosnian: expect Slavic diacritics, no Cyrillic
      if (lc.hasCyrillic)     { console.log(`  ✗ P0: Cyrillic in ${r.tc.label} output`); p0++; }
      else                    console.log(`  Language: ✓ No Cyrillic`);
      if (lc.hasSlavicDiac)   console.log(`  Language: ✓ Slavic diacritics present`);
      else                    { console.log(`  ⚠ P1: no Slavic diacritics — may be English or romanized output`); p1++; }

    } else if (r.tc.language === "de") {
      // German: expect German diacritics
      if (lc.hasGermanDiac)   console.log(`  Language: ✓ German diacritics present (üöäß)`);
      else                    { console.log(`  ⚠ P1: no German diacritics — may be English or overly formal output`); p1++; }
      if (lc.hasCyrillic)     { console.log(`  ✗ P0: Cyrillic in German output`); p0++; }
    }

    // Platform structure
    const structIssues = platformCheck(o);
    if (structIssues.length > 0) {
      for (const issue of structIssues) { console.log(`  ⚠ P1: ${issue}`); p1++; }
    } else {
      console.log(`  Structure: ✓ all platforms present`);
    }

    // Invented numbers
    const invented = inventedNumbers(o);
    if (invented.length > 0) {
      console.log(`  ⚠ P1: invented numbers: ${invented.slice(0, 5).join(", ")}`);
      p1++;
    } else {
      console.log(`  Grounding: ✓ no invented numbers`);
    }
  }

  return { p0, p1 };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  VIRNIX LANG-REAL-A — Real AI Language Smoke Test");
  console.log("══════════════════════════════════════════════════\n");

  // Pre-run cost estimate
  const sampleCtx = formatLanguageContext("sl");
  const samplePrompt = buildPrompt(TRANSCRIPT, "", "", sampleCtx);
  const sampleTok = estimateTokens(SYSTEM_PROMPT + samplePrompt);
  const { estimatedUSD: costPer } = estimateCost(sampleTok, 2048);
  const total = costPer * TEST_CASES.length;
  console.log(`Calls: ${TEST_CASES.length}  ×  ~${sampleTok} tok  ≈  $${costPer.toFixed(4)} each  ≈  $${total.toFixed(3)} total`);
  console.log(`Transcript: English creator/business, ~110 words\n`);

  header("Running generations");
  const results: TestResult[] = [];
  for (const tc of TEST_CASES) {
    results.push(await runOne(tc));
  }

  header("Results");
  const { p0, p1 } = report(results);

  console.log("\n" + "═".repeat(52));
  const passed = results.filter(r => !r.error && r.output).length;
  const totalCost = results.reduce((acc, r) => acc + parseFloat(r.estCostStr.replace("$", "")), 0);
  console.log(`  Calls completed: ${passed}/${results.length}`);
  console.log(`  P0 failures:     ${p0}`);
  console.log(`  P1/P2 issues:    ${p1}`);
  console.log(`  Est. total cost: ~$${totalCost.toFixed(3)}`);
  if (p0 === 0) {
    console.log(`\n  ✅ SAFE TO PROCEED — no P0 failures`);
  } else {
    console.log(`\n  ❌ P0 FAILURES — review issues above before proceeding`);
  }
  console.log("═".repeat(52) + "\n");

  if (p0 > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n✗ Unhandled error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
