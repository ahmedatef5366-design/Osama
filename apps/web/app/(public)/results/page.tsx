import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteNav } from "@/components/landing/site-nav";
import { Footer } from "@/components/landing/footer";
import { FloatingContact } from "@/components/landing/floating-contact";
import { resultsHero } from "@/lib/imagery";
import { getSection } from "@/lib/cms";
import { t as tt, asLocale } from "@/lib/i18n-helpers";
import type { Locale } from "@/types/cms";

export default async function ResultsPage() {
  const [locale, transformations, footer] = await Promise.all([
    getLocale(),
    getSection("transformations"),
    getSection("footer"),
  ]);
  const loc = asLocale(locale);
  const t = await getTranslations("landing.results");

  return (
    <>
      <SiteNav locale={loc as Locale} />

      <header className="relative isolate overflow-hidden bg-mesh">
        <Image
          src={resultsHero.src}
          alt={resultsHero.alt[loc]}
          fill
          priority
          sizes="100vw"
          className="object-cover [filter:grayscale(20%)_contrast(1.05)_brightness(0.45)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/60 to-bg" />

        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
          <Link
            href="/"
            className="inline-block font-mono text-text-3 text-[11px] uppercase tracking-[0.32em] hover:text-text-1"
          >
            {t("backHome")}
          </Link>
          <span className="mt-6 block font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
            {t("eyebrow")}
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-text-1 text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-text-2 text-base sm:text-lg">
            {t("subtitle")}
          </p>

          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            <SummaryStat value={t("summary.totalClients")} />
            <SummaryStat value={t("summary.averageWeeks")} />
            <SummaryStat value={t("summary.successRate")} />
          </dl>
        </div>
      </header>

      <section className="bg-bg py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          {!transformations.visible || transformations.items.length === 0 ? (
            <p className="text-text-2 text-base">
              {loc === "ar" ? "لا توجد قصص متاحة بعد." : "No stories available yet."}
            </p>
          ) : (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {transformations.items.map((item, i) => (
                <li key={i}>
                  <article className="space-y-4 rounded-xl border border-border bg-surface p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Frame
                        src={item.beforeImg}
                        alt={`${item.clientName ?? "client"} before`}
                        label="before"
                      />
                      <Frame
                        src={item.afterImg}
                        alt={`${item.clientName ?? "client"} after`}
                        label="after"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        {item.clientName ? (
                          <p className="font-display text-text-1 text-lg leading-tight">
                            {item.clientName}
                          </p>
                        ) : null}
                        {item.summary ? (
                          <p className="mt-1 text-text-2 text-sm">
                            {tt(item.summary, loc)}
                          </p>
                        ) : null}
                      </div>
                      {typeof item.weeks === "number" ? (
                        <span className="font-mono text-accent text-sm tabular-nums">
                          {item.weeks} {t("weeks")}
                        </span>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Footer content={footer} locale={locale} />
      <FloatingContact locale={loc as Locale} />
    </>
  );
}

function SummaryStat({ value }: { value: string }) {
  return (
    <div className="bg-bg/90 p-5">
      <dt className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
        {value.split(" ").slice(1).join(" ") || "—"}
      </dt>
      <dd className="mt-2 font-display text-accent text-2xl tabular-nums">
        {value.split(" ")[0]}
      </dd>
    </div>
  );
}

function Frame({ src, alt, label }: { src?: string; alt: string; label: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface-high">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-text-3 text-xs uppercase tracking-widest">
          {label}
        </div>
      )}
    </div>
  );
}
