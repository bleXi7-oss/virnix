// Virnix QA — Static opener pool and prompt architecture audit.
//
// Checks:
//   1. Opener pool size and category balance
//   2. Creator-domain-specific openers (tonal mismatch risk on non-creator content)
//   3. Near-duplicate detection (Levenshtein-free: word-overlap heuristic)
//   4. YouTube title formula vs. rules contradiction
//   5. Story arc unreachable code (Stakes Escalation never mapped)
//   6. Banned generic phrase presence in platform prompts (sanity check)
//
// No API calls. No runtime dependencies. Import-only from app/lib/prompts.
// Run: npx.cmd tsx scripts/qa/opener-audit.ts

import { TIKTOK_OPENING_LINES } from "../../app/lib/prompts/platforms/tiktok";
import { YOUTUBE_TITLE_FORMULAS, YOUTUBE_TITLE_RULES } from "../../app/lib/prompts/platforms/youtube";
import { ANTI_GENERIC_RULES } from "../../app/lib/prompts/psychology";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function header(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}

function pass(msg: string): void { console.log(`  ✓ ${msg}`); }
function fail(msg: string): void { console.log(`  ✗ ${msg}`); }
function warn(msg: string): void { console.log(`  ⚠ ${msg}`); }
function info(msg: string): void { console.log(`    ${msg}`); }

let failCount = 0;
let warnCount = 0;

function assertPass(condition: boolean, pass_msg: string, fail_msg: string): void {
  if (condition) { pass(pass_msg); } else { fail(fail_msg); failCount++; }
}

function assertWarn(condition: boolean, pass_msg: string, warn_msg: string): void {
  if (condition) { pass(pass_msg); } else { warn(warn_msg); warnCount++; }
}

// Common stop words excluded from near-duplicate word-overlap checks.
// Without these, "this", "about", "what" alone would trigger false positives.
const STOP_WORDS = new Set([
  "this", "that", "what", "about", "here", "from", "with", "your", "their",
  "have", "been", "just", "they", "them", "then", "than", "when", "which",
  "will", "were", "into", "does", "most", "some", "every", "more", "only",
  "here", "already", "there", "doing", "wrong", "never", "always",
]);

// Word-overlap near-duplicate check: returns true if two strings share >55% of
// meaningful (non-stop) words of length >4.
function isNearDuplicate(a: string, b: string, threshold = 0.55): boolean {
  const keyWords = (s: string) =>
    new Set(s.toLowerCase().split(/\s+/).filter((w) => w.length > 4 && !STOP_WORDS.has(w)));
  const wordsA = keyWords(a);
  const wordsB = keyWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  const ratio = overlap / Math.min(wordsA.size, wordsB.size);
  return ratio >= threshold;
}

// ─── 1. Opener pool size ─────────────────────────────────────────────────────

header("1. Opener Pool Size");
const openers = [...TIKTOK_OPENING_LINES];
info(`Total openers: ${openers.length}`);
assertPass(openers.length >= 20, `Pool size ${openers.length} ≥ 20 (sufficient variety)`, `Pool size ${openers.length} < 20 — too small`);
assertWarn(openers.length >= 25, `Pool size ${openers.length} ≥ 25 (ideal)`, `Pool size ${openers.length} < 25 — consider expanding further`);

// ─── 2. Creator-domain-specific opener detection ──────────────────────────────

header("2. Creator-Domain-Specific Opener Risk");

// Terms that signal creator-growth / social-media-specific framing.
// These openers only make sense when the transcript is about content creation, algorithms, or creator business.
const CREATOR_DOMAIN_TERMS = [
  "creator", "creators", "followers", "algorithm", "posting", "views",
  "100k", "500k", "reach", "content strategy", "best-performing post",
];

const creatorSpecific: string[] = [];
const universal: string[] = [];

for (const opener of openers) {
  const lower = opener.toLowerCase();
  const matchedTerms = CREATOR_DOMAIN_TERMS.filter((t) => lower.includes(t));
  if (matchedTerms.length > 0) {
    creatorSpecific.push(opener);
  } else {
    universal.push(opener);
  }
}

info(`Universal openers (domain-agnostic):  ${universal.length}/${openers.length}`);
info(`Creator-specific openers (risk):       ${creatorSpecific.length}/${openers.length}`);

assertWarn(
  creatorSpecific.length === 0,
  "No creator-domain-specific openers found",
  `${creatorSpecific.length} opener(s) may cause tonal mismatch on non-creator content:`
);

for (const o of creatorSpecific) {
  info(`  → "${o}"`);
}

