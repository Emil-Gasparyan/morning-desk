import type { Metadata } from "next";
import { BriefingPage } from "@/components/briefing";

export const metadata: Metadata = { title: "Your briefing" };

export default function Page() {
  return <BriefingPage />;
}
