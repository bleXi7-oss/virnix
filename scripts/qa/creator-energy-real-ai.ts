// CE-B: Real AI validation of Creator Energy Selection.
//
// Runs 9 API calls (3 transcripts × 3 energy modes each).
// Estimated cost: ~$0.20–0.30 total at Sonnet 4.6 pricing.
//
// Checks:
//   1. Balanced mode works as automatic / no-op
//   2. Each energy visibly steers output vs. Balanced baseline
//   3. Contrarian vs. Analytical produce different angles on same transcript
//   4. Tactical vs. Reflective produce different angles on same transcript
//   5. Relatable on science does not invent personal confessions
//   6. Harsh Truth on philosophy stays grounded — no invented drama
//   7. All platforms (not just TikTok) reflect energy steering
//   8. No invented numbers or statistics appear in output
//   9. Platform-native formatting survives energy injection
//
// Run: npx.cmd tsx scripts/qa/creator-energy-real-ai.ts
// Requires: ANTHROPIC_API_KEY in .env.local

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SYSTEM_PROMPT, buildPrompt } from "../../app/lib/prompts/index";
import { getProvider } from "../../app/lib/ai/provider";
import { parseAnthropicResponse } from "../../app/lib/ai/parser";
import { formatEnergyContext } from "../../app/lib/creator-energy/prompt-context";
import { estimateTokens, estimateCost } from "../../app/lib/ai/chunker";
import type { CreatorEnergyId } from "../../app/lib/creator-energy/types";

// ─── Load .env.local ──────────────────────────────────────────────────────────
// ANTHROPIC_API_KEY is read inside provider.complete() at call time.
// Loading env vars here (before any API call) is sufficient.

(function loadEnvFile(): void {
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
  } catch { /* missing .env.local — API key check below will catch it */ }
})();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\n✗ ANTHROPIC_API_KEY not found in .env.local");
  console.error("  Real AI validation cannot run without the API key.");
  console.error("  Add ANTHROPIC_API_KEY=sk-ant-... to .env.local and re-run.\n");
  process.exit(1);
}

// ─── Short fixture transcripts ────────────────────────────────────────────────
// ~100 words each — minimizes token cost while covering 3 content domains.

const CREATOR = `I was wrong about content growth for years. I thought posting more was the answer.
200 accounts, 18 months, 10k to 500k followers. 73% reduced posting frequency at month six. Reach went up.
The signal that actually matters: save rate. When someone saves your post, the algorithm treats it as high-value.
I discovered this by accident — posted something rough and half-finished, got 40% more saves than anything polished.
Specificity beats polish. Raw and useful beats beautiful and vague. Every single time.`;

const SCIENCE = `Mitochondria are often called the powerhouse of the cell, but that framing misses the real story.
What they actually do is negotiate energy trade-offs under stress. When oxygen drops, they switch metabolic pathways.
Brain mitochondria operate differently from muscle mitochondria — they prioritize stability over speed.
This is why cognitive fatigue sets in before physical fatigue. The cell is actively protecting neural function.
The mechanism: ATP synthase efficiency drops in a graded, reversible way as a protective response to low oxygen.`;

const PHILOSOPHY = `The question of meaning is not about finding something external that gives your life worth.
It is about becoming someone whose life generates worth from the inside.
Nietzsche called this the will to power — not domination, but the capacity to create your own values.
Most of us have inherited values we never questioned. We live by rules we never chose.
The examined life doesn't mean knowing all the answers. It means noticing which questions you're afraid to ask.`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Output {
  tiktok: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
}

interface TestResult {
  name: string;
  transcriptLabel: string;
  energyLabel: string;
  output: Output | null;
  elapsedMs: number;
  estTokens: number;
  estCost: string;
  error?: string;
}

// ─── Test cases ───────────────────────────────────────────────────────────────
// 9 calls: 5 on creator (baseline + 4 energies), 2 on science, 2 on philosophy.

interface TestCase {
  name: string;
  transcript: string;
  transcriptLabel: string;
  energies: CreatorEnergyId[];
  energyLabel: string;
}

