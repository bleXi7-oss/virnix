import { NextRequest, NextResponse } from "next/server";
import { generate } from "../../lib/ai/generate";
import type { GenerateRequest, GenerateResponse } from "../../lib/types/generation";
import { isValidYouTubeUrl } from "../../lib/youtube";

export async function POST(req: NextRequest) {
  let body: GenerateRequest;

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

  try {
    const data = await generate(body);
    return NextResponse.json({ ok: true, data } satisfies GenerateResponse);
  } catch (err) {
    console.error("[virnix] /api/generate unhandled error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
