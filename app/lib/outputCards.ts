export type IconType = "x" | "linkedin" | "tiktok" | "instagram" | "youtube";

export interface OutputCardData {
  platform: string;
  type: string;
  badge: string;
  charCount: string;
  content: string;
  iconType: IconType;
  wide?: boolean;
}

export const LOADING_STEPS = [
  "Fetching transcript...",
  "Spotting viral moments...",
  "Writing your hooks...",
  "Packaging your content kit...",
] as const;

export const OUTPUT_CARDS: OutputCardData[] = [
  {
    platform: "TikTok / Reels",
    type: "Hook Script",
    badge: "60 sec",
    charCount: "~280 chars",
    iconType: "tiktok",
    content: `HOOK: "I lost 2,000 followers on purpose.\n\nMy engagement rate tripled the next week.\n\nHere's the counterintuitive growth strategy every big creator quietly uses — but nobody ever actually explains:"\n\nCUT TO: Here's the exact system...`,
  },
  {
    platform: "Twitter / X",
    type: "Thread",
    badge: "8 tweets",
    charCount: "~1,800 chars",
    iconType: "x",
    content: `1/ The most successful creators I've studied all do something that sounds insane.\n\nThey regularly post content with almost zero reach.\n\nOn purpose. Here's why:\n\n2/ Most creators optimize for the wrong metric.\n\nImpressions. Follower count. Like ratio.\n\nThe ones making real money obsess over one thing: conversion depth.\n\n3/ Conversion depth = the journey from stranger → subscriber → buyer.\n\n10,000 deep fans will always outperform 500,000 passive followers.\n\n4/ The mistake killing most accounts:\n\nTreating all content as equal.\n\nSome posts reach new people.\nSome build trust.\nSome convert.\n\nMost creators post 90% reach content. Then wonder why the revenue never comes.\n\n5/ The framework that actually works:\n\n60% → reach content (hooks, trends)\n30% → trust content (stories, opinions, nuance)\n10% → conversion content (offers, results, proof)\n\nMost creators have never intentionally posted trust content. Ever.\n\n6/ The counterintuitive part:\n\nYour lowest-reach posts are often your highest-trust ones.\n\nSmall audience. Deep resonance. Specific people.\n\nThat's the asset. Most people delete it.\n\n7/ Audit your last 20 posts right now.\n\nTag each one: reach / trust / conversion.\nCount the ratio.\nAdjust before you post again.\n\n8/ What's your honest content ratio?\n\nMost creators have never thought about this. And it's the only thing that actually explains why some accounts scale — and others just plateau.`,
  },
  {
    platform: "LinkedIn",
    type: "Long Post",
    badge: "Professional",
    charCount: "~640 chars",
    iconType: "linkedin",
    content: `I used to think more content meant faster growth.\n\nI believed that for 6 months. Posted every single day. Burned out completely.\n\nAlmost nothing to show for it.\n\nHere's what I got wrong ↓\n\nThe algorithm doesn't reward volume.\n\nIt rewards signals: watch time, saves, profile visits.\n\nOne post that earns saves is worth more than 30 posts that get scrolled past.\n\nI rebuilt my strategy around a single question:\n"Would someone save this to come back to later?"\n\nContent output dropped 70%.\nRevenue doubled in 90 days.\n\nThe framework isn't complicated. The discipline to ignore vanity metrics is.\n\nWhat would you cut if you could only post twice a week?`,
  },
  {
    platform: "Instagram",
    type: "Caption",
    badge: "Casual",
    charCount: "~390 chars",
    iconType: "instagram",
    content: `POV: you finally figure out why your content isn't converting 🧠\n\nSpoiler: it's not your niche.\nIt's not your posting time.\nIt's not even your hook.\n\nIt's your content mix.\n\nThe ratio that actually works:\n→ 60% reach content (hooks, trends)\n→ 30% trust content (stories, opinions)\n→ 10% direct offers\n\nMost creators never post trust content. Ever.\n\nSave this for when you're wondering why your account stopped growing 📌`,
  },
  {
    platform: "YouTube",
    type: "Title Ideas",
    badge: "5 options",
    charCount: "~295 chars",
    iconType: "youtube",
    wide: true,
    content: `1. "I Posted Less and My Channel Grew 3x (Here's the Data)"\n2. "The Content Ratio Nobody Teaches But Every Big Creator Uses"\n3. "Why Your Best Posts Have the Lowest Reach"\n4. "I Studied 100 Creator Accounts — Here's the Pattern"\n5. "Stop Making More Content — Do This Instead"`,
  },
];
