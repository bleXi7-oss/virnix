// Output cleanup rules — applied globally to strip AI writing patterns from every platform.

export const CLEANUP_RULES = [
  "Strip filler: 'It's important to note that', 'As we can see', 'In conclusion'",
  "One idea per sentence — split compound sentences at 'and' or 'but'",
  "Active voice: 'Creators use this' not 'This is used by creators'",
  "Cut the last sentence — first drafts always end one beat too late",
  "Remove throat-clearing: 'So basically', 'What I mean is', 'The thing is'",
  "Contrast creates tension: one short punchy sentence. Then a longer one that earns it.",
] as const;
