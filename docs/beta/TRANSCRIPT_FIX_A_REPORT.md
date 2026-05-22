# Virnix — TRANSCRIPT-FIX-A Report

**Date:** 2026-05-22
**Phase:** TRANSCRIPT-FIX-A
**Commit before phase:** `833b22e` (FREE-BETA-A.1)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## ROOT CAUSE

### Primary: `?prettyPrint=false` missing from InnerTube URL

The `youtube-transcript` package uses two paths:
1. **InnerTube API** (`https://www.youtube.com/youtubei/v1/player?prettyPrint=false`) — tried first
2. **HTML scraping** (`https://www.youtube.com/watch?v=ID`) — fallback if InnerTube returns no captions

The custom enhanced InnerTube fetcher added in this phase was initially calling the URL *without* `?prettyPrint=false`. YouTube returns HTTP 400 without this parameter. With `?prettyPrint=false`, the API returns 200 and full caption track data.

This same `prettyPrint=false` requirement is already known to the `youtube-transcript` package — but it was missing from our custom fetcher, making it ineffective.

### Why production failed before this fix

On Vercel's cloud IPs, YouTube likely serves a different HTML page (without inline `ytInitialPlayerResponse` JSON) than residential IPs, causing the HTML scraping fallback to throw `YoutubeTranscriptDisabledError` — even for videos that genuinely have captions.

The InnerTube API path is more reliable from cloud IPs since it's a direct POST to a YouTube API endpoint (not HTML scraping). With our fixed custom fetcher, the InnerTube path now runs first with more complete context (`hl: "en"`, `gl: "US"`, X-YouTube headers), before the package's own logic.

### Secondary: Wrong Arabic captions

Before this fix, the `youtube-transcript` package returned the *first available* caption track for each video — which was Arabic for Simon Sinek's TEDx talk. The package now receives `lang: "en"` preference. If English isn't available, it falls back to any available language.

---

## WHAT CHANGED

### `app/lib/ai/transcript.ts` (rewritten)

1. **Enhanced InnerTube fetcher added** (`fetchViaInnerTubeDirect`):
   - Uses `https://www.youtube.com/youtubei/v1/player?prettyPrint=false` (correct URL)
   - Client: `ANDROID 20.10.38` with `hl: "en"`, `gl: "US"`, X-YouTube headers
   - Prefers English captions (`en` → `en-*` prefix → first available)
   - Parses both srv3 (ms) and classic (seconds) XML formats
   - Tried **before** the `youtube-transcript` package

2. **Language preference added** to package fallback:
   - Tries `lang: "en"` first
   - If the language error is "not available in en", retries without filter
   - Sample buttons (Simon Sinek, Steve Jobs) now return English text

3. **Better error messages in `toFriendlyError`**:
   - CAPTCHA/rate-limit: "YouTube is temporarily blocking transcript access. Please try again in a few minutes."
   - Disabled captions: "This video doesn't have captions or a readable transcript. Try a public YouTube video with captions enabled."
   - TooManyRequests distinguished from DisabledError
   - Private/unavailable: separate messages
   - No-transcript vs. blocked: separate messages

### `app/page.tsx`

- Line 339: `"No account required · Works with any captioned YouTube video"`
  → `"Free beta · Sign in required · Works with captioned YouTube videos"`

### `scripts/test-transcript.mjs` (rewritten)

- URL parsing: 13 test cases (watch, youtu.be, shorts, extra params, invalid)
- Package fallback path: 4 videos (2 known-good, 1 short, 1 expected-fail)
- Enhanced InnerTube path: 3 videos tested directly against the API
- Uses corrected `?prettyPrint=false` URL

---

## SHORTS STATUS

- **Supported URL parsing:** ✓ yes — `youtube.com/shorts/VIDEO_ID` parsed by `getYouTubeVideoId()`
- **Shorts with captions:** should work — video ID is extracted and sent to InnerTube
- **Shorts without captions:** expected limitation — `YoutubeTranscriptDisabledError` → user-friendly message
- **User-facing behavior:** "This video doesn't have captions or a readable transcript. Try a public YouTube video with captions enabled."

