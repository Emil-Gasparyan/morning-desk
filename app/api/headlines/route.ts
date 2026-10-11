import { getHeadlines } from "@/lib/news";
import { fromSources, isSection, topicLabel, type Headline, type TopicId } from "@/lib/topics";

const MAX_TOPICS = 12;
const PER_TOPIC = 8;
const FRESH_HOURS = 36;

// GET /api/headlines?topics=TOP,q:Formula 1&sources=bbc.com,npr.org&only=1
// Returns the latest headlines for each topic. Preferred sources are listed
// first; with only=1, headlines from other outlets are left out.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const topics = list(params.get("topics"))
    .filter((t): t is TopicId => isSection(t) || (t.startsWith("q:") && t.length > 2))
    .slice(0, MAX_TOPICS);
  const sources = list(params.get("sources"));
  const only = params.get("only") === "1" && sources.length > 0;

  const results = await Promise.all(
    topics.map(async (id) => {
      try {
        let headlines = await getHeadlines(id);
        if (sources.length) {
          // Only boost fresh stories, so an old piece from a favourite outlet
          // doesn't jump ahead of today's news.
          const fresh = Date.now() - FRESH_HOURS * 3_600_000;
          const isMine = (h: Headline) => fromSources(h, sources) && (!h.published || Date.parse(h.published) > fresh);
          const mine = headlines.filter(isMine);
          headlines = only ? mine : [...mine, ...headlines.filter((h) => !isMine(h))];
        }
        return { id, label: topicLabel(id), headlines: headlines.slice(0, PER_TOPIC), error: false };
      } catch {
        return { id, label: topicLabel(id), headlines: [], error: true };
      }
    }),
  );

  return Response.json({ topics: results });
}

function list(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
