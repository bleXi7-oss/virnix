// ─── Virnix Analytics ─────────────────────────────────────────────────────────
//
// Lightweight event tracking foundation — no external services attached yet.
// All events are typed and logged to the console in development.
//
// To wire in a real provider, replace the body of track() once:
//
//   PostHog:    posthog.capture(event, properties)
//   Mixpanel:   mixpanel.track(event, properties)
//   Amplitude:  amplitude.track(event, properties)
//   Custom API: fetch("/api/events", { method: "POST", body: JSON.stringify({ event, properties }) })
//
// The public API (track, AnalyticsEvent, EventProperties) never needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | "generate_clicked"
  | "example_clicked"
  | "generation_completed"
  | "copy_clicked"
  | "invalid_url"
  | "generation_failed"
  | "theme_changed";

// Per-event property shapes — TypeScript enforces the right properties per event.
export type EventProperties = {
  generate_clicked:     { url: string };
  example_clicked:      { label: string; url: string };
  generation_completed: { duration_ms: number; card_count: number };
  copy_clicked:         { platform: string };
  invalid_url:          { url: string };
  generation_failed:    { error: string };
  theme_changed:        { theme: "light" | "dark" };
};

export function track<E extends AnalyticsEvent>(
  event: E,
  properties: EventProperties[E]
): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, properties);
  }
  // Future: analytics_provider.capture(event, properties)
}
