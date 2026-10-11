"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DEFAULT_PREFERENCES,
  detectTimeZone,
  savePreferences,
  useAccount,
  type Preferences,
} from "@/lib/preferences";
import { ScheduleFields, SourceFields, TopicFields, VoiceFields } from "./preference-fields";
import { SignInForm } from "./sign-in-form";
import { Button, Card, Logo } from "./ui";

const STEPS = [
  { title: "Welcome! What should we call you?", hint: "We'll use it to greet you each morning." },
  { title: "What do you want to hear about?", hint: "Pick at least one. You can change these any time." },
  { title: "Which outlets do you trust?", hint: "Optional. Stories from these come first. Skip to hear from everyone." },
  { title: "When and how do you listen?", hint: "We'll have your briefing ready before then." },
];

// Extra last step for people who aren't signed in yet.
const SAVE_STEP = {
  title: "Last step: save your briefing",
  hint: "Enter your email and we'll send a link that creates your account. No password needed.",
};

export function Onboarding() {
  const account = useAccount();
  if (account.status === "loading") return <div className="flex-1" />;

  const saved = account.status === "signed-in" ? account.prefs : account.pending;
  return (
    <Wizard
      signedIn={account.status === "signed-in"}
      initial={saved ?? { ...DEFAULT_PREFERENCES, timeZone: detectTimeZone() }}
    />
  );
}

function Wizard({ initial, signedIn }: { initial: Preferences; signedIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch }));

  const steps = signedIn ? STEPS : [...STEPS, SAVE_STEP];
  const onSaveStep = !signedIn && step === STEPS.length;
  const last = step === steps.length - 1;
  const canContinue = step === 0 ? prefs.name.trim().length > 0 : step === 1 ? prefs.topics.length > 0 : true;
  const cleaned = () => ({ ...prefs, name: prefs.name.trim() });

  async function next() {
    if (!canContinue) return;
    if (last && signedIn) {
      setSaving(true);
      const problem = await savePreferences(cleaned());
      setSaving(false);
      if (problem) setError(problem);
      else router.push("/briefing");
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="sunrise flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <span className="text-sm text-zinc-500 tabular-nums">
          Step {step + 1} of {steps.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
          {steps.map((s, i) => (
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
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{steps[step].title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{steps[step].hint}</p>

        <Card className="mt-8 p-5 sm:p-8">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void next();
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
          {onSaveStep && (
            // Keep the choices in this browser; they're saved to the new
            // account when the email link is opened.
            <SignInForm submitLabel="Create my account" onBeforeSend={() => void savePreferences(cleaned())} />
          )}
        </Card>

        {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        {step === 0 && !signedIn && (
          <p className="mt-6 text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-orange-700 hover:underline dark:text-orange-300">
              Sign in
            </Link>
          </p>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-zinc-900/5 bg-background/85 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
          {!onSaveStep && (
            <div className="flex items-center gap-2">
              {step === 2 && prefs.sources.length === 0 && (
                <Button variant="ghost" onClick={() => void next()}>
                  Skip
                </Button>
              )}
              <Button variant={last ? "brand" : "primary"} onClick={() => void next()} disabled={!canContinue || saving}>
                {last ? (saving ? "Saving…" : "Save my briefing") : "Continue"}
                {last ? <Check className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