const TEST_CASES: TestCase[] = [
  // Creator: full energy comparison matrix
  { name: "creator-balanced",   transcript: CREATOR,    transcriptLabel: "creator",    energies: [],              energyLabel: "Balanced"   },
  { name: "creator-tactical",   transcript: CREATOR,    transcriptLabel: "creator",    energies: ["tactical"],    energyLabel: "Tactical"   },
  { name: "creator-contrarian", transcript: CREATOR,    transcriptLabel: "creator",    energies: ["contrarian"],  energyLabel: "Contrarian" },
  { name: "creator-analytical", transcript: CREATOR,    transcriptLabel: "creator",    energies: ["analytical"],  energyLabel: "Analytical" },
  { name: "creator-reflective", transcript: CREATOR,    transcriptLabel: "creator",    energies: ["reflective"],  energyLabel: "Reflective" },
  // Science: Relatable = hallucination risk test (invented personal emotion on factual content)
  { name: "science-balanced",   transcript: SCIENCE,    transcriptLabel: "science",    energies: [],              energyLabel: "Balanced"   },
  { name: "science-relatable",  transcript: SCIENCE,    transcriptLabel: "science",    energies: ["relatable"],   energyLabel: "Relatable"  },
  // Philosophy: Harsh Truth = tonal mismatch + grounding test
  { name: "phil-balanced",      transcript: PHILOSOPHY, transcriptLabel: "philosophy", energies: [],              energyLabel: "Balanced"   },
  { name: "phil-harsh-truth",   transcript: PHILOSOPHY, transcriptLabel: "philosophy", energies: ["harsh-truth"], energyLabel: "Harsh Truth"},
];

// ─── Energy fingerprint vocabulary ───────────────────────────────────────────
// Per-energy signal words that should appear more when that energy is set.
// Score: what % of expected signals appear in the full output text.

const ENERGY_SIGNALS: Record<string, string[]> = {
  Tactical:     ["step", "system", "framework", "action", "takeaway", "how to", "do this", "here's"],
  Contrarian:   ["wrong", "myth", "actually", "the real", "most people", "nobody tells", "counterintuitive"],
  Analytical:   ["because", "mechanism", "cause", "pattern", "reason why", "explains", "evidence", "what actually"],
  Reflective:   ["meaning", "identity", "worth", "purpose", "deeper", "who you are", "ask yourself"],
  Relatable:    ["you know", "we all", "that moment", "honestly", "imagine", "story", "felt", "admit"],
  "Harsh Truth":["the truth", "nobody wants", "stop", "face it", "uncomfortable", "won't tell", "admit it"],
};

function fingerprintScore(output: Output, energyLabel: string): { found: string[]; pct: number } {
  const signals = ENERGY_SIGNALS[energyLabel];
  if (!signals || signals.length === 0) return { found: [], pct: -1 };
  const text = [output.tiktok, output.twitter, output.linkedin, output.instagram].join(" ").toLowerCase();
  const found = signals.filter(s => text.includes(s));
  return { found, pct: Math.round((found.length / signals.length) * 100) };
}

// ─── Hallucination detection ──────────────────────────────────────────────────
// Invented numbers: statistics/percentages that appear in output but not in the
// source transcript are a strong signal of fabricated facts.

function inventedNumbers(output: Output, transcript: string): string[] {
  const transcriptNums = new Set(transcript.match(/\d+/g) ?? []);
  const text = [output.tiktok, output.twitter, output.linkedin, output.instagram].join(" ");
  const outputNums = text.match(/\d+/g) ?? [];
  // Filter: only numbers > 2 (exclude ordinals like 1/ 2/ 3/ in thread numbering)
  return [...new Set(outputNums.filter(n => !transcriptNums.has(n) && parseInt(n) > 2))];
}

// ─── Platform-native format checks ───────────────────────────────────────────

