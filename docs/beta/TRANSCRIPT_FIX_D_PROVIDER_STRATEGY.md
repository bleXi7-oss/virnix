# Virnix — TRANSCRIPT-FIX-D Provider Strategy

**Date:** 2026-05-22
**Phase:** TRANSCRIPT-FIX-D
**Commit before phase:** `713e0cf` (TRANSCRIPT-FIX-C)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## PRODUCTION DIAGNOSTIC VERDICT

All 4 InnerTube clients and the `youtube-transcript` package fallback fail on Vercel:

| Client | httpStatus | playabilityStatus | captionTrackCount | Result |
|--------|-----------|-------------------|-------------------|--------|
| WEB | 200 | LOGIN_REQUIRED | 0 | ✗ |
| ANDROID | 200 | LOGIN_REQUIRED | 0 | ✗ |
| WEB_EMBEDDED_PLAYER | 200 | ERROR | 0 | ✗ |
| TVHTML5_SIMPLY_EMBEDDED_PLAYER | 200 | ERROR | 0 | ✗ |
| `youtube-transcript` package | — | — | — | ✗ "Transcript disabled" |

**Root cause:** YouTube's InnerTube API returns `LOGIN_REQUIRED` for WEB and ANDROID clients from Vercel datacenter IPs. Embedded player clients return `ERROR` (likely due to their stricter context requirements). The `youtube-transcript` package uses HTML scraping, which also fails on Vercel IPs because YouTube serves a different page to datacenter addresses.

**This is not fixable by trying more InnerTube client variants.** The restriction is at the IP level, not the client spec level.

---

## DECISION MATRIX

| Option | Reliability | Cost (beta) | Setup time | Beta-safe now? | Verdict |
|--------|------------|-------------|------------|----------------|---------|
| More InnerTube client variants | Low | €0 | 2–4h | No — proven blocked | Discard |
| Third-party transcript API (Supadata.ai) | High | Free tier: 100 req/mo → covers 60 beta gen | 1–2h + API key | After signup | ✅ Primary fix |
| Residential proxy service | Medium | $10–50/mo | 3–5h | No — over €100 budget | Discard |
| Manual transcript paste fallback | 100% | €0 | Done ✅ | Yes — immediately | ✅ Fallback (implemented) |
| Limit beta to paste-only | 100% | €0 | Done ✅ | Yes | Fallback only, degrades UX |
| Audio transcription (AssemblyAI etc.) | High | $0.0037/min | 4–6h + downloads | No — different scope | Defer |

---

## RECOMMENDED PATH

### Primary fix (next phase): TRANSCRIPT-PROVIDER-A
Integrate Supadata.ai (or equivalent) as the first-try transcript provider.

**Why Supadata.ai:**
- Purpose-built YouTube transcript extraction API
- Operates from infrastructure not blocked by YouTube's IP policy
- Free tier: 100 requests/month — covers the entire 20-user beta (60 generations max)
- Paid tier: ~$0.001–0.005 per request — negligible under €100 budget
- Simple REST API: `GET https://api.supadata.ai/v1/youtube/transcript?url=VIDEO_URL` with `x-api-key` header
- Response includes `{content: [{text, offset, duration}]}` — compatible with existing `RawSegment` type

**What Miha needs to do:**
1. Sign up at `https://supadata.ai`
2. Get API key
3. Add `SUPADATA_API_KEY=your_key` to Vercel environment variables
4. One engineering session (~1h) adds `fetchTranscriptFromSupadata()` to transcript.ts and wires it as the first provider

**What the integration looks like:**
```typescript
// In transcript.ts, before InnerTube:
if (process.env.SUPADATA_API_KEY) {
  const segs = await fetchFromSupadata(videoId); // new function
  if (segs?.length) return buildResult(segs);
}
// Fall through to InnerTube (works locally), then package
```

Zero-cost to add — the API key gate means the function is a no-op locally and until Miha sets the key.

### Fallback (implemented in this phase): Manual transcript paste
Users can paste transcript text directly from YouTube's "Show transcript" panel. The existing YouTube URL flow remains available (works locally for dev, may work on some Vercel-compatible videos in future).

---

## WHAT CHANGED IN THIS PHASE

### Code

**`app/lib/types/generation.ts`**
- `youtubeUrl: string` → `youtubeUrl?: string` (allows manual transcript mode)

**`app/lib/ai/generate.ts`**
- `req.youtubeUrl` → `req.youtubeUrl!` (non-null assertion; only used when preloaded transcript is absent, which never happens in real AI mode)

**`app/api/generate/route.ts`**
- Accepts optional `transcript` field in request body
- If `transcript` is provided (>50 chars, ≤20,000 chars): skips `getTranscriptFull()` entirely, estimates `durationSec` from word count (130 wpm), and uses the pasted text as the transcript
- `youtubeUrl` validation is skipped when manual transcript is present
- All existing credit logic runs the same way (durationSec → credit cost → deduct after generation)
- Max paste length: 20,000 characters (~20 min of speech)

