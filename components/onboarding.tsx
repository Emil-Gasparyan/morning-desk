"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DEFAULT_PREFERENCES,
  detectTimeZone,
  savePreferences,
  usePreferences,
  type Preferences,
} from "@/lib/preferences";
import { ScheduleFields, SourceFields, TopicFields, VoiceFields } from "./preference-fields";
import { Button, Card, Logo } from "./ui";

const STEPS = [
  { title: "Welcome! What should we call you?", hint: "We'll use it to greet you each morning." },
  { title: "What do you want to hear about?", hint: "Pick at least one. You can change these any time." },
  { title: "Which outlets do you trust?", hint: "Optional. Stories from these come first. Skip to hear from everyone." },
  { title: "When and how do you listen?", hint: "We'll have your briefing ready before then." },
];

export function Onboarding() {
  const saved = usePreferences();
  if (saved === undefined) return <div className="flex-1" />; // still loading in the browser
  return <Wizard initial={saved ?? { ...DEFAULT_PREFERENCES, timeZone: detectTimeZone() }} />;
}

function Wizard({ initial }: { initial: Preferences }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(initial);
  const update = (patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch }));

  const last = step === STEPS.length - 1;
  const canContinue = step === 0 ? prefs.name.trim().length > 0 : step === 1 ? prefs.topics.length > 0 : true;

  function next() {
    if (!canContinue) return;
    if (last) {
      savePreferences({ ...prefs, name: prefs.name.trim() });
      router.push("/briefing");
    } else {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <div className="sunrise flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <span className="text-sm text-zinc-500 tabular-nums">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-zinc-900/10 dark:bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{STEPS[step].title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{STEPS[step].hint}</p>

        <Card className="mt-8 p-5 sm:p-8">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <label htmlFor="name" className="text-sm font-medium">
                Your first name
              </label>
              <input
                id="name"
                autoFocus
                autoComplete="given-name"
                value={prefs.name}
                maxLength={40}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Emil"
                className="mt-2 w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-lg outline-none placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5"
              />
            </form>
          )}
          {step === 1 && <TopicFields prefs={prefs} onChange={update} />}
          {step === 2 && <SourceFields prefs={prefs} onChange={update} />}
          {step === 3 && (
            <div className="space-y-10">
              <ScheduleFields prefs={prefs} onChange={update} />
              <hr className="border-zinc-900/10 dark:border-white/10" />
              <VoiceFields prefs={prefs} onChange={update} />
            </div>
          )}
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t border-zinc-900/5 bg-background/85 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step === 2 && prefs.sources.length === 0 && (
              <Button variant="ghost" onClick={next}>
                Skip
              </Button>
            )}
            <Button variant={last ? "brand" : "primary"} onClick={next} disabled={!canContinue}>
              {last ? "Create my briefing" : "Continue"}
              {last ? <Check className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
