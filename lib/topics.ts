// Topic names and headline types. Safe to use in both the browser and the
// server; the actual fetching lives in news.ts (server only).

// Google News sections. "TOP" is the main front page; the rest are topic feeds.
export const SECTIONS = {
  TOP: "Top stories",
  WORLD: "World",
  NATION: "U.S.",
  BUSINESS: "Business",
  TECHNOLOGY: "Technology",
  SCIENCE: "Science",
  HEALTH: "Health",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
} as const;

export type Section = keyof typeof SECTIONS;

// A topic is either a Google News section ("TECHNOLOGY") or a custom
// search written as "q:" plus the words to search for ("q:Formula 1").
export type TopicId = Section | `q:${string}`;

export type Headline = {
  title: string;
  source: string;
  sourceDomain: string; // e.g. "bbc.com", used to match preferred sources
  link: string;
  published: string; // ISO date
};

export function isSection(id: string): id is Section {
  return id in SECTIONS;
}

export function topicLabel(id: TopicId) {
  return isSection(id) ? SECTIONS[id] : id.slice(2);
}

// Does this headline come from one of the given domains (e.g. "bbc.com")?
export function fromSources(h: Headline, domains: readonly string[]) {
  return domains.some((d) => h.sourceDomain === d || h.sourceDomain.endsWith(`.${d}`));
}
