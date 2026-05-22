# Virnix — TRANSCRIPT-FIX-B Report

**Date:** 2026-05-22
**Phase:** TRANSCRIPT-FIX-B
**Commit before phase:** `b11d7ce` (TRANSCRIPT-FIX-A)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## ROOT CAUSE OR CURRENT FINDING

**Not yet confirmed** — production failure mode is UNKNOWN until Miha runs the debug diagnostic on virnix.pro.

**What is proven:**

TRANSCRIPT-FIX-A added a custom InnerTube fetcher (ANDROID client, `?prettyPrint=false`) and ran all tests locally. Tests passed. But production still returned HTTP 422 "This video doesn't have captions."

**Why FIX-A did not solve production:**

The test script and the production route both use the same function (`getTranscriptFull` from `app/lib/ai/transcript.ts`). The import chain is correct. No mismatch was found.

The most likely explanation: **Vercel cloud IPs behave differently with YouTube's InnerTube API.** On Vercel, the ANDROID InnerTube request either:

1. Returns HTTP 200 but with `playabilityStatus=LOGIN_REQUIRED` and 0 caption tracks (same as TVHTML5 in local testing)
2. Returns HTTP 200 with 0 caption tracks due to datacenter IP policy
3. Returns HTTP 403/429 which the code silently skips
4. Returns valid tracks, BUT the caption XML URL fetch fails from Vercel IPs

**We do not know which.** That is exactly what TRANSCRIPT-FIX-B adds: diagnostic visibility.

---

## WHY FIX-A DID NOT SOLVE PRODUCTION

| Question | Finding |
|----------|---------|
| Route imports correct transcript function | ✅ VERIFIED — `app/api/generate/route.ts` imports `getTranscriptFull` from `app/lib/ai/transcript.ts` |
| Test script tests same function | ✅ VERIFIED — test uses same video IDs, same InnerTube logic |
| Sample URLs in UI match test script | ✅ VERIFIED — both use `u4ZoJKF_VuA` and `UF8uR6Z6KLc` |
| www vs non-www matters | ✅ NOT RELEVANT — production error is in transcript fetch, not routing |
| Production in mock mode (REAL_AI_GENERATION false) | ✅ NOT THE ISSUE — 422 on transcript is only reached in real AI mode; flag is set |
| ANDROID InnerTube locally returns valid data | ✅ VERIFIED — HTTP 200, 19 tracks, 354 segments for Simon Sinek |
| IOS InnerTube client tried as alternative | ✅ TESTED LOCALLY — returns HTTP 400 from all videos; client spec incorrect; removed |
| TVHTML5 InnerTube client tried | ✅ TESTED LOCALLY — returns `LOGIN_REQUIRED`, 0 tracks; not useful |
| ANDROID on Vercel cloud IPs | ❌ UNKNOWN — requires diagnostic on virnix.pro |

---

## WHAT CHANGED

### `app/lib/ai/transcript.ts`

**New:** `TranscriptDiagnosis` interface and `diagnoseTranscript()` export function.

The production path (`getTranscriptFull`) now logs every diagnostic step to Vercel Function Logs:
```
[virnix-transcript] InnerTube start videoId=u4ZoJKF_VuA
[virnix-transcript] ANDROID status=200 playability=OK tracks=19 lang=en xmlSegs=354 err=ok
[virnix-transcript] success via InnerTube segments=354
```

Or on failure:
```
[virnix-transcript] InnerTube start videoId=u4ZoJKF_VuA
[virnix-transcript] ANDROID status=200 playability=LOGIN_REQUIRED tracks=0 lang=- xmlSegs=- err=no_usable_track
[virnix-transcript] InnerTube all clients failed
[virnix-transcript] package fallback start videoId=u4ZoJKF_VuA
[virnix-transcript] package failed: [YoutubeTranscript] 🚨 Transcript is disabled on this video
```

These logs will immediately tell us the exact failure point.

**New:** `tryInnerTubeClient()` helper extracted — used by both the production path and `diagnoseTranscript()`.

### `app/api/debug/transcript/route.ts` (NEW)

Auth-gated GET endpoint. Call it signed in as Miha on virnix.pro to get structured diagnostic JSON.

**Usage:** `GET https://virnix.pro/api/debug/transcript?url=https://www.youtube.com/watch?v=u4ZoJKF_VuA`

**Returns (on failure):**
```json
{
  "videoId": "u4ZoJKF_VuA",
  "urlType": "watch",
  "innertubeAttempts": [
    {
      "clientName": "ANDROID",
      "httpStatus": 200,
      "playabilityStatus": "LOGIN_REQUIRED",
      "captionTrackCount": 0,
      "selectedLang": null,
      "xmlSegmentCount": null,
      "error": "no_usable_track"
    }
  ],
  "innertubeSucceeded": false,
  "packageFallbackError": "[YoutubeTranscript] 🚨 Transcript is disabled on this video",
  "totalSegmentCount": null,
  "ok": false,
  "friendlyError": "This video doesn't have captions or a readable transcript..."
}
```

