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

// Flash is ElevenLabs' fast, lower-cost model. Set ELEVENLABS_MODEL to
// "eleven_multilingual_v2" for richer (and pricier) voices.
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";

// Small MP3 (22 kHz, 32 kbps): clear enough for speech and keeps a
// 10-minute briefing around 2.4 MB.
const FORMAT = "mp3_22050_32";

export class SpeechError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function speak(text: string, voice: VoiceId): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new SpeechError("Text-to-speech isn't set up yet (missing ELEVENLABS_API_KEY).", 503);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice] ?? VOICE_IDS.warm}?output_format=${FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`ElevenLabs ${res.status}: ${detail.slice(0, 500)}`);
    if (res.status === 401) throw new SpeechError("The ElevenLabs API key was rejected.", 502);
    if (res.status === 429 || /quota|credits/i.test(detail)) {
      throw new SpeechError("Out of ElevenLabs credits or too many requests. Try again later.", 429);
    }
    throw new SpeechError("The voice service couldn't record your briefing. Try again in a minute.", 502);
  }
  return res.arrayBuffer();
}
