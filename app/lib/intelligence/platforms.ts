// Virnix Intelligence Layer — Platform Intelligence
//
// This module captures the deeper algorithmic and audience behavior layer for each
// platform — going beyond the tone/format guidance in prompts/twitter|linkedin|instagram.
// Where those modules answer "how should this sound?", this module answers
// "what does this platform's algorithm and audience actually reward?"
//
// Future prompt use:
//   - Inject PLATFORM_ALGORITHM_SIGNALS into per-platform prompt sections
//   - Use AUDIENCE_PSYCHOLOGY to calibrate the variation angle per platform
//   - Use CROSS_PLATFORM_REPURPOSING as a guide when adapting one piece across all 5

// ─── Platform algorithm signals ───────────────────────────────────────────────
// What the algorithm actually measures and rewards on each platform.

export const PLATFORM_ALGORITHM_SIGNALS = {
  tiktok: {
    primarySignal: "Watch time completion rate — does the video get watched to the end?",
    secondarySignals: ["Rewatch rate", "Share rate", "Profile visits after viewing"],
    contentAdvantage: "Specificity and novelty — algorithm surfaces content users haven't seen before",
    penalizes: ["Low completion rate in first 3 seconds", "Hashtag spam", "Re-uploaded content"],
    promptImplication: "Every line must pull the viewer forward — no dead air, no padding",
  },
  twitter: {
    primarySignal: "Replies and quote tweets — engagement that generates its own engagement",
    secondarySignals: ["Link clicks", "Profile visits", "Bookmarks"],
    contentAdvantage: "Takes a clear position — controversial or counterintuitive claims generate replies",
    penalizes: ["External links in the tweet body (reach suppressed)", "Low reply ratio relative to likes"],
    promptImplication: "Strong opinion in tweet 1, specific enough that readers feel compelled to agree or push back",
  },
  linkedin: {
    primarySignal: "Dwell time — how long someone pauses on the post before scrolling",
    secondarySignals: ["Comments (weighted heavily)", "Shares", "Saves"],
    contentAdvantage: "Professional vulnerability and specific results outperform generic career advice",
    penalizes: ["External links in post body", "Engagement pods", "Content that reads as promotional"],
    promptImplication: "First line must stop the mobile scroll — it's the entire hook before 'see more'",
  },
  instagram: {
    primarySignal: "Saves — the strongest signal that content is worth returning to",
    secondarySignals: ["Shares to Stories", "Reach via shares", "Comments"],
    contentAdvantage: "Relatable moments and save-worthy lists outperform inspirational quotes",
    penalizes: ["Hashtag blocks that look spammy", "Generic motivational content"],
    promptImplication: "Write so the reader thinks 'I need to save this' — frame as a resource, not a post",
  },
  youtube: {
    primarySignal: "Click-through rate (CTR) on the title+thumbnail combination",
    secondarySignals: ["Watch time", "AVD (Average View Duration)", "Re-watches"],
    contentAdvantage: "Titles that create specific curiosity gaps outperform vague 'how-to' titles",
    penalizes: ["Clickbait that fails to deliver in the video", "Titles with no search intent or no curiosity gap"],
    promptImplication: "Every title must either answer a specific question OR create an irresistible knowledge gap — not both",
  },
} as const;

// ─── Audience psychology per platform ─────────────────────────────────────────
// Who's in the mindset of consuming on each platform and what they respond to.

export const AUDIENCE_PSYCHOLOGY = {
  tiktok: {
    mindset: "Passive, lean-back, discovery mode — they did NOT search for this content",
    expectation: "Entertainment or utility in under 10 seconds, or they swipe",
    trustSignal: "Energy, authenticity, speed — not credentials",
    bestAngle: "Pattern interrupt or vulnerability — break their expectation fast",
  },
  twitter: {
    mindset: "Active, lean-forward, opinion-seeking — they're here to know what's happening",
    expectation: "A take worth having. Something that changes how they see a topic.",
    trustSignal: "Specificity and willingness to be wrong in public",
    bestAngle: "Controversy or authority — both reward intellectual investment",
  },
  linkedin: {
    mindset: "Professional but human — looking for peers who've solved what they're facing",
    expectation: "Insight that makes their job or career easier, from someone who's done it",
    trustSignal: "Specificity about real results, real failures, real timelines",
    bestAngle: "Vulnerability or storytelling — professional audiences over-index on these",
  },
  instagram: {
    mindset: "Casual, scrolling, identity-seeking — looking to feel seen or inspired",
    expectation: "'That's exactly how I feel' or 'I want to be that'",
    trustSignal: "Tone that feels personal, not broadcast",
    bestAngle: "Curiosity or storytelling — both create the save-worthy 'I need this' feeling",
  },
  youtube: {
    mindset: "Intentional, search-driven or recommendation-driven — some intent already exists",
    expectation: "The specific answer they came for, or a journey worth staying for",
    trustSignal: "Competence signaled immediately in the first 30 seconds",
    bestAngle: "Authority or urgency — both reward the viewer for choosing this video over alternatives",
  },
} as const;

// ─── Cross-platform repurposing guide ─────────────────────────────────────────
// How to adapt a single insight across all 5 platforms without just copy-pasting.
// Future: inject relevant rules into buildPrompt() per-platform section.

export const CROSS_PLATFORM_REPURPOSING = [
  "The insight is the same. The format, length, and emotional entry point change.",
  "Twitter: the argument. LinkedIn: the story behind the argument. Instagram: the feeling it creates.",
  "TikTok gets the hook and the result. YouTube gets the full context and the journey.",
  "Each platform needs a different 'why should I care right now' reason — same insight, different stakes.",
  "Never use the same opening line on two platforms — the audiences overlap more than most people think.",
] as const;

// ─── Platform content length benchmarks ───────────────────────────────────────
// Optimal character/word ranges based on engagement research.
// Used as a guardrail — prompt output schemas already enforce these loosely.

export const CONTENT_LENGTH_BENCHMARKS = {
  tiktok:    { chars: { min: 200,  max: 350  }, note: "Hook + body + CTA — cut any word that doesn't pull forward" },
  twitter:   { chars: { min: 1200, max: 2200 }, note: "8 tweets, ~150 chars each — leave room for quote-tweet context" },
  linkedin:  { chars: { min: 400,  max: 700  }, note: "Mobile-first — long posts lose readers before the CTA" },
  instagram: { chars: { min: 200,  max: 450  }, note: "Saves peak at mid-length — too short feels thin, too long loses readers" },
  youtube:   { chars: { min: 200,  max: 350  }, note: "5 titles, 40-65 chars each — thumbnail text constrains further" },
} as const;
