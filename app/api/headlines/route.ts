import { headlinesFor } from "@/lib/headlines";
import { isSection, type TopicId } from "@/lib/topics";

const MAX_TOPICS = 12;
const PER_TOPIC = 8;

// GET /api/headlines?topics=TOP,q:Formula 1&sources=bbc.com,npr.org&only=1
// Returns the latest headlines for each topic. Preferred sources are listed
// first; with only=1, headlines from other outlets are left out.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const topics = list(params.get("topics"))
    .filter((t): t is TopicId => isSection(t) || (t.startsWith("q:") && t.length > 2))
    .slice(0, MAX_TOPICS);
  const sources = list(params.get("sources"));

  const results = await headlinesFor(topics, sources, params.get("only") === "1", PER_TOPIC);
  return Response.json({ topics: results });
}

function list(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
