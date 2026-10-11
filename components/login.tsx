"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useAccount } from "@/lib/preferences";
import { SignInForm } from "./sign-in-form";
import { Card, Logo } from "./ui";

const noop = () => () => {};

export function Login() {
  const router = useRouter();
  const account = useAccount();
  const linkFailed = useSyncExternalStore(noop, () => location.search.includes("error=link"), () => false);

  // Already signed in: go straight to the briefing.
  useEffect(() => {
    if (account.status === "signed-in") router.replace(account.prefs ? "/briefing" : "/onboarding");
  }, [account, router]);

  return (
    <div className="sunrise flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-24">
        <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Sign in to hear your briefing and change your settings.</p>
        {linkFailed && (
          <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-400/10 dark:text-rose-200">
            That sign-in link didn&apos;t work. It may have expired or been opened in a different browser. Request a
            new one below.
          </p>
        )}
        <Card className="mt-8 p-6">
          <SignInForm />
        </Card>
        <p className="mt-6 text-center text-sm text-zinc-500">
          New here?{" "}
          <Link href="/onboarding" className="font-medium text-orange-700 hover:underline dark:text-orange-300">
            Build your briefing
          </Link>
        </p>
      </main>
    </div>
  );
}
