import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Classname merge utility. clsx handles conditionals, tailwind-merge
 * resolves conflicting Tailwind classes (e.g. `px-2 px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with locale-aware grouping. */
export function fmtNumber(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(n);
}

/** Format a YYYY-MM-DD date string for display in the current locale. */
export function fmtDate(iso: string | null | undefined, locale = "en-US"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
