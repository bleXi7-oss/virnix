# RUNBOOK — Local transcription (founder-only validation tool)

`scripts/transcribe-local.ps1` turns a local audio/video file (or an
owned/permitted YouTube URL) into a plain `transcript.txt` you paste into
Virnix's **"Video fails? Paste transcript manually"** box.

It exists to unblock caption-less videos (common for Slovenian creators and
small channels) for the concierge validation test **without** building
production audio transcription. It is local, manual, and founder-only.

**It does NOT:** run on Vercel, live in the app request path, appear in
`package.json`, or touch production generation, credits, billing, prompts, the
Slovenian sanitizer, or Strongest Moments.

---

## 1. Install dependencies (one time, Windows)

You need three tools on PATH:

| Tool | Install command | Notes |
|------|-----------------|-------|
| Python 3 + whisper | `pip install -U openai-whisper` | Needs Python 3.8+. Provides the `whisper` CLI. |
| ffmpeg | `winget install Gyan.FFmpeg` | Or `choco install ffmpeg`. whisper + yt-dlp both need it. |
| yt-dlp | `winget install yt-dlp.yt-dlp` | Or `pip install -U yt-dlp`. Only needed for the URL path. |

After installing, open a **new** PowerShell window so PATH refreshes. Verify:

```powershell
whisper --help   ; ffmpeg -version   ; yt-dlp --version
```

The script checks for these and prints exact install instructions if any are
missing, so you can also just run it and follow the prompt.

GPU is optional. On CPU, `small` is the practical default; `medium` is more
accurate for Slovenian but several times slower.

---

## 2. Run it

**Local file (the primary, compliance-clean path):**

```powershell
./scripts/transcribe-local.ps1 -Input "C:\clips\episode.mp4"
```

**Owned / permitted YouTube URL:**

```powershell
./scripts/transcribe-local.ps1 -Input "https://www.youtube.com/watch?v=XXXXXXXXXXX" -Out "./transcripts/guest-show.txt" -Model medium -Language sl
```

Parameters:

- `-Input` (alias `-Source`) — file path or URL. Required.
- `-Out` (alias `-Output`) — output `.txt` path. Defaults to `./transcripts/<name>.txt`.
- `-Model` — `tiny|base|small|medium|large` (default `small`).
- `-Language` — optional ISO code (`sl`, `en`, ...) to skip auto-detect.
- `-KeepTemp` — keep the temp working dir for debugging.

Output: a `transcript.txt` (always) and a `.srt` alongside it (when whisper
produces one). The script prints both paths and a reminder to paste the `.txt`
into Virnix.

Outputs land in `./transcripts/` by default, which is git-ignored so transcript
content is never committed.

---

## 3. Known limitations

- Speed: CPU transcription of a 60-min episode on `medium` can take 10-30+ min.
  Use `small` for a first pass; re-run on `medium` only if quality is short.
- Accuracy: auto-detect occasionally mislabels short or code-switched clips.
  Pass `-Language sl` (or the right code) to fix it.
- yt-dlp + arbitrary YouTube URLs: YouTube may throttle or challenge downloads.
  This is a manual personal tool, not a reliable automated pipeline.
- No diarization (no speaker labels). Plain transcript text only.

---

## 4. Compliance note (read once)

Only process content you **own** or have **explicit permission** to use.
Downloading third-party YouTube audio can violate YouTube's Terms of Service.
That is exactly why this is a manual, local, owned-content-first utility and not
an automatic production feature. For the concierge test, prefer: the creator's
own file, a creator-provided link, or your own uploads.

---

## 5. Future: automatic production fallback (NOT built — notes only)

Decision on record (TRANSCRIPT-FALLBACK-QA-A): automatic in-product transcription
of caption-less YouTube URLs is **deferred until validation shows demand**. The
reasons, so we don't relitigate them later:

### Why the synchronous in-app version is infeasible today

- `app/api/generate/route.ts` sets `maxDuration = 120` (seconds), already
  budgeted as Supadata (~20s) + Anthropic (~90s) + overhead. There is no room to
  also download audio and run ASR in the same request. Audio download +
  transcription of a 30-120 min video does not fit. Going async means a queue +
  blob storage + status polling, which breaks the current clean credit model
  (charge only after `generate()` succeeds).
- Vercel functions run on datacenter IPs. YouTube serves those IPs bot
  challenges constantly, so `yt-dlp` from Vercel is unreliable regardless of
  compliance.
- Downloading arbitrary creators' audio is a YouTube ToS / legal surface.

### Options evaluated and rejected (for now)

| Option | Verdict | Why |
|--------|---------|-----|
| A. OpenAI transcription API in-route | Rejected now | Transcription is cheap (~$0.006/min) but the request can't also acquire audio + run ASR within 120s. Audio acquisition is the real blocker, not transcription. |
| B. Local Whisper / whisper.cpp in Vercel | Rejected | Native binaries + ffmpeg not shipped by Vercel serverless; far exceeds 120s. |
| C. External transcription provider (async) | Deferred | Viable but needs a queue + storage + webhook/polling + new credit state machine. Build after demand. |
| D. User upload audio/video | Partially adopted | The manual-paste box already covers "user supplies the transcript." A future in-app upload+transcribe is the cleanest compliant automatic path, but still needs async + storage. |
| E. yt-dlp audio extraction from URL in Vercel | Rejected | Datacenter-IP blocking + ToS risk + runtime. |

### The cheapest real path when demand justifies it

1. **First, check the provider.** See whether Supadata (or a sibling like
   another transcript API) offers **server-side ASR for caption-less videos** as
   a managed option. If yes, the "fallback" becomes a different Supadata call:
   all the IP-blocking, compliance, and runtime burden stays on their side, and
   it can stay a near-synchronous swap-in inside `getTranscriptFull()`.
2. **If no managed ASR exists**, the automatic path requires the async
   architecture (queue + storage + status UI + credit state machine). That is a
   real project and should wait until paying/returning users prove the need.

### When we do build it

- Gate behind a **server-only** flag (`ENABLE_TRANSCRIPT_FALLBACK`), read via
  `process.env` in the route, **not** through the existing `NEXT_PUBLIC_FLAG_*`
  system in `app/lib/flags.ts` (those are baked into the client bundle; a
  server-cost path must not be client-exposed).
- Keep the existing credit invariant: never charge until transcript + generation
  both succeed. Log states: `supadata_success`, `supadata_no_transcript`,
  `supadata_provider_error`, `fallback_transcription_start`,
  `fallback_transcription_success`, `fallback_transcription_fail`,
  `generation_charged`.
