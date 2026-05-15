"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { ValuePropsContent } from "@/types/cms";

type ValuePropsProps = {
  content: ValuePropsContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function ValueProps({ content, locale }: ValuePropsProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);
  const title = t(content.title, loc);
  if (!title) return null;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32" id="value-props">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
          <h2 className="mt-3 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold">
            {title}
          </h2>
          {content.description ? (
            <p className="mt-4 text-text-2 text-base sm:text-lg">{t(content.description, loc)}</p>
          ) : null}
        </motion.div>

        <motion.ul
          className="grid gap-6 sm:gap-8 md:grid-cols-3"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.items.map((item, i) => (
            <motion.li
              key={i}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl border border-border bg-bg p-6 sm:p-8"
            >
              <span
                aria-hidden
                className="absolute -top-6 inline-end-4 font-display text-[80px] font-extrabold leading-none text-accent/10"
              >
                0{i + 1}
              </span>
              <h3 className="relative font-display text-text-1 text-xl sm:text-2xl font-bold">
                {t(item.title, loc)}
              </h3>
              {item.description ? (
                <p className="relative mt-3 text-text-2 text-sm sm:text-base">
                  {t(item.description, loc)}
                </p>
              ) : null}
            </motion.li>
          ))}
        </motion.ul>

        {content.ctaUrl && content.ctaText ? (
          <div className="mt-10">
            <Link
              href={content.ctaUrl}
              className="group inline-flex items-center gap-2 font-mono text-accent text-xs uppercase tracking-[0.28em] hover:underline"
            >
              <span>{t(content.ctaText, loc)}</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                →
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
