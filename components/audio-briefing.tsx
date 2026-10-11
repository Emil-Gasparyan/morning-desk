"use client";

import { AudioLines, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { VOICES, type Preferences } from "@/lib/preferences";
import { Button, Card } from "./ui";

type Result = { url: string; script: string; sample: boolean };

// Dashboard card that makes the briefing on demand and plays it.
// (The daily automatic run comes later; this is the manual version.)
export function AudioBriefing({ prefs }: { prefs: Preferences }) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voice = VOICES.find((v) => v.id === prefs.voice)?.name;

  // Free the previous recording's memory when a new one replaces it.
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result]);

  async function make(sample: boolean) {
    setState("working");
    setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.audio) throw new Error(data.error || "Couldn't make your briefing. Try again.");
      const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      setResult({ url, script: data.script, sample: data.sample });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make your briefing. Try again.");
      setState(result ? "done" : "idle");
    }
  }

  return (
    <Card className="sunrise p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Your audio briefing</p>
          <p className="mt-1 text-lg font-semibold">
            {result?.sample ? "Short sample" : `${prefs.length} minutes`} · {voice} voice
          </p>
        </div>
        <AudioLines className="size-5 shrink-0 text-orange-500" aria-hidden />
      </div>

      {state === "working" ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
          <Loader2 className="size-5 animate-spin text-orange-500" aria-hidden />
          Gathering headlines and recording your briefing. This takes up to a minute.
        </div>
      ) : result ? (
        <div className="mt-5 space-y-3">
          <audio controls autoPlay src={result.url} className="w-full" />
          <details className="group text-sm">
            <summary className="cursor-pointer font-medium text-orange-700 dark:text-orange-300">Read the script</summary>
            <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-white/70 p-4 text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
              {result.script.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Hear today&apos;s headlines read aloud. Start with a short sample to check the voice, then make the full
          briefing.
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}

      {state !== "working" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="brand" onClick={() => void make(false)}>
            <Sparkles className="size-4" aria-hidden />
            {result ? "Make it again" : "Make my briefing"}
          </Button>
          <Button variant="outline" onClick={() => void make(true)}>
            Short sample
          </Button>
        </div>
      )}
    </Card>
  );
}
