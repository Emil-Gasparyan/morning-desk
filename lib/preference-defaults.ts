import type { TopicId } from "./topics";

// Preference types and defaults, shared by the browser and the server.
// (lib/preferences.ts is browser-only, so server code imports from here.)

// Everything a person chooses during sign-up.
export type Preferences = {
  name: string;
  topics: TopicId[];
  sources: string[]; // domains, e.g. "bbc.com"
  onlyMySources: boolean;
  listenTime: string; // "07:30", in the person's own time zone
  days: number[]; // 0 = Sunday … 6 = Saturday
  timeZone: string;
  voice: VoiceId;
  length: 3 | 5 | 10; // minutes
};

export const VOICES = [
  { id: "warm", name: "Warm", description: "Relaxed, like a morning radio host" },
  { id: "crisp", name: "Crisp", description: "Clear and quick, straight to the point" },
  { id: "calm", name: "Calm", description: "Slow and soft, easy on early ears" },
] as const;

export type VoiceId = (typeof VOICES)[number]["id"];

export const DEFAULT_PREFERENCES: Preferences = {
  name: "",
  topics: ["TOP", "WORLD", "TECHNOLOGY"],
  sources: [],
  onlyMySources: false,
  listenTime: "07:00",
  days: [1, 2, 3, 4, 5],
  timeZone: "UTC",
  voice: "warm",
  length: 5,
};
