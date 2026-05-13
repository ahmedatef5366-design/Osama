import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

function isLocale(value: string | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export default getRequestConfig(async () => {
  const stored = cookies().get("locale")?.value;
  const locale: Locale = isLocale(stored) ? stored : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
