import { NextRequest, NextResponse } from "next/server";
import { generate } from "../../lib/ai/generate";
import { getTranscriptFull } from "../../lib/ai/transcript";
import type { GenerateResponse } from "../../lib/types/generation";
import { chooseGenerationInput } from "../../lib/generation/chooseGenerationInput";
import { isValidEnergyId } from "../../lib/creator-energy/options";
import type { CreatorEnergyId } from "../../lib/creator-energy/types";
import { isValidLanguageId } from "../../lib/languages/options";
import type { OutputLanguageId } from "../../lib/languages/types";
import { isEnabled } from "../../lib/flags";
import { createClient } from "../../lib/auth/supabase-server";
import { calculateCreditsForGeneration } from "../../lib/credits/calculateCredits";
import { deductCredits } from "../../lib/credits/server";
import { fetchCreatorBrain } from "../../lib/generation/fetchCreatorBrain";

// Vercel max function wall-clock time: Supadata (≤20s) + Anthropic (≤90s) + overhead.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" } satisfies GenerateResponse,
      { status: 400 }
    );
  }

  // Determine input mode: manual transcript paste or YouTube URL.
  // chooseGenerationInput handles all validation — transcript priority, length, URL format.
  const input = chooseGenerationInput(body);
  if (input.error) {
    return NextResponse.json(
      { ok: false, error: input.error.message } satisfies GenerateResponse,
      { status: input.error.status }
    );
  }

  const rawEnergyIds = Array.isArray(body.energyIds) ? body.energyIds : [];
  const energyIds: CreatorEnergyId[] = rawEnergyIds.filter(isValidEnergyId);

  // Validate output language against allowlist — unknown values fall back to "auto".
  const rawLang = body.outputLanguage;
  const outputLanguage: OutputLanguageId = isValidLanguageId(rawLang) ? rawLang : "auto";

  // ─── Real AI: auth + credit check + deduction ────────────────────────────────
  // In mock mode, skip auth and credits — dev workflow without Supabase configured.
  if (isEnabled("real_ai_generation")) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to generate content." } satisfies GenerateResponse,
        { status: 401 }
      );
    }

    // Fetch creator brain profile — soft-fails, never blocks generation.
    const creatorBrain = await fetchCreatorBrain(supabase);

    // Fetch transcript — either use the manually pasted text or fetch from YouTube.
    let transcriptResult: Awaited<ReturnType<typeof getTranscriptFull>>;
    if (input.transcript) {
      const wordCount = input.transcript.split(/\s+/).filter(Boolean).length;
      transcriptResult = {
        transcript: input.transcript,
        timestampedTranscript: input.transcript,
        durationSec: Math.ceil((wordCount / 130) * 60),
      };
    } else {
      try {
        transcriptResult = await getTranscriptFull(input.youtubeUrl as string);
      } catch (err) {
        return NextResponse.json(
          {
            ok: false,
            error: err instanceof Error ? err.message : "Could not fetch transcript. The video may not have captions.",
          } satisfies GenerateResponse,
          { status: 422 }
        );
      }
    }

    // Credit calculation is always server-side — never trust client-supplied values.
    const mode = isEnabled("advanced_outputs") ? "advanced" : "basic";
    const creditCost = calculateCreditsForGeneration(transcriptResult.durationSec, mode);

    if (creditCost.total === -1) {
      return NextResponse.json(
        { ok: false, error: "Content over 120 minutes cannot be processed. Try a shorter video or clip." } satisfies GenerateResponse,
        { status: 422 }
      );
    }

    // Ensure credit row exists (creates 3-credit trial row for first-time users).
    const { error: ensureError } = await supabase.rpc("ensure_user_credits");
    if (ensureError) {
      console.error("[virnix] ensure_user_credits failed:", ensureError.message);
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Please try again." } satisfies GenerateResponse,
        { status: 500 }
      );
    }

    const { data: creditsRow, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .single();

    if (creditsError || !creditsRow) {
      console.error("[virnix] credits read failed:", creditsError?.message);
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Please try again." } satisfies GenerateResponse,
        { status: 500 }
      );
    }

    const currentBalance = (creditsRow as { balance: number }).balance;

    if (currentBalance < creditCost.total) {
      const creditError = currentBalance === 0
        ? "You've used your free beta credits. Message Miha if you'd like more."
        : `Not enough credits for this video (needs ${creditCost.total}, you have ${currentBalance}). Try a shorter video.`;
      return NextResponse.json(
        {
          ok: false,
          error: creditError,
          creditsRequired: creditCost.total,
          creditsAvailable: currentBalance,
        } satisfies GenerateResponse,
        { status: 402 }
      );
    }

    // Run generation with the pre-fetched transcript to avoid a double fetch.
    let data: Awaited<ReturnType<typeof generate>>;
    try {
      data = await generate({ youtubeUrl: input.youtubeUrl, energyIds, outputLanguage, creatorBrain }, transcriptResult);
    } catch (err) {
      // Credits are NOT deducted when generation fails.
      console.error("[virnix] /api/generate error:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { ok: false, error: "Generation failed. Nothing was charged. Please try again." } satisfies GenerateResponse,
        { status: 500 }
      );
    }

    // Deduct credits only after successful generation.
    let creditsRemaining: number | undefined;
    try {
      const newBalance = await deductCredits(creditCost.total);
      if (newBalance === -1) {
        // Race condition: two simultaneous requests both passed the balance check.
        // Generation was served; log the anomaly but don't fail the response.
        console.warn("[virnix] deduct_credits returned -1 (race condition) — generation served, credits not deducted");
      } else {
        creditsRemaining = newBalance;
      }
    } catch (deductErr) {
      // Deduction errors don't fail the response — the user already received their generation.
      console.error("[virnix] credit deduction failed:", deductErr instanceof Error ? deductErr.message : deductErr);
    }

    return NextResponse.json({
      ok: true,
      data,
      creditsUsed: creditCost.total,
      ...(creditsRemaining !== undefined ? { creditsRemaining } : {}),
    } satisfies GenerateResponse);
  }

  // ─── Mock mode: no auth, no credits ──────────────────────────────────────────
  try {
    const data = await generate({ youtubeUrl: input.youtubeUrl, energyIds, outputLanguage });
    return NextResponse.json({ ok: true, data } satisfies GenerateResponse);
  } catch (err) {
    console.error("[virnix] /api/generate unhandled error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
