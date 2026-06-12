import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatorBrainProfile, CreatorBrainRow } from "../creator-brain/types";
import { parseVoiceProfile } from "../creator-brain/prompt-context";

// Maps a raw Supabase DB row to the typed profile.
// writing_examples is stored in DB but not exposed to the generation pipeline (Phase A).
export function mapRowToProfile(row: CreatorBrainRow): CreatorBrainProfile {
  return {
    displayName: row.display_name ?? undefined,
    niche: row.niche ?? undefined,
    targetAudience: row.target_audience ?? undefined,
    primaryPlatforms: row.primary_platforms ?? undefined,
    toneDescription: row.tone_description ?? undefined,
    styleNotes: row.style_notes ?? undefined,
    brandNotes: row.brand_notes ?? undefined,
    forbiddenPhrases: row.forbidden_phrases ?? undefined,
    voiceProfileJson: parseVoiceProfile(row.voice_profile_json),
  };
}

// Fetches the authenticated user's creator brain profile.
// Soft-fails on any DB or network error — generation proceeds without personalization.
// The supabase client must already be authenticated when this is called.
export async function fetchCreatorBrain(
  supabase: SupabaseClient
): Promise<CreatorBrainProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_brain")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[virnix] creator_brain fetch failed (non-blocking):", error.message);
      return null;
    }

    return data ? mapRowToProfile(data as CreatorBrainRow) : null;
  } catch (err) {
    console.error(
      "[virnix] creator_brain fetch threw unexpectedly (non-blocking):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
