import { headlinesFor } from "@/lib/headlines";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preference-defaults";
import { speak, SpeechError } from "@/lib/speak";
import { buildScript, headlineBudget } from "@/lib/summarize";
import { supabaseServer } from "@/lib/supabase/server";

// POST /api/briefing  { "sample": true }
// Makes the signed-in person's briefing right now: fetch their headlines,
// write the script, record it with ElevenLabs, and return script + MP3.
// "sample" makes a short version (a few headlines) to save voice credits.
// Signed-in only, so strangers can't spend the voice credits.
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to make your briefing." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  if (!profile) return Response.json({ error: "Set up your briefing first." }, { status: 400 });
  const prefs: Preferences = { ...DEFAULT_PREFERENCES, ...profile.preferences };

  const sample = await request
    .json()
    .then((body) => body?.sample === true)
    .catch(() => false);

  const topics = await headlinesFor(prefs.topics, prefs.sources, prefs.onlyMySources, 10);
  const script = buildScript(prefs, sample ? topics.slice(0, 2) : topics, sample ? 3 : headlineBudget(prefs.length));

  try {
    const audio = await speak(script, prefs.voice);
    return Response.json(
      { script, audio: Buffer.from(audio).toString("base64"), sample },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const status = e instanceof SpeechError ? e.status : 500;
    const message = e instanceof SpeechError ? e.message : "Something went wrong making your briefing.";
    return Response.json({ error: message, script }, { status });
  }
}
