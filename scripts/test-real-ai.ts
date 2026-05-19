// Local smoke test for the Virnix AI quality layer.
// Tests parsing, quality scoring, and chunking using a hardcoded sample.
// Does NOT make real API calls — safe to run at any time, zero cost.
//
// Run with:
//   npx.cmd tsx scripts/test-real-ai.ts
//
// Requires tsx: npm.cmd install --save-dev tsx
//
// To test real AI output, paste actual AI response text into SAMPLE_AI_RESPONSE below.

import { selectBestSegment, estimateTokens, estimateCost } from "../app/lib/ai/chunker";
import { estimateViralityScore, hasStrongHook, hasCuriosityGap } from "../app/lib/intelligence/quality";
import { parseAnthropicResponse, extractLargestJsonObject } from "../app/lib/ai/parser";
import { logDiagnostics } from "../app/lib/ai/diagnostics";
import type { AIDiagnostics } from "../app/lib/ai/diagnostics";

// ─── Sample data ──────────────────────────────────────────────────────────────

// A representative podcast transcript excerpt for testing chunking + quality scoring.
const SAMPLE_TRANSCRIPT = `
Welcome back to the show everybody thanks for tuning in today we're going to be talking about
something that I think is really important and I want to share this with you. Um so basically
I've been studying creator growth for the past three years and I've noticed something that
most people completely miss. Here's the thing — I was wrong about this for years. I thought
posting more content was the answer. I was completely wrong.

The creators who actually scale their audience don't post more. They post less but with
more intentionality. Here's the data that changed my mind: I looked at 200 accounts that
went from 10,000 to 500,000 followers in 18 months. 73% of them reduced their posting
frequency in month six. But here's the counterintuitive part — their reach went up.

The reason most people get this wrong is that they're optimizing for the wrong signal.
They're watching follower count. The creators who scale are watching something completely
different. They're watching save rate. When someone saves your post, they're telling the
algorithm this content is worth returning to. That's the signal that compounds.

I discovered this by accident. I posted something half-finished one night — a rough breakdown
of my content framework. I almost deleted it. Instead I left it up. It got 40% more saves
than anything I'd posted that month. And I realized: specificity beats polish. Raw and useful
beats beautiful and vague. Every single time.

The question you need to ask about every piece of content: would someone save this to come
back to later? If the answer is no, you either need to make it more specific or cut it entirely.
`.trim();

// A well-formed sample AI response JSON for testing the parser.
const SAMPLE_AI_RESPONSE = `
Here is the generated content for your transcript:

{
  "tiktok": {
    "content": "I was wrong about content growth for 3 years.\\n\\nI thought posting more was the answer. 200 accounts. 18 months. 500k followers each.\\n\\nThe 73% who actually scaled? They posted less.\\n\\nHere's the exact system..."
  },
  "twitter": {
    "content": "1/ I studied 200 accounts that went from 10k to 500k followers in 18 months.\\n\\n73% of them reduced their posting frequency at month 6.\\n\\nAnd their reach went UP.\\n\\nHere's why:\\n\\n2/ Most creators are optimizing for the wrong signal.\\n\\nThey're watching follower count. The ones who actually scale watch something different.\\n\\nSave rate.\\n\\n3/ When someone saves your post, they're telling the algorithm this content is worth returning to.\\n\\nThat's the signal that compounds.\\n\\n4/ I found this by accident.\\n\\nI posted something half-finished one night. Almost deleted it.\\n\\nIt got 40% more saves than anything I posted that month.\\n\\n5/ The lesson: specificity beats polish. Raw and useful beats beautiful and vague.\\n\\nEvery single time.\\n\\n6/ The question to ask about every piece of content:\\n\\nWould someone save this to come back to later?\\n\\n7/ If the answer is no — make it more specific or cut it.\\n\\nBeautiful content that doesn't get saved is just expensive noise.\\n\\n8/ What's your save rate on your last 5 posts?\\n\\nMost creators have never checked. That's why they're stuck."
  },
  "linkedin": {
    "content": "I was posting every day for 6 months.\\n\\nMy save rate: 0.3%.\\n\\nThen I posted something rough and unfinished at 11pm.\\n\\nSave rate: 6.2%.\\n\\nHere's what that taught me ↓\\n\\nSpecificity beats polish. Always.\\n\\nI studied 200 accounts that grew from 10k to 500k in 18 months. 73% reduced their posting frequency halfway through.\\n\\nTheir reach went up. Their saves went up. Their revenue went up.\\n\\nThey stopped optimizing for volume. They started optimizing for saves.\\n\\nThe question I now ask before every post: would someone come back to this later?\\n\\nIf not — I either make it more specific or I cut it.\\n\\nWhat would you cut if you only posted twice a week?"
  },
  "instagram": {
    "content": "POV: you finally understand why your content isn't growing 🧠\\n\\nSpoiler: it's not your posting frequency.\\n\\nI studied 200 creator accounts that hit 500k followers.\\n\\n→ 73% posted LESS in month 6\\n→ Their reach went UP\\n→ Save rate was their #1 focus\\n\\nWhen someone saves your post = algorithm goldmine.\\n\\nThe question: would someone save this to come back to later?\\n\\nIf no → make it more specific or cut it.\\n\\nSave this for when you're wondering why you're stuck 📌"
  },
  "youtube": {
    "content": "1. I Studied 200 Creators Who Hit 500K — Here's the Pattern Nobody Talks About\\n2. Why Posting Less Made My Reach Go Up (The Data Surprised Me)\\n3. The One Metric That Predicts Creator Growth (It's Not Followers)\\n4. Stop Optimizing for Followers — Do This Instead\\n5. The Save Rate Secret: Why Your Best Posts Get the Least Reach"
  }
}

I hope this content serves your needs!
`.trim();

