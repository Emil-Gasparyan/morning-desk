import { getHeadlines } from "./news";
import { fromSources, topicLabel, type Headline, type TopicId } from "./topics";

export type TopicHeadlines = { id: TopicId; label: string; headlines: Headline[]; error: boolean };

const FRESH_HOURS = 36;

// Latest headlines for each topic, with the person's preferred sources first
// (or only, with onlyMine). Used by the dashboard and the audio briefing.
export async function headlinesFor(
  topics: TopicId[],
  sources: string[],
  onlyMine: boolean,
  perTopic: number,
): Promise<TopicHeadlines[]> {
  const only = onlyMine && sources.length > 0;

  return Promise.all(
    topics.map(async (id) => {
      try {
        let headlines = await getHeadlines(id);
        if (sources.length) {
          // Only boost fresh stories, so an old piece from a favourite outlet
          // doesn't jump ahead of today's news.
          const fresh = Date.now() - FRESH_HOURS * 3_600_000;
          const isMine = (h: Headline) =>
            fromSources(h, sources) && (!h.published || Date.parse(h.published) > fresh);
          const mine = headlines.filter(isMine);
          headlines = only ? mine : [...mine, ...headlines.filter((h) => !isMine(h))];
        }
        return { id, label: topicLabel(id), headlines: headlines.slice(0, perTopic), error: false };
      } catch {
        return { id, label: topicLabel(id), headlines: [], error: true };
      }
    }),
  );
}
