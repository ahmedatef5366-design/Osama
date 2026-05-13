import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteNav } from "@/components/landing/site-nav";
import { Footer } from "@/components/landing/footer";
import { FloatingContact } from "@/components/landing/floating-contact";
import { articleNutrition, articleProgramming, articleRecovery } from "@/lib/imagery";
import { getSection } from "@/lib/cms";
import { asLocale } from "@/lib/i18n-helpers";
import type { Locale } from "@/types/cms";

type Slug = "programming" | "nutrition" | "recovery";

const POSTS: { slug: Slug; cover: string; alt: { ar: string; en: string } }[] = [
  { slug: "programming", cover: articleProgramming.src, alt: articleProgramming.alt },
  { slug: "nutrition", cover: articleNutrition.src, alt: articleNutrition.alt },
  { slug: "recovery", cover: articleRecovery.src, alt: articleRecovery.alt },
];

export default async function ArticlesPage() {
  const [locale, footer] = await Promise.all([getLocale(), getSection("footer")]);
  const loc = asLocale(locale);
  const t = await getTranslations("landing.articles");

  return (
    <>
      <SiteNav locale={loc as Locale} />

      <header className="bg-mesh py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-6">
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
        </div>
      </header>

      <section className="bg-bg py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <ul className="grid gap-6 md:grid-cols-3">
            {POSTS.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/articles/${post.slug}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-high">
                    <Image
                      src={post.cover}
                      alt={post.alt[loc]}
                      fill
                      sizes="(min-width: 768px) 32vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 [filter:grayscale(20%)_contrast(1.05)_brightness(0.7)]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-accent text-[10px] uppercase tracking-[0.22em]">
                        {t(`posts.${post.slug}.tag`)}
                      </span>
                      <span className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
                        {t(`posts.${post.slug}.minutes`)} {t("minutes")}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-text-1 text-2xl leading-tight">
                      {t(`posts.${post.slug}.title`)}
                    </h2>
                    <p className="mt-3 text-text-2 text-sm leading-relaxed">
                      {t(`posts.${post.slug}.excerpt`)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-accent text-xs uppercase tracking-[0.2em]">
                      {t("readMore")}
                      <span className="h-px w-6 bg-accent transition-all duration-300 group-hover:w-10" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer content={footer} locale={locale} />
      <FloatingContact locale={loc as Locale} />
    </>
  );
}
