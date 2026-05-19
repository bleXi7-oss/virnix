// Formatting utilities for timeline moments.
//
// formatTimelineMomentsForPrompt: compact block for optional AI prompt injection.
//   Returns "" when empty — safe to concatenate unconditionally.
//   Capped at 3 high-priority moments (~80 tokens).
//
// selectMomentsForPrompt: filters moments to the 3 most prompt-worthy ones.
//   Exported for diagnostics (count injected without re-running format).
//
// formatMomentReport: beautiful creator-readable block for a single moment.
// formatMomentsReport: full report for all detected moments (UI / debug display).

import type { TimelineMoment, MomentType } from "./types";

// Moment types that consistently produce strong AI outputs when used as anchors.
// Ordered by prompt effectiveness — validation hooks and reframes ground the AI
// in real psychological content vs. generic advice.
const PROMPT_PRIORITY_TYPES: ReadonlySet<MomentType> = new Set<MomentType>([
  "validation_hook",
  "mechanism_reframe",
  "emotional_confession",
  "contrarian_insight",
  "transformation_moment",
  "story_turning_point",
  "fomo_loss_frame",
]);

// Humanized platform labels for compact prompt display.
const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
  shorts: "Shorts",
};

// Selects up to 3 moments most useful as prompt creative anchors.
// Priority types come first; generic types (educational_gem, authority_proof,
// quote_moment) are only included as fallback when confidence is high (≥40).
export function selectMomentsForPrompt(moments: TimelineMoment[]): TimelineMoment[] {
  const priority = moments.filter(
    (m) => PROMPT_PRIORITY_TYPES.has(m.momentType) && m.confidenceScore >= 25
  );
  const fallback = moments.filter(
    (m) => !PROMPT_PRIORITY_TYPES.has(m.momentType) && m.confidenceScore >= 40
  );
  return [...priority, ...fallback].slice(0, 3);
}

// Compact prompt block that grounds the AI in the transcript's strongest moments.
// Returns "" when no moments qualify — safe to append without guards.
// Capped at 3 moments × ~25 tokens each ≈ ~80 tokens total.
export function formatTimelineMomentsForPrompt(moments: TimelineMoment[]): string {
  if (moments.length === 0) return "";

  const selected = selectMomentsForPrompt(moments);
  if (selected.length === 0) return "";

  const lines = selected.map((m) => {
    const hook = m.suggestedHook.length > 110
      ? m.suggestedHook.slice(0, 110) + "…"
      : m.suggestedHook;
    const type = m.momentType.replace(/_/g, " ");
    const platforms = m.platformFit
      .slice(0, 2)
      .map((p) => PLATFORM_LABELS[p] ?? p)
      .join("/");
    return `- "${hook}" [${type} · ${platforms}]`;
  });

  return `TRANSCRIPT HIGHLIGHTS — draw from these moments as creative anchors, don't copy verbatim:\n${lines.join("\n")}`;
}

export function formatMomentReport(m: TimelineMoment): string {
  const platforms = m.platformFit.slice(0, 3).join(" / ");
  const score = m.confidenceScore;
  const bar = scoreBar(score);

  return [
    `${m.startTime}–${m.endTime}  ${bar}`,
    `▸ ${m.title}`,
    `  ${m.sourceTextPreview}${m.sourceTextPreview.length >= 120 ? "…" : ""}`,
    ``,
    `  Why it works:`,
    `  ${m.whyItWorks}`,
    ``,
    `  Suggested hook:`,
    `  "${m.suggestedHook}"`,
    ``,
    `  Best for: ${platforms}`,
    `  Use as:   ${m.contentUse}`,
  ].join("\n");
}

export function formatMomentsReport(moments: TimelineMoment[]): string {
  if (moments.length === 0) return "";

  const header = `BEST CLIP OPPORTUNITIES — ${moments.length} moment${moments.length === 1 ? "" : "s"} found`;
  const divider = "─".repeat(50);

  const blocks = moments.map((m) => formatMomentReport(m));

  return [header, divider, ...blocks.join(`\n\n${divider}\n\n`).split("\n")].join("\n");
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 20);
  return "█".repeat(filled) + "░".repeat(5 - filled) + `  ${score}/100`;
}
