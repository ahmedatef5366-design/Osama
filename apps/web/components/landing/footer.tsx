import Link from "next/link";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { NewsletterForm } from "@/components/landing/newsletter-form";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FooterContent } from "@/types/cms";

type FooterProps = {
  content: FooterContent;
  locale: string;
};

/**
 * 4-column footer. First column is the brand + tagline + newsletter; the
 * other three are link columns (site / legal / contact). Below that, a
 * thin row with copyright + locale switcher + social icons.
 */
export function Footer({ content, locale }: FooterProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-10 sm:grid-cols-4">
          <section className="sm:col-span-1">
            <p className="font-display text-text-1 text-2xl font-extrabold">Osama</p>
            <p className="mt-2 max-w-xs text-text-2 text-sm">{t(content.tagline, loc)}</p>
            {content.newsletter ? (
              <NewsletterForm
                placeholder={t(content.newsletter.placeholder, loc)}
                cta={t(content.newsletter.cta, loc)}
              />
            ) : null}
          </section>

          {content.columns.map((col, i) => (
            <section key={i}>
              <h3 className="mb-4 text-text-2 text-xs uppercase tracking-[0.18em]">
                {t(col.title, loc)}
              </h3>
              <ul className="space-y-2 text-sm">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <Link
                      href={l.href}
                      className="text-text-1 transition-colors hover:text-accent"
                    >
                      {t(l.label, loc)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-text-3 text-xs">
            © {year} · {t(content.copyright, loc)}
          </p>
          <div className="flex items-center gap-4">
            {content.social?.map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-2 transition-colors hover:text-text-1"
              >
                {s.label}
              </a>
            )) ?? null}
            <LanguageSwitcher currentLocale={loc} />
          </div>
        </div>
      </div>
    </footer>
  );
}
