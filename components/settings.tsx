"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { clearPreferences, savePreferences, type Preferences } from "@/lib/preferences";
import { AppShell } from "./app-shell";
import { ScheduleFields, SourceFields, TopicFields, VoiceFields } from "./preference-fields";
import { Button, Card } from "./ui";

export function SettingsPage() {
  return <AppShell>{(prefs) => <SettingsForm saved={prefs} />}</AppShell>;
}

function SettingsForm({ saved }: { saved: Preferences }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Preferences>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    setJustSaved(false);
    setError(null);
  };

  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved);
  const valid = prefs.name.trim().length > 0 && prefs.topics.length > 0;

  async function save() {
    setSaving(true);
    const problem = await savePreferences({ ...prefs, name: prefs.name.trim() });
    setSaving(false);
    if (problem) setError(problem);
    else setJustSaved(true);
  }

  return (
    <div className="pb-24">
      <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Changes apply to your next briefing.</p>

      <div className="mt-10 space-y-6">
        <Section title="Profile" description="How we greet you.">
          <label htmlFor="name" className="text-sm font-medium">
            First name
          </label>
          <input
            id="name"
            value={prefs.name}
            maxLength={40}
            onChange={(e) => update({ name: e.target.value })}
            className="mt-2 w-full max-w-sm rounded-2xl border border-zinc-900/10 bg-white px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5"
          />
        </Section>

        <Section title="Topics" description="What your briefing covers. Pick at least one.">
          <TopicFields prefs={prefs} onChange={update} />
        </Section>

        <Section title="Sources" description="Outlets you trust. Their stories come first.">
          <SourceFields prefs={prefs} onChange={update} />
        </Section>

        <Section title="Schedule" description="When your briefing should be ready.">
          <ScheduleFields prefs={prefs} onChange={update} />
        </Section>

        <Section title="Voice & length" description="How your briefing sounds.">
          <VoiceFields prefs={prefs} onChange={update} />
        </Section>

        <Section title="Start over" description="Delete your preferences and go through set-up again.">
          <Button
            variant="outline"
            onClick={async () => {
              if (confirm("Delete your preferences and start set-up again?")) {
                const problem = await clearPreferences();
                if (problem) setError(problem);
                else router.push("/onboarding");
              }
            }}
          >
            Reset preferences
          </Button>
        </Section>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-zinc-900/5 bg-background/90 backdrop-blur transition-transform dark:border-white/10 ${
          dirty || justSaved || error ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-18 max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {error ? (
              <span className="text-rose-600 dark:text-rose-400">{error}</span>
            ) : justSaved && !dirty ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Check className="size-4" aria-hidden /> Saved
              </span>
            ) : valid ? (
              "You have unsaved changes."
            ) : (
              "Add your name and at least one topic to save."
            )}
          </p>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" onClick={() => setPrefs(saved)}>
                Discard
              </Button>
            )}
            <Button variant="brand" onClick={() => void save()} disabled={!dirty || !valid || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="grid gap-6 p-5 sm:p-8 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
