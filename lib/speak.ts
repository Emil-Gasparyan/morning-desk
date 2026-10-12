import type { VoiceId } from "./preference-defaults";

// Text-to-speech with ElevenLabs. Server only: uses the secret API key.

// ElevenLabs voices behind each of our voice styles. Override with
// ELEVENLABS_VOICE_WARM / _CRISP / _CALM to try other voices. These are
// ElevenLabs default voices, which free plans can use through the API;
// "library" voices (e.g. Rachel) need a paid plan.
const VOICE_IDS: Record<VoiceId, string> = {
  warm: process.env.ELEVENLABS_VOICE_WARM || "JBFqnCBsd6RMkjVDRZzb", // George
  crisp: process.env.ELEVENLABS_VOICE_CRISP || "onwK4e9ZLuTAKqWW03F9", // Daniel
  calm: process.env.ELEVENLABS_VOICE_CALM || "EXAVITQu4vr4xnSDxMaL", // Sarah
};

// Multilingual v2 is ElevenLabs' most natural narrator model (about twice
// Flash's credits). Set ELEVENLABS_MODEL=eleven_flash_v2_5 for a cheaper,
// more robotic voice.
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

// 64 kbps MP3: clear for speech, about 0.5 MB per minute.
export const FORMAT = "mp3_44100_64";
export const BITRATE = 64_000;

// Keep each request well under the model's 10,000-character limit.
const CHUNK_CHARS = 4000;

export class SpeechError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function speak(text: string, voice: VoiceId): Promise<Uint8Array> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new SpeechError("Text-to-speech isn't set up yet (missing ELEVENLABS_API_KEY).", 503);

  const chunks = splitText(text);
  const parts: Uint8Array[] = [];

  // Record piece by piece, telling ElevenLabs what comes before and after so
  // the tone flows across the joins. MP3 pieces can simply be joined.
  for (let i = 0; i < chunks.length; i++) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice] ?? VOICE_IDS.warm}?output_format=${FORMAT}`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text: chunks[i],
          model_id: MODEL,
          previous_text: chunks[i - 1]?.slice(-500),
          next_text: chunks[i + 1]?.slice(0, 500),
        }),
      },
    );
    if (!res.ok) throw await speechError(res);
    parts.push(new Uint8Array(await res.arrayBuffer()));
  }

  const audio = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    audio.set(p, offset);
    offset += p.length;
  }
  return audio;
}

// Split at paragraph breaks into pieces of at most CHUNK_CHARS.
function splitText(text: string) {
  const chunks: string[] = [];
  let current = "";
  for (const para of text.split("\n\n")) {
    if (current && current.length + para.length + 2 > CHUNK_CHARS) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function speechError(res: Response) {
  const detail = await res.text().catch(() => "");
  console.error(`ElevenLabs ${res.status}: ${detail.slice(0, 500)}`);
  if (res.status === 401) return new SpeechError("The ElevenLabs API key was rejected.", 502);
  if (res.status === 429 || /quota|credits/i.test(detail)) {
    return new SpeechError("Out of ElevenLabs credits or too many requests. Try again later.", 429);
  }
  return new SpeechError("The voice service couldn't record your briefing. Try again in a minute.", 502);
}
