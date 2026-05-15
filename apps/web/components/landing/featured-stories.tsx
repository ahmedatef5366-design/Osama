"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FeaturedStoriesContent } from "@/types/cms";

type FeaturedStoriesProps = {
  content: FeaturedStoriesContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Long-form transformation stories. Cards alternate image side on desktop
 * so the page reads like a stacked editorial layout rather than a grid.
 */
export function FeaturedStories({ content, locale }: FeaturedStoriesProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);
  const title = t(content.title, loc);
  if (!title) return null;

  return (
    <section className="bg-bg py-24 sm:py-32" id="featured-stories">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-12 sm:mb-16 max-w-3xl"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {content.eyebrow ? (
            <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
              {t(content.eyebrow, loc)}
            </span>
          ) : null}
          <h2 className="mt-3 font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
            {title}
          </h2>
          {content.subtitle ? (
            <p className="mt-4 text-text-2 text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </motion.div>

        <div className="space-y-12 sm:space-y-16">
          {content.items.map((item, i) => {
            const reversed = i % 2 === 1;
            return (
              <motion.article
                key={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className={
                  "grid items-center gap-6 rounded-3xl border border-border bg-surface p-4 sm:gap-10 sm:p-6 md:grid-cols-2 " +
                  (reversed ? "md:[&>*:first-child]:order-2" : "")
                }
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-high">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-2 sm:p-4">
                  {item.badge ? (
                    <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 font-mono text-accent text-[11px] uppercase tracking-[0.22em]">
                      {t(item.badge, loc)}
                    </span>
                  ) : null}
                  <h3 className="mt-4 font-display text-text-1 text-3xl sm:text-4xl font-bold">
                    {item.name}
                  </h3>
                  <p className="mt-4 text-text-2 text-base sm:text-lg leading-relaxed">
                    {t(item.body, loc)}
                  </p>
                  {item.ctaUrl && item.ctaText ? (
                    <Link
                      href={item.ctaUrl}
                      className="group mt-6 inline-flex items-center gap-2 font-mono text-accent text-xs uppercase tracking-[0.28em] hover:underline"
                    >
                      <span>{t(item.ctaText, loc)}</span>
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  ) : null}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
