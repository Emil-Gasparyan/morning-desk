"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "./supabase/client";

export { DEFAULT_PREFERENCES, VOICES, type Preferences, type VoiceId } from "./preference-defaults";
import { DEFAULT_PREFERENCES, type Preferences } from "./preference-defaults";

// Where the person stands:
// - loading: still checking whether they're signed in
// - signed-out: not signed in; `pending` holds choices made during sign-up,
//   kept in this browser until the email link is clicked
// - signed-in: `prefs` comes from their Supabase profile (null = not set up yet)
export type Account =
  | { status: "loading" }
  | { status: "signed-out"; pending: Preferences | null }
  | { status: "signed-in"; userId: string; email: string; prefs: Preferences | null };

const LOADING: Account = { status: "loading" };
const PENDING_KEY = "morningdesk:pending-preferences:v1";

let state: Account = LOADING;
let started = false;
const listeners = new Set<() => void>();

function set(next: Account) {
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  supabase().auth.onAuthStateChange((_event, session) => {
    // Supabase advises not to call it again inside this callback, so defer.
    setTimeout(() => {
      if (!session) {
        set({ status: "signed-out", pending: readPending() });
      } else if (state.status !== "signed-in" || state.userId !== session.user.id) {
        void loadProfile(session.user.id, session.user.email ?? "");
      }
    }, 0);
  });
}

async function loadProfile(userId: string, email: string) {
  const { data, error } = await supabase()
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  let prefs: Preferences | null = data ? { ...DEFAULT_PREFERENCES, ...data.preferences } : null;

  // First sign-in after sign-up: save the choices they made before the email link.
  const pending = readPending();
  if (!error && !prefs && pending) {
    const saved = await supabase().from("profiles").insert({ id: userId, preferences: pending });
    if (!saved.error) {
      prefs = pending;
      writePending(null);
    }
  }

  set({ status: "signed-in", userId, email, prefs });
}

// Save preferences: to the profile when signed in, otherwise in this browser
// until sign-in finishes. Returns an error message if saving failed.
export async function savePreferences(prefs: Preferences): Promise<string | null> {
  if (state.status === "signed-in") {
    const { error } = await supabase()
      .from("profiles")
      .upsert({ id: state.userId, preferences: prefs });
    if (error) return "Couldn't save your preferences. Please try again.";
    set({ ...state, prefs });
    return null;
  }
  writePending(prefs);
  set({ status: "signed-out", pending: prefs });
  return null;
}

// Delete the person's preferences so they can set up again.
export async function clearPreferences(): Promise<string | null> {
  writePending(null);
  if (state.status === "signed-in") {
    const { error } = await supabase().from("profiles").delete().eq("id", state.userId);
    if (error) return "Couldn't reset your preferences. Please try again.";
    set({ ...state, prefs: null });
  }
  return null;
}

// Email a sign-in link. `next` is where to land after clicking it.
export async function sendSignInLink(email: string, next = "/briefing"): Promise<string | null> {
  const redirect = new URL("/auth/callback", window.location.origin);
  redirect.searchParams.set("next", next);
  const { error } = await supabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirect.toString() },
  });
  if (!error) return null;
  if (error.status === 429) return "Too many sign-in emails. Please wait a few minutes and try again.";
  return error.message || "Couldn't send the email. Please try again.";
}

// Sign in with the code from the email instead of the link. Works in any
// browser or app, unlike the link, which must be opened where it was requested.
export async function verifySignInCode(email: string, code: string): Promise<string | null> {
  const { error } = await supabase().auth.verifyOtp({ email, token: code, type: "email" });
  if (!error) return null;
  if (error.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  return "That code didn't work. Check it, or request a new email.";
}

export async function signOut() {
  await supabase().auth.signOut();
  writePending(null);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAccount(): Account {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

function readPending(): Preferences | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function writePending(prefs: Preferences | null) {
  try {
    if (prefs) localStorage.setItem(PENDING_KEY, JSON.stringify(prefs));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage blocked (private window): choices just won't carry over.
  }
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
