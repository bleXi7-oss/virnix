# Virnix — TRANSCRIPT-FIX-C Report

**Date:** 2026-05-22
**Phase:** TRANSCRIPT-FIX-C
**Commit before phase:** `71491a8` (TRANSCRIPT-FIX-B)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## PRODUCTION DIAGNOSTIC INPUT FROM MIHA

Miha ran `/api/debug/transcript?url=https://www.youtube.com/watch?v=u4ZoJKF_VuA` on virnix.pro while signed in. Full response:

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
  "packageFallbackError": "[YoutubeTranscript] 🚨 Transcript is disabled on this video (u4ZoJKF_VuA)",
  "totalSegmentCount": null,
  "ok": false,
  "friendlyError": "This video doesn't have captions or a readable transcript. Try a public YouTube video with captions enabled."
}
```

---

## ROOT CAUSE CONFIRMED

**YouTube returns `LOGIN_REQUIRED` to the ANDROID InnerTube client from Vercel datacenter IPs.**

- `playabilityStatus: "LOGIN_REQUIRED"` = YouTube detected the request came from a datacenter IP and requires authentication for the ANDROID client context.
- `captionTrackCount: 0` = because playabilityStatus is LOGIN_REQUIRED, no caption tracks are returned.
- This is not a video problem — Simon Sinek TEDx (`u4ZoJKF_VuA`) has 19 English caption tracks and works perfectly from residential IPs.
- The `youtube-transcript` package fallback also fails on Vercel cloud IPs because it scrapes YouTube HTML, and Vercel IPs get a different HTML response without embedded caption data.

---

## WHY ANDROID-ONLY WAS INSUFFICIENT

TRANSCRIPT-FIX-B added the `tryInnerTubeClient()` helper and the loop in `fetchViaInnerTubeDirect` that tries all clients in `INNERTUBE_CLIENTS` — but that array contained only one entry: ANDROID.

So the production path was:
1. Try ANDROID → `LOGIN_REQUIRED` (0 tracks)
2. Try `youtube-transcript` package fallback → HTML scraping fails on cloud IP
3. Throw 422 "This video doesn't have captions..."

The diagnostic endpoint confirmed this: `innertubeAttempts` had only 1 attempt.

---

## WHAT CHANGED

### `app/lib/ai/transcript.ts`

**`INNERTUBE_CLIENTS` array now has 4 clients (was 1):**

| Order | Client | Client ID | User-Agent |
|-------|--------|-----------|------------|
| 1 | `WEB` | 1 | Chrome 125 Windows |
| 2 | `ANDROID` | 3 | Android YouTube app |
| 3 | `WEB_EMBEDDED_PLAYER` | 56 | Chrome 125 Windows, Referer: embed |
| 4 | `TVHTML5_SIMPLY_EMBEDDED_PLAYER` | 85 | Tizen Smart TV |

WEB_EMBEDDED_PLAYER and TVHTML5_SIMPLY_EMBEDDED_PLAYER include `thirdParty.embedUrl` in the context (required to avoid `ERROR` playabilityStatus).

**`TranscriptDiagnosis` interface and `InnerTubeAttemptResult` now include two new fields per attempt:**
- `selectedTrackKind: string | null` — `"asr"` for auto-generated captions, `null` for manual
- `xmlHttpStatus: number | null` — HTTP status of the caption XML fetch

**`diagnoseTranscript()` now returns all 4 attempts** in `innertubeAttempts`.

**`fetchViaInnerTubeDirect()` log line** now includes `kind=` field.

**Comment in `getTranscriptFull()`** updated to list all 4 clients.

### `scripts/test-transcript.mjs`

- `CLIENTS` array updated to mirror all 4 InnerTube clients (including `thirdParty.embedUrl` on embedded clients)
- Header comment updated to TRANSCRIPT-FIX-C
- Section header updated to "all 4 clients"

---

## LOCAL TEST RESULTS (for context)

Locally (residential IP), the 4 clients behave differently from Vercel:

| Client | Local playabilityStatus | Local tracks | Local result |
|--------|------------------------|--------------|--------------|
| WEB | UNPLAYABLE | 0 | no_usable_track |
| ANDROID | OK | 19 | ✓ 354 segments |
| WEB_EMBEDDED_PLAYER | ERROR | 0 | no_usable_track |
| TVHTML5_SIMPLY_EMBEDDED_PLAYER | ERROR | 0 | no_usable_track |

**This is the inverse of Vercel behavior** — ANDROID works locally but fails on Vercel (LOGIN_REQUIRED). The other clients might behave differently on Vercel cloud IPs. The production diagnostic will tell us which, if any, work.

---

## DIAGNOSTIC ENDPOINT SAFETY

| Check | Status |
|-------|--------|
| Auth required | ✅ Yes — Supabase `auth.getUser()` returns 401 if unauthenticated |
| Admin-only restriction | ❌ No admin role system exists yet — endpoint is auth-gated but accessible to any signed-in user |
| Transcript text exposed | ✅ No — only metadata: httpStatus, playabilityStatus, captionTrackCount, selectedLang, selectedTrackKind, xmlHttpStatus, xmlSegmentCount, error |
| Secrets exposed | ✅ No |
| Credits deducted | ✅ No |

**Note:** The debug endpoint should be removed or IP-restricted before public launch. Current beta with 20 invited users: acceptable risk. It exposes no sensitive data (no transcript text, no API keys, no user data).

---

## CREDIT SAFETY

| Check | Status |
|-------|--------|
| Transcript failure deducts credits | ✅ No — transcript fails → 422 before credit deduction logic (code-verified) |
| Debug endpoint deducts credits | ✅ No — `diagnoseTranscript()` never calls `deduct_credits()` |
| AI calls run this phase | 0 |
| Cost this phase | €0.00 |

---

## VALIDATION RESULTS

| Check | Result |
|-------|--------|
| `npm.cmd run lint` | ✅ Clean (exit 0) |
| `npm.cmd run build` | ✅ Clean — all routes compile, `/api/debug/transcript` visible as Dynamic route |
| URL parsing tests | ✅ 13/13 |
| Package fallback tests | ✅ 4/4 (including expected Rick Astley failure) |
| InnerTube ANDROID local | ✅ HTTP 200, playability=OK, 19 tracks, 354 segs (Simon Sinek) |
| InnerTube WEB local | ⚠️ HTTP 200, playability=UNPLAYABLE, 0 tracks (video-type restriction on residential IP) |
| InnerTube WEB_EMBEDDED_PLAYER local | ⚠️ HTTP 200, playability=ERROR, 0 tracks (embedded client, behavior on cloud IPs unknown) |
| InnerTube TVHTML5_SIMPLY_EMBEDDED_PLAYER local | ⚠️ HTTP 200, playability=ERROR, 0 tracks (embedded client, behavior on cloud IPs unknown) |
| Real AI calls | 0 |

---

## SAMPLE VIDEO NOTE

The sample videos (Simon Sinek 18 min, Steve Jobs 15 min) exceed the planned 10-minute free beta limit.

This is NOT blocking — transcript extraction must be fixed before the sample policy matters. After transcript is confirmed working on Vercel, samples should be replaced with sub-10-minute videos per the free beta credit policy.

---

## NEXT STEP

**FREE-BETA-A.3C — Miha runs production multi-client transcript diagnostic**

1. Wait for Vercel to deploy (~2 min after push)
2. Sign in on virnix.pro
3. Open in browser while signed in:
   ```
   https://virnix.pro/api/debug/transcript?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Du4ZoJKF_VuA
   ```
4. Copy the full JSON response back here
5. The response will now show all 4 InnerTube attempts

**Interpretation guide:**

| What `innertubeAttempts` shows | Meaning | Next |
|-------------------------------|---------|------|
| Any attempt with `"ok": true` | That client works on Vercel — transcript fixed | Run full generation test |
| All clients `LOGIN_REQUIRED` | InnerTube is blocked from Vercel IPs entirely | Need proxy or timedtext endpoint |
| WEB or embedded clients get tracks (different from ANDROID) | IP policy differs by client — use that client | Move it to position 1 in array |
| All clients `UNPLAYABLE` or `ERROR` | YouTube rejects all unauthenticated InnerTube from Vercel | Need proxy or alternative |
| Package fallback `ok: true` | Package now works (unlikely without code change) | Full generation test |