Note: Most YouTube Shorts do NOT have captions (unlike long-form videos). Virnix works best with long-form content that has auto-generated or manual captions.

---

## SAMPLE BUTTON STATUS

| Sample | Video ID | Old behavior | New behavior |
|--------|----------|-------------|-------------|
| Simon Sinek · TEDx | `u4ZoJKF_VuA` | Arabic captions (first track) | English captions (`lang: "en"`) |
| Steve Jobs · Stanford | `UF8uR6Z6KLc` | Arabic captions (first track) | English captions (`lang: "en"`) |

Both samples verified working locally with both the enhanced InnerTube path AND the package fallback path. Each returns 300+ English segments.

---

## CREDIT SAFETY

| Check | Status |
|-------|--------|
| Credits checked before AI call | ✓ verified (route calls `ensure_user_credits` → reads balance before `generate()`) |
| Credits deducted only after successful AI | ✓ verified (deduction is after `generate()` returns, in a separate try/catch) |
| Transcript failure deducts credits | ✗ does NOT deduct (transcript fails → 422 returned before any credit logic) |
| AI failure deducts credits | ✗ does NOT deduct (AI error returns 500 with "Nothing was charged") |

---

## VALIDATION RESULTS

- **Lint:** ✅ clean (exit 0)
- **Build:** ✅ clean (Turbopack, TypeScript, all routes)
- **URL parsing tests:** ✅ 13/13 passed
- **Transcript package fallback tests:** ✅ 4/4 (including expected failure)
- **Enhanced InnerTube path tests:** ✅ 3/3 worked locally
- **Real AI calls run:** 0 (zero cost)

---

## MANUAL TEST FOR MIHA

After deploying (auto-deploys on push to main):

**Step 1 — Confirm deployment**
- Wait ~2 minutes after push completes
- Visit `https://virnix.pro` — should see updated hint text: "Free beta · Sign in required · Works with captioned YouTube videos"

**Step 2 — Sign in**
1. Open virnix.pro in incognito
2. Click Sign in → enter your email → click link
3. Confirm CreditBadge shows 3 credits

**Step 3 — Try sample button**
1. Click "Simon Sinek · TEDx" sample button
2. Confirm loading steps appear (not an immediate error)
3. Confirm output cards appear with English content
4. Confirm credit balance decreased
5. If it fails: check browser DevTools → Network → `/api/generate` → Response body

**Step 4 — Try Shorts (expected to fail if no captions)**
1. Find a YouTube Shorts URL that has captions
2. Paste the URL
3. If it has captions: works. If not: "doesn't have captions" message — expected.

**Estimated cost:** ~€0.05 for one generation (Simon Sinek = 18 min = 2 credits)

---

## FINAL RECOMMENDATION

**READY FOR ONE FINAL LIVE GENERATION TEST**

The code changes are:
1. Enhanced InnerTube fetcher runs before HTML scraping — much more likely to work on Vercel's cloud IPs
2. Sample buttons now get English captions
3. Error messages are accurate and helpful
4. UI copy is correct (sign in required)

---

## NEXT STEP

**FREE-BETA-A.3 — Miha runs one final live generation smoke test**

After deploying:
1. Sign in on virnix.pro
2. Click Simon Sinek · TEDx sample button
3. Confirm generation works end-to-end
4. Confirm output cards + UseThisFirstCard appear
5. Confirm credits deducted (3→1 for 18 min video)

If that passes: **READY FOR FIRST 5 BETA INVITES → FREE-BETA-D**

---

## WHAT STILL CANNOT WORK WITHOUT AUDIO TRANSCRIPTION

- Videos with no captions of any kind (many music videos, raw recordings, vlogs without auto-captions)
- Shorts that never had captions enabled
- Private videos
- Videos in regions where captions are blocked

These are accepted limitations for the free beta. The error message clearly explains the constraint.