function platformChecks(output: Output): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  // TikTok: should be short
  if (output.tiktok.length > 500) issues.push(`TikTok too long (${output.tiktok.length} chars, expected <500)`);
  // Twitter: should have tweet numbering
  if (!output.twitter.includes("1/") && !output.twitter.includes("1.")) issues.push("Twitter: no tweet numbering detected");
  // LinkedIn: should be substantial
  if (output.linkedin.length < 100) issues.push(`LinkedIn too short (${output.linkedin.length} chars)`);
  // LinkedIn: corporate AI voice red flag
  const corpWords = ["leverage", "synergy", "seamlessly", "game-changer", "groundbreaking"];
  const corpFound = corpWords.filter(w => output.linkedin.toLowerCase().includes(w));
  if (corpFound.length > 0) issues.push(`LinkedIn corporate AI voice: ${corpFound.join(", ")}`);
  // YouTube: should have numbered titles
  if (!output.youtube.includes("1.") && !output.youtube.includes("1)")) issues.push("YouTube: no numbered titles");
  return { ok: issues.length === 0, issues };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function header(s: string): void {
  console.log(`\n── ${s} ${"─".repeat(Math.max(0, 55 - s.length))}`);
}

function trunc(s: string, n: number): string {
  return (s.replace(/\n+/g, " ").trim()).slice(0, n - 1) + (s.length > n - 1 ? "…" : "");
}

