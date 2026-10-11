import { getHeadlines, TOPICS, type Topic } from "@/lib/news";
import { Today } from "./today";

// Fixed for now; step 4 replaces this with the topics saved in your settings.
const MY_TOPICS: Topic[] = ["TOP", "WORLD", "BUSINESS", "TECHNOLOGY"];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <header className="mb-10 border-b border-black/10 pb-6 dark:border-white/15">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          <Today />
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Morning Desk</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Today&apos;s headlines. Soon: read aloud as your morning briefing.
        </p>
      </header>

      <div className="space-y-10">
        {MY_TOPICS.map((topic) => (
          <TopicSection key={topic} topic={topic} />
        ))}
      </div>

      <footer className="mt-12 text-xs text-zinc-500">
        Headlines from Google News, refreshed about every hour.
      </footer>
    </main>
  );
}

async function TopicSection({ topic }: { topic: Topic }) {
  let headlines;
  try {
    headlines = await getHeadlines(topic);
  } catch {
    headlines = null;
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {TOPICS[topic]}
      </h2>
      {headlines === null ? (
        <p className="text-sm text-zinc-500">Couldn&apos;t load these headlines right now.</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {headlines.map((h) => (
            <li key={h.link} className="py-3">
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium leading-snug hover:underline"
              >
                {h.title}
              </a>
              {h.source && <p className="mt-0.5 text-sm text-zinc-500">{h.source}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
