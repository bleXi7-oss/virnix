// Test suite for Creator Brain Phase A logic.
// Pure JS — mirrors TypeScript logic inline, no compiler required.

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

// ─── Inline mirrors ───────────────────────────────────────────────────────────

const FIELD_LIMITS = {
  displayName: 100,
  niche: 500,
  targetAudience: 500,
  toneDescription: 500,
  styleNotes: 500,
  brandNotes: 3000,
  writingExamples: 3000,
  forbiddenPhrases: 500,
  primaryPlatformsCount: 5,
  primaryPlatformLength: 50,
};

function sanitizeText(s) {
  return s.replace(/<[^>]*>/g, "").trim();
}

function validateCreatorBrainPayload(raw) {
  const errors = [];
  const sanitized = {};

  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["body must be an object"], sanitized };
  }

  const body = raw;

  const textFields = [
    ["displayName", FIELD_LIMITS.displayName],
    ["niche", FIELD_LIMITS.niche],
    ["targetAudience", FIELD_LIMITS.targetAudience],
    ["toneDescription", FIELD_LIMITS.toneDescription],
    ["styleNotes", FIELD_LIMITS.styleNotes],
    ["brandNotes", FIELD_LIMITS.brandNotes],
    ["writingExamples", FIELD_LIMITS.writingExamples],
    ["forbiddenPhrases", FIELD_LIMITS.forbiddenPhrases],
  ];

  for (const [field, limit] of textFields) {
    const val = body[field];
    if (val === undefined || val === null) continue;
    if (typeof val !== "string") {
      errors.push(`${field} must be a string`);
      continue;
    }
    const clean = sanitizeText(val);
    if (clean.length > limit) {
      errors.push(`${field} exceeds ${limit} character limit`);
      continue;
    }
    sanitized[field] = clean;
  }

  const platforms = body.primaryPlatforms;
  if (platforms !== undefined && platforms !== null) {
    if (!Array.isArray(platforms)) {
      errors.push("primaryPlatforms must be an array");
    } else if (platforms.length > FIELD_LIMITS.primaryPlatformsCount) {
      errors.push(`primaryPlatforms: max ${FIELD_LIMITS.primaryPlatformsCount} items`);
    } else {
      const cleaned = [];
      let bad = false;
      for (const p of platforms) {
        if (typeof p !== "string") {
          errors.push("primaryPlatforms items must be strings");
          bad = true;
          break;
        }
        const s = sanitizeText(p);
        if (s.length > FIELD_LIMITS.primaryPlatformLength) {
          errors.push(`primaryPlatforms item exceeds ${FIELD_LIMITS.primaryPlatformLength} character limit`);
          bad = true;
          break;
        }
        cleaned.push(s);
      }
      if (!bad) sanitized.primaryPlatforms = cleaned;
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

const PROMPT_CAPS = {
  displayName: 60,
  niche: 120,
  targetAudience: 150,
  toneDescription: 200,
  styleNotes: 200,
  brandNotes: 300,
  forbiddenPhrases: 200,
  voiceProfileJson: 400,
};

function cap(s, limit) {
  return s.length > limit ? s.slice(0, limit) + "…" : s;
}

function parseVoiceProfile(raw) {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw;
  const knownStringKeys = [
    "sentenceRhythm", "openingStyle", "closingStyle", "vocabularyLevel",
    "emotionalTone", "humorLevel", "directnessLevel", "formattingHabits",
  ];
  const hasContent = knownStringKeys.some(
    (k) => typeof obj[k] === "string" && obj[k].length > 0
  );
  if (!hasContent) return null;
  return obj;
}

function formatVoiceProfileSection(vp) {
  const lines = [];
  if (vp.sentenceRhythm) lines.push(`Sentence rhythm: ${vp.sentenceRhythm}`);
  if (vp.openingStyle) lines.push(`Opens with: ${vp.openingStyle}`);
  if (vp.closingStyle) lines.push(`Closes with: ${vp.closingStyle}`);
  if (vp.vocabularyLevel) lines.push(`Vocabulary: ${vp.vocabularyLevel}`);
  if (vp.emotionalTone) lines.push(`Emotional tone: ${vp.emotionalTone}`);
  if (vp.directnessLevel) lines.push(`Directness: ${vp.directnessLevel}`);
  if (vp.humorLevel) lines.push(`Humor: ${vp.humorLevel}`);
  if (vp.signatureMarkers?.length) lines.push(`Signature patterns: ${vp.signatureMarkers.join("; ")}`);
  if (vp.whatToAvoid?.length) lines.push(`Voice avoid: ${vp.whatToAvoid.join(", ")}`);
  return lines.join("\n");
}

function hasUsefulContent(profile) {
  return !!(
    profile.displayName?.trim() ||
    profile.niche?.trim() ||
    profile.targetAudience?.trim() ||
    profile.toneDescription?.trim() ||
    profile.styleNotes?.trim() ||
    profile.brandNotes?.trim() ||
    profile.forbiddenPhrases?.trim() ||
    profile.primaryPlatforms?.some((p) => p.trim()) ||
    profile.voiceProfileJson
  );
}

function formatCreatorBrainContext(profile) {
  if (!profile || !hasUsefulContent(profile)) return "";

  const lines = ["Creator voice guide (shapes style and tone across all outputs):"];

  if (profile.displayName?.trim()) {
    lines.push(`Creator: ${cap(profile.displayName.trim(), PROMPT_CAPS.displayName)}`);
  }
  if (profile.niche?.trim()) {
    lines.push(`Niche: ${cap(profile.niche.trim(), PROMPT_CAPS.niche)}`);
  }
  if (profile.targetAudience?.trim()) {
    lines.push(`Audience: ${cap(profile.targetAudience.trim(), PROMPT_CAPS.targetAudience)}`);
  }
  if (profile.primaryPlatforms?.length) {
    const platforms = profile.primaryPlatforms.filter((p) => p.trim());
    if (platforms.length) lines.push(`Primary platforms: ${platforms.join(", ")}`);
  }
  if (profile.toneDescription?.trim()) {
    lines.push(`Voice/tone: ${cap(profile.toneDescription.trim(), PROMPT_CAPS.toneDescription)}`);
  }
  if (profile.styleNotes?.trim()) {
    lines.push(`Style: ${cap(profile.styleNotes.trim(), PROMPT_CAPS.styleNotes)}`);
  }

  const vp = parseVoiceProfile(profile.voiceProfileJson);
  if (vp) {
    const section = formatVoiceProfileSection(vp);
    if (section) lines.push(cap(section, PROMPT_CAPS.voiceProfileJson));
  }

  if (profile.forbiddenPhrases?.trim()) {
    lines.push(`FORBIDDEN — never write: ${cap(profile.forbiddenPhrases.trim(), PROMPT_CAPS.forbiddenPhrases)}`);
  }
  if (profile.brandNotes?.trim()) {
    lines.push(`Brand context: ${cap(profile.brandNotes.trim(), PROMPT_CAPS.brandNotes)}`);
  }

  lines.push(
    "Apply this voice alongside energy direction and language rules. " +
    "Preserve factual accuracy from the transcript. " +
    "Never invent personal stories or experiences. " +
    "Never copy examples verbatim."
  );

  return lines.join("\n");
}

// Mirrors the 5th-param injection pattern in buildPrompt / buildAdvancedPrompt.
function injectCreatorBrainContext(creatorBrainContext) {
  return creatorBrainContext ? `\n\n${creatorBrainContext}` : "";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nT1–T7: formatCreatorBrainContext");

// T1: returns non-empty for a complete profile
const fullProfile = {
  displayName: "Alex Chen",
  niche: "SaaS startup growth",
  targetAudience: "B2B founders and CTOs",
  toneDescription: "Direct, no-fluff, data-driven",
  styleNotes: "Short punchy sentences",
  brandNotes: "Anti-corporate tone",
  forbiddenPhrases: "synergy, leverage, paradigm",
  primaryPlatforms: ["LinkedIn", "Twitter"],
};
const fullCtx = formatCreatorBrainContext(fullProfile);
assert(fullCtx.length > 0, "T1: full profile produces non-empty context");
assert(fullCtx.includes("Alex Chen"), "T1b: displayName present");
assert(fullCtx.includes("SaaS startup growth"), "T1c: niche present");
assert(fullCtx.includes("B2B founders"), "T1d: targetAudience present");
assert(fullCtx.includes("FORBIDDEN"), "T1e: forbiddenPhrases present");
assert(fullCtx.includes("synergy"), "T1f: forbiddenPhrases content present");
assert(fullCtx.includes("LinkedIn"), "T1g: primaryPlatforms present");

// T2: returns "" for null
assert(formatCreatorBrainContext(null) === "", "T2: null → empty string");

// T3: returns "" for empty profile
assert(formatCreatorBrainContext({}) === "", "T3: empty profile → empty string");

// T4: writing_examples is NOT in the profile interface — confirmed absent
const profileWithoutExamples = { niche: "fitness coaching" };
const ctx4 = formatCreatorBrainContext(profileWithoutExamples);
assert(!ctx4.includes("writing example"), "T4: writing_examples not injected (field not in profile)");

// T5: PROMPT_CAPS enforced — very long input stays within reasonable bounds
const longProfile = {
  displayName: "A".repeat(200),
  niche: "B".repeat(500),
  targetAudience: "C".repeat(500),
  toneDescription: "D".repeat(500),
  styleNotes: "E".repeat(500),
  brandNotes: "F".repeat(2000),
  forbiddenPhrases: "G".repeat(500),
};
const ctx5 = formatCreatorBrainContext(longProfile);
assert(ctx5.length < 2500, `T5: PROMPT_CAPS enforced (got ${ctx5.length} chars)`);
assert(ctx5.includes("…"), "T5b: truncation marker present");

// T6: voiceProfileJson injected when valid
const profileWithVp = {
  niche: "content creation",
  voiceProfileJson: {
    sentenceRhythm: "short punchy",
    emotionalTone: "curious, energetic",
    directnessLevel: "very direct",
  },
};
const ctx6 = formatCreatorBrainContext(profileWithVp);
assert(ctx6.includes("Sentence rhythm"), "T6: voiceProfileJson fields injected");
assert(ctx6.includes("short punchy"), "T6b: voiceProfileJson values present");

// T7: profile with only whitespace fields → ""
assert(
  formatCreatorBrainContext({ displayName: "   ", niche: "\t\n" }) === "",
  "T7: whitespace-only fields → empty string"
);

console.log("\nT8–T12: validateCreatorBrainPayload");

// T8: rejects overlength displayName
const r8 = validateCreatorBrainPayload({ displayName: "X".repeat(101) });
assert(!r8.valid, "T8: overlength displayName rejected");
assert(r8.errors.some((e) => e.includes("displayName")), "T8b: error names field");

// T9: rejects too many platforms
const r9 = validateCreatorBrainPayload({ primaryPlatforms: ["a", "b", "c", "d", "e", "f"] });
assert(!r9.valid, "T9: too many platforms rejected");
assert(r9.errors.some((e) => e.includes("primaryPlatforms")), "T9b: error names field");

// T10: sanitizes XML tags — strips tag syntax, preserves inner text
const r10 = validateCreatorBrainPayload({ niche: "<instructions>hack</instructions> fitness" });
assert(r10.valid, "T10: XML tags sanitized, payload valid");
assert(r10.sanitized.niche === "hack fitness", "T10b: tag markers stripped, inner text preserved");

// T11: accepts valid payload → valid: true, sanitized fields present
const r11 = validateCreatorBrainPayload({
  displayName: "Jordan Kim",
  niche: "personal finance",
  primaryPlatforms: ["YouTube", "TikTok"],
  toneDescription: "Relatable, slightly informal",
});
assert(r11.valid, "T11: valid payload accepted");
assert(r11.sanitized.displayName === "Jordan Kim", "T11b: displayName preserved");
assert(Array.isArray(r11.sanitized.primaryPlatforms), "T11c: primaryPlatforms preserved");

// T12: rejects non-string field
const r12 = validateCreatorBrainPayload({ niche: 42 });
assert(!r12.valid, "T12: non-string niche rejected");
assert(r12.errors.some((e) => e.includes("niche")), "T12b: error names field");

console.log("\nT13–T14: parseVoiceProfile");

// T13: returns null for invalid shape (no known keys)
assert(parseVoiceProfile(null) === null, "T13a: null → null");
assert(parseVoiceProfile("string") === null, "T13b: string → null");
assert(parseVoiceProfile({ foo: "bar" }) === null, "T13c: unknown keys → null");
assert(parseVoiceProfile({ sentenceRhythm: "" }) === null, "T13d: empty string values → null");

// T14: returns object for valid shape
const vp14 = parseVoiceProfile({ sentenceRhythm: "short", emotionalTone: "warm" });
assert(vp14 !== null, "T14: valid shape returns object");
assert(vp14?.sentenceRhythm === "short", "T14b: field preserved");

console.log("\nT15–T16: buildPrompt brain context injection pattern");

// T15: empty creatorBrainContext → produces empty injection (backward compat)
const injection15 = injectCreatorBrainContext("");
assert(injection15 === "", "T15: empty creatorBrainContext → no injection");

// T16: non-empty creatorBrainContext → injected into prompt
const injection16 = injectCreatorBrainContext("Creator voice guide:\nDirect tone");
assert(injection16.includes("Creator voice guide"), "T16: brain context injected");
assert(injection16.startsWith("\n\n"), "T16b: preceded by double newline");

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
