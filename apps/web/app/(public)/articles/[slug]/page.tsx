import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteNav } from "@/components/landing/site-nav";
import { Footer } from "@/components/landing/footer";
import { FloatingContact } from "@/components/landing/floating-contact";
import { Button } from "@/components/ui/button";
import { articleNutrition, articleProgramming, articleRecovery } from "@/lib/imagery";
import { getSection } from "@/lib/cms";
import { asLocale } from "@/lib/i18n-helpers";
import type { Locale } from "@/types/cms";

type Slug = "programming" | "nutrition" | "recovery";

const COVERS: Record<Slug, { src: string; alt: { ar: string; en: string } }> = {
  programming: { src: articleProgramming.src, alt: articleProgramming.alt },
  nutrition: { src: articleNutrition.src, alt: articleNutrition.alt },
  recovery: { src: articleRecovery.src, alt: articleRecovery.alt },
};

const VALID: Slug[] = ["programming", "nutrition", "recovery"];

export function generateStaticParams() {
  return VALID.map((slug) => ({ slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  if (!VALID.includes(slug as Slug)) notFound();
  const s = slug as Slug;

  const [locale, footer] = await Promise.all([getLocale(), getSection("footer")]);
  const loc = asLocale(locale);
  const t = await getTranslations(`landing.articles.posts.${s}`);
  const ta = await getTranslations("landing.articles");

  const cover = COVERS[s];

  return (
    <>
      <SiteNav locale={loc as Locale} />

      <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <Link
          href="/articles"
          className="inline-block font-mono text-text-3 text-[11px] uppercase tracking-[0.32em] hover:text-text-1"
        >
          {ta("backHome")}
        </Link>

        <header className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-accent text-[10px] uppercase tracking-[0.22em]">
              {t("tag")}
            </span>
            <span className="font-mono text-text-3 text-[10px] uppercase tracking-widest">
              {t("minutes")} {ta("minutes")}
            </span>
          </div>
          <h1 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold leading-tight">
            {t("title")}
          </h1>
          <p className="text-text-2 text-base sm:text-lg">{t("excerpt")}</p>
        </header>

        <div className="mt-10 relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface-high">
          <Image
            src={cover.src}
            alt={cover.alt[loc]}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover [filter:grayscale(15%)_contrast(1.05)_brightness(0.8)]"
          />
        </div>

        <div className="mt-10 space-y-6 text-text-1 text-base sm:text-lg leading-relaxed">
          <p>{t("body")}</p>
        </div>

        <div className="mt-14 rounded-2xl border border-accent/40 bg-gradient-to-br from-surface-high via-bg to-bg p-8 text-center">
          <p className="font-display text-text-1 text-xl sm:text-2xl">
            {loc === "ar"
              ? "عايز خطة بنفس المنطق ده؟"
              : "Want a plan built on the same logic?"}
          </p>
          <Link href="/login" className="mt-5 inline-block">
            <Button variant="accent" size="md">
              {loc === "ar" ? "احجز مكالمة" : "Book a call"}
            </Button>
          </Link>
        </div>
      </article>

      <Footer content={footer} locale={locale} />
      <FloatingContact locale={loc as Locale} />
    </>
  );
}
