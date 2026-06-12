"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

type SaveState = "idle" | "saving" | "saved" | "error";

interface BrainData {
  displayName?: string;
  niche?: string;
  targetAudience?: string;
  primaryPlatforms?: string[];
  toneDescription?: string;
  styleNotes?: string;
  brandNotes?: string;
  forbiddenPhrases?: string;
  writingExamples?: string;
}

function hasContent(d: BrainData): boolean {
  return !!(
    d.displayName || d.niche || d.targetAudience || d.toneDescription ||
    d.styleNotes || d.brandNotes || d.forbiddenPhrases || d.writingExamples ||
    (d.primaryPlatforms?.length ?? 0) > 0
  );
}

export default function CreatorBrainPanel({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platformsRaw, setPlatformsRaw] = useState("");
  const [toneDescription, setToneDescription] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [brandNotes, setBrandNotes] = useState("");
  const [forbiddenPhrases, setForbiddenPhrases] = useState("");
  const [writingExamples, setWritingExamples] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/creator-brain")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.data) {
          const d: BrainData = json.data;
          setDisplayName(d.displayName ?? "");
          setNiche(d.niche ?? "");
          setTargetAudience(d.targetAudience ?? "");
          setPlatformsRaw((d.primaryPlatforms ?? []).join(", "));
          setToneDescription(d.toneDescription ?? "");
          setStyleNotes(d.styleNotes ?? "");
          setBrandNotes(d.brandNotes ?? "");
          setForbiddenPhrases(d.forbiddenPhrases ?? "");
          setWritingExamples(d.writingExamples ?? "");
          setConfigured(hasContent(d));
        }
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, [user]);

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  async function handleSave() {
    if (saveState === "saving") return;
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaveState("saving");
    setSaveError(null);

    const platforms = platformsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const payload: BrainData = {};
    if (displayName.trim()) payload.displayName = displayName.trim();
    if (niche.trim()) payload.niche = niche.trim();
    if (targetAudience.trim()) payload.targetAudience = targetAudience.trim();
    if (platforms.length) payload.primaryPlatforms = platforms;
    if (toneDescription.trim()) payload.toneDescription = toneDescription.trim();
    if (styleNotes.trim()) payload.styleNotes = styleNotes.trim();
    if (brandNotes.trim()) payload.brandNotes = brandNotes.trim();
    if (forbiddenPhrases.trim()) payload.forbiddenPhrases = forbiddenPhrases.trim();
    if (writingExamples.trim()) payload.writingExamples = writingExamples.trim();

    try {
      const res = await fetch("/api/creator-brain", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setSaveState("error");
        setSaveError(json.error ?? "Save failed. Please try again.");
        return;
      }
      setConfigured(hasContent(payload));
      setSaveState("saved");
      savedTimer.current = setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setSaveError("Network error — please try again.");
    }
  }

  if (!user || !fetched) return null;

  return (
    <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <span className="text-[11px]">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Creator Brain</span>
          <span className="text-zinc-400 dark:text-zinc-600"> · </span>
          {configured ? (
            <span className="text-emerald-600 dark:text-emerald-500">Configured ✓</span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600">Teach Virnix your voice →</span>
          )}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`shrink-0 text-zinc-400 transition-transform dark:text-zinc-600 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M1.5 3.5l3.5 3.5 3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
              Teach Virnix your voice
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
              Add your audience and style notes so outputs sound more like you.
              Optional — generation works without it.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <BrainField label="Your name or brand" placeholder="Alex Chen" value={displayName} onChange={setDisplayName} />
            <BrainField label="Niche / topic" placeholder="SaaS growth, fitness..." value={niche} onChange={setNiche} />
          </div>
          <BrainField label="Target audience" placeholder="Who are you talking to?" value={targetAudience} onChange={setTargetAudience} />
          <BrainField label="Primary platforms (comma-separated)" placeholder="YouTube, LinkedIn, TikTok" value={platformsRaw} onChange={setPlatformsRaw} />
          <BrainField label="Voice & tone" placeholder="Direct, no-fluff, slightly informal..." value={toneDescription} onChange={setToneDescription} />
          <BrainField label="Style notes" placeholder="Short sentences, punchy hooks, no buzzwords..." value={styleNotes} onChange={setStyleNotes} />
          <BrainField label="Brand context" placeholder="Anti-corporate, evidence-based, contrarian..." value={brandNotes} onChange={setBrandNotes} />
          <BrainField label="Words / phrases to avoid" placeholder="synergy, leverage, game-changer..." value={forbiddenPhrases} onChange={setForbiddenPhrases} />
          <BrainTextArea
            label="Writing examples (optional)"
            placeholder="Paste 1–3 posts you've written. Stored for style reference — never copied verbatim into outputs."
            value={writingExamples}
            onChange={setWritingExamples}
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveState === "saving"}
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saveState === "saving" ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />
                  Saving...
                </span>
              ) : (
                "Save profile"
              )}
            </button>
            {saveState === "saved" && (
              <span className="text-[12px] text-emerald-600 dark:text-emerald-500">Saved ✓</span>
            )}
            {saveState === "error" && saveError && (
              <span className="text-[12px] text-red-500 dark:text-red-400">{saveError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-zinc-200 bg-white/50 px-3 py-2 text-[13px] text-zinc-700 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:placeholder-zinc-600 dark:focus:border-zinc-600";
const LABEL_CLS = "mb-1 block text-[11px] text-zinc-400 dark:text-zinc-600";

function BrainField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLS}
      />
    </label>
  );
}

function BrainTextArea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`${INPUT_CLS} resize-none`}
      />
    </label>
  );
}
