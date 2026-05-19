// Strongly typed schemas for all AI output platforms.
// Each schema describes the exact shape the AI provider should return.
// Validators + coercers guard against missing/malformed fields without throwing.

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
  "tiktok":    { "content": "<60-sec hook script, ~300 chars>" },
  "twitter":   { "content": "<8-tweet thread numbered 1/ through 8/, ~2000 chars>" },
  "linkedin":  { "content": "<professional post with line breaks, ~600 chars>" },
  "instagram": { "content": "<casual caption with arrows and CTA, ~400 chars>" },
  "youtube":   { "content": "<5 title ideas numbered 1-5, ~300 chars total>" }
}`;

export const ADVANCED_OUTPUT_SCHEMA = `{
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
