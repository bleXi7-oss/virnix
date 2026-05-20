// Virnix QA — Creator Energy Selection static audit.
//
// Checks:
//   1. Balanced / empty selection returns exact empty string (no-op)
//   2. Single-energy formatEnergyContext — label, directive, grounding rule, priority
//   3. Multi-energy combinations — all labels, all directives, one grounding rule
//   4. Server-side allowlist — isValidEnergyId covers all valid IDs, rejects invalid
//   5. Prompt injection position — energy appears in GENERATION PROFILE, before platform sections
//   6. Balanced mode leaves prompt unchanged (no "Creator energy:" injection)
//   7. Directive specificity — no vague openers, no platform-locked language
//   8. Variation angle vs. energy priority — explicit precedence instruction present
//
// No API calls. Zero cost. Safe to run at any time.
// Run: npx.cmd tsx scripts/qa/creator-energy-audit.ts

import { formatEnergyContext } from "../../app/lib/creator-energy/prompt-context";
import { CREATOR_ENERGIES, isValidEnergyId } from "../../app/lib/creator-energy/options";
import type { CreatorEnergyId } from "../../app/lib/creator-energy/types";
import { buildPrompt } from "../../app/lib/prompts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function header(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}
function pass(msg: string): void { console.log(`  ✓ ${msg}`); }
function fail(msg: string): void { console.log(`  ✗ ${msg}`); failCount++; }
function warn(msg: string): void { console.log(`  ⚠ ${msg}`); warnCount++; }
function info(msg: string): void { console.log(`    ${msg}`); }

let failCount = 0;
let warnCount = 0;

function assertPass(cond: boolean, ok: string, bad: string): void {
  if (cond) pass(ok); else fail(bad);
}
function assertWarn(cond: boolean, ok: string, bad: string): void {
  if (cond) pass(ok); else warn(bad);
}

// ─── Sample transcripts ───────────────────────────────────────────────────────
// Three representative types to verify cross-domain injection.

const CREATOR_TRANSCRIPT = `I was wrong about content growth for years. I thought posting more was the answer.
200 accounts, 18 months, 10k to 500k followers. 73% reduced posting frequency at month six. Reach went up.
The signal that actually matters: save rate. When someone saves your post, the algorithm treats it as high-value.
I discovered this by accident — posted something rough and half-finished, got 40% more saves than anything polished.
Specificity beats polish. Raw and useful beats beautiful and vague. Every single time.`;

const SCIENCE_TRANSCRIPT = `Mitochondria are often called the powerhouse of the cell, but that framing misses the real story.
What they actually do is negotiate energy trade-offs under stress. When oxygen drops, they switch metabolic pathways.
Brain mitochondria operate differently from muscle mitochondria — they prioritize stability over speed.
This is why cognitive fatigue sets in before physical fatigue. The cell is actively protecting neural function.
The mechanism: ATP synthase efficiency drops in a graded, reversible way as a protective response to low oxygen.`;

const PHILOSOPHY_TRANSCRIPT = `The question of meaning is not about finding something external that gives your life worth.
It is about becoming someone whose life generates worth from the inside.
Nietzsche called this the will to power — not domination, but the capacity to create your own values.
Most of us have inherited values we never questioned. We live by rules we never chose.
The examined life doesn't mean knowing all the answers. It means noticing which questions you're afraid to ask.`;

const ALL_IDS = CREATOR_ENERGIES.map((e) => e.id) as CreatorEnergyId[];

// ─── 1. Balanced / empty mode ─────────────────────────────────────────────────

header("1. Balanced / Empty Mode");

const emptyResult = formatEnergyContext([]);
assertPass(
  emptyResult === "",
  "formatEnergyContext([]) returns exact empty string",
  "formatEnergyContext([]) is non-empty — BREAKS balanced mode (no-op contract violated)"
);
info("Balanced mode: energyContext = \"\" → prompt is byte-for-byte identical to pre-CE-A");

// ─── 2. Single energy — label, directive, grounding, priority ─────────────────

header("2. Single-Energy Contexts");

for (const energy of CREATOR_ENERGIES) {
  const ctx = formatEnergyContext([energy.id]);

  assertPass(
    ctx.includes(`Creator energy: ${energy.label}`),
    `[${energy.id}] correct label line`,
    `[${energy.id}] MISSING label "Creator energy: ${energy.label}"`
  );
  assertPass(
    ctx.includes(energy.promptDirective),
    `[${energy.id}] prompt directive present`,
    `[${energy.id}] MISSING prompt directive — model will not receive steering instruction`
  );
  assertPass(
    ctx.includes("Grounding rule:"),
    `[${energy.id}] grounding rule present`,
    `[${energy.id}] MISSING grounding rule — hallucination risk`
  );
  assertWarn(
    ctx.includes("Priority:") || ctx.toLowerCase().includes("primary creative direction"),
    `[${energy.id}] priority/precedence instruction present`,
    `[${energy.id}] no priority instruction — variation angle may override energy choice (P1)`
  );
}

