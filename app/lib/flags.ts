// ─── Virnix Feature Flags ─────────────────────────────────────────────────────
//
// Simple on/off flags for controlling feature rollouts per environment.
// Defaults live here in code. Override any flag without redeploying by setting
// a NEXT_PUBLIC_FLAG_* environment variable in Vercel (or .env.local).
//
// Example .env.local override:
//   NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true
//   NEXT_PUBLIC_FLAG_ANALYTICS_ENABLED=true
//
// To add a new flag:
//   1. Add the name to FeatureFlag below
//   2. Add a default value to DEFAULTS
//   3. Add the env var lookup to resolveFlags()
//   4. Call isEnabled("your_flag") wherever the feature is gated
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureFlag =
  | "real_ai_generation"   // switch from mock cards to live Claude API
  | "advanced_outputs"     // extra output types (blog, timestamps, etc.)
  | "transcript_preview"   // show fetched transcript before generating
  | "analytics_enabled"    // send events to a real analytics provider
  | "experimental_hooks"   // test new hook generation strategies
  | "premium_mode";        // gated features for paid users

type FlagMap = Record<FeatureFlag, boolean>;

// Baseline values — false = off, true = on.
const DEFAULTS: FlagMap = {
  real_ai_generation: false,
  advanced_outputs:   false,
  transcript_preview: false,
  analytics_enabled:  false,
  experimental_hooks: false,
  premium_mode:       false,
};

// Reads a NEXT_PUBLIC_FLAG_* env var and converts it to boolean.
// Returns undefined if the variable is not set, so the default is preserved.
function envBool(key: string): boolean | undefined {
  const val = process.env[key];
  if (val === "true") return true;
  if (val === "false") return false;
  return undefined;
}

// Resolved once at module load — env vars are baked in at build time for
// NEXT_PUBLIC_* variables, so this is safe in both server and client contexts.
function resolveFlags(): FlagMap {
  return {
    real_ai_generation: envBool("NEXT_PUBLIC_FLAG_REAL_AI_GENERATION") ?? DEFAULTS.real_ai_generation,
    advanced_outputs:   envBool("NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS")   ?? DEFAULTS.advanced_outputs,
    transcript_preview: envBool("NEXT_PUBLIC_FLAG_TRANSCRIPT_PREVIEW") ?? DEFAULTS.transcript_preview,
    analytics_enabled:  envBool("NEXT_PUBLIC_FLAG_ANALYTICS_ENABLED")  ?? DEFAULTS.analytics_enabled,
    experimental_hooks: envBool("NEXT_PUBLIC_FLAG_EXPERIMENTAL_HOOKS") ?? DEFAULTS.experimental_hooks,
    premium_mode:       envBool("NEXT_PUBLIC_FLAG_PREMIUM_MODE")        ?? DEFAULTS.premium_mode,
  };
}

const FLAGS = resolveFlags();

export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag];
}
