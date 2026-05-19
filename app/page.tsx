"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ThemeToggle from "./components/ThemeToggle";
import OutputCard from "./components/OutputCard";
import { LOADING_STEPS } from "./lib/outputCards";
import type { OutputCardData } from "./lib/outputCards";
import type { GenerateResponse } from "./lib/types/generation";
import { isValidYouTubeUrl } from "./lib/youtube";
import { track } from "./lib/analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import DebugPanel from "./components/DebugPanel";
import ClipGuide from "./components/generation/ClipGuide";
import TranscriptQualityCard from "./components/generation/TranscriptQualityCard";
import type { AIDiagnostics } from "./lib/ai/diagnostics";
import type { TimelineMoment } from "./lib/timeline/types";
import type { TranscriptQualityReport } from "./lib/timeline/transcript-quality";

type Phase = "idle" | "loading" | "done" | "error";

const EXAMPLES = [
  { label: "Simon Sinek · TEDx", url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA" },
  { label: "Steve Jobs · Stanford", url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc" },
] as const;

function extractYouTubeUrl(text: string): string | null {
  const trimmed = text.trim();
  if (isValidYouTubeUrl(trimmed)) return trimmed;
  const match = trimmed.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s]+|youtu\.be\/[^\s]+)/
  );
  return match ? match[0] : null;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [url, setUrl] = useState("");
  const [cards, setCards] = useState<OutputCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<AIDiagnostics | null>(null);
  const [timelineMoments, setTimelineMoments] = useState<TimelineMoment[] | null>(null);
  const [transcriptQuality, setTranscriptQuality] = useState<TranscriptQualityReport | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animDoneRef = useRef(false);
  const apiResultRef = useRef<OutputCardData[] | null>(null);
  const genStartRef = useRef<number>(0);

  const tryFinish = useCallback(() => {
    if (animDoneRef.current && apiResultRef.current !== null) {
      setCards(apiResultRef.current);
      setPhase("done");
    }
  }, []);

  const runGeneration = useCallback(async (targetUrl: string) => {
    timersRef.current.forEach(clearTimeout);
    animDoneRef.current = false;
    apiResultRef.current = null;
    genStartRef.current = Date.now();
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
        body: JSON.stringify({ youtubeUrl: targetUrl }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json: GenerateResponse = await res.json();
      if (!json.ok) throw new Error(json.error);

      apiResultRef.current = json.data.cards;
      setDiagnostics(json.data.diagnostics ?? null);
      setTimelineMoments(json.data.timelineMoments ?? null);
      setTranscriptQuality(json.data.transcriptQuality ?? null);
      track("generation_completed", {
        duration_ms: Date.now() - genStartRef.current,
        card_count: json.data.cards.length,
      });
      tryFinish();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      track("generation_failed", { error: message });
      timersRef.current.forEach(clearTimeout);
      setPhase("error");
      setError(message);
    }
  }, [tryFinish]);

  const handleGenerate = useCallback(async () => {
    if (phase === "loading") return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Paste a YouTube URL above to get started.");
      return;
    }
    if (!isValidYouTubeUrl(trimmedUrl)) {
      track("invalid_url", { url: trimmedUrl });
      setError(
        "That doesn't look like a YouTube URL. Try youtube.com/watch?v=... or youtu.be/..."
      );
      return;
    }
    track("generate_clicked", { url: trimmedUrl });
    await runGeneration(trimmedUrl);
  }, [phase, url, runGeneration]);

  function handleExampleSelect(exampleUrl: string, exampleLabel: string) {
    if (phase === "loading") return;
    track("example_clicked", { label: exampleLabel, url: exampleUrl });
    setUrl(exampleUrl);
    setError(null);
    void runGeneration(exampleUrl);
  }

  function handlePaste(pasted: string) {
    if (phase === "loading") return;
    setUrl(pasted);
    setError(null);
    setTimeout(() => void runGeneration(pasted), 200);
  }

  const handleReset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    setPhase("idle");
    setError(null);
    setCards([]);
    setStepIndex(-1);
    setDiagnostics(null);
    setTimelineMoments(null);
    setTranscriptQuality(null);
  }, []);

  function handleUrlChange(val: string) {
    setUrl(val);
    if (error && phase !== "loading") setError(null);
  }

  const handleClearUrl = useCallback(() => {
    setUrl("");
    setError(null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f8f6] text-zinc-900 dark:bg-black dark:text-white">

      {/* Cinematic atmospheric layer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] overflow-hidden" aria-hidden="true">
        {/* Pearl chrome atmosphere — light mode */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-5%,rgba(170,170,200,0.22),rgba(185,185,215,0.06)_55%,transparent_80%)]" />
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_55%_100%_at_50%_0%,rgba(200,200,225,0.14),transparent)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(155,155,195,0.55),transparent)]" />
          <Image
            src="/banner.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%] [filter:grayscale(1)_brightness(1.8)] opacity-[0.22] mix-blend-multiply"
          />
        </div>
        {/* Black chrome wave — dark mode */}
        <div className="absolute inset-0 hidden dark:block">
          <Image
            src="/banner.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_25%] opacity-[0.10]"
          />
        </div>
        {/* Bottom fade to page background */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-[#f8f8f6] dark:from-black to-transparent" />
        {/* Subtle top vignette */}
        <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-[#f8f8f6]/60 dark:from-black/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 pt-12 pb-28 sm:pt-16">

        {/* Top bar */}
        <div className="relative mb-14 flex w-full max-w-2xl items-center justify-center sm:mb-16">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Virnix"
              width={20}
              height={20}
              className="rounded-full opacity-100 dark:opacity-70"
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-600">
              VIRNIX
            </p>
          </div>
          <div className="absolute right-0">
            <ThemeToggle />
          </div>
        </div>

        <HeroCard
          phase={phase}
          url={url}
          onUrlChange={handleUrlChange}
          onGenerate={handleGenerate}
          onExampleSelect={handleExampleSelect}
          onPaste={handlePaste}
          onClearUrl={handleClearUrl}
          error={phase === "idle" ? error : null}
        />

        {phase === "loading" && <LoadingPanel stepIndex={stepIndex} url={url} />}

        {phase === "done" && (
          <>
            {transcriptQuality && (
              <TranscriptQualityCard report={transcriptQuality} />
            )}
            {timelineMoments && timelineMoments.length > 0 && (
              <ClipGuide moments={timelineMoments} />
            )}
            <ErrorBoundary>
              <OutputPanel cards={cards} onReset={handleReset} />
            </ErrorBoundary>
            <DebugPanel diagnostics={diagnostics} timelineMoments={timelineMoments} />
          </>
        )}

        {phase === "error" && <ErrorPanel message={error} onRetry={handleReset} />}

        {phase === "idle" && !error && <PlatformList />}
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
  onExampleSelect,
  onPaste,
  onClearUrl,
  error,
}: {
  phase: Phase;
  url: string;
  onUrlChange: (val: string) => void;
  onGenerate: () => void;
  onExampleSelect: (url: string, label: string) => void;
  onPaste: (pasted: string) => void;
  onClearUrl: () => void;
  error: string | null;
}) {
  const trimmedUrl = url.trim();
  const isValidUrl = trimmedUrl.length > 0 && isValidYouTubeUrl(trimmedUrl);

  function handleInputPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const youtubeUrl = extractYouTubeUrl(text);
    if (youtubeUrl) {
      e.preventDefault();
      onPaste(youtubeUrl);
    }
  }

  let hintText: React.ReactNode;
  if (error) {
    hintText = <span className="text-red-500 dark:text-red-400">{error}</span>;
  } else if (isValidUrl) {
    hintText = (
      <span className="text-emerald-600 dark:text-emerald-500">
        YouTube URL detected — press Enter or Generate to continue
      </span>
    );
  } else {
    hintText = (
      <span className="text-zinc-400 dark:text-zinc-700">
        No account required · Works with any captioned YouTube video
      </span>
    );
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* Chrome border glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-b from-zinc-300/40 via-zinc-200/10 to-transparent dark:from-zinc-600/20 dark:via-zinc-800/5"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-zinc-200/70 bg-white/75 p-8 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_56px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors duration-300 dark:border-zinc-700/40 dark:bg-[#0a0a0a]/80 dark:backdrop-blur-xl dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_100px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-12">

        <h1 className="mb-5 text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em] md:text-[3.6rem]">
          Turn 1 podcast into{" "}
          <span className="text-zinc-500 dark:text-zinc-600">30 viral posts</span>{" "}
          in 60 seconds.
        </h1>

        <p className="mb-9 max-w-sm text-[15px] leading-[1.75] text-zinc-500 dark:text-zinc-500 md:max-w-md">
          Paste a YouTube link. Get the strongest moments, smart clips, and
          ready-to-post content for every platform.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div
            className={`group flex flex-1 items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
              isValidUrl
                ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800/60 dark:bg-emerald-950/15"
                : "border-zinc-200 bg-white focus-within:border-zinc-400 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-600 dark:focus-within:shadow-none"
            }`}
          >
            {isValidUrl ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            ) : (
              <YouTubeIcon />
            )}
            <input
              type="url"
              placeholder="Paste a YouTube URL..."
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onGenerate()}
              onPaste={handleInputPaste}
              disabled={phase === "loading"}
              className="flex-1 bg-transparent text-base text-zinc-900 placeholder-zinc-400 outline-none disabled:opacity-50 sm:text-sm dark:text-white dark:placeholder-zinc-600"
            />
            {url && phase !== "loading" && (
              <button
                onClick={onClearUrl}
                aria-label="Clear URL"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-400"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <GenerateButton phase={phase} onClick={onGenerate} />
        </div>

        {phase === "idle" && <ExamplesRow onSelect={onExampleSelect} currentUrl={url} />}

        <p className="mt-4 text-[12px]">{hintText}</p>
      </div>
    </div>
  );
}

