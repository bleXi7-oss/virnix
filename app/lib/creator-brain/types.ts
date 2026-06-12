// Voice analysis result (AI-generated in Phase C via /analyze endpoint).
// Stored as voice_profile_json in DB; read-only from client PUT perspective.
export interface VoiceProfile {
  sentenceRhythm?: string;
  openingStyle?: string;
  closingStyle?: string;
  vocabularyLevel?: string;
  commonPatterns?: string[];
  emotionalTone?: string;
  humorLevel?: string;
  directnessLevel?: string;
  formattingHabits?: string;
  whatToAvoid?: string[];
  signatureMarkers?: string[];
}

// Profile shape exposed to the generation pipeline.
// writing_examples is stored in DB but NOT used at runtime (Phase A).
// voiceProfileJson is populated by the analyze endpoint (Phase C) only.
export interface CreatorBrainProfile {
  displayName?: string;
  niche?: string;
  targetAudience?: string;
  primaryPlatforms?: string[];
  toneDescription?: string;
  styleNotes?: string;
  brandNotes?: string;
  forbiddenPhrases?: string;
  voiceProfileJson?: VoiceProfile | null;
}

// Raw DB row shape returned by Supabase (snake_case column names).
export interface CreatorBrainRow {
  id: string;
  user_id: string;
  display_name: string | null;
  niche: string | null;
  target_audience: string | null;
  primary_platforms: string[] | null;
  tone_description: string | null;
  writing_examples: string | null;
  brand_notes: string | null;
  forbidden_phrases: string | null;
  style_notes: string | null;
  voice_profile_json: unknown;
  created_at: string;
  updated_at: string;
}

// Payload accepted by PUT /api/creator-brain.
// voice_profile_json is intentionally excluded — clients cannot write it.
// Only the /analyze endpoint (Phase C) writes that field.
export interface CreatorBrainWritePayload {
  displayName?: string;
  niche?: string;
  targetAudience?: string;
  primaryPlatforms?: string[];
  toneDescription?: string;
  styleNotes?: string;
  brandNotes?: string;
  forbiddenPhrases?: string;
  writingExamples?: string;
}
