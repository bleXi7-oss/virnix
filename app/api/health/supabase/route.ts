import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const checkedAt = new Date().toISOString();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const supabaseUrlPresent = supabaseUrl.length > 0;
  const supabaseKeyPresent = supabaseKey.length > 0;

  if (!supabaseUrlPresent || !supabaseKeyPresent) {
    return NextResponse.json(
      {
        status: "error",
        configured: false,
        supabaseUrlPresent,
        supabaseKeyPresent,
        dnsReachable: false,
        authReachable: false,
        message: "Supabase env vars are missing",
        checkedAt,
      },
      { status: 503 }
    );
  }

  let supabaseHost = "";
  let urlValid = false;
  try {
    supabaseHost = new URL(supabaseUrl).hostname;
    urlValid = true;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        configured: false,
        supabaseUrlPresent: true,
        supabaseKeyPresent: true,
        supabaseHost: "",
        dnsReachable: false,
        authReachable: false,
        message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL",
        checkedAt,
      },
      { status: 503 }
    );
  }

  void urlValid;

  const healthUrl = `${supabaseUrl}/auth/v1/health`;

  let dnsReachable = false;
  let authReachable = false;
  let message: string | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    dnsReachable = true;

    if (res.ok) {
      authReachable = true;
    } else if (res.status === 401 || res.status === 403) {
      authReachable = false;
      message = `Supabase auth endpoint reachable but rejected request (HTTP ${res.status}) — anon key may be invalid or mismatched`;
    } else {
      authReachable = false;
      message = `Supabase auth endpoint returned unexpected HTTP ${res.status}`;
    }
  } catch (err: unknown) {
    dnsReachable = false;
    authReachable = false;
    if (err instanceof Error && err.name === "AbortError") {
      message = "Supabase auth endpoint timed out after 8s — project may be paused";
    } else {
      message = "Supabase host unreachable — check project URL and whether project is paused";
    }
  }

  const ok = dnsReachable && authReachable;

  return NextResponse.json(
    {
      status: ok ? "ok" : "error",
      configured: true,
      supabaseUrlPresent: true,
      supabaseKeyPresent: true,
      supabaseHost,
      dnsReachable,
      authReachable,
      ...(message ? { message } : {}),
      checkedAt,
    },
    { status: ok ? 200 : 503 }
  );
}
