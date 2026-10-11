"use client";

import { ArrowRight } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { ButtonLink } from "./ui";

// "Get started" for new visitors, "Open my briefing" once they've signed up.
export function HeaderCta({ size = "sm" }: { size?: "sm" | "lg" }) {
  const prefs = usePreferences();
  const signedUp = !!prefs;
  const big = size === "lg";

  return (
    <ButtonLink
      href={signedUp ? "/briefing" : "/onboarding"}
      variant={big ? "brand" : "primary"}
      className={big ? "px-6 py-3 text-base" : ""}
    >
      {signedUp ? "Open my briefing" : big ? "Build my briefing" : "Get started"}
      <ArrowRight className="size-4" aria-hidden />
    </ButtonLink>
  );
}
