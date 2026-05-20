/**
 * Safe Supabase auth connectivity check.
 * Reads .env.local, prints safe diagnostics, tests auth endpoint reachability.
 * Does NOT send magic links. Does NOT print secrets.
 * Exit 0 = reachable + auth accepted, Exit 1 = misconfigured or unreachable.
 *
 * Usage:
 *   npx tsx scripts/check-supabase-auth.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== Virnix Supabase Auth Check ===\n");
console.log("Config:");
console.log("  NEXT_PUBLIC_SUPABASE_URL present:", !!supabaseUrl);

let parsedHost = "";
if (supabaseUrl) {
  try {
    parsedHost = new URL(supabaseUrl).hostname;
    console.log("  SUPABASE_URL host:", parsedHost);
    console.log("  SUPABASE_URL protocol:", new URL(supabaseUrl).protocol);
  } catch {
    console.log("  SUPABASE_URL: MALFORMED — not a valid URL");
  }
} else {
  console.log("  SUPABASE_URL: missing");
}

console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY present:", !!supabaseKey);
console.log("  ANON_KEY length:", supabaseKey?.length ?? 0);

if (supabaseKey) {
  if (supabaseKey.startsWith("sb_publishable_")) {
    console.log("  ANON_KEY format: publishable key ✅");
  } else {
    const parts = supabaseKey.split(".");
    if (parts.length === 3) {
      try {
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
        console.log("  ANON_KEY format: JWT ✅");
        console.log("  ANON_KEY JWT role:", payload.role ?? "(no role field)");
        if (payload.role !== "anon") {
          console.warn("\n  WARNING: key role is not 'anon' — do not use the service_role key here!");
        }
      } catch {
        console.log("  ANON_KEY format: JWT (decode failed — key may be malformed)");
      }
    } else {
      console.log("  ANON_KEY format: unrecognized (not JWT, not publishable key)");
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("\nERROR: Missing required env vars. Ensure .env.local has both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

console.log("\nReachability:");
const healthUrl = `${supabaseUrl}/auth/v1/health`;
console.log("  Testing:", healthUrl);
console.log("  (sending apikey header — key value not printed)");

let parsed: URL;
try {
  parsed = new URL(healthUrl);
} catch {
  console.error("  ERROR: Could not parse health URL. SUPABASE_URL may be malformed.");
  process.exit(1);
}

const req = https.request(
  {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: "GET",
    timeout: 8000,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
  (res) => {
    let body = "";
    res.on("data", (d) => (body += d));
    res.on("end", () => {
      console.log("  HTTP status:", res.statusCode);
      const preview = body.slice(0, 200);
      if (preview) console.log("  Response:", preview);

      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log("\nRESULT: Supabase DNS reachable ✅");
        console.log("RESULT: Supabase auth endpoint reachable ✅");
        process.exit(0);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log("\nRESULT: Supabase DNS reachable ✅");
        console.log("RESULT: Supabase auth endpoint reachable ✅ (reached, but auth check rejected)");
        console.log("  Supabase returned", res.statusCode, "even with apikey header.");
        console.log("  Possible causes:");
        console.log("    - Anon key is invalid or was rotated");
        console.log("    - URL and key are from different Supabase projects");
        console.log("    - Re-copy both values fresh from Supabase dashboard → Settings → API");
        process.exit(1);
      } else {
        console.log("\nRESULT: Supabase DNS reachable ✅");
        console.log("RESULT: Supabase auth endpoint reachable ❌ (unexpected HTTP", res.statusCode + ")");
        process.exit(1);
      }
    });
  }
);

req.on("timeout", () => {
  console.log("  ERROR: Request timed out after 8s");
  console.log("\nRESULT: Supabase DNS reachable ❓ (unknown — request timed out)");
  console.log("RESULT: Supabase auth endpoint reachable ❌");
  console.log("ACTION: Check if project is paused at https://app.supabase.com");
  req.destroy();
  process.exit(1);
});

req.on("error", (err: NodeJS.ErrnoException) => {
  console.log("  ERROR:", err.message);
  if (err.code === "ENOTFOUND" || (err.message && err.message.includes("getaddrinfo"))) {
    console.log("  Project subdomain does not resolve. Check if project is paused/restoring or if project URL/ref is wrong.");
    console.log("  ACTION:");
    console.log("    1. Log in at https://app.supabase.com");
    console.log("    2. Check the project exists and is not paused");
    console.log("    3. Copy the Project URL directly from Settings → API — paste into .env.local and Vercel env vars");
    console.log("    4. If paused, click 'Restore project' (takes ~30–60s)");
    console.log("    5. After env var update on Vercel, redeploy — NEXT_PUBLIC_* vars are baked at build time");
    console.log("\nRESULT: Supabase DNS reachable ❌");
    console.log("RESULT: Supabase auth endpoint reachable ❌");
  } else {
    console.log("\nRESULT: Supabase DNS reachable ❓");
    console.log("RESULT: Supabase auth endpoint reachable ❌");
  }
  process.exit(1);
});

req.end();
