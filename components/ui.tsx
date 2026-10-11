import Link from "next/link";
import type { ComponentProps } from "react";

// Small shared building blocks so every page looks the same.

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="relative grid size-7 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm shadow-orange-500/30">
        <span className="absolute bottom-1 h-3 w-5 rounded-t-full bg-white/90" />
      </span>
      <span>Morning Desk</span>
    </Link>
  );
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary:
    "bg-zinc-900 px-5 py-2.5 text-white shadow-sm hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
  brand:
    "bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-white shadow-md shadow-orange-500/25 hover:brightness-110",
  ghost:
    "px-4 py-2.5 text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
  outline:
    "border border-zinc-900/10 bg-white px-5 py-2.5 text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-zinc-900/[.07] bg-white shadow-sm shadow-zinc-900/[.03] dark:border-white/10 dark:bg-white/[.04] ${className}`}
      {...props}
    />
  );
}

export function Chip({
  selected,
  className = "",
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
        selected
          ? "border-orange-500 bg-orange-50 font-medium text-orange-900 dark:border-orange-400 dark:bg-orange-400/15 dark:text-orange-100"
          : "border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/25 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/30"
      } ${className}`}
      {...props}
    />
  );
}