// ─── 3. Multi-energy combinations ────────────────────────────────────────────

header("3. Multi-Energy Combinations");

const multiCombos: [CreatorEnergyId[], string][] = [
  [["tactical", "analytical"], "Tactical + Analytical"],
  [["contrarian", "reflective"], "Contrarian + Reflective"],
  [ALL_IDS, "All 6 energies"],
];

for (const [ids, name] of multiCombos) {
  const ctx = formatEnergyContext(ids);
  const matched = CREATOR_ENERGIES.filter((e) => ids.includes(e.id));

  assertPass(
    matched.every((e) => ctx.includes(e.label)),
    `[${name}] all labels present`,
    `[${name}] MISSING some energy labels`
  );
  assertPass(
    matched.every((e) => ctx.includes(e.promptDirective)),
    `[${name}] all directives present`,
    `[${name}] MISSING some energy directives`
  );
  const groundingCount = (ctx.match(/Grounding rule:/g) ?? []).length;
  assertPass(
    groundingCount === 1,
    `[${name}] exactly 1 grounding rule (not duplicated per energy)`,
    `[${name}] grounding rule count: ${groundingCount} (expected exactly 1)`
  );
}

// ─── 4. Server-side allowlist validation ─────────────────────────────────────

header("4. isValidEnergyId Allowlist");

const VALID_IDS = CREATOR_ENERGIES.map((e) => e.id);
const INVALID_INPUTS: unknown[] = [
  "unknown", "", "Tactical", "TACTICAL", null, 0, undefined,
  "harsh_truth", "harsh truth", "HARSH-TRUTH", "relatable2",
];

for (const id of VALID_IDS) {
  assertPass(
    isValidEnergyId(id),
    `isValidEnergyId("${id}") → true`,
    `isValidEnergyId("${id}") → false — VALID ID NOT RECOGNIZED BY ALLOWLIST`
  );
}
for (const bad of INVALID_INPUTS) {
  assertPass(
    !isValidEnergyId(bad),
    `isValidEnergyId(${JSON.stringify(bad)}) → false (correctly rejected)`,
    `isValidEnergyId(${JSON.stringify(bad)}) → true — INVALID INPUT ACCEPTED (injection risk)`
  );
}

// ─── 5. Prompt injection position ────────────────────────────────────────────

header("5. Prompt Injection Position & Structure");

const analyticalCtx = formatEnergyContext(["analytical"]);

// Creator/business transcript
const promptCreator = buildPrompt(CREATOR_TRANSCRIPT, "", analyticalCtx);
const profilePos = promptCreator.indexOf("━━━ GENERATION PROFILE ━━━");
const energyPos   = promptCreator.indexOf("Creator energy:");
const platformPos = promptCreator.indexOf("Platform requirements:");

assertPass(
  promptCreator.includes("Creator energy: Analytical"),
  "Analytical energy label appears in creator/business prompt",
  "energy label MISSING from rendered prompt"
);
assertPass(
  profilePos !== -1 && energyPos > profilePos,
  "energy context is inside GENERATION PROFILE block",
  "energy context appears BEFORE GENERATION PROFILE header — wrong position"
);
assertPass(
  platformPos !== -1 && energyPos < platformPos,
  "energy context appears BEFORE platform requirements",
  "energy context appears AFTER platform requirements — model sees energy too late"
);

// Science transcript
const promptScience = buildPrompt(SCIENCE_TRANSCRIPT, "", formatEnergyContext(["analytical"]));
assertPass(
  promptScience.includes("Creator energy: Analytical"),
  "Analytical energy injects correctly into science transcript prompt",
  "energy injection broken for science transcript"
);

// Philosophy transcript
const promptPhilosophy = buildPrompt(PHILOSOPHY_TRANSCRIPT, "", formatEnergyContext(["reflective"]));
assertPass(
  promptPhilosophy.includes("Creator energy: Reflective"),
  "Reflective energy injects correctly into philosophy transcript prompt",
  "energy injection broken for philosophy transcript"
);

// ─── 6. Balanced mode leaves prompt unchanged ─────────────────────────────────

header("6. Balanced Mode Prompt Integrity");

const promptBalanced = buildPrompt(CREATOR_TRANSCRIPT, "", "");
assertPass(
  !promptBalanced.includes("Creator energy:"),
  "balanced mode prompt has NO energy injection",
  "balanced mode prompt UNEXPECTEDLY contains energy injection — no-op contract broken"
);
assertPass(
  promptBalanced.includes("Platform requirements:"),
  "balanced mode prompt still has all platform sections",
  "balanced mode prompt is missing platform sections — structural regression"
);
assertPass(
  promptBalanced.includes("TikTok / Reels"),
  "balanced mode prompt includes TikTok section",
  "TikTok section missing from balanced prompt"
);

