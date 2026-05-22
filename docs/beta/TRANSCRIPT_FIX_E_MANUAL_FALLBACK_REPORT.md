# Virnix — TRANSCRIPT-FIX-E Manual Fallback Report

**Date:** 2026-05-22
**Phase:** TRANSCRIPT-FIX-E
**Commit before phase:** `b6bbc5c` (TRANSCRIPT-FIX-D)
**Author:** Claude Sonnet 4.6 + Miha Košmerl

---

## ROOT CAUSE

The manual transcript paste code in the API route (TRANSCRIPT-FIX-D) was **functionally correct**. The route checks for `body.transcript` before any YouTube fetch, and skips the YouTube path entirely when a valid transcript is provided.

The reported failure was caused by **two UX bugs** that made the error state look broken:

### Bug 1 — Duplicate error display (primary cause of confusion)

When `phase === "error"`, the same error string was rendered in **two places simultaneously**:

1. `HeroCard` hintText — `error` was passed via `error={phase === "idle" || phase === "error" ? error : null}`. When `phase === "error"` and `error` was set, HeroCard showed it as red hint text inside the card.
2. `ErrorPanel` below the card — rendered for `phase === "error"`, it also showed the same `error` string.

Result: the user saw "This video doesn't have captions or a readable transcript." displayed **twice** on screen. Combined with the small paste toggle above the first instance, the UI looked broken — as if every generation attempt was failing with a persistent unrecoverable error.

### Bug 2 — Entering paste mode didn't clear the error state

When the user clicked "Video fails? Paste transcript manually" from `phase === "error"`, `pasteMode` became `true`, but `phase` stayed `"error"` and `error` stayed set. The paste textarea appeared below the active `ErrorPanel`, giving the impression that the error was still happening even after choosing the paste path.

### Bug 3 — Null-error ErrorPanel

After `handleUrlChange` cleared `error` (e.g., user edited the URL), `phase` stayed `"error"` and the `ErrorPanel` rendered its fallback `"Something went wrong. Please try again."` — a stale message with no relation to the current state.

---

## WHAT CHANGED

### `app/page.tsx`

**Fix 1 — No more duplicate error**
```
error={phase === "idle" || phase === "error" ? error : null}
→
error={phase === "idle" ? error : null}
```
In `phase === "error"`, `HeroCard` no longer receives the error. The `ErrorPanel` owns the error display exclusively. HeroCard shows default hint text in error state, keeping the URL input usable without visual noise.

**Fix 2 — Paste toggle clears error state**
Added `handlePasteModeToggle` that replaces the inline `() => setPasteMode((v) => !v)`:
```typescript
const handlePasteModeToggle = useCallback(() => {
  if (!pasteMode && phase === "error") {
    setPhase("idle");
    setError(null);
  }
  setPasteMode((v) => !v);
}, [pasteMode, phase]);
```
Entering paste mode from error state transitions to idle, clears the error, and shows the paste textarea in a clean context. Exiting paste mode (→ URL mode) does not change phase.

**Fix 3 — ErrorPanel only renders when error is non-null**
```
{phase === "error" && <ErrorPanel message={error} onRetry={handleReset} />}
→
{phase === "error" && error && <ErrorPanel message={error} onRetry={handleReset} hint={...} />}
```
Prevents "Something went wrong" ghost message when error has been cleared.

**Fix 4 — Paste hint in ErrorPanel for transcript errors**
When the error contains "transcript" or "caption" (case-insensitive) AND paste mode is not already active:
```
hint="You can paste the transcript text directly — use the link above."
```
This explicitly suggests the paste path at the moment the user needs it.

**Fix 5 — `hint` prop added to `ErrorPanel` component**
```typescript
function ErrorPanel({ message, onRetry, hint }: { ...; hint?: string }) {
  // renders hint as a smaller secondary line below the main error
}
```

### `app/lib/generation/chooseGenerationInput.ts` (new)

Pure helper function extracted from route.ts. Accepts a raw request body and returns:
- `{ mode: "manual_transcript", transcript: string }` — valid manual paste
- `{ mode: "youtube", youtubeUrl: string }` — valid YouTube URL
- `{ mode: ..., error: { message, status } }` — validation failure

