"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/lib/preferences";
import { ButtonLink } from "./ui";

// "Get started" for new visitors, "Open my briefing" once they're signed in.
export function HeaderCta({ size = "sm" }: { size?: "sm" | "lg" }) {
  const account = useAccount();
  const signedIn = account.status === "signed-in";
  const big = size === "lg";

  return (
    <ButtonLink
      href={signedIn ? (account.prefs ? "/briefing" : "/onboarding") : "/onboarding"}
      variant={big ? "brand" : "primary"}
      className={big ? "px-6 py-3 text-base" : ""}
    >
      {signedIn ? "Open my briefing" : big ? "Build my briefing" : "Get started"}
      <ArrowRight className="size-4" aria-hidden />
    </ButtonLink>
  );
}

// "Sign in" link for returning visitors; hidden once signed in.
export function SignInLink() {
  const account = useAccount();
  if (account.status === "signed-in") return null;
  return (
    <Link
      href="/login"
      className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
    >
      Sign in
    </Link>
  );
}
