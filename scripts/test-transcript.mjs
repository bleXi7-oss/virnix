// Transcript + URL parsing smoke test — TRANSCRIPT-FIX-C
// Run with: node scripts/test-transcript.mjs
//
// Zero-cost: does NOT call Anthropic. Fetches YouTube captions only.
// Safe to run repeatedly; no credits consumed.

import { YoutubeTranscript } from "youtube-transcript";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Read sample URLs directly from page.tsx (keeps script in sync with UI) ──

const pageSource = readFileSync(resolve(__dirname, "../app/page.tsx"), "utf-8");
const exampleMatches = [
  ...pageSource.matchAll(
    /\{\s*label:\s*"([^"]+)",\s*url:\s*"https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"[^}]*\}/g
  ),
];
const SAMPLES_FROM_PAGE = exampleMatches.map((m) => ({ label: m[1], id: m[2] }));

console.log("=== Sample URLs from app/page.tsx ===");
if (SAMPLES_FROM_PAGE.length === 0) {
  console.log("  WARNING: could not extract EXAMPLES from page.tsx — check regex");
} else {
  for (const { label, id } of SAMPLES_FROM_PAGE) {
    console.log(`  ${label} → ${id}`);
  }
}
console.log();

// ─── URL parsing tests ────────────────────────────────────────────────────────

const ID_PATTERNS = [
  [/youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/, 1],
  [/youtu\.be\/([\w-]{11})/, 1],
  [/youtube\.com\/shorts\/([\w-]{11})/, 1],
];

function getVideoId(url) {
  for (const [pattern, group] of ID_PATTERNS) {
    const m = url.match(pattern);
    if (m) return m[group];
  }
  return null;
}

