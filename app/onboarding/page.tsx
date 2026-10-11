import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding";

export const metadata: Metadata = { title: "Set up your briefing" };

export default function OnboardingPage() {
  return <Onboarding />;
}
