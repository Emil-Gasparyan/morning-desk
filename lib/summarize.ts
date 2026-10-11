import type { Preferences } from "./preference-defaults";
import type { TopicHeadlines } from "./headlines";
import { SOURCES } from "./sources";
import { isSection, type Headline, type TopicId } from "./topics";

// Builds the spoken script for one briefing. For now it's a plain read-out
// of headlines (no AI). Swapping this function for a Claude API call later
// is the only change needed to get AI-written scripts.

const WORDS_PER_MINUTE = 150;

export function headlineBudget(minutes: number) {
  // A spoken headline with its attribution is about 20 words.
  return Math.max(3, Math.round((minutes * WORDS_PER_MINUTE - 60) / 20));
}

export function buildScript(prefs: Preferences, topics: TopicHeadlines[], maxHeadlines: number, now = new Date()) {
  const picked = pickHeadlines(topics, maxHeadlines);
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: prefs.timeZone,
  });
  const hour = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: prefs.timeZone }));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const parts = [`${greeting}, ${prefs.name}. It's ${date}, and this is your Morning Desk briefing.`];

  picked.forEach(({ id, label, headlines }, i) => {
    parts.push(i === 0 ? `Let's start with ${spokenLabel(id, label)}.` : `Next, ${spokenLabel(id, label)}.`);
    headlines.forEach((h, j) => parts.push(sentence(h, j)));
  });

  parts.push("That's your briefing for today. Have a great day, and we'll see you tomorrow.");
  return parts.join("\n\n");
}

// Spread the headline budget across topics in order, skipping stories that
// already appeared under an earlier topic.
function pickHeadlines(topics: TopicHeadlines[], max: number) {
  const seen = new Set<string>();
  const queues = topics.map((t) => ({
    id: t.id,
    label: t.label,
    pool: t.headlines.filter((h) => {
      const key = h.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    headlines: [] as Headline[],
  }));

  // Round-robin so every topic gets a fair share.
  let left = max;
  while (left > 0 && queues.some((q) => q.pool.length)) {
    for (const q of queues) {
      if (left > 0 && q.pool.length) {
        q.headlines.push(q.pool.shift()!);
        left--;
      }
    }
  }
  return queues.filter((q) => q.headlines.length);
}

function spokenLabel(id: TopicId, label: string) {
  if (id === "TOP") return "the top stories";
  if (id === "NATION") return "news from the U.S.";
  return isSection(id) ? `${label.toLowerCase()} news` : label;
}

// Vary the attribution so it doesn't sound robotic.
function sentence(h: Headline, i: number) {
  const source =
    SOURCES.find((s) => h.sourceDomain === s.domain || h.sourceDomain.endsWith(`.${s.domain}`))?.name ?? h.source;
  const title = h.title.replace(/[.!?]*$/, "");
  if (!source) return `${title}.`;
  switch (i % 3) {
    case 0:
      return `${source} reports: ${title}.`;
    case 1:
      return `${title}. That's from ${source}.`;
    default:
      return `According to ${source}: ${title}.`;
  }
}
