import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../lib/auth/supabase-server";
import { validateCreatorBrainPayload } from "../../lib/creator-brain/validate";
import { mapRowToProfile } from "../../lib/generation/fetchCreatorBrain";
import type { CreatorBrainRow } from "../../lib/creator-brain/types";

// GET /api/creator-brain — returns current user's profile or null
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creator_brain")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[virnix] GET creator_brain failed:", error.message);
    return NextResponse.json({ ok: false, error: "Failed to fetch profile" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: true, data: null });
  }

  const row = data as CreatorBrainRow;
  return NextResponse.json({
    ok: true,
    // writing_examples is included here for the UI only.
    // mapRowToProfile intentionally excludes it from the generation pipeline.
    data: { ...mapRowToProfile(row), writingExamples: row.writing_examples ?? undefined },
  });
}

// PUT /api/creator-brain — upsert user's creator brain profile.
// voice_profile_json is NOT accepted from the client — only /analyze (Phase C) writes it.
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { valid, errors, sanitized } = validateCreatorBrainPayload(body);
  if (!valid) {
    return NextResponse.json({ ok: false, error: errors.join("; ") }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("creator_brain")
    .upsert(
      {
        user_id: user.id,
        display_name: sanitized.displayName ?? null,
        niche: sanitized.niche ?? null,
        target_audience: sanitized.targetAudience ?? null,
        primary_platforms: sanitized.primaryPlatforms ?? null,
        tone_description: sanitized.toneDescription ?? null,
        style_notes: sanitized.styleNotes ?? null,
        brand_notes: sanitized.brandNotes ?? null,
        forbidden_phrases: sanitized.forbiddenPhrases ?? null,
        writing_examples: sanitized.writingExamples ?? null,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("[virnix] PUT creator_brain upsert failed:", upsertError.message);
    return NextResponse.json({ ok: false, error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
