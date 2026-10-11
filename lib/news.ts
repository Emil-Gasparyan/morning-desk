import { cacheLife } from "next/cache";

// Google News sections. "TOP" is the main front page; the rest are topic feeds.
export const TOPICS = {
  TOP: "Top stories",
  WORLD: "World",
  BUSINESS: "Business",
  TECHNOLOGY: "Technology",
  SCIENCE: "Science",
  HEALTH: "Health",
  SPORTS: "Sports",
  ENTERTAINMENT: "Entertainment",
} as const;

export type Topic = keyof typeof TOPICS;

export type Headline = {
  title: string;
  source: string;
  link: string;
  published: string; // ISO date
};

const LOCALE = "hl=en-US&gl=US&ceid=US:en";

function feedUrl(topic: Topic) {
  return topic === "TOP"
    ? `https://news.google.com/rss?${LOCALE}`
    : `https://news.google.com/rss/headlines/section/topic/${topic}?${LOCALE}`;
}

// Fetch the latest headlines for one topic. Cached for about an hour,
// so visiting the page doesn't hit Google News every time.
export async function getHeadlines(topic: Topic, limit = 8): Promise<Headline[]> {
  "use cache";
  cacheLife("hours");

  const res = await fetch(feedUrl(topic));
  if (!res.ok) throw new Error(`Google News returned ${res.status} for ${topic}`);
  return parseRss(await res.text()).slice(0, limit);
}

function parseRss(xml: string): Headline[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.map((item) => {
    const source = tag(item, "source");
    let title = tag(item, "title");
    // Titles end with " - Source Name"; drop it since we show the source separately.
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3));
    }
    const date = new Date(tag(item, "pubDate"));
    return {
      title,
      source,
      link: tag(item, "link"),
      published: isNaN(date.getTime()) ? "" : date.toISOString(),
    };
  });
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim()) : "";
}

function decode(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
