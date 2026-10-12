import type { Preferences } from "./preference-defaults";
import type { TopicHeadlines } from "./headlines";
import { SOURCES } from "./sources";
import { isSection, type Headline, type TopicId } from "./topics";

// Builds the script for one episode, in a short podcast style: quick show
// intro, one segment per topic, brief sign-off. For now it's a plain
// read-out of headlines (no AI). Swapping this function for a Claude API
// call later is the only change needed to get AI-written scripts.

const WORDS_PER_MINUTE = 150;

// Pause between segments. ElevenLabs reads <break> tags as silence.
const SEGMENT_PAUSE = '<break time="0.8s" />';

export function headlineBudget(minutes: number) {
  // A spoken headline with its attribution is about 20 words.
  return Math.max(3, Math.round((minutes * WORDS_PER_MINUTE - 60) / 20));
}

export type Script = {
  text: string; // for reading on screen
  spoken: string; // what the voice reads, with pauses between segments
};

export function buildScript(
  prefs: Preferences,
  topics: TopicHeadlines[],
  maxHeadlines: number,
  now = new Date(),
): Script {
  const picked = pickHeadlines(topics, maxHeadlines);
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: prefs.timeZone,
  });
  const hour = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: prefs.timeZone }));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const segments: string[][] = [
    [`This is Morning Desk. ${greeting}, ${prefs.name}. It's ${date}, and here's what you need to know.`],
  ];

  picked.forEach(({ id, label, headlines }, i) => {
    const intro = segmentIntro(spokenLabel(id, label), i, picked.length);
    segments.push([intro, ...headlines.map((h, j) => sentence(h, i + j))]);
  });

  segments.push([`That's Morning Desk for today. Thanks for listening, ${prefs.name}. Have a great day.`]);

  return {
    text: segments.map((s) => s.join("\n\n")).join("\n\n"),
    spoken: segments.map((s) => s.join("\n\n")).join(`\n\n${SEGMENT_PAUSE}\n\n`),
  };
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

// Podcast-style segment openers, varied so episodes don't sound templated.
function segmentIntro(label: string, i: number, total: number) {
  if (i === 0) return `First up, ${label}.`;
  if (i === total - 1 && total > 2) return `And finally, ${label}.`;
  const openers = [`Turning to ${label}.`, `Now, ${label}.`, `Next up, ${label}.`];
  return openers[(i - 1) % openers.length];
}

// Vary the attribution so it doesn't sound robotic.
function sentence(h: Headline, i: number) {
  const source =
    SOURCES.find((s) => h.sourceDomain === s.domain || h.sourceDomain.endsWith(`.${s.domain}`))?.name ?? h.source;
  const title = h.title.replace(/[.!?]*$/, "");
  if (!source) return `${title}.`;
  switch (i % 4) {
    case 0:
      return `${title}. That's from ${source}.`;
    case 1:
      return `According to ${source}: ${title}.`;
    case 2:
      return `${source} has this one: ${title}.`;
    default:
      return `${title}, via ${source}.`;
  }
}
