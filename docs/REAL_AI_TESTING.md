# Real AI Testing — Deployment Checklist

Step-by-step guide for enabling and safely testing real Anthropic AI generation on Virnix.

---

## Windows Local Setup (npm.cmd)

This project runs on Windows with user-scoped Node.js. Always use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

Never use bare `npm` — it may not resolve on Windows without the `.cmd` extension.

---

## Local .env.local Example

Copy `.env.example` to `.env.local` and fill in values. Do NOT commit `.env.local`.

```env
# Required for real AI generation (leave blank to stay in mock mode).
ANTHROPIC_API_KEY=sk-ant-...

# Feature flags — set to true to enable. Default is false (mock mode).
NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false
NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=false

# Local app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Important:** `ANTHROPIC_API_KEY` must never be prefixed with `NEXT_PUBLIC_`.
> A `NEXT_PUBLIC_` variable is baked into the client-side bundle and visible to anyone
> who inspects the page source. The key is only read in `app/lib/ai/provider.ts`,
> which runs exclusively server-side (inside `app/api/generate/route.ts`).

---

## Local Mock Test Steps (no API key needed)

Run these before any real AI testing to confirm the mock flow works.

1. Copy `.env.example` → `.env.local`. Leave `ANTHROPIC_API_KEY` blank and both flags `false`.
2. Start dev server: `npm.cmd run dev`
3. Open `http://localhost:3000` in a browser.
4. Paste any YouTube URL and click Generate.
5. Confirm mock output cards appear (TikTok, Twitter, LinkedIn, Instagram, YouTube titles).
6. Confirm copy buttons work on each card.
7. Confirm dark/light mode toggle works.
8. Confirm no ErrorBoundary fallback appears.
9. Check browser console — no fatal errors should appear.

This validates the full UI/UX flow without spending any API credits.

---

## Required Vercel Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | **Server-side only. Never add `NEXT_PUBLIC_` prefix.** |
| `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` | `true` | Enables real AI. Default is `false` (mock). |
| `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS` | `true` | Optional. Enables blog, timestamps, short-form script. Leave off for first test. |

---

## Safe First-Test Checklist

Work through these steps in order. Do not skip ahead.

- [ ] **1. Enable `real_ai_generation` only.**
  Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` in Vercel. Leave `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS` unset or `false`.

- [ ] **2. Set `ANTHROPIC_API_KEY`.**
  Add the key in Vercel → Settings → Environment Variables. Scope to Production (and Preview if desired).

- [ ] **3. Redeploy.**
  Trigger a redeploy so the new env vars take effect.

- [ ] **4. Test with one short transcript.**
  Use a YouTube video under 5 minutes. Short transcripts are cheaper and faster to debug on a first run.

- [ ] **5. Check Vercel logs immediately.**
  Open Vercel → Functions → `api/generate`. Confirm you see:
  - `[virnix] transcript: N words`
  - `[virnix] AI call — provider: anthropic, ~N input tokens, ~$X.XXXX estimated`
  - No `stop_reason=max_tokens` warning (see Known Limitations below if you see one).

- [ ] **6. Verify output cards render correctly.**
  All 5 core cards (TikTok, Twitter, LinkedIn, Instagram, YouTube titles) should appear with real content, not mock copy.

- [ ] **7. Verify no `stop_reason=max_tokens` warning in logs.**
  If you see `[virnix] Anthropic stop_reason=max_tokens`, the response was truncated.
  The cards may be blank or partial. See Known Limitations for next steps.

- [ ] **8. (Optional) Enable `advanced_outputs`.**
  Only after core outputs pass. Set `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=true` and redeploy.
  Verify the 3 additional cards (Short-Form Script, YouTube Timestamps, Blog Summary) appear.

---

## Local Real AI Test Steps (requires ANTHROPIC_API_KEY)

Only run this if you have a key available locally.

1. Set `ANTHROPIC_API_KEY=sk-ant-...` in `.env.local`.
2. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` in `.env.local`.
3. Leave `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=false` for the first run.
4. Start dev server: `npm.cmd run dev`
5. Open `http://localhost:3000`.
6. Use a short YouTube video (under 5 minutes — lower cost and faster to debug).
7. Click Generate.
8. Check terminal logs for:
   - `[virnix] transcript: N words`
   - `[virnix] AI call — provider: anthropic, ~N input tokens, ~$X.XXXX estimated`
   - No `[virnix] Anthropic stop_reason=max_tokens` warning
9. Verify all 5 core output cards render with real content.
10. Do NOT run repeated tests — each call costs real money.

---

## Rollback Plan

If anything breaks or costs run unexpectedly high:

1. In Vercel → Environment Variables, set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` to `false`.
2. Trigger a redeploy.
3. The app returns to the mock flow immediately — no code changes required.

For local rollback: set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false` in `.env.local` and restart the dev server.

The mock flow (`app/lib/ai/mock.ts`) is always present and is the default when the flag is off.

---

## Known Limitations

- **Token and cost estimates are approximate.** The `estimateTokens` function uses a 1 word ≈ 1.3 tokens heuristic. Actual token counts and costs will differ. Do not use log estimates for billing or financial reporting — use the Anthropic usage dashboard.
- **`maxTokens` may need tuning.** Current values are 4096 (core) and 6144 (advanced). Dense or long transcripts may hit this limit, causing truncated JSON and blank/partial output cards. If `stop_reason=max_tokens` appears in logs, raise the limit in `app/lib/ai/generate.ts` and redeploy.
- **Output quality needs human review.** Hook quality, platform-native tone, and variation engine behavior all need real-world review and iteration after first live run.
- **`npm.cmd run lint` must be run before merging any AI-path changes.** Confirmed working on this Windows machine.
