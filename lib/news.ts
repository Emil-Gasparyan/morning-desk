import { cacheLife } from "next/cache";
import { isSection, type Headline, type TopicId } from "./topics";

const LOCALE = "hl=en-US&gl=US&ceid=US:en";

function feedUrl(id: TopicId) {
  if (id === "TOP") return `https://news.google.com/rss?${LOCALE}`;
  if (isSection(id)) {
    return `https://news.google.com/rss/headlines/section/topic/${id}?${LOCALE}`;
  }
  // Custom topic: search the last day of news for these words.
  const query = encodeURIComponent(`${id.slice(2)} when:1d`);
  return `https://news.google.com/rss/search?q=${query}&${LOCALE}`;
}

// Fetch every headline in one topic's feed. Cached for about an hour,
// so visitors don't hit Google News on every page load.
export async function getHeadlines(id: TopicId): Promise<Headline[]> {
  "use cache";
  cacheLife("hours");

  const res = await fetch(feedUrl(id));
  if (!res.ok) throw new Error(`Google News returned ${res.status} for ${id}`);
  return parseRss(await res.text());
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
      sourceDomain: domainOf(item.match(/<source url="([^"]+)"/)?.[1] ?? ""),
      link: tag(item, "link"),
      published: isNaN(date.getTime()) ? "" : date.toISOString(),
    };
  });
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
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
