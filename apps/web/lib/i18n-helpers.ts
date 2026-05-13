/**
 * Helpers that bridge the CMS's `Localized` payloads with next-intl's
 * locale lookup. Keeping this thin means components stay focused on
 * presentation and not "is this Arabic or English right now?".
 */
import type { Locale, Localized } from "@/types/cms";

/**
 * Pick the right string from a Localized object. Falls back through:
 *   1. requested locale
 *   2. English
 *   3. any non-empty value
 *   4. empty string
 *
 * Never throws. Safe to use inside Server Components that read CMS payloads
 * authored by humans (so missing or empty fields are expected).
 */
export function t(localized: Localized | undefined, locale: Locale | string): string {
  if (!localized) return "";
  const wanted = locale as Locale;
  const picked = localized[wanted];
  if (picked) return picked;
  if (localized.en) return localized.en;
  for (const k of Object.keys(localized) as Locale[]) {
    if (localized[k]) return localized[k];
  }
  return "";
}

/** Narrow a string into our Locale union, falling back to ar. */
export function asLocale(s: string | undefined): Locale {
  return s === "en" ? "en" : "ar";
}
