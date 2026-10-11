"use client";

import { AlarmClock, ExternalLink, Pencil, Play, RefreshCw, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Headline } from "@/lib/topics";
import { VOICES, type Preferences } from "@/lib/preferences";
import { SOURCES } from "@/lib/sources";
import { useNow } from "@/lib/use-now";
import { AppShell } from "./app-shell";
import { formatTime } from "./preference-fields";
import { Card } from "./ui";

type TopicResult = { id: string; label: string; headlines: Headline[]; error: boolean };

export function BriefingPage() {
  return <AppShell>{(prefs) => <Briefing prefs={prefs} />}</AppShell>;
}

function Briefing({ prefs }: { prefs: Preferences }) {
  const now = useNow();
  const query = new URLSearchParams({
    topics: prefs.topics.join(","),
    sources: prefs.sources.join(","),
    only: prefs.onlyMySources ? "1" : "0",
  }).toString();

  const [result, setResult] = useState<{ query: string; topics?: TopicResult[]; failed?: boolean } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/headlines?${query}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => !cancelled && setResult({ query, topics: data.topics }))
      .catch(() => !cancelled && setResult({ query, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [query, reload]);

  const loading = !result || result.query !== query;
  const voice = VOICES.find((v) => v.id === prefs.voice)?.name;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-widest text-orange-600 dark:text-orange-400">
          {now?.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) ?? " "}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          {greeting(now)}, <span className="font-display font-normal italic">{prefs.name}</span>
        </h1>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="sunrise p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Your audio briefing</p>
              <p className="mt-1 text-lg font-semibold">
                {prefs.length} minutes · {voice} voice
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-900/[.06] px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              Coming soon
            </span>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <button
              disabled
              aria-label="Play briefing (coming soon)"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-zinc-900 text-white opacity-40 dark:bg-white dark:text-zinc-900"
            >
              <Play className="ml-0.5 size-6 fill-current" aria-hidden />
            </button>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Spoken briefings are the next thing we&apos;re building. Until then, here are the headlines it will
              cover.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
            <AlarmClock className="size-4" aria-hidden />
            Next briefing
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{nextBriefing(prefs, now)}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {describeDays(prefs.days)} at {formatTime(prefs.listenTime)}
          </p>
          <Link
            href="/settings"
            className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-orange-700 hover:underline dark:text-orange-300"
          >
            <Pencil className="size-3.5" aria-hidden />
            Change schedule
          </Link>
        </Card>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Today&apos;s headlines</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {prefs.sources.length
                ? prefs.onlyMySources
                  ? "Only from your chosen sources."
                  : "Stories from your chosen sources are marked with a star and listed first."
                : "From outlets across Google News."}
            </p>
          </div>
          <button
            onClick={() => setReload((n) => n + 1)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </button>
        </div>

        {result?.failed && !loading ? (
          <Card className="mt-6 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            Couldn&apos;t load headlines. Check your connection and press Refresh.
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {loading
              ? prefs.topics.map((t) => <SkeletonCard key={t} />)
              : result.topics?.map((t) => <TopicCard key={t.id} topic={t} prefs={prefs} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function TopicCard({ topic, prefs }: { topic: TopicResult; prefs: Preferences }) {
  const isMine = (h: Headline) =>
    prefs.sources.some((d) => h.sourceDomain === d || h.sourceDomain.endsWith(`.${d}`));

  return (
    <Card className="p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{topic.label}</h3>
      {topic.error ? (
        <p className="mt-4 text-sm text-zinc-500">Couldn&apos;t load this topic right now.</p>
      ) : topic.headlines.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No stories from your sources here today. Turn off &ldquo;Only use my sources&rdquo; in{" "}
          <Link href="/settings" className="underline">
            settings
          </Link>{" "}
          to see more.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-900/5 dark:divide-white/10">
          {topic.headlines.map((h) => (
            <li key={h.link}>
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group -mx-2 block rounded-lg px-2 py-3 hover:bg-zinc-900/[.03] dark:hover:bg-white/5"
              >
                <span className="flex items-start gap-2">
                  <span className="text-[15px] font-medium leading-snug group-hover:underline">{h.title}</span>
                  <ExternalLink className="mt-1 size-3.5 shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100" aria-hidden />
                </span>
                <span className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  {isMine(h) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-0.5 font-medium text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
                      <Star className="size-3 fill-current" aria-label="Your source" />
                    </span>
                  )}
                  {sourceName(h)}
                  {h.published && <span aria-hidden>·</span>}
                  {h.published && <TimeAgo iso={h.published} />}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-zinc-900/10 dark:bg-white/10" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="mt-5 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-900/[.07] dark:bg-white/10" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-900/5 dark:bg-white/5" />
        </div>
      ))}
    </Card>
  );
}

function TimeAgo({ iso }: { iso: string }) {
  const now = useNow();
  if (!now) return null;
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  const label = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
  return <time dateTime={iso}>{label}</time>;
}

function sourceName(h: Headline) {
  return SOURCES.find((s) => h.sourceDomain === s.domain || h.sourceDomain.endsWith(`.${s.domain}`))?.name ?? h.source;
}

function greeting(now: Date | null) {
  const h = now?.getHours() ?? 9;
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeDays(days: number[]) {
  const key = [...days].sort().join("");
  if (key === "0123456") return "Every day";
  if (key === "12345") return "Weekdays";
  if (key === "06") return "Weekends";
  return days
    .slice()
    .sort()
    .map((d) => DAY_NAMES[d].slice(0, 3))
    .join(", ");
}

function nextBriefing(prefs: Preferences, now: Date | null) {
  if (!now) return " ";
  const [h, m] = prefs.listenTime.split(":").map(Number);
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    d.setHours(h, m, 0, 0);
    if (d > now && prefs.days.includes(d.getDay())) {
      const time = formatTime(prefs.listenTime);
      if (offset === 0) return `Today, ${time}`;
      if (offset === 1) return `Tomorrow, ${time}`;
      return `${DAY_NAMES[d.getDay()]}, ${time}`;
    }
  }
  return "Not scheduled";
}