// ─── Test runner ──────────────────────────────────────────────────────────────

function main(): void {
  console.log("\n═══ Virnix AI Quality Layer — Local Smoke Test ═══\n");

  // ── 1. Chunking test ─────────────────────────────────────────────────────
  console.log("── 1. Chunking + Segment Selection ──");
  const MAX_WORDS = 3000;
  const selectedSegment = selectBestSegment(SAMPLE_TRANSCRIPT, MAX_WORDS);
  const wordCount = selectedSegment.split(/\s+/).filter(Boolean).length;
  const tokens = estimateTokens(selectedSegment);
  const cost = estimateCost(tokens, 4096);

  console.log(`  Words selected: ${wordCount}`);
  console.log(`  Tokens ~: ${tokens}`);
  console.log(`  Estimated cost: $${cost.estimatedUSD.toFixed(5)}`);
  console.log();

  // ── 2. JSON extraction fallback test ─────────────────────────────────────
  console.log("── 2. JSON Deep-Scan Extraction ──");
  const extracted = extractLargestJsonObject(SAMPLE_AI_RESPONSE);
  const extractWorked = extracted.startsWith("{") && extracted.endsWith("}");
  console.log(`  Extraction success: ${extractWorked}`);
  console.log(`  Extracted length: ${extracted.length} chars`);
  console.log();

  // ── 3. Parser test ────────────────────────────────────────────────────────
  console.log("── 3. Parser ──");
  const { result, parseRepaired, coercionUsed } = parseAnthropicResponse(SAMPLE_AI_RESPONSE);
  const hookCard   = result.cards.find((c) => c.type === "Hook Script");
  const titleCard  = result.cards.find((c) => c.type === "Title Ideas");
  const hookCount  = hookCard ? 1 : 0;
  const titleCount = titleCard ? 1 : 0;

  console.log(`  Hook cards: ${hookCount}`);
  console.log(`  Title cards: ${titleCount}`);
  console.log(`  Total cards: ${result.cards.length}`);
  console.log(`  Parse repaired: ${parseRepaired}`);
  console.log(`  Coercion used: ${coercionUsed}`);
  console.log();

  // ── 4. Quality scoring ────────────────────────────────────────────────────
  console.log("── 4. Quality Scoring ──");
  const hookContent   = hookCard?.content ?? "";
  const titleContent  = titleCard?.content ?? "";

  const hookScore   = estimateViralityScore(hookContent, "tiktok");
  const titleScore  = estimateViralityScore(titleContent, "youtube");
  const strongHook  = hasStrongHook(hookContent);
  const curiosity   = hasCuriosityGap(hookContent);

  console.log(`  TikTok hook score: ${hookScore}/100`);
  console.log(`  YouTube title score: ${titleScore}/100`);
  console.log(`  Has strong hook: ${strongHook}`);
  console.log(`  Has curiosity gap: ${curiosity}`);
  console.log();

  // ── 5. Full diagnostics log ───────────────────────────────────────────────
  console.log("── 5. Diagnostics ──");
  const diagnostics: AIDiagnostics = {
    provider: "mock",
    elapsedMs: 0,
    estimatedTokens: tokens,
    chunkCount: 1,
    outputType: "core",
    retryCount: 0,
    fallbackUsed: false,
    parseRepaired,
    coercionUsed,
    viralityScore: hookScore,
  };
  logDiagnostics(diagnostics);
  console.log();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("── Summary ──");
  const allGood = !coercionUsed && hookCount > 0 && hookScore > 0;
  console.log(`  Status: ${allGood ? "✓ PASS" : "⚠ CHECK OUTPUT"}`);
  console.log(`  hook count: ${hookCount}, title count: ${titleCount}`);
  console.log(`  parse repaired: ${parseRepaired}, elapsed: ${diagnostics.elapsedMs}ms`);
  console.log(`  virality score: ${hookScore}/100`);
  console.log(`  estimated cost: $${cost.estimatedUSD.toFixed(5)}\n`);
}

main();
