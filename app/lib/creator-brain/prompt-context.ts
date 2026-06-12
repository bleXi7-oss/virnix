import type { CreatorBrainProfile, VoiceProfile } from "./types";

// Hard caps on what each field may contribute to the prompt (chars, not DB storage limits).
// Total budget ≈ 1,800 chars ≈ ~450 tokens — well within Claude Sonnet's context.
const PROMPT_CAPS = {
  displayName: 60,
  niche: 120,
  targetAudience: 150,
  toneDescription: 200,
  styleNotes: 200,
  brandNotes: 300,
  forbiddenPhrases: 200,
  voiceProfileJson: 400,
} as const;

function cap(s: string, limit: number): string {
  return s.length > limit ? s.slice(0, limit) + "…" : s;
}

// Parses voice_profile_json from DB JSONB. Returns null for any invalid shape — never throws.
export function parseVoiceProfile(raw: unknown): VoiceProfile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const knownStringKeys: (keyof VoiceProfile)[] = [
    "sentenceRhythm", "openingStyle", "closingStyle", "vocabularyLevel",
    "emotionalTone", "humorLevel", "directnessLevel", "formattingHabits",
  ];
  const hasContent = knownStringKeys.some(
    (k) => typeof obj[k] === "string" && (obj[k] as string).length > 0
  );
  if (!hasContent) return null;
  return obj as VoiceProfile;
}

function formatVoiceProfileSection(vp: VoiceProfile): string {
  const lines: string[] = [];
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

function hasUsefulContent(profile: CreatorBrainProfile): boolean {
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

// Returns "" when no profile or empty profile — prompt is completely unchanged.
// Does NOT inject writing_examples (Phase A: stored but not exposed at runtime).
// voiceProfileJson is injected when present (AI-generated structured analysis).
export function formatCreatorBrainContext(profile: CreatorBrainProfile | null | undefined): string {
  if (!profile || !hasUsefulContent(profile)) return "";

  const lines: string[] = ["Creator voice guide (shapes style and tone across all outputs):"];

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