**`app/page.tsx`**
- Added `pasteMode` and `manualTranscript` state
- "Video fails? Paste transcript manually" toggle link appears in idle and error states
- Clicking the link reveals a textarea; clicking again hides it (URL input remains)
- "Generate Content" uses the pasted transcript when in paste mode (>50 chars present)
- Clicking an example button or auto-pasting a YouTube URL exits paste mode
- Hint text updated: "Free beta · Sign in required · YouTube or paste transcript below"

**`app/api/debug/transcript/route.ts`**
- Added admin email guard: if `ADMIN_EMAIL` env var is set, only that email can access the endpoint. If not set, any authenticated user can access (existing behavior; acceptable for invited beta).

### Docs

- `docs/beta/TRANSCRIPT_FIX_D_PROVIDER_STRATEGY.md` — this file (new)
- `docs/CURRENT_PHASE.md` — updated to TRANSCRIPT-FIX-D
- `docs/PHASE_HISTORY.md` — phase 51 added
- `docs/beta/BETA_LAUNCH_CHECKLIST.md` — updated

---

## BETA IMPACT

**Can first 5 users be invited now?**

**YES — under one condition:** the Supabase SQL must be applied first (user_credits table + RPCs), and the real AI flag must be confirmed on in Vercel.

Users paste a YouTube transcript manually:
1. Open the video on youtube.com
2. Click "..." below the video → "Show transcript"
3. Click the three-dot menu in the transcript panel → "Toggle timestamps off"
4. Select all text, copy
5. Paste into Virnix's transcript textarea
6. Click Generate

This is more friction than the intended YouTube URL flow, but it unblocks the core AI generation feature for first 5 testers. The output quality is identical — the AI receives the same transcript text either way.

First 5 users should be explicitly told this is the current beta experience and asked to test the manual paste path. This is honest and useful feedback.

**Note on sample buttons (Simon Sinek, Steve Jobs):** These will still attempt YouTube fetch, which will fail on Vercel. When they fail, the transcript error appears and the paste toggle becomes visible. Consider removing or relabeling sample buttons until TRANSCRIPT-PROVIDER-A is implemented. Or leave them as a clear demonstration of the current failure mode (honest for beta testers).

---

## SAMPLE VIDEO POLICY

Current samples are 18 min (Simon Sinek) and 15 min (Steve Jobs) — both exceed the 10-minute free beta soft limit from earlier docs.

**Recommendation:** Replace samples with under-10-minute videos after TRANSCRIPT-PROVIDER-A makes YouTube fetch work. Until then, the samples are irrelevant to the manual paste flow. Leave them as-is to avoid unnecessary churn, but document for cleanup.

---

## COST IMPACT

| Item | Expected cost |
|------|---------------|
| Manual paste fallback | €0 — no YouTube fetch |
| AI generation cost per manual paste | ~€0.03–0.05 (same as YouTube URL flow) |
| 60 beta generations (20 users × 3 credits) | ~€3.00 max — well within €100 budget |
| Supadata.ai (when integrated) | Free tier covers beta entirely |

No change to €100 budget risk.

---

## PRIVACY / SECURITY

### Debug endpoint (`/api/debug/transcript`)
- Auth required: ✅ Supabase session check
- Admin email guard: ✅ Available — add `ADMIN_EMAIL=blekiiii7@gmail.com` to Vercel env vars to restrict to Miha only. If not set, any authenticated user can use it.
- Transcript text exposed: ✅ No — only metadata
- Secrets exposed: ✅ No
- Status for beta: Acceptable with 20 invited users. Remove or restrict before any public announcement.

### Manual transcript paste
- Pasted text is sent in the POST body over HTTPS
- It is used for the AI call and then discarded — not stored in Supabase or logged to Vercel
- Same privacy model as YouTube transcript fetch (text only, no storage)
- Beta notice on landing page already covers content review

### User-facing honesty
- Hint text updated to "YouTube or paste transcript below"
- Error messages already show when YouTube fetch fails (422 with human-readable text)
- Paste option is clearly labeled as a fallback, not the primary flow

---

## VALIDATION RESULTS

| Check | Result |
|-------|--------|
| `npm.cmd run lint` | ✅ Clean |
| `npm.cmd run build` | ✅ Clean — all routes compile |
| `/api/debug/transcript` in build | ✅ Dynamic route present |
| TypeScript | ✅ No errors |
| Real AI calls | 0 |
| Cost this phase | €0.00 |

---

## NEXT STEP

**TRANSCRIPT-PROVIDER-A — Integrate Supadata.ai (or equivalent) as primary transcript provider**

Engineering work:
1. Miha signs up for Supadata.ai, adds `SUPADATA_API_KEY` to Vercel
2. One engineering session (~1h):
   - Add `fetchFromSupadata(videoId)` to `app/lib/ai/transcript.ts`
   - Wire it as the first attempt before InnerTube
   - Deploy and run `/api/debug/transcript` to confirm
3. If confirmed working: remove paste mode toggle or keep as permanent fallback

After TRANSCRIPT-PROVIDER-A:
- YouTube URL flow works end-to-end on Vercel
- Manual paste remains as a fallback for any video that the provider can't handle
- Sample buttons work
- Run full generation test (FREE-BETA-A.3) to confirm real AI output
- Then send first 5 invites (FREE-BETA-D)
