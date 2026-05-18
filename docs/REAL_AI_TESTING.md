# Real AI Testing — Deployment Checklist

Step-by-step guide for enabling and safely testing real Anthropic AI generation on Virnix.

---

## Required Vercel Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | **Server-side only. Never add `NEXT_PUBLIC_` prefix.** |
| `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` | `true` | Enables real AI. Default is `false` (mock). |
| `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS` | `true` | Optional. Enables blog, timestamps, short-form script. Leave off for first test. |

> **Important:** `ANTHROPIC_API_KEY` must never be prefixed with `NEXT_PUBLIC_`.
> A `NEXT_PUBLIC_` variable is baked into the client-side bundle and visible to anyone who inspects the page source.
> The key is only read in `app/lib/ai/provider.ts`, which runs exclusively server-side (inside `app/api/generate/route.ts`).

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

## Rollback Plan

If anything breaks or costs run unexpectedly high:

1. In Vercel → Environment Variables, set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` to `false`.
2. Trigger a redeploy.
3. The app returns to the mock flow immediately — no code changes required.

The mock flow (`app/lib/ai/mock.ts`) is always present and is the default when the flag is off.

---

## Known Limitations (as of first ship)

- **No runtime testing on development machine.** All AI-path code was written and reviewed but has not been executed against a live Anthropic key. The first deployment is also the first integration test.
- **Token and cost estimates are approximate.** The `estimateTokens` function uses a 1 word ≈ 1.3 tokens heuristic. Actual token counts and costs will differ. Do not use log estimates for billing or financial reporting — use the Anthropic usage dashboard.
- **`maxTokens` may need tuning.** Current values are 4096 (core) and 6144 (advanced). Dense or long transcripts may hit this limit, causing truncated JSON and blank/partial output cards. If `stop_reason=max_tokens` appears in logs, raise the limit in `app/lib/ai/generate.ts` and redeploy.
- **Output quality needs human review.** Prompt engineering was done without a live API. Hook quality, platform-native tone, and variation engine behavior all need real-world review and iteration.
- **`npm run lint` must be run before merging any AI-path changes.** Node.js was unavailable on the development machine during initial setup — lint was not run. Run it on any machine with Node before shipping further changes to the AI layer.
