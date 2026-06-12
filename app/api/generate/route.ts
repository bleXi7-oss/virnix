import { NextRequest, NextResponse } from "next/server";
import { generate } from "../../lib/ai/generate";
import { getTranscriptFull } from "../../lib/ai/transcript";
import type { GenerateResponse } from "../../lib/types/generation";
import { chooseGenerationInput } from "../../lib/generation/chooseGenerationInput";
import { isValidEnergyId } from "../../lib/creator-energy/options";
import type { CreatorEnergyId } from "../../lib/creator-energy/types";
import { isValidLanguageId, OUTPUT_LANGUAGES } from "../../lib/languages/options";
import type { OutputLanguageId } from "../../lib/languages/types";
import { isEnabled } from "../../lib/flags";
import { createClient } from "../../lib/auth/supabase-server";
import { calculateCreditsForGeneration } from "../../lib/credits/calculateCredits";
import { deductCredits } from "../../lib/credits/server";
import { fetchCreatorBrain } from "../../lib/generation/fetchCreatorBrain";
import {
  detectTranscriptScript,
  isTranscriptSafe,
  normalizeLangCode,
  langCodeToName,
  buildTranscriptWarningCopy,
  buildPasteWarningCopy,
} from "../../lib/transcript/detectTranscriptLanguage";

// Vercel max function wall-clock time: Supadata (≤20s) + Anthropic (≤90s) + overhead.
export const maxDuration = 120;

