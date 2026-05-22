// Transcript + URL parsing smoke test — TRANSCRIPT-FIX-A
// Run with: node scripts/test-transcript.mjs
//
// Zero-cost: does NOT call Anthropic. Fetches YouTube captions only.
// Safe to run repeatedly; no credits consumed.

import { YoutubeTranscript } from "youtube-transcript";

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
let urlPass = 0, urlFail = 0;
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

// ─── Transcript fetch tests ───────────────────────────────────────────────────
// These use the REAL youtube-transcript package (no AI).
// Videos verified to have English captions.

const TRANSCRIPT_CASES = [
  // Verified working — English captions, famous talks
  { label: "Simon Sinek TEDx (18 min)", id: "u4ZoJKF_VuA", lang: "en", expectWork: true },
  { label: "Steve Jobs Stanford (15 min)", id: "UF8uR6Z6KLc", lang: "en", expectWork: true },
  // Short video — known to work (first YouTube video, auto-captions)
  { label: "Me at the zoo (short, auto-captions)", id: "jNQXAC9IVRw", lang: undefined, expectWork: true },
  // Known failures — no captions (expected to fail)
  { label: "Rick Astley — captions disabled", id: "dQw4w9WgXcW", lang: undefined, expectWork: false },
];

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
      const text = segments.map(s => s.text).join(" ").replace(/\s+/g, " ").trim();
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

// ─── Enhanced InnerTube path test ─────────────────────────────────────────────
// Mirrors the logic in app/lib/ai/transcript.ts

// prettyPrint=false is required — YouTube returns 400 without it
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const CLIENTS = [
  {
    name: "ANDROID 20.10.38",
    context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", hl: "en", gl: "US", utcOffsetMinutes: 0 } },
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)", "X-YouTube-Client-Name": "3", "X-YouTube-Client-Version": "20.10.38" },
  },
];

function selectTrack(tracks) {
  if (!tracks?.length) return null;
  return tracks.find(t => t.languageCode === "en") ?? tracks.find(t => t.languageCode?.startsWith("en")) ?? tracks[0];
}

function parseXml(xml) {
  const results = [];
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRegex.exec(xml)) !== null) {
    const text = m[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
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

console.log("\n=== Enhanced InnerTube Path ===");
for (const { label, id, expectWork } of TRANSCRIPT_CASES.slice(0, 3)) {
  process.stdout.write(`  ${label} (${id})... `);
  let found = false;
  for (const client of CLIENTS) {
    try {
      const resp = await fetch(INNERTUBE_URL, {
        method: "POST",
        headers: client.headers,
        body: JSON.stringify({ context: client.context, videoId: id, contentCheckOk: true, racyCheckOk: true }),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      const track = selectTrack(tracks);
      if (!track?.baseUrl) continue;
      const xmlResp = await fetch(track.baseUrl);
      if (!xmlResp.ok) continue;
      const segments = parseXml(await xmlResp.text());
      if (segments.length > 0) {
        const text = segments.map(s => s.text).join(" ").slice(0, 80);
        const outcome = expectWork ? "✓" : "✗ (expected failure)";
        console.log(`${outcome} via ${client.name}: ${segments.length} segs — "${text}..."`);
        found = true;
        break;
      }
    } catch { continue; }
  }
  if (!found) {
    const outcome = !expectWork ? "✓ (expected failure)" : "✗ no caption data from any client";
    console.log(outcome);
  }
}

console.log("\nDone. If all ✓: transcript fetching is working locally.");
console.log("Vercel behavior may differ due to cloud IP differences with YouTube.");