const creatorRatio = (creatorSpecific.length / openers.length) * 100;
assertPass(
  creatorRatio < 20,
  `Creator-specific ratio ${creatorRatio.toFixed(0)}% < 20% (acceptable)`,
  `Creator-specific ratio ${creatorRatio.toFixed(0)}% ≥ 20% — too many domain-locked openers (P0 risk)`
);

// ─── 3. Near-duplicate detection ─────────────────────────────────────────────

header("3. Near-Duplicate Opener Detection");

const duplicatePairs: [string, string][] = [];
for (let i = 0; i < openers.length; i++) {
  for (let j = i + 1; j < openers.length; j++) {
    if (isNearDuplicate(openers[i], openers[j])) {
      duplicatePairs.push([openers[i], openers[j]]);
    }
  }
}

assertWarn(
  duplicatePairs.length === 0,
  "No near-duplicate openers detected",
  `${duplicatePairs.length} near-duplicate pair(s) found:`
);

for (const [a, b] of duplicatePairs) {
  info(`  ≈ "${a}"`);
  info(`    "${b}"`);
}

// ─── 4. YouTube title formula vs. rules contradiction ────────────────────────

header("4. YouTube Title Formula vs. Rules Contradiction");

const nobodyFormula = YOUTUBE_TITLE_FORMULAS.some((f) =>
  f.toLowerCase().includes("nobody talks about")
);
const nobodyRule = YOUTUBE_TITLE_RULES.some((r) =>
  r.toLowerCase().includes("nobody talks about")
);

if (nobodyFormula && nobodyRule) {
  fail(`CONTRADICTION: "Nobody Talks About" appears in BOTH YOUTUBE_TITLE_FORMULAS and YOUTUBE_TITLE_RULES — model receives conflicting instructions`);
  failCount++;
} else if (!nobodyFormula && !nobodyRule) {
  pass("'Nobody Talks About' not present in either formulas or rules — OK");
} else {
  pass(`Consistent: appears in ${nobodyFormula ? "formulas" : "rules"} only`);
}

// ─── 5. Story arc dead code check ────────────────────────────────────────────

header("5. Story Arc Coverage (Dead Code Check)");

// Stakes Escalation is at index 5 in STORY_ARC_FRAMEWORKS.
// ANGLE_TO_FRAMEWORK_INDEX maps: curiosity→4, controversy→3, authority→3, vulnerability→2, storytelling→0, urgency→1
// → Index 5 is never referenced.
const USED_INDICES = new Set([0, 1, 2, 3, 4]);
const TOTAL_ARCS = 6; // STORY_ARC_FRAMEWORKS.length

const unusedCount = TOTAL_ARCS - USED_INDICES.size;
assertWarn(
  unusedCount === 0,
  `All ${TOTAL_ARCS} story arc frameworks are reachable`,
  `${unusedCount} story arc framework(s) are defined but never mapped to any angle (dead code) — "Stakes Escalation" at index 5 is unreachable`
);

// ─── 6. Anti-generic rule sanity check ───────────────────────────────────────

header("6. Anti-Generic Rule Quality Check");

// The rules MUST mention the forbidden phrases to prohibit them — checking they APPEAR is correct.
// What we verify here: the rules exist, cover key patterns, and are numerous enough.
const EXPECTED_FORBIDDEN = ["leverage", "synergy", "actionable", "game-changer"];
for (const phrase of EXPECTED_FORBIDDEN) {
  const covered = ANTI_GENERIC_RULES.some((r) => r.toLowerCase().includes(phrase));
  assertPass(covered, `ANTI_GENERIC_RULES explicitly blocks "${phrase}"`, `"${phrase}" not covered by any anti-generic rule`);
}

assertPass(
  ANTI_GENERIC_RULES.length >= 5,
  `${ANTI_GENERIC_RULES.length} anti-generic rules (sufficient coverage)`,
  `Only ${ANTI_GENERIC_RULES.length} anti-generic rules — consider expanding`
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════\n");
console.log(`OPENER POOL AUDIT COMPLETE`);
console.log(`  Openers: ${openers.length}`);
console.log(`  Creator-domain risk: ${creatorSpecific.length}/${openers.length} (${creatorRatio.toFixed(0)}%)`);
console.log(`  Near-duplicates: ${duplicatePairs.length}`);
console.log(`  Test failures: ${failCount}`);
console.log(`  Warnings: ${warnCount}`);
console.log(`  Status: ${failCount === 0 ? "✓ ALL CHECKS PASS" : `✗ ${failCount} FAILURE(S) — SEE ABOVE`}\n`);

if (failCount > 0) process.exit(1);
