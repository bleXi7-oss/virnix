import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../lib/auth/supabase-server";

const VALID_RESPONSES = new Set(["yes", "some", "no"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { response } = body;
  if (typeof response !== "string" || !VALID_RESPONSES.has(response)) {
    return NextResponse.json(
      { ok: false, error: "response must be one of: yes, some, no" },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase
    .from("generation_feedback")
    .insert({ user_id: user.id, response });

  if (insertError) {
    console.error("[virnix] feedback insert failed:", insertError.message);
    return NextResponse.json({ ok: true });
  }

  console.log(
    `[virnix] feedback recorded response=${response} userId=${user.id.slice(0, 8)}`
  );
  return NextResponse.json({ ok: true });
}
