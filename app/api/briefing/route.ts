import { headlinesFor } from "@/lib/headlines";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preference-defaults";
import { BITRATE, speak, SpeechError } from "@/lib/speak";
import { buildScript, headlineBudget } from "@/lib/summarize";
import { supabaseServer } from "@/lib/supabase/server";

const KEEP_DAYS = 7;

// POST /api/briefing  { "sample": true }
// Makes the signed-in person's episode right now: fetch their headlines,
// write the script and record it with ElevenLabs.
// - Full episode: saved (MP3 in storage + row in `briefings`), one per day,
//   replacing an earlier one from the same day. Episodes older than 7 days
//   are deleted. Returns the episode with a temporary play link.
// - Sample: a few headlines to check the voice; not saved, audio returned inline.
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

  let audio: Uint8Array;
  try {
    audio = await speak(script.spoken, prefs.voice);
  } catch (e) {
    const status = e instanceof SpeechError ? e.status : 500;
    const message = e instanceof SpeechError ? e.message : "Something went wrong making your briefing.";
    return Response.json({ error: message }, { status });
  }

  if (sample) {
    return Response.json(
      { sample: { script: script.text, audio: Buffer.from(audio).toString("base64") } },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Save today's episode (the listener's local date).
  const day = new Date().toLocaleDateString("en-CA", { timeZone: prefs.timeZone }); // YYYY-MM-DD
  const path = `${user.id}/${day}.mp3`;
  const upload = await supabase.storage.from("briefings").upload(path, audio, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (upload.error) {
    console.error("Saving briefing audio failed:", upload.error.message);
    return Response.json({ error: "Your briefing was recorded but couldn't be saved. Try again." }, { status: 500 });
  }

  const episode = {
    user_id: user.id,
    day,
    script: script.text,
    audio_path: path,
    duration_seconds: Math.round((audio.length * 8) / BITRATE),
    voice: prefs.voice,
  };
  const saved = await supabase.from("briefings").upsert(episode, { onConflict: "user_id,day" });
  if (saved.error) {
    console.error("Saving briefing failed:", saved.error.message);
    return Response.json({ error: "Your briefing was recorded but couldn't be saved. Try again." }, { status: 500 });
  }

  await deleteOldEpisodes(supabase, user.id, day);

  const { data: link } = await supabase.storage.from("briefings").createSignedUrl(path, 60 * 60);
  return Response.json(
    { episode: { day, script: script.text, duration: episode.duration_seconds, url: link?.signedUrl } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Remove episodes (rows and audio files) older than KEEP_DAYS.
async function deleteOldEpisodes(supabase: Awaited<ReturnType<typeof supabaseServer>>, userId: string, today: string) {
  const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const { data: old } = await supabase
    .from("briefings")
    .select("id, audio_path")
    .eq("user_id", userId)
    .lt("day", cutoff);
  if (!old?.length) return;
  await supabase.storage.from("briefings").remove(old.map((o) => o.audio_path));
  await supabase
    .from("briefings")
    .delete()
    .in(
      "id",
      old.map((o) => o.id),
    );
}