// Credit observability — only safe metadata, never PII or content.
function logCreditEvent(params: {
  attemptKey: string | null;
  status: "started" | "warning" | "error" | "success" | "duplicate";
  creditsCharged: number;
  balanceBefore?: number;
  balanceAfter?: number;
  reason?: string;
}) {
  const key = params.attemptKey ? params.attemptKey.slice(0, 8) : "no-key";
  const parts = [
    `[virnix-credit] attempt=${key}`,
    `status=${params.status}`,
    `charged=${params.creditsCharged}`,
  ];
  if (params.balanceBefore !== undefined) parts.push(`balance_before=${params.balanceBefore}`);
  if (params.balanceAfter !== undefined) parts.push(`balance_after=${params.balanceAfter}`);
  if (params.reason) parts.push(`reason="${params.reason}"`);
  console.log(parts.join(" "));
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body", creditsUsed: 0 } satisfies GenerateResponse,
      { status: 400 }
    );
  }

  // Determine input mode: manual transcript paste or YouTube URL.
  // chooseGenerationInput handles all validation — transcript priority, length, URL format.
  const input = chooseGenerationInput(body);
  if (input.error) {
    return NextResponse.json(
      { ok: false, error: input.error.message, creditsUsed: 0 } satisfies GenerateResponse,
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
        { ok: false, error: "Sign in to generate content.", creditsUsed: 0 } satisfies GenerateResponse,
        { status: 401 }
      );
    }

    // Fetch creator brain profile — soft-fails, never blocks generation.
    const creatorBrain = await fetchCreatorBrain(supabase);

    // Transcript language guard flags — client sends confirmTranscriptWarning=true to
    // bypass the guard after user confirmation, and preferTranscriptLang="en" to retry
    // with a specific caption track (e.g. English) before confirmation.
    const confirmTranscriptWarning = body.confirmTranscriptWarning === true;
    const preferTranscriptLang =
      typeof body.preferTranscriptLang === "string" ? body.preferTranscriptLang : undefined;

    // Idempotency key — client-generated UUID per generation attempt.
    // Registered early so duplicate HTTP requests (double-click, network retry) are blocked
    // before any expensive work. Soft-fails gracefully if the table hasn't been migrated yet.
    const generationAttemptId =
      typeof body.generationAttemptId === "string" && body.generationAttemptId.length > 0
        ? body.generationAttemptId
        : null;

    if (generationAttemptId) {
      const { data: attemptStatus, error: attemptError } = await supabase.rpc(
        "start_generation_attempt",
        { p_attempt_key: generationAttemptId },
      );
      if (attemptError) {
        // Table not migrated yet — log and continue; client-side ref guard is the primary protection.
        console.warn("[virnix-idempotency] start_generation_attempt unavailable:", attemptError.message);
      } else if (attemptStatus === "in_progress") {
        logCreditEvent({ attemptKey: generationAttemptId, status: "duplicate", creditsCharged: 0, reason: "in_progress" });
        return NextResponse.json(
          { ok: false, error: "This request is already in progress. Please wait.", creditsUsed: 0 } satisfies GenerateResponse,
          { status: 409 },
        );
      } else if (attemptStatus === "completed") {
        logCreditEvent({ attemptKey: generationAttemptId, status: "duplicate", creditsCharged: 0, reason: "already_completed" });
        return NextResponse.json(
          { ok: false, error: "This generation has already been completed.", creditsUsed: 0 } satisfies GenerateResponse,
          { status: 409 },
        );
      }
    }

    // Fetch transcript — either use the manually pasted text or fetch from YouTube.
    let transcriptResult: Awaited<ReturnType<typeof getTranscriptFull>>;
    let transcriptNote: string | undefined;

    if (input.transcript) {
      const wordCount = input.transcript.split(/\s+/).filter(Boolean).length;
      transcriptResult = {
        transcript: input.transcript,
        timestampedTranscript: input.transcript,
        durationSec: Math.ceil((wordCount / 130) * 60),
      };
      // Non-blocking paste language heuristic — can't use metadata, script only.
      // Never blocks generation; attaches a soft note to the success response.
      if (outputLanguage !== "auto") {
        const pasteScript = detectTranscriptScript(input.transcript);
        if (
          pasteScript === "arabic_dominant" ||
          pasteScript === "cyrillic_dominant" ||
          pasteScript === "cjk_dominant"
        ) {
          const outputLangLabel =
            OUTPUT_LANGUAGES.find((l) => l.id === outputLanguage)?.label ?? outputLanguage;
          transcriptNote = buildPasteWarningCopy(pasteScript, outputLangLabel);
          console.log(
            `[virnix-transcript-guard] paste script=${pasteScript} outputLang=${outputLanguage} (non-blocking)`
          );
        }
      }
    } else {
      try {
        transcriptResult = await getTranscriptFull(
          input.youtubeUrl as string,
          preferTranscriptLang ? { lang: preferTranscriptLang } : undefined,
        );
      } catch (err) {
        logCreditEvent({ attemptKey: generationAttemptId, status: "error", creditsCharged: 0, reason: "transcript_fetch_failed" });
        return NextResponse.json(
          {
            ok: false,
            error: err instanceof Error ? err.message : "Could not fetch transcript. The video may not have captions.",
            creditsUsed: 0,
          } satisfies GenerateResponse,
          { status: 422 }
        );
      }

      // Transcript language guard — return a warning before charging credits or calling AI.
      // Metadata-first: if Supadata reports a language, use it. Fall back to script detection.
      // If confirmTranscriptWarning=true the user already acknowledged the mismatch.
      if (!confirmTranscriptWarning) {
        const script = detectTranscriptScript(transcriptResult.transcript);
        const safe = isTranscriptSafe(transcriptResult.supadataLang, outputLanguage, script);
        // Always log guard evaluation so English false-positives are visible in Vercel logs.
        console.log(
          `[virnix-transcript-guard] lang=${transcriptResult.supadataLang ?? "?"} script=${script} outputLang=${outputLanguage} safe=${safe}`
        );

        if (!safe) {
          const availableLangs = transcriptResult.availableLangs ?? [];
          const hasEnglish = availableLangs.some(
            (l) => (normalizeLangCode(l) ?? "") === "en",
          );
          const transcriptLangName = langCodeToName(transcriptResult.supadataLang);
          const outputLangLabel =
            OUTPUT_LANGUAGES.find((l) => l.id === outputLanguage)?.label ?? outputLanguage;
          const warningCopy = buildTranscriptWarningCopy(
            transcriptLangName,
            outputLangLabel,
            hasEnglish,
          );
          const scriptTag =
            script === "arabic_dominant"
              ? ("arabic" as const)
              : script === "cyrillic_dominant"
              ? ("cyrillic" as const)
              : script === "cjk_dominant"
              ? ("cjk" as const)
              : script === "mixed"
              ? ("non_latin" as const)
              : ("latin" as const);
          if (generationAttemptId) {
            await supabase.rpc("fail_generation_attempt", {
              p_attempt_key: generationAttemptId,
              p_status: "warning",
            }).then(({ error: e }) => {
              if (e) console.warn("[virnix-idempotency] fail_generation_attempt(warning):", e.message);
            });
          }
          logCreditEvent({ attemptKey: generationAttemptId, status: "warning", creditsCharged: 0, reason: "transcript_lang_mismatch" });
          return NextResponse.json(
            {
              ok: false,
              error: "Transcript language mismatch detected.",
              creditsUsed: 0,
              transcriptWarning: {
                transcriptLang: transcriptResult.supadataLang ?? null,
                transcriptScript: scriptTag,
                selectedOutputLang: outputLanguage,
                availableLangs,
                hasEnglish,
                warningCopy,
              },
            } satisfies GenerateResponse,
            { status: 200 },
          );
        }
      }
    }

    // Credit calculation is always server-side — never trust client-supplied values.
    const mode = isEnabled("advanced_outputs") ? "advanced" : "basic";
    const creditCost = calculateCreditsForGeneration(transcriptResult.durationSec, mode);

    if (creditCost.total === -1) {
      return NextResponse.json(
        { ok: false, error: "Content over 120 minutes cannot be processed. Try a shorter video or clip.", creditsUsed: 0 } satisfies GenerateResponse,
        { status: 422 }
      );
    }

    // Ensure credit row exists (creates 3-credit trial row for first-time users).
    const { error: ensureError } = await supabase.rpc("ensure_user_credits");
    if (ensureError) {
      console.error("[virnix] ensure_user_credits failed:", ensureError.message);
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Please try again.", creditsUsed: 0 } satisfies GenerateResponse,
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
        { ok: false, error: "Something went wrong. Please try again.", creditsUsed: 0 } satisfies GenerateResponse,
        { status: 500 }
      );
    }

    const currentBalance = (creditsRow as { balance: number }).balance;

    if (currentBalance < creditCost.total) {
      const creditError = currentBalance === 0
        ? "You've used your free beta credits. Message Miha if you'd like more."
        : `Not enough credits for this video (needs ${creditCost.total}, you have ${currentBalance}). Try a shorter video.`;
      logCreditEvent({ attemptKey: generationAttemptId, status: "error", creditsCharged: 0, balanceBefore: currentBalance, reason: "insufficient_credits" });
      return NextResponse.json(
        {
          ok: false,
          error: creditError,
          creditsUsed: 0,
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
      if (generationAttemptId) {
        await supabase.rpc("fail_generation_attempt", {
          p_attempt_key: generationAttemptId,
          p_status: "error",
        }).then(({ error: e }) => {
          if (e) console.warn("[virnix-idempotency] fail_generation_attempt(error):", e.message);
        });
      }
      logCreditEvent({ attemptKey: generationAttemptId, status: "error", creditsCharged: 0, reason: "generation_failed" });
      return NextResponse.json(
        { ok: false, error: "Generation failed. Nothing was charged. Please try again.", creditsUsed: 0 } satisfies GenerateResponse,
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
        logCreditEvent({ attemptKey: generationAttemptId, status: "error", creditsCharged: 0, balanceBefore: currentBalance, reason: "deduct_race_condition" });
      } else {
        creditsRemaining = newBalance;
        logCreditEvent({ attemptKey: generationAttemptId, status: "success", creditsCharged: creditCost.total, balanceBefore: currentBalance, balanceAfter: newBalance });
        // Mark attempt as completed with exact credit cost — idempotency safety net.
        if (generationAttemptId) {
          await supabase.rpc("complete_generation_attempt", {
            p_attempt_key: generationAttemptId,
            p_credits_deducted: creditCost.total,
          }).then(({ error: e }) => {
            if (e) console.warn("[virnix-idempotency] complete_generation_attempt:", e.message);
          });
        }
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
      ...(transcriptResult.supadataLang ? { transcriptLang: transcriptResult.supadataLang } : {}),
      ...(transcriptNote ? { transcriptNote } : {}),
    } satisfies GenerateResponse);
  }

  // ─── Mock mode: no auth, no credits ──────────────────────────────────────────
  try {
    const data = await generate({ youtubeUrl: input.youtubeUrl, energyIds, outputLanguage });
    return NextResponse.json({ ok: true, data, creditsUsed: 0 } satisfies GenerateResponse);
  } catch (err) {
    console.error("[virnix] /api/generate unhandled error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again.", creditsUsed: 0 } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
