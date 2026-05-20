import { NextResponse } from "next/server";
import { createClient } from "../../lib/auth/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure credit row exists (creates with 3 trial credits if first-time user)
  const { error: ensureError } = await supabase.rpc("ensure_user_credits");
  if (ensureError) {
    console.error("[virnix] ensure_user_credits failed:", ensureError.message);
    return NextResponse.json({ error: "Could not load credits" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("user_credits")
    .select("balance")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not load credits" }, { status: 500 });
  }

  return NextResponse.json({ balance: (data as { balance: number }).balance });
}
