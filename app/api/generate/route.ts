import { NextRequest, NextResponse } from "next/server";
import { generate } from "../../lib/ai/generate";
import type { GenerateResponse } from "../../lib/types/generation";
import { isValidYouTubeUrl } from "../../lib/youtube";
import { isValidEnergyId } from "../../lib/creator-energy/options";
import type { CreatorEnergyId } from "../../lib/creator-energy/types";

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

  if (!body.youtubeUrl || typeof body.youtubeUrl !== "string") {
    return NextResponse.json(
      { ok: false, error: "youtubeUrl is required" } satisfies GenerateResponse,
      { status: 400 }
    );
  }

  if (!isValidYouTubeUrl(body.youtubeUrl)) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid YouTube URL" } satisfies GenerateResponse,
      { status: 400 }
    );
  }

  // Validate energyIds against the allowlist — unknown values are silently dropped
  const rawEnergyIds = Array.isArray(body.energyIds) ? body.energyIds : [];
  const energyIds: CreatorEnergyId[] = rawEnergyIds.filter(isValidEnergyId);

  try {
    const data = await generate({ youtubeUrl: body.youtubeUrl, energyIds });
    return NextResponse.json({ ok: true, data } satisfies GenerateResponse);
  } catch (err) {
    console.error("[virnix] /api/generate unhandled error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
