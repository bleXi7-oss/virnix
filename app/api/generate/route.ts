import { NextRequest, NextResponse } from "next/server";
import { generate } from "../../lib/ai/generate";
import type { GenerateRequest, GenerateResponse } from "../../lib/types/generation";

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

  try {
    const data = await generate(body);
    return NextResponse.json({ ok: true, data } satisfies GenerateResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: message } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
