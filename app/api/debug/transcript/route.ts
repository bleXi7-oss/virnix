import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/auth/supabase-server";
import { diagnoseTranscript } from "../../../lib/ai/transcript";

// Auth-gated transcript diagnostic endpoint.
// Returns structured InnerTube + package fallback diagnostics.
// Never returns full transcript text or any secrets.
// Usage (signed in): GET /api/debug/transcript?url=https://www.youtube.com/watch?v=VIDEO_ID
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Restrict to admin email when ADMIN_EMAIL env var is set.
  // If not set, any authenticated user may use the endpoint (acceptable for invited beta).
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "url param required", usage: "/api/debug/transcript?url=YOUTUBE_URL" },
      { status: 400 }
    );
  }

  try {
    const diagnosis = await diagnoseTranscript(url);
    return NextResponse.json(diagnosis);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Diagnosis threw unexpectedly",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
