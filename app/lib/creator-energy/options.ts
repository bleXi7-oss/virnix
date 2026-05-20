import type { CreatorEnergy, CreatorEnergyId } from "./types";

export const CREATOR_ENERGIES: readonly CreatorEnergy[] = [
  {
    id: "tactical",
    label: "Tactical",
    tagline: "Steps · Tips · Takeaways",
    promptDirective:
      "Make outputs save-worthy and practical. Prioritize clear steps, concrete takeaways, and useful mechanisms. Every platform output should leave the viewer with something they can act on immediately.",
  },
  {
    id: "contrarian",
    label: "Contrarian",
    tagline: "Challenge · Reframe · Flip",
    promptDirective:
      "Lead with the assumption most people have wrong. Find the sharpest reframe in the transcript. Take a clear, defensible position — don't hedge.",
  },
  {
    id: "analytical",
    label: "Analytical",
    tagline: "Mechanism · Pattern · Why",
    promptDirective:
      "Explain the mechanism underneath the insight. Name the pattern, the cause-effect, or the system that makes this true. Prioritize understanding over inspiration.",
  },
  {
    id: "reflective",
    label: "Reflective",
    tagline: "Meaning · Identity · Worldview",
    promptDirective:
      "Draw out the deeper meaning or identity-level shift in the transcript. Outputs should invite the viewer to see themselves or their situation differently — not just learn a fact.",
  },
  {
    id: "relatable",
    label: "Relatable",
    tagline: "Story · Emotion · Human",
    promptDirective:
      "Find the human tension in the transcript — the moment of doubt, confusion, confession, or turning point. Let the emotional truth and story beats lead before the lesson.",
  },
  {
    id: "harsh-truth",
    label: "Harsh Truth",
    tagline: "Direct · Uncomfortable · Grounded",
    promptDirective:
      "Name the uncomfortable truth in the transcript plainly. Be direct without being cruel. Punchy framing — no softening, no hedging — but grounded in what the transcript actually says.",
  },
] as const;

export const VALID_ENERGY_IDS = new Set<string>(CREATOR_ENERGIES.map((e) => e.id));

export function isValidEnergyId(id: unknown): id is CreatorEnergyId {
  return typeof id === "string" && VALID_ENERGY_IDS.has(id);
}
