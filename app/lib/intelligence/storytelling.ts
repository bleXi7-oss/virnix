// Story arc frameworks — injected as storyArcHint in the GENERATION PROFILE.
// Each angle maps deterministically to a framework in prompt-context.ts.

export const STORY_ARC_FRAMEWORKS = [
  {
    name: "Before / After / Bridge",
    structure: ["Before: here's where I/they were", "After: here's where I/they ended up", "Bridge: here's the path that connected them"],
    bestFor: ["LinkedIn posts", "Twitter threads", "TikTok hooks"],
    promptApplication: "Use the 'before' state as the hook — readers project themselves onto it. The bridge is the insight.",
    warning: "Don't skip the before. Content that jumps straight to 'here's what worked' loses the reader's emotional investment.",
  },
  {
    name: "Problem / Agitate / Solve",
    structure: ["Problem: name the pain clearly", "Agitate: make it feel worse before offering relief", "Solve: present the specific solution"],
    bestFor: ["Twitter threads", "YouTube titles", "LinkedIn posts"],
    promptApplication: "The Agitate step is where most AI writing fails — it rushes to the solution. Force lingering in the problem.",
    warning: "Agitation must be honest, not manufactured. Fake urgency destroys trust.",
  },
  {
    name: "Confession + Lesson",
    structure: ["Confession: what you got wrong and how bad it actually was", "Turning point: the moment or discovery that changed it", "Lesson: the transferable insight — not just what worked for you"],
    bestFor: ["LinkedIn posts", "TikTok scripts", "Instagram captions"],
    promptApplication: "The confession earns the lesson. The more specific and embarrassing the failure, the more credible the insight.",
    warning: "Don't skip to the lesson. The confession IS the hook.",
  },
  {
    name: "Contrarian Claim + Proof",
    structure: ["Contrarian claim: the thing that sounds wrong but is true", "Common belief: why everyone assumes the opposite", "Proof: the specific data or experience that confirms the claim"],
    bestFor: ["Twitter threads", "YouTube titles", "LinkedIn posts"],
    promptApplication: "The claim must be specific enough to be disagreeable. 'Most advice is wrong' is not contrarian — it's vague.",
    warning: "The proof must be real and specific. Vague proof destroys the credibility the contrarian claim built.",
  },
  {
    name: "The Unexpected Discovery",
    structure: ["Setup: what you were doing and what you expected to find", "Discovery: what you found instead", "Implication: what it means for the reader"],
    bestFor: ["TikTok scripts", "Instagram captions", "Twitter thread openers"],
    promptApplication: "Lead with the discovery, not the setup. Readers need the surprise in the first 5 words.",
    warning: "The implication must be directly useful — 'interesting' findings without implications lose readers at the end.",
  },
  {
    name: "Stakes Escalation",
    structure: ["Ordinary setup: something that seems low stakes", "Reveal: the actual stakes were much higher", "Resolution: what happened and what it means"],
    bestFor: ["TikTok scripts", "LinkedIn storytelling posts", "YouTube titles"],
    promptApplication: "The stakes reveal is the retention mechanic — it's what keeps readers past the first paragraph.",
    warning: "The stakes must be plausible. Manufactured drama reads as fake immediately.",
  },
] as const;
