"use client";

import { useRef, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import OutputCard from "./components/OutputCard";
import { LOADING_STEPS } from "./lib/outputCards";
import type { OutputCardData } from "./lib/outputCards";
import type { GenerateResponse } from "./lib/types/generation";
import { isValidYouTubeUrl } from "./lib/youtube";

type Phase = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [url, setUrl] = useState("");
  const [cards, setCards] = useState<OutputCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animDoneRef = useRef(false);
  const apiResultRef = useRef<OutputCardData[] | null>(null);

  // Called by both the animation timer and the API response handler.
  // Only proceeds once both have finished — whichever is last wins.
  function tryFinish() {
    if (animDoneRef.current && apiResultRef.current !== null) {
      setCards(apiResultRef.current);
      setPhase("done");
    }
  }

  async function handleGenerate() {
    if (phase === "loading") return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please paste a YouTube URL to get started.");
      return;
    }
    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError("That doesn't look like a YouTube URL. Try youtube.com/watch?v=... or youtu.be/...");
      return;
    }

    timersRef.current.forEach(clearTimeout);
    animDoneRef.current = false;
    apiResultRef.current = null;
    setPhase("loading");
    setStepIndex(0);
    setError(null);
    setCards([]);

    timersRef.current = [
      setTimeout(() => setStepIndex(1), 750),
      setTimeout(() => setStepIndex(2), 1450),
      setTimeout(() => setStepIndex(3), 2100),
      setTimeout(() => {
        animDoneRef.current = true;
        tryFinish();
      }, 2750),
    ];

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ youtubeUrl: trimmedUrl }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json: GenerateResponse = await res.json();
      if (!json.ok) throw new Error(json.error);

      apiResultRef.current = json.data.cards;
      tryFinish();
    } catch (err) {
      timersRef.current.forEach(clearTimeout);
      setPhase("error");
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  function handleReset() {
    timersRef.current.forEach(clearTimeout);
    setPhase("idle");
    setError(null);
    setCards([]);
    setStepIndex(-1);
  }

  function handleUrlChange(val: string) {
    setUrl(val);
    if (error && phase === "idle") setError(null);
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

        <HeroCard
          phase={phase}
          url={url}
          onUrlChange={handleUrlChange}
          onGenerate={handleGenerate}
          error={phase === "idle" ? error : null}
        />

        {phase === "loading" && <LoadingPanel stepIndex={stepIndex} />}

        {phase === "done" && (
          <OutputPanel cards={cards} onGenerateAgain={handleGenerate} />
        )}

        {phase === "error" && (
          <ErrorPanel message={error} onRetry={handleReset} />
        )}

        {phase === "idle" && !error && (
          <p className="mt-10 text-center text-[12px] text-zinc-400 dark:text-zinc-600">
            Generates &middot; TikTok Hook &middot; X Thread &middot; LinkedIn
            Post &middot; Instagram Caption &middot; YouTube Titles
          </p>
        )}
      </div>
    </div>
  );
}

// ─── HeroCard ─────────────────────────────────────────────────────────────────

function HeroCard({
  phase,
  url,
  onUrlChange,
  onGenerate,
  error,
}: {
  phase: Phase;
  url: string;
  onUrlChange: (val: string) => void;
  onGenerate: () => void;
  error: string | null;
}) {
  return (
    <div className="relative w-full max-w-2xl">
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-zinc-300/40 via-zinc-200/10 to-transparent dark:from-zinc-600/25 dark:via-zinc-800/10"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-colors duration-300 dark:border-zinc-800/80 dark:bg-[#0a0a0a] dark:shadow-[0_40px_80px_rgba(0,0,0,0.9)] md:p-12">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            AI Content Engine
          </span>
        </div>

        <h1 className="mb-5 text-[2.5rem] font-bold leading-[1.1] tracking-[-0.03em] md:text-[3.4rem]">
          Turn 1 podcast into{" "}
          <span className="text-zinc-400 dark:text-zinc-500">30 viral posts</span>{" "}
          in 60 seconds.
        </h1>

        <p className="mb-9 max-w-sm text-[15px] leading-[1.75] text-zinc-600 dark:text-zinc-500 md:max-w-md">
          Paste any YouTube link — get threads, captions, and short-form scripts
          ready to post. No editing. No rewriting.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="group flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3.5 transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-600">
            <YouTubeIcon />
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              disabled={phase === "loading"}
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none disabled:opacity-50 dark:text-white dark:placeholder-zinc-600"
            />
          </div>
          <GenerateButton phase={phase} onClick={onGenerate} />
        </div>

        <p className="mt-4 text-[12px]">
          {error ? (
            <span className="text-red-500 dark:text-red-400">{error}</span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-700">
              No account required &middot; Works with any YouTube podcast
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── LoadingPanel ──────────────────────────────────────────────────────────────

function LoadingPanel({ stepIndex }: { stepIndex: number }) {
  return (
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
  );
}

// ─── OutputPanel ──────────────────────────────────────────────────────────────

function OutputPanel({
  cards,
  onGenerateAgain,
}: {
  cards: OutputCardData[];
  onGenerateAgain: () => void;
}) {
  return (
    <>
      <div className="mt-10 mb-5 flex w-full max-w-2xl items-center gap-4 animate-[fade-in_0.4s_ease_forwards]">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-700">
          Generated Output
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <OutputCard key={card.platform} card={card} index={i} />
        ))}
      </div>

      <button
        onClick={onGenerateAgain}
        className="mt-8 cursor-pointer text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        Generate again ↺
      </button>
    </>
  );
}

// ─── ErrorPanel ───────────────────────────────────────────────────────────────

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.3s_ease_forwards]">
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          {message ?? "Something went wrong. Please try again."}
        </p>
        <button
          onClick={onRetry}
          className="mt-3 cursor-pointer text-[12px] font-medium text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          ← Try again
        </button>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function YouTubeIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path
        d="M17.6 2.18A2.26 2.26 0 0 0 16.02.58C14.62.18 9 .18 9 .18S3.38.18 1.98.58A2.26 2.26 0 0 0 .4 2.18C0 3.6 0 6.59 0 6.59s0 3 .4 4.41a2.26 2.26 0 0 0 1.58 1.6C3.38 13 9 13 9 13s5.62 0 7.02-.4a2.26 2.26 0 0 0 1.58-1.6C18 9.59 18 6.59 18 6.59s0-3-.4-4.41ZM7.2 9.43V3.75l4.68 2.84L7.2 9.43Z"
        fill="#FF0000"
      />
    </svg>
  );
}

function GenerateButton({
  phase,
  onClick,
}: {
  phase: Phase;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
  );
}
