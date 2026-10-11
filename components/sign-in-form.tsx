"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendSignInLink, verifySignInCode } from "@/lib/preferences";
import { Button } from "./ui";

// Email field that sends a sign-in email. The email has a link and a code:
// the link works when opened in this browser, the code works anywhere.
export function SignInForm({
  next = "/briefing",
  submitLabel = "Email me a sign-in code",
  onBeforeSend,
}: {
  next?: string;
  submitLabel?: string;
  onBeforeSend?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter a valid email address.");
      return;
    }
    setState("sending");
    setError(null);
    await onBeforeSend?.();
    const problem = await sendSignInLink(address, next);
    if (problem) {
      setError(problem);
      setState("idle");
    } else {
      setState("sent");
    }
  }

  async function verify() {
    const digits = code.replace(/\D/g, "");
    if (digits.length < 6) {
      setError("Enter the code from the email.");
      return;
    }
    setState("verifying");
    setError(null);
    const problem = await verifySignInCode(email.trim(), digits);
    if (problem) {
      setError(problem);
      setState("sent");
    } else {
      router.push(next);
    }
  }

  if (state === "sent" || state === "verifying") {
    return (
      <div className="space-y-5">
        <div className="flex gap-4 rounded-2xl bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-400/10 dark:text-emerald-100">
          <MailCheck className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
          <div>
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1 text-sm">
              We sent an email to <strong>{email.trim()}</strong>. Type the code below, or open the link in this
              browser. It can take a minute to arrive, and may land in spam.
            </p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <label htmlFor="code" className="text-sm font-medium">
            Sign-in code
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="code"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="123456"
              aria-invalid={!!error}
              aria-describedby={error ? "code-error" : undefined}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 font-mono text-xl tracking-[0.3em] outline-none placeholder:text-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5"
            />
            <Button type="submit" variant="brand" disabled={state === "verifying"} className="py-3">
              {state === "verifying" ? "Checking…" : "Sign in"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
          {error && (
            <p id="code-error" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </form>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <button type="button" onClick={() => void submit()} className="font-medium underline underline-offset-4">
            Send a new email
          </button>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setCode("");
              setError(null);
            }}
            className="font-medium underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="email" className="text-sm font-medium">
        Email address
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
          className="min-w-0 flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 outline-none placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-white/15 dark:bg-white/5"
        />
        <Button type="submit" variant="brand" disabled={state === "sending"} className="py-3">
          {state === "sending" ? "Sending…" : submitLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      {error && (
        <p id="email-error" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-zinc-500">
        No password needed. We&apos;ll email you a code. You&apos;ll stay signed in on this device.
      </p>
    </form>
  );
}