Rules:
- `transcript` field (any non-empty string) → manual transcript mode (takes priority over `youtubeUrl`)
- `transcript.trim().length <= 50` → error 400 (too short)
- `transcript.trim().length > 20000` → error 400 (too long)
- No `transcript` and no `youtubeUrl` → error 400
- `youtubeUrl` fails `isValidYouTubeUrl()` → error 400
- Valid `youtubeUrl` → youtube mode

### `app/api/generate/route.ts`

Refactored to use `chooseGenerationInput(body)` instead of inline validation logic. Behavioral change:
- **Before:** transcript present but ≤50 chars → fell through to YouTube mode (confusing)
- **After:** transcript present but ≤50 chars → explicit 400 "Transcript is too short" error

All transcript path logic unchanged:
- `input.transcript` present → word-count durationSec estimation, no YouTube fetch
- `input.youtubeUrl` → `getTranscriptFull()` as before

`isValidYouTubeUrl` import removed from route (now inside helper).

### `scripts/test-generation-input.mjs` (new)

Zero-cost test script. 38 assertions. No TypeScript compiler, no AI calls, no network.

Run: `node scripts/test-generation-input.mjs`

---

## MANUAL MODE BEHAVIOR (after this phase)

| Property | Value |
|---|---|
| `youtubeUrl` required | **No** — not required when `transcript` is present |
| YouTube transcript fetch skipped | **Yes** — completely bypassed |
| Minimum transcript length | 51 chars (> 50) |
| Maximum transcript length | 20,000 chars |
| durationSec estimation | word count ÷ 130 wpm × 60 sec |
| Credit calculation | identical to YouTube mode (uses durationSec) |
| Credits deducted on validation failure | **No** |
| Credits deducted on transcript failure | **No** (N/A — no YouTube fetch) |
| Credits deducted on generation failure | **No** |
| Credits deducted on success | **Yes** |

---

## DUPLICATE ERROR FIX

**Why it happened:** HeroCard received `error` prop in both idle AND error phases. In error phase, HeroCard rendered it in hintText while ErrorPanel also rendered it.

**How fixed:** HeroCard now receives `error` only in idle phase. ErrorPanel is the sole renderer for errors when `phase === "error"`.

---

## CREDIT SAFETY

- Validation failure (transcript too short/long, URL missing/invalid): no credits deducted ✅
- YouTube transcript fetch failure: no credits deducted ✅
- Successful manual transcript generation: credits deducted after AI call ✅
- AI generation failure: no credits deducted ✅ ("Nothing was charged" message)

---

## VALIDATION RESULTS

| Check | Result |
|---|---|
| `npm.cmd run lint` | ✅ Clean |
| `npm.cmd run build` | ✅ Clean — all routes compile |
| `node scripts/test-generation-input.mjs` | ✅ 38/38 passed |
| Real AI calls | 0 |
| Cost this phase | €0.00 |

---

## MANUAL TEST STEPS FOR MIHA

After Vercel deploys (3–5 min after push):

1. Open virnix.pro in browser
2. Sign in with your email → confirm credit badge shows credits remaining
3. Click "Video fails? Paste transcript manually" — **confirm**: error panel disappears, textarea appears, you're in idle state
4. Open any YouTube video, click "..." → "Show transcript" → copy all transcript text (remove timestamps if needed)
5. Paste transcript text into the Virnix textarea (must be >50 chars, which any real transcript will be)
6. Click Generate Content
7. **Confirm**: loading spinner appears, then output cards (TikTok, Twitter, LinkedIn, Instagram, YouTube)
8. **Confirm**: UseThisFirst / Best Angle card visible
9. **Confirm**: credit badge decremented by 1 credit
10. If it fails: open DevTools → Network → click the `/api/generate` request → copy Response JSON and check the `error` field

**If generation succeeds:** READY FOR FIRST 5 BETA INVITES (after Supabase SQL applied and real AI flag confirmed)

---

## NEXT STEP

**FREE-BETA-A.4 — Miha runs one manual transcript live smoke test**

1. Deploy this commit
2. Follow manual test steps above
3. If output cards appear and credits deduct: confirm working
4. Then apply Supabase SQL (if not done), confirm `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` in Vercel
5. Send first 5 beta invites

After 5 invites confirmed working: **TRANSCRIPT-PROVIDER-A** — integrate Supadata.ai so YouTube URL flow works without manual paste.
