"use client";

import { useRef, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";

// ─── constants ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Analyzing transcript...",
  "Detecting viral moments...",
  "Generating hooks...",
  "Creating threads...",
] as const;

interface CardDef {
  platform: string;
  type: string;
  badge: string;
  charCount: string;
  content: string;
  iconType: "x" | "linkedin" | "tiktok" | "instagram" | "youtube";
  wide?: boolean;
}

const OUTPUT_CARDS: CardDef[] = [
  {
    platform: "TikTok / Reels",
    type: "Hook Script",
    badge: "60 sec",
    charCount: "~310 chars",
    iconType: "tiktok",
    content: `HOOK: "Nobody talks about this — I only discovered it by accident.\n\nI've been turning 2-hour podcast episodes into 30 pieces of content every day. Takes less than 60 seconds."\n\nCUT TO: Here's the exact system...`,
  },
  {
    platform: "Twitter / X",
    type: "Thread",
    badge: "8 tweets",
    charCount: "~2,100 chars",
    iconType: "x",
    content: `1/ I spent 90 days turning podcast episodes into viral content.\n\nHere's everything I learned (most creators get this wrong):\n\n2/ The biggest mistake: trying to summarize the whole episode.\n\nViral content = ONE insight, told really well.`,
  },
  {
    platform: "LinkedIn",
    type: "Long Post",
    badge: "Professional",
    charCount: "~680 chars",
    iconType: "linkedin",
    content: `Most people treat podcasts as entertainment.\n\nI treat them as a content goldmine.\n\nHere's the repurposing system that grew my audience 3x in 90 days ↓\n\n1. Listen once, highlight 5 moments\n2. Turn each into a hook\n3. Expand into a full post`,
  },
  {
    platform: "Instagram",
    type: "Caption",
    badge: "Casual",
    charCount: "~420 chars",
    iconType: "instagram",
    content: `POV: you discovered 1 podcast = 30 pieces of content 🎙️\n\nThe creator hack nobody tells you:\n→ Grab the 3 best quotes\n→ Turn each into a hook\n→ Add your perspective\n→ Post daily for a week\n\nYou just turned 2 hrs of audio into a week of content 🔥`,
  },
  {
    platform: "YouTube",
    type: "Title Ideas",
    badge: "5 options",
    charCount: "~320 chars",
    iconType: "youtube",
    wide: true,
    content: `1. "I Turned 1 Podcast Into 30 Viral Posts (Full System)"\n2. "How Top Creators Post 5x/Day Without Burning Out"\n3. "The AI Content System That Changed My Business"\n4. "Stop Wasting Podcast Episodes — Do This Instead"\n5. "The 60-Second Repurposing Method Nobody Talks About"`,
  },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function PlatformIcon({ type }: { type: CardDef["iconType"] }) {
  if (type === "x") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-white">
        𝕏
      </div>
    );
  }
  if (type === "linkedin") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0077b5] text-[10px] font-bold text-white">
        in
      </div>
    );
  }
  if (type === "tiktok") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-pink-500 to-orange-400">
        <span className="text-[8px] font-bold text-white">▶</span>
      </div>
    );
  }
  if (type === "instagram") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500">
        <span className="text-[9px] font-bold text-white">▣</span>
      </div>
    );
  }
  if (type === "youtube") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#FF0000]">
        <span className="text-[8px] font-bold text-white">▶</span>
      </div>
    );
  }
  return null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
    >
      {copied ? (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function OutputCard({ card, index }: { card: CardDef; index: number }) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-zinc-200 bg-white p-5 opacity-0 animate-[fade-in-up_0.45s_ease_forwards] hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:hover:border-zinc-700${card.wide ? " sm:col-span-2 lg:col-span-2" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
            {card.platform}
          </span>
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            {card.type}
          </span>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {card.badge}
        </span>
      </div>

      <p className="flex-1 whitespace-pre-line text-[13px] leading-[1.65] text-zinc-600 dark:text-zinc-400">
        {card.content}
      </p>

      <div className="mt-5 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/50">
        <PlatformIcon type={card.iconType} />
        <span className="text-[11px] text-zinc-500 dark:text-zinc-600">
          Ready
        </span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-700">
          {card.charCount}
        </span>
        <div className="ml-auto">
          <CopyButton text={card.content} />
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "loading" | "done";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleGenerate() {
    if (phase === "loading") return;

    // Clear any leftover timers from a previous run
    timersRef.current.forEach(clearTimeout);

    setPhase("loading");
    setStepIndex(0);

    timersRef.current = [
      setTimeout(() => setStepIndex(1), 750),
      setTimeout(() => setStepIndex(2), 1450),
      setTimeout(() => setStepIndex(3), 2100),
      setTimeout(() => setPhase("done"), 2750),
    ];
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-white">
      {/* Ambient top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(ellipse_75%_55%_at_50%_-5%,rgba(255,255,255,0.07),transparent)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center px-4 pt-16 pb-28">
        {/* Top bar */}
        <div className="relative mb-16 flex w-full max-w-2xl items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600">
            VIRNIX
          </p>
          <div className="absolute right-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero card */}
        <div className="relative w-full max-w-2xl">
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-zinc-300/40 via-zinc-200/10 to-transparent dark:from-zinc-600/25 dark:via-zinc-800/10"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-colors duration-300 dark:border-zinc-800/80 dark:bg-[#0a0a0a] dark:shadow-[0_40px_80px_rgba(0,0,0,0.9)] md:p-12">
            {/* Eyebrow */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                AI Content Engine
              </span>
            </div>

            <h1 className="mb-5 text-[2.5rem] font-bold leading-[1.1] tracking-[-0.03em] md:text-[3.4rem]">
              Turn 1 podcast into{" "}
              <span className="text-zinc-400 dark:text-zinc-500">
                30 viral posts
              </span>{" "}
              in 60 seconds.
            </h1>

            <p className="mb-9 max-w-sm text-[15px] leading-[1.75] text-zinc-600 dark:text-zinc-500 md:max-w-md">
              Paste any YouTube link — get threads, captions, and short-form
              scripts ready to post. No editing. No rewriting.
            </p>

            {/* Input row */}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="group flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3.5 transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-600">
                <svg
                  width="18"
                  height="14"
                  viewBox="0 0 18 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M17.6 2.18A2.26 2.26 0 0 0 16.02.58C14.62.18 9 .18 9 .18S3.38.18 1.98.58A2.26 2.26 0 0 0 .4 2.18C0 3.6 0 6.59 0 6.59s0 3 .4 4.41a2.26 2.26 0 0 0 1.58 1.6C3.38 13 9 13 9 13s5.62 0 7.02-.4a2.26 2.26 0 0 0 1.58-1.6C18 9.59 18 6.59 18 6.59s0-3-.4-4.41ZM7.2 9.43V3.75l4.68 2.84L7.2 9.43Z"
                    fill="#FF0000"
                  />
                </svg>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={phase === "loading"}
                  className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none disabled:opacity-50 dark:text-white dark:placeholder-zinc-600"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={phase === "loading"}
                className="cursor-pointer whitespace-nowrap rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_4px_20px_rgba(0,0,0,0.07)] transition-all hover:bg-zinc-800 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_4px_32px_rgba(0,0,0,0.12)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 dark:bg-white dark:text-black dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_20px_rgba(255,255,255,0.07)] dark:hover:bg-zinc-50 dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_4px_32px_rgba(255,255,255,0.13)]"
              >
                {phase === "loading" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  "Generate Content"
                )}
              </button>
            </div>

            <p className="mt-4 text-[12px] text-zinc-400 dark:text-zinc-700">
              No account required &middot; Works with any YouTube podcast
            </p>
          </div>
        </div>

        {/* ── Loading steps ── */}
        {phase === "loading" && (
          <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.3s_ease_forwards]">
            <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-[#0a0a0a]">
              <div className="space-y-3.5">
                {LOADING_STEPS.map((label, i) => {
                  if (i > stepIndex) return null;
                  const isDone = i < stepIndex;
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-3 animate-[fade-in-up_0.3s_ease_forwards]"
                    >
                      {isDone ? (
                        <svg
                          className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent dark:border-zinc-600" />
                      )}
                      <span
                        className={`text-sm ${
                          isDone
                            ? "text-zinc-400 dark:text-zinc-600"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Generated output ── */}
        {phase === "done" && (
          <>
            <div className="mt-10 mb-5 flex w-full max-w-2xl items-center gap-4 animate-[fade-in_0.4s_ease_forwards]">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-700">
                Generated Output
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
            </div>

            <div className="w-full max-w-2xl grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OUTPUT_CARDS.map((card, i) => (
                <OutputCard key={card.platform} card={card} index={i} />
              ))}
            </div>

            <button
              onClick={handleGenerate}
              className="mt-8 cursor-pointer text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400"
            >
              Generate again ↺
            </button>
          </>
        )}

        {/* ── Idle hint ── */}
        {phase === "idle" && (
          <p className="mt-10 text-center text-[12px] text-zinc-400 dark:text-zinc-600">
            Generates &middot; TikTok Hook &middot; X Thread &middot; LinkedIn
            Post &middot; Instagram Caption &middot; YouTube Titles
          </p>
        )}
      </div>
    </div>
  );
}
