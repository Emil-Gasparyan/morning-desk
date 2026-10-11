"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Shows today's date in the visitor's own time zone. It runs in the browser
// because the server (on Vercel) uses UTC and doesn't know where you are.
export function Today() {
  const label = useSyncExternalStore(subscribe, formatToday, () => "");
  return <span>{label || " "}</span>;
}
