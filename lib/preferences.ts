"use client";

import { useSyncExternalStore } from "react";
import type { TopicId } from "./topics";

// Everything a person chooses during sign-up. For now it's saved in the
// browser (localStorage); step 4 moves it to Supabase so it follows the
// account. Only this file needs to change for that swap.
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

const KEY = "morningdesk:preferences:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: Preferences | null = null;

function read(): Preferences | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : null;
    } catch {
      cachedValue = null;
    }
  }
  return cachedValue;
}

export function savePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage blocked (private window); preferences just won't persist.
  }
  listeners.forEach((l) => l());
}

export function clearPreferences() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Returns the saved preferences, null if the person hasn't signed up yet,
// or undefined while the page is still loading in the browser.
export function usePreferences(): Preferences | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
