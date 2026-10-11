"use client";

import { useSyncExternalStore } from "react";

// The current time in the browser, updated every minute. Returns null while
// the page is first rendered on the server, which doesn't know your clock.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}

const minute = () => Math.floor(Date.now() / 60_000) * 60_000;

export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, minute, () => 0);
  return ms ? new Date(ms) : null;
}
