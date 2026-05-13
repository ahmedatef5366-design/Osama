"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/types/cms";

type Props = {
  currentLocale: Locale;
};

/**
 * Writes the chosen locale to a `locale` cookie (read by i18n/request.ts on
 * the next request) and re-renders the route tree. Doesn't need a server
 * action because the cookie is set client-side and the refresh picks it up.
 */
export function LanguageSwitcher({ currentLocale }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setLocale(loc: Locale) {
    if (loc === currentLocale || pending) return;
    document.cookie = `locale=${loc}; path=/; max-age=${60 * 60 * 24 * 365}`;
    start(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-bg p-1 text-xs">
      {(["ar", "en"] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={loc === currentLocale}
          className={
            loc === currentLocale
              ? "rounded-sm bg-accent px-2 py-1 font-medium text-bg"
              : "rounded-sm px-2 py-1 text-text-2 hover:text-text-1"
          }
        >
          {loc === "ar" ? "العربية" : "English"}
        </button>
      ))}
    </div>
  );
}
