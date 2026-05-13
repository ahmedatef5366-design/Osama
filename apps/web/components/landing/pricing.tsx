import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { PricingContent } from "@/types/cms";

type PricingProps = {
  content: PricingContent;
  locale: string;
};

/**
 * 3-tier pricing table with the middle tier visually elevated. The whole
 * section is conditionally rendered — when the admin sets `visible: false`,
 * the marketing site reads "by application only". That's intentional: the
 * coach may not always want to surface prices.
 */
export function Pricing({ content, locale }: PricingProps) {
  if (!content.visible || content.tiers.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-surface py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
            {t(content.title, loc)}
          </h2>
          {content.subtitle ? (
            <p className="mx-auto mt-3 max-w-xl text-text-2 text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-3 sm:items-stretch">
          {content.tiers.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "flex h-full flex-col rounded-lg border bg-bg p-6 transition",
                tier.featured
                  ? "border-accent shadow-[0_0_32px_-12px_var(--accent-glow)] sm:-translate-y-2"
                  : "border-border hover:border-border-hover",
              )}
            >
              <header className="space-y-2">
                <h3 className="font-display text-text-1 text-2xl font-bold">
                  {t(tier.name, loc)}
                </h3>
                <p className="font-mono text-accent text-3xl tabular-nums">
                  {t(tier.price, loc)}
                </p>
              </header>

              <ul className="mt-6 space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 inline-block size-4 rounded-full",
                        f.included ? "bg-accent" : "bg-border",
                      )}
                    />
                    <span className={f.included ? "text-text-1" : "text-text-3 line-through"}>
                      {t(f.label, loc)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 sm:mt-auto">
                <Link href="/login">
                  <Button variant={tier.featured ? "accent" : "ghost"} size="md" className="w-full">
                    {locale === "ar" ? "اختر هذا" : "Choose this"}
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
