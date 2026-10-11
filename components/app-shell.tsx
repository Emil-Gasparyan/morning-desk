"use client";

import { LogOut, Newspaper, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { signOut, useAccount, type Preferences } from "@/lib/preferences";
import { SignInForm } from "./sign-in-form";
import { ButtonLink, Card, Logo } from "./ui";

const NAV = [
  { href: "/briefing", label: "Briefing", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Frame for the signed-in pages. Asks visitors to sign in, and sends people
// who haven't set up their briefing yet to the sign-up steps.
export function AppShell({ children }: { children: (prefs: Preferences) => ReactNode }) {
  const account = useAccount();
  const path = usePathname();
  const ready = account.status === "signed-in" && account.prefs;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-900/5 bg-background/80 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {account.status === "signed-in" && (
            <nav className="flex items-center gap-1">
              {account.prefs &&
                NAV.map(({ href, label, icon: Icon }) => {
                  const active = path === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-zinc-900/[.06] text-zinc-900 dark:bg-white/10 dark:text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span className="hidden sm:inline">{label}</span>
                    </Link>
                  );
                })}
              <AccountMenu name={account.prefs?.name || account.email} email={account.email} />
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {account.status === "signed-out" ? (
          <SignInCard />
        ) : account.status === "signed-in" && !account.prefs ? (
          <SetUpCard />
        ) : ready ? (
          children(account.prefs!)
        ) : null}
      </main>
    </div>
  );
}

function AccountMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  return (
    <details className="relative ml-2">
      <summary
        className="grid size-8 cursor-pointer list-none place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
      >
        {name.charAt(0).toUpperCase()}
      </summary>
      <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-900/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
        <p className="truncate px-3 pt-2 text-sm font-medium">{name}</p>
        <p className="truncate px-3 pb-2 text-sm text-zinc-500">{email}</p>
        <hr className="my-1 border-zinc-900/5 dark:border-white/10" />
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-900/5 dark:hover:bg-white/10"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </div>
    </details>
  );
}

function SignInCard() {
  const path = usePathname();
  return (
    <Card className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to see your briefing</h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        New here?{" "}
        <Link href="/onboarding" className="font-medium text-orange-700 hover:underline dark:text-orange-300">
          Build your briefing
        </Link>{" "}
        first.
      </p>
      <SignInForm next={path} />
    </Card>
  );
}

function SetUpCard() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set up your briefing</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Pick your topics, sources and listening time. It takes about a minute.
      </p>
      <ButtonLink href="/onboarding" variant="brand" className="mt-6">
        Get started
      </ButtonLink>
    </Card>
  );
}