const URL_CASES = [
  // Standard formats
  { url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  { url: "https://youtube.com/watch?v=u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  { url: "https://youtu.be/u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  // Shorts
  { url: "https://www.youtube.com/shorts/u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  { url: "https://youtube.com/shorts/u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  // Extra params
  { url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA&t=60", expect: "u4ZoJKF_VuA" },
  { url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA&si=abc123", expect: "u4ZoJKF_VuA" },
  { url: "https://www.youtube.com/watch?si=abc123&v=u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  { url: "https://www.youtube.com/watch?list=PL123&v=u4ZoJKF_VuA", expect: "u4ZoJKF_VuA" },
  { url: "https://youtu.be/u4ZoJKF_VuA?si=abc123", expect: "u4ZoJKF_VuA" },
  // Invalid — should return null
  { url: "https://vimeo.com/123456", expect: null },
  { url: "not-a-url", expect: null },
  { url: "", expect: null },
];

console.log("=== URL Parsing ===");
let urlPass = 0,
  urlFail = 0;
for (const { url, expect } of URL_CASES) {
  const got = getVideoId(url);
  const ok = got === expect;
  if (ok) {
    urlPass++;
  } else {
    urlFail++;
    console.log(`  FAIL  url="${url}" expected="${expect}" got="${got}"`);
  }
}
console.log(`  ${urlPass}/${URL_CASES.length} passed${urlFail > 0 ? ` — ${urlFail} FAILED` : ""}\n`);

// ─── Transcript fetch tests (package fallback path) ───────────────────────────

const TRANSCRIPT_CASES = [
  // Verified working — English captions, famous talks
  { label: "Simon Sinek TEDx (18 min)", id: "u4ZoJKF_VuA", lang: "en", expectWork: true },
  { label: "Steve Jobs Stanford (15 min)", id: "UF8uR6Z6KLc", lang: "en", expectWork: true },
  // Short video — known to work
  { label: "Me at the zoo (short, auto-captions)", id: "jNQXAC9IVRw", lang: undefined, expectWork: true },
  // Known failure — no captions
  { label: "Rick Astley — captions disabled", id: "dQw4w9WgXcW", lang: undefined, expectWork: false },
];

// Verify page.tsx samples match test cases
const pageIds = new Set(SAMPLES_FROM_PAGE.map((s) => s.id));
const mismatched = TRANSCRIPT_CASES.filter(
  (c) => c.expectWork && !pageIds.has(c.id) && pageIds.size > 0
);
if (mismatched.length > 0) {
  console.log(
    "  NOTE: page.tsx EXAMPLES and test script use different video IDs:",
    mismatched.map((c) => c.id)
  );
}

console.log("=== Transcript Fetch (package fallback path) ===");
for (const { label, id, lang, expectWork } of TRANSCRIPT_CASES) {
  process.stdout.write(`  ${label} (${id})... `);
  try {
    const config = lang ? { lang } : undefined;
    const segments = await YoutubeTranscript.fetchTranscript(id, config);
    if (!segments || segments.length === 0) {
      const outcome = !expectWork ? "✓ (expected failure)" : "✗ empty result";
      console.log(outcome);
    } else {
      const text = segments
        .map((s) => s.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const langGot = segments[0]?.lang ?? "?";
      const outcome = expectWork ? "✓" : "✗ (expected to fail but got result)";
      console.log(`${outcome}  ${segments.length} segs, lang=${langGot}, ${text.length} chars`);
      console.log(`         Preview: "${text.slice(0, 80)}..."`);
    }
  } catch (err) {
    const short = err.message.replace("[YoutubeTranscript] 🚨 ", "");
    const outcome = !expectWork ? "✓ (expected)" : "✗";
    console.log(`${outcome} ${short}`);
  }
}

// ─── Enhanced InnerTube path — all clients ────────────────────────────────────
// Mirrors INNERTUBE_CLIENTS in app/lib/ai/transcript.ts — keep in sync.
// prettyPrint=false is required — YouTube returns 400 without it.
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

const CLIENTS = [
  {
    name: "WEB",
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240726.00.00",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20240726.00.00",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/",
    },
  },
  {
    name: "ANDROID",
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "20.10.38",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "20.10.38",
    },
  },
  {
    name: "WEB_EMBEDDED_PLAYER",
    context: {
      client: {
        clientName: "WEB_EMBEDDED_PLAYER",
        clientVersion: "1.20240726.00.00",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "X-YouTube-Client-Name": "56",
      "X-YouTube-Client-Version": "1.20240726.00.00",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/embed/",
    },
  },
  {
    name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    context: {
      client: {
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
      "X-YouTube-Client-Name": "85",
      "X-YouTube-Client-Version": "2.0",
      "Origin": "https://www.youtube.com",
      "Referer": "https://www.youtube.com/",
    },
  },
];

function selectTrack(tracks) {
  if (!tracks?.length) return null;
  return (
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode?.startsWith("en")) ??
    tracks[0]
  );
}

function parseXml(xml) {
  const results = [];
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    const text = m[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .trim();
    if (text) results.push({ text, duration: parseInt(m[2]), offset: parseInt(m[1]) });
  }
  if (results.length > 0) return results;
  const cRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  while ((m = cRegex.exec(xml)) !== null) {
    const text = m[3].replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
    if (text) results.push({ text, duration: parseFloat(m[2]), offset: parseFloat(m[1]) });
  }
  return results;
}

console.log("\n=== Enhanced InnerTube Path (all 4 clients) ===");
for (const { label, id, expectWork } of TRANSCRIPT_CASES.slice(0, 3)) {
  console.log(`\n  [${label}] id=${id}`);
  for (const client of CLIENTS) {
    process.stdout.write(`    ${client.name}: `);
    try {
      const resp = await fetch(INNERTUBE_URL, {
        method: "POST",
        headers: client.headers,
        body: JSON.stringify({
          context: client.context,
          videoId: id,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });
      if (!resp.ok) {
        console.log(`HTTP ${resp.status}`);
        continue;
      }
      const data = await resp.json();
      const playability = data?.playabilityStatus?.status ?? "?";
      const tracks =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      const track = selectTrack(tracks);
      if (!track?.baseUrl) {
        console.log(`HTTP 200 playability=${playability} tracks=${tracks.length} no_usable_track`);
        continue;
      }
      const xmlResp = await fetch(track.baseUrl);
      if (!xmlResp.ok) {
        console.log(
          `HTTP 200 playability=${playability} tracks=${tracks.length} lang=${track.languageCode} xml_fetch=${xmlResp.status}`
        );
        continue;
      }
      const segments = parseXml(await xmlResp.text());
      if (segments.length > 0) {
        const preview = segments
          .map((s) => s.text)
          .join(" ")
          .slice(0, 60);
        const outcome = expectWork ? "✓" : "✗ (expected failure)";
        console.log(
          `${outcome} HTTP 200 playability=${playability} tracks=${tracks.length} lang=${track.languageCode} segs=${segments.length} "${preview}..."`
        );
      } else {
        console.log(
          `HTTP 200 playability=${playability} tracks=${tracks.length} lang=${track.languageCode} empty_segments`
        );
      }
    } catch (err) {
      console.log(`exception: ${err.message.slice(0, 80)}`);
    }
  }
}

console.log(
  "\nDone. If all ✓: transcript fetching is working locally with at least one client."
);
console.log(
  "Production behavior may differ. Run /api/debug/transcript on virnix.pro to see Vercel-side results."
);
