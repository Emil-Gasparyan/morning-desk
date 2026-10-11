"use client";

import { Newspaper, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePreferences, type Preferences } from "@/lib/preferences";
import { ButtonLink, Card, Logo } from "./ui";

const NAV = [
  { href: "/briefing", label: "Briefing", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Frame for the signed-in pages. Shows a "set up first" card to visitors
// who haven't created their briefing yet.
export function AppShell({ children }: { children: (prefs: Preferences) => ReactNode }) {
  const prefs = usePreferences();
  const path = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-900/5 bg-background/80 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {prefs && (
            <nav className="flex items-center gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
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
              <span
                className="ml-2 grid size-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-semibold text-white"
                title={prefs.name}
              >
                {prefs.name.charAt(0).toUpperCase()}
              </span>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {prefs === undefined ? null : prefs === null ? <NotSetUp /> : children(prefs)}
      </main>
    </div>
  );
}

function NotSetUp() {
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
