// Middle-content rules — injected as retentionRule in the GENERATION PROFILE.
// These prevent mid-thread/mid-post drop-off — the most common failure mode after the hook.

export const MIDDLE_CONTENT_RULES = [
  "Each middle unit (tweet, paragraph, beat) needs its own micro-hook",
  "Alternate between insight and evidence — don't stack 3 claims in a row",
  "Use contrast: short punchy sentence. Then a longer one that earns it.",
  "One tangible example per abstract claim — no more, no less",
  "The best middle content changes how the reader sees the hook retroactively",
  "If you can cut it without losing the argument, cut it",
] as const;