// ─── ExamplesRow ──────────────────────────────────────────────────────────────

function ExamplesRow({
  onSelect,
  currentUrl,
}: {
  onSelect: (url: string, label: string) => void;
  currentUrl: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-[11px] text-zinc-400 dark:text-zinc-600">Try:</span>
      {EXAMPLES.map(({ label, url }) => {
        const isActive = currentUrl === url;
        return (
          <button
            key={url}
            onClick={() => onSelect(url, label)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] transition-all ${
              isActive
                ? "border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                : "border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── LoadingPanel ──────────────────────────────────────────────────────────────

const ProgressBar = memo(function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mb-5 h-px w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
      <div
        className="h-full bg-linear-to-r from-zinc-300 to-zinc-400 transition-[width] duration-2400 ease-out dark:from-zinc-700 dark:to-zinc-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

function LoadingPanel({ stepIndex, url }: { stepIndex: number; url: string }) {
  const videoId = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.3s_ease_forwards]">
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.03)]">
        <ProgressBar />

        {videoId && (
          <p className="mb-4 font-mono text-[10px] text-zinc-400 dark:text-zinc-700">
            youtu.be/{videoId}
          </p>
        )}

        <div className="space-y-3.5">
          {LOADING_STEPS.map((label, i) => {
            if (i > stepIndex) return null;
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
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
                  className={`text-sm transition-colors ${
                    isDone
                      ? "text-zinc-400 dark:text-zinc-600"
                      : isActive
                        ? "font-medium text-zinc-800 dark:text-zinc-200"
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
  onReset,
}: {
  cards: OutputCardData[];
  onReset: () => void;
}) {
  return (
    <>
      <div className="mt-10 mb-5 w-full max-w-2xl animate-[fade-in_0.4s_ease_forwards]">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
          <div className="flex items-center gap-2">
            <svg
              className="h-3 w-3 text-emerald-500"
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
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
              {cards.length} pieces ready to post
            </span>
          </div>
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
        </div>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <OutputCard key={`${card.platform}-${card.type}`} card={card} index={i} />
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
        Copy any card · {cards.length} platforms covered
      </p>

      <button
        onClick={onReset}
        className="mt-3 cursor-pointer text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        ← Try another URL
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

// ─── PlatformList ─────────────────────────────────────────────────────────────

const PlatformList = memo(function PlatformList() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2">
      {["TikTok", "Twitter / X", "LinkedIn", "Instagram", "YouTube"].map((name) => (
        <span
          key={name}
          className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-700"
        >
          {name}
        </span>
      ))}
    </div>
  );
});

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

const GenerateButton = memo(function GenerateButton({
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
      className="cursor-pointer whitespace-nowrap rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.14),0_4px_24px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.07)] transition-all hover:bg-zinc-800 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.20),0_8px_32px_rgba(0,0,0,0.20)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 dark:bg-white dark:text-black dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_4px_24px_rgba(255,255,255,0.08)] dark:hover:bg-zinc-50 dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.20),0_8px_40px_rgba(255,255,255,0.14)]"
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
});
