// Strongly typed schemas for all AI output platforms.
// Each schema describes the exact shape the AI provider should return.
// Validators + coercers guard against missing/malformed fields without throwing.

// ─── Best Angle schema (Use This First layer) ──────────────────────────────────

export interface BestAngleVariants {
  curiosity: string;   // opens a question the reader wants answered
  contrarian: string;  // challenges what the audience currently believes
  tactical: string;    // leads with a specific action or data point
  reflective: string;  // speaks to identity or meaning shift
  punchy: string;      // ultra-short, nothing wasted
}

export interface BestAngle {
  hook: string;          // strongest hook, ~60 chars, in output language
  why: string;           // 1-2 sentences why it works, in output language
  caution: string;       // 1 sentence risk/limitation, in output language
  best_platform: string; // "TikTok / Reels" | "LinkedIn" | "Twitter / X" | "Instagram"
  hook_variants: BestAngleVariants;
}

// Returns null if hook or why is empty — card is hidden rather than partially rendered.
export function coerceBestAngle(raw: unknown): BestAngle | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const str = (val: unknown): string =>
    typeof val === "string" && val.trim() ? val.trim() : "";

  const hook = str(obj.hook);
  const why = str(obj.why);
  if (!hook || !why) return null;

  const caution = str(obj.caution);
  const best_platform = str(obj.best_platform) || "TikTok / Reels";

  const v =
    typeof obj.hook_variants === "object" && obj.hook_variants !== null
      ? (obj.hook_variants as Record<string, unknown>)
      : {};

  const hook_variants: BestAngleVariants = {
    curiosity:  str(v.curiosity)  || hook,
    contrarian: str(v.contrarian) || hook,
    tactical:   str(v.tactical)   || hook,
    reflective: str(v.reflective) || hook,
    punchy:     str(v.punchy)     || hook,
  };

  return { hook, why, caution, best_platform, hook_variants };
}

// ─── Core platform schemas (always generated) ─────────────────────────────────

export interface TikTokSchema {
  content: string; // ~300 chars, hook script ending with "Here's the exact system..."
}

export interface TwitterSchema {
  content: string; // ~2000 chars, 8-tweet thread numbered 1/ through 8/
}

export interface LinkedInSchema {
  content: string; // ~600 chars, professional post with line breaks
}

export interface InstagramSchema {
  content: string; // ~400 chars, casual caption with arrows and CTA
}

export interface YouTubeTitlesSchema {
  content: string; // 5 title ideas numbered 1-5, ~300 chars total
}

// ─── Extended platform schemas (behind advanced_outputs flag) ─────────────────

export interface ShortFormScriptSchema {
  // ~500 chars, structured script: HOOK → BODY → CTA with scene direction
  content: string;
}

export interface YouTubeTimestampsSchema {
  // Chapter markers, e.g. "0:00 Introduction\n1:23 Key insight\n..."
  content: string;
}

export interface BlogSummarySchema {
  // ~800 chars, blog post summary: intro + 3 key points + conclusion
  content: string;
}

// ─── Composite output types ───────────────────────────────────────────────────

// The 5 core outputs — always requested from the AI
export interface CoreAIOutput {
  tiktok: TikTokSchema;
  twitter: TwitterSchema;
  linkedin: LinkedInSchema;
  instagram: InstagramSchema;
  youtube: YouTubeTitlesSchema;
}

// The 3 extended outputs — only requested when advanced_outputs flag is on.
// tiktok_alt / youtube_alt are optional: when present they are scored against
// the primary outputs and the stronger one is selected before returning to the UI.
export interface AdvancedAIOutput {
  shortform: ShortFormScriptSchema;
  timestamps: YouTubeTimestampsSchema;
  blog: BlogSummarySchema;
  tiktok_alt?: TikTokSchema;
  youtube_alt?: YouTubeTitlesSchema;
}

// Full output: core always present, advanced fields optional
export type FullAIOutput = CoreAIOutput & Partial<AdvancedAIOutput>;

// ─── JSON schema strings (injected into system prompt) ────────────────────────