// ─── 7. Directive specificity analysis ───────────────────────────────────────

header("7. Directive Specificity");

const VAGUE_STARTERS = ["good", "nice", "great", "better", "more", "improve", "make it"];
const vagueDirectives = CREATOR_ENERGIES.filter((e) =>
  VAGUE_STARTERS.some((w) => e.promptDirective.toLowerCase().startsWith(w))
);
assertPass(
  vagueDirectives.length === 0,
  "No directives start with vague improvement words",
  `${vagueDirectives.length} directive(s) start with vague words — may produce generic output`
);

const SHORT_THRESHOLD = 60;
const shortDirectives = CREATOR_ENERGIES.filter((e) => e.promptDirective.length < SHORT_THRESHOLD);
assertPass(
  shortDirectives.length === 0,
  `All directives ≥ ${SHORT_THRESHOLD} chars (sufficiently specific)`,
  `${shortDirectives.length} directive(s) under ${SHORT_THRESHOLD} chars — may not steer model effectively`
);

const platformLocked = CREATOR_ENERGIES.filter((e) =>
  /\b(tiktok|instagram|twitter|linkedin|youtube)\b/i.test(e.promptDirective)
);
assertPass(
  platformLocked.length === 0,
  "No directives mention a specific platform (cross-platform steering confirmed)",
  `${platformLocked.length} directive(s) are platform-specific — energy steering would be limited`
);

// ─── 8. Variation angle vs. energy priority ───────────────────────────────────

header("8. Variation Angle vs. Creator Energy Priority");

// When a creator selects an energy, the prompt contains both the random variation angle
// (curiosity/controversy/etc) and the creator energy directives.
// The instruction "Apply this angle to all 5 platforms" is ambiguous about which angle.
// A priority instruction in the energy context resolves this ambiguity.

const contrarianCtx = formatEnergyContext(["contrarian"]);
const hasPriority =
  contrarianCtx.includes("Priority:") ||
  contrarianCtx.toLowerCase().includes("primary creative direction") ||
  contrarianCtx.toLowerCase().includes("take priority") ||
  contrarianCtx.toLowerCase().includes("precedence");

assertPass(
  hasPriority,
  "Energy context has explicit priority instruction (resolves variation angle ambiguity)",
  "Energy context has NO priority instruction — 'Apply this angle' may cause variation angle to override creator energy (P1)"
);

info("Without priority instruction: model may apply random variation angle instead of selected energy.");
info("With priority instruction: creator energy takes precedence over automatic variation selection.");

// ─── 9. Transcript domain safety ─────────────────────────────────────────────

header("9. Domain Safety — Grounding Rule Adequacy");

// Verify the grounding rule uses language that prevents hallucination
// on domain-mismatched transcript types (science + harsh-truth, philosophy + tactical, etc.)
const harshCtx = formatEnergyContext(["harsh-truth"]);
const groundingText = harshCtx.split("Grounding rule:")[1] ?? "";

assertPass(
  groundingText.includes("does not fit") || groundingText.includes("closest grounded"),
  "Grounding rule explicitly handles mismatched energy/transcript scenarios",
  "Grounding rule does not address mismatch — hallucination risk on incompatible transcripts"
);
assertPass(
  groundingText.includes("never invent"),
  "Grounding rule explicitly prohibits invented facts/emotions",
  "Grounding rule does not explicitly prohibit invention — hallucination risk"
);

// Check that grounding rule doesn't condition on energy type (applies to all)
for (const energy of CREATOR_ENERGIES) {
  const ctx = formatEnergyContext([energy.id]);
  const hasFacts = ctx.includes("never invent");
  assertPass(
    hasFacts,
    `[${energy.id}] grounding rule prohibits invention`,
    `[${energy.id}] grounding rule missing fabrication prohibition`
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════\n");
console.log("CREATOR ENERGY AUDIT COMPLETE");
console.log(`  Energies defined:          ${CREATOR_ENERGIES.length}`);
console.log(`  Single-energy modes tested: ${CREATOR_ENERGIES.length}`);
console.log(`  Multi-energy combos tested: ${multiCombos.length}`);
console.log(`  Allowlist: ${VALID_IDS.length} valid IDs, ${INVALID_INPUTS.length} invalid inputs checked`);
console.log(`  Transcript types tested:   3 (creator/business, science, philosophy)`);
console.log(`  Test failures:             ${failCount}`);
console.log(`  Warnings:                  ${warnCount}`);
console.log(`  Status: ${failCount === 0 ? "✓ ALL CHECKS PASS" : `✗ ${failCount} FAILURE(S) — SEE ABOVE`}\n`);

if (failCount > 0) process.exit(1);
