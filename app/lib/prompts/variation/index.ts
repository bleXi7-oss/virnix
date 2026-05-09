// Output variation system for Virnix.
//
// Each call to buildPrompt() picks one emotional angle — this shapes the tone,
// hook style, framing, and CTA consistently across all 5 platforms.
//
// The goal is human unpredictability, not random chaos. Every angle produces
// coherent, high-quality content — just with a different psychological lens.
//
// To add new patterns: append strings to openingStyles or ctaStyles arrays.
// To add a new angle: add a profile to ANGLE_PROFILES and add the key to ANGLES.

export type EmotionalAngle =
  | "curiosity"
  | "controversy"
  | "authority"
  | "vulnerability"
  | "storytelling"
  | "urgency";

interface AngleProfile {
  toneDirective: string;
  openingStyles: readonly string[];
  ctaStyles: readonly string[];
  rhythmDirective: string;
}

const ANGLE_PROFILES: Record<EmotionalAngle, AngleProfile> = {
  curiosity: {
    toneDirective:
      "Create knowledge gaps — hint at what's missing before revealing it. Withhold the key insight one beat longer than comfortable. Make the reader feel like they're about to learn something they should have already known.",
    openingStyles: [
      "Open by naming something most people overlook, then make them earn the explanation",
      "Start with a fragment of the conclusion — force the reader forward to complete the picture",
      "Open with a question that makes the reader feel slightly behind, then answer it",
    ],
    ctaStyles: [
      "End with a question that makes the reader want to find the answer themselves",
      "Mirror the reader's internal question back at them — name the thing they're wondering",
      "Invite the reader to test the insight and report back what they find",
    ],
    rhythmDirective:
      "Short declarative sentence. Longer expansion. Short punch. Let the rhythm create anticipation — each line should make the next feel necessary.",
  },

  controversy: {
    toneDirective:
      "Take a clear, defensible position and hold it. Challenge conventional wisdom directly. Don't hedge. Be willing to be wrong in public — the willingness to take a stance is the whole point.",
    openingStyles: [
      "Open with the popular belief, then immediately challenge it in the same breath",
      "State the contrarian take in the first sentence — no setup, no warm-up, no explanation yet",
      "Name the advice everyone gives, then explain exactly why it backfires",
    ],
    ctaStyles: [
      "Ask readers to share their experience with the approach you're challenging",
      "Invite disagreement — good controversy creates discussion, not just reach",
      "Force a binary: which side are they on? Make them take a position.",
    ],
    rhythmDirective:
      "Bold short statement. Evidence in medium sentences. Short landing punch. No filler between claims — every sentence is a jab.",
  },

  authority: {
    toneDirective:
      "Lead with specific data, results, and earned expertise. No hedging. Replace every vague claim with a number or concrete outcome. Confidence comes from specificity, not bravado.",
    openingStyles: [
      "Open with a specific result: how many, how long, what percentage — the number is the hook",
      "Lead with a pattern across multiple data points: 'across N cases, the same thing kept happening'",
      "Start with the conclusion — state the framework first, then prove it",
    ],
    ctaStyles: [
      "Give readers a framework or next step they can apply today, not someday",
      "Ask what result they're trying to achieve — point them toward the specific method",
      "Name the one metric they should start tracking immediately",
    ],
    rhythmDirective:
      "Confident medium sentences. Bullet points for frameworks. Short punchy closing. No qualifiers like 'I think' or 'probably' — just the claim and the evidence.",
  },

  vulnerability: {
    toneDirective:
      "Open with failure or confession before the insight. Vulnerability earns more trust than credentials. Don't skip straight to the lesson — linger in what actually went wrong first.",
    openingStyles: [
      "Start with the mistake — what went wrong before the breakthrough, without glossing it over",
      "Open with the embarrassing version of events, not the polished retrospective",
      "Lead with 'I was completely wrong about this' — then earn the right to explain what changed",
    ],
    ctaStyles: [
      "Ask readers to share something they used to believe that turned out to be wrong",
      "Invite them to share a similar mistake — normalize the experience before offering the lesson",
      "Acknowledge the difficulty first, then close with the path forward",
    ],
    rhythmDirective:
      "Personal, conversational rhythm. Short honest sentences that don't over-explain. Longer sentences for the earned lesson. Final short line that lands the transformation quietly.",
  },

  storytelling: {
    toneDirective:
      "Build a scene. Set up a moment in time with real stakes. Create a before-state, a turning point, and an after-state. Make the reader feel the moment — not just understand it intellectually.",
    openingStyles: [
      "Start with a specific moment in time — place the reader in the scene before explaining anything",
      "Open with the before-state: who you were and what you believed before you knew this",
      "Set up the tension: 'I was about to make the same mistake again, when...'",
    ],
    ctaStyles: [
      "Ask readers what moment changed their perspective on this topic",
      "Invite them to share where they are in the story right now — the before or the after",
      "Ask what they would tell their past self about this if they could go back",
    ],
    rhythmDirective:
      "Slow setup to place the reader, accelerating middle as stakes rise, sharp landing. Use specific detail in the opening. Let the rhythm match the emotional weight of the moment.",
  },

  urgency: {
    toneDirective:
      "Create real stakes. Make clear why this matters now — not eventually, not someday. Urgency isn't hype — it's honestly naming what the reader is already losing while they wait.",
    openingStyles: [
      "Open by naming what the reader is already losing right now — frame the delay itself as the cost",
      "Start with the window that's closing — not as marketing, but as an honest observation",
      "Lead with who's already doing this and what they're compounding while others hesitate",
    ],
    ctaStyles: [
      "Ask what they're waiting for — make the cost of inaction feel real and specific",
      "Close with the simplest possible next step: one thing to do in the next hour",
      "Ask what would change if they applied this in the next 7 days — make the timeline concrete",
    ],
    rhythmDirective:
      "Short urgent sentences. Build pace through the middle. Land on a single sharp action. Never let it feel like a sales pitch — urgency from a friend who genuinely sees what's at stake.",
  },
};

const ANGLES: readonly EmotionalAngle[] = [
  "curiosity",
  "controversy",
  "authority",
  "vulnerability",
  "storytelling",
  "urgency",
];

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export interface VariationContext {
  angle: EmotionalAngle;
  toneDirective: string;
  openingStyle: string;
  ctaStyle: string;
  rhythmDirective: string;
}

export function pickVariation(): VariationContext {
  const angle = pickRandom(ANGLES);
  const profile = ANGLE_PROFILES[angle];
  return {
    angle,
    toneDirective: profile.toneDirective,
    openingStyle: pickRandom(profile.openingStyles),
    ctaStyle: pickRandom(profile.ctaStyles),
    rhythmDirective: profile.rhythmDirective,
  };
}

export function formatVariationBlock(ctx: VariationContext): string {
  return `Emotional angle: ${ctx.angle}
Tone: ${ctx.toneDirective}
Opening: ${ctx.openingStyle}
CTA: ${ctx.ctaStyle}
Rhythm: ${ctx.rhythmDirective}`;
}