export const CORE_OUTPUT_SCHEMA = `{
  "best_angle": {
    "hook": "<strongest hook from this transcript, ~60 chars, in the output language>",
    "why": "<1-2 sentences why this hook works for this specific content, in the output language>",
    "caution": "<1 sentence potential limitation or what to watch for, in the output language>",
    "best_platform": "<TikTok / Reels | LinkedIn | Twitter / X | Instagram>",
    "hook_variants": {
      "curiosity":  "<curiosity-driven hook, ~60 chars, in the output language>",
      "contrarian": "<assumption-challenging hook, ~60 chars, in the output language>",
      "tactical":   "<action or data-led hook, ~60 chars, in the output language>",
      "reflective": "<identity or meaning-driven hook, ~60 chars, in the output language>",
      "punchy":     "<ultra-short punchy hook, ~30 chars, in the output language>"
    }
  },
  "tiktok":    { "content": "<60-sec hook script, ~300 chars>" },
  "twitter":   { "content": "<8-tweet thread numbered 1/ through 8/, ~2000 chars>" },
  "linkedin":  { "content": "<professional post with line breaks, ~600 chars>" },
  "instagram": { "content": "<casual caption with arrows and CTA, ~400 chars>" },
  "youtube":   { "content": "<5 title ideas numbered 1-5, ~300 chars total>" }
}`;

export const ADVANCED_OUTPUT_SCHEMA = `{
  "best_angle": {
    "hook": "<strongest hook from this transcript, ~60 chars, in the output language>",
    "why": "<1-2 sentences why this hook works for this specific content, in the output language>",
    "caution": "<1 sentence potential limitation or what to watch for, in the output language>",
    "best_platform": "<TikTok / Reels | LinkedIn | Twitter / X | Instagram>",
    "hook_variants": {
      "curiosity":  "<curiosity-driven hook, ~60 chars, in the output language>",
      "contrarian": "<assumption-challenging hook, ~60 chars, in the output language>",
      "tactical":   "<action or data-led hook, ~60 chars, in the output language>",
      "reflective": "<identity or meaning-driven hook, ~60 chars, in the output language>",
      "punchy":     "<ultra-short punchy hook, ~30 chars, in the output language>"
    }
  },
  "tiktok":     { "content": "<60-sec hook script, ~300 chars>" },
  "tiktok_alt": { "content": "<alternate hook with different emotional angle, ~300 chars>" },
  "twitter":    { "content": "<8-tweet thread numbered 1/ through 8/, ~2000 chars>" },
  "linkedin":   { "content": "<professional post with line breaks, ~600 chars>" },
  "instagram":  { "content": "<casual caption with arrows and CTA, ~400 chars>" },
  "youtube":    { "content": "<5 title ideas numbered 1-5, ~300 chars total>" },
  "youtube_alt":{ "content": "<alternate 5 title ideas with different curiosity style, ~300 chars>" },
  "shortform":  { "content": "<30-sec structured script HOOK→BODY→CTA, ~500 chars>" },
  "timestamps": { "content": "<YouTube chapter markers '0:00 Intro\\n1:23 ...', ~300 chars>" },
  "blog":       { "content": "<blog summary: intro + 3 key points + conclusion, ~800 chars>" }
}`;

// ─── Validation ───────────────────────────────────────────────────────────────

const CORE_KEYS: (keyof CoreAIOutput)[] = [
  "tiktok",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
];

function hasContent(val: unknown): val is { content: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "content" in val &&
    typeof (val as Record<string, unknown>).content === "string"
  );
}

export function validateCoreOutput(raw: unknown): raw is CoreAIOutput {
  if (typeof raw !== "object" || raw === null) return false;
  return CORE_KEYS.every((key) =>
    hasContent((raw as Record<string, unknown>)[key])
  );
}

// Returns a valid CoreAIOutput; any missing/malformed fields fall back to "".
export function coerceCoreOutput(raw: unknown): CoreAIOutput {
  const obj =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const field = (key: string): { content: string } =>
    hasContent(obj[key]) ? (obj[key] as { content: string }) : { content: "" };
  return {
    tiktok: field("tiktok"),
    twitter: field("twitter"),
    linkedin: field("linkedin"),
    instagram: field("instagram"),
    youtube: field("youtube"),
  };
}

// Extracts whichever advanced fields are present; missing fields are omitted.
export function extractAdvancedOutput(raw: unknown): Partial<AdvancedAIOutput> {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  const result: Partial<AdvancedAIOutput> = {};
  if (hasContent(obj.shortform))   result.shortform   = obj.shortform;
  if (hasContent(obj.timestamps))  result.timestamps  = obj.timestamps;
  if (hasContent(obj.blog))        result.blog        = obj.blog;
  if (hasContent(obj.tiktok_alt))  result.tiktok_alt  = obj.tiktok_alt;
  if (hasContent(obj.youtube_alt)) result.youtube_alt = obj.youtube_alt;
  return result;
}
