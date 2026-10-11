"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { SECTIONS, topicLabel, type Section, type TopicId } from "@/lib/topics";
import { VOICES, type Preferences } from "@/lib/preferences";
import { SOURCE_GROUPS, SOURCES } from "@/lib/sources";
import { Chip } from "./ui";

type FieldProps = {
  prefs: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
};

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export const MAX_TOPICS = 12;

export function TopicFields({ prefs, onChange }: FieldProps) {
  const [custom, setCustom] = useState("");
  const customTopics = prefs.topics.filter((t) => t.startsWith("q:"));
  const full = prefs.topics.length >= MAX_TOPICS;

  function addCustom() {
    const words = custom.trim().replace(/,/g, " ").replace(/\s+/g, " ").slice(0, 60);
    if (!words || full) return;
    const id = `q:${words}` as TopicId;
    if (!prefs.topics.some((t) => t.toLowerCase() === id.toLowerCase())) {
      onChange({ topics: [...prefs.topics, id] });
    }
    setCustom("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SECTIONS) as Section[]).map((id) => {
          const on = prefs.topics.includes(id);
          return (
            <Chip
              key={id}
              selected={on}
              disabled={!on && full}
              onClick={() => onChange({ topics: toggle(prefs.topics, id) })}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {SECTIONS[id]}
            </Chip>
          );
        })}
      </div>

      <div>
        <label htmlFor="custom-topic" className="text-sm font-medium">
          Add your own topic
        </label>
        <p className="mt-0.5 text-sm text-zinc-500">Anything you&apos;d search for: a team, a company, a country, a hobby.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <input
            id="custom-topic"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Formula 1, Armenia, electric cars"
            maxLength={60}
            className="min-w-0 flex-1 rounded-full border border-zinc-900/10 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5"
          />
          <button
            type="submit"
            disabled={!custom.trim() || full}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            <Plus className="size-4" aria-hidden />
            Add
          </button>
        </form>
        {customTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {customTopics.map((id) => (
              <Chip key={id} selected onClick={() => onChange({ topics: prefs.topics.filter((t) => t !== id) })}>
                {topicLabel(id)}
                <X className="size-3.5" aria-label="Remove" />
              </Chip>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-500" aria-live="polite">
        {prefs.topics.length} of {MAX_TOPICS} topics selected
      </p>
    </div>
  );
}

export function SourceFields({ prefs, onChange }: FieldProps) {
  return (
    <div className="space-y-6">
      {SOURCE_GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">{group}</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.filter((s) => s.group === group).map((s) => {
              const on = prefs.sources.includes(s.domain);
              return (
                <Chip key={s.domain} selected={on} onClick={() => onChange({ sources: toggle(prefs.sources, s.domain) })}>
                  {on && <Check className="size-3.5" aria-hidden />}
                  {s.name}
                </Chip>
              );
            })}
          </div>
        </div>
      ))}

      <label
        className={`flex items-start gap-3 rounded-2xl border border-zinc-900/10 p-4 dark:border-white/15 ${
          prefs.sources.length ? "" : "opacity-50"
        }`}
      >
        <input
          type="checkbox"
          checked={prefs.onlyMySources && prefs.sources.length > 0}
          disabled={!prefs.sources.length}
          onChange={(e) => onChange({ onlyMySources: e.target.checked })}
          className="mt-0.5 size-4 accent-orange-500"
        />
        <span>
          <span className="block text-sm font-medium">Only use my sources</span>
          <span className="block text-sm text-zinc-500">
            Off: your sources come first, others fill the gaps. On: you only hear from the outlets you picked, so some
            topics may have fewer stories.
          </span>
        </span>
      </label>
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_PRESETS = [
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Weekends", days: [0, 6] },
];

export function ScheduleFields({ prefs, onChange }: FieldProps) {
  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="listen-time" className="text-sm font-medium">
          When do you usually listen?
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="listen-time"
            type="time"
            value={prefs.listenTime}
            onChange={(e) => e.target.value && onChange({ listenTime: e.target.value })}
            className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 font-mono text-2xl tabular-nums outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5 dark:[color-scheme:dark]"
          />
          <div className="flex flex-wrap gap-2">
            {["06:30", "07:00", "07:30", "08:00"].map((t) => (
              <Chip key={t} selected={prefs.listenTime === t} onClick={() => onChange({ listenTime: t })}>
                {formatTime(t)}
              </Chip>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Time zone: {prefs.timeZone.replace(/_/g, " ")}. Your briefing will be ready before this time.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium">Which days?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <Chip
              key={d}
              selected={prefs.days.includes(i)}
              disabled={prefs.days.length === 1 && prefs.days.includes(i)}
              onClick={() => onChange({ days: toggle(prefs.days, i).sort() })}
              className="min-w-14 justify-center"
            >
              {d}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-sm">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange({ days: p.days })}
              className="text-orange-700 underline-offset-4 hover:underline dark:text-orange-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VoiceFields({ prefs, onChange }: FieldProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium">Voice</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {VOICES.map((v) => {
            const on = prefs.voice === v.id;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ voice: v.id })}
                className={`rounded-2xl border p-4 text-left transition ${
                  on
                    ? "border-orange-500 bg-orange-50 ring-4 ring-orange-500/10 dark:border-orange-400 dark:bg-orange-400/10"
                    : "border-zinc-900/10 bg-white hover:border-zinc-900/25 dark:border-white/15 dark:bg-white/5"
                }`}
              >
                <span className="flex items-center justify-between font-medium">
                  {v.name}
                  {on && <Check className="size-4 text-orange-600" aria-hidden />}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">{v.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Briefing length</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {([3, 5, 10] as const).map((m) => (
            <Chip key={m} selected={prefs.length === m} onClick={() => onChange({ length: m })}>
              {m} minutes
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
