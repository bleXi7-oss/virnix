// Virnix Intelligence Layer — Prompt Context Connector
//
// Bridges the static intelligence data to the prompt builder.
// Returns a small set of short directive strings that get injected into the
// GENERATION PROFILE block of buildPrompt() / buildAdvancedPrompt().
//
// Design rules:
//   - No side effects. Pure function — same angle produces a valid result every call.
//   - Strings are kept short (<100 chars each) to minimise token cost.
//   - Story arc is deterministic per angle — structural choice, not random enrichment.
//   - Hook formula and retention rule use pickRandom — variety improves output diversity.
//
// How to extend:
//   - Add new angles to ANGLE_TO_FRAMEWORK_INDEX when EmotionalAngle grows.
//   - To inject platform-specific hints, export buildPlatformHint(platform) and
//     call it inline within each platform section in buildPrompt().

import type { EmotionalAngle } from "../prompts/variation";
import { pickRandom } from "../prompts/variation";
import { CURIOSITY_GAP_FORMULAS } from "./hooks";
import { MIDDLE_CONTENT_RULES } from "./retention";
import { STORY_ARC_FRAMEWORKS } from "./storytelling";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromptContext {
  storyArcHint: string;   // "Framework name — short promptApplication"
  hookFormula: string;    // One curiosity gap fill-in template
  retentionRule: string;  // One middle-content guardrail
}

// ─── Angle → story arc mapping ────────────────────────────────────────────────
// Deterministic: each emotional angle maps to the most structurally appropriate
// story arc framework. Index refers to STORY_ARC_FRAMEWORKS array positions.

const ANGLE_TO_FRAMEWORK_INDEX: Record<EmotionalAngle, number> = {
  curiosity:    4, // The Unexpected Discovery
  controversy:  3, // Contrarian Claim + Proof
  authority:    3, // Contrarian Claim + Proof
  vulnerability:2, // Confession + Lesson
  storytelling: 0, // Before / After / Bridge
  urgency:      1, // Problem / Agitate / Solve
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildPromptContext(angle: EmotionalAngle): PromptContext {
  const framework = STORY_ARC_FRAMEWORKS[ANGLE_TO_FRAMEWORK_INDEX[angle]];
  const storyArcHint = `${framework.name} — ${framework.promptApplication}`;

  return {
    storyArcHint,
    hookFormula:   pickRandom(CURIOSITY_GAP_FORMULAS),
    retentionRule: pickRandom(MIDDLE_CONTENT_RULES),
  };
}

// ─── Formatter ────────────────────────────────────────────────────────────────
// Returns the block that gets appended to the GENERATION PROFILE in buildPrompt().

export function formatPromptContext(ctx: PromptContext): string {
  return `Story arc: ${ctx.storyArcHint}
Hook formula: ${ctx.hookFormula}
Retention: ${ctx.retentionRule}`;
}
