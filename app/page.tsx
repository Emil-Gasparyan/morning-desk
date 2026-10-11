import {
  AlarmClock,
  Headphones,
  Newspaper,
  Play,
  Podcast,
  Mail,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { HeaderCta } from "@/components/header-cta";
import { Card, Logo } from "@/components/ui";
import { getHeadlines } from "@/lib/news";

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-900/5 bg-background/80 backdrop-blur dark:border-white/10">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden rounded-full px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-white">
              How it works
            </a>
            <a href="#features" className="hidden rounded-full px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-white">
              Features
            </a>
            <HeaderCta />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="sunrise">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-400/10 dark:text-orange-200">
                <Sparkles className="size-3.5" aria-hidden />
                Spoken briefings launching soon
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
                Your news, read aloud{" "}
                <span className="font-display font-normal italic text-orange-600 dark:text-orange-400">
                  before your coffee&apos;s ready.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-zinc-600 text-pretty dark:text-zinc-400">
                Pick the topics you care about, the outlets you trust and the time you listen.
                Every morning, Morning Desk turns the day&apos;s headlines into a short briefing made
                just for you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <HeaderCta size="lg" />
                <a href="#how" className="rounded-full px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10">
                  See how it works
                </a>
              </div>
              <p className="mt-6 text-sm text-zinc-500">Free while in early access. Takes about a minute to set up.</p>
            </div>

            <BriefingPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-y border-zinc-900/5 bg-white py-20 dark:border-white/10 dark:bg-white/[.02]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="How it works" title="Three choices. One briefing, every morning." />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Newspaper, title: "Choose your topics", text: "World, business, tech, sport, or anything you type in, like “Formula 1” or “climate”." },
                { icon: SlidersHorizontal, title: "Pick your sources", text: "Favour the outlets you trust. Hear them first, or hear only them." },
                { icon: AlarmClock, title: "Set your time", text: "Tell us when you listen. Your briefing is ready and waiting by then." },
              ].map((step, i) => (
                <li key={step.title} className="relative rounded-2xl border border-zinc-900/[.07] p-6 dark:border-white/10">
                  <span className="font-display text-5xl text-orange-500/80 italic">{i + 1}</span>
                  <step.icon className="absolute top-6 right-6 size-5 text-zinc-400" aria-hidden />
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Features" title="Built for the first ten minutes of your day" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Feature icon={Headphones} title="Radio-style briefing" text="A short, natural-sounding read of the stories that matter to you. No scrolling required." soon />
              <Feature icon={Newspaper} title="Thousands of outlets" text="Headlines come from Google News, so every major outlet and many local ones are covered." />
              <Feature icon={SlidersHorizontal} title="Your sources first" text="Choose favourite outlets and their stories rise to the top, or filter everything else out." />
              <Feature icon={AlarmClock} title="On your schedule" text="Weekdays at 7:00? Every day at 6:30? Set it once and forget about it." />
              <Feature icon={Podcast} title="Listen in any podcast app" text="Your briefing shows up as a private podcast, right next to your other shows." soon />
              <Feature icon={Mail} title="Or get it by email" text="Prefer reading? Get the same briefing in your inbox at your time." soon />
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="sunrise mx-auto max-w-6xl overflow-hidden rounded-3xl border border-zinc-900/[.07] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-white/[.03]">
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance">
              Start tomorrow{" "}
              <span className="font-display font-normal italic text-orange-600 dark:text-orange-400">better informed.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
              Set up your briefing in about a minute. You can change everything later.
            </p>
            <div className="mt-8 flex justify-center">
              <HeaderCta size="lg" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900/5 py-8 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:px-6">
          <Logo className="text-zinc-700 dark:text-zinc-300" />
          <p>Headlines via Google News. Personal, non-commercial project.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  soon,
}: {
  icon: typeof Headphones;
  title: string;
  text: string;
  soon?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300">
          <Icon className="size-5" aria-hidden />
        </span>
        {soon && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
    </Card>
  );
}

// A preview card showing what a briefing looks like, using today's real top headlines.
async function BriefingPreview() {
  let headlines: { title: string; source: string }[] = [];
  try {
    headlines = (await getHeadlines("TOP")).slice(0, 3);
  } catch {
    // Show the card without stories if Google News is unreachable.
  }

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-orange-300/30 via-rose-300/20 to-transparent blur-2xl dark:from-orange-500/20 dark:via-rose-500/10" />
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Today&apos;s briefing</p>
            <p className="mt-1 font-semibold">Top stories · World · Tech</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            Ready at 7:00
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
          <div className="wave flex h-10 flex-1 items-end gap-[3px]" aria-hidden>
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                className="w-full rounded-full bg-gradient-to-t from-orange-500 to-rose-400"
                style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 9) * 0.12}s` }}
              />
            ))}
          </div>
          <span className="font-mono text-sm text-zinc-500 tabular-nums">5:00</span>
        </div>

        <ul className="mt-5 space-y-3">
          {headlines.map((h, i) => (
            <li key={h.title} className="flex gap-3">
              <span className="font-mono text-xs leading-6 text-zinc-400 tabular-nums">0{i + 1}</span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{h.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{h.source}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
