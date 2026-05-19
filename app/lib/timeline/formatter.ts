// Formatting utilities for timeline moments.
//
// formatTimelineMomentsForPrompt: returns a compact block for optional future
// injection into AI prompts. NOT active by default — caller must decide to use it.
// Returns "" when there are no moments, so safe to concatenate unconditionally.
//
// formatMomentReport: human-readable single-moment report for UI or logging.

import type { TimelineMoment } from "./types";

// Returns a prompt-injectable section listing the top clip moments.
// Capped at 5 moments to keep token cost minimal (~60 tokens at most).
export function formatTimelineMomentsForPrompt(moments: TimelineMoment[]): string {
  if (moments.length === 0) return "";

  const top = moments.slice(0, 5);
  const lines = top.map(
    (m) =>
      `- ${m.startTime}–${m.endTime}: ${m.momentType.replace(/_/g, " ")}, ${m.emotionalTrigger}, ${m.platformFit.slice(0, 2).join("/")} fit`
  );

  return `POTENTIAL CLIP MOMENTS:\n${lines.join("\n")}`;
}

// Formats a single moment as a human-readable block (for UI display or logs).
export function formatMomentReport(m: TimelineMoment): string {
  const platforms = m.platformFit.join(" / ");
  return [
    `${m.startTime}–${m.endTime}`,
    `Moment type: ${m.title}`,
    `Why it works: ${m.whyItWorks}`,
    `Best platform: ${platforms}`,
    `Suggested hook: "${m.suggestedHook}"`,
    `Suggested use: ${m.contentUse}`,
    `Confidence: ${m.confidenceScore}/100`,
  ].join("\n");
}
