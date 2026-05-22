# Current Phase — TRANSCRIPT-FIX-C

Phase started: 2026-05-22
Status: complete — 4-client InnerTube fallback added, awaiting Miha's production multi-client diagnostic

---

## Previous phases (abbreviated)
- TRANSCRIPT-FIX-B (2026-05-22) — diagnostic tooling added, `[virnix-transcript]` logging, `/api/debug/transcript` endpoint, commit `71491a8` — complete
- TRANSCRIPT-FIX-A (2026-05-22) — InnerTube `?prettyPrint=false` fix, English captions, commit `b11d7ce` — complete but production still failed
- FREE-BETA-A.1 (2026-05-22) — Blocker verification, health endpoint DB check, commit `833b22e` — complete
- FREE-BETA-A (2026-05-22) — Production readiness, error UX, privacy notice, commit `562f468` — complete
- FREE-BETA-OBSERVABILITY-A (2026-05-22) — Beta observability plan, 7 docs — complete
- FREE-BETA-STRATEGY-A (2026-05-22) — Controlled beta strategy, 7 docs, 20-user plan — complete
- QUALITY-C (2026-05-22) — Use This First / Best Angle layer, commit `daeb5fe` — complete
- LANG-REAL-A (2026-05-21) — Real AI multilingual validation — complete
- CREDITS-A (2026-05-20) — Server-side credit system — complete
- AUTH-A (2026-05-20) — Supabase magic link auth — complete

---

## What Was Done in TRANSCRIPT-FIX-C

### Problem
TRANSCRIPT-FIX-B added diagnostic tooling. Miha ran the production diagnostic and confirmed:
- `playabilityStatus: "LOGIN_REQUIRED"` from ANDROID InnerTube client on Vercel
- `captionTrackCount: 0` — YouTube returns no caption tracks under LOGIN_REQUIRED
- `youtube-transcript` package also fails on Vercel cloud IPs (HTML scraping gets different YouTube page)
- The `innertubeAttempts` array only showed 1 attempt (ANDROID) — no fallback clients

### Root Cause (Confirmed)
YouTube's InnerTube API returns `LOGIN_REQUIRED` to the ANDROID client from Vercel datacenter IPs. This is not a video-specific issue — it affects all videos. Only residential/home IPs get `OK` from the ANDROID client.

### What Changed

**`app/lib/ai/transcript.ts`** — Expanded InnerTube client list:
- `INNERTUBE_CLIENTS` now has 4 clients: `WEB`, `ANDROID`, `WEB_EMBEDDED_PLAYER`, `TVHTML5_SIMPLY_EMBEDDED_PLAYER`
- WEB_EMBEDDED_PLAYER and TVHTML5_SIMPLY_EMBEDDED_PLAYER include `thirdParty.embedUrl` in context
- `TranscriptDiagnosis` interface and `InnerTubeAttemptResult` now include `selectedTrackKind` and `xmlHttpStatus` fields
- `diagnoseTranscript()` returns all 4 attempts in `innertubeAttempts`
- `fetchViaInnerTubeDirect()` log line includes `kind=` field
- Comment updated to list all 4 clients

**`scripts/test-transcript.mjs`** — Updated to mirror all 4 InnerTube clients

---

## Validation

- Lint: ✅ clean
- Build: ✅ clean (Turbopack, TypeScript, all routes)
- URL parsing tests: ✅ 13/13
- Package fallback tests: ✅ 4/4
- ANDROID InnerTube: ✅ working locally (HTTP 200, 354 segs for Simon Sinek)
- Other clients: ⚠️ UNPLAYABLE/ERROR locally (normal — cloud IP behavior is different and unknown)
- Real AI calls: 0 (zero cost)

---

## Next Recommended Phase

**FREE-BETA-A.3C — Miha runs production multi-client transcript diagnostic**

Not an engineering phase. Miha:
1. Waits for Vercel to deploy (~2 min after push)
2. Signs in on virnix.pro
3. Opens in browser (while signed in):
   `https://virnix.pro/api/debug/transcript?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Du4ZoJKF_VuA`
4. Copies the full JSON response and reports it here
5. Claude reads the response — which now shows all 4 InnerTube attempts — and knows exactly what to fix or confirm next

See `docs/beta/TRANSCRIPT_FIX_C_REPORT.md` for full interpretation guide.
