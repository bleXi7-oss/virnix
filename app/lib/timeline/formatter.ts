// Formatting utilities for timeline moments.
//
// formatTimelineMomentsForPrompt: compact block for optional AI prompt injection.
//   Returns "" when empty — safe to concatenate unconditionally.
//   Capped at 5 moments (~60 tokens).
//
// formatMomentReport: beautiful creator-readable block for a single moment.
// formatMomentsReport: full report for all detected moments (UI / debug display).

import type { TimelineMoment } from "./types";

export function formatTimelineMomentsForPrompt(moments: TimelineMoment[]): string {
  if (moments.length === 0) return "";

  const top = moments.slice(0, 5);
  const lines = top.map(
    (m) =>
      `- ${m.startTime}–${m.endTime}: ${m.momentType.replace(/_/g, " ")}, ${m.emotionalTrigger}, ${m.platformFit.slice(0, 2).join("/")} fit`
  );

  return `POTENTIAL CLIP MOMENTS:\n${lines.join("\n")}`;
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
