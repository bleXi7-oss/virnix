/**
 * Safe Supabase auth connectivity check.
 * Reads .env.local, prints safe diagnostics, tests auth endpoint reachability.
 * Does NOT send magic links. Does NOT print secrets.
 * Exit 0 = reachable, Exit 1 = misconfigured or unreachable.
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
  try {
    const parts = supabaseKey.split(".");
    if (parts.length === 3) {
      // base64url → base64
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      console.log("  ANON_KEY JWT role:", payload.role ?? "(no role field)");
      if (payload.role !== "anon") {
        console.warn("\n  WARNING: key role is not 'anon' — do not use the service_role key here!");
      }
    } else {
      console.log("  ANON_KEY JWT: not a valid 3-part JWT");
    }
  } catch {
    console.log("  ANON_KEY JWT decode: failed");
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("\nERROR: Missing required env vars. Ensure .env.local has both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

console.log("\nReachability:");
const healthUrl = `${supabaseUrl}/auth/v1/health`;
console.log("  Testing:", healthUrl);

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
  },
  (res) => {
    let body = "";
    res.on("data", (d) => (body += d));
    res.on("end", () => {
      console.log("  HTTP status:", res.statusCode);
      console.log("  Response:", body.slice(0, 200));
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
        console.log("\nRESULT: Supabase auth endpoint reachable ✅");
        process.exit(0);
      } else {
        console.log("\nRESULT: Supabase returned non-success status ⚠️");
        process.exit(1);
      }
    });
  }
);

req.on("timeout", () => {
  console.log("  ERROR: Request timed out after 8s");
  console.log("\nRESULT: Supabase not reachable (timeout) ❌");
  console.log("ACTION: Check if project is paused at https://app.supabase.com");
  req.destroy();
  process.exit(1);
});

req.on("error", (err: NodeJS.ErrnoException) => {
  console.log("  ERROR:", err.message);
  if (err.code === "ENOTFOUND" || (err.message && err.message.includes("getaddrinfo"))) {
    console.log("  CAUSE: DNS resolution failed for", parsed.hostname);
    console.log("  LIKELY: Project paused, wrong project ID, or local DNS/VPN issue");
    console.log("  ACTION:");
    console.log("    1. Log in at https://app.supabase.com");
    console.log("    2. Check the project exists and is not paused");
    console.log("    3. Verify NEXT_PUBLIC_SUPABASE_URL matches the project URL exactly");
    console.log("    4. If paused, click 'Restore project' in the Supabase dashboard");
  }
  console.log("\nRESULT: Supabase not reachable ❌");
  process.exit(1);
});

req.end();