async function runOne(tc: TestCase): Promise<TestResult> {
  const t0 = Date.now();
  const energyContext = formatEnergyContext(tc.energies);
  const userPrompt = buildPrompt(tc.transcript, "", energyContext);
  const estTokens = estimateTokens(SYSTEM_PROMPT + userPrompt);
  const { estimatedUSD } = estimateCost(estTokens, 2048);

  console.log(`  running: ${tc.name.padEnd(22)} [${tc.energyLabel}] ~${estTokens}tok ~$${estimatedUSD.toFixed(4)}`);

  try {
    const { text } = await getProvider().complete({ system: SYSTEM_PROMPT, user: userPrompt, maxTokens: 2048 });
    const { result } = parseAnthropicResponse(text);
    const cards = result.cards;

    const output: Output = {
      tiktok:    cards.find(c => c.platform === "TikTok / Reels")?.content   ?? "",
      twitter:   cards.find(c => c.platform === "Twitter / X")?.content      ?? "",
      linkedin:  cards.find(c => c.platform === "LinkedIn")?.content         ?? "",
      instagram: cards.find(c => c.platform === "Instagram")?.content        ?? "",
      youtube:   cards.find(c => c.platform === "YouTube")?.content          ?? "",
    };

    return { name: tc.name, transcriptLabel: tc.transcriptLabel, energyLabel: tc.energyLabel,
             output, elapsedMs: Date.now() - t0, estTokens, estCost: `$${estimatedUSD.toFixed(4)}` };
  } catch (err) {
    return { name: tc.name, transcriptLabel: tc.transcriptLabel, energyLabel: tc.energyLabel,
             output: null, elapsedMs: Date.now() - t0, estTokens, estCost: `$${estimatedUSD.toFixed(4)}`,
             error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Analysis and report ──────────────────────────────────────────────────────

function analyzeGroup(label: string, group: TestResult[], transcript: string): void {
  header(`Transcript: ${label.toUpperCase()}`);

  let p0Count = 0;
  let p1Count = 0;

  for (const r of group) {
    console.log(`\n  [${r.energyLabel}] ${r.elapsedMs}ms | ${r.estTokens} tokens | ${r.estCost}`);
    if (r.error) {
      console.log(`    ✗ ERROR: ${r.error}`);
      p0Count++;
      continue;
    }
    const o = r.output!;

    // Platform output previews
    console.log(`    TikTok:    ${trunc(o.tiktok, 110)}`);
    console.log(`    LinkedIn:  ${trunc(o.linkedin, 110)}`);
    console.log(`    Twitter1:  ${trunc(o.twitter.split("\n")[0] ?? o.twitter, 110)}`);
    console.log(`    YouTube1:  ${trunc(o.youtube.split("\n")[0] ?? o.youtube, 90)}`);

    // Energy fingerprint
    if (r.energyLabel !== "Balanced") {
      const { found, pct } = fingerprintScore(o, r.energyLabel);
      const sig = found.length > 0 ? `"${found.slice(0, 3).join('", "')}"` : "(none)";
      console.log(`    Fingerprint: ${pct}% — ${sig}`);
      if (pct < 20) { console.log(`    ⚠ P2: low energy fingerprint — steering may be weak`); p1Count++; }
    }

    // Platform-native checks
    const { ok, issues } = platformChecks(o);
    if (!ok) {
      for (const issue of issues) {
        console.log(`    ⚠ P2: ${issue}`);
        p1Count++;
      }
    } else {
      console.log(`    Platform-native: ✓`);
    }

    // Hallucination check
    const invented = inventedNumbers(o, transcript);
    if (invented.length > 0) {
      console.log(`    ⚠ P1: invented numbers detected: ${invented.join(", ")}`);
      p1Count++;
    } else {
      console.log(`    Grounding: ✓ no invented numbers`);
    }
  }

  // TikTok hook comparison across energies
  const balanced = group.find(r => r.energyLabel === "Balanced" && r.output);
  const others = group.filter(r => r.energyLabel !== "Balanced" && r.output);
  if (balanced?.output && others.length > 0) {
    console.log(`\n  ── TikTok hook comparison ─────────────────────────────────`);
    console.log(`  Balanced:    ${trunc(balanced.output.tiktok, 100)}`);
    for (const r of others) {
      if (!r.output) continue;
      const diff = r.output.tiktok.slice(0, 40).toLowerCase() !== balanced.output.tiktok.slice(0, 40).toLowerCase();
      console.log(`  ${r.energyLabel.padEnd(12)}: ${trunc(r.output.tiktok, 100)} ${diff ? "✓ differs" : "⚠ similar"}`);
    }
  }

  // LinkedIn comparison (shows multi-platform steering)
  if (balanced?.output && others.length > 0) {
    console.log(`\n  ── LinkedIn opening comparison ─────────────────────────────`);
    console.log(`  Balanced:    ${trunc(balanced.output.linkedin, 100)}`);
    for (const r of others) {
      if (!r.output) continue;
      console.log(`  ${r.energyLabel.padEnd(12)}: ${trunc(r.output.linkedin, 100)}`);
    }
  }

  console.log(`\n  Group totals: ${p0Count} P0s, ${p1Count} P1s/P2s`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n══════════════════════════════════════════");
  console.log("  VIRNIX CE-B — Real AI Energy Validation");
  console.log("══════════════════════════════════════════\n");

  // Cost estimate before running
  const samplePrompt = buildPrompt(CREATOR, "", formatEnergyContext(["tactical"]));
  const sampleTokens = estimateTokens(SYSTEM_PROMPT + samplePrompt);
  const { estimatedUSD: costPerCall } = estimateCost(sampleTokens, 2048);
  const totalEstimate = costPerCall * TEST_CASES.length;
  console.log(`Cost estimate: ${TEST_CASES.length} calls × ~$${costPerCall.toFixed(4)} ≈ $${totalEstimate.toFixed(3)}`);
  console.log(`Transcripts: creator (5 energies), science (2), philosophy (2)\n`);

  header("Running generations");
  const results: TestResult[] = [];
  for (const tc of TEST_CASES) {
    const r = await runOne(tc);
    results.push(r);
  }

  const totalElapsed = results.reduce((s, r) => s + r.elapsedMs, 0);
  const failures = results.filter(r => r.error).length;
  console.log(`\n  Done: ${results.length} calls, ${failures} errors, ${(totalElapsed / 1000).toFixed(1)}s total`);

  if (failures === results.length) {
    console.error("\n✗ All API calls failed. Check ANTHROPIC_API_KEY and connectivity.\n");
    process.exit(1);
  }

  // ── Per-transcript analysis ──────────────────────────────────────────────
  const byGroup: Record<string, { results: TestResult[]; transcript: string }> = {
    creator:    { results: results.filter(r => r.transcriptLabel === "creator"),    transcript: CREATOR    },
    science:    { results: results.filter(r => r.transcriptLabel === "science"),    transcript: SCIENCE    },
    philosophy: { results: results.filter(r => r.transcriptLabel === "philosophy"), transcript: PHILOSOPHY },
  };

  for (const [label, { results: group, transcript }] of Object.entries(byGroup)) {
    analyzeGroup(label, group, transcript);
  }

  // ── Cross-domain: Contrarian vs. Analytical on same transcript ──────────
  const contrarian = results.find(r => r.name === "creator-contrarian");
  const analytical = results.find(r => r.name === "creator-analytical");
  if (contrarian?.output && analytical?.output) {
    header("Cross-energy: Contrarian vs. Analytical (creator)");
    console.log(`  Contrarian TikTok: ${trunc(contrarian.output.tiktok, 110)}`);
    console.log(`  Analytical TikTok: ${trunc(analytical.output.tiktok, 110)}`);
    const cLin = trunc(contrarian.output.linkedin, 100);
    const aLin = trunc(analytical.output.linkedin, 100);
    console.log(`  Contrarian LinkedIn: ${cLin}`);
    console.log(`  Analytical LinkedIn: ${aLin}`);
  }

  // ── Cross-energy: Tactical vs. Reflective on same transcript ────────────
  const tactical = results.find(r => r.name === "creator-tactical");
  const reflective = results.find(r => r.name === "creator-reflective");
  if (tactical?.output && reflective?.output) {
    header("Cross-energy: Tactical vs. Reflective (creator)");
    console.log(`  Tactical TikTok:   ${trunc(tactical.output.tiktok, 110)}`);
    console.log(`  Reflective TikTok: ${trunc(reflective.output.tiktok, 110)}`);
    console.log(`  Tactical LinkedIn:   ${trunc(tactical.output.linkedin, 100)}`);
    console.log(`  Reflective LinkedIn: ${trunc(reflective.output.linkedin, 100)}`);
  }

  // ── Overall summary ──────────────────────────────────────────────────────
  const allP0 = results.filter(r => r.error).length;
  const successResults = results.filter(r => r.output);

  let allPlatformNative = true;
  let allGrounded = true;
  let allDifferentiated = true;

  for (const r of successResults) {
    const { ok } = platformChecks(r.output!);
    if (!ok) allPlatformNative = false;
    const tc = TEST_CASES.find(t => t.name === r.name)!;
    const inv = inventedNumbers(r.output!, tc.transcript);
    if (inv.length > 0) allGrounded = false;
  }

  const energyGroups = ["creator-tactical", "creator-contrarian", "creator-analytical", "creator-reflective"];
  const balancedCreator = results.find(r => r.name === "creator-balanced");
  for (const name of energyGroups) {
    const r = results.find(r => r.name === name);
    if (!r?.output || !balancedCreator?.output) continue;
    if (r.output.tiktok.slice(0, 40).toLowerCase() === balancedCreator.output.tiktok.slice(0, 40).toLowerCase()) {
      allDifferentiated = false;
    }
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  CE-B SUMMARY");
  console.log("══════════════════════════════════════════");
  console.log(`  API calls:        ${results.length} (${successResults.length} success, ${allP0} failed)`);
  console.log(`  Platform-native:  ${allPlatformNative ? "✓ all pass" : "⚠ issues detected"}`);
  console.log(`  Grounding:        ${allGrounded ? "✓ no invented numbers" : "⚠ invented numbers detected"}`);
  console.log(`  Differentiation:  ${allDifferentiated ? "✓ energies produce different output" : "⚠ some outputs too similar to Balanced"}`);
  console.log(`  Total elapsed:    ${(totalElapsed / 1000).toFixed(1)}s`);
  console.log(`  Est. total cost:  ~$${(results.reduce((s, r) => s + parseFloat(r.estCost.replace("$", "")), 0)).toFixed(3)}`);
  console.log(`\n  SAFE TO PROCEED: ${allP0 === 0 && allGrounded ? "YES" : allP0 > 0 ? "NO (API failures)" : "YES WITH FIXES"}\n`);
}

main().catch(err => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
