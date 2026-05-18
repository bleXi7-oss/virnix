// Virnix Intelligence Layer — Storytelling Frameworks
//
// This module provides story arc structures and scene-building mechanics.
// It goes deeper than the STORYTELLING_PATTERNS in prompts/psychology/,
// which lists high-level patterns for injection into system prompts.
// This module captures the structural blueprints — the WHAT before the HOW.
//
// Future prompt use:
//   - Pick a framework matching the variation angle and use it to shape the
//     narrative arc in buildPrompt() tone directives
//   - Use SCENE_BUILDING_TECHNIQUES to improve TikTok scripts and shortform content
//   - Use TRANSFORMATION_ARCS to inform the vulnerability and storytelling angles

// ─── Story arc frameworks ─────────────────────────────────────────────────────

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

// ─── Scene-building techniques ────────────────────────────────────────────────
// How to place the reader in a moment rather than just describing it.
// The difference between "I had a bad day" and "It was 11pm. I had 3 hours left."

export const SCENE_BUILDING_TECHNIQUES = [
  {
    name: "time-and-place anchor",
    description: "Specific time and location grounds the scene instantly",
    weak: "I was struggling with my business.",
    strong: "It was a Thursday in March. I had $200 in the account.",
  },
  {
    name: "sensory detail",
    description: "One specific physical detail makes abstract moments feel real",
    weak: "I was stressed checking my metrics.",
    strong: "I refreshed the dashboard. Same number. Again.",
  },
  {
    name: "internal monologue",
    description: "Naming what you were thinking creates immediate intimacy",
    weak: "I didn't know what to do.",
    strong: "I kept thinking: this can't be how it works for everyone.",
  },
  {
    name: "before-state contrast",
    description: "Establish who you were before to make the after feel earned",
    weak: "Things were different back then.",
    strong: "I used to post every day and check my phone every 10 minutes.",
  },
] as const;

// ─── Transformation arc patterns ──────────────────────────────────────────────
// Every viral creator story is fundamentally a transformation story.
// These are the transformation types that resonate most.

export const TRANSFORMATION_ARCS = [
  {
    type: "belief-flip",
    description: "I was certain about X. I was wrong. Here's what actually changed my mind.",
    emotionalCore: "intellectual humility + earned wisdom",
    bestAngle: "vulnerability or controversy",
  },
  {
    type: "identity-shift",
    description: "I used to be the kind of person who did X. Now I do Y. The gap is the insight.",
    emotionalCore: "aspiration + relatability",
    bestAngle: "storytelling or vulnerability",
  },
  {
    type: "system-discovery",
    description: "I did it the hard way for years. Then I found the system. Here's the system.",
    emotionalCore: "authority + relief",
    bestAngle: "authority or curiosity",
  },
  {
    type: "failure-to-framework",
    description: "I failed at this many times. The pattern in my failures became the framework.",
    emotionalCore: "trust + specificity",
    bestAngle: "vulnerability or authority",
  },
  {
    type: "outsider-advantage",
    description: "Because I didn't come from this field, I didn't inherit its assumptions. That's why it worked.",
    emotionalCore: "contrarian + permission",
    bestAngle: "controversy or storytelling",
  },
] as const;
