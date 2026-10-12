"use client";

import { AudioLines, ChevronDown, Loader2, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VOICES, type Preferences } from "@/lib/preferences";
import { supabase } from "@/lib/supabase/client";
import { Button, Card } from "./ui";

export type Episode = { day: string; script: string; duration: number; url: string | null };

// The signed-in person's saved episodes (newest first), with temporary play links.
export function useEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase()
        .from("briefings")
        .select("day, script, duration_seconds, audio_path")
        .order("day", { ascending: false })
        .limit(8);
      const rows = data ?? [];
      const { data: links } = rows.length
        ? await supabase()
            .storage.from("briefings")
            .createSignedUrls(
              rows.map((r) => r.audio_path),
              60 * 60,
            )
        : { data: [] };
      if (cancelled) return;
      setEpisodes(
        rows.map((r, i) => ({
          day: r.day,
          script: r.script,
          duration: r.duration_seconds,
          url: links?.[i]?.signedUrl ?? null,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { episodes, reload };
}

// Today's episode: play it if it's ready, or make it now.
export function TodayEpisode({
  prefs,
  episodes,
  onMade,
}: {
  prefs: Preferences;
  episodes: Episode[] | null;
  onMade: () => void;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: prefs.timeZone });
  const episode = episodes?.find((e) => e.day === today);
  const [working, setWorking] = useState<"episode" | "sample" | null>(null);
  const [sample, setSample] = useState<{ url: string; script: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voice = VOICES.find((v) => v.id === prefs.voice)?.name;

  // Free the sample recording's memory when it's replaced.
  useEffect(() => () => void (sample && URL.revokeObjectURL(sample.url)), [sample]);

  async function make(kind: "episode" | "sample") {
    setWorking(kind);
    setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample: kind === "sample" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't make your briefing. Try again.");
      if (kind === "sample") {
        const bytes = Uint8Array.from(atob(data.sample.audio), (c) => c.charCodeAt(0));
        setSample({ url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })), script: data.sample.script });
      } else {
        setSample(null);
        onMade();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make your briefing. Try again.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Card className="sunrise p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Today&apos;s episode</p>
          <p className="mt-1 text-lg font-semibold">
            {episode ? formatDuration(episode.duration) : `About ${prefs.length} minutes`} · {voice} voice
          </p>
        </div>
        <AudioLines className="size-5 shrink-0 text-orange-500" aria-hidden />
      </div>

      {working ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
          <Loader2 className="size-5 animate-spin text-orange-500" aria-hidden />
          {working === "sample"
            ? "Recording a short sample…"
            : "Gathering headlines and recording today's episode. This can take a minute or two."}
        </div>
      ) : sample ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium">Short sample (not saved)</p>
          <audio controls autoPlay src={sample.url} className="w-full" />
          <Script text={sample.script} />
        </div>
      ) : episode?.url ? (
        <div className="mt-5 space-y-3">
          <audio controls src={episode.url} className="w-full" />
          <Script text={episode.script} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {episodes === null
            ? "Checking for today's episode…"
            : "Today's episode isn't recorded yet. Make it now, or try a short sample to check the voice."}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}

      {!working && episodes !== null && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant={episode ? "outline" : "brand"} onClick={() => void make("episode")}>
            {episode ? <RotateCcw className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {episode ? "Remake today's episode" : "Make today's episode"}
          </Button>
          <Button variant="ghost" onClick={() => void make("sample")}>
            Short sample
          </Button>
        </div>
      )}
    </Card>
  );
}

// The past week's episodes, newest first, excluding today.
export function PastEpisodes({ prefs, episodes }: { prefs: Preferences; episodes: Episode[] | null }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: prefs.timeZone });
  const past = (episodes ?? []).filter((e) => e.day !== today).slice(0, 7);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">Past episodes</h2>
      <p className="mt-1 text-sm text-zinc-500">The last 7 days. Older episodes are removed automatically.</p>
      {episodes === null ? null : past.length === 0 ? (
        <Card className="mt-6 p-6 text-sm text-zinc-600 dark:text-zinc-400">
          No past episodes yet. Each day&apos;s episode will appear here for a week.
        </Card>
      ) : (
        <Card className="mt-6 divide-y divide-zinc-900/5 dark:divide-white/10">
          {past.map((e) => (
            <EpisodeRow key={e.day} episode={e} open={open === e.day} onToggle={() => setOpen(open === e.day ? null : e.day)} />
          ))}
        </Card>
      )}
    </section>
  );
}

function EpisodeRow({ episode, open, onToggle }: { episode: Episode; open: boolean; onToggle: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const title = new Date(`${episode.day}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={!episode.url}
          onClick={() => {
            if (!open) onToggle();
            const el = audio.current;
            if (el) {
              if (el.paused) void el.play();
              else el.pause();
            }
          }}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
        >
          {playing ? <Pause className="size-4 fill-current" aria-hidden /> : <Play className="ml-0.5 size-4 fill-current" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-zinc-500">{formatDuration(episode.duration)}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/10"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>
      <div className={open ? "mt-4 space-y-3" : "hidden"}>
        {episode.url && (
          <audio
            ref={audio}
            controls
            preload="none"
            src={episode.url}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="w-full"
          />
        )}
        <Script text={episode.script} />
      </div>
    </div>
  );
}

function Script({ text }: { text: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-orange-700 dark:text-orange-300">Read the script</summary>
      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-white/70 p-4 text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
        {text.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s.toString().padStart(2, "0")} s` : `${s} s`;
}
