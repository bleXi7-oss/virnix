# Virnix

Turn 1 podcast into 30 viral posts in 60 seconds.

Paste any YouTube link — get TikTok hooks, X threads, LinkedIn posts, Instagram captions, and YouTube title ideas ready to post.

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env.local

# 3. Start the dev server
npm run dev -- -p 3005
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

## Mock mode (default)

Out of the box, Virnix runs in **mock mode** — no API key required, no AI calls, no cost. It fetches a real YouTube transcript and returns hardcoded demo cards so you can develop and test the full UI flow freely.

Mock mode is controlled by a single flag in `app/lib/ai/generate.ts`:

```ts
const MOCK = true; // ← default, safe for development
```

## Enable real AI generation

When you're ready to generate real content with Claude:

1. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   Get a key at [console.anthropic.com](https://console.anthropic.com/).

2. In `app/lib/ai/generate.ts`, change:
   ```ts
   const MOCK = false;
   ```

3. Restart the dev server.

That's it. The transcript layer, prompt, and parser are already wired — no other changes needed.

> **Cost note:** Each generation call sends up to 3,000 words to Claude. At current Anthropic pricing this is a few cents per request.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For real AI only | Claude API key from console.anthropic.com |
| `NEXT_PUBLIC_APP_URL` | For production | Absolute URL used in OG/Twitter metadata |

See `.env.example` for the full template.

## Tech stack

- [Next.js](https://nextjs.org/) — App Router
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) — transcript extraction
- [Anthropic SDK](https://docs.anthropic.com/) — AI generation (real mode)
