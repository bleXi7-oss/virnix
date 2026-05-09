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
  "Analyzing transcript...",
  "Detecting viral moments...",
  "Generating hooks...",
  "Creating threads...",
] as const;

export const OUTPUT_CARDS: OutputCardData[] = [
  {
    platform: "TikTok / Reels",
    type: "Hook Script",
    badge: "60 sec",
    charCount: "~310 chars",
    iconType: "tiktok",
    content: `HOOK: "Nobody talks about this — I only discovered it by accident.\n\nI've been turning 2-hour podcast episodes into 30 pieces of content every day. Takes less than 60 seconds."\n\nCUT TO: Here's the exact system...`,
  },
  {
    platform: "Twitter / X",
    type: "Thread",
    badge: "8 tweets",
    charCount: "~2,100 chars",
    iconType: "x",
    content: `1/ I spent 90 days turning podcast episodes into viral content.\n\nHere's everything I learned (most creators get this wrong):\n\n2/ The biggest mistake: trying to summarize the whole episode.\n\nViral content = ONE insight, told really well.`,
  },
  {
    platform: "LinkedIn",
    type: "Long Post",
    badge: "Professional",
    charCount: "~680 chars",
    iconType: "linkedin",
    content: `Most people treat podcasts as entertainment.\n\nI treat them as a content goldmine.\n\nHere's the repurposing system that grew my audience 3x in 90 days ↓\n\n1. Listen once, highlight 5 moments\n2. Turn each into a hook\n3. Expand into a full post`,
  },
  {
    platform: "Instagram",
    type: "Caption",
    badge: "Casual",
    charCount: "~420 chars",
    iconType: "instagram",
    content: `POV: you discovered 1 podcast = 30 pieces of content 🎙️\n\nThe creator hack nobody tells you:\n→ Grab the 3 best quotes\n→ Turn each into a hook\n→ Add your perspective\n→ Post daily for a week\n\nYou just turned 2 hrs of audio into a week of content 🔥`,
  },
  {
    platform: "YouTube",
    type: "Title Ideas",
    badge: "5 options",
    charCount: "~320 chars",
    iconType: "youtube",
    wide: true,
    content: `1. "I Turned 1 Podcast Into 30 Viral Posts (Full System)"\n2. "How Top Creators Post 5x/Day Without Burning Out"\n3. "The AI Content System That Changed My Business"\n4. "Stop Wasting Podcast Episodes — Do This Instead"\n5. "The 60-Second Repurposing Method Nobody Talks About"`,
  },
];
