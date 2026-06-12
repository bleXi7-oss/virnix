import type { CreatorBrainWritePayload } from "./types";

// DB storage limits (prompt caps are a separate, smaller set in prompt-context.ts).
export const FIELD_LIMITS = {
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
} as const;

// Strips XML-like tags to prevent prompt-injection patterns such as <instructions>.
export function sanitizeText(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: CreatorBrainWritePayload;
}

export function validateCreatorBrainPayload(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const sanitized: CreatorBrainWritePayload = {};

  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["body must be an object"], sanitized };
  }

  const body = raw as Record<string, unknown>;

  const textFields: Array<[keyof CreatorBrainWritePayload & string, number]> = [
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
    (sanitized as Record<string, unknown>)[field] = clean;
  }

  const platforms = body.primaryPlatforms;
  if (platforms !== undefined && platforms !== null) {
    if (!Array.isArray(platforms)) {
      errors.push("primaryPlatforms must be an array");
    } else if (platforms.length > FIELD_LIMITS.primaryPlatformsCount) {
      errors.push(`primaryPlatforms: max ${FIELD_LIMITS.primaryPlatformsCount} items`);
    } else {
      const cleaned: string[] = [];
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