**Returns (on success):**
```json
{
  "videoId": "u4ZoJKF_VuA",
  "urlType": "watch",
  "innertubeAttempts": [
    {
      "clientName": "ANDROID",
      "httpStatus": 200,
      "playabilityStatus": "OK",
      "captionTrackCount": 19,
      "selectedLang": "en",
      "xmlSegmentCount": 354,
      "error": null
    }
  ],
  "innertubeSucceeded": true,
  "packageFallbackError": null,
  "totalSegmentCount": 354,
  "ok": true,
  "friendlyError": null
}
```

**Security:** Auth required (`createClient().auth.getUser()`). Returns no transcript text, no secrets, no API keys.

### `scripts/test-transcript.mjs`

- Now reads sample video IDs directly from `app/page.tsx` at runtime (regex extracts `EXAMPLES` const)
- Logs a warning if test IDs diverge from page.tsx
- Confirms ANDROID InnerTube client tested in same configuration as production

---

## SAMPLE URL STATUS

| Sample | Video ID | Duration | Local InnerTube | Local Package |
|--------|----------|----------|----------------|---------------|
| Simon Sinek · TEDx | `u4ZoJKF_VuA` | 18 min | ✅ 354 segs | ✅ 354 segs |
| Steve Jobs · Stanford | `UF8uR6Z6KLc` | 15 min | ✅ 341 segs | ✅ 341 segs |

Both samples verified locally. Production behavior unknown until diagnostic runs on virnix.pro.

---

## PRODUCTION DIAGNOSTIC PLAN FOR MIHA

**Step 1 — Wait for Vercel deploy (~2 min after push)**

**Step 2 — Run the debug endpoint**

Sign in on virnix.pro, then open the browser DevTools → Network tab, OR use curl:

```
GET https://virnix.pro/api/debug/transcript?url=https://www.youtube.com/watch?v=u4ZoJKF_VuA
```

Or in browser address bar (while signed in):
```
https://virnix.pro/api/debug/transcript?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Du4ZoJKF_VuA
```

**Step 3 — Interpret the response**

| What you see | What it means | What to do |
|---|---|---|
| `"ok": true, "innertubeSucceeded": true` | Fix worked! InnerTube now gets captions on Vercel | Run one full generation test |
| `"httpStatus": 200, "captionTrackCount": 0, "playabilityStatus": "LOGIN_REQUIRED"` | Vercel IPs get LOGIN_REQUIRED from YouTube InnerTube | Need residential proxy or different approach |
| `"httpStatus": 200, "captionTrackCount": 0, "playabilityStatus": "OK"` | InnerTube returns success but no caption tracks for cloud IPs | Need different extraction method |
| `"httpStatus": 403` or `"httpStatus": 429` | Vercel IPs are rate-limited or blocked by YouTube | Need proxy or backoff |
| `"innertubeSucceeded": false, "ok": true` (package succeeded) | Package fallback now works | Generation should work |

**Step 4 — Check Vercel Function Logs**

While signed in at virnix.pro, try a real generation with Simon Sinek. Then in Vercel dashboard:
- Project → Functions → `/api/generate`
- Look for `[virnix-transcript]` lines
- Copy them here or into BETA_LOG.md

---

## CREDIT SAFETY

| Check | Status |
|-------|--------|
| Transcript failure deducts credits | ✗ DOES NOT — transcript fails → 422 before any credit logic (code-verified) |
| AI calls run in this phase | 0 |
| Cost this phase | €0.00 |

---

## VALIDATION RESULTS

| Check | Result |
|-------|--------|
| `npm.cmd run lint` | ✅ Clean (exit 0) |
| `npm.cmd run build` | ✅ Clean — `/api/debug/transcript` route compiled and appears in build output |
| URL parsing tests | ✅ 13/13 |
| Package fallback tests | ✅ 4/4 (including expected Rick Astley failure) |
| InnerTube ANDROID test | ✅ HTTP 200, playability=OK, 19 tracks, 354 segs (Simon Sinek) |
| Real AI calls | 0 |

---

## COMMIT HASH

See git log after commit.

---

## FINAL RECOMMENDATION

**READY FOR PRODUCTION DIAGNOSTIC TEST**

The code is in a clean, passing state. The exact production failure mode is still unknown, but Miha can now determine it in 2 minutes using the debug route.

---

## NEXT STEP

**FREE-BETA-A.3B — Miha runs one production transcript diagnostic test**

1. Wait for Vercel to deploy (~2 min after push)
2. Sign in on virnix.pro
3. Open: `https://virnix.pro/api/debug/transcript?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Du4ZoJKF_VuA`
4. Copy the full JSON response back here (no secrets in it — safe to share)
5. Based on the response, Claude will know exactly what to fix next

---

## WHAT STILL CANNOT WORK WITHOUT AUDIO TRANSCRIPTION

- Videos with no captions (music videos, raw recordings, vlogs without auto-captions)
- Shorts that never had captions enabled
- Private videos
- Videos in regions where captions are blocked
- Videos where YouTube's InnerTube API returns no caption data for cloud IPs (unknown scope)

The last item is the current unknown. The diagnostic will tell us if it affects all videos or specific ones.
